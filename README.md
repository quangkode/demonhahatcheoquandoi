# Nhà hát Chèo Quân đội — Trang chủ (demo)

Trang chủ tĩnh (HTML/CSS/JS thuần), không cần build, deploy thẳng lên Vercel.

## Cấu trúc

```
index.html        # trang chủ
trai-nghiem.html  # tham quan 360°, nhạc cụ, tác phẩm tiêu biểu
vo-dien.html      # kho tác phẩm, chia 4 mảng
gioi-thieu.html   # trang giới thiệu
lich-su.html      # lịch sử phát triển
tin-tuc.html      # tin tức, video, thư viện ảnh, điểm báo
dat-cho.html      # trang đặt chỗ xem chèo
styles.css        # giao diện, responsive
script.js         # slider, menu mobile, mục lục dính, đếm số, hiệu ứng cuộn
booking.js        # engine đặt chỗ: dữ liệu suất diễn, sơ đồ ghế, popup
pano.js           # engine khung xem toàn cảnh 360°
vercel.json       # cấu hình cache + clean URLs
```

Sửa `styles.css` hay tệp `.js` nào thì nhớ tăng số `?v=` ở **tất cả** các trang
HTML, nếu không trang bỏ sót sẽ vẫn ăn bản cũ trong bộ nhớ đệm trình duyệt.

## Đặt chỗ

Nhà hát **không bán vé** — luồng này chỉ giữ chỗ miễn phí, không có giá tiền
hay thanh toán. Bốn bước: chọn suất → chọn ghế trên sơ đồ rạp → điền thông tin
→ nhận mã giữ chỗ.

Dùng được ở hai nơi, chung một engine trong `booking.js`:

- **Trang riêng** `dat-cho.html`, vào thẳng một suất qua `dat-cho.html?suat=nhc-0808`
- **Popup** ở trang chủ, bấm nút "Đặt chỗ" trên hàng lịch biểu diễn

Sửa danh sách suất diễn tại mảng `SHOWS` đầu file `booking.js`. Trường `fill`
là tỉ lệ ghế đã có người (0 → trống trơn, 1 → kín chỗ, nút bị khóa). Sơ đồ ghế
gồm 10 hàng A-J, mỗi hàng 16 ghế; hàng D-G là khu trung tâm.

## Chạy thử ở máy

Mở trực tiếp `index.html` bằng trình duyệt, hoặc:

```bash
npx serve .
```

## Đưa lên GitHub

```bash
git init
git add .
git commit -m "Trang chủ Nhà hát Chèo Quân đội"
git branch -M main
git remote add origin https://github.com/<tài-khoản>/<tên-repo>.git
git push -u origin main
```

## Deploy Vercel

1. Vào https://vercel.com/new → **Import** repo vừa push.
2. Framework Preset: **Other**.
3. Build Command: để trống. Output Directory: để trống (mặc định thư mục gốc).
4. Bấm **Deploy**.

Không cần cài gì thêm — Vercel phục vụ file tĩnh trực tiếp.

## Các phần trên trang chủ

Top bar → Header (Trang chủ · Trải nghiệm · Vở diễn · Giới thiệu · Lịch sử ·
Tin tức · Đặt chỗ) → Slider hero (3 slide, tự chạy) → Thông tin nhanh →
Lịch biểu diễn → Nghệ sĩ tiêu biểu → Giới thiệu + số liệu → Tin tức & Sự kiện →
CTA đặt chỗ → Footer.

Menu ngang có **bảy mục**. Quãng 861-1120px đã được bóp cỡ chữ và khoảng đệm cho
vừa (xem comment trong `styles.css`); thêm mục thứ tám thì phải đo lại quãng này.

## Bảng màu

Lấy theo brand guideline của Nhà hát, khai báo ở `:root` đầu `styles.css`:

| Token | Mã | Vai trò |
|---|---|---|
| `--red` | `#cc4752` | màu chính: nút, tiêu đề, viền trái thẻ |
| `--green` | `#85c663` | màu chính: trạng thái còn chỗ / thành công |
| `--gold` | `#ffcd00` | màu chính: **nền**, huy hiệu, nhãn huy chương |
| `--sand` | `#d0d09d` | phụ: khối chờ nội dung (`.soon`, tư liệu) |
| `--army` | `#22372f` | phụ: thanh trên cùng, chân trang, khối tầm nhìn |

Nền kem giấy dó (`--cream`, `--cream-2`, `--line`) giữ nguyên vì guideline không
quy định màu nền.

**Lưu ý về vàng**: `#ffcd00` quá sáng để làm màu chữ trên nền kem (tương phản
~1.5:1, gần như không đọc được). Nên có ba token tách vai: `--gold` cho nền,
`--gold-ink` (`#8a6f00`) cho chữ vàng trên nền sáng, `--gold-light` cho chữ vàng
trên nền tối. Đừng gộp lại thành một.

## Trang Vở diễn

`vo-dien.html` là kho tác phẩm, chia bốn mảng có mục lục dính:

1. **Chèo cổ & truyền thống** — nền tảng nghề nghiệp Nhà hát kế thừa
2. **Đề tài người lính** — trọng tâm, ba nhóm con: thời phong kiến/lịch sử,
   kháng chiến chống Pháp & chống Mỹ, hậu chiến & thời bình
3. **Danh nhân & lãnh đạo**
4. **Theo giai đoạn phát triển**
5. **Vở diễn đoạt giải** — bảng vàng huy chương và giải thưởng

Mỗi mảng mở đầu bằng vài thẻ nổi bật (`.expcard--work`, ảnh là gradient giả lập
khai báo qua `[data-work="..."] .expcard__art`), phần còn lại xếp thành danh sách
`.works` gọn theo năm. Thêm vở mới chỉ cần thêm một khối `.work`; vở nào chưa rõ
năm dàn dựng thì để `<span class="work__year"></span>` rỗng cho thẳng cột.

Danh mục hiện là **bản tuyển chọn**, chưa phải toàn bộ tác phẩm — và một số vở
xuất hiện ở nhiều mảng (ví dụ *Công lý không gục ngã*). Các dòng trong danh sách
chưa phải liên kết vì mỗi vở chưa có trang riêng.

Mục **Vở diễn đoạt giải** dùng thành phần `.laurel`: mỗi vở một thẻ, bên trong là
danh sách giải, mỗi giải một nhãn `.laurel__medal` (`--gold` huy chương Vàng,
`--silver` Bạc, `--top` giải A/Xuất sắc, `--plain` giải B/C/chứng nhận). Cố ý
không dùng cột năm như `.works` vì một vở có thể đoạt nhiều giải ở nhiều năm.

Phần thưởng của bản thân Nhà hát (huân chương, danh hiệu Anh hùng LLVTND) nằm ở
`gioi-thieu.html#khen-thuong`, hai mục có liên kết qua lại.

## Ghi chú

- Ảnh hiện là khối gradient giả lập (`[data-art]` trong `styles.css`) để trang chạy
  được ngay không cần tài nguyên ngoài. Khi có ảnh thật, thay bằng `<img>` hoặc
  `background-image: url(...)`.
- Nội dung (tên vở diễn, nghệ sĩ, tin tức, số điện thoại, địa chỉ) là dữ liệu mẫu,
  cần thay bằng thông tin chính thức trước khi dùng thật.
