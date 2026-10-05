# Con Ruồi

A low-poly 3D browser game: you are a fly at a Vietnamese street food stall. Land on phở, bún, cơm and chè to score points, and get away before the diners slap you.

Built with [three.js](https://threejs.org). Every model (trees, stall, tables, dishes, diners, the fly) and every sound effect is generated in code, so there are no art or audio files.

**Play:** https://trinq.github.io/conruoi/

## Controls

- **WASD** or **arrow keys**: fly (works with Vietnamese input methods on)
- **Click a dish**: fly to it, land and eat
- **Red zone on the table**: a hand is about to slap there; move away
- **M**: mute / unmute
- **P** or **Esc** (or the ⏸ sign): pause; "Bay tiếp" resumes

On a phone or touchscreen:

- **Drag on the left side**: a joystick appears under your thumb; push further to fly faster
- **Tap a dish** (or just beside it): fly to it, land and eat; works while the other thumb is on the joystick
- **Fly onto a dish and let go of the joystick**: land and eat
- **⏸**: pause; the menu and the pause board have a "Rung" item to turn vibration off

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
- `src/input/`: keyboard movement (`moveKeys.js`), touch vs mouse/keyboard detection (`inputMode.js`) and the floating touch joystick (`touchStick.js`) and touch taps (`touchTaps.js`)
- `src/ui/`: HTML HUD, menus and result boards over the canvas, and the S-shaped journey map shown between levels (`journeyMap.js`)
- `src/audio/`: synthesized sound effects, the street ambience mixed per region (`Ambience.js`) and the Web Audio player
- `src/regions.js`: the five stops of the trip and the dishes each one serves
- `src/game/dishes.js`: dish catalogue and score tiers
- `src/haptics.js`: vibration on a hit and on game over, and the "Rung" setting
- `src/bestScore.js`: the best total score ("Kỷ lục"), kept in localStorage when it is available
- `src/copy.js`: every string the player reads
- `src/levels.js`: level layouts and difficulty

Pushing to `main` builds and deploys to GitHub Pages (`.github/workflows/deploy.yml`). Pushes to `claude/*` branches run the same deploy, which also publishes a preview of every open pull request from this repo at `https://trinq.github.io/conruoi/pr/<number>/`, so a PR can be tried on a phone before it is merged; a closed PR's preview goes away with the next deploy. Opening a PR re-runs the deploy (`.github/workflows/preview-on-open.yml`), so its preview is there from the start. The spec is in `SPEC.md`, tickets are in `.scratch/con-ruoi-game/issues/`.
