// Dish catalogue. A dish's tier sets its points and eating time, so the
// risk/reward rule is the same in every region: big dishes pay more but keep
// the fly sitting still for longer.
export const TIERS = {
  high: { points: 30, eatMs: 2200 },
  medium: { points: 20, eatMs: 1600 },
  low: { points: 10, eatMs: 1000 },
  bonus: { points: 40, eatMs: 1200 },
};

// `model` names the low-poly builder used to draw the dish.
const CATALOGUE = {
  'pho-bo': { name: 'Phở bò', tier: 'high', model: 'pho' },
  'bun-cha': { name: 'Bún chả', tier: 'medium', model: 'bun' },
  'banh-cuon': { name: 'Bánh cuốn', tier: 'low', model: 'com' },
  'bun-bo-hue': { name: 'Bún bò Huế', tier: 'high', model: 'bun' },
  'com-hen': { name: 'Cơm hến', tier: 'medium', model: 'com' },
  'banh-beo': { name: 'Bánh bèo', tier: 'low', model: 'com' },
  'cao-lau': { name: 'Cao lầu', tier: 'high', model: 'pho' },
  'mi-quang': { name: 'Mì Quảng', tier: 'medium', model: 'bun' },
  'banh-mi': { name: 'Bánh mì', tier: 'low', model: 'com' },
  'hu-tieu': { name: 'Hủ tiếu', tier: 'high', model: 'pho' },
  'com-tam': { name: 'Cơm tấm', tier: 'medium', model: 'com' },
  lau: { name: 'Lẩu', tier: 'high', model: 'pho' },
  'oc-xao': { name: 'Ốc xào', tier: 'medium', model: 'com' },
  'banh-trang-nuong': { name: 'Bánh tráng nướng', tier: 'low', model: 'com' },
  che: { name: 'Chè', tier: 'bonus', model: 'che' },
  'xien-que': { name: 'Xiên que', tier: 'bonus', model: 'che' },
};

export const DISHES = Object.fromEntries(
  Object.entries(CATALOGUE).map(([id, d]) => [id, { id, ...d, ...TIERS[d.tier], bonus: d.tier === 'bonus' }]),
);
