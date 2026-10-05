import { test, expect } from '@playwright/test';
import { COPY, levelName } from '../../src/copy.js';
import { LEVELS } from '../../src/levels.js';
import { REGIONS } from '../../src/regions.js';
import { DISHES } from '../../src/game/dishes.js';
import {
  openGame,
  waitForMode,
  startGame,
  goToLevel,
  hud,
  board,
  fullHearts,
  clickDish,
  strikeFly,
  finishLevel,
  expectNoErrors,
  SLOW,
} from './game.js';

test('home screen shows the shop sign and menu, Enter starts level 1', async ({ page }) => {
  const errors = await openGame(page);
  await expect(page.locator('.title-sign')).toContainText(COPY.title);
  await expect(page.locator('.title-sign')).toContainText(COPY.slogan);
  await expect(board(page)).toContainText(COPY.menuTitle);
  await expect(board(page)).toContainText(COPY.menu.play[0]);
  await expect(board(page).locator('.record')).toContainText(COPY.best);
  await startGame(page);
  await expect(hud(page)).toContainText(levelName(0));
  await expect(page.locator('.intro')).toContainText(COPY.intro(0));
  expect(await fullHearts(page)).toBe(3);
  await expectNoErrors(errors);
});

test('how-to-play opens from the menu and goes back', async ({ page }) => {
  const errors = await openGame(page);
  await page.getByRole('button', { name: COPY.menu.howTo[0] }).click();
  await expect(board(page)).toContainText(COPY.howToTitle);
  await page.getByRole('button', { name: COPY.back }).click();
  await expect(board(page)).toContainText(COPY.menuTitle);
  await expectNoErrors(errors);
});

test('the menu sound item and the M key toggle the same setting', async ({ page }) => {
  const errors = await openGame(page);
  const sound = () => page.locator('.chalk-item', { hasText: COPY.menu.sound(true)[0] });
  await expect(sound()).toContainText(COPY.menu.sound(true)[1]);
  await sound().click();
  await expect(sound()).toContainText(COPY.menu.sound(false)[1]);
  await expect(page.locator('.mute')).toHaveText(COPY.muted);
  await page.keyboard.press('m');
  await expect(sound()).toContainText(COPY.menu.sound(true)[1]);
  await expectNoErrors(errors);
});

test('the graphics item switches shadows off and back on', async ({ page }) => {
  const errors = await openGame(page);
  const item = () => page.locator('.chalk-item', { hasText: COPY.menu.quality(true)[0] });
  const shadows = () => page.evaluate(() => window.__app.stage.renderer.shadowMap.enabled);
  expect(await shadows()).toBe(true);
  await item().click();
  await expect(item()).toContainText(COPY.menu.quality(false)[1]);
  expect(await shadows()).toBe(false);
  await item().click();
  expect(await shadows()).toBe(true);
  await expectNoErrors(errors);
});

test('clicking a dish lands the fly and eating fills it up', async ({ page }) => {
  const errors = await openGame(page);
  await startGame(page);
  const dish = await clickDish(page, 'low');
  await expect(hud(page)).toContainText(`${COPY.hud.score}:${dish.points}/${LEVELS[0].targetScore}`, SLOW);
  await expect(page.locator('.popup')).toContainText(dish.name);
  await expectNoErrors(errors);
});

test('a strike costs a life and losing all lives ends the game', async ({ page }) => {
  const errors = await openGame(page);
  await startGame(page);
  await strikeFly(page);
  await expect.poll(() => fullHearts(page)).toBe(2);
  await expect(page.locator('.popup.hit')).toHaveText(new RegExp(COPY.hit.join('|')));
  await strikeFly(page);
  await strikeFly(page);
  await expect(page.locator('.banner')).toHaveText(COPY.outOfLives);
  await waitForMode(page, 'result');
  await expect(board(page)).toContainText(COPY.gameOver);
  await board(page).getByRole('button', { name: COPY.retry }).click();
  await waitForMode(page, 'play');
  await expect(hud(page)).toContainText(levelName(0));
  expect(await fullHearts(page)).toBe(3);
  await expectNoErrors(errors);
});

test('reaching the target shows the journey map, then the next level', async ({ page }) => {
  const errors = await openGame(page);
  await startGame(page);
  const levelScore = await page.evaluate(() => window.__app.round.level.targetScore);
  await finishLevel(page);
  await expect(page.locator('.banner')).toHaveText(COPY.targetReached);
  await waitForMode(page, 'result');
  await expect(board(page)).toContainText(COPY.levelDone(0));
  await expect(board(page)).toContainText(COPY.nextLevel(0));

  // Five stops in route order, Hà Nội done, Huế next.
  const map = page.locator('.journey-map');
  await expect(map.locator('.stop')).toHaveText(LEVELS.map((l, i) => `${i + 1}. ${REGIONS[l.region].name}`));
  await expect(map.locator('.stop.done')).toHaveAttribute('data-stop', LEVELS[0].region);
  await expect(map.locator('.stop.next')).toHaveAttribute('data-stop', LEVELS[1].region);
  await expect(map.locator('.map-fly')).toBeVisible();
  await expect(map).toHaveAttribute('data-arrived', '', SLOW);

  const score = Number(await board(page).locator('.level-score').textContent());
  expect(score).toBeGreaterThanOrEqual(levelScore);
  await expect(board(page).locator('.total-score')).toHaveText(String(score));
  await expect(board(page)).toContainText(COPY.livesLeft(3));

  await page.keyboard.press('Enter');
  await waitForMode(page, 'play');
  await expect(hud(page)).toContainText(levelName(1));
  await expectNoErrors(errors);
});

test('the map marks every finished stop and adds up the total', async ({ page }) => {
  const errors = await openGame(page);
  await goToLevel(page, 2);
  const before = await page.evaluate(() => window.__app.totalScore);
  await finishLevel(page);
  await waitForMode(page, 'result');
  const map = page.locator('.journey-map');
  const done = await map.locator('.stop.done').evaluateAll((els) => els.map((e) => e.dataset.stop));
  expect(done).toEqual(LEVELS.slice(0, 3).map((l) => l.region));
  await expect(map.locator('.stop.next')).toHaveAttribute('data-stop', LEVELS[3].region);
  const level = Number(await board(page).locator('.level-score').textContent());
  await expect(board(page).locator('.total-score')).toHaveText(String(before + level));
  await board(page).getByRole('button', { name: COPY.continue }).click();
  await waitForMode(page, 'play');
  await expect(hud(page)).toContainText(levelName(3));
  await expectNoErrors(errors);
});

test('finishing all five levels shows the victory board', async ({ page }) => {
  const errors = await openGame(page);
  await startGame(page);
  for (let i = 0; i < LEVELS.length; i++) {
    await expect(hud(page)).toContainText(levelName(i));
    await finishLevel(page);
    await waitForMode(page, 'result');
    if (i < LEVELS.length - 1) {
      await expect(board(page)).toContainText(COPY.levelDone(i));
      // Building the next street takes a few seconds with software WebGL.
      await page.keyboard.press('Enter');
      await waitForMode(page, 'play');
    }
  }
  await expect(board(page)).toContainText(COPY.victory);
  await expect(page.locator('.journey-map .stop.done')).toHaveCount(LEVELS.length);
  await expect(board(page).getByRole('button', { name: COPY.retry })).toBeVisible();
  await expect(board(page)).toContainText(COPY.newBest);
  const total = await page.evaluate(() => window.__app.totalScore);
  await board(page).getByRole('button', { name: COPY.home }).click();
  await waitForMode(page, 'menu');
  await expect(page.locator('.title-sign')).toContainText(COPY.title);
  await expect(record(page)).toHaveText(`${COPY.best}:${total}`);

  // The record survives a reload.
  await page.reload();
  await page.waitForFunction(() => window.__app);
  await expect(record(page)).toHaveText(`${COPY.best}:${total}`);
  await expectNoErrors(errors);
});

const record = (page) => page.locator('.board .record');

// Eats `count` dishes straight away and returns the level score.
const eat = (page, count) =>
  page.evaluate((count) => {
    const r = window.__app.round;
    for (let i = 0; i < count; i++) r.onEat(r.foods[i]);
    return r.score;
  }, count);

async function loseAllLives(page) {
  for (let i = 0; i < 3; i++) await strikeFly(page);
  await waitForMode(page, 'result');
  await expect(board(page)).toContainText(COPY.gameOver);
}

test('game over saves the best score, which the home screen shows after a reload', async ({ page }) => {
  const errors = await openGame(page);
  await expect(record(page)).toHaveText(`${COPY.best}:0`);
  await startGame(page);
  const score = await eat(page, 2);
  await loseAllLives(page);
  await expect(board(page)).toContainText(COPY.newBest);

  await page.reload();
  await page.waitForFunction(() => window.__app);
  await expect(record(page)).toHaveText(`${COPY.best}:${score}`);

  // A lower score leaves the record alone.
  await startGame(page);
  await eat(page, 1);
  await loseAllLives(page);
  await expect(board(page)).toContainText(COPY.bestScore(score));
  await expect(board(page)).not.toContainText(COPY.newBest);
  await board(page).getByRole('button', { name: COPY.home }).click();
  await waitForMode(page, 'menu');
  await expect(record(page)).toHaveText(`${COPY.best}:${score}`);
  await expectNoErrors(errors);
});

test('the game still plays and keeps the record for the session when storage is blocked', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Storage is disabled', 'SecurityError');
      },
    });
  });
  const errors = await openGame(page);
  await expect(record(page)).toHaveText(`${COPY.best}:0`);
  await startGame(page);
  const score = await eat(page, 2);
  await loseAllLives(page);
  await expect(board(page)).toContainText(COPY.newBest);
  await board(page).getByRole('button', { name: COPY.home }).click();
  await waitForMode(page, 'menu');
  await expect(record(page)).toHaveText(`${COPY.best}:${score}`);
  await startGame(page);
  await expect(hud(page)).toContainText(levelName(0));
  await expectNoErrors(errors);
});

// Which region's street sounds are playing (null when silent), and how many
// of the ambience layers are running.
const ambience = (page) =>
  page.evaluate(() => {
    const a = window.__app.ambience;
    return { region: a.region, layers: Object.values(a.layers).filter((v) => v.playing).length };
  });

test('street sounds play under each level, follow mute and stop between levels and on the menu', async ({ page }) => {
  const errors = await openGame(page);
  expect(await ambience(page)).toEqual({ region: null, layers: 0 });

  // Sound switched off from the menu: the street plays but is silent.
  await page.locator('.chalk-item', { hasText: COPY.menu.sound(true)[0] }).click();
  await startGame(page);
  await expect.poll(() => ambience(page)).toEqual({ region: LEVELS[0].region, layers: 4 });
  expect(await page.evaluate(() => window.__app.audio.muted)).toBe(true);
  await page.keyboard.press('m');
  expect(await page.evaluate(() => window.__app.audio.muted)).toBe(false);

  await finishLevel(page);
  await waitForMode(page, 'result');
  expect(await ambience(page)).toEqual({ region: null, layers: 0 });
  await page.keyboard.press('Enter');
  await waitForMode(page, 'play');
  await expect.poll(() => ambience(page)).toEqual({ region: LEVELS[1].region, layers: 4 });

  for (let i = 0; i < 3; i++) await strikeFly(page);
  await waitForMode(page, 'result');
  expect(await ambience(page)).toEqual({ region: null, layers: 0 });
  await board(page).getByRole('button', { name: COPY.home }).click();
  await waitForMode(page, 'menu');
  expect(await ambience(page)).toEqual({ region: null, layers: 0 });
  await expectNoErrors(errors);
});

test('street sounds wait until a key press or click allows audio', async ({ page }) => {
  const errors = await openGame(page);
  // As if the browser had not allowed audio yet.
  await page.evaluate(() => window.__app.audio.ctx.suspend());
  expect(await page.evaluate(() => window.__app.audio.locked)).toBe(true);
  await page.evaluate(() => window.__app.go({ levelIndex: 3, lives: 3, totalScore: 0 }));
  await waitForMode(page, 'play');
  expect(await ambience(page)).toEqual({ region: null, layers: 0 });
  await page.keyboard.press('Shift');
  await expect.poll(() => ambience(page)).toEqual({ region: LEVELS[3].region, layers: 4 });
  await expectNoErrors(errors);
});

test('P and Esc pause the level; game time stops until "Bay tiếp"', async ({ page }) => {
  const errors = await openGame(page);
  await startGame(page);
  const time = () => page.evaluate(() => window.__app.round.time);
  for (const key of ['p', 'Escape']) {
    await page.keyboard.press(key);
    await waitForMode(page, 'paused');
    await expect(board(page)).toContainText(COPY.pause.title);
    const t0 = await time();
    await page.waitForTimeout(1500);
    expect(await time()).toBe(t0);
    await board(page).getByRole('button', { name: COPY.pause.resume[0] }).click();
    await waitForMode(page, 'play');
    await expect.poll(time, SLOW).toBeGreaterThan(t0);
  }
  await expectNoErrors(errors);
});

test('movement works with a Vietnamese input method switched on', async ({ page }) => {
  const errors = await openGame(page);
  await startGame(page);
  const x = () => page.evaluate(() => window.__app.round.fly.x);
  const before = await x();
  // Telex/VNI send keyCode 229 and key "Process", but code names the key.
  // The key is held until the fly has moved: software WebGL on CI can take
  // longer than a quick tap to draw one frame.
  const press = (type) =>
    page.evaluate((type) => {
      const e = new KeyboardEvent(type, { key: 'Process', code: 'KeyD', bubbles: true });
      Object.defineProperty(e, 'keyCode', { get: () => 229 });
      window.dispatchEvent(e);
    }, type);
  await press('keydown');
  await expect.poll(x, SLOW).toBeGreaterThan(before + 0.1);
  await press('keyup');
  await expectNoErrors(errors);
});

test('level 2 is Huế and serves bánh bèo, cơm hến and bún bò Huế', async ({ page }) => {
  const errors = await openGame(page);
  await goToLevel(page, 1);
  await expect(hud(page)).toContainText(levelName(1));
  const served = await page.evaluate(() => [...new Set(window.__app.round.foods.map((f) => f.info.name))].sort());
  expect(served).toEqual(Object.values(REGIONS.hue.dishes).map((id) => DISHES[id].name).sort());
  const dish = await clickDish(page, 'low');
  expect(dish.name).toBe(DISHES[REGIONS.hue.dishes.low].name);
  await expect(page.locator('.popup')).toContainText(dish.name, SLOW);
  await expect(hud(page)).toContainText(`${COPY.hud.score}:${dish.points}/${LEVELS[1].targetScore}`);
  await expectNoErrors(errors);
});

// Every weapon must warn and hit the same way. Hands and nan fans are
// tried on level 3, electric swatters on level 4 where they first appear.
const WEAPON_LEVEL = { hand: 2, fan: 2, swatter: 3 };
for (const [weapon, levelIndex] of Object.entries(WEAPON_LEVEL)) {
  test(`a ${weapon} strike shows the warning zone, hits only inside it`, async ({ page }) => {
    const errors = await openGame(page);
    await goToLevel(page, levelIndex);
    // Only the diner under test strikes, aimed at the fly; with `escape`
    // the fly darts out of the zone as soon as it appears.
    const strike = (escape) =>
      page.evaluate(
        ({ weapon, escape }) => {
          const r = window.__app.round;
          const npc = r.npcs.find((n) => n.weapon === weapon);
          for (const n of r.npcs) n.cooldown = Infinity;
          r.fly.invincibleUntil = 0;
          r.fly.x = npc.x + 0.3;
          r.fly.z = npc.z + 1.2;
          npc.startWindup(r.fly);
          if (escape) r.fly.x += npc.x > 0 ? -2.5 : 2.5;
          return npc.zone.visible;
        },
        { weapon, escape },
      );
    const idle = () => page.evaluate((weapon) => window.__app.round.npcs.find((n) => n.weapon === weapon).state === 'idle', weapon);

    expect(await strike(true)).toBe(true);
    await expect.poll(idle).toBe(false);
    await expect.poll(idle, SLOW).toBe(true);
    expect(await fullHearts(page)).toBe(3);

    expect(await strike(false)).toBe(true);
    await expect.poll(() => fullHearts(page), SLOW).toBe(2);
    await expect(page.locator('.popup.hit')).toHaveText(new RegExp(COPY.hit.join('|')));
    await expectNoErrors(errors);
  });
}

test('level 3 is Hội An with chè as a bonus and a nan fan among the diners', async ({ page }) => {
  const errors = await openGame(page);
  await goToLevel(page, 2);
  await expect(hud(page)).toContainText(levelName(2));
  const { served, weapons } = await page.evaluate(() => {
    const r = window.__app.round;
    return { served: [...new Set(r.foods.map((f) => f.info.name))].sort(), weapons: r.npcs.map((n) => n.weapon) };
  });
  const expected = [...Object.values(REGIONS.hoian.dishes), 'che'].map((id) => DISHES[id].name).sort();
  expect(served).toEqual(expected);
  expect(weapons).toContain('fan');
  const dish = await clickDish(page, 'bonus');
  expect(dish.name).toBe(DISHES.che.name);
  await expect(page.locator('.popup')).toContainText(dish.name, SLOW);
  await expect(hud(page)).toContainText(`${COPY.hud.score}:${dish.points}/${LEVELS[2].targetScore}`);
  await expectNoErrors(errors);
});

test('level 4 is the Sài Gòn alley with hủ tiếu and cơm tấm, and a swatter among the diners', async ({ page }) => {
  const errors = await openGame(page);
  await goToLevel(page, 3);
  await expect(hud(page)).toContainText(levelName(3));
  const { served, weapons } = await page.evaluate(() => {
    const r = window.__app.round;
    return { served: [...new Set(r.foods.map((f) => f.info.name))].sort(), weapons: r.npcs.map((n) => n.weapon) };
  });
  const expected = [...Object.values(REGIONS.saigon.dishes), ...REGIONS.saigon.bonus].map((id) => DISHES[id].name).sort();
  expect(served).toEqual(expected);
  expect(weapons).toEqual(expect.arrayContaining(['hand', 'fan', 'swatter']));
  // Four diners strike often here; keep them eating so the fly can finish.
  await page.evaluate(() => {
    for (const n of window.__app.round.npcs) n.cooldown = Infinity;
  });
  const dish = await clickDish(page, 'medium');
  expect(dish.name).toBe(DISHES[REGIONS.saigon.dishes.medium].name);
  await expect(page.locator('.popup')).toContainText(dish.name, SLOW);
  await expect(hud(page)).toContainText(`${COPY.hud.score}:${dish.points}/${LEVELS[3].targetScore}`);
  await expectNoErrors(errors);
});

test('level 5 is the night market with lẩu, ốc xào, bánh tráng nướng, chè and xiên que, and all three weapons', async ({ page }) => {
  const errors = await openGame(page);
  await goToLevel(page, 4);
  await expect(hud(page)).toContainText(levelName(4));
  const { served, weapons } = await page.evaluate(() => {
    const r = window.__app.round;
    return { served: [...new Set(r.foods.map((f) => f.info.name))].sort(), weapons: r.npcs.map((n) => n.weapon) };
  });
  const expected = [...Object.values(REGIONS.nightmarket.dishes), ...REGIONS.nightmarket.bonus].map((id) => DISHES[id].name).sort();
  expect(served).toEqual(expected);
  expect(new Set(weapons)).toEqual(new Set(['hand', 'fan', 'swatter']));
  // Five diners strike often here; keep them eating so the fly can finish.
  await page.evaluate(() => {
    for (const n of window.__app.round.npcs) n.cooldown = Infinity;
  });
  const dish = await clickDish(page, 'low');
  expect(dish.name).toBe(DISHES[REGIONS.nightmarket.dishes.low].name);
  await expect(page.locator('.popup')).toContainText(dish.name, SLOW);
  await expect(hud(page)).toContainText(`${COPY.hud.score}:${dish.points}/${LEVELS[4].targetScore}`);
  await expectNoErrors(errors);
});
