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
      if (e.code === 'KeyM' && !e.repeat) {
        this.audio.muted = !this.audio.muted;
        this.ui.setMuted(this.audio.muted);
      }
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
    this.stage.setTheme(level.theme);
    this.env.setTheme(level.theme);
  }

  showMenu() {
    this.mode = 'menu';
    this.gameAudio.stop();
    this.loadLevel(0, MAX_LIVES);
    this.ui.hideHud();
    this.ui.showMenu({ onPlay: () => this.go(newGame()), audioLocked: this.audio.locked });
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

    const round = this.round;
    round.events
      .on('score', (score, food) => {
        this.totalScore += food.info.points;
        this.ui.setScore(score);
        this.ui.popup(new THREE.Vector3(food.x, food.surfaceHeight + 0.9, food.z), `+${food.info.points} ${food.info.name}`);
      })
      .on('slap', () => {
        this.gameAudio.slap();
        this.stage.shake(140, 0.12);
      })
      .on('hit', () => this.gameAudio.hurt())
      .on('lives', (lives) => this.ui.setLives(lives, { lost: true }))
      .on('won', () =>
        this.endRound('Đủ điểm!', () => this.showLevelComplete({ levelIndex, levelScore: round.score, totalScore: this.totalScore, lives: round.lives })),
      )
      .on('lost', () => this.endRound('Hết mạng!', () => this.showGameOver({ levelIndex, totalScore: this.totalScore })));
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

  frame(now) {
    const dt = Math.min(MAX_FRAME_MS, now - this.last);
    this.last = now;
    this.env.update(now);
    if (this.mode === 'play') {
      this.round.update(dt, moveDirection(this.keys.state()));
      this.gameAudio.update(this.round.fly, dt / 1000);
      this.ui.updateBars(this.round.foods);
    } else {
      this.round.preview(dt);
    }
    this.stage.render(dt);
    requestAnimationFrame((t) => this.frame(t));
  }
}
