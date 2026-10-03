// Helpers for driving the game through its development hook (window.__app).
import { expect } from '@playwright/test';

export async function openGame(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto('/');
  await page.waitForFunction(() => window.__app);
  return errors;
}

// Waits until the game shows `mode` and no fade is running.
export async function waitForMode(page, mode) {
  await page.waitForFunction((m) => window.__app.mode === m && !window.__app.ui.fading, mode, { timeout: 30_000 });
}

export async function startGame(page) {
  await page.keyboard.press('Enter');
  await waitForMode(page, 'play');
}

export const hud = (page) => page.locator('.hud');
export const board = (page) => page.locator('.board');

export async function fullHearts(page) {
  return page.locator('.hud .heart-full').count();
}

// Clicks the first ready dish of `tier` and returns its catalogue entry.
export async function clickDish(page, tier) {
  const target = await page.evaluate((tier) => {
    const app = window.__app;
    const food = app.round.foods.find((f) => f.ready && f.info.tier === tier);
    const p = app.stage.project(food.model.position.clone().setY(food.model.position.y + 0.08));
    return { x: p.x, y: p.y, points: food.info.points, name: food.info.name };
  }, tier);
  await page.mouse.click(target.x, target.y);
  return target;
}

// A diner's strike lands exactly where the fly is (bypassing the wait for
// one to wind up), with any remaining i-frames cleared first.
export async function strikeFly(page) {
  await page.evaluate(() => {
    const r = window.__app.round;
    r.fly.invincibleUntil = 0;
    r.onSlap(r.fly.x, r.fly.z);
  });
}

// Feeds the fly until the level target is reached.
export async function finishLevel(page) {
  await page.evaluate(() => {
    const r = window.__app.round;
    while (!r.over) r.onEat(r.foods[0]);
  });
}

export async function expectNoErrors(errors) {
  expect(errors, errors.join('\n')).toEqual([]);
}
