// Helpers for driving the game through its development hook (window.__app).
import { expect } from '@playwright/test';

// For waits that run on game time (flying, eating, a strike). Game time
// advances at most 50 ms per frame, and software WebGL on CI draws only a
// few frames a second, so these can take far longer than they would in play.
export const SLOW = { timeout: 45_000 };

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

// From the home screen, plays through to level `index` (0-based) by
// finishing every level before it.
export async function goToLevel(page, index) {
  await startGame(page);
  for (let i = 0; i < index; i++) {
    await finishLevel(page);
    await waitForMode(page, 'result');
    await page.keyboard.press('Enter');
    await waitForMode(page, 'play');
  }
}

export async function expectNoErrors(errors) {
  expect(errors, errors.join('\n')).toEqual([]);
}

// ----- touch -----

// Starts level 1 the way a phone player does: a tap on "Bay thôi".
export async function tapToStart(page, playLabel) {
  await page.getByRole('button', { name: playLabel }).tap();
  await waitForMode(page, 'play');
}

// Diners stop picking the fly as a target, so a slap can't knock it off
// course in the middle of a touch check.
export async function calmDiners(page) {
  await page.evaluate(() => {
    window.__app.round.fly.canBeTargeted = () => false;
  });
}

export async function flyState(page) {
  return page.evaluate(() => {
    const f = window.__app.round.fly;
    return { x: f.x, z: f.z, speed: f.speed, state: f.state };
  });
}

// Screen point of a ready dish (of `tier`, if given, and drawn right of
// `minX`), with its catalogue entry. With `beside`, the point is that many
// CSS px away from the dish, where a precise pick misses but the dish is
// still the nearest within a fingertip's reach.
export async function dishPoint(page, { tier, minX = 0, beside = 0 } = {}) {
  return page.evaluate(
    ({ tier, minX, beside }) => {
      const app = window.__app;
      const { round, stage } = app;
      const r = stage.renderer.domElement.getBoundingClientRect();
      const size = { width: r.width, height: r.height };
      const ndc = (x, y) => ({ x: (x / r.width) * 2 - 1, y: -(y / r.height) * 2 + 1 });
      for (const food of round.foods) {
        if (!food.ready || (tier && food.info.tier !== tier)) continue;
        const p = stage.project(food.model.position.clone().setY(food.model.position.y + 0.08));
        if (p.x < minX) continue;
        const entry = { points: food.info.points, name: food.info.name };
        if (!beside) return { x: p.x, y: p.y, ...entry };
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * Math.PI * 2;
          const x = p.x + Math.cos(a) * beside;
          const y = p.y + Math.sin(a) * beside;
          const at = ndc(x, y);
          if (!round.pick(at, stage.camera) && round.pickNear(at, stage.camera, 44, size) === food) return { x, y, ...entry };
        }
      }
      return null;
    },
    { tier, minX, beside },
  );
}

// Fingers on the touchscreen, sent through CDP so several can be down at
// once (Playwright's touchscreen only taps). Ids name the fingers.
export async function fingers(page) {
  const cdp = await page.context().newCDPSession(page);
  const down = new Map();
  const send = (type, touchPoints = [...down.values()]) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints });
  return {
    async down(id, x, y) {
      down.set(id, { id, x, y });
      await send('touchStart');
    },
    // Slides the finger to (x, y) in `steps` moves.
    async move(id, x, y, steps = 4) {
      const from = down.get(id);
      for (let i = 1; i <= steps; i++) {
        down.set(id, { id, x: from.x + ((x - from.x) * i) / steps, y: from.y + ((y - from.y) * i) / steps });
        await send('touchMove');
      }
    },
    // Chromium releases the points a touchEnd lists.
    async up(id) {
      const point = down.get(id);
      down.delete(id);
      await send('touchEnd', [point]);
    },
  };
}
