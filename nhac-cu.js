/* ==========================================================
   Nhà hát Chèo Quân đội — Nhạc cụ 3D bay ra từ cái hộp

   Bấm cái hộp giữa đáy màn (lúc đang xem 360 toàn màn hình) thì sáu nhạc cụ
   bung ra, trôi lơ lửng quanh người xem. Kéo được từng cái; thả tay ra là nó
   bay theo đà rồi từ từ dạt về chỗ cũ. Chạm vào thì phát tiếng nhạc cụ đó.

   ----------------------------------------------------------
   VÌ SAO TÁCH KHỎI pano.js
   ----------------------------------------------------------
   pano.js không biết gì về 3D. Nó chỉ bắn ra hai sự kiện trên phần tử .pano:

     pano:full  { on }   vừa vào / vừa thoát toàn màn hình
     pano:hop   { mo }   người xem bấm mở / đóng hộp nhạc cụ

   Tệp này nghe hai sự kiện đó. Nhờ vậy CDN three.js bị chặn, tệp .glb hỏng,
   hay máy không chạy nổi WebGL thì khung 360 vẫn nguyên vẹn — chỉ là bấm hộp
   không ra gì. Không có chuyện cả trang chết theo.

   ----------------------------------------------------------
   THƯ VIỆN NGOÀI
   ----------------------------------------------------------
   Đây là chỗ DUY NHẤT trong cả trang dùng thư viện ngoài. Không có bộ dựng 3D
   thì không cách nào hiện được tệp .glb.

   three.js nạp bằng import ĐỘNG, chỉ chạy khi người xem thật sự bước vào toàn
   màn hình. Ai chỉ lướt qua trang thì không tải một byte nào của nó — 715 KB
   là quá đắt để bắt mọi người trả trước.

   Phiên bản ghim cứng trong import map ở trai-nghiem.html. Đừng đổi sang
   "latest": three.js đổi API giữa các bản khá thường.

   ----------------------------------------------------------
   THÊM NHẠC CỤ MỚI
   ----------------------------------------------------------
   Thả tệp .glb vào mo-hinh/ rồi thêm một dòng vào bảng NHAC_CU dưới đây.
   Yêu cầu kỹ thuật của tệp ghi ở mo-hinh/HUONG-DAN.md.
   ========================================================== */
'use strict';

/* Mỗi nhạc cụ một dòng.

   goc / cao : chỗ đứng của nó, tính bằng ĐỘ so với hướng người xem đang nhìn
               lúc bấm mở hộp. goc âm là bên trái, cao dương là phía trên.
   xa        : cách người xem bao nhiêu. Lệch nhau một chút cho có chiều sâu.
   nga       : xoay sẵn quanh trục X (độ) — mấy mô hình nằm ngang như sáo, mõ,
               trống cơm dựng hơi chếch lên thì nhìn rõ hình hơn là nằm bẹt.
   quay      : chỉnh thêm quanh trục đứng (độ) so với hướng quay mặt về phía
               người xem. Cần vì "mặt trước" của mỗi tệp .glb quay về đâu là
               tuỳ người dựng ra nó, chẳng ai thống nhất. */
const NHAC_CU = [
  { ma: 'dan-nhi',     ten: 'Đàn nhị',       goc: -40, cao:  -6, xa: 3.05, nga:   6, quay:  45 },
  { ma: 'ruan',        ten: 'Đàn nguyệt',    goc: -24, cao:  14, xa: 3.45, nga:   6, quay:   0 },
  { ma: 'sao-tre',     ten: 'Sáo trúc',      goc:  -8, cao: -15, xa: 2.85, nga: -14, quay:   0 },
  { ma: 'trong-com',   ten: 'Trống cơm',     goc:   9, cao:  13, xa: 3.35, nga: -10, quay:   0 },
  { ma: 'mo-go',       ten: 'Mõ',            goc:  25, cao: -13, xa: 2.95, nga: -16, quay:  45 },
  { ma: 'cong-chieng', ten: 'Cồng chiêng',   goc:  35, cao:   6, xa: 3.55, nga:   2, quay:   0 },
];

const THU_MUC_MO_HINH = './mo-hinh/';
const THU_MUC_AM      = './am/nhac-cu/';

/* Cạnh dài nhất của mọi nhạc cụ sau khi thu về cùng cỡ, tính bằng đơn vị thế
   giới. Mô hình gốc chênh nhau nhiều (sáo 0,67 m mà cồng chiêng 1,46 m) — để
   nguyên thì cái to át hết cái nhỏ. Cào bằng thế này nhìn cân hơn hẳn dù sai
   tỉ lệ thật; đây là hộp đồ chơi chứ không phải bản vẽ kỹ thuật.

   0,8 ở khoảng cách chừng 3,2 cho ra vật cao chừng 1/5 bề cao màn: nhìn rõ mặt
   nhạc cụ mà vẫn chừa trống chỗ sân khấu. Đây là thứ trôi quanh người xem chứ
   không phải thứ dựng chắn trước mặt. */
const CANH = 0.8;

/* Lò xo kéo nhạc cụ về chỗ của nó. Cố tình để nhẹ tay và thiếu giảm chấn:
   K nhỏ thì nó dạt về chậm rãi, D nhỏ thì nó lượn qua lượn lại vài nhịp mới
   yên — đó chính là cái "trôi nổi". Tăng K lên là thành dây chun, hỏng. */
const K_LO_XO   = 2.1;
const D_GIAM    = 2.05;
const K_VE_HOP  = 5.0;    // lúc thu về hộp thì dứt khoát hơn

const KHUNG = document.getElementById('pano');
if (KHUNG) khoiDong(KHUNG);

function khoiDong(khung) {
  let THREE = null, GLTFLoader = null;
  let renderer = null, canvas = null, scene = null, cam = null, tia = null;
  let vat = [];                       // thân của từng nhạc cụ, xem taoThan()
  let daTai = false, hong = false, taiXong = null;
  let mo = false, dangVe = false, veLuc = 0;
  let dangChay = false, lanTruoc = 0;
  let keo = null;                     // { than, xa, id, truoc, lucTruoc }

  const itDong = window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  khung.addEventListener('pano:full', (e) => { if (e.detail && e.detail.on) tai(); });
  khung.addEventListener('pano:hop', (e) => { (e.detail && e.detail.mo) ? bung() : thu(); });

  /* ---------- Nạp thư viện và mô hình ----------
     Gọi lúc vừa vào toàn màn hình chứ không đợi tới lúc bấm hộp: tải trước thì
     bấm hộp là bung ra liền. 2,8 MB mô hình mà đợi tới lúc bấm mới tải thì
     người xem đứng nhìn cái hộp câm mấy giây.

     Giữ đúng MỘT lời hứa dùng chung: ai gọi lúc đang tải dở cũng nhận lại lời
     hứa đó chứ không khởi động thêm lượt tải thứ hai. Nhờ vậy bấm hộp trong
     lúc còn đang tải vẫn bung ra được ngay khi xong. */
  function tai() {
    if (hong) return Promise.resolve();
    if (!taiXong) taiXong = taiThat();
    return taiXong;
  }

  async function taiThat() {
    chu('Đang mở…');
    try {
      const [t, g] = await Promise.all([
        import('three'),
        import('three/addons/loaders/GLTFLoader.js'),
      ]);
      THREE = t; GLTFLoader = g.GLTFLoader;
      dungCanh();
      const nap = new GLTFLoader();
      const ket = await Promise.all(NHAC_CU.map((n) =>
        nap.loadAsync(THU_MUC_MO_HINH + n.ma + '.glb')
           .then((r) => ({ n, r }))
           .catch(() => null)));
      ket.forEach((x) => { if (x) taoThan(x.n, x.r.scene); });
      if (!vat.length) throw new Error('không mô hình nào nạp được');
      /* Chỗ ngó vào cảnh 3D từ bảng điều khiển trình duyệt, để chỉnh chỗ đứng
         và đo khoảng cách mà không phải chèn thêm mã. Giống el.__pano bên
         pano.js. Không có mã nào của trang đọc biến này. */
      khung.__nhacCu = { vat, cam, scene };
      daTai = true;
      chu('Hộp nhạc cụ');
    } catch (err) {
      hong = true;
      chu('Hộp nhạc cụ');
      const h = khung.querySelector('.pano__hop');
      if (h) h.title = 'Không tải được mô hình nhạc cụ';
      console.warn('[nhac-cu] không dựng được cảnh 3D:', err);
    }
  }

  function chu(s) {
    const e = khung.querySelector('.pano__hop-chu');
    if (e) e.textContent = s;
  }

  /* ---------- Dựng cảnh ---------- */
  function dungCanh() {
    canvas = document.createElement('canvas');
    canvas.className = 'pano__3d';
    canvas.setAttribute('aria-hidden', 'true');
    khung.appendChild(canvas);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.32;

    scene = new THREE.Scene();
    cam = new THREE.PerspectiveCamera(63, 1, 0.1, 100);
    cam.rotation.order = 'YXZ';        // xoay ngang trước rồi mới ngẩng, giống khung 360
    tia = new THREE.Raycaster();

    /* Mấy tệp .glb này không có ảnh bề mặt, chỉ có màu trơn và độ bóng. Thiếu
       môi trường phản chiếu thì phần kim loại (cồng chiêng) đen sì. Dựng một
       môi trường giả từ một dải màu: sáng ấm trên đầu, tối dần xuống chân —
       đúng kiểu ánh đèn khán phòng. */
    const c = document.createElement('canvas');
    c.width = 8; c.height = 64;
    const g2 = c.getContext('2d');
    const dai = g2.createLinearGradient(0, 0, 0, 64);
    dai.addColorStop(0.00, '#fff3d6');
    dai.addColorStop(0.42, '#9d8360');
    dai.addColorStop(1.00, '#161009');
    g2.fillStyle = dai; g2.fillRect(0, 0, 8, 64);
    const anh = new THREE.CanvasTexture(c);
    anh.mapping = THREE.EquirectangularReflectionMapping;
    anh.colorSpace = THREE.SRGBColorSpace;
    const pm = new THREE.PMREMGenerator(renderer);
    scene.environment = pm.fromEquirectangular(anh).texture;
    pm.dispose(); anh.dispose();

    // đèn chính hắt từ trên chếch xuống, cho nhạc cụ có mặt sáng mặt tối
    const den = new THREE.DirectionalLight(0xfff0d0, 2.2);
    den.position.set(2.5, 4, 2);
    scene.add(den);
    // đèn hắt ngược từ dưới chếch sau, tách nhạc cụ khỏi nền khán phòng vốn
    // cũng nâu đỏ — thiếu nó thì gỗ chìm lẫn vào tường gỗ
    const hat = new THREE.DirectionalLight(0xffd9a0, 0.9);
    hat.position.set(-3, -1.5, -2);
    scene.add(hat);
    scene.add(new THREE.AmbientLight(0xffe9c4, 0.5));

    canvas.addEventListener('pointerdown', chamXuong);
    canvas.addEventListener('pointermove', keoDi);
    canvas.addEventListener('pointerup', nhacTay);
    canvas.addEventListener('pointercancel', nhacTay);
    canvas.addEventListener('pointerleave', reView);
  }

  /* Bọc mô hình vào hai lớp:
       boc   — thứ mà vật lý dời đi, xoay đi
       trong — dời tâm mô hình về gốc rồi thu về cùng cỡ
     Tách hai lớp để lúc xoay `boc` thì nó quay quanh chính giữa nhạc cụ. Mấy
     tệp này đều dựng nhạc cụ ĐỨNG TRÊN MẶT ĐẤT nên tâm nằm lơ lửng phía trên
     gốc toạ độ; xoay thẳng là nó văng vòng tròn quanh một điểm ngoài không khí. */
  function taoThan(n, goc) {
    const hop = new THREE.Box3().setFromObject(goc);
    const co = hop.getSize(new THREE.Vector3());
    const tam = hop.getCenter(new THREE.Vector3());
    const ty = CANH / Math.max(co.x, co.y, co.z, 0.0001);

    goc.position.set(-tam.x, -tam.y, -tam.z);
    const trong = new THREE.Group();
    trong.add(goc);
    trong.scale.setScalar(ty);
    trong.rotation.x = n.nga * Math.PI / 180;

    const boc = new THREE.Group();
    boc.add(trong);

    /* Quả cầu bắt VÔ HÌNH, to hơn nhạc cụ một chút.

       Bắt thẳng vào lưới của mô hình thì mấy cây mảnh gần như không tóm được:
       đo thật, cây sáo có lúc chỉ chiếm 28×11 điểm ảnh trên màn, chưa kể bấm
       trúng khe hở giữa hai thanh gỗ của cái mõ là trượt. Bắt vào quả cầu thì
       cây nào cũng dễ tóm như nhau.

       Để trong suốt hẳn chứ không dùng visible=false — vật vô hình bị bỏ qua
       luôn cả khâu dò tia, thành ra không bắt được gì. */
    const cau = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 12, 8),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
    );
    cau.renderOrder = -1;
    boc.add(cau);

    boc.visible = false;
    scene.add(boc);

    vat.push({
      ma: n.ma, ten: n.ten, cai: n,
      boc, trong,
      nha: new THREE.Vector3(),                 // chỗ đứng, tính lại mỗi lần mở hộp
      cau,                                      // quả cầu vô hình để bắt
      v: new THREE.Vector3(),                   // vận tốc
      quay: new THREE.Vector3(0, 0, 0),         // tốc độ xoay quanh ba trục
      gocDep: 0,                                // hướng quay mặt về người xem
      pha: Math.random() * Math.PI * 2,
      nhan: 0,                                  // cú chạm vừa rồi, để nảy lên một nhịp
      cho: 0,                                   // giây còn phải nằm im trong hộp
      am: null, amHong: false,
    });
  }

  /* ---------- Toạ độ ----------
     Khung 360 đo hướng bằng ĐỘ kể từ mép trái ảnh. Quy đổi sang điểm trong
     không gian: nhìn thẳng là trục -Z, quay phải là +X, ngẩng lên là +Y. */
  function diem(gocDo, caoDo, xa) {
    const a = gocDo * Math.PI / 180, b = caoDo * Math.PI / 180;
    return new THREE.Vector3(
      xa * Math.cos(b) * Math.sin(a),
      xa * Math.sin(b),
      -xa * Math.cos(b) * Math.cos(a),
    );
  }

  function pano() { return khung.__pano || null; }

  /* Gắn camera 3D trùng khít khung 360. Đây là chỗ làm nên cảm giác nhạc cụ
     ĐỨNG YÊN TRONG PHÒNG: kéo nhìn quanh thì chúng trôi qua khỏi khung như đồ
     vật thật, chứ không dán cứng vào màn hình. */
  function capNhatCamera() {
    const p = pano();
    if (!p || !p.huongNhin) return;
    const h = p.huongNhin();
    /* Chặn trần 85 độ. Khung 360 là ảnh trượt phẳng chứ không phải phép chiếu
       phối cảnh, nên trên điện thoại dựng đứng nó trải trọn 180 độ chiều dọc —
       con số mà không camera phối cảnh nào há nổi (90 độ đã là vô tận rồi).
       Chặn lại thì nhạc cụ hơi lệch so với nền, nhưng chúng là vật trôi tự do,
       có mốc nào trong ảnh để đối chiếu đâu mà lộ. */
    cam.fov = Math.max(25, Math.min(85, h.fovDoc));
    cam.rotation.y = -h.yaw * Math.PI / 180;
    cam.rotation.x = h.pitch * Math.PI / 180;
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
  }

  /* Góc mở NGANG hiện tại của camera 3D, tính từ góc mở dọc và tỉ lệ khung. */
  function gocNgang() {
    const nua = Math.tan(cam.fov * Math.PI / 360) * cam.aspect;
    return Math.atan(nua) * 360 / Math.PI;
  }

  /* Chỗ cái hộp đang nằm, quy ra một điểm trong không gian ngay trước mặt.
     Nhạc cụ bung ra từ đúng đó nên mắt thấy chúng chui ra từ cái hộp thật. */
  function diemHop() {
    const h = khung.querySelector('.pano__hop');
    const rk = khung.getBoundingClientRect();
    if (!h) return diem(0, -26, 1.15);
    const re = h.getBoundingClientRect();
    const x = ((re.left + re.width / 2 - rk.left) / rk.width) * 2 - 1;
    const y = -(((re.top + re.height / 2 - rk.top) / rk.height) * 2 - 1);
    const v = new THREE.Vector3(x, y, 0.5).unproject(cam);
    return v.lengthSq() < 1e-8 ? diem(0, -26, 1.15) : v.normalize().multiplyScalar(1.15);
  }

  /* ---------- Mở hộp ---------- */
  function bung() {
    if (hong) return;
    if (!daTai) { tai().then(() => { if (daTai && khungDangMo()) bung(); }); return; }
    if (!canvas) return;
    mo = true; dangVe = false;
    canvas.classList.add('is-hien');

    coLai();
    capNhatCamera();
    const hop = diemHop();
    const goc0 = pano() ? pano().huongNhin().yaw : 0;

    /* Co giãn cả vòng nhạc cụ theo bề ngang khung.

       Bảng NHAC_CU xếp chỗ cho màn rộng, trải ra tới 40 độ mỗi bên. Điện thoại
       dựng đứng chỉ nhìn được chừng 48 độ NGANG là hết, nên cứ đặt y nguyên
       thì hai cây ngoài cùng nằm ngoài khung, mở hộp ra tưởng mất nhạc cụ. */
    const he = Math.max(0.42, Math.min(1, gocNgang() / 100));

    vat.forEach((b, i) => {
      // chỉ co bề NGANG; màn dọc thừa chỗ trên dưới, co nốt là dồn cục lại giữa
      b.nha.copy(diem(goc0 + b.cai.goc * he, b.cai.cao, b.cai.xa));
      b.boc.position.copy(hop);
      b.boc.visible = false;
      b.boc.scale.setScalar(0.12);
      /* Chỉ hẩy một cái rất nhẹ cho khỏi đều tăm tắp, còn lại để lò xo kéo
         đi. Hẩy mạnh là cộng thêm năng lượng vào lò xo vốn đã thiếu giảm
         chấn: đo được nó vọt quá chỗ tới 54%, ra tận 4,7 rồi mới lùi về. */
      b.v.copy(b.nha).sub(hop).normalize().multiplyScalar(0.45);
      /* Hướng quay mặt về phía người xem: trục Z của mô hình chỉ thẳng từ chỗ
         nó đứng về gốc toạ độ, cộng thêm phần chỉnh riêng của từng tệp. */
      b.gocDep = Math.atan2(-b.nha.x, -b.nha.z) + b.cai.quay * Math.PI / 180;
      b.boc.rotation.set(0, b.gocDep, 0);
      b.quay.set(0, (Math.random() - .5) * 0.8, 0);
      b.cho = i * 0.075;          // nối đuôi nhau chui ra chứ không bung một lượt
    });
    batVong();
  }

  /* ---------- Đóng hộp ---------- */
  function thu() {
    if (!mo) return;
    mo = false; dangVe = true; veLuc = 0;
    buongKeo();
  }

  function khungDangMo() {
    return khung.classList.contains('co-nhac-cu');
  }

  /* Đặt lại cỡ bộ đệm vẽ khi khung đổi kích thước. Phải tự nhớ cỡ cũ: gọi
     setSize(w, h, FALSE) là cố ý không cho three.js đụng vào style của canvas
     (CSS đã trải nó bằng inset:0), nên hỏi lại clientWidth thì lúc nào cũng
     thấy vừa khít, chẳng bao giờ biết là bộ đệm còn đang sai cỡ. */
  let coW = 0, coH = 0;
  function coLai() {
    const w = khung.clientWidth, h = khung.clientHeight;
    if (!w || !h || (w === coW && h === coH)) return;
    coW = w; coH = h;
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
  }

  /* ---------- Vòng vẽ ---------- */
  function batVong() {
    if (dangChay) return;
    dangChay = true;
    lanTruoc = performance.now();
    requestAnimationFrame(vong);
  }

  function vong(nay) {
    /* Hai loại thời gian, và phải tách ra:

       thuc — thời gian thật vừa trôi qua. Dùng cho mấy thứ ĐẾM GIÂY: xếp hàng
              chui ra khỏi hộp, đếm ngược lúc thu về. Máy yếu vẽ chậm mà vẫn
              phải đóng hộp trong hơn nửa giây chứ không lê thê.
       dt   — thời gian đưa vào phép tính vật lý, chặn trần 0,05 giây. Máy
              chậm hoặc tab vừa hiện lại mà để nguyên thì lò xo nhảy một bước
              quá dài, nhạc cụ văng thẳng ra ngoài vũ trụ.

       Chặn cả sàn 0 nữa: mốc lanTruoc lấy từ performance.now() lúc bật vòng,
       còn tham số nay là mốc ĐẦU khung hình — máy chậm thì mốc đầu khung có thể
       sớm hơn, ra số âm, và mọi thứ chạy giật lùi. */
    const thuc = Math.max(0, (nay - lanTruoc) / 1000);
    const dt = Math.min(thuc, 0.05);
    lanTruoc = nay;

    coLai();
    capNhatCamera();
    const t = nay / 1000;
    let con = false;

    for (const b of vat) {
      if (b.cho > 0) { b.cho -= thuc; continue; }
      if (!b.boc.visible) b.boc.visible = true;

      if (b === (keo && keo.than)) {
        con = true;                       // đang trong tay người dùng, vật lý nghỉ
      } else {
        // đích: chỗ của nó, cộng một chút dập dềnh cho khỏi đứng chết một điểm
        const dich = dangVe ? diemHop() : b.nha;
        const song = itDong ? 0 : 1;
        const lech = dangVe ? 0 : 1;
        const gia = new THREE.Vector3(
          dich.x + Math.sin(t * 0.63 + b.pha) * 0.13 * lech * song,
          dich.y + Math.sin(t * 0.47 + b.pha * 1.7) * 0.17 * lech * song,
          dich.z + Math.cos(t * 0.55 + b.pha) * 0.13 * lech * song,
        );
        const K = dangVe ? K_VE_HOP : K_LO_XO;
        // gia tốc = lò xo kéo về - lực cản; thiếu giảm chấn nên nó lượn vài nhịp
        b.v.addScaledVector(gia.sub(b.boc.position), K * dt);
        b.v.addScaledVector(b.v, -D_GIAM * dt);
        b.boc.position.addScaledVector(b.v, dt);
        if (b.v.lengthSq() > 0.0004) con = true;
      }

      /* Xoay: LẮC QUANH một hướng ngắm đẹp chứ không quay tít.

         Quay tròn đều nghe thì hay, nhưng mấy cây dẹt và mảnh cứ nửa vòng lại
         quay cạnh về phía người xem là biến mất — đo được cây sáo có lúc chỉ
         còn 28×11 điểm ảnh, đàn nguyệt còn 17 điểm ảnh bề ngang. Nên dùng một
         lò xo xoay: kéo mặt nhạc cụ về phía người xem, cộng một nhịp lắc nhẹ.
         Hất mạnh thì nó vẫn quay mấy vòng rồi mới từ từ quay mặt lại. */
      const nhan = itDong ? 0 : 1;
      const dich = b.gocDep + Math.sin(t * 0.37 + b.pha) * 0.22 * nhan;
      let sai = dich - b.boc.rotation.y;
      sai = Math.atan2(Math.sin(sai), Math.cos(sai));     // gò về khoảng ±180 độ
      b.quay.y += sai * 1.7 * dt;
      b.quay.y -= b.quay.y * Math.min(dt * 1.5, 1);
      b.quay.x += (Math.sin(t * 0.29 + b.pha * 1.3) * 0.11 * nhan - b.boc.rotation.x) * 1.7 * dt;
      b.quay.x -= b.quay.x * Math.min(dt * 1.9, 1);
      b.quay.z += (Math.sin(t * 0.33 + b.pha * 0.7) * 0.09 * nhan - b.boc.rotation.z) * 1.7 * dt;
      b.quay.z -= b.quay.z * Math.min(dt * 1.9, 1);
      b.boc.rotation.x += b.quay.x * dt;
      b.boc.rotation.y += b.quay.y * dt;
      b.boc.rotation.z += b.quay.z * dt;
      if (Math.abs(b.quay.y) > 0.02) con = true;

      // cú chạm: nảy phồng lên rồi xẹp về
      b.nhan *= Math.max(0, 1 - dt * 4.5);
      let ty = 1 + b.nhan * 0.16;
      if (dangVe) ty *= Math.max(0, 1 - veLuc / 0.55);   // thu về thì nhỏ dần rồi biến mất
      b.boc.scale.setScalar(ty);
      if (b.nhan > 0.01) con = true;
    }

    renderer.render(scene, cam);

    if (dangVe) {
      veLuc += thuc;
      if (veLuc >= 0.62) {
        dangVe = false; dangChay = false;
        canvas.classList.remove('is-hien');
        vat.forEach((b) => { b.boc.visible = false; });
        return;
      }
      requestAnimationFrame(vong);
      return;
    }

    if (!mo) { dangChay = false; return; }
    // còn nhúc nhích hoặc còn dập dềnh thì vẽ tiếp; chế độ ít chuyển động mới đứng hẳn
    if (con || !itDong) requestAnimationFrame(vong);
    else dangChay = false;
  }

  /* ---------- Chạm, kéo, thả ----------
     Canvas nằm ĐÈ lên ảnh 360 nên phải phân xử: trúng nhạc cụ thì chặn sự kiện
     lại (kéo nhạc cụ, không xoay cảnh); trượt ra ngoài thì để sự kiện nổi lên
     .pano như thường, người xem vẫn kéo nhìn quanh được. */
  function ndc(e) {
    const r = khung.getBoundingClientRect();
    return new THREE.Vector2(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      -(((e.clientY - r.top) / r.height) * 2 - 1),
    );
  }

  function trung(e) {
    const p = ndc(e);
    tia.setFromCamera(p, cam);
    const cham = tia.intersectObjects(vat.filter(b => b.boc.visible).map(b => b.cau), false);
    if (!cham.length) return null;
    return vat.find(b => b.cau === cham[0].object) || null;
  }

  function chamXuong(e) {
    if (!mo || dangVe) return;
    const b = trung(e);
    if (!b) return;                       // trượt — để .pano nhận, xoay cảnh như thường
    e.stopPropagation();
    e.preventDefault();
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}

    keo = {
      than: b, id: e.pointerId,
      xa: b.boc.position.length(),        // giữ nguyên khoảng cách, kéo trên mặt cầu
      truoc: b.boc.position.clone(),
      lucTruoc: performance.now(),
    };
    b.nhan = 1;
    b.v.set(0, 0, 0);
    keu(b);
    canvas.classList.add('dang-keo');
    batVong();
  }

  function keoDi(e) {
    if (!keo || e.pointerId !== keo.id) {
      // không kéo thì chỉ đổi con trỏ cho biết chỗ nào bấm được
      if (mo && !dangVe) canvas.classList.toggle('tren-vat', !!trung(e));
      return;
    }
    e.stopPropagation();
    const b = keo.than;
    const p = ndc(e);
    tia.setFromCamera(p, cam);
    const moi = tia.ray.direction.clone().normalize().multiplyScalar(keo.xa);

    const nay = performance.now();
    const dt = Math.max((nay - keo.lucTruoc) / 1000, 0.008);
    // vận tốc lúc thả lấy từ đoạn vừa kéo, nên hất mạnh là nó bay xa
    b.v.copy(moi).sub(keo.truoc).divideScalar(dt).clampLength(0, 14);
    b.boc.position.copy(moi);
    // kéo nhanh thì quay tít theo
    if (b.v.length() > 1.2) b.quay.y = Math.min(b.v.length() * 0.5, 6) * (b.quay.y < 0 ? -1 : 1);
    keo.truoc.copy(moi);
    keo.lucTruoc = nay;
  }

  function nhacTay(e) {
    if (!keo || (e && e.pointerId !== keo.id)) return;
    if (e) e.stopPropagation();
    buongKeo();
  }

  function reView(e) { if (canvas) canvas.classList.remove('tren-vat'); }

  function buongKeo() {
    if (!keo) return;
    try { canvas.releasePointerCapture(keo.id); } catch (err) {}
    keo = null;
    canvas.classList.remove('dang-keo');
    batVong();
  }

  /* ---------- Tiếng ----------
     Tệp tiếng chưa có. Thả .mp3 vào am/nhac-cu/ theo đúng mã nhạc cụ là tự
     kêu, không phải sửa gì ở đây. Chưa có tệp thì play() bị từ chối, bắt lấy
     rồi thôi — không kêu chứ không lỗi, và đánh dấu để khỏi thử lại mỗi lần. */
  function keu(b) {
    if (b.amHong) return;
    if (!b.am) {
      b.am = new Audio(THU_MUC_AM + b.ma + '.mp3');
      b.am.preload = 'auto';
      b.am.addEventListener('error', () => { b.amHong = true; });
    }
    try { b.am.currentTime = 0; } catch (err) {}
    const p = b.am.play();
    if (p && p.catch) p.catch(() => { b.amHong = true; });
  }
}
