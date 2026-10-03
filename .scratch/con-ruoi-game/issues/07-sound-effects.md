# 07: Sound Effects

**What to build:** Audio feedback for all key game actions. The fly has a buzzing sound while flying, a satisfying munching/eating sound when landing on food, a sharp slap impact sound when an NPC strikes, a negative sting when losing a life, and a positive jingle when completing a level. Sounds are sourced as free SFX or generated programmatically.

**Blocked by:** 04 - NPC Danger System + Warning + Lives

**Status:** ready-for-agent

- [x] Fly buzzing loop plays while the fly is moving (fades when stationary or landed)
- [x] Eating/munching sound plays when the fly is consuming food
- [x] Slap impact sound plays when NPC hand strikes
- [x] Life lost negative sting sound plays when fly is hit
- [x] Level complete jingle plays on LevelCompleteScene
- [x] Sounds are loaded in BootScene and do not block game startup
- [x] Audio does not overlap or stack unpleasantly
- [x] Game handles browsers that block autoplay gracefully (user interaction to enable audio)
