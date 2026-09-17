# Tiếng nhạc cụ

Thư mục này đựng **tiếng của từng nhạc cụ**. Người xem chạm vào một cây trên
sân khấu nhạc cụ — cây đó bay lơ lửng lên, đèn rọi vào — thì nghe thấy tiếng
của chính nó.

Đường dẫn đã nối sẵn trong `nhac-cu.js`. **Thả tệp vào đúng tên là tự kêu**,
không phải sửa dòng mã nào.

---

## Tên tệp

Mã phải trùng với tệp mô hình bên `mo-hinh/`:

| Nhạc cụ | Tệp cần | Mô hình tương ứng |
|---|---|---|
| Đàn nhị | `dan-nhi.mp3` | `mo-hinh/dan-nhi.glb` |
| Đàn nguyệt | `ruan.mp3` | `mo-hinh/ruan.glb` |
| Sáo trúc | `sao-tre.mp3` | `mo-hinh/sao-tre.glb` |
| Trống cơm | `trong-com.mp3` | `mo-hinh/trong-com.glb` |
| Mõ | `mo-go.mp3` | `mo-hinh/mo-go.glb` |
| Cồng chiêng | `cong-chieng.mp3` | `mo-hinh/cong-chieng.glb` |

Chưa có tệp nào thì chạm vào nhạc cụ vẫn bay lên, vẫn sáng đèn, vẫn kéo đi
được, chỉ là im. Không lỗi gì cả — `nhac-cu.js` thử phát, bị từ chối thì thôi
và ghi nhớ để khỏi thử lại mỗi lần chạm.

---

## Yêu cầu

**Định dạng `.mp3`.** Mọi trình duyệt đều phát được, không phải lo tương thích
như `.ogg` hay `.opus`.

**Ngắn thôi — 1 đến 3 giây.** Đây là tiếng phản hồi khi chạm, không phải bản
nhạc. Chạm phát ba giây rồi tắt là vừa; dài hơn thì người xem chạm cái thứ hai
đã chồng tiếng lên nhau nghe loạn.

- **Trống cơm, mõ, cồng chiêng**: đúng một tiếng gõ, để ngân hết rồi cắt.
- **Đàn nhị, đàn nguyệt, sáo trúc**: một câu nhạc rất ngắn hoặc vài nốt luyến,
  đủ nghe ra chất giọng của cây đàn.

**Cắt sạch khoảng lặng ở đầu.** Thừa nửa giây im ở đầu tệp là chạm xong phải
đợi mới nghe thấy, cảm giác như máy đơ.

**Vuốt nhỏ dần ở cuối** (fade out 50–100 mili giây) để khỏi "cụp" một tiếng
khi âm thanh bị cắt ngang.

**Chuẩn hoá âm lượng đều nhau giữa sáu tệp.** Đỉnh khoảng −3 dB. Sáu tệp thu ở
sáu chỗ khác nhau mà không cân lại thì chạm cái này êm ru, chạm cái kia giật
mình.

**Một kênh (mono) là đủ**, và nhẹ hơn một nửa.

**44,1 kHz, 128 kbps.** Mỗi tệp chừng 30–50 KB.

**Không nhạc nền, không tiếng vỗ tay, không tiếng người nói.** Chỉ tiếng nhạc
cụ trên nền im.

---

## Lấy tiếng ở đâu

**Tốt nhất là thu chính nhạc cụ của Nhà hát** — nhạc công của Nhà hát chơi,
thu bằng điện thoại trong phòng kín cũng đủ dùng ở độ dài này. Vừa đúng vừa
không phải xin phép ai.

Nếu lấy từ nguồn khác thì **phải kiểm giấy phép**. Freesound.org có nhiều tiếng
nhạc cụ dân tộc, nhưng mỗi tệp một kiểu giấy phép — loại CC0 mới dùng thoải
mái, loại CC-BY phải ghi tên người thu.

**Coi chừng nhầm nhạc cụ.** Tìm tiếng nhạc cụ dân tộc trên mạng rất hay ra nhạc
cụ Trung Quốc nghe na ná: nhị hồ (erhu) không phải đàn nhị, nguyễn cầm (ruan)
không phải đàn nguyệt. Nghe kỹ trước khi dùng — đây là trang của một nhà hát
chèo, sai chỗ này là sai chuyên môn.

---

## Đưa vào kho

Thả thẳng `.mp3` vào thư mục này. Tệp nhỏ nên **đẩy lên git bình thường**,
không có bản nén riêng nào cả.

Xem thêm: `mo-hinh/HUONG-DAN.md` (mô hình 3D), `anh/nhac-cu/HUONG-DAN.md`
(ảnh phẳng nền trong suốt), `anh/360/HUONG-DAN.md` (ảnh toàn cảnh).
