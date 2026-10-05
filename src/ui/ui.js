import * as THREE from 'three';
import { LEVELS } from '../levels.js';
import { COPY, levelName } from '../copy.js';
import { MAX_LIVES } from '../gameState.js';
import { journeyMap } from './journeyMap.js';

// Tiny DOM builder: el('p', { class: 'sub' }, 'text', child, ...).
function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c != null) node.append(c);
  }
  return node;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

function svg(viewBox, markup, cls = '') {
  const s = document.createElementNS(SVG_NS, 'svg');
  s.setAttribute('viewBox', viewBox);
  s.setAttribute('aria-hidden', 'true');
  if (cls) s.setAttribute('class', cls);
  s.innerHTML = markup;
  return s;
}

const HEART_PATH = 'M12 21s-7.5-4.6-10-9.3C.3 8.4 2.2 4 6.2 4c2.3 0 4 1.3 5.8 3.4C13.8 5.3 15.5 4 17.8 4c4 0 5.9 4.4 4.2 7.7C19.5 16.4 12 21 12 21z';

function heart(full) {
  return svg('0 0 24 24', `<path d="${HEART_PATH}" class="${full ? 'heart-full' : 'heart-empty'}"/>`);
}

// Chalk doodles for the how-to-play board.
const HOWTO_ICONS = {
  keys: () =>
    svg(
      '0 0 64 48',
      '<rect x="24" y="4" width="16" height="16" rx="3"/><rect x="6" y="26" width="16" height="16" rx="3"/>' +
        '<rect x="24" y="26" width="16" height="16" rx="3"/><rect x="42" y="26" width="16" height="16" rx="3"/>' +
        '<path d="M32 15v-6m-3 3 3-3 3 3"/>',
    ),
  bowl: () =>
    svg(
      '0 0 64 48',
      '<path d="M8 22h48c-2 12-12 20-24 20S10 34 8 22z"/><path d="M14 22c4-4 10-6 18-6s14 2 18 6"/>' +
        '<path d="M22 12c0-4 4-4 4-8M32 12c0-4 4-4 4-8"/><path d="M50 30l8 12-5-1-2 5z"/>',
    ),
  zone: () => svg('0 0 64 48', '<ellipse cx="32" cy="34" rx="26" ry="10"/><path d="M32 4v18m-6-6 6 6 6-6"/>', 'zone'),
  stick: () => svg('0 0 64 48', '<circle cx="32" cy="24" r="19"/><circle cx="40" cy="20" r="8"/><path d="M12 24h-6m52 0h-6M32 4v-3"/>'),
  'key-m': () => svg('0 0 64 48', '<rect x="18" y="8" width="28" height="28" rx="4"/><path d="M25 29V16l7 8 7-8v13"/>'),
};

// All HTML on top of the 3D canvas: HUD, world-anchored bars and popups,
// the home screen and result boards, and the fade between them.
export class UI {
  constructor(root, stage) {
    this.root = root;
    this.stage = stage;
    this.muted = false;
    this.quality = 'high';
    this.world = el('div', { class: 'world' });
    this.hudLayer = el('div');
    this.screenLayer = el('div');
    this.fadeLayer = el('div', { class: 'fade' });
    this.muteLabel = el('div', { class: 'mute' });
    this.stickKnob = el('div', { class: 'knob' });
    this.stick = el(
      'div',
      { class: 'joystick', hidden: '' },
      svg('0 0 120 120', '<path d="M60 12l-8 9h16zM60 108l-8-9h16zM12 60l9-8v16zM108 60l-9-8v16z"/>'),
      this.stickKnob,
    );
    this.rotateHint = el(
      'div',
      { class: 'rotate', hidden: '' },
      el(
        'div',
        { class: 'chalkboard board' },
        svg(
          '0 0 96 96',
          '<rect x="34" y="14" width="28" height="48" rx="5"/><path d="M44 56h8"/>' +
            '<path d="M18 70c6 12 20 18 34 16"/><path d="M48 80l6 6-7 4"/>',
        ),
        el('h2', {}, COPY.rotate),
      ),
    );
    root.append(this.world, this.hudLayer, this.stick, this.screenLayer, this.muteLabel, this.rotateHint, this.fadeLayer);
    this.bars = new Map();

    // Enter always presses the main button of the board on screen, even after
    // a click elsewhere (say, to switch the sound on) took focus away from it.
    window.addEventListener('keydown', (e) => {
      if (e.code !== 'Enter' && e.code !== 'NumpadEnter') return;
      if (!this.primary || document.activeElement instanceof HTMLButtonElement) return;
      e.preventDefault();
      this.primary.click();
    });
  }

  // ----- transitions -----

  // Fades to black, runs `swap` while hidden, then fades back in.
  fade(swap) {
    if (this.fading) return;
    this.fading = true;
    this.fadeLayer.classList.add('on');
    setTimeout(() => {
      swap();
      this.fadeLayer.classList.remove('on');
      this.fading = false;
    }, 360);
  }

  setMuted(muted) {
    this.muted = muted;
    this.muteLabel.textContent = muted ? COPY.muted : '';
    if (this.soundItem?.isConnected) {
      const next = this.soundButton(!muted);
      this.soundItem.replaceWith(next);
      this.soundItem = next;
    }
  }

  // ----- HUD -----

  // `onPause` runs when the ⏸ sign is pressed.
  showHud(levelIndex, level, { onPause } = {}) {
    this.clearWorld();
    this.scoreText = el('span');
    this.scoreFill = el('div');
    this.hearts = el('div', { class: 'chalkboard plate hearts', 'aria-label': COPY.hud.lives });
    this.hudLayer.replaceChildren(
      el(
        'div',
        { class: 'hud' },
        el(
          'div',
          { class: 'chalkboard plate' },
          el('span', { class: 'label' }, `${COPY.hud.score}:`),
          this.scoreText,
          el('div', { class: 'score-bar' }, this.scoreFill),
        ),
        el('div', { class: 'sign level-sign' }, `${COPY.hud.level(levelIndex)} · ${levelName(levelIndex)}`),
        el(
          'div',
          { class: 'hud-right' },
          this.hearts,
          this.button('sign-btn pause-btn', svg('0 0 24 24', '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>'), () => onPause?.(), {
            once: false,
            label: COPY.pause.button,
          }),
        ),
      ),
    );
    this.target = level.targetScore;
  }

  hideHud() {
    this.hudLayer.replaceChildren();
    this.clearWorld();
  }

  setScore(score) {
    this.scoreText.textContent = `${score}/${this.target}`;
    this.scoreFill.style.width = `${Math.min(100, (score / this.target) * 100)}%`;
  }

  setLives(lives, { lost = false } = {}) {
    this.hearts.replaceChildren(
      ...Array.from({ length: MAX_LIVES }, (_, i) => {
        const h = heart(i < lives);
        if (lost && i === lives) h.classList.add('lost');
        return h;
      }),
    );
  }

  showIntro(levelIndex) {
    const card = el(
      'div',
      { class: 'intro' },
      el('div', { class: 'sign' }, COPY.intro(levelIndex)),
      el('div', { class: 'chalkboard' }, COPY.introSub),
    );
    card.addEventListener('animationend', () => card.remove());
    this.world.append(card);
  }

  banner(text) {
    this.world.append(el('div', { class: 'banner' }, text));
  }

  // A phone held upright gets a board asking to turn it sideways.
  setRotateHint(show) {
    this.rotateHint.hidden = !show;
  }

  // ----- touch joystick -----

  // Drawn by TouchStick: where the thumb landed, and the knob's offset.
  showStick(x, y) {
    this.stick.style.left = `${x}px`;
    this.stick.style.top = `${y}px`;
    this.stick.hidden = false;
  }

  moveStick(dx, dy) {
    this.stickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  hideStick() {
    this.stick.hidden = true;
  }

  // ----- world-anchored -----

  clearWorld() {
    this.world.replaceChildren();
    this.bars.clear();
  }

  // Eating progress bars above dishes that are being eaten.
  updateBars(foods) {
    for (const food of foods) {
      let bar = this.bars.get(food);
      if (food.progress <= 0) {
        if (bar) bar.style.display = 'none';
        continue;
      }
      if (!bar) {
        bar = el('div', { class: 'eat-bar' }, el('div'));
        this.world.append(bar);
        this.bars.set(food, bar);
      }
      const p = this.stage.project(new THREE.Vector3(food.x, food.surfaceHeight + 0.75, food.z));
      bar.style.display = '';
      bar.style.left = `${p.x}px`;
      bar.style.top = `${p.y}px`;
      bar.firstChild.style.width = `${Math.min(100, food.progress * 100)}%`;
    }
  }

  popup(position, text, cls = '') {
    const p = this.stage.project(position);
    const node = el('div', { class: `popup ${cls}` }, text);
    node.style.left = `${p.x}px`;
    node.style.top = `${p.y}px`;
    node.addEventListener('animationend', () => node.remove());
    this.world.append(node);
  }

  // "Á đù!" / "Ui da!" over the fly when it gets hit.
  hitReaction(position) {
    this.popup(position, COPY.hit[Math.floor(Math.random() * COPY.hit.length)], 'hit');
  }

  // ----- screens -----

  showScreen(cls, ...children) {
    this.screenLayer.replaceChildren(el('div', { class: `screen ${cls}` }, ...children));
    // Focus the main action so Enter / Space trigger it.
    this.primary = this.screenLayer.querySelector('[data-primary]') ?? this.screenLayer.querySelector('button');
    this.primary?.focus();
  }

  hideScreen() {
    this.screenLayer.replaceChildren();
    this.primary = null;
    this.soundItem = null;
  }

  // A button that runs `onClick` once by default, so double clicks during a
  // fade can't start two games.
  button(cls, content, onClick, { primary = false, once = true, label } = {}) {
    let fired = false;
    const attrs = {
      class: cls,
      type: 'button',
      onclick: () => {
        if (once && fired) return;
        fired = true;
        onClick();
      },
    };
    if (primary) attrs['data-primary'] = '';
    if (label) {
      attrs['aria-label'] = label;
      attrs.title = label;
    }
    return el('button', attrs, ...[content].flat());
  }

  signButton(label, onClick, opts) {
    return this.button('sign-btn', label, onClick, opts);
  }

  // "Name ........ price" line on the chalkboard menu.
  menuItem([name, price], onClick, opts) {
    return this.button(
      'chalk-item',
      [el('span', {}, name), el('span', { class: 'dots' }), el('span', { class: 'price' }, price)],
      onClick,
      opts,
    );
  }

  soundButton(on) {
    return this.menuItem(COPY.menu.sound(on), () => this.onToggleSound?.(), { once: false });
  }

  // "Rung: Bật/Tắt", only where vibration works.
  vibrateButton() {
    if (!this.haptics?.available) return null;
    const item = this.menuItem(COPY.menu.vibrate(this.haptics.on()), () => {
      this.haptics.set(!this.haptics.on());
      item.replaceWith(this.vibrateButton());
    }, { once: false });
    return item;
  }

  qualityButton() {
    const item = this.menuItem(COPY.menu.quality(this.quality === 'high'), () => {
      this.quality = this.quality === 'high' ? 'low' : 'high';
      this.onQuality?.(this.quality);
      item.replaceWith(this.qualityButton());
    }, { once: false });
    return item;
  }

  titleSign() {
    return el(
      'div',
      { class: 'sign title-sign' },
      el('h1', {}, COPY.title),
      el('p', { class: 'slogan' }, COPY.slogan),
      el('div', { class: 'strip' }, COPY.signStrip),
    );
  }

  // The "Tạm nghỉ" board over a paused level.
  showPause({ onResume, onToggleSound, onHome }) {
    this.onToggleSound = onToggleSound;
    this.soundItem = this.soundButton(!this.muted);
    this.showScreen(
      'pause',
      el(
        'div',
        { class: 'chalkboard board' },
        el('h2', {}, COPY.pause.title),
        this.menuItem(COPY.pause.resume, onResume, { primary: true }),
        this.soundItem,
        this.vibrateButton(),
        this.menuItem(COPY.pause.home, onHome),
      ),
    );
  }

  showMenu({ onPlay, onToggleSound, onQuality, audioLocked, best, touch = () => false }) {
    this.menuOptions = { onPlay, onToggleSound, onQuality, audioLocked, best, touch };
    this.onToggleSound = onToggleSound;
    this.onQuality = onQuality;
    this.soundItem = this.soundButton(!this.muted);
    const hint = audioLocked() ? el('p', { class: 'hint' }, touch() ? COPY.audioHintTouch : COPY.audioHint) : null;
    this.showScreen(
      'home',
      this.titleSign(),
      el(
        'div',
        { class: 'chalkboard board' },
        el('h3', { class: 'chalk-title' }, COPY.menuTitle),
        this.menuItem(COPY.menu.play, onPlay, { primary: true }),
        this.menuItem(COPY.menu.howTo, () => this.showHowTo(), { once: false }),
        this.soundItem,
        this.vibrateButton(),
        this.qualityButton(),
        hint,
        el('div', { class: 'record' }, el('span', {}, `${COPY.best}:`), el('b', {}, String(best))),
      ),
    );
    this.menuHint = hint;
  }

  showHowTo() {
    this.showScreen(
      'home',
      el(
        'div',
        { class: 'chalkboard board' },
        el('h2', {}, COPY.howToTitle),
        el(
          'div',
          { class: 'howto' },
          ...(this.menuOptions.touch() ? COPY.howToTouch : COPY.howTo).flatMap(([icon, title, text]) => [
            HOWTO_ICONS[icon](),
            el('div', {}, el('b', {}, title), el('span', {}, text)),
          ]),
        ),
        el(
          'div',
          { class: 'actions' },
          this.button('chalk-link', COPY.back, () => this.showMenu(this.menuOptions), { primary: true }),
          el('a', { class: 'chalk-link', href: COPY.reportUrl, target: '_blank', rel: 'noopener' }, COPY.report),
        ),
      ),
    );
  }

  hideAudioHint() {
    this.menuHint?.remove();
  }

  // Between levels: the S-shaped map with the fly heading to the next stop.
  // After the last level the same board becomes the victory board.
  // "Kỷ lục mới!" when this game set the record, else the record to beat.
  bestLine(best, newBest) {
    return newBest ? el('p', { class: 'best new' }, COPY.newBest) : el('p', { class: 'best' }, COPY.bestScore(best));
  }

  showLevelComplete({ levelIndex, levelScore, totalScore, lives, best, newBest }, { onNext, onRestart, onMenu }) {
    const last = levelIndex >= LEVELS.length - 1;
    const info = last
      ? [
          el('h2', {}, COPY.victory),
          el('p', { class: 'sub' }, COPY.victorySub),
          el('div', { class: 'stats' }, el('span', {}, COPY.totalScore), el('b', {}, String(totalScore))),
          this.bestLine(best, newBest),
          el(
            'div',
            { class: 'actions' },
            this.signButton(COPY.retry, onRestart, { primary: true }),
            this.button('chalk-link', COPY.home, onMenu),
          ),
        ]
      : [
          el('h2', {}, COPY.levelDone(levelIndex)),
          el('p', { class: 'sub' }, COPY.nextLevel(levelIndex)),
          el(
            'div',
            { class: 'stats' },
            el('span', {}, COPY.levelScore),
            el('b', { class: 'level-score' }, String(levelScore)),
            el('span', {}, COPY.totalScore),
            el('b', { class: 'total-score' }, String(totalScore)),
            el('span', { class: 'lives-left' }, COPY.livesLeft(lives)),
          ),
          el('div', { class: 'actions' }, this.signButton(COPY.continue, onNext, { primary: true })),
        ];
    this.showScreen(
      'result',
      el(
        'div',
        { class: `chalkboard board journey${last ? ' victory' : ''}` },
        journeyMap(levelIndex),
        el('div', { class: 'journey-info' }, ...info),
      ),
    );
  }

  showGameOver({ totalScore, levelIndex, best, newBest }, { onRestart, onMenu }) {
    this.showScreen(
      'result',
      el(
        'div',
        { class: 'chalkboard board' },
        el('h2', {}, COPY.gameOver),
        el('p', { class: 'sub' }, COPY.gameOverSub(levelIndex)),
        el('div', { class: 'stats' }, el('b', {}, COPY.score(totalScore))),
        this.bestLine(best, newBest),
        el(
          'div',
          { class: 'actions' },
          this.signButton(COPY.retry, onRestart, { primary: true }),
          this.button('chalk-link', COPY.home, onMenu),
        ),
      ),
    );
  }
}
