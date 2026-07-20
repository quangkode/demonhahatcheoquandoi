# Nhà hát Chèo Quân đội — Trang chủ (demo)

Trang chủ tĩnh (HTML/CSS/JS thuần), không cần build, deploy thẳng lên Vercel.

## Cấu trúc

```
index.html      # trang chủ
gioi-thieu.html # trang giới thiệu
dat-cho.html    # trang đặt chỗ xem chèo
styles.css      # giao diện, responsive
script.js       # slider, menu mobile, đếm số, hiệu ứng cuộn
booking.js      # engine đặt chỗ: dữ liệu suất diễn, sơ đồ ghế, popup
vercel.json     # cấu hình cache + clean URLs
```

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

## Các phần trên trang

Top bar → Header (Trang chủ · Giới thiệu · Đặt chỗ) → Slider hero (3 slide, tự chạy) →
Thông tin nhanh → Lịch biểu diễn → Nghệ sĩ tiêu biểu → Giới thiệu + số liệu →
Tin tức & Sự kiện → CTA đặt chỗ → Footer.

Các khối Vở diễn và Thư viện ảnh/video tạm thời bỏ, sẽ bổ sung sau.

## Ghi chú

- Ảnh hiện là khối gradient giả lập (`[data-art]` trong `styles.css`) để trang chạy
  được ngay không cần tài nguyên ngoài. Khi có ảnh thật, thay bằng `<img>` hoặc
  `background-image: url(...)`.
- Nội dung (tên vở diễn, nghệ sĩ, tin tức, số điện thoại, địa chỉ) là dữ liệu mẫu,
  cần thay bằng thông tin chính thức trước khi dùng thật.
