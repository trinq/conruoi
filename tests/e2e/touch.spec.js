// Touch scenarios, run only by the phone project (a landscape Android phone,
// see playwright.config.js).
import { test, expect } from '@playwright/test';
import { COPY } from '../../src/copy.js';
import { LEVELS } from '../../src/levels.js';
import { openGame, tapToStart, calmDiners, flyState, fingers, dishPoint, hud, expectNoErrors, SLOW } from './game.js';

const joystick = (page) => page.locator('.joystick');
const scoreText = (score) => `${COPY.hud.score}:${score}/${LEVELS[0].targetScore}`;

test('dragging on the left shows the joystick and flies the fly; lifting the finger hides it', async ({ page }) => {
  const errors = await openGame(page);
  await tapToStart(page, COPY.menu.play[0]);
  await calmDiners(page);
  await expect(joystick(page)).toBeHidden();
  expect(await page.evaluate(() => window.__app.input.mode)).toBe('touch');

  const start = await flyState(page);
  const touch = await fingers(page);
  await touch.down(1, 170, 290);
  await expect(joystick(page)).toBeVisible();

  // Half a push flies slower than a full one.
  await touch.move(1, 200, 290);
  await page.waitForFunction(() => window.__app.round.fly.speed > 1.2, null, SLOW);
  expect((await flyState(page)).speed).toBeLessThan(2.8);
  await touch.move(1, 260, 290);
  await page.waitForFunction(() => window.__app.round.fly.speed > 3.6, null, SLOW);
  await page.waitForFunction((x0) => window.__app.round.fly.x > x0 + 1, start.x, SLOW);

  await touch.up(1);
  await expect(joystick(page)).toBeHidden();
  await page.waitForFunction(() => window.__app.round.fly.speed < 0.05, null, SLOW);
  await expectNoErrors(errors);
});

test('tapping a dish, or just beside it, lands the fly and scores its points', async ({ page }) => {
  const errors = await openGame(page);
  await tapToStart(page, COPY.menu.play[0]);
  await calmDiners(page);

  // Dishes on the right, away from the joystick side.
  const first = await dishPoint(page, { tier: 'low', minX: 915 * 0.5 });
  await page.touchscreen.tap(first.x, first.y);
  await expect(hud(page)).toContainText(scoreText(first.points), SLOW);
  await expect(page.locator('.popup')).toContainText(first.name);

  const beside = await dishPoint(page, { minX: 915 * 0.5, beside: 32 });
  expect(beside).not.toBeNull();
  await page.touchscreen.tap(beside.x, beside.y);
  await expect(hud(page)).toContainText(scoreText(first.points + beside.points), SLOW);
  await expectNoErrors(errors);
});

test('flying with one finger while tapping a dish with another still lands on the dish', async ({ page }) => {
  const errors = await openGame(page);
  await tapToStart(page, COPY.menu.play[0]);
  await calmDiners(page);

  const touch = await fingers(page);
  await touch.down(1, 170, 290);
  await touch.move(1, 140, 250);
  await page.waitForFunction(() => window.__app.round.fly.speed > 1.5, null, SLOW);

  // The thumb stays on the joystick while the other finger taps.
  const dish = await dishPoint(page, { minX: 915 * 0.5 });
  await touch.down(2, dish.x, dish.y);
  await touch.up(2);
  await expect(hud(page)).toContainText(scoreText(dish.points), SLOW);
  await expect(joystick(page)).toBeVisible();

  // Moving the thumb again takes off.
  await touch.move(1, 110, 290);
  await page.waitForFunction(() => window.__app.round.fly.state === 'flying' && window.__app.round.fly.speed > 1.5, null, SLOW);
  await touch.up(1);
  await expectNoErrors(errors);
});

test('a drag that starts on the right, even on a dish, neither flies nor lands the fly', async ({ page }) => {
  const errors = await openGame(page);
  await tapToStart(page, COPY.menu.play[0]);
  await calmDiners(page);

  const dish = await dishPoint(page, { minX: 915 * 0.5 });
  const touch = await fingers(page);
  await touch.down(1, dish.x, dish.y);
  await touch.move(1, dish.x + 80, dish.y);
  await touch.up(1);
  await expect(joystick(page)).toBeHidden();
  const t0 = await page.evaluate(() => window.__app.round.time);
  await page.waitForFunction((t) => window.__app.round.time > t + 600, t0, SLOW);
  const fly = await flyState(page);
  expect(fly.state).toBe('flying');
  expect(fly.speed).toBeLessThan(0.05);
  await expectNoErrors(errors);
});

test('flying onto a dish and letting go of the joystick lands and eats', async ({ page }) => {
  const errors = await openGame(page);
  await tapToStart(page, COPY.menu.play[0]);
  await calmDiners(page);

  // Put the fly just short of a dish, then nudge it there with the stick.
  const dish = await page.evaluate(() => {
    const r = window.__app.round;
    const food = r.foods.find((f) => f.ready);
    r.fly.x = food.x - 0.15;
    r.fly.z = food.z;
    return { points: food.info.points };
  });
  const touch = await fingers(page);
  await touch.down(1, 170, 290);
  await touch.move(1, 195, 290);
  await expect(joystick(page)).toBeVisible();
  await touch.up(1);
  await expect(hud(page)).toContainText(scoreText(dish.points), SLOW);
  await expectNoErrors(errors);
});

test('letting go of the joystick away from any dish does not land', async ({ page }) => {
  const errors = await openGame(page);
  await tapToStart(page, COPY.menu.play[0]);
  await calmDiners(page);
  const touch = await fingers(page);
  await touch.down(1, 170, 290);
  await touch.move(1, 195, 290);
  await touch.up(1);
  const t0 = await page.evaluate(() => window.__app.round.time);
  await page.waitForFunction((t) => window.__app.round.time > t + 600, t0, SLOW);
  expect((await flyState(page)).state).toBe('flying');
  await expectNoErrors(errors);
});
