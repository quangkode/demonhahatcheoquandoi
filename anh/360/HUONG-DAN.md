# Ảnh 360° cho trang Trải nghiệm

Bốn ảnh toàn cảnh của khung xem 360° ở `trai-nghiem.html` nằm trong thư mục này.

Chừng nào chưa có ảnh thật thì `styles.css` vẫn vẽ bốn cảnh bằng gradient mô
phỏng — trang không vỡ, chỉ là chưa có ảnh.

---

## Tên tệp

Tên phải khớp với `data-scene` của từng điểm dừng trong `trai-nghiem.html`:

| Điểm dừng | Tệp | Tình trạng |
|---|---|---|
| Khán phòng | `khan-phong.webp` | **đã có** — ảnh AI, 1774 × 887, cần phóng to |
| Sân khấu | `san-khau.webp` | chưa có |
| Tiền sảnh | `tien-sanh.webp` | chưa có |
| Hậu trường | `hau-truong.webp` | chưa có |

## Yêu cầu kỹ thuật

| | |
|---|---|
| Kiểu ảnh | Equirectangular (ảnh cầu), mép trái khớp mép phải |
| Tỉ lệ | **Đúng 2:1**. `pano.js` tính `cao = rộng ÷ 2`, sai tỉ lệ là méo ngay |
| Đường chân trời | Nằm đúng **50% chiều cao** ảnh |
| Kích thước | Nên **8192 × 4096**, tối thiểu 6000 × 3000 |
| Định dạng | `.webp` chất lượng 80 |
| Dung lượng | Dưới 3 MB mỗi tấm |

Vì sao phải to thế: khung nhìn mặc định rộng 112° trên tổng 360°, tức ảnh phải
rộng gấp **3,2 lần** bề ngang màn hình. Màn 1920px xem toàn màn hình cần
6.171px, màn 1366px cần 4.391px. Ảnh 2048 bung ra là nhoè hẳn.

## Lắp vào trang

Sửa `styles.css`, thay cả khối gradient mô phỏng của từng cảnh bằng một dòng:

```css
.pano[data-scene="khan-phong"] { --pano: url("./anh/360/khan-phong.webp"); }
```

**Giữ nguyên `?v=` ở cuối đường dẫn ảnh, và tăng số đó mỗi lần thay ảnh.**
`vercel.json` gắn cho mọi tệp ảnh `Cache-Control: max-age=31536000, immutable`
— trình duyệt không bao giờ hỏi lại máy chủ trong một năm. Thay tệp mà giữ
nguyên đường dẫn thì ai đã từng mở trang sẽ thấy ảnh cũ mãi, tải lại trang cũng
vô ích. Đổi `?v=` là đổi đường dẫn, trình duyệt mới chịu tải bản mới.

Không phải đụng gì vào `pano.js`. Xong nhớ:

1. Tăng số `?v=` của `styles.css` ở **tất cả** các trang HTML.
2. Sửa hoặc xoá dòng cảnh báo vàng `.pano__note` dưới khung — xem mục cuối.

### Góc nhìn rộng bao nhiêu

`FOV_DEFAULT` trong `pano.js` quyết định khung nhìn thấy bao nhiêu độ theo bề
ngang. Chiều dọc đi theo chiều ngang vì ảnh cầu luôn 2:1, nên góc càng rộng thì
càng thấy nhiều trần và sàn.

Đang để **112°** (thấy 63° theo chiều dọc). Hạ xuống 78° thì khung chỉ còn thấy
44° chiều dọc — một dải ngang hẹp, cụt cả trần lẫn sàn, nhìn như ảnh bị cắt chứ
không ra hình một căn phòng.

### Hướng nhìn lúc vừa mở

Mép trái ảnh cầu rơi vào đâu là tuỳ lúc chụp, nên mở cảnh ra chưa chắc đã nhìn
đúng chỗ đáng nhìn. Ghi hướng đó vào `data-yaw` của nút điểm dừng, tính bằng
độ kể từ mép trái ảnh — **giữa ảnh là 180**:

```html
<button ... data-scene-btn="khan-phong" data-yaw="180">Khán phòng</button>
```

Ảnh khán phòng có sân khấu nằm giữa ảnh nên để `180`. Không ghi thì mở ra nhìn
đúng mép trái ảnh — với tấm khán phòng là nhìn thẳng vào cửa thoát hiểm sau lưng.

Thêm điểm dừng mới thì thêm một nút `data-scene-btn` trong `trai-nghiem.html`
và một dòng `--pano` như trên. `pano.js` tự nhân bản hàng nút đó vào khung toàn
màn hình, không phải khai báo hai lần.

---

## Dựng ảnh bằng AI

Chưa có ảnh chụp thật thì dùng **Skybox AI** (skybox.blockadelabs.com) — công cụ
sinh thẳng ra ảnh cầu khép vòng sẵn, đúng tỉ lệ 2:1.

Đừng sinh rời từng mảnh rồi ghép: mỗi lần sinh là AI bịa lại ánh sáng, màu
tường, độ cao trần, bốn mảnh ghép vào thành bốn căn phòng khác nhau.

### Prompt

Nhà hát Chèo Quân đội là đơn vị quân đội, khán phòng **160 chỗ, một tầng, không
ban công** (con số này đang hiện ngay dưới khung 360 trên trang). Phải tả đúng
quy mô đó, nếu không AI trả về nhà hát lớn nghìn chỗ, nhìn là thấy vênh với
con số.

Giữ mấy chữ `small`, `modest`, `single level`, `no balcony` trong cả bốn prompt
để bốn cảnh ra cùng một toà nhà. Tránh `grand`, `opera house`, `chandelier`.

**Khán phòng**

```
equirectangular 360 panorama, interior of a small theatre
auditorium, about 160 seats, single level, no balcony,
rows of dark red velvet seats, modest wooden stage with red
curtain, wood panelled walls, warm amber lighting, empty hall,
photorealistic
```

**Sân khấu** (đứng trên sân khấu nhìn ra)

```
equirectangular 360 panorama, standing on a small theatre stage
looking out, red stage curtains on both sides, painted scenic
backdrop, overhead lighting rig, about 160 empty red seats in
the distance, single level, no balcony, warm golden light,
photorealistic
```

**Tiền sảnh**

```
equirectangular 360 panorama, small theatre lobby foyer, cream
walls with framed performance photographs, tall glass doors with
daylight coming in, polished stone floor, potted plants, warm
ceiling lights, modest scale, photorealistic
```

**Hậu trường**

```
equirectangular 360 panorama, backstage of a small theatre,
costume racks with traditional opera costumes, makeup mirrors
with warm bulbs, ropes and rigging, dim blue and amber light,
wooden floor, photorealistic
```

**Negative prompt:** `people, faces, text, watermark, logo, tripod, fisheye`

**Đừng để AI vẽ người.** Tấm khán phòng hiện tại có ba diễn viên trên sân khấu
và mặt cả ba đều méo — xem toàn màn hình là thấy ngay. Mặt người trong ảnh 360
gần như luôn hỏng vì lúc sinh mỗi khuôn mặt chỉ chiếm vài chục điểm ảnh. Mà cũng
không nên bịa ra diễn viên của Nhà hát. Sinh lại tấm nào có người thì để
`people, faces` trong negative prompt, hoặc thêm `empty stage` vào prompt.

### Phóng to

Bản miễn phí thường chỉ cho khoảng 2048 × 1024 — chưa đủ. Phóng ×4 bằng
**Upscayl** (miễn phí, có bản Windows) hoặc Topaz Gigapixel, chọn mô hình dành
cho ảnh thật.

Tấm khán phòng đang dùng mới 1774px ngang, trong khi màn 1366 xem toàn màn hình
cần 4391px — nhìn còn mềm. Phóng ×4 lên 7096 × 3548 là đủ nét cho cả màn 1920.

**Phóng cả tấm một lần.** Cắt ra từng mảnh rồi phóng riêng là gãy mối nối vòng
tròn, quay một vòng sẽ thấy vạch.

### Kiểm trước khi lắp

1. **Tỉ lệ** đúng 2:1 chưa.
2. **Có đủ 360° thật không** — xem mục dưới. Cái bẫy lớn nhất.
3. **Mép trái có khớp mép phải không** — ghép mép phải sang cạnh mép trái rồi
   soi chỗ nối. Mắt thường khó thấy.
4. **Đường chân trời** có nằm đúng giữa ảnh không.

### Bẫy: ảnh 180° gập đôi giả làm 360°

Nhiều công cụ AI trả về **một nửa vòng rồi lật ngược dán vào cho đủ bề ngang**.
Nhìn lướt thì giống ảnh cầu, mở lên quay một vòng vẫn khớp, nhưng thật ra chỉ
có 180° nội dung: không bao giờ thấy được phía sau lưng, và hai bên là ảnh soi
gương của nhau.

Cách kiểm: **cắt đôi ảnh, lật ngược nửa phải rồi đặt cạnh nửa trái.** Giống
nhau là bị gập. Đo bằng máy thì so từng điểm ảnh `(x, y)` với `(W-x, y)` —
chênh lệch trung bình thấp hẳn so với lúc so hai điểm cách nhau 90° là bị gập.

Tấm khán phòng đầu tiên dính đúng lỗi này (chênh 9,6 khi soi gương so với 29,3
khi xoay 90°). Tấm đang dùng đã đạt: 31,4 so với 34,5, tức hai nửa khác nhau
thật, quay ra sau lưng thấy tường cuối phòng với cửa ra vào.

---

## Hai điều phải nhớ

**Ảnh AI không phải Nhà hát thật.** Dòng cảnh báo vàng `.pano__note` dưới khung
360 phải giữ, và phải ghi rõ là ảnh dựng bằng AI chứ không phải ảnh chụp tại
Nhà hát. Bỏ dòng đó đi là người xem tưởng thật, đến nơi thấy khác hẳn. Chỉ khi
nào thay bằng ảnh chụp thật mới được xoá.

**Khung xem hiện chỉ trượt ảnh phẳng, không nắn phối cảnh.** Đường thẳng — mép
sân khấu, khung cửa — sẽ hơi cong, nhìn lên trần hoặc xuống sàn càng rõ. Muốn
thẳng thật thì phải đổi sang bộ xem WebGL (Pannellum, ~25 KB, nạp từ CDN, không
cần build). Lắp ảnh thật vào xem cong tới mức nào rồi quyết.
