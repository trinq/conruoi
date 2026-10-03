# 01: Nền móng: dữ liệu vùng, test, CI

**What to build:** Prefactor so later tickets only add content. Each level describes its region (id, tên vùng, thời điểm trong ngày, bộ cảnh, món theo mức, món bonus, bộ vũ khí). Dishes come from one catalogue keyed by id with a tier that sets default points and eat time. The environment builder and lighting take a region. Player-facing strings move into one copy deck. The game still looks and plays like today (existing scenery used as a placeholder for every region). A Playwright playthrough command and the extended level check run on every pull request.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Every level declares region, time of day and weapon mix; the five regions follow the agreed route (Hà Nội, Huế, Hội An, hẻm Sài Gòn, chợ đêm Sài Gòn)
- [ ] Dish catalogue with tiers high / medium / low / bonus (30 pts 2.2 s, 20 / 1.6 s, 10 / 1.0 s, 40 / 1.2 s); levels reference dishes by id
- [ ] Lighting presets for sáng sớm, trưa, hoàng hôn, chiều, đêm selected from the level's time of day
- [ ] All player-facing text comes from a single copy deck
- [ ] Level check also validates: dishes exist, one dish per tier per level plus bonus, weapon schedule (tay only in 1–2, quạt nan from 3, vợt điện from 4), every level has region and time of day
- [ ] `npm run test:e2e` drives the real game in Chromium: start, eat a dish (score rises by its points), lose a life in a strike zone, lose all lives, win a level, finish all five, IME keystroke moves the fly, no console errors
- [ ] GitHub Actions runs the level check and the e2e test on every pull request
