# 07: App Android bằng Capacitor

**What to build:** A Capacitor Android project (`android/`, committed) that loads the built `dist/` offline. App id `io.github.trinq.conruoi`, launcher name "Con Ruồi", landscape-locked, immersive full screen, no permissions, targeting Android 16 (API 36). Icon and splash are drawn in code (SVG nón lá mascot on the red sign) and rendered to PNG by a script. The Back button pauses during play, resumes from the pause board, leaves the how-to, goes home from result boards and exits from the home screen. App backgrounding pauses (Capacitor `pause` event); haptics go through the Capacitor Haptics plugin. `npm run android:sync` builds and copies the web app.

**Blocked by:** 04, 05

**PR:** D

**Status:** ready-for-agent

- [ ] App builds and runs offline with the generated icon and splash, landscape and full screen
- [x] Back button behaves as above; backgrounding pauses
- [ ] Haptics through the plugin, following the Rung setting
- [ ] Kỷ lục and settings survive closing and reopening the app
