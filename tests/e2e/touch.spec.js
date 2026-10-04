// Touch scenarios, run only by the phone project (a landscape Android phone,
// see playwright.config.js).
import { test, expect } from '@playwright/test';
import { COPY } from '../../src/copy.js';
import { openGame, tapToStart, calmDiners, flyState, fingers, expectNoErrors, SLOW } from './game.js';

const joystick = (page) => page.locator('.joystick');

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
