// Phone layout scenarios, run only by the phone project (see
// playwright.config.js): boards fit the screen, the rotate hint.
import { test, expect } from '@playwright/test';
import { COPY } from '../../src/copy.js';
import { openGame, waitForMode, expectNoErrors } from './game.js';

// Every board the player can meet, shown through the app the way the game
// flow shows them.
const BOARDS = {
  menu: (app) => app.showMenu(),
  howTo: (app) => app.ui.showHowTo(),
  map: (app) => app.showLevelComplete({ levelIndex: 1, levelScore: 120, totalScore: 200, lives: 2 }),
  victory: (app) => app.showLevelComplete({ levelIndex: 4, levelScore: 380, totalScore: 900, lives: 1 }),
  gameOver: (app) => app.showGameOver({ levelIndex: 2, totalScore: 300 }),
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
