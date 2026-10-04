# 09: Phát hành Google Play

**What to build:** The `release-android` workflow also builds a signed AAB for Play (Play App Signing; the maintainer's upload key). A static privacy policy page (`/privacy.html`, Vietnamese and English: no data collected, no ads, no crash reporting, no network calls) deploys with GitHub Pages. Store listing text lives in the repo: title "Con Ruồi: Xuyên Việt", short and full description in Vietnamese plus a short English version. A script generates the 512 × 512 icon, the 1024 × 500 feature graphic and landscape phone screenshots (home, Hà Nội, Hội An at sunset, night market, journey map) for review. `versionName` becomes `1.0.0`. A checklist covers the maintainer's own steps: personal Play account, upload key, content rating (13+, cartoon slapstick, mild crude humour), Data safety (no data), all countries, closed test with 15–20 testers for 14 days, then production.

**Blocked by:** 08

**PR:** E

**Status:** ready-for-agent

- [ ] Signed AAB built by the release workflow
- [ ] Privacy page live on GitHub Pages
- [ ] Listing text and generated graphics in the repo, reviewed by the maintainer
- [ ] Maintainer checklist in the repo
