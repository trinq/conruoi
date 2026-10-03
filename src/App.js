import * as THREE from 'three';
import { Stage } from './world/Stage.js';
import { buildEnvironment } from './world/environment.js';
import { Round } from './game/Round.js';
import { moveDirection } from './game/direction.js';
import { MoveKeys } from './input/moveKeys.js';
import { AudioEngine } from './audio/AudioEngine.js';
import { GameAudio } from './audio/GameAudio.js';
import { UI } from './ui/ui.js';
import { LEVELS } from './levels.js';
import { MAX_LIVES, newGame } from './gameState.js';
import { COPY } from './copy.js';

const END_DELAY_MS = 900; // let the last bite / final hit play out before fading
const MAX_FRAME_MS = 50;

// Game flow: menu → level → (level complete → next level | game over),
// with the 3D scene always rendering behind the HTML boards.
export class App {
  constructor() {
    this.stage = new Stage(document.getElementById('stage'));
    this.env = buildEnvironment(this.stage.scene);
    this.audio = new AudioEngine();
    this.gameAudio = new GameAudio(this.audio);
    this.keys = new MoveKeys();
    this.ui = new UI(document.getElementById('ui'), this.stage);
    this.mode = 'menu';
    this.round = null;

    const canvas = this.stage.renderer.domElement;
    canvas.addEventListener('pointerdown', (e) => {
      if (this.mode === 'play') this.round.click(this.stage.pointerNdc(e), this.stage.camera);
    });
    canvas.addEventListener('pointermove', (e) => {
      const over = this.mode === 'play' && this.round.pick(this.stage.pointerNdc(e), this.stage.camera);
      canvas.style.cursor = over ? 'pointer' : '';
    });
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyM' && !e.repeat) this.toggleSound();
    });
    this.audio.onUnlock(() => this.ui.hideAudioHint());

    this.showMenu();
    this.last = performance.now();
    requestAnimationFrame((t) => this.frame(t));
  }

  loadLevel(levelIndex, lives) {
    this.round?.dispose();
    const level = LEVELS[levelIndex];
    this.round = new Round(this.stage.scene, level, levelIndex, { lives });
    this.stage.setTimeOfDay(level.timeOfDay);
    this.env.setRegion(level.region, level.timeOfDay);
  }

  // M key and the menu's sound item share this.
  toggleSound() {
    this.audio.muted = !this.audio.muted;
    this.ui.setMuted(this.audio.muted);
  }

  showMenu() {
    this.mode = 'menu';
    this.gameAudio.stop();
    this.loadLevel(0, MAX_LIVES);
    this.ui.hideHud();
    this.ui.showMenu({
      onPlay: () => this.go(newGame()),
      onToggleSound: () => this.toggleSound(),
      onQuality: (level) => this.stage.setQuality(level),
      audioLocked: () => this.audio.locked,
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
    this.gameAudio.stop();
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
    this.ui.showLevelComplete(data, {
      onNext: () => this.go({ levelIndex: data.levelIndex + 1, lives: data.lives, totalScore: data.totalScore }),
      onRestart: () => this.go(newGame()),
      onMenu: () => this.ui.fade(() => this.showMenu()),
    });
  }

  showGameOver(data) {
    this.mode = 'result';
    this.ui.showGameOver(data, {
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

  frame(now) {
    const dt = Math.min(MAX_FRAME_MS, now - this.last);
    this.last = now;
    this.env.update(now, dt / 1000);
    if (this.mode === 'play') {
      this.round.update(dt, moveDirection(this.keys.state()));
      this.gameAudio.update(this.round.fly, dt / 1000);
      this.ui.updateBars(this.round.foods);
    } else {
      this.round.preview(dt, this.mode === 'menu' ? this.menuFlightDir(now) : undefined);
    }
    this.stage.render(dt);
    requestAnimationFrame((t) => this.frame(t));
  }
}
