# Mô hình 3D

Thư mục này đựng **mô hình 3D của nhạc cụ** — thứ xem xoay được nhiều góc, khác
với ảnh phẳng nền trong suốt ở `anh/nhac-cu/`.

**Khung xem 3D chưa dựng.** Đây mới là chỗ để sẵn tệp. Thả mô hình vào rồi bảo
tôi thì tôi lắp khung xem.

---

## Tên tệp

Cùng mã với ảnh phẳng, chỉ khác đuôi:

| Nhạc cụ | Tệp |
|---|---|
| Đàn nhị | `dan-nhi.glb` |
| Trống đế | `trong-de.glb` |
| Đàn nguyệt | `dan-nguyet.glb` |
| Sáo trúc | `sao-truc.glb` |
| Phách & mõ | `phach-mo.glb` |
| Thanh la & chũm chọe | `thanh-la.glb` |

---

## Yêu cầu kỹ thuật

**Định dạng: `.glb`, không phải gì khác.**

`.glb` là glTF đóng gói thành **một tệp duy nhất**, vân bề mặt nhúng sẵn bên
trong. Đừng đưa `.obj`, `.fbx`, `.blend`, hay `.gltf` rời — mấy loại đó kéo theo
một đống tệp phụ (`.mtl`, thư mục textures), thiếu một cái là mô hình lên web
thành màu xám trơn hoặc không lên được. `.glb` thì kéo thả một tệp là xong.

Blender xuất được thẳng: **File → Export → glTF 2.0**, chọn định dạng **glTF
Binary (.glb)**.

**Dưới 3 MB mỗi mô hình.** 5 MB là ngưỡng phải nén lại. Trang này không có bước
build, tệp nặng là người xem phải tải nguyên vẹn từng byte.

**Trục Y hướng lên, vật đặt giữa gốc toạ độ.** Đây là quy ước của glTF. Mô hình
lệch khỏi gốc thì lúc xoay nó quay quanh một điểm ở ngoài không trung chứ không
quay quanh chính nó.

**Kích thước thật, tính bằng mét.** Đàn nguyệt dài khoảng 1,08m thì trong tệp
cũng phải là 1,08 đơn vị.

**Vân bề mặt tối đa 2048×2048.** Mỗi mô hình một bộ vân thôi; nhiều bộ vân nhỏ
tốn hơn một bộ lớn.

**Dưới 60 nghìn tam giác.** Nhạc cụ không cần nhiều hơn thế, và điện thoại đời
cũ bắt đầu khựng từ khoảng đó.

**Gỡ hết thứ không dùng trước khi xuất**: camera, đèn, mesh ẩn, khung xương hoạt
hình nếu không có chuyển động. Blender hay xuất kèm cả đám đó mà không hỏi.

---

## Nén lại nếu quá nặng

Cách nhanh nhất là **gltf-transform** (chạy bằng npx, không phải cài gì):

```
npx @gltf-transform/cli optimize vao.glb ra.glb --texture-compress webp
```

Lệnh đó gộp mesh, nén vân sang webp và nén hình học bằng Draco. Thường giảm
được 60–80% mà mắt thường không thấy khác.

Hoặc ngay trong Blender, lúc xuất glTF bật mục **Compression** (Draco).

---

## Cách làm mô hình

**Quét vật thật** cho ra hình đúng nhất: dùng ứng dụng quét trên điện thoại
(Polycam, Scaniverse, KIRI Engine — đều có bản miễn phí), đi vòng quanh nhạc cụ
đặt trên bàn, chụp đều bốn phía và cả từ trên xuống. Nhạc cụ có dây mảnh như đàn
nhị thì máy quét hay bỏ sót dây, quét xong phải soi lại.

**Mua mô hình sẵn** trên Sketchfab hoặc TurboSquid cũng được — nhưng nhớ giữ lại
giấy phép và kiểm xem có cho dùng thương mại không. Nhạc cụ dân tộc Việt Nam
trên mấy chợ đó không nhiều, và loại có sẵn thường là nhạc cụ Trung Quốc nhìn
na ná, đừng lấy nhầm: đàn nhị Việt khác nhị hồ Trung Quốc ở tang đàn và cách
mắc dây.

**Dựng tay trong Blender** nếu có người làm được. Nhạc cụ hình khối đơn giản nên
không khó, phần tốn công là vân gỗ và da trăn bọc tang đàn.

---

## Đưa vào kho

Thả thẳng `.glb` vào thư mục này rồi bảo tôi. Khác với ảnh, **tệp `.glb` được
đẩy lên git bình thường** vì chính nó là bản dùng trên web, không có bản nén
riêng nào nữa.

Nếu tệp trên 5 MB thì nói trước để tôi nén lại chứ đừng đẩy thẳng — đẩy rồi mà
sau muốn thay bằng bản nhẹ hơn thì bản nặng vẫn nằm lại mãi trong lịch sử git.

Xem thêm: `anh/nhac-cu/HUONG-DAN.md` (ảnh phẳng nền trong suốt của chính mấy
nhạc cụ này), `anh/360/HUONG-DAN.md` (ảnh toàn cảnh).
