# 🪰 Con Ruồi trên điện thoại: bản Android - Spec

## Problem Statement

"Con Ruồi: Hành trình xuyên Việt" chỉ chơi được trên máy tính. Cách bay né cú đập dựa vào WASD hoặc phím mũi tên, nên trên điện thoại không có cách nào để bay. Các món ăn nhỏ, khó chạm trúng bằng ngón tay. Bóng đổ và số draw call (khoảng 127–301 mỗi màn) được chỉnh cho laptop có card đồ hoạ tích hợp, chưa từng đo trên máy Android tầm trung. Giao diện chưa tính tới màn hình nhỏ có tai thỏ và thanh điều hướng. Hướng dẫn chơi vẫn nói về phím M và WASD. Game cũng không có nút tạm dừng, nên khi chuyển app hay có cuộc gọi, ruồi cứ đứng đó chịu đòn.

Người chơi Việt Nam chủ yếu chơi game trên điện thoại, đa số là Android. Spec gốc ghi "phones are not a target", nên bản Android là một đợt việc mới chứ không chỉ là đóng gói lại.

## Solution

Giữ nguyên game hiện có (three.js, HTML overlay, mọi hình và âm thanh tạo bằng code) và làm cho nó chơi tốt bằng cảm ứng trên điện thoại, rồi bọc thành app Android bằng **Capacitor** để đưa lên Google Play. Chỉ có một codebase: bản web trên GitHub Pages cũng chơi được trên trình duyệt điện thoại, và app Android đóng gói đúng bản build đó, chạy offline.

| Phần | Máy tính (giữ nguyên) | Điện thoại |
|---|---|---|
| Bay | WASD / mũi tên | Joystick ảo nổi ở nửa trái màn hình |
| Đậu xuống ăn | Click vào món | Chạm vào món (vùng chạm nới rộng) |
| Tạm dừng | Không có (thêm phím P / Esc) | Nút ⏸ trên HUD, tự dừng khi app xuống nền |
| Tắt tiếng | Phím M, mục "Âm thanh" | Mục "Âm thanh", nút loa trong bảng tạm dừng |
| Đồ hoạ | "Đẹp" mặc định | Tự chọn mức theo máy, có thể chỉnh |
| Hướng màn hình | Tự do | Khoá ngang |

Luật chơi giữ nguyên: 3 mạng, vùng cảnh báo đỏ rồi mới đập, điểm theo mức món, 5 màn Bắc → Nam, bản đồ chữ S, Kỷ lục, âm thanh nền theo vùng.

Làm theo thứ tự này: làm cho bản web chơi tốt trên trình duyệt điện thoại trước (dễ thử và sửa nhanh qua GitHub Pages), rồi mới bọc Capacitor và phát hành.

## User Stories

### Điều khiển cảm ứng

1. As a phone player, I want to fly by dragging my left thumb anywhere on the left half of the screen, with a joystick appearing under my thumb, so that I can dodge without a keyboard.
2. As a phone player, I want the fly's speed to follow how far I push the joystick, so that I can make small careful moves near a dish.
3. As a phone player, I want to tap a dish with my right thumb to fly to it and eat, so that the click-to-land rule works the same on touch.
4. As a phone player, I want dishes to be easy to hit even when they look small on screen, so that I don't miss taps and get slapped.
5. As a phone player, I want to keep flying with one thumb while tapping a dish with the other, so that both hands work at once.
6. As a phone player, I want the joystick to disappear when I lift my thumb, so that it never covers the table.
7. As a phone player, I want short vibration when I get hit, so that I feel the slap even with sound off.
8. As a desktop player, I want the keyboard and mouse controls to stay exactly as they are, so that nothing I'm used to changes.

### Màn hình và bố cục

9. As a phone player, I want the game to stay in landscape, so that the street fits the screen.
10. As a phone browser player holding the phone upright, I want a chalkboard hint "Xoay ngang điện thoại nhé!", so that I know why the game is waiting.
11. As a phone player, I want the HUD, boards and buttons to stay clear of the notch, rounded corners and navigation bar, so that nothing is cut off.
12. As a phone player, I want every board (menu, how-to, map, game over, victory) to fit the screen without scrolling, so that I can always reach "Bay tiếp".
13. As a phone player, I want buttons at least the size of a fingertip, so that I don't press the wrong one.
14. As a phone player, I want the how-to board to show touch instructions (kéo ngón cái để bay, chạm vào món để ăn) instead of keys, so that the guide matches what I do.

### Tạm dừng và vòng đời app

15. As a phone player, I want a pause button on the HUD, so that I can stop when someone calls me.
16. As a phone player, I want the game to pause by itself when I switch apps, lock the screen or get a call, so that I don't lose lives while away.
17. As a player, I want a "Tạm nghỉ" chalkboard with "Bay tiếp", "Âm thanh" and "Về quán", so that I can resume, mute or quit.
18. As a player, I want game time, diners' strikes and sounds to freeze while paused, so that a pause is really a pause.
19. As a desktop player, I want P or Esc to pause too, so that pausing works on every device.
20. As an Android player, I want the Back button to pause during a level, close a board or the how-to on the menu, and leave the app from the home screen, so that it behaves like other Android games.

### Hiệu năng

21. As a player on a mid-range Android phone, I want the game to run smoothly (target 60 fps, never below 30), so that dodging stays fair.
22. As a player on a weak phone, I want the game to pick lighter graphics by itself, so that it is playable without me finding the setting.
23. As a phone player, I want the "Đồ hoạ" menu item to still let me choose, so that I can trade looks for smoothness.
24. As a phone player, I want the phone not to overheat or drain fast while I sit on the menu or a board, so that the game is polite with my battery.

### Âm thanh

25. As a phone player, I want sound to start on my first touch, so that I don't need a keyboard to unlock it.
26. As a phone player, I want sound to stop when the app goes to the background and come back when I return, so that it never plays in my pocket.

### App Android

27. As an Android player, I want to install "Con Ruồi" from Google Play, so that I don't need a browser.
28. As an Android player, I want the app to work with no internet, so that I can play on the bus.
29. As an Android player, I want an app icon with the nón lá fly on a red sign, and a short red splash screen, so that it looks like the game.
30. As an Android player, I want my Kỷ lục kept between app launches and updates, so that my record isn't lost.
31. As an Android player, I want the app to run full screen, without the status bar, so that the street fills the screen.
32. As a player who cares about privacy, I want the app to collect no data and ask for no permissions, so that I can install it without worry.

### Phát hành

33. As the maintainer, I want CI to build a debug APK on every pull request, so that I can install a PR build on my phone.
34. As the maintainer, I want a manual workflow that builds a signed release bundle (AAB) from `main`, so that publishing is repeatable and the signing key stays in GitHub secrets.
35. As the maintainer, I want a privacy policy page on the GitHub Pages site, so that the Play listing has the URL it requires.
36. As the maintainer, I want the store listing text (tên, mô tả ngắn, mô tả đầy đủ) kept in the repo next to the copy deck, so that the tone matches the game.

## Implementation Decisions

- **One build, two shells.** Vite builds the same `dist/` for GitHub Pages and for the app. Capacitor (Android platform in `android/`, committed) loads `dist/` from the app bundle, so the app runs offline. No native rewrite and no second engine.
- **Input mode is detected, not configured.** The game starts in mouse/keyboard mode and switches to touch mode on the first touch pointer event (and starts there when `(pointer: coarse)` matches). Touch mode shows the joystick and touch how-to copy. A later mouse or key event switches back, so a laptop with a touchscreen works both ways.
- **Floating joystick.** A touch that starts in the left 45% of the screen (outside a board) creates a joystick at that point. Its offset, clamped to a radius of about 60 CSS px, gives a direction and a 0..1 strength. That feeds the same move direction the keyboard produces today, scaled by strength. A dead zone of about 10% avoids drift. The joystick is HTML in the overlay, styled like chalk on a small board.
- **Taps go through the existing click-to-land path.** A tap (short, little movement) outside the joystick area calls the same `round.click` as a mouse click. A drag that starts on the right half is ignored. Several pointers are tracked by `pointerId`, so one thumb can fly while the other taps.
- **Bigger touch targets for dishes.** In touch mode, picking first tries the existing raycast. If that misses, it falls back to the nearest ready dish whose projected screen position lies within about 44 CSS px of the tap. Mouse picking is unchanged.
- **Rules unchanged, fairness measured.** Wind-up times, cooldowns and reach stay as in `src/levels.js`. Playtests on real phones decide whether touch needs help. If it does, the only knob is a single touch multiplier on `windupMs`, applied in one place and checked by the level check. It is not added until a playtest shows it is needed.
- **Pause is a real game state.** A new `paused` mode stops `round.update` (game time freezes), suspends the audio context and shows the "Tạm nghỉ" chalkboard. `visibilitychange` (hidden) and the Capacitor `pause` event enter it during a level. Resuming is always manual ("Bay tiếp"), never automatic. The HUD gets a ⏸ sign button. P and Esc pause on desktop.
- **Android Back button.** It is handled through the Capacitor App plugin:
  - during play → pause;
  - on the pause board → resume;
  - on the how-to → back to the menu;
  - on a result board → home;
  - on the home screen → leave the app.
- **Layout.**
  - `viewport-fit=cover`, with `env(safe-area-inset-*)` padding on the HUD and boards.
  - Boards scale down with `vh`-based clamps, so every board fits a 360 × 740 CSS px landscape screen (740 × 360) without scrolling.
  - The journey map uses its existing side-by-side layout in landscape.
  - Touch targets are at least 44 × 44 CSS px.
  - In a phone browser held upright, a "Xoay ngang" hint board covers the game and pauses it. The app itself locks landscape in the Android manifest.
- **Quality tiers.** "Đồ hoạ" gains automatic choice on first launch.
  - Touch devices start on "Nhẹ" (no shadows, pixel ratio capped at 1.5).
  - A short fps sample during the first level steps down to an extra-light tier if the average stays under 40 fps. The extra-light tier renders at a lower resolution and drops non-gameplay props (traffic bikes, distant diners, string-light bulbs beyond the play area).
  - The choice is saved like the best score (defensive storage).
  - On the menu and boards the frame rate is capped at 30 fps to save battery.
- **Audio.** The existing first-pointer unlock already covers touch. The pause state and app backgrounding suspend the `AudioContext`; resuming the game resumes it. Mute, the menu sound item and the pause board share one setting, and it is saved.
- **Haptics.** A short vibration on a hit and a double pulse on game over, via the Capacitor Haptics plugin in the app and `navigator.vibrate` in the browser. It follows the sound setting.
- **Copy deck.** New strings go in `src/copy.js`:
  - pause: "Tạm nghỉ", "Bay tiếp";
  - rotate: "Xoay ngang điện thoại nhé!";
  - touch how-to: "Kéo ngón cái bên trái để bay", "Chạm vào món để đậu xuống ăn";
  - the store listing text.
  The M key line is shown only in keyboard mode.
- **App identity.**
  - App id `io.github.trinq.conruoi`, name "Con Ruồi".
  - The icon and splash are drawn in code (the SVG nón lá mascot on the red sign), and a script renders them to the PNG sizes Android needs at build time, so there are still no hand-made art files.
  - Full screen (immersive) with the status bar hidden.
  - No permissions requested.
- **Storage.** Kỷ lục and settings stay in `localStorage`, which the Android WebView keeps across launches and app updates (cleared only when the user clears app data). No Capacitor storage plugin is needed.
- **Build and release.**
  - `npm run android:sync` builds the web app and copies it into `android/`.
  - CI adds a job that builds a debug APK and uploads it as a workflow artifact on every pull request.
  - A manual `release-android` workflow builds a signed AAB from `main`, with the upload keystore and passwords in GitHub secrets. The keystore is created and kept by the maintainer, never committed.
  - `versionCode` comes from the workflow run number; `versionName` comes from `package.json`.
- **Store presence.**
  - A static privacy policy page (`/privacy.html`, Vietnamese and English) is deployed with GitHub Pages. It states that the app collects no data, has no ads and no network calls.
  - Content rating answers: cartoon slapstick, no violence against people, no user content.
  - The Data safety form declares no data collected.
- **Delivery in five slices**, each playable on its own:
  1. touch controls (input mode, joystick, tap to land, bigger dish targets);
  2. mobile layout and pause (landscape, safe areas, rotate hint, fit-to-screen boards, pause state and button, visibility pause, touch how-to copy);
  3. phone performance (quality tiers, auto step-down, capped idle frame rate, fps check on real devices);
  4. Capacitor Android shell (project, icon and splash, Back button, haptics, immersive mode, CI debug APK);
  5. Play release (signing workflow, privacy page, store listing, closed testing).

## Testing Decisions

- **Good tests check what a player can observe**, as before: which screen shows, what the HUD says, whether the fly moved, whether a life was lost. They do not assert joystick internals or pixel positions.
- **Seam 1: level data validation** (`npm run check:levels`). If the touch wind-up multiplier is ever added, check that it is between 1 and 1.3 and that difficulty still never eases off between levels.
- **Seam 2: browser playthrough** (`npm run test:e2e`). Add a second Playwright project that emulates a landscape Android phone (about 915 × 412, `hasTouch`, `isMobile`, device scale 2.6) next to the existing desktop project. The suite becomes too slow to run whole on both projects under SwiftShader, so the touch project runs only the touch scenarios:
  - dragging on the left half shows the joystick and moves the fly; lifting the finger hides it;
  - tapping a dish (and tapping just beside it) lands the fly and the HUD "No" rises by its points;
  - flying with one finger while tapping a dish with another still lands on the dish;
  - the how-to board shows the touch instructions;
  - the ⏸ button and a `visibilitychange` to hidden both show "Tạm nghỉ"; game time does not advance while paused (a strike started before pausing does not land); "Bay tiếp" resumes;
  - every board fits the viewport (its bounding box lies inside the safe area) on the phone viewport and on 740 × 360;
  - in portrait the rotate hint shows and the level is paused;
  - no console errors.
  Desktop gains P/Esc pause and stays otherwise unchanged. Every wait on game time uses `SLOW`.
- **Seam 3: Android build.** CI builds the debug APK on every pull request (assemble only, no emulator), so a broken Capacitor config fails the PR.
- **Manual on real devices**, recorded in the PR for slices 3–5:
  - one low-end phone (2 GB RAM, Helio G-class), one mid-range (Snapdragon 6-series) and one recent flagship;
  - for each: fps on the night market level, temperature after 10 minutes, touch feel;
  - whether playtesters can finish level 3 with touch (to decide on the wind-up multiplier);
  - Back button, backgrounding and incoming calls.
  Screenshots on a real phone are attached to each PR, as with earlier slices.

## Out of Scope

- iOS (Capacitor makes it possible later; not in this round).
- Changing the core rules, levels, regions or dishes.
- Ads, in-app purchases, accounts, cloud saves and online leaderboards.
- Tablet-specific layouts (tablets get the phone layout scaled up).
- Controllers and gamepads.
- A portrait mode for gameplay.
- Publishing on stores other than Google Play.

## Further Notes

- Google Play rules change often. When this spec was written, a new personal developer account had to run a closed test with at least 12 testers for 14 days before the app could go to production, and apps had to target a recent Android API level. Check the current rules when opening the account (one-time 25 USD fee) and plan the closed test into slice 5.
- Open question for playtests: floating joystick versus "drag the fly with your finger". The joystick is chosen because the finger would cover the fly and the strike zone under it. Revisit if playtesters struggle.
- Open question: whether the web version should also become an installable PWA. It costs little once slices 1–3 are done, but it is not needed for the Android app.
- The deploy workflow keeps publishing the web version from `main`. Store releases are manual and come from tagged commits on `main`, so the web and app versions can be matched.
