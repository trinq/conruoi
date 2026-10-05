import { LEVELS } from './levels.js';
import { REGIONS } from './regions.js';

// Every string the player reads, in one place so the tone can be tuned.
// Voice: a Vietnamese street-food stall, cheeky and playful.
export const levelName = (i) => REGIONS[LEVELS[i].region].title;

export const COPY = {
  title: 'Con Ruồi',
  slogan: 'Quán ngon - Ruồi đông',
  signStrip: 'Số 1 Vỉa Hè · ĐT: 1900 RUỒI',
  menuTitle: 'Thực đơn hôm nay',
  // Menu items read like a street-food menu: dish ........ price.
  menu: {
    play: ['Vô quán!', '0đ'],
    howTo: ['Cách chơi', 'miễn phí'],
    sound: (on) => ['Âm thanh', on ? 'Bật' : 'Tắt'],
    // 'Nhẹ' turns shadows off for weaker machines.
    quality: (high) => ['Đồ hoạ', high ? 'Đẹp' : 'Nhẹ'],
  },
  audioHint: 'Click hoặc bấm phím bất kỳ để bật âm thanh',
  muted: 'Đã tắt tiếng (M)',
  howToTitle: 'Cách chơi',
  howTo: [
    ['keys', 'W A S D hoặc ↑ ↓ ← →', 'Bay quanh quán'],
    ['bowl', 'Click vào món ăn', 'Đậu xuống ăn, no thêm điểm. Tô to thì nhiều điểm nhưng phải ngồi lâu'],
    ['zone', 'Thấy vùng đỏ', 'Tay, quạt hay vợt sắp đập xuống đó, bay đi ngay!'],
    ['key-m', 'Phím M', 'Tắt / bật tiếng'],
  ],
  back: '‹ Quay lại',
  hud: {
    score: 'No',
    lives: 'Mạng',
    level: (i) => `Màn ${i + 1}`,
  },
  intro: (i) => `Màn ${i + 1}: ${levelName(i)}`,
  introSub: 'Ăn nhanh kẻo bị đập!',
  scorePopup: (dish) => `+${dish.points} ${dish.name}`,
  hit: ['Á đù!', 'Ui da!'],
  targetReached: 'No căng bụng!',
  outOfLives: 'Bẹp dí!',
  levelDone: (i) => `Xong màn ${i + 1}!`,
  nextLevel: (i) => `Chặng tiếp: ${levelName(i + 1)}`,
  levelScore: 'Màn này no được',
  totalScore: 'Tổng cộng',
  livesLeft: (lives) => `Còn ${lives} mạng`,
  continue: 'Bay tiếp',
  map: {
    label: 'Bản đồ hành trình xuyên Việt',
    paracels: 'Hoàng Sa',
    spratlys: 'Trường Sa',
  },
  victory: 'Ruồi chúa xuyên Việt!',
  victorySub: `Ăn sạch ${LEVELS.length} quán từ Bắc vô Nam.`,
  gameOver: 'Ruồi đã lên đường...',
  gameOverSub: (i) => `Gục ngã tại màn ${i + 1}: ${levelName(i)}`,
  score: (n) => `Điểm: ${n}`,
  retry: 'Bay lại phát nữa',
  home: 'Về quán',
  best: 'Kỷ lục',
  bestScore: (n) => `Kỷ lục: ${n}`,
  newBest: 'Kỷ lục mới!',
  // The pause board.
  pause: {
    title: 'Tạm nghỉ',
    button: 'Tạm nghỉ (P)',
    resume: ['Bay tiếp', '▶'],
    home: ['Về quán', '⌂'],
  },
  // Shown over the game in a phone browser held upright.
  rotate: 'Xoay ngang điện thoại nhé!',
};
