// Phone layout scenarios, run only by the phone project (see
// playwright.config.js): boards fit the screen, the rotate hint.
import { test, expect } from '@playwright/test';
import { COPY } from '../../src/copy.js';
import { openGame, waitForMode, tapToStart, fullHearts, board, expectNoErrors, SLOW } from './game.js';

// Every board the player can meet, shown through the app the way the game
// flow shows them.
const BOARDS = {
  menu: (app) => app.showMenu(),
  howTo: (app) => app.ui.showHowTo(),
  map: (app) => app.showLevelComplete({ levelIndex: 1, levelScore: 120, totalScore: 200, lives: 2 }),
  victory: (app) => app.showLevelComplete({ levelIndex: 4, levelScore: 380, totalScore: 900, lives: 1 }),
  gameOver: (app) => app.showGameOver({ levelIndex: 2, totalScore: 300 }),
  pause: (app) => app.ui.showPause({}),
};

// The board's box (and the sign beside it) lies inside the viewport, the
// screen does not scroll, and every button is at least 44 x 44 CSS px.
async function fits(page) {
  return page.evaluate(() => {
    for (const a of document.getAnimations()) if (a.effect?.getTiming().iterations !== Infinity) a.finish();
    const screen = document.querySelector('.screen');
    const out = [];
    for (const node of screen.children) {
      const r = node.getBoundingClientRect();
      if (r.left < 0 || r.top < 0 || r.right > innerWidth || r.bottom > innerHeight) out.push(`${node.className} at ${Math.round(r.left)},${Math.round(r.top)}-${Math.round(r.right)},${Math.round(r.bottom)}`);
    }
    if (screen.scrollHeight > screen.clientHeight) out.push(`scrolls by ${screen.scrollHeight - screen.clientHeight}`);
    for (const b of screen.querySelectorAll('button')) {
      if (b.offsetWidth < 44 || b.offsetHeight < 44) out.push(`button "${b.textContent}" is ${b.offsetWidth} x ${b.offsetHeight}`);
    }
    return out;
  });
}

for (const size of [null, { width: 740, height: 360 }]) {
  test(`every board fits the screen without scrolling at ${size ? `${size.width} x ${size.height}` : 'the phone size'}`, async ({ page }) => {
    if (size) await page.setViewportSize(size);
    const errors = await openGame(page);
    for (const [name, show] of Object.entries(BOARDS)) {
      await page.evaluate(`(${show})(window.__app)`);
      await expect(page.locator('.screen .board')).toBeVisible();
      expect(await fits(page), name).toEqual([]);
    }
    await expectNoErrors(errors);
  });
}

test('holding the phone upright shows the rotate hint; turning it back removes it', async ({ page }) => {
  const errors = await openGame(page);
  const hint = page.locator('.rotate');
  await expect(hint).toBeHidden();
  await page.setViewportSize({ width: 412, height: 915 });
  await expect(hint).toBeVisible();
  await expect(hint).toContainText(COPY.rotate);
  await page.setViewportSize({ width: 915, height: 412 });
  await expect(hint).toBeHidden();
  await waitForMode(page, 'menu');
  await expectNoErrors(errors);
});

const pauseBoard = (page) => board(page).filter({ hasText: COPY.pause.title });
const gameTime = (page) => page.evaluate(() => window.__app.round.time);

test('the pause sign freezes a strike in mid-air; "Bay tiếp" lets it land', async ({ page }) => {
  const errors = await openGame(page);
  await tapToStart(page, COPY.menu.play[0]);

  await page.getByRole('button', { name: COPY.pause.button }).tap();
  await expect(pauseBoard(page)).toBeVisible();
  await pauseBoard(page).getByRole('button', { name: COPY.pause.resume[0] }).tap();
  await waitForMode(page, 'play');

  // A diner winds up over the fly, and the ⏸ sign is pressed at once.
  await page.evaluate(() => {
    const r = window.__app.round;
    const npc = r.npcs[0];
    r.fly.invincibleUntil = 0;
    r.fly.x = npc.x + 0.3;
    r.fly.z = npc.z + 1.2;
    npc.startWindup(r.fly);
    document.querySelector('.pause-btn').click();
  });
  await expect(pauseBoard(page)).toBeVisible();
  const t0 = await gameTime(page);
  await page.waitForTimeout(3000);
  expect(await gameTime(page)).toBe(t0);
  expect(await fullHearts(page)).toBe(3);
  expect(await page.evaluate(() => window.__app.round.npcs[0].state)).toBe('windup');

  await pauseBoard(page).getByRole('button', { name: COPY.pause.resume[0] }).tap();
  await expect.poll(() => fullHearts(page), SLOW).toBe(2);
  await expectNoErrors(errors);
});

test('leaving the app pauses the level, and "Về quán" goes home', async ({ page }) => {
  const errors = await openGame(page);
  await tapToStart(page, COPY.menu.play[0]);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(pauseBoard(page)).toBeVisible();
  await pauseBoard(page).getByRole('button', { name: COPY.pause.home[0] }).tap();
  await waitForMode(page, 'menu');
  await expect(board(page)).toContainText(COPY.menuTitle);
  await expectNoErrors(errors);
});

test('turning the phone upright during a level pauses it', async ({ page }) => {
  const errors = await openGame(page);
  await tapToStart(page, COPY.menu.play[0]);
  await page.setViewportSize({ width: 412, height: 915 });
  await expect(page.locator('.rotate')).toBeVisible();
  await waitForMode(page, 'paused');
  await page.setViewportSize({ width: 915, height: 412 });
  await expect(page.locator('.rotate')).toBeHidden();
  await expect(pauseBoard(page)).toBeVisible();
  await pauseBoard(page).getByRole('button', { name: COPY.pause.resume[0] }).tap();
  await waitForMode(page, 'play');
  await expectNoErrors(errors);
});

// Records navigator.vibrate calls instead of buzzing.
async function recordVibrations(page) {
  await page.addInitScript(() => {
    window.__vibrations = [];
    navigator.vibrate = (pattern) => {
      window.__vibrations.push(pattern);
      return true;
    };
  });
}
const vibrations = (page) => page.evaluate(() => window.__vibrations.length);
const strike = (page) =>
  page.evaluate(() => {
    const r = window.__app.round;
    r.fly.invincibleUntil = 0;
    r.onSlap(r.fly.x, r.fly.z);
  });

test('the how-to board shows touch instructions and a Báo lỗi link', async ({ page }) => {
  const errors = await openGame(page);
  await page.getByRole('button', { name: COPY.menu.howTo[0] }).tap();
  for (const [, title, text] of COPY.howToTouch) {
    await expect(board(page)).toContainText(title);
    await expect(board(page)).toContainText(text);
  }
  await expect(board(page)).not.toContainText(COPY.howTo[3][1]);
  const report = board(page).getByRole('link', { name: COPY.report });
  await expect(report).toHaveAttribute('href', COPY.reportUrl);
  await expectNoErrors(errors);
});

test('a hit vibrates while Rung is on; switched off it stays still, also after a reload', async ({ page }) => {
  await recordVibrations(page);
  const errors = await openGame(page);
  const rung = () => board(page).locator('.chalk-item', { hasText: COPY.menu.vibrate(true)[0] });
  await expect(rung()).toContainText(COPY.menu.vibrate(true)[1]);

  await tapToStart(page, COPY.menu.play[0]);
  await strike(page);
  await expect.poll(() => vibrations(page)).toBe(1);

  // Off from the pause board.
  await page.getByRole('button', { name: COPY.pause.button }).tap();
  await rung().tap();
  await expect(rung()).toContainText(COPY.menu.vibrate(false)[1]);
  await board(page).getByRole('button', { name: COPY.pause.resume[0] }).tap();
  await waitForMode(page, 'play');
  await strike(page);
  await expect.poll(() => fullHearts(page)).toBe(1);
  expect(await vibrations(page)).toBe(1);

  await page.reload();
  await page.waitForFunction(() => window.__app);
  await expect(rung()).toContainText(COPY.menu.vibrate(false)[1]);
  await expectNoErrors(errors);
});
