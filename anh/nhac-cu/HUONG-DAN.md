# Phông sân khấu nhạc cụ

Thư mục này đựng **tấm phông sân khấu** — thứ kéo lên che kín cảnh 360 khi
người xem bấm cái hộp giữa đáy màn, để sáu nhạc cụ 3D đứng lên đó.

| Tệp | Cỡ | Nặng |
|---|---|---|
| `nen-san-khau.webp` | 1536 × 1024 | 155 KB |

Ảnh hiện dùng là **ảnh dựng bằng AI**: rèm nhung đỏ thêu hoa văn mây, sàn gỗ
đánh bóng, mấy vũng đèn hắt sẵn trên sàn. Không có người, không có chữ.

Bản gốc `.png` nằm cùng thư mục nhưng **không đẩy lên git** (`.gitignore` bỏ qua
`anh/nhac-cu/*.png`) — chỉ bản `.webp` đã nén mới lên web.

---

## Thay ảnh khác

Thả tệp mới vào đây rồi bảo tôi nén và lắp. Ba điều bắt buộc:

**Tỉ lệ 3:2 nằm ngang.** `nhac-cu.js` ghim cứng con số này (`TI_LE_NEN`) để tính
chỗ cắt. Đưa ảnh tỉ lệ khác thì phải sửa cả hằng số đó.

**Vạch chân sàn phải nằm quanh 77% bề cao ảnh.** Đây là chỗ nhạc cụ đứng.
`nhac-cu.js` đặt chân chúng ở `V_SAN = 0.17` — đo từ ĐÁY ảnh lên, tức 83% từ
trên xuống — rồi mấy hàng lùi lại thì nhích lên dần. Ảnh nào có mặt sàn nằm cao
hơn hay thấp hơn nhiều thì nhạc cụ đứng hẫng giữa không trung hoặc thụt xuống
dưới mép sân khấu; sửa `V_SAN` cho khớp.

**Mặt sàn phải chiếm chừng một phần tư dưới cùng.** Sàn hẹp hơn thì trên điện
thoại dựng đứng không đủ chỗ xếp ba hàng nhạc cụ.

Nên có, không bắt buộc: **vài vũng đèn hắt sẵn trên sàn**, trải đều theo bề
ngang. Chúng làm nền cho mấy cây nhạc cụ đứng, và ăn khớp với luồng đèn 3D rọi
xuống cây đang được chọn.

**Đừng vẽ sẵn nhạc cụ vào phông.** Nhạc cụ là mô hình 3D dựng đè lên, vẽ thêm
vào ảnh là thành hai bộ chồng nhau.

Cỡ 1536 × 1024 là đủ: màn 1366 chỉ dùng tới 1400 điểm ảnh bề ngang. To hơn thì
nét hơn trên màn 4K nhưng tệp nặng thêm, mà tệp này tải cùng lúc với 2,8 MB mô
hình rồi.

Prompt đã dùng, đại ý:

```
Empty traditional Vietnamese theatre stage, deep red velvet stage curtain with
subtle embroidered cloud motifs, polished warm wooden stage floor in the lower
third, soft warm spotlight pools on the floor, cinematic theatre lighting,
3:2 aspect ratio, no people, no instruments, no text, no signage.
```

---

## Ảnh từng nhạc cụ nền trong suốt — KHÔNG CẦN NỮA

Trước có dự tính cắt rời từng nhạc cụ thành ảnh phẳng nền trong suốt cho chúng
bay ra. **Bỏ rồi**: nay dùng thẳng mô hình 3D ở `mo-hinh/`, xoay được nhiều
góc, đèn rọi vào có mặt sáng mặt tối, hơn hẳn ảnh phẳng. Đừng mất công làm bộ
ảnh đó nữa.

Xem thêm: `mo-hinh/HUONG-DAN.md` (mô hình 3D của nhạc cụ),
`am/nhac-cu/HUONG-DAN.md` (tiếng nhạc cụ),
`anh/360/HUONG-DAN.md` (ảnh toàn cảnh 360 của khung nền).
