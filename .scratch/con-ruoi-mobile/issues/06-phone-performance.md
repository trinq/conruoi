# 06: Hiệu năng trên điện thoại

**What to build:** Touch devices start on "Nhẹ" (no shadows, pixel ratio capped at 1.5). During the first level a short fps sample steps down to a new extra-light tier if the average stays under 40 fps: lower render resolution and no non-gameplay props (traffic bikes, distant diners, string-light bulbs beyond the play area). The choice is saved and the "Đồ hoạ" item still lets the player choose. Menus and boards render at most 30 fps.

**Blocked by:** None (can start immediately)

**PR:** C

**Status:** ready-for-agent

- [ ] Touch devices default to "Nhẹ"; auto step-down to the extra-light tier when slow; choice saved and changeable
- [ ] Idle screens capped at 30 fps
- [ ] Measured on real phones: a mid-range phone from about 2021 (4 GB RAM) runs smoothly; a 2–3 GB RAM phone is playable at about 30 fps on the lightest tier; numbers for the night market level recorded in the PR
- [ ] e2e: the Đồ hoạ item cycles through the tiers and the choice survives reload; desktop default unchanged
- [ ] Maintainer tried PR C on a real phone and said "ok" before merge
