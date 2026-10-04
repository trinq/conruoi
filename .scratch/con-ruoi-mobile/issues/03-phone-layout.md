# 03: Bố cục điện thoại: ngang, safe area, bảng vừa màn hình

**What to build:** The game fits phone screens in landscape. `viewport-fit=cover` with `env(safe-area-inset-*)` padding keeps the HUD and boards clear of the notch, corners and navigation bar. Boards scale with `vh`-based clamps so every board (menu, how-to, journey map, game over, victory) fits 740 × 360 CSS px without scrolling, and touch targets are at least 44 × 44 CSS px. In a phone browser held upright, a "Xoay ngang điện thoại nhé!" chalkboard covers the game (and pauses a level once 04 lands).

**Blocked by:** None (can start immediately)

**PR:** B

**Status:** ready-for-agent

- [ ] HUD and boards stay inside the safe area
- [ ] Every board fits the phone viewport and 740 × 360 without scrolling; buttons are at least 44 × 44 CSS px
- [ ] Portrait shows the rotate hint; turning back to landscape removes it
- [ ] e2e (phone project): each board's bounding box lies inside the viewport at both sizes; portrait shows the hint
