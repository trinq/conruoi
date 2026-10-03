// Points and eating time per dish. Richer dishes pay more but keep the fly
// sitting still for longer.
export const FOOD_TYPES = {
  pho: { name: 'Phở', points: 30, eatMs: 2200 },
  bun: { name: 'Bún', points: 20, eatMs: 1600 },
  com: { name: 'Cơm', points: 10, eatMs: 1000 },
  // Bonus dessert in later levels: lots of points for a quick bite.
  che: { name: 'Chè', points: 40, eatMs: 1200, bonus: true },
};
