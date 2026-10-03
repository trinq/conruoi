# 06: Level Progression (3-5 Levels)

**What to build:** A level configuration system that defines 3-5 distinct levels, each with different table layouts, food arrangements, NPC counts, slap speeds, and target scores. Completing one level advances to the next with increasing difficulty. After the final level, the player sees a victory/congratulations screen.

**Blocked by:** 05 - Menu + Game Over + Level Complete Scenes

**Status:** ready-for-agent

- [ ] Level config data structure (array) defines parameters for each level
- [ ] Level 1: single small table, 1 NPC, slow slaps, low target score (tutorial feel)
- [ ] Level 2: larger table, 2 NPCs, moderate slap speed, more food variety
- [ ] Level 3: multiple tables, 2-3 NPCs, faster slaps, higher target score
- [ ] Level 4 (stretch): crowded stall, 3+ NPCs, fast slaps, bonus food items
- [ ] Level 5 (stretch): night market scene, maximum difficulty
- [ ] GameScene reads level config to set up scene dynamically
- [ ] Completing the final level shows a victory screen or special GameOverScene
- [ ] Difficulty increase is noticeable but fair between levels
