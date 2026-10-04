# Con Ruồi

A low-poly 3D browser game: you are a fly at a Vietnamese street food stall. Land on phở, bún, cơm and chè to score points, and get away before the diners slap you.

Built with [three.js](https://threejs.org). Every model (trees, stall, tables, dishes, diners, the fly) and every sound effect is generated in code, so there are no art or audio files.

**Play:** https://trinq.github.io/conruoi/

## Controls

- **WASD** or **arrow keys**: fly (works with Vietnamese input methods on)
- **Click a dish**: fly to it, land and eat
- **Red zone on the table**: a hand is about to slap there; move away
- **M**: mute / unmute

On a phone or touchscreen:

- **Drag on the left side**: a joystick appears under your thumb; push further to fly faster

## Development

```bash
npm install
npm run dev           # dev server
npm run build         # static build in dist/
npm run check:levels  # validate src/levels.js
npm run test:e2e      # play the game in Chromium (Playwright)
```

The browser tests run in two Playwright projects: `desktop` plays the whole game with keyboard and mouse, and `phone` (a landscape Android phone with touch) plays only the touch scenarios in `tests/e2e/touch.spec.js`.

On a machine that already has Chromium, point the tests at it with `CHROMIUM_PATH=/path/to/chromium npm run test:e2e`; otherwise run `npx playwright install chromium` once. Every pull request runs the level check, the build and the browser tests in GitHub Actions (`.github/workflows/ci.yml`).

Code layout:

- `src/world/`: renderer, camera and lights (`Stage.js`), scenery (`environment.js`), low-poly model factories (`models.js`)
- `src/world/scenes/`: one street scene per region (Hà Nội, Huế, Hội An, the Sài Gòn alley and night market), built from the shared Vietnamese street kit in `src/world/kit.js`
- `src/game/`: gameplay (`Round.js` runs one level; `Fly.js`, `Npc.js`, `Food.js`, `Table.js`)
- `src/input/`: keyboard movement (`moveKeys.js`), touch vs mouse/keyboard detection (`inputMode.js`) and the floating touch joystick (`touchStick.js`)
- `src/ui/`: HTML HUD, menus and result boards over the canvas, and the S-shaped journey map shown between levels (`journeyMap.js`)
- `src/audio/`: synthesized sound effects and the Web Audio player
- `src/regions.js`: the five stops of the trip and the dishes each one serves
- `src/game/dishes.js`: dish catalogue and score tiers
- `src/bestScore.js`: the best total score ("Kỷ lục"), kept in localStorage when it is available
- `src/copy.js`: every string the player reads
- `src/levels.js`: level layouts and difficulty

Pushing to `main` builds and deploys to GitHub Pages (`.github/workflows/deploy.yml`). The spec is in `SPEC.md`, tickets are in `.scratch/con-ruoi-game/issues/`.
