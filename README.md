# Nhà hát Chèo Quân đội — Trang chủ (demo)

Trang chủ tĩnh (HTML/CSS/JS thuần), không cần build, deploy thẳng lên Vercel.

## Cấu trúc

```
index.html    # toàn bộ nội dung trang chủ
styles.css    # giao diện, responsive
script.js     # slider, menu mobile, đếm số, hiệu ứng cuộn
vercel.json   # cấu hình cache + clean URLs
```

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

Top bar → Header + menu → Slider hero (3 slide, tự chạy) → Thông tin nhanh →
Lịch biểu diễn → Vở diễn → Giới thiệu + số liệu → Tin tức & Sự kiện →
Nghệ sĩ tiêu biểu → Thư viện ảnh/video → CTA đặt vé → Footer.

## Ghi chú

- Ảnh hiện là khối gradient giả lập (`[data-art]` trong `styles.css`) để trang chạy
  được ngay không cần tài nguyên ngoài. Khi có ảnh thật, thay bằng `<img>` hoặc
  `background-image: url(...)`.
- Nội dung (tên vở diễn, nghệ sĩ, tin tức, số điện thoại, địa chỉ) là dữ liệu mẫu,
  cần thay bằng thông tin chính thức trước khi dùng thật.
