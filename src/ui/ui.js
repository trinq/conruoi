import * as THREE from 'three';
import { LEVELS } from '../levels.js';
import { MAX_LIVES } from '../gameState.js';

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

const HEART_PATH = 'M12 21s-7.5-4.6-10-9.3C.3 8.4 2.2 4 6.2 4c2.3 0 4 1.3 5.8 3.4C13.8 5.3 15.5 4 17.8 4c4 0 5.9 4.4 4.2 7.7C19.5 16.4 12 21 12 21z';

function heart(full) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', HEART_PATH);
  path.setAttribute('class', full ? 'heart-full' : 'heart-empty');
  svg.append(path);
  return svg;
}

function controls() {
  const row = (keys, text) => [el('span', {}, ...keys.map((k) => el('kbd', {}, k))), el('span', {}, text)];
  return el(
    'div',
    { class: 'controls' },
    ...row(['W A S D', '↑ ↓ ← →'], 'Bay quanh quán'),
    ...row(['Click món ăn'], 'Đậu xuống ăn lấy điểm'),
    ...row(['Vùng đỏ'], 'Tay sắp đập, bay đi ngay!'),
    ...row(['M'], 'Tắt / bật tiếng'),
  );
}

// All HTML on top of the 3D canvas: HUD, world-anchored bars and popups,
// menu/result boards and the fade between them.
export class UI {
  constructor(root, stage) {
    this.root = root;
    this.stage = stage;
    this.world = el('div', { class: 'world' });
    this.hudLayer = el('div');
    this.screenLayer = el('div');
    this.fadeLayer = el('div', { class: 'fade' });
    this.muteLabel = el('div', { class: 'mute' });
    root.append(this.world, this.hudLayer, this.screenLayer, this.muteLabel, this.fadeLayer);
    this.bars = new Map();

    // Enter always presses the board's main button, even after a click
    // elsewhere (say, to switch the sound on) took focus away from it.
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
    this.muteLabel.textContent = muted ? 'Đã tắt tiếng (M)' : '';
  }

  // ----- HUD -----

  showHud(levelIndex, level) {
    this.clearWorld();
    this.scoreText = el('span');
    this.scoreFill = el('div');
    this.hearts = el('div', { class: 'pill hearts', 'aria-label': 'Mạng' });
    this.hudLayer.replaceChildren(
      el(
        'div',
        { class: 'hud' },
        el('div', { class: 'pill' }, el('span', { class: 'label' }, 'Điểm'), this.scoreText, el('div', { class: 'score-bar' }, this.scoreFill)),
        el('div', { class: 'pill' }, el('span', { class: 'label' }, `Màn ${levelIndex + 1}/${LEVELS.length}`), level.name),
        this.hearts,
      ),
    );
    this.target = level.targetScore;
  }

  hideHud() {
    this.hudLayer.replaceChildren();
    this.clearWorld();
  }

  setScore(score) {
    this.scoreText.textContent = `${score} / ${this.target}`;
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

  banner(text) {
    this.world.append(el('div', { class: 'banner' }, text));
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

  popup(position, text) {
    const p = this.stage.project(position);
    const node = el('div', { class: 'popup' }, text);
    node.style.left = `${p.x}px`;
    node.style.top = `${p.y}px`;
    node.addEventListener('animationend', () => node.remove());
    this.world.append(node);
  }

  // ----- screens -----

  showScreen(...children) {
    const buttons = children.flat().filter((c) => c instanceof HTMLButtonElement);
    this.screenLayer.replaceChildren(el('div', { class: 'screen' }, el('div', { class: 'board' }, ...children)));
    // Focus the main action so Enter / Space trigger it.
    this.primary = this.screenLayer.querySelector('button.btn');
    this.primary?.focus();
    return buttons;
  }

  hideScreen() {
    this.screenLayer.replaceChildren();
    this.primary = null;
  }

  button(label, onClick, secondary = false) {
    let fired = false;
    return el(
      'button',
      {
        class: secondary ? 'btn secondary' : 'btn',
        type: 'button',
        onclick: () => {
          if (fired) return;
          fired = true;
          onClick();
        },
      },
      label,
    );
  }

  showMenu({ onPlay, audioLocked }) {
    const hint = audioLocked ? el('p', { class: 'hint' }, 'Click hoặc bấm phím bất kỳ để bật âm thanh') : null;
    this.showScreen(
      el('h1', {}, 'Con Ruồi'),
      el('p', { class: 'sub' }, 'Làm con ruồi ở quán ăn vỉa hè: ăn phở, bún, cơm, chè và né những bàn tay!'),
      controls(),
      el('div', { class: 'buttons' }, this.button('Chơi', onPlay)),
      hint,
    );
    this.menuHint = hint;
  }

  hideAudioHint() {
    this.menuHint?.remove();
  }

  showLevelComplete({ levelIndex, levelScore, totalScore, lives }, { onNext, onRestart, onMenu }) {
    const last = levelIndex >= LEVELS.length - 1;
    if (last) {
      this.showScreen(
        el('h1', {}, 'Chiến thắng!'),
        el('p', { class: 'sub' }, `Ăn sạch cả ${LEVELS.length} quán!`),
        el('div', { class: 'stats' }, el('span', {}, 'Tổng điểm ', el('b', {}, String(totalScore)))),
        el('div', { class: 'buttons' }, this.button('Chơi Lại', onRestart), this.button('Menu', onMenu, true)),
      );
      return;
    }
    this.showScreen(
      el('h2', {}, `Xong màn ${levelIndex + 1}!`),
      el('p', { class: 'sub' }, `Tiếp theo: ${LEVELS[levelIndex + 1].name}`),
      el(
        'div',
        { class: 'stats' },
        el('span', {}, 'Điểm màn này ', el('b', {}, String(levelScore))),
        el('span', {}, `Tổng điểm ${totalScore} · Còn ${lives} mạng`),
      ),
      el('div', { class: 'buttons' }, this.button('Tiếp Tục', onNext)),
    );
  }

  showGameOver({ totalScore, levelIndex }, { onRestart, onMenu }) {
    this.showScreen(
      el('h2', {}, 'Bị đập rồi!'),
      el('p', { class: 'sub' }, `Dừng ở màn ${levelIndex + 1} / ${LEVELS.length}: ${LEVELS[levelIndex].name}`),
      el('div', { class: 'stats' }, el('span', {}, 'Điểm ', el('b', {}, String(totalScore)))),
      el('div', { class: 'buttons' }, this.button('Chơi Lại', onRestart), this.button('Menu', onMenu, true)),
    );
  }
}
