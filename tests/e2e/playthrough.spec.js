import { test, expect } from '@playwright/test';
import { COPY, levelName } from '../../src/copy.js';
import { LEVELS } from '../../src/levels.js';
import { openGame, waitForMode, startGame, hud, board, fullHearts, clickDish, strikeFly, finishLevel, expectNoErrors } from './game.js';

test('home screen starts level 1 with Enter', async ({ page }) => {
  const errors = await openGame(page);
  await expect(board(page)).toContainText(COPY.title);
  await startGame(page);
  await expect(hud(page)).toContainText(levelName(0));
  expect(await fullHearts(page)).toBe(3);
  await expectNoErrors(errors);
});

test('clicking a dish lands the fly and eating scores its points', async ({ page }) => {
  const errors = await openGame(page);
  await startGame(page);
  const dish = await clickDish(page, 'low');
  await expect(hud(page)).toContainText(`${dish.points} / ${LEVELS[0].targetScore}`, { timeout: 15_000 });
  await expect(page.locator('.popup')).toContainText(dish.name);
  await expectNoErrors(errors);
});

test('a strike costs a life and losing all lives ends the game', async ({ page }) => {
  const errors = await openGame(page);
  await startGame(page);
  await strikeFly(page);
  await expect.poll(() => fullHearts(page)).toBe(2);
  await strikeFly(page);
  await strikeFly(page);
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
