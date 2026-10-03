# 04: NPC Danger System + Warning + Lives

**What to build:** NPC characters sit at the food stall. When the fly is near or landed on food, an NPC raises their hand with a visible warning indicator. After a 1-1.5 second wind-up delay, the hand slaps down on the warned area. If the fly is still in the danger zone, it loses one life. The player has 3 lives displayed as a HUD element. After being hit, the fly gets brief invincibility frames (i-frames) so the player doesn't lose multiple lives instantly.

**Blocked by:** 03 - Food Items + Click-to-Land + Scoring

**Status:** ready-for-agent

- [ ] At least 1 NPC sprite visible sitting at the table with idle animation
- [ ] Warning indicator (visual cue like exclamation mark or red zone) appears before a slap
- [ ] Hand slap animation plays after the warning delay (~1-1.5 seconds)
- [ ] Hit detection: if fly overlaps the slap zone when the hand comes down, a life is lost
- [ ] Lives HUD shows remaining lives (starts at 3)
- [ ] Brief invincibility period after being hit (i-frames with visual flashing)
- [ ] Fly is knocked back or stunned briefly when hit
- [ ] NPC targets the fly's current/recent position for the slap
