import * as THREE from 'three';
import { Stage } from './world/Stage.js';
import { buildEnvironment } from './world/environment.js';
import { Round } from './game/Round.js';
import { moveDirection } from './game/direction.js';
import { MoveKeys } from './input/moveKeys.js';
import { InputMode } from './input/inputMode.js';
import { TouchStick } from './input/touchStick.js';
import { TouchTaps } from './input/touchTaps.js';
import { AudioEngine } from './audio/AudioEngine.js';
import { GameAudio } from './audio/GameAudio.js';
import { Ambience } from './audio/Ambience.js';
import { UI } from './ui/ui.js';
import { LEVELS } from './levels.js';
import { MAX_LIVES, newGame } from './gameState.js';
import { COPY } from './copy.js';
import { readBest, saveBest } from './bestScore.js';

const END_DELAY_MS = 900; // let the last bite / final hit play out before fading
const MAX_FRAME_MS = 50;
const TAP_REACH_PX = 44; // a touch tap this close to a dish still picks it
const TOUCH_ZOOM = 1.4; // phones frame the play area a little closer
const AUTO_LAND_M = 0.5; // lifting the joystick this close above a dish lands on it

// Game flow: menu → level → (level complete → next level | game over),
// with the 3D scene always rendering behind the HTML boards.
export class App {
  constructor() {
    this.stage = new Stage(document.getElementById('stage'));
    this.env = buildEnvironment(this.stage.scene);
    this.audio = new AudioEngine();
    this.gameAudio = new GameAudio(this.audio);
    this.ambience = new Ambience(this.audio);
    this.keys = new MoveKeys();
    this.input = new InputMode();
    this.ui = new UI(document.getElementById('ui'), this.stage);
    this.mode = 'menu';
    this.round = null;

    const canvas = this.stage.renderer.domElement;
    const ui = this.ui;
    this.stick = new TouchStick(
      canvas,
      { show: (x, y) => ui.showStick(x, y), move: (dx, dy) => ui.moveStick(dx, dy), hide: () => ui.hideStick() },
      { enabled: () => this.mode === 'play', onLift: () => this.stickLifted() },
    );
    const zoom = () => this.stage.setZoom(this.input.touch ? TOUCH_ZOOM : 1);
    this.input.onChange(zoom);
    zoom();

    // Phones play in landscape; held upright, a board asks to turn them.
    this.portrait = window.matchMedia('(orientation: portrait)');
    const rotate = () => this.checkOrientation();
    this.portrait.addEventListener('change', rotate);
    this.input.onChange(rotate);
    new TouchTaps(canvas, (e) => this.tap(e), { onStick: (id) => this.stick.owns(id) });
    // Mouse (and pen) pick on press, as before; touch picks on a tap.
    canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'touch' && this.mode === 'play') this.round.click(this.stage.pointerNdc(e), this.stage.camera);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      const over = this.mode === 'play' && this.round.pick(this.stage.pointerNdc(e), this.stage.camera);
      canvas.style.cursor = over ? 'pointer' : '';
    });
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyM' && !e.repeat) this.toggleSound();
    });
    this.audio.onUnlock(() => this.ui.hideAudioHint());

    this.showMenu();
    this.checkOrientation();
    this.last = performance.now();
    requestAnimationFrame((t) => this.frame(t));
  }

  // A touch tap goes down the click-to-land path, with a wider reach since a
  // fingertip is bigger than the dishes look. A thumb resting on the joystick
  // then lets the fly land until it moves again.
  tap(e) {
    if (this.mode !== 'play') return;
    const r = this.stage.renderer.domElement.getBoundingClientRect();
    const reach = this.input.touch ? { reachPx: TAP_REACH_PX, size: { width: r.width, height: r.height } } : {};
    if (this.round.click(this.stage.pointerNdc(e), this.stage.camera, reach)) this.stick.hold();
  }

  checkOrientation() {
    this.ui.setRotateHint(this.input.touch && this.portrait.matches);
  }

  // On touch, flying onto a dish and letting go of the joystick lands there.
  stickLifted() {
    if (this.mode === 'play' && this.input.touch) this.round.landOnDishBelow(AUTO_LAND_M);
  }

  loadLevel(levelIndex, lives) {
    this.round?.dispose();
    const level = LEVELS[levelIndex];
    this.round = new Round(this.stage.scene, level, levelIndex, { lives });
    this.stage.setTimeOfDay(level.timeOfDay);
    this.env.setRegion(level.region);
  }

  // M key and the menu's sound item share this.
  toggleSound() {
    this.audio.muted = !this.audio.muted;
    this.ui.setMuted(this.audio.muted);
  }

  showMenu() {
    this.mode = 'menu';
    this.gameAudio.stop();
    this.ambience.stop();
    this.loadLevel(0, MAX_LIVES);
    this.ui.hideHud();
    this.ui.showMenu({
      onPlay: () => this.go(newGame()),
      onToggleSound: () => this.toggleSound(),
      onQuality: (level) => this.stage.setQuality(level),
      audioLocked: () => this.audio.locked,
      best: readBest(),
    });
  }

  go(data) {
    this.ui.fade(() => this.startLevel(data));
  }

  startLevel({ levelIndex, lives, totalScore }) {
    this.loadLevel(levelIndex, lives);
    this.levelIndex = levelIndex;
    this.totalScore = totalScore;
    this.mode = 'play';
    this.ui.hideScreen();
    this.ui.showHud(levelIndex, this.round.level);
    this.ui.setScore(0);
    this.ui.setLives(lives);
    this.ui.showIntro(levelIndex);

    const round = this.round;
    // Street sounds start with the level, or as soon as audio is allowed.
    this.audio.onUnlock(() => {
      if (this.round === round && this.mode === 'play') this.ambience.play(round.level.region);
    });
    round.events
      .on('score', (score, food) => {
        this.totalScore += food.info.points;
        this.ui.setScore(score);
        this.ui.popup(new THREE.Vector3(food.x, food.surfaceHeight + 0.9, food.z), COPY.scorePopup(food.info));
      })
      .on('swing', (weapon) => this.gameAudio.swing(weapon))
      .on('slap', (x, z, weapon) => {
        this.gameAudio.slap(weapon);
        // A fan lands lighter than a palm; a swatter is light but snappy.
        if (weapon === 'fan') this.stage.shake(110, 0.07);
        else if (weapon === 'swatter') this.stage.shake(90, 0.08);
        else this.stage.shake(140, 0.12);
      })
      .on('hit', () => {
        this.gameAudio.hurt();
        const fly = round.fly;
        this.ui.hitReaction(new THREE.Vector3(fly.x, fly.altitude + 0.5, fly.z));
      })
      .on('lives', (lives) => this.ui.setLives(lives, { lost: true }))
      .on('won', () =>
        this.endRound(COPY.targetReached, () => this.showLevelComplete({ levelIndex, levelScore: round.score, totalScore: this.totalScore, lives: round.lives })),
      )
      .on('lost', () => this.endRound(COPY.outOfLives, () => this.showGameOver({ levelIndex, totalScore: this.totalScore })));
  }

  endRound(message, next) {
    this.mode = 'ending';
    this.stick.release();
    this.gameAudio.stop();
    this.ambience.stop();
    this.ui.banner(message);
    setTimeout(
      () =>
        this.ui.fade(() => {
          this.ui.hideHud();
          next();
        }),
      END_DELAY_MS,
    );
  }

  showLevelComplete(data) {
    this.mode = 'result';
    this.audio.play('jingle');
    // The trip ends after the last level, so that total can set the record.
    const last = data.levelIndex >= LEVELS.length - 1;
    const newBest = last && saveBest(data.totalScore);
    this.ui.showLevelComplete({ ...data, best: readBest(), newBest }, {
      onNext: () => this.go({ levelIndex: data.levelIndex + 1, lives: data.lives, totalScore: data.totalScore }),
      onRestart: () => this.go(newGame()),
      onMenu: () => this.ui.fade(() => this.showMenu()),
    });
  }

  showGameOver(data) {
    this.mode = 'result';
    const newBest = saveBest(data.totalScore);
    this.ui.showGameOver({ ...data, best: readBest(), newBest }, {
      onRestart: () => this.go(newGame()),
      onMenu: () => this.ui.fade(() => this.showMenu()),
    });
  }

  // On the home screen the fly loops lazily around the table.
  menuFlightDir(now) {
    const a = now * 0.0006;
    const target = { x: Math.cos(a) * 3.2, z: 1.2 + Math.sin(a) * 2.2 };
    const fly = this.round.fly;
    const dx = target.x - fly.x;
    const dz = target.z - fly.z;
    const len = Math.hypot(dx, dz);
    return len < 0.3 ? { x: 0, z: 0 } : { x: dx / len, z: dz / len };
  }

  // The joystick while a thumb is on it, else the keyboard.
  moveInput() {
    const touch = this.stick.direction();
    return touch.x !== 0 || touch.z !== 0 ? touch : moveDirection(this.keys.state());
  }

  frame(now) {
    const dt = Math.min(MAX_FRAME_MS, now - this.last);
    this.last = now;
    this.env.update(now, dt / 1000);
    if (this.mode === 'play') {
      this.round.update(dt, this.moveInput());
      this.gameAudio.update(this.round.fly, dt / 1000);
      this.ui.updateBars(this.round.foods);
    } else {
      this.round.preview(dt, this.mode === 'menu' ? this.menuFlightDir(now) : undefined);
    }
    this.stage.render(dt);
    requestAnimationFrame((t) => this.frame(t));
  }
}
