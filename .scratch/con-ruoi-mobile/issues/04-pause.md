# 04: Tạm dừng

**What to build:** A real `paused` mode: game time stops (`round.update` is not called), the audio context is suspended, and a "Tạm nghỉ" chalkboard shows "Bay tiếp", "Âm thanh", "Rung" (once 05 lands) and "Về quán". A ⏸ sign button on the HUD, P or Esc on desktop, `visibilitychange` to hidden, and the rotate hint all pause during a level. Resuming is always manual. New strings go in `src/copy.js`.

**Blocked by:** 03

**PR:** B

**Status:** ready-for-agent

- [ ] ⏸, P and Esc pause; "Bay tiếp" resumes; "Về quán" goes home
- [ ] Switching tab/app or locking the screen pauses a level
- [ ] While paused, game time, diners' strikes and sounds are frozen
- [ ] e2e: ⏸ and a hidden `visibilitychange` show "Tạm nghỉ"; a strike started before pausing does not land while paused; P/Esc pause on desktop; resume works
