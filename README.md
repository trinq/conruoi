# Con Ruồi

A pixel art browser game: you are a fly at a Vietnamese street food stall. Land on phở, bún and cơm to score points, and get away before the diners slap you.

**Play:** https://trinq.github.io/conruoi/

## Controls

- **WASD** or **arrow keys**: fly (isometric directions; works with Vietnamese input methods on)
- **Click a dish**: fly to it, land and eat
- **Red zone on the table**: a hand is about to slap there; move away
- **M**: mute / unmute

## Development

```bash
npm install
npm run dev           # dev server
npm run build         # static build in dist/
npm run check:levels  # validate src/levels.js
```

Pushing to `main` builds and deploys to GitHub Pages (`.github/workflows/deploy.yml`). The spec is in `SPEC.md`, tickets are in `.scratch/con-ruoi-game/issues/`.
