# Mô hình 3D

Thư mục này đựng **mô hình 3D của nhạc cụ** — thứ xem xoay được nhiều góc, khác
với ảnh phẳng nền trong suốt ở `anh/nhac-cu/`.

**Đã chạy.** Bấm cái hộp giữa đáy màn lúc đang xem 360 toàn màn hình thì một
tấm phông sân khấu kéo lên che kín cảnh, rồi sáu nhạc cụ lần lượt mọc lên khỏi
mặt sàn, xếp thành hàng và xoay tròn chầm chậm.

Chạm vào cây nào thì cây đó rời chỗ, bay ra giữa khung hình, một luồng đèn rọi
xuống đúng nó, cả sân khấu còn lại tối đi, và nó kêu lên tiếng của chính mình.
Chạm được nhiều cây một lúc — cả đám cùng ra giữa, tự dàn thành hàng rồi lùi
lại vừa đủ cho khỏi chen nhau. Chạm lại cây đang lơ lửng thì nó kêu tiếp chứ
không rơi xuống; muốn cất hết thì chạm vào khoảng trống trên sân khấu. Đang lơ
lửng vẫn kéo đi được, thả tay ra là bay theo đà rồi dạt về chỗ cũ.

Dựng ở `nhac-cu.js`.

---

## Tên tệp

Sáu tệp hiện có, đã lắp vào khung 360:

| Tệp | Hiện tên là | Cỡ | Tam giác |
|---|---|---|---|
| `dan-nhi.glb` | Đàn nhị | 208 KB | 5.484 |
| `ruan.glb` | Đàn nguyệt | 420 KB | 12.576 |
| `sao-tre.glb` | Sáo trúc | 249 KB | 5.136 |
| `trong-com.glb` | Trống cơm | 757 KB | 28.700 |
| `mo-go.glb` | Mõ | 475 KB | 18.116 |
| `cong-chieng.glb` | Cồng chiêng | 739 KB | 26.724 |

**`ruan.glb` cần soát lại.** Ruan (阮, nguyễn cầm) là nhạc cụ Trung Quốc. Dựng
lên nhìn thì đúng dáng thùng tròn dẹt cần dài của đàn nguyệt Việt Nam, nên tạm
để tên "Đàn nguyệt", nhưng đàn nguyệt chỉ có **hai dây**, ruan có **bốn**. Đây là
trang của một nhà hát chèo, ai biết nghề nhìn là ra. Tìm được mô hình đàn nguyệt
đúng thì thay, đổi cả `ma` trong bảng `NHAC_CU` của `nhac-cu.js`.

Thêm nhạc cụ mới: thả `.glb` vào đây rồi thêm một dòng vào bảng `NHAC_CU`
trong `nhac-cu.js`. Mỗi dòng khai:

| Cột | Nghĩa |
|---|---|
| `ma` | tên tệp, không đuôi. Cũng là tên tệp tiếng bên `am/nhac-cu/` |
| `ten` | tên tiếng Việt |
| `quay` | chỉnh quanh trục đứng (độ), để mặt đẹp quay về phía người xem |
| `nghieng` | nhấc một đầu lên (độ, quanh trục Z) cho cây nằm ngang ra hình |
| `co` | chỉnh riêng cỡ, để 1 là theo công thức chung |

**Chỗ đứng thì không phải khai.** `nhac-cu.js` tự rải sáu cây theo bề ngang
khung: màn rộng thì một hàng, màn hẹp thì zích zắc thành hai ba hàng lùi dần về
sau, cây to chiếm nhiều chỗ hơn cây nhỏ. Chỗ lơ lửng giữa khung cũng tự tính,
theo số cây đang được nhấc lên.

**Cỡ cũng không phải khai.** Nó đo hộp bao rồi cào bằng theo CĂN BẬC HAI cỡ
thật: giữ đúng thứ tự to nhỏ mà nén khoảng cách lại, nên giàn cồng chiêng 1,46m
không nuốt chửng cây sáo 0,67m mà cũng không to bằng nhau như đồ chơi. Chỉ động
tới cột `co` khi tệp có kèm đồ lặt vặt nằm rải ra làm hộp bao phình to mà thân
chính thì bé tí — mõ có hai dùi, cồng chiêng có một chiếc rời, cả hai đang phải
nhân thêm.

`nghieng` là thứ hay phải chỉnh nhất: **sáu tệp hiện có thì ba tệp dựng NẰM
NGANG** (sáo 0,67 × 0,03 × 0,14 — gần như một cái que dẹt), để nguyên thì đứng
trên sân khấu chỉ còn một vệt. Nhấc một đầu lên là ra hình.

Chọn `quay` bằng cách dựng thử mô hình ở vài góc rồi ngắm. Cây vẫn xoay tròn
chầm chậm nên con số này chỉ là chỗ bắt đầu, nhưng **đừng để nó quay CẠNH về
phía người xem ngay lúc vừa hiện ra**: đo thật, cây sáo nhìn từ đầu chỉ còn
28×11 điểm ảnh trên màn 1366, coi như biến mất.

---

## Yêu cầu kỹ thuật

Sáu tệp hiện có đều đã soát và đạt hết: glTF 2.0 hợp lệ, không dùng Draco hay
KTX2, ảnh bề mặt nhúng sẵn trong tệp, không kèm hoạt hình hay camera thừa. Tổng
2,8 MB, cộng 155 KB ảnh phông — chỉ tải khi người xem bước vào toàn màn hình.

**Định dạng: `.glb`, không phải gì khác.**

`.glb` là glTF đóng gói thành **một tệp duy nhất**, vân bề mặt nhúng sẵn bên
trong. Đừng đưa `.obj`, `.fbx`, `.blend`, hay `.gltf` rời — mấy loại đó kéo theo
một đống tệp phụ (`.mtl`, thư mục textures), thiếu một cái là mô hình lên web
thành màu xám trơn hoặc không lên được. `.glb` thì kéo thả một tệp là xong.

Blender xuất được thẳng: **File → Export → glTF 2.0**, chọn định dạng **glTF
Binary (.glb)**.

**Dưới 3 MB mỗi mô hình.** 5 MB là ngưỡng phải nén lại. Trang này không có bước
build, tệp nặng là người xem phải tải nguyên vẹn từng byte.

**Trục Y hướng lên.** Quy ước của glTF.

Vật đặt giữa gốc toạ độ thì tốt, nhưng **không bắt buộc**: `nhac-cu.js` tự đo
hộp bao rồi kéo ĐÁY hộp về đúng mặt sàn sân khấu, lấy chính giữa chân làm trục
xoay. Thiếu bước đó thì lúc xoay tròn nó văng vòng quanh một điểm ngoài không
khí, mà lúc mọc lên khỏi sàn thì chui lên từ lưng chừng trời.

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

Xem thêm: `am/nhac-cu/HUONG-DAN.md` (tiếng nhạc cụ — chạm vào mô hình là kêu),
`anh/nhac-cu/HUONG-DAN.md` (tấm phông sân khấu),
`anh/360/HUONG-DAN.md` (ảnh toàn cảnh).
