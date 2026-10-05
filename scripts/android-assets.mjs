// Draws the Android launcher icons and launch screens from the game's own
// SVG mascot on the red shop sign, and renders them to the PNG sizes Android
// wants under android/app/src/main/res. No hand-made art files: rerun this
// after changing the mascot or the sign.
//
//   node scripts/android-assets.mjs        (CHROMIUM_PATH=... to pick a browser)
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { MASCOT, WINGS } from '../src/ui/mascot.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const res = join(root, 'android/app/src/main/res');

const RED = '#c8102e';
const RED_DARK = '#7f0a1d';
const YELLOW = '#ffd200';

const mascot = (x, y, scale) =>
  `<g transform="translate(${x} ${y}) scale(${scale})">
     <style>.wings ellipse { fill: ${WINGS.fill}; stroke: ${WINGS.stroke}; stroke-width: ${WINGS.strokeWidth}; }</style>
     ${MASCOT}
   </g>`;

// The sign's look: red board, dark red rim, yellow pinstripe inside.
const sign = (w, h, r, inset) => `
  <rect x="0" y="0" width="${w}" height="${h}" rx="${r}" fill="${RED_DARK}"/>
  <rect x="${inset * 0.35}" y="${inset * 0.35}" width="${w - inset * 0.7}" height="${h - inset * 0.7}" rx="${r * 0.85}" fill="${RED}"/>
  <rect x="${inset}" y="${inset}" width="${w - inset * 2}" height="${h - inset * 2}" rx="${r * 0.6}" fill="none" stroke="${YELLOW}" stroke-width="${inset * 0.3}"/>`;

const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;

// Square legacy icon: the sign with the mascot filling it.
const icon = () => svg(108, 108, sign(108, 108, 22, 10) + mascot(54, 57, 2.55));
// Round legacy icon.
const roundIcon = () =>
  svg(
    108,
    108,
    `<circle cx="54" cy="54" r="54" fill="${RED_DARK}"/><circle cx="54" cy="54" r="50" fill="${RED}"/>
     <circle cx="54" cy="54" r="44" fill="none" stroke="${YELLOW}" stroke-width="3"/>` + mascot(54, 57, 2.4),
  );
// Adaptive icon foreground: the mascot inside the 66-unit safe circle; the
// background is the red colour resource.
const foreground = () => svg(108, 108, mascot(54, 56, 2));

const font = (pkg, file) =>
  `data:font/woff2;base64,${readFileSync(join(root, 'node_modules/@fontsource', pkg, 'files', file)).toString('base64')}`;
const FONTS = `@font-face { font-family: 'Paytone One'; src: url(${font('paytone-one', 'paytone-one-vietnamese-400-normal.woff2')}); unicode-range: U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB; }
  @font-face { font-family: 'Paytone One'; src: url(${font('paytone-one', 'paytone-one-latin-400-normal.woff2')}); }`;

// Launch screen: red board with the pinstripe, mascot over "CON RUỒI".
const splash = (w, h) => {
  const s = Math.min(w, h);
  const inset = s * 0.05;
  const title = s * 0.17;
  return svg(
    w,
    h,
    `<style>${FONTS}</style>
     <rect width="${w}" height="${h}" fill="${RED}"/>
     <rect x="${inset}" y="${inset}" width="${w - inset * 2}" height="${h - inset * 2}" rx="${inset * 0.8}" fill="none" stroke="${YELLOW}" stroke-width="${s * 0.012}"/>
     ${mascot(w / 2, h / 2 - s * 0.12, s * 0.0105)}
     <text x="${w / 2}" y="${h / 2 + s * 0.3}" text-anchor="middle" font-family="Paytone One" font-size="${title}"
       fill="${YELLOW}" stroke="${RED_DARK}" stroke-width="${title * 0.03}" paint-order="stroke">CON RUỒI</text>`,
  );
};

const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
const SPLASH = { mdpi: [480, 320], hdpi: [800, 480], xhdpi: [1280, 720], xxhdpi: [1600, 960], xxxhdpi: [1920, 1280] };

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage();

async function render(markup, width, height, file, transparent = false) {
  await page.setViewportSize({ width, height });
  await page.setContent(
    `<html><body style="margin:0;background:transparent">${markup.replace(/width="[\d.]+" height="[\d.]+">/, `width="${width}" height="${height}">`)}</body></html>`,
  );
  await page.evaluate(() => document.fonts.ready);
  const out = join(res, file);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, await page.screenshot({ omitBackground: transparent, clip: { x: 0, y: 0, width, height } }));
}

for (const [d, k] of Object.entries(DENSITIES)) {
  await render(icon(), 48 * k, 48 * k, `mipmap-${d}/ic_launcher.png`, true);
  await render(roundIcon(), 48 * k, 48 * k, `mipmap-${d}/ic_launcher_round.png`, true);
  await render(foreground(), 108 * k, 108 * k, `mipmap-${d}/ic_launcher_foreground.png`, true);
  const [w, h] = SPLASH[d];
  await render(splash(w, h), w, h, `drawable-land-${d}/splash.png`);
  await render(splash(h, w), h, w, `drawable-port-${d}/splash.png`);
}
await render(splash(480, 320), 480, 320, 'drawable/splash.png');
await browser.close();

// The adaptive icon's background is the sign red; the template's vector
// placeholders are not used.
writeFileSync(
  join(res, 'values/ic_launcher_background.xml'),
  `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${RED}</color>\n</resources>\n`,
);
rmSync(join(res, 'drawable/ic_launcher_background.xml'), { force: true });
rmSync(join(res, 'drawable-v24'), { recursive: true, force: true });
console.log('Android icons and splash screens written to', res);
