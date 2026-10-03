# 02: Giao diện biển hiệu + bảng phấn, chữ lầy, màn hình chính

**What to build:** Replace the farm-style boards. Title and buttons use a red shop-sign style with yellow lettering; HUD, menus and result boards use a chalkboard style. The home screen shows the "Con Ruồi" sign, slogan "Quán ngon - Ruồi đông" and a "Thực đơn hôm nay" chalkboard with Vô quán!, Cách chơi and Âm thanh: Bật/Tắt. In-game copy follows the agreed deck.

**Blocked by:** 01

**Status:** ready-for-agent

- [x] Home screen: sign title, slogan, chalkboard menu; Enter starts level 1
- [x] "Cách chơi" opens an illustrated chalkboard guide (WASD/mũi tên, click món, vùng đỏ) and closes back to the menu
- [x] "Âm thanh: Bật/Tắt" toggles sound and stays in sync with the M key
- [x] Level intro card "Màn N: … – Ăn nhanh kẻo bị đập!"
- [x] HUD shows "No: x/y" on a chalkboard plate and 3 hearts
- [x] Banners: "No căng bụng!" on target, "Á đù!"/"Ui da!" on hit, "Bẹp dí!" on last life
- [x] Game-over chalkboard: "Ruồi đã lên đường... Điểm: N", buttons "Bay lại phát nữa" and "Về quán"
- [x] Fonts bundled and render Vietnamese diacritics correctly; e2e updated for the new strings
