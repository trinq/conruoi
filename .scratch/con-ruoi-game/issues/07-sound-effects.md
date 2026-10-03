# 07: Sound Effects

**What to build:** Audio feedback for all key game actions. The fly has a buzzing sound while flying, a satisfying munching/eating sound when landing on food, a sharp slap impact sound when an NPC strikes, a negative sting when losing a life, and a positive jingle when completing a level. Sounds are sourced as free SFX or generated programmatically.

**Blocked by:** 04 - NPC Danger System + Warning + Lives

**Status:** ready-for-agent

- [ ] Fly buzzing loop plays while the fly is moving (fades when stationary or landed)
- [ ] Eating/munching sound plays when the fly is consuming food
- [ ] Slap impact sound plays when NPC hand strikes
- [ ] Life lost negative sting sound plays when fly is hit
- [ ] Level complete jingle plays on LevelCompleteScene
- [ ] Sounds are loaded in BootScene and do not block game startup
- [ ] Audio does not overlap or stack unpleasantly
- [ ] Game handles browsers that block autoplay gracefully (user interaction to enable audio)
