# Ảnh nhạc cụ — cho cái hộp trong không gian 360

Thư mục này đựng **ảnh từng nhạc cụ, nền trong suốt**. Chúng sẽ bay ra lơ lửng
khi người xem bấm cái hộp ở giữa đáy màn, lúc đang xem toàn màn hình 360.

Hộp đã dựng xong ở `pano.js` (`.pano__hop`), nhưng **bấm chưa làm gì** — phần
nhạc cụ bay ra sẽ gắn sau. Cứ thả ảnh vào đây trước.

---

## Tên tệp

Sáu nhạc cụ của dàn nhạc chèo, đặt đúng tên này:

| Nhạc cụ | Tệp | Mô tả (dùng làm chú thích khi hiện ra) |
|---|---|---|
| Đàn nhị | `dan-nhi.webp` | Cây đàn hai dây kéo bằng vĩ, giữ vai trò dẫn giai điệu và nâng giọng hát trong chiếu chèo. |
| Trống đế | `trong-de.webp` | Nhạc cụ giữ nhịp và điểm xuyết, tiếng trống đế mở màn báo hiệu chiếu chèo bắt đầu. |
| Đàn nguyệt | `dan-nguyet.webp` | Đàn thùng tròn hai dây, âm sắc ấm và vang, thường đi cùng những làn điệu trữ tình. |
| Sáo trúc | `sao-truc.webp` | Tiếng sáo trong trẻo gợi không gian làng quê Bắc Bộ, nền cảnh quen thuộc của nghệ thuật chèo. |
| Phách & mõ | `phach-mo.webp` | Bộ gõ nhỏ giữ tiết tấu cho người hát, gắn liền với lối hát nói đặc trưng của chèo. |
| Thanh la & chũm chọe | `thanh-la.webp` | Bộ gõ kim loại tạo điểm nhấn mạnh trong các lớp diễn cao trào và cảnh hội hè. |

Không nhất thiết phải đủ sáu mới lắp được. Có mấy cái thì hộp bay ra mấy cái.

---

## Yêu cầu kỹ thuật

**Nền phải TRONG SUỐT.** Đây là điều kiện sống còn: mấy tấm này nổi trên ảnh 360
tối màu, có nền trắng là thành sáu miếng giấy dán lên màn hình. Nền trắng, nền
xám, hay viền trắng còn sót quanh mép đều hỏng như nhau.

**Khung vuông, vật nằm giữa.** Chừa lề khoảng 6% mỗi bên. Vuông thì lúc xoay
nhẹ trong không gian mới không bị lệch tâm.

**Cạnh 1024px là đủ.** Mỗi nhạc cụ bay ra chỉ chiếm chừng 15–25% bề cao màn,
nên to hơn cũng không thấy rõ hơn, chỉ nặng thêm.

**Đừng nướng sẵn bóng đổ vào ảnh.** Bóng để CSS làm. Nướng sẵn thì đặt lên nền
sáng hay nền tối cũng lệch, và xoay là bóng xoay theo, nhìn sai ngay.

**Đặt đúng hướng đứng tự nhiên** — đàn nhị và đàn nguyệt dựng dọc, sáo trúc nằm
ngang, trống đế nhìn chếch thấy cả mặt trống lẫn tang trống.

**Ánh sáng đều, không cháy sáng.** Mặt gỗ cháy trắng là mất hết vân, nhìn như
đồ nhựa.

**Không chữ, không logo, không bàn tay người.**

**Mỗi tệp dưới 120 KB** sau khi nén. Sáu cái khoảng 700 KB — chỉ tải khi người
xem mở hộp, không tải sẵn lúc vào trang.

---

## Cách làm ảnh

**Cách tốt nhất: chụp nhạc cụ thật của Nhà hát** trên nền trơn một màu (vải đen
hoặc phông trắng), ánh sáng tản đều hai bên, rồi tách nền. Đây là nhạc cụ của
Nhà hát nên ảnh thật vừa đúng vừa không phải giải thích gì.

Tách nền: **remove.bg** (miễn phí, tự động, đủ dùng cho vật thể rõ nét) hoặc
Photoshop nếu cần tỉa kỹ phần dây đàn mảnh — chỗ dây đàn là chỗ máy tự động hay
ăn mất nhất, tách xong phải phóng to soi lại.

**Nếu chưa chụp được thì dựng bằng AI.** Prompt mẫu cho đàn nhị, mấy cái khác
đổi tên nhạc cụ và phần mô tả hình dáng:

```
A traditional Vietnamese dan nhi two-string bowed fiddle, studio product photograph,
isolated on a plain pure white background, full instrument visible standing upright,
soft even diffused lighting from both sides, sharp focus, rich natural wood grain,
python skin soundbox, no shadow on the background, no hands, no people, no text.
```

Gen ra rồi vẫn phải tách nền — AI trả về nền trắng chứ không trả về nền trong
suốt. Và nhớ **nói rõ trong trang là ảnh dựng bằng AI** nếu dùng cách này, y
như đã từng làm với ảnh 360.

---

## Đưa vào kho

Thả tệp `.png` nền trong suốt vào thẳng thư mục này. Tôi sẽ nén sang `.webp`
(webp giữ được nền trong suốt, nhẹ hơn png chừng một nửa) rồi lắp vào.

**Lưu ý:** `.gitignore` đang bỏ qua `anh/nhac-cu/*.png` — bản `.png` gốc nằm lại
trên máy bạn, chỉ bản `.webp` đã nén mới được đẩy lên web. Giống hệt cách làm
với `anh/360/`. Nghĩa là thả png vào rồi mà chưa ai nén thì trên web chưa có gì.

Xem thêm: `anh/360/HUONG-DAN.md` (ảnh toàn cảnh), `mo-hinh/HUONG-DAN.md` (mô
hình 3D của chính mấy nhạc cụ này).
