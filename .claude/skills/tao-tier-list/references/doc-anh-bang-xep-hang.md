# Đọc ảnh chụp bảng xếp hạng Tốc Chiến Trung Quốc

Màn hình: 排行榜 (Bảng xếp hạng) → mục 强度 (Sức mạnh). Ví dụ thật: `tierlists/tier-2026-09-30/source/*.jpg` và số liệu đã đọc trong `tierlists/tier-2026-09-30/tierlist.json`. Mở vài ảnh mẫu ra so khi phân vân.

## Mục lục
1. Bố cục màn hình
2. Bộ lọc và ngày
3. Đường đang xem
4. Bảng số liệu
5. Lỗi hay gặp khi đọc

## 1. Bố cục màn hình

```
排行榜                                   [当前 ▾] [排位赛 ▾] [宗师以上 ▾]
英雄 | 强度 | 技能 | 装备 | 符文 …       ← mục đang chọn phải là 强度
[ô tìm kiếm]                 [5 biểu tượng đường]
刷新时间：2026: 09: 30                   ← ngày cập nhật số liệu
排名  强度  英雄        胜率    登场率   禁用率   对位情况
 1    [T0] 辛吉德      57.58%  3.77%    1.14%    …
```

## 2. Bộ lọc và ngày

- 3 ô trên cùng: 当前 (mùa hiện tại) · 排位赛 (Đấu Hạng) · bậc rank.
- Bậc rank: 黑铁 Sắt · 青铜 Đồng · 白银 Bạc · 黄金 Vàng · 铂金 Bạch Kim · 翡翠 Lục Bảo · 钻石 Kim Cương · 大师 Cao Thủ · 宗师 Đại Cao Thủ · 王者 Thách Đấu. 以上 = "trở lên", 以下 = "trở xuống" — cả hai **tính luôn** bậc đó (钻石以下 = Kim Cương trở xuống, gồm cả Kim Cương).
  - 宗师以上 → `"filter": "Đấu Hạng · Đại Cao Thủ trở lên"` (**người dùng đã chốt bộ lọc này**, là mặc định của `tierlist.mjs new`).
  - Ảnh khác bộ lọc (vd 钻石以下 → "Đấu Hạng · Kim Cương trở xuống") → hỏi người dùng trước khi làm. Họ từng gửi nhầm bộ lọc rồi gửi lại. Đồng ý làm thì dùng `--filter=` (xem SKILL.md bước 1).
- Ngày: dòng 刷新时间 `2026: 09: 30` → `2026-09-30` (lệnh `new`) và "30/09/2026" (trên ảnh). Các ảnh lệch ngày nhau → hỏi người dùng dùng ngày nào. Bảng xếp hạng chưa sang ngày mới thì chụp lại vẫn ra cùng ngày (và thường cùng số) với bộ đã làm.

## 3. Đường đang xem

5 biểu tượng nằm ngang dưới bộ lọc; biểu tượng **sáng màu/được tô** là đường đang xem. Thứ tự trái → phải:

| Vị trí | Đường | `lane` |
|---|---|---|
| 1 | Baron (đường trên) | `baron` |
| 2 | Rừng | `jungle` |
| 3 | Giữa | `mid` |
| 4 | Rồng (xạ thủ) | `dragon` |
| 5 | Hỗ trợ | `support` |

Đối chiếu thêm bằng tướng trong bảng (xạ thủ → Rồng, Thresh/Janna → Hỗ trợ…) khi biểu tượng khó nhìn.

## 4. Bảng số liệu

| Cột | Nghĩa | Ghi vào |
|---|---|---|
| 排名 | hạng | thứ tự trong lệnh `lane` |
| 强度 | bậc: huy hiệu **T0** trắng-tím, **T1** vàng, **T2** đỏ… | `T0` / `T1` |
| 英雄 | tên tướng tiếng Trung | gõ y nguyên, script tự tra |
| 胜率 | tỉ lệ thắng | số thứ 1 |
| 登场率 | tỉ lệ chọn | số thứ 2 |
| 禁用率 | tỉ lệ cấm | số thứ 3 |
| 对位情况 | ảnh đối thủ + % | **bỏ qua** (số dưới đối thủ là tỉ lệ thắng chung của đối thủ, không phải đối đầu) |

- Lấy **mọi tướng T0 và T1**, dừng ở dòng T2 đầu tiên.
- Mỗi đường thường 1–2 ảnh, người dùng gửi **không theo thứ tự** — ghép theo biểu tượng đường + số hạng. Ảnh cuối của một đường mà dòng cuối vẫn là T1 (chưa thấy T2) → **dừng, xin người dùng chụp thêm phần dưới**. Không đoán, không bỏ qua.
- Tỉ lệ cấm tính chung cho tướng nên cùng một số ở mọi đường (Malphite 68.35% ở cả Baron và Hỗ trợ). Bình thường, đừng "sửa".

## 5. Lỗi hay gặp khi đọc

- **Trùng dòng**: ảnh thứ hai của cùng đường thường lặp lại 1–2 dòng cuối của ảnh đầu. Lệnh `lane` báo "bị lặp" nếu ghi trùng.
- **Dòng bị che**: thông báo 截图成功 (chụp màn hình thành công) hoặc thanh trạng thái đè lên dòng trên/dưới. Đọc kỹ; không đọc được thì xin ảnh khác.
- **Dòng bị cắt nửa** ở mép ảnh: số thường vẫn đọc được ở ảnh kế tiếp.
- **Nhầm số giữa các cột**: chép theo đúng thứ tự thắng · chọn · cấm. Tỉ lệ thắng T0/T1 thường 49–58%; tỉ lệ chọn có thể > 20%; tỉ lệ cấm 0–90%.
- **Số có 1 chữ số thập phân** (53.5%, 51%): chép đúng như ảnh, không thêm số 0.
- **Tên tiếng Trung gần giống nhau**: 辛吉德 Singed ≠ 辛德拉 Syndra; 莫甘娜 Morgana ≠ 莫德凯撒 Mordekaiser; 慎 Shen; 彗 Hwei; 易 Master Yi. Lệnh `lane` in lại tên Trung = slug để soát.
