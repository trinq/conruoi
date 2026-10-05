# 01: Chế độ cảm ứng và joystick nổi

**What to build:** The game detects touch input and lets the player fly with a floating joystick. A touch that starts in the left 45% of the screen (outside a board) creates a chalk-styled joystick under the thumb. Its offset (clamped to about 60 CSS px, with a 10% dead zone) gives a direction and strength that feed the same move direction the keyboard produces. Touch mode starts on the first touch pointer event (or when `(pointer: coarse)` matches) and switches back on mouse or key input. Keyboard and mouse play are unchanged.

**Blocked by:** None (can start immediately)

**PR:** A

**Status:** ready-for-agent

- [x] Input mode switches between touch and mouse/keyboard on the player's actual input
- [x] Dragging on the left side shows the joystick under the thumb and flies the fly; speed follows how far it is pushed; lifting the finger hides it and stops
- [x] Desktop controls behave exactly as before
- [x] e2e (phone project: landscape ~915 × 412, hasTouch, isMobile): dragging moves the fly and shows/hides the joystick; desktop suite unchanged; waits on game time use `SLOW`
