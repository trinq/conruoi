import { LEVELS } from './levels.js';
import { REGIONS } from './regions.js';

// Every string the player reads, in one place so the tone can be tuned.
export const levelName = (i) => REGIONS[LEVELS[i].region].title;

export const COPY = {
  title: 'Con Ruồi',
  tagline: 'Làm con ruồi ở quán ăn vỉa hè: ăn phở, bún, cơm, chè và né những bàn tay!',
  audioHint: 'Click hoặc bấm phím bất kỳ để bật âm thanh',
  muted: 'Đã tắt tiếng (M)',
  controls: [
    [['W A S D', '↑ ↓ ← →'], 'Bay quanh quán'],
    [['Click món ăn'], 'Đậu xuống ăn lấy điểm'],
    [['Vùng đỏ'], 'Tay sắp đập, bay đi ngay!'],
    [['M'], 'Tắt / bật tiếng'],
  ],
  play: 'Chơi',
  hud: {
    score: 'Điểm',
    lives: 'Mạng',
    level: (i) => `Màn ${i + 1}/${LEVELS.length}`,
  },
  scorePopup: (dish) => `+${dish.points} ${dish.name}`,
  targetReached: 'Đủ điểm!',
  outOfLives: 'Hết mạng!',
  levelDone: (i) => `Xong màn ${i + 1}!`,
  nextLevel: (i) => `Tiếp theo: ${levelName(i + 1)}`,
  levelScore: 'Điểm màn này ',
  levelSummary: (total, lives) => `Tổng điểm ${total} · Còn ${lives} mạng`,
  continue: 'Tiếp Tục',
  victory: 'Chiến thắng!',
  victorySub: `Ăn sạch cả ${LEVELS.length} quán!`,
  totalScore: 'Tổng điểm ',
  gameOver: 'Bị đập rồi!',
  gameOverSub: (i) => `Dừng ở màn ${i + 1} / ${LEVELS.length}: ${levelName(i)}`,
  score: 'Điểm ',
  retry: 'Chơi Lại',
  home: 'Menu',
};
