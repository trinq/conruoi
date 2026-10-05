# 02: Chạm vào món để ăn, vùng chạm rộng, nhiều ngón

**What to build:** A short tap outside the joystick area goes through the existing click-to-land path. In touch mode, when the raycast misses, the nearest ready dish whose projected screen position is within about 44 CSS px of the tap is picked instead. Pointers are tracked by `pointerId`, so one thumb can fly while the other taps a dish; a drag that starts on the right side is ignored.

**Blocked by:** 01

**PR:** A

**Status:** ready-for-agent

- [x] Tapping a dish, or just beside it, lands the fly and eating scores its points
- [x] Flying with one finger while tapping a dish with another still lands on the dish
- [x] Mouse picking unchanged
- [x] e2e (phone project): tap on and beside a dish raises the HUD "No" by its points; two-finger fly-and-tap works
- [x] Maintainer tried PR A on a real phone and said "ok" before merge
