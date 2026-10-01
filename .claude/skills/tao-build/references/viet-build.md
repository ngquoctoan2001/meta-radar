# Viết tên build, tình huống, chọn tướng đối đầu, lưu tooltip

Ví dụ đã duyệt: `builds/build-2026-10-01-adc/build.json` (6 xạ thủ).

## Mục lục
1. Tên build và tình huống
2. Đọc lối chơi từ trang bị
3. Chọn 9 tướng đối đầu
4. Lưu tooltip trang bị (`summary`)

## 1. Tên build và tình huống

| Trường | Độ dài | Cách viết |
|---|---|---|
| `title` | 2–4 từ, ≤ ~18 ký tự | Lối chơi: "Thả diều tầm xa", "Giao tranh tổng", "Hút máu, đánh lâu", "Dồn sát thương", "Đỡ đòn mở giao tranh" |
| `team` | ≤ ~32 ký tự | Đội mình như thế nào thì hợp: "Đội có tướng chắn trước bảo kê", "Đội thiếu hỗ trợ hồi máu" |
| `enemy` | ≤ ~32 ký tự | Đối thủ kiểu gì thì build này khắc chế: "Đối thủ nhiều tướng lao vào", "Đối thủ đông đỡ đòn, đứng cụm" |

- Phải đọc lên thấy 3 build **khác nhau**. Phân biệt bằng **món đầu** và các món chỉ build đó có. Món chung cả 3 build (vd Vô Cực Kiếm, Nỏ Thần Dominik ở Ashe) không dùng để phân biệt.
- Viết tiếng Việt tự nhiên của người chơi Tốc Chiến, không thuật ngữ khó. Audit báo chữ tràn → rút ngắn.
- Muốn biết một món làm gì: đọc `summary` trước (theo tooltip, số mới nhất), sau đó mới đến `stats` (dữ liệu CN, có thể đã cũ) và `passives` (chỉ có tên).

Ashe (đã duyệt, Top 1 · 4 · 9):

| Build | Món đặc trưng | title | team | enemy |
|---|---|---|---|---|
| 1 | Móc Diệt Thủy Quái, Ma Vũ Song Kiếm, Thấu Kính C44 (tầm xa, tốc chạy) | Thả diều tầm xa | Đội có tướng chắn trước bảo kê | Đối thủ nhiều tướng lao vào |
| 2 | Phong Thần Kiếm, Cuồng Cung Runaan (đánh lan) | Giao tranh tổng | Đội nhiều khống chế, thích đánh tổng | Đối thủ đông đỡ đòn, đứng cụm |
| 3 | Mũi Tên Yun Tal mở đầu + ngọc Người Tìm Đường; Gươm Suy Vong +12% hút máu (theo tooltip) | Hút máu, đánh lâu | Đội thiếu hỗ trợ hồi máu | Đối thủ máu dày, chọc máu |

Samira (đã duyệt, Top 1 · 3 · 4):

| Build | Món đặc trưng | title | team | enemy |
|---|---|---|---|---|
| 1 | Nỏ Thần Dominik + Huyết Kiếm + Nỏ Tử Thủ | Hạ gục đỡ đòn | Đội có khống chế để lao vào | Đối thủ đông đỡ đòn, máu dày |
| 2 | Lời Nhắc Tử Vong (giảm hồi máu) + Giáp Thiên Thần | Chống hồi máu | Đội đánh tổng, cần trụ lâu | Đối thủ hồi máu, hút máu nhiều |
| 3 | Cung Phong Linh (lướt) + Áo Choàng Bóng Tối (khiên phép) | Lướt vào kết liễu | Đội thiếu tướng mở giao tranh | Đối thủ nhiều chiêu khống chế |

## 2. Đọc lối chơi từ trang bị

| Dấu hiệu trong build | Lối chơi / tình huống |
|---|---|
| Cuồng Cung Runaan, trang bị đánh lan | giao tranh tổng, đối thủ đứng cụm |
| Nỏ Thần Dominik, Móc Diệt Thủy Quái, Gươm Suy Vong, xuyên giáp/xuyên phép % | khắc chế đỡ đòn, đối thủ máu dày |
| Tầm đánh, tốc chạy (Ma Vũ Song Kiếm, Thấu Kính C44, Phong Thần Kiếm) | thả diều, khắc chế tướng lao vào |
| Hút máu, Huyền Thoại: Hút Máu | đánh lâu, đội thiếu hồi máu |
| Trang bị giảm hồi máu (Lời Nhắc Tử Vong, Đao Hoả Ngục…) | khắc chế đối thủ hồi máu |
| Kháng phép / khiên phép | đối thủ nhiều sát thương phép |
| Giáp / Áo Choàng Gai / Giáp Thiên Thần | đối thủ nhiều vật lý, chí mạng |
| Đồng Hồ Cát, khiên, hồi sinh | đối thủ nhiều sát thủ dồn sát thương |
| Đồ máu + giáp + kháng phép | đỡ đòn, đội thiếu tướng chắn trước |
| Sát lực (lethality), dồn dame | bắt lẻ, đối thủ nhiều tướng máu giấy |

Không chắc một món làm gì → đọc `stats`, `passives`, `summary` trong `data/items/<slug>.json`, hoặc tooltip người dùng gửi.

## 3. Chọn 9 tướng đối đầu

- **strong / weak** = đối thủ **cùng vai trò, cùng đường**:
  - Rồng → xạ thủ
  - Hỗ trợ → hỗ trợ
  - Baron → đường trên
  - Giữa → đường giữa
  - Rừng → đi rừng
- **Đúng trước, hot sau.**
  - Chọn theo hiểu biết chắc chắn về bộ kỹ năng.
  - Trong số các lựa chọn đúng, ưu tiên tướng đang hot / hay gặp.
  - Tier list chỉ có vài tướng T0–T1 mỗi đường, nên được phép chọn tướng ngoài tier list.
  - Đừng chọn tướng bạn không chắc bộ kỹ năng (vd tướng mới ra).
- **Nhất quán giữa các build đã làm.**
  - Đọc `builds/*/build.json` của các tướng cùng đường. Build Ashe ghi Samira là "yếu khi gặp" thì build Samira nên có Ashe ở "mạnh khi gặp".
  - Làm lại build của tướng đã có thì giữ 9 tướng cũ, trừ khi có lý do rõ; nếu đổi thì nói rõ lý do trong báo cáo.
- Lý do dựa trên bộ kỹ năng:
  - tầm đánh dài hơn hay ngắn hơn;
  - cơ động (lướt, tốc biến) hay đứng im;
  - khống chế;
  - hồi máu;
  - kỹ năng chặn đạn (Samira, Yasuo, Braum chặn được tên / chiêu xa);
  - mạnh đầu trận hay cuối trận.
- **synergy** (nhãn tự đổi theo đường của build):

| Đường của build | synergy là |
|---|---|
| Rồng | hỗ trợ |
| Hỗ trợ | xạ thủ |
| Rừng | đường giữa |
| Giữa | đi rừng |
| Baron | đi rừng |

  Chọn theo **lối chơi** của tướng đang làm build, đừng mặc định hỗ trợ đỡ đòn. Người dùng đã nhắc: "sao con nào cũng đi với sup tank vậy? Lulu, Milio, Nami, Yuumi, Sona, Janna… đâu".

  | Kiểu hỗ trợ | Tướng (có trong Tốc Chiến) | Hợp với |
  |---|---|---|
  | Buff / bảo kê | Lulu, Milio, Nami, Yuumi, Sona, Janna, Soraka, Karma, Seraphine | xạ thủ gánh cuối trận, đứng yên, ít thoát thân (Yunara, Senna, Tristana, Ashe…) |
  | Mở giao tranh | Leona, Nautilus, Thresh, Alistar, Rell, Rakan | xạ thủ lao vào / cần người khống chế trước (Samira, Draven) hoặc có chiêu phối hợp (chiêu cuối Kalista) |
  | Chắn đòn | Braum, Morgana | xạ thủ máu giấy hay bị bắt lẻ |

  - Mỗi tướng **trộn ít nhất 1 hỗ trợ buff/bảo kê**, trừ khi bộ kỹ năng thật sự cần mở giao tranh (Kalista, Samira); khi đó vẫn nên có 1 lựa chọn khác kiểu (vd Rakan, Yuumi).
  - Đừng lặp cùng một bộ 3 cho nhiều tướng. Đối chiếu `matchups.synergy` của các build đã làm.
  - Báo cáo kèm lý do theo kỹ năng, vd "Lulu + Tristana: tốc đánh, khiên, phóng to"; "Nami E cường hoá đòn đánh, bong bóng nối làm chậm của Ashe".
- Không trùng tướng giữa 3 nhóm, không chọn chính tướng đang làm build.
- Báo cáo kèm **1 dòng lý do mỗi nhóm**, nói rõ là phân tích (không phải số liệu).

Ashe (đã duyệt):

| Nhóm | Tướng | Lý do |
|---|---|---|
| Mạnh | Vayne, Kog'Maw, Jinx | tầm ngắn hoặc khó chạy, dễ bị làm chậm và thả diều |
| Yếu | Draven, Samira, Caitlyn | Draven bắt nạt đường; Samira chặn tên và chiêu cuối; Caitlyn bắn xa hơn |
| Hợp | Nami, Sona, Leona | Nami E cường hoá đòn đánh + bong bóng nối làm chậm; chiêu cuối Sona choáng nối tên Ashe; Leona theo tên chiêu cuối |

Samira (đã duyệt):

| Nhóm | Tướng | Lý do |
|---|---|---|
| Mạnh | Ashe, Jinx, Kog'Maw | W chặn tên / tên lửa; tướng ít cơ động dễ bị lao vào |
| Yếu | Caitlyn, Draven, Vayne | Caitlyn bắn xa + bẫy chặn lướt; Draven bắt nạt đầu trận; Vayne đẩy choáng cắt chiêu cuối |
| Hợp | Nautilus, Rakan, Yuumi | Nautilus/Rakan mở giao tranh cho Samira lao vào; Yuumi bám theo khi Samira lướt |

Hỗ trợ hợp đã duyệt cho các tướng khác: Tristana — Lulu, Rakan, Nami · Senna (Rồng) — Lulu, Janna, Braum · Yunara — Milio, Lulu, Janna · Kalista — Thresh, Alistar, Rakan (chiêu cuối ném đồng đội cần hỗ trợ mở giao tranh).

## 4. Lưu tooltip trang bị (`summary`)

Ghi vào `data/items/<slug>.json` (chạy lại `fetch-item.mjs` không xoá trường này):
```json
"summary": {
  "patch": "7.3a",
  "flag": "new",
  "stats": ["+50 SMCK", "+25% chí mạng", "+20% tốc đánh"],
  "text": "Di chuyển và đánh thường tích điện: đòn tích đầy gây thêm 120 sát thương phép và +45% tốc chạy trong 1,5 giây.",
  "source": "Tooltip trong game (máy chủ Trung Quốc) · 01/10/2026"
}
```
- **`flag`:** `"new"` nếu tooltip có nhãn 新装备, `"adjust"` nếu có 调整, bỏ trống nếu không có nhãn nào.
- **Món đã có `summary`:** chỉ ghi lại khi chỉ số / nội tại trong tooltip khác (số mới hơn), và đổi `source` sang ngày mới.
- **`stats`:** viết tắt quen thuộc — SMCK (攻击力), SMPT (法术强度), tốc đánh, chí mạng, tốc chạy, xuyên giáp, xuyên phép, hút máu, máu, giáp, kháng phép, điểm hồi kỹ năng.
- **`text`:** ≤ ~130 ký tự, tóm tắt nội tại cho tướng đang làm build. Tướng đánh xa thì ghi số đánh xa, vd Móc Diệt Thủy Quái "120–168 (đánh xa)".
- **Câu trích dẫn màu vàng** cuối tooltip (lời bình của người chơi kiểu "—大神玩家") là lời bình, không phải dữ liệu, đừng chép.
