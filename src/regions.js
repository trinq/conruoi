// The five stops of the fly's trip from north to south. A level picks a
// region for its scenery, dishes and diners.
//
// - dishes: the dish served at each tier (see src/game/dishes.js).
// - bonus: bonus dishes that may appear on this region's tables.
// - south: diners dress more like the south (áo bà ba) when true.
export const REGIONS = {
  hanoi: {
    name: 'Hà Nội',
    title: 'Phở Hà Nội',
    dishes: { high: 'pho-bo', medium: 'bun-cha', low: 'banh-cuon' },
    bonus: [],
    south: false,
  },
  hue: {
    name: 'Huế',
    title: 'Bún bò Huế',
    dishes: { high: 'bun-bo-hue', medium: 'com-hen', low: 'banh-beo' },
    bonus: [],
    south: false,
  },
  hoian: {
    name: 'Hội An',
    title: 'Cao lầu Hội An',
    dishes: { high: 'cao-lau', medium: 'mi-quang', low: 'banh-mi' },
    bonus: ['che'],
    south: false,
  },
  saigon: {
    name: 'Sài Gòn',
    title: 'Hủ tiếu hẻm Sài Gòn',
    dishes: { high: 'hu-tieu', medium: 'com-tam', low: 'banh-mi' },
    bonus: ['che'],
    south: true,
  },
  nightmarket: {
    name: 'Chợ đêm Sài Gòn',
    title: 'Chợ đêm Sài Gòn',
    dishes: { high: 'lau', medium: 'oc-xao', low: 'banh-trang-nuong' },
    bonus: ['che', 'xien-que'],
    south: true,
  },
};

// Dish id for a table food spec: a tier ({ tier: 'high' }) resolved through
// the region, or a bonus dish named directly ({ bonus: 'che' }).
export function dishFor(region, food) {
  return food.bonus ?? REGIONS[region].dishes[food.tier];
}
