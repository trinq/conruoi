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
} from './game.js';

test('home screen shows the shop sign and menu, Enter starts level 1', async ({ page }) => {
  const errors = await openGame(page);
  await expect(page.locator('.title-sign')).toContainText(COPY.title);
  await expect(page.locator('.title-sign')).toContainText(COPY.slogan);
  await expect(board(page)).toContainText(COPY.menuTitle);
  await expect(board(page)).toContainText(COPY.menu.play[0]);
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
  await expect(hud(page)).toContainText(`${COPY.hud.score}:${dish.points}/${LEVELS[0].targetScore}`, { timeout: 15_000 });
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

test('reaching the target moves on to the next level', async ({ page }) => {
  const errors = await openGame(page);
  await startGame(page);
  await finishLevel(page);
  await expect(page.locator('.banner')).toHaveText(COPY.targetReached);
  await waitForMode(page, 'result');
  await expect(board(page)).toContainText(COPY.levelDone(0));
  await page.keyboard.press('Enter');
  await waitForMode(page, 'play');
  await expect(hud(page)).toContainText(levelName(1));
  await expectNoErrors(errors);
});

test('finishing all five levels shows the victory board', async ({ page }) => {
  const errors = await openGame(page);
  await startGame(page);
  for (let i = 0; i < LEVELS.length; i++) {
    await expect(hud(page)).toContainText(levelName(i));
    await finishLevel(page);
    await waitForMode(page, 'result');
    if (i < LEVELS.length - 1) await page.keyboard.press('Enter');
  }
  await expect(board(page)).toContainText(COPY.victory);
  await board(page).getByRole('button', { name: COPY.home }).click();
  await waitForMode(page, 'menu');
  await expect(page.locator('.title-sign')).toContainText(COPY.title);
  await expectNoErrors(errors);
});

test('movement works with a Vietnamese input method switched on', async ({ page }) => {
  const errors = await openGame(page);
  await startGame(page);
  const x = () => page.evaluate(() => window.__app.round.fly.x);
  const before = await x();
  // Telex/VNI send keyCode 229 and key "Process", but code names the key.
  await page.evaluate(() => {
    const ev = (type) => {
      const e = new KeyboardEvent(type, { key: 'Process', code: 'KeyD', bubbles: true });
      Object.defineProperty(e, 'keyCode', { get: () => 229 });
      return e;
    };
    window.dispatchEvent(ev('keydown'));
    setTimeout(() => window.dispatchEvent(ev('keyup')), 400);
  });
  await expect.poll(x).toBeGreaterThan(before + 0.1);
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
  await expect(page.locator('.popup')).toContainText(dish.name, { timeout: 15_000 });
  await expect(hud(page)).toContainText(`${COPY.hud.score}:${dish.points}/${LEVELS[1].targetScore}`);
  await expectNoErrors(errors);
});
