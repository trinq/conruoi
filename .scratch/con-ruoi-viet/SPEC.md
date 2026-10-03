# 🪰 Con Ruồi: Hành trình xuyên Việt - Spec

## Problem Statement

Bản 3D low-poly hiện tại chơi được nhưng trông "Tây": rừng cây tròn và cây thông kiểu châu Âu, quầy gỗ mái sọc xanh trắng giống tiệm nông trại, ao lá súng, bãi đất trống không có phố xá, và bảng menu kem viền gỗ kiểu game nông trại phương Tây. Người chơi Việt Nam không thấy chút gì của vỉa hè Việt Nam trong một game lấy bối cảnh quán ăn vỉa hè. Màn hình chính cũng chỉ là một bảng chữ đặt trên cảnh, không có ấn tượng gì riêng.

## Solution

Giữ kỹ thuật 3D low-poly và giữ nguyên luật chơi, nhưng thay toàn bộ hình ảnh, giao diện, chữ và âm thanh nền để game thành một **hành trình xuyên Việt** của con ruồi. Năm màn là năm vùng, đi từ Bắc vào Nam:

| Màn | Vùng, thời điểm | Món cao / vừa / thấp | Bonus | Vũ khí mới |
|---|---|---|---|---|
| 1 | Vỉa hè phố cổ Hà Nội, sáng sớm | Phở bò / Bún chả / Bánh cuốn | | Tay không |
| 2 | Quán ven sông Huế, trưa | Bún bò Huế / Cơm hến / Bánh bèo | | Tay không |
| 3 | Phố Hội An, hoàng hôn | Cao lầu / Mì Quảng / Bánh mì | Chè | Quạt nan |
| 4 | Hẻm Sài Gòn, chiều | Hủ tiếu / Cơm tấm / Bánh mì | Chè | Vợt muỗi điện |
| 5 | Chợ đêm Sài Gòn, đêm | Lẩu / Ốc xào / Bánh tráng nướng | Chè, xiên que | Trộn cả ba |

Mọi đồ vật được dựng bằng code theo kiểu Việt Nam: ghế nhựa lùn, bàn inox, xe máy, cột điện dây chằng chịt, nhà ống, bảng hiệu chữ đỏ nền vàng, cây bàng / phượng / tre / dừa, nồi nước lèo bốc khói, xe đẩy. Nón lá và đèn lồng chỉ là điểm nhấn. Người ngồi ăn đa dạng (chú xe ôm, cô văn phòng, học sinh áo trắng, ông áo ba lỗ, áo bà ba). Con ruồi thành linh vật đầu to mắt to đội nón lá nhỏ.

Màn hình chính là mặt tiền quán phở Hà Nội đang hoạt động, tiêu đề là biển hiệu đỏ chữ vàng, các mục chọn viết trên bảng phấn "Thực đơn hôm nay". Giữa các màn là bản đồ chữ S, con ruồi bay sang điểm dừng kế tiếp. Chữ trong game theo giọng hài, lầy của người Việt.

## User Stories

### Màn hình chính

1. As a player, I want the home screen to show a living Hà Nội phở stall (diners eating, motorbikes passing, the fly buzzing around), so that I feel I am on a Vietnamese street before I even start.
2. As a player, I want the title "Con Ruồi" on a red shop sign with yellow letters, so that the game looks like a real Vietnamese eatery sign.
3. As a player, I want the slogan "Quán ngon - Ruồi đông" under the title, so that the tone is funny from the first second.
4. As a player, I want the menu options written on a chalkboard titled "Thực đơn hôm nay", so that choosing what to do feels like reading a street-food menu.
5. As a player, I want a "Vô quán!" option that starts the game at level 1, so that I can play immediately.
6. As a player, I want a "Cách chơi" option that shows a short illustrated guide (WASD/arrows to fly, click a dish to eat, red zone means get away), so that I understand the rules before playing.
7. As a player, I want an "Âm thanh: Bật/Tắt" option on the menu, so that I can control sound without remembering the M key.
8. As a player, I want to see my best score ("Kỷ lục") in a corner of the chalkboard, so that I have a target to beat.
9. As a player, I want Enter to start the game from the home screen, so that I can play without the mouse.
10. As a player, I want a hint to click or press a key to enable sound when the browser blocks audio, so that I know why it is silent.

### Hành trình và màn chơi

11. As a player, I want each of the five levels to be a different Vietnamese place (Hà Nội, Huế, Hội An, Sài Gòn alley, Sài Gòn night market), so that the game feels like a trip across the country.
12. As a player, I want each level to have its own time of day (early morning, noon, sunset, afternoon, night), so that every level has a distinct mood.
13. As a player, I want a short title card when a level starts, like "Màn 1: Phở Hà Nội – Ăn nhanh kẻo bị đập!", so that I know where I am.
14. As a player, I want the HUD to show my fullness as "No: 30/80", so that the score reads like a hungry fly's stomach.
15. As a player, I want the HUD to look like chalk on a small blackboard, so that it matches the street-food theme.
16. As a player, I want to keep 3 lives shown as hearts, so that I know how many mistakes I have left.

### Bối cảnh từng vùng

17. As a player, I want Hà Nội to have narrow tube houses with tiled roofs and balconies, a bàng tree, tangled power lines and low plastic stools on the pavement, so that it looks like the Old Quarter.
18. As a player, I want Huế to have a riverside eatery with mossy tiled roofs and a flame tree, so that it feels like the old capital.
19. As a player, I want Hội An to have yellow walls, bougainvillea and lanterns lighting up at sunset, so that it is instantly recognisable.
20. As a player, I want the Sài Gòn alley to have tin roofs, plastic shop signs and motorbikes parked everywhere, so that it feels crowded and real.
21. As a player, I want the night market to have string lights, glowing signs and food carts, so that the final level feels busy and exciting.
22. As a player, I want the food stall in each level to have a steaming broth pot or a food cart, so that the kitchen feels alive.
23. As a player, I want to see shop signs with red letters on yellow, so that the street looks Vietnamese rather than Western.
24. As a player, I want motorbikes to drive past on the street behind the eating area, so that the scene feels like a real Vietnamese street.
25. As a player, I want trees to be bàng, phượng, tre or dừa depending on the region, so that nothing looks like a European forest.

### Món ăn

26. As a player, I want each region to serve its own specialities, so that eating across the levels feels like a food tour.
27. As a player, I want each region to keep three dish tiers (high points + long eat, medium, low points + quick eat), so that I learn the risk/reward once and it works everywhere.
28. As a player, I want bonus dishes (chè, xiên que) in later levels, so that I have a tempting high-value target.
29. As a player, I want each dish to look distinct (bowl, plate, bánh mì loaf, hotpot, glass of chè, skewers), so that I can tell them apart at a glance.
30. As a player, I want to see how many points a dish is worth, so that I can choose what to go for.
31. As a player, I want an eaten dish to look empty and refill after a while, so that I know it is not available yet.

### Người ngồi ăn và vũ khí

32. As a player, I want diners to be varied Vietnamese characters (xe ôm driver with a helmet, office worker, student in a white shirt, uncle in a tank top, auntie in áo bà ba), so that the stall feels populated by real people.
33. As a player, I want diners to keep eating with chopsticks when they are not attacking, so that the scene feels alive.
34. As a player, I want diners in the first two levels to slap with bare hands, so that the early game is simple.
35. As a player, I want some diners to swing a nan fan from level 3, so that the game introduces something new.
36. As a player, I want some diners to use an electric fly swatter (vợt muỗi điện) from level 4, with sparks and a "tạch" sound, so that the most iconic Vietnamese fly killer shows up.
37. As a player, I want every weapon to give the same red warning zone before it strikes, so that the rules stay fair and consistent.
38. As a player, I want difficulty to keep rising through more diners and faster strikes, not through the weapon type, so that progression is predictable.

### Con ruồi

39. As a player, I want the fly to be a cute mascot with a big head and big eyes, so that I like playing as it.
40. As a player, I want the fly to wear a tiny nón lá, so that the hero is unmistakably Vietnamese.
41. As a player, I want the fly to smile while eating and look dizzy when hit, so that it has personality.
42. As a player, I want the nón lá to fall off when the fly is hit, so that getting hit is funny as well as punishing.

### Kết quả và bản đồ

43. As a player, I want a "No căng bụng!" banner when I reach the level target, so that winning feels rewarding.
44. As a player, I want "Á đù!" or "Ui da!" to pop up when I get hit, so that the hit has a funny reaction.
45. As a player, I want a "Bẹp dí!" banner when I lose my last life, so that losing is funny rather than frustrating.
46. As a player, I want an S-shaped map of Vietnam between levels showing the fly travelling from the finished stop to the next one, so that I feel I am progressing on a journey.
47. As a player, I want the map to show my score for the level and my total, so that I see how I am doing.
48. As a player, I want the game-over board on a chalkboard to say "Ruồi đã lên đường... Điểm: N", with "Bay lại phát nữa" and "Về quán" buttons, so that I can retry or go home.
49. As a player, I want "Ruồi chúa xuyên Việt!" after finishing all five levels, so that the ending feels like an achievement.
50. As a player, I want my best total score saved in this browser, so that the "Kỷ lục" on the home screen survives a reload.

### Âm thanh

51. As a player, I want the existing buzz, munch, slap, hurt and jingle sounds to keep working, so that nothing I liked is lost.
52. As a player, I want background street sounds (motorbike horns, clinking bowls, crowd murmur) that change with the region, so that each place sounds alive.
53. As a player, I want the electric swatter to make a sharp "tạch" with a crackle, so that it is distinct from a hand slap.

### Chất lượng

54. As a player on an ordinary laptop with integrated graphics, I want the game to run smoothly at around 60 fps, so that dodging is fair.
55. As a player on a weaker machine, I want an option to turn off shadows, so that the game stays playable.
56. As a player using a Vietnamese input method (Telex/VNI), I want WASD to keep working, so that I don't have to switch keyboards.
57. As a player, I want all Vietnamese text to render with correct diacritics, so that it reads properly.

## Implementation Decisions

- **Rendering stays three.js low-poly.** All models remain procedurally built in code with flat-shaded materials; no external model or texture packs. Western assets (round European trees, pines, farm stall, pond with lily pads, generic grass clearing) are removed.
- **Regions become data.** Each level gains a region description alongside its existing layout and danger tuning: region id and display name, time of day (drives sun angle and colour, sky, fog, exposure and which lights are on), the scenery set to build, the dish tiers and bonus dishes, and the weapon mix for its diners. Level geometry stays in metres, as now.
- **Scenery is built per region.** The environment builder takes a region and assembles a street scene from a shared kit of Vietnamese props (tube houses, shop signs, power poles and lines, parked and moving motorbikes, food carts, broth pots, region trees, lanterns, string lights). Each region is a composition of kit pieces plus a few region-specific pieces (Hội An yellow walls and bougainvillea, Huế river edge, night market stalls). The play area stays a pavement in front of the shops, so gameplay bounds are unchanged.
- **Dish catalogue replaces the four fixed types.** Each dish has an id, Vietnamese display name, tier (high / medium / low / bonus), points, eat time and a model builder. Tier sets the default points and eat time (high 30 pts / 2.2 s, medium 20 / 1.6 s, low 10 / 1.0 s, bonus 40 / 1.2 s) so the risk/reward rule is the same across regions. Dish models expose the same "contents" part that disappears when eaten.
- **Diners get archetypes.** A diner is built from an archetype (clothing, headwear, accessories) chosen per diner, weighted by region. Animation hooks (head, arms) and the facing-the-nearest-table rule stay as they are.
- **Weapons are visual variants of the same attack.** The slap state machine (idle → windup → strike → rest → retract) and the warning zone are unchanged. A weapon type only changes the model that travels to the target, the wind-up pose and the impact effect and sound (hand, nan fan, electric swatter with sparks and a "tạch"). Weapon assignment comes from the level's weapon mix.
- **Fly mascot.** The fly model is replaced with a big-headed, big-eyed mascot wearing a nón lá. It has simple expression states (normal, eating/happy, stunned/dizzy). On a hit the hat detaches, falls and is restored when the i-frames end. The blob shadow under the fly stays for readability.
- **UI art direction.** HTML overlay stays. Two visual families replace the farm boards: shop-sign style (red board, yellow lettering, bold outline) for the title and buttons, and chalkboard style (dark board, wooden frame, chalk lettering) for the HUD, menus and result boards. Fonts must cover Vietnamese diacritics and be bundled with the game.
- **Home screen.** The home screen renders the Hà Nội region live behind the HTML, with a shop-sign title, slogan, and a "Thực đơn hôm nay" chalkboard holding: Vô quán!, Cách chơi, Âm thanh: Bật/Tắt, and Kỷ lục. "Cách chơi" opens an illustrated chalkboard guide with a back button.
- **Journey map.** A new between-levels screen replaces the "level complete" board: a flat, stylised S-shaped map with five stops; the fly animates from the finished stop to the next, with level and total score and a continue button. After level 5 it shows the victory board instead.
- **Best score.** The best total score is stored in browser storage, read defensively (storage may be unavailable), shown on the home screen and updated at game over or victory. No level unlocking or progress saving.
- **Copy deck.** All player-facing strings live in one place so the tone can be tuned. Agreed strings: slogan "Quán ngon - Ruồi đông"; play "Vô quán!"; level intro "Màn N: <món> <vùng> – Ăn nhanh kẻo bị đập!"; HUD "No: x/y"; target reached "No căng bụng!"; hit "Á đù!" / "Ui da!" (random); out of lives "Bẹp dí!"; game over "Ruồi đã lên đường... Điểm: N"; retry "Bay lại phát nữa"; victory "Ruồi chúa xuyên Việt!"; home "Về quán".
- **Ambient audio.** The existing synthesizer gains looping ambient beds (motorbike pass-bys and horns, clinking bowls, crowd murmur) mixed per region, plus the swatter "tạch". No recorded voices. Ambient starts after audio unlocks and follows the mute setting.
- **Performance.** Static scenery is merged into few draw calls per material, repeated props use instancing, and the shadow map covers only the play area. A shadows on/off toggle is available. Target: about 60 fps on an integrated-GPU laptop at 1080p.
- **Delivery in five slices**, each playable on its own: (1) new framework (home screen, UI families, copy deck, mascot fly, Hà Nội level complete; other levels keep placeholder scenery), (2) Huế and Hội An with nan fan, (3) Sài Gòn alley and night market with electric swatter, (4) journey map and best score, (5) ambient audio.

## Testing Decisions

- **Good tests check what a player can observe**, not internals: which screen is showing, what the HUD says, whether the score or lives changed, which level is loaded. They do not assert model shapes, colours or private state names.
- **Seam 1: level data validation** (the existing level check command, run in Node). Extend it to cover the new region data: every level has a region, time of day and weapon mix; every dish referenced exists in the catalogue; each level has exactly one dish per tier plus any bonus dishes; dishes sit inside tables and don't overlap; diners sit next to (not on) a table; weapons follow the agreed schedule (bare hands only in levels 1–2, nan fan from 3, swatter from 4); difficulty never eases off. Prior art: the current level check script.
- **Seam 2: browser playthrough** (new end-to-end command using Playwright and Chromium, driving the real game through its development hook). Scenarios:
  - home screen shows the sign title, chalkboard menu and Kỷ lục; Enter starts level 1;
  - "Cách chơi" opens and closes;
  - clicking a dish lands the fly, eating completes and the HUD "No" value rises by that dish's points;
  - standing in a strike zone costs a life and shows "Á đù!"/"Ui da!"; losing all lives shows "Bẹp dí!" then the game-over board, and "Bay lại phát nữa" restarts at level 1 with 3 lives;
  - reaching the target shows "No căng bụng!", then the journey map, then the next level;
  - finishing level 5 shows "Ruồi chúa xuyên Việt!" and the home screen Kỷ lục is updated after a reload;
  - a synthetic Vietnamese-IME keystroke (composition key code, physical key W) still moves the fly;
  - no console errors on any screen.
  Prior art: the throwaway Playwright scripts used to verify PRs #3–#11.
- **CI:** both seams run on every pull request in GitHub Actions; deploy keeps running the level check before building.
- **Manual review:** visual quality ("does it look Vietnamese?") is reviewed by the user from screenshots attached to each PR and by playing the deployed build.

## Out of Scope

- Changing the core rules (movement, click-to-land, warning-then-strike, 3 lives, tiered scoring).
- Mobile and touch controls; phones are not a target.
- Level select, level unlocking and saving progress (only the best score is stored).
- Recorded voice lines such as street vendors calling out.
- Background music.
- Online leaderboards.
- Imported 3D model packs or textures.
- Localisation into other languages.

## Further Notes

- This spec supersedes the visual and UI parts of the original root spec, which still describes the earlier Phaser pixel-art plan; gameplay rules from it still apply.
- Nón lá and lanterns are accents only, to avoid a tourist-postcard look; the street details (stools, power lines, motorbikes, signs) carry the Vietnamese feel.
- "Á đù!" was kept deliberately; if the audience turns out to include young children, switch the hit reaction to "Ui da!" only via the copy deck.
