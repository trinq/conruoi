# 05: Hướng dẫn cảm ứng, rung, Báo lỗi

**What to build:** In touch mode the "Cách chơi" board shows touch instructions ("Kéo ngón cái bên trái để bay", "Chạm vào món để đậu xuống ăn") and hides the M key line. A short vibration on a hit and a double pulse on game over use `navigator.vibrate` (the Capacitor Haptics plugin takes over in 07). A "Rung: Bật/Tắt" item on the menu and pause board, on by default, saved like the best score and shown only where vibration works, controls it independently of sound. The how-to board gets a "Báo lỗi" link to a GitHub issue form (add the form template).

**Blocked by:** 01, 04

**PR:** B

**Status:** ready-for-agent

- [ ] How-to board matches the input mode
- [ ] Vibration on hit and game over; the Rung setting turns it off and is remembered after reload; hidden when unsupported
- [ ] "Báo lỗi" opens the issue form
- [ ] e2e (phone project): touch how-to text; Rung item toggles and persists; vibrate is called on a hit when on and not when off
- [ ] Maintainer tried PR B on a real phone and said "ok" before merge
