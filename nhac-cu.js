/* ==========================================================
   Nhà hát Chèo Quân đội — Sân khấu nhạc cụ 3D

   Bấm cái hộp giữa đáy màn (lúc đang xem 360 toàn màn hình) thì phông sân khấu
   kéo lên che kín cảnh, rồi sáu nhạc cụ lần lượt mọc lên khỏi mặt sàn, xếp
   thành hàng và xoay tròn chầm chậm như bày trong tủ kính.

   Chạm vào một cây: nó bay THẲNG LÊN theo trục đứng, ngay trên chỗ nó nằm,
   tới ngang giữa khung hình thì lơ lửng ở đó. Một luồng đèn rọi xuống đúng
   mình nó, cả sân khấu còn lại tối đi, và nó kêu lên tiếng của chính nó.

   Chạm được NHIỀU CÂY MỘT LÚC — mấy ngón tay một lúc cũng được: cây nào được
   chạm cũng bay thẳng lên tại cột của nó. Chạm lại cây đang lơ lửng thì nó kêu
   tiếp chứ KHÔNG rơi xuống; muốn cất hết thì chạm vào khoảng trống trên sân
   khấu.

   Nắm cây đang lơ lửng kéo lên kéo xuống được, thả tay ra nó nảy về độ cao
   cũ. Chỉ lên xuống thôi, không bao giờ trôi ngang hay trôi sâu.

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
   PHÔNG SÂN KHẤU CHE HẲN CẢNH 360
   ----------------------------------------------------------
   Bản đầu cho nhạc cụ trôi lơ lửng ngay trong phòng 360, camera 3D bám theo
   hướng nhìn của khung ảnh. Nay thì khác hẳn: mở hộp là dựng nguyên một sân
   khấu khác đè lên, nên camera ĐỨNG IM. Nhờ thế nhạc cụ neo chắc vào mặt sàn
   trong ảnh phông, không trôi đi đâu cả, và toàn bộ phần tính hướng nhìn của
   khung 360 không còn dính dáng gì tới đây nữa.

   Ảnh phông là ảnh phẳng 3:2, được cắt kiểu "cover" bằng repeat/offset của vân
   bề mặt chứ không kéo giãn. Vạch chân nhạc cụ tính NGƯỢC từ toạ độ trên ảnh
   (hàm yAnh) nên màn nào, xoay dọc hay ngang, chân vẫn rơi đúng mặt sàn gỗ.

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

/* Mỗi nhạc cụ một dòng. Thứ tự trong bảng là thứ tự từ trái sang phải trên
   sân khấu.

   quay    : xoay quanh trục ĐỨNG (độ) để mặt đẹp quay về phía người xem.
             Cần vì "mặt trước" của mỗi tệp .glb quay về đâu là tuỳ người dựng.
             Cây vẫn xoay tròn chầm chậm, nên con số này chỉ là chỗ BẮT ĐẦU.
   nghieng : dựng chếch lên (độ), quanh trục Z. Ba tệp sáo, mõ, trống cơm được
             dựng NẰM NGANG (đo hộp bao: sáo 0,67 × 0,03 × 0,14) — để bẹt thì
             nhìn từ trên xuống chỉ còn một cái que. Nhấc một đầu lên là ra hình.
   co      : chỉnh riêng cỡ. Để 1 là theo công thức chung; chỉ động tới khi tệp
             .glb có kèm đồ lặt vặt nằm rải ra (mõ có hai dùi, cồng chiêng có
             một chiếc rời) làm hộp bao phình to mà thân chính thì bé tí. */
const NHAC_CU = [
  { ma: 'dan-nhi',     ten: 'Đàn nhị',     quay: 45, nghieng:  0, co: 1    },
  { ma: 'ruan',        ten: 'Đàn nguyệt',  quay:  0, nghieng:  0, co: 1    },
  { ma: 'sao-tre',     ten: 'Sáo trúc',    quay:  0, nghieng: 62, co: 1    },
  { ma: 'trong-com',   ten: 'Trống cơm',   quay:  0, nghieng:  0, co: 1    },
  { ma: 'mo-go',       ten: 'Mõ',          quay: 45, nghieng: 16, co: 1.3  },
  { ma: 'cong-chieng', ten: 'Cồng chiêng', quay:  0, nghieng:  0, co: 1.15 },
];

const THU_MUC_MO_HINH = './mo-hinh/';
const THU_MUC_AM      = './am/nhac-cu/';
/* Ảnh phông. PHẢI tăng ?v= mỗi lần thay ảnh: Vercel đặt max-age một năm cho
   mọi tệp ảnh, không có ?v= mới thì máy người xem cũ giữ ảnh cũ cả năm. */
const ANH_NEN   = './anh/nhac-cu/nen-san-khau.webp?v=1';
const TI_LE_NEN = 1536 / 1024;

/* ---------- Khuôn hình ----------
   Camera đứng ở gốc toạ độ nhìn theo trục -Z. Mọi con số dưới đây đo bằng đơn
   vị thế giới, nhưng đều quy chiếu theo bề cao thấy được nên đổi màn không vỡ. */
const FOV   = 50;      // góc mở dọc, độ
const Z_NEN = 14;      // phông treo xa chừng này
const Z_VAT = 6;       // hàng nhạc cụ trước nhất đứng xa chừng này

/* Cắt ảnh phông kiểu "cover", nhưng không cho thấy quá V_MAX phần bề cao ảnh.

   Cắt cover thuần thì màn dọc điện thoại hiện trọn 1024 điểm ảnh chiều cao, mà
   mặt sàn gỗ chỉ chiếm 20% dưới cùng của ảnh — hoá ra cả sân khấu bị dồn vào
   một dải mỏng, nhạc cụ chồng lên nhau. Chặn lại là ảnh phóng to thêm, mặt sàn
   nở ra đủ chỗ xếp mấy hàng. Màn ngang cũng đẹp hơn: bớt rèm, thêm sàn. */
const V_MAX = 0.78;

const V_SAN = 0.17;    // vạch chân hàng TRƯỚC nhất, tính trên ảnh (0 là đáy ảnh)
const V_LUI = 0.058;   // lùi một hàng thì vạch chân nhích lên chừng này
const Z_LUI = 0.32;    // và đứng xa thêm chừng này lần
const RONG  = 0.88;    // hàng nhạc cụ trải bao nhiêu phần bề ngang khung
const CAO   = 0.30;    // cạnh chuẩn của nhạc cụ, tính theo bề cao thấy được

const CAO_DEN = 5.2;   // luồng sáng dài chừng này, chân đặt trên mặt sàn
const TIA_R   = 2.2;   // và loe ra gấp chừng này bán kính nhạc cụ

/* Lò xo kéo nhạc cụ tới độ cao của nó. Cố tình để thiếu giảm chấn: tới nơi rồi
   nó còn nhún lên nhún xuống vài nhịp mới yên — đó chính là cái "bay bay". */
const K_LO_XO = 6.0;
const D_GIAM  = 2.9;
const TOC_XOAY = 0.30;   // rad/giây, chừng 21 giây một vòng

const KHUNG = document.getElementById('pano');
if (KHUNG) khoiDong(KHUNG);

function khoiDong(khung) {
  let THREE = null, GLTFLoader = null;
  let renderer = null, canvas = null, scene = null, cam = null, tiaDo = null;
  let matNen = null, meshNen = null, anhNen = null;
  let den = null, hat = null, moi = null, SANG0 = null;
  let T_BONG = null, T_VUNG = null, T_LUONG = null;
  let vat = [];
  let daTai = false, hong = false, taiXong = null;
  let mo = false, dangVe = false, veLuc = 0;
  let dangChay = false, lanTruoc = 0;
  let manh = 0;                       // 0..1, mức hạ đèn nền xuống lúc có cây được rọi
  const keoDs = new Map();            // pointerId -> { than, yTruoc, lucTruoc }
  let tam3 = null;                    // véc-tơ nháp, khỏi cấp phát lại mỗi khung hình
  let coW = 0, coH = 0;
  let ur = 1, vr = 1, offU = 0;       // phần ảnh phông đang thấy

  const itDong = window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  khung.addEventListener('pano:full', (e) => { if (e.detail && e.detail.on) tai(); });
  khung.addEventListener('pano:hop', (e) => { (e.detail && e.detail.mo) ? bung() : thu(); });

  /* ---------- Nạp thư viện, mô hình và ảnh phông ----------
     Gọi lúc vừa vào toàn màn hình chứ không đợi tới lúc bấm hộp: tải trước thì
     bấm hộp là sân khấu hiện ra liền. Gần 3 MB mà đợi tới lúc bấm mới tải thì
     người xem đứng nhìn cái hộp câm mấy giây.

     Giữ đúng MỘT lời hứa dùng chung: ai gọi lúc đang tải dở cũng nhận lại lời
     hứa đó chứ không khởi động thêm lượt tải thứ hai. Nhờ vậy bấm hộp trong
     lúc còn đang tải vẫn mở ra được ngay khi xong. */
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
      const [nenXong, ...ket] = await Promise.all([
        new THREE.TextureLoader().loadAsync(ANH_NEN).catch(() => null),
        ...NHAC_CU.map((n) => nap.loadAsync(THU_MUC_MO_HINH + n.ma + '.glb')
          .then((r) => ({ n, r })).catch(() => null)),
      ]);
      if (nenXong) datNen(nenXong);
      ket.forEach((x) => { if (x) taoThan(x.n, x.r.scene); });
      if (!vat.length) throw new Error('không mô hình nào nạp được');

      /* Chỗ ngó vào cảnh 3D từ bảng điều khiển trình duyệt, để chỉnh chỗ đứng
         và đo khoảng cách mà không phải chèn thêm mã. Giống el.__pano bên
         pano.js. Không có mã nào của trang đọc biến này. */
      khung.__nhacCu = { vat, cam, scene, xepHang, THREE };
      daTai = true;
      chu('Hộp nhạc cụ');
    } catch (err) {
      hong = true;
      chu('Hộp nhạc cụ');
      const h = khung.querySelector('.pano__hop');
      if (h) h.title = 'Không tải được sân khấu nhạc cụ';
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
    renderer.toneMappingExposure = 1.25;

    scene = new THREE.Scene();
    cam = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
    tiaDo = new THREE.Raycaster();
    tam3 = new THREE.Vector3();
    T_BONG = texBong(); T_VUNG = texVung(); T_LUONG = texLuong();

    /* Mấy tệp .glb này không có ảnh bề mặt, chỉ có màu trơn và độ bóng. Thiếu
       môi trường phản chiếu thì phần kim loại (cồng chiêng) đen sì. Dựng một
       môi trường giả từ một dải màu: sáng ấm trên đầu, tối dần xuống chân —
       đúng kiểu ánh đèn sân khấu. */
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
    den = new THREE.DirectionalLight(0xfff0d0, 2.0); den.position.set(1.6, 3.4, 2.2);
    // đèn hắt ngược, tách nhạc cụ khỏi tấm phông vốn cũng nâu đỏ
    hat = new THREE.DirectionalLight(0xffc887, 0.7); hat.position.set(-2.4, 0.4, 1.2);
    moi = new THREE.AmbientLight(0xffe2b4, 0.6);
    scene.add(den); scene.add(hat); scene.add(moi);
    SANG0 = [den.intensity, hat.intensity, moi.intensity];

    // tấm phông: dựng trước, chưa có vân thì để đen, ảnh về tới đâu gắn tới đó
    matNen = new THREE.MeshBasicMaterial({ color: 0x0d0b0a, toneMapped: false });
    meshNen = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), matNen);
    meshNen.position.z = -Z_NEN;
    scene.add(meshNen);

    canvas.addEventListener('pointerdown', chamXuong);
    canvas.addEventListener('pointermove', keoDi);
    canvas.addEventListener('pointerup', nhacTay);
    canvas.addEventListener('pointercancel', nhacTay);
    canvas.addEventListener('pointerleave', reView);
  }

  /* ---------- Mấy tấm vân vẽ bằng tay ---------- */
  function texBong() {                       // bóng đổ dưới chân
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 62);
    r.addColorStop(0, 'rgba(0,0,0,.66)');
    r.addColorStop(0.5, 'rgba(0,0,0,.3)');
    r.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = r; g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function texVung() {                       // vũng sáng trên mặt sàn
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 62);
    r.addColorStop(0, 'rgba(255,236,186,1)');
    r.addColorStop(0.3, 'rgba(255,208,128,.55)');
    r.addColorStop(0.62, 'rgba(255,188,98,.18)');
    r.addColorStop(1, 'rgba(255,180,90,0)');
    g.fillStyle = r; g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function texLuong() {                      // thân luồng sáng: đậm trên, tan dần xuống
    const c = document.createElement('canvas'); c.width = 4; c.height = 128;
    const g = c.getContext('2d');
    const d = g.createLinearGradient(0, 128, 0, 0);
    d.addColorStop(0.00, 'rgba(255,188,92,0)');
    d.addColorStop(0.12, 'rgba(255,192,100,.10)');
    d.addColorStop(0.55, 'rgba(255,204,124,.20)');
    d.addColorStop(1.00, 'rgba(255,226,166,.42)');
    g.fillStyle = d; g.fillRect(0, 0, 4, 128);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }

  function datNen(t) {
    anhNen = t;
    anhNen.colorSpace = THREE.SRGBColorSpace;
    matNen.map = anhNen;
    matNen.color.setScalar(1);
    matNen.needsUpdate = true;
  }

  /* Cắt ảnh phông vừa khung, KHÔNG kéo giãn: giữ nguyên tỉ lệ ảnh rồi cắt bớt
     bề thừa bằng repeat/offset. Neo mép DƯỚI (offset.y = 0) để mặt sàn gỗ lúc
     nào cũng còn nguyên — cắt ở giữa thì mất chỗ đứng của nhạc cụ. */
  function catNen() {
    const ti = coW / coH;
    vr = Math.min(1, TI_LE_NEN / ti, V_MAX);
    ur = Math.min(1, vr * ti / TI_LE_NEN);
    offU = (1 - ur) / 2;
    if (anhNen) { anhNen.repeat.set(ur, vr); anhNen.offset.set(offU, 0); }
    const cao = 2 * Z_NEN * Math.tan(FOV * Math.PI / 360);
    meshNen.geometry.dispose();
    meshNen.geometry = new THREE.PlaneGeometry(cao * ti, cao);
  }

  /* Đổi một vạch dọc trên ẢNH phông thành độ cao thế giới ở độ sâu z. Đây là
     cái neo nhạc cụ vào mặt sàn: vạch v nằm đâu trên ảnh thì chân cây nhạc cụ
     rơi đúng đó trên màn, bất kể khung rộng hay hẹp. */
  function yAnh(v, z) {
    return (2 * v / vr - 1) * z * Math.tan(FOV * Math.PI / 360);
  }

  /* ---------- Dựng thân một nhạc cụ ----------
     Bọc mô hình vào hai lớp:
       boc   — thứ mà vật lý dời đi và cái xoay tròn tác động vào. GỐC TOẠ ĐỘ
               CỦA NÓ LÀ ĐIỂM CHẠM SÀN, chính giữa chân.
       trong — nghiêng, thu cỡ, và dời mô hình sao cho đáy hộp bao trùng gốc.

     Để gốc ở chân chứ không ở tâm vì hai việc: xoay tròn thì quay quanh trục
     đứng đi qua chân (đúng kiểu bàn xoay trưng bày), và lúc mọc lên khỏi sàn
     thì chỉ việc phóng to dần từ 0 — chân đứng yên, thân vươn lên. */
  function taoThan(n, goc) {
    const h0 = new THREE.Box3().setFromObject(goc);
    const tam0 = h0.getCenter(new THREE.Vector3());
    goc.position.set(-tam0.x, -tam0.y, -tam0.z);

    const trong = new THREE.Group();
    trong.add(goc);
    trong.rotation.z = n.nghieng * Math.PI / 180;
    const boc = new THREE.Group();
    boc.add(trong);

    /* Đo hộp bao SAU khi đã nghiêng nhưng TRƯỚC khi quay. Box3 trả về toạ độ
       thế giới; lúc boc chưa xoay thì thế giới trùng với hệ toạ độ của chính
       boc, nên số đo đem dời trong.position là dùng được ngay. Đo sau khi xoay
       rồi mới dời thì phép dời bị xoay thêm một lần nữa, hai cây quay 45 độ
       lệch tâm — xoay tròn là chúng lượn vòng quanh một điểm ngoài thân. */
    const h1 = new THREE.Box3().setFromObject(boc);
    const co1 = h1.getSize(new THREE.Vector3());
    const tam1 = h1.getCenter(new THREE.Vector3());
    boc.rotation.y = n.quay * Math.PI / 180;

    /* Quả cầu bắt VÔ HÌNH, bọc quanh nhạc cụ.

       Bắt thẳng vào lưới của mô hình thì mấy cây mảnh gần như không tóm được:
       đo thật, cây sáo có lúc chỉ chiếm 28×11 điểm ảnh trên màn, chưa kể bấm
       trúng khe hở giữa hai thanh gỗ của cái mõ là trượt.

       Để trong suốt hẳn chứ không dùng visible=false — vật vô hình bị bỏ qua
       luôn cả khâu dò tia, thành ra không bắt được gì. */
    const cau = new THREE.Mesh(
      new THREE.SphereGeometry(1, 12, 8),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
    );
    cau.renderOrder = -1;
    boc.add(cau);

    const bong = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: T_BONG, transparent: true, depthWrite: false }));
    bong.rotation.x = -Math.PI / 2;
    const vung = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        map: T_VUNG, transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending, opacity: 0, toneMapped: false }));
    vung.rotation.x = -Math.PI / 2;

    /* Đèn rọi RIÊNG của cây này: một nguồn sáng thật (cho nhạc cụ sáng lên) và
       một cái phễu trong suốt (cho MẮT thấy luồng sáng). Mỗi cây một bộ vì
       người xem nhấc mấy cây lên cùng lúc được, cây nào cũng phải có luồng của
       mình.

       Để đèn nằm luôn trong cảnh với cường độ 0 chứ không tắt visible: three.js
       ĐẾM số đèn để sinh shader, bật tắt giữa chừng là nó dịch lại toàn bộ
       shader — khựng đúng một nhịp ngay lúc nhạc cụ đang bay lên.

       Phễu chỉ vẽ mặt trong: vẽ cả hai mặt thì lớp phía trước phủ mờ luôn cây
       nhạc cụ, mất nét. */
    const denRoi = new THREE.SpotLight(0xffe7bd, 0, 0, 0.34, 0.62, 1.2);
    denRoi.position.set(0, 6, 0);
    scene.add(denRoi); scene.add(denRoi.target);
    const luong = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 1, 1, 30, 1, true),
      new THREE.MeshBasicMaterial({
        map: T_LUONG, transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending, side: THREE.BackSide,
        opacity: 0, toneMapped: false }));
    luong.visible = false;

    boc.visible = false; bong.visible = false; vung.visible = false;
    scene.add(boc); scene.add(bong); scene.add(vung); scene.add(luong);

    vat.push({
      ma: n.ma, ten: n.ten, cai: n,
      boc, trong, cau, bong, vung, denRoi, luong,
      co1, tam1, dayY: h1.min.y,          // số đo lúc chưa thu cỡ
      kt1: Math.max(co1.x, co1.y, co1.z, 1e-4),
      nha: new THREE.Vector3(),           // chỗ đứng trên sàn, tính lại mỗi lần xếp
      bay: new THREE.Vector3(),           // chỗ lơ lửng: thẳng trên chỗ nằm, ngang giữa khung
      cao: 0, ban: 0,                     // cỡ sau khi thu, tính lại mỗi lần xếp
      v: new THREE.Vector3(),             // vận tốc
      sang: false,                        // đang được nhấc lên và rọi đèn
      tay: false,                         // đang nằm trong tay người dùng
      len: 0,                             // 0..1, mức độ đã bay lên
      hien: 0,                            // 0..1, mức độ đã mọc lên khỏi sàn
      nhan: 0,                            // cú chạm vừa rồi, để nảy phồng một nhịp
      cho: 0,                             // giây còn phải nằm im dưới sàn
      pha: Math.random() * Math.PI * 2,
      am: null, amHong: false,
    });
  }

  /* ---------- Bày nhạc cụ ra sân khấu ----------
     Gọi lại mỗi lần mở hộp và mỗi lần khung đổi cỡ. Tính lại TỪ ĐẦU chứ không
     sửa chồng lên số cũ — xoay ngang xoay dọc mấy lần mà cứ nhân dồn hệ số thì
     nhạc cụ teo dần. */
  function datCo(b, ty) {
    b.trong.scale.setScalar(ty);
    b.trong.position.set(-b.tam1.x * ty, -b.dayY * ty, -b.tam1.z * ty);
    b.cao = b.co1.y * ty;
    b.ban = Math.hypot(b.co1.x, b.co1.z) * ty / 2;   // bán kính quét khi xoay tròn
    b.cau.scale.set(b.ban * 1.15, b.cao * 0.6, b.ban * 1.15);
    b.cau.position.y = b.cao / 2;
    b.bong.geometry.dispose();
    b.bong.geometry = new THREE.PlaneGeometry(b.ban * 3.1, b.ban * 3.1);
    b.vung.geometry.dispose();
    b.vung.geometry = new THREE.PlaneGeometry(b.ban * 4.6, b.ban * 4.6);
  }

  function xepHang() {
    if (!vat.length) return;
    const ti = coW / coH;
    const tan = Math.tan(FOV * Math.PI / 360);
    const CANH = CAO * 2 * Z_VAT * tan;

    /* Cào bằng theo CĂN BẬC HAI cỡ thật, không cào phẳng hẳn.

       Để nguyên cỡ thật thì giàn cồng chiêng 1,46m nuốt chửng cây sáo 0,67m.
       Cào phẳng hẳn về cùng một cạnh thì cái mõ to ngang cây đàn nguyệt, nhìn
       như đồ chơi. Căn bậc hai giữ đúng thứ tự to nhỏ mà nén khoảng cách lại:
       0,67 với 1,46 rốt cuộc chỉ còn chênh nhau 1,5 lần. */
    const tyGoc = (b) => b.cai.co * CANH / Math.sqrt(b.kt1);

    /* Mấy hàng sâu, và cây nào đứng hàng nào.

       Xếp ZÍCH ZẮC: đi từ trái sang phải đúng thứ tự bảng, nhưng cứ mỗi cây
       lại lùi thêm một nấc chiều sâu rồi quay về. Xếp thành lưới ngay ngắn thì
       cả cột bên trái chồng lên nhau thành một đống — đo thật trên màn 390px,
       đàn nguyệt và sáo rơi trúng cùng một điểm bấm. Zích zắc thì hai cây cạnh
       nhau vừa lệch ngang vừa lệch sâu, tách ra rõ ràng. */
    const n = vat.length;
    const cot = Math.max(2, Math.min(n, Math.round(ti * 3.4)));
    const soHang = Math.ceil(n / cot);
    vat.forEach((b, i) => { b.hg = soHang > 1 ? i % soHang : 0; });

    const zCua = (b) => Z_VAT * (1 + Z_LUI * b.hg);
    const vCua = (b) => V_SAN + V_LUI * b.hg;
    // bề ngang trên MÀN HÌNH, tính theo phần của bề ngang khung
    const be = (b) => b.ban / (zCua(b) * tan * ti);

    vat.forEach((b) => datCo(b, tyGoc(b)));
    let tong = 0; vat.forEach((b) => { tong += be(b); });

    /* Nhiều hàng thì cho phép tổng bề ngang vượt khung: hai cây khác chiều sâu
       chồng mép lên nhau một chút vẫn đọc ra hai vật, mà giữ được cỡ đủ to để
       bấm trúng. Ép cho không chồng tí nào thì trên điện thoại mỗi cây còn
       chừng 60 điểm ảnh, bé như con tem. */
    const cho = RONG * (1 + 0.30 * (soHang - 1));
    const thu = tong > cho ? cho / tong : 1;
    if (thu < 1) { vat.forEach((b) => datCo(b, tyGoc(b) * thu)); tong *= thu; }

    /* Rải chỗ đứng theo bề ngang: cây to chiếm nhiều chỗ hơn cây nhỏ. Chia đều
       tăm tắp thì giàn cồng chiêng đè lên hàng xóm còn cây đàn nhị thì thừa cả
       khoảng trống hai bên.

       Căng hai ĐẦU chứ không căng hai TÂM: neo mép trái cây đầu và mép phải
       cây cuối vào lề, rồi giãn đều phần giữa. Căng theo tâm thì lúc phải chồng
       lấn, nửa cái giàn cồng chiêng thò hẳn ra ngoài khung. */
    const w = vat.map(be);
    const le = (1 - RONG) / 2;
    let don = 0;
    const giua = w.map((wi) => { const c = don + wi / 2; don += wi; return c; });
    const c0 = w[0] / 2, c1 = tong - w[n - 1] / 2;
    const a0 = le + w[0] / 2, a1 = 1 - le - w[n - 1] / 2;
    vat.forEach((b, i) => {
      /* Nửa theo bề ngang, nửa chia đều. Thuần theo bề ngang thì ba cây mảnh
         đầu hàng dồn cục bên trái vì cây nào cũng chiếm ít chỗ; thuần chia đều
         thì giàn cồng chiêng đè lên hàng xóm. Trộn đôi bên là vừa. */
      const theoBe = c1 > c0 ? (giua[i] - c0) / (c1 - c0) : 0.5;
      const deu = n > 1 ? i / (n - 1) : 0.5;
      let u = a0 + (0.5 * theoBe + 0.5 * deu) * (a1 - a0);
      u = Math.max(le + w[i] / 2, Math.min(1 - le - w[i] / 2, u));
      const z = zCua(b);
      b.nha.set((2 * u - 1) * z * tan * ti, yAnh(vCua(b), z), -z);
      b.bong.position.set(b.nha.x, b.nha.y + 0.006, b.nha.z);
      /* Chỗ lơ lửng: CÙNG x, CÙNG z với chỗ nằm, chỉ khác độ cao — bay thẳng
         lên theo trục đứng, tới khi THÂN cây nằm ngang giữa khung hình. Camera
         nhìn thẳng không ngẩng không cúi nên giữa khung là y = 0 ở mọi độ sâu;
         gốc toạ độ của cây ở chân nên trừ nửa bề cao. Cây nào cao quá mà giữa
         khung lại sát sàn thì vẫn nhấc tối thiểu một đoạn, không thì chạm vào
         chẳng thấy nó nhúc nhích. */
      b.bay.set(b.nha.x, Math.max(b.nha.y + 0.35, -b.cao / 2), b.nha.z);
      datLuong(b);
    });
  }

  /* Dựng lại cái phễu sáng cho vừa cây. Chân phễu đặt trên MẶT SÀN ngay chỗ nó
     nằm, nên luồng sáng rọi xuyên qua nhạc cụ đang lơ lửng rồi đọng thành một
     vũng dưới sàn, giống đèn sân khấu thật. */
  function datLuong(b) {
    const r = b.ban * TIA_R;
    b.luong.geometry.dispose();
    b.luong.geometry = new THREE.CylinderGeometry(r * 0.06, r, CAO_DEN, 30, 1, true);
    b.luong.position.set(b.nha.x, b.nha.y + CAO_DEN / 2, b.nha.z);
    b.vung.position.set(b.nha.x, b.nha.y + 0.012, b.nha.z);
  }

  function nhac(b) { b.sang = true; }      // nhấc một cây bay thẳng lên

  function haHet() {                       // cất hết xuống, sân khấu sáng lại
    let doi = false;
    vat.forEach((b) => { if (b.sang) { b.sang = false; doi = true; } });
    if (doi) batVong();
  }

  /* ---------- Mở sân khấu ---------- */
  function bung() {
    if (hong) return;
    if (!daTai) { tai().then(() => { if (daTai && khungDangMo()) bung(); }); return; }
    if (!canvas) return;
    mo = true; dangVe = false; manh = 0;
    canvas.classList.add('is-hien');
    chu('Rời sân khấu');

    coLai(true);
    vat.forEach((b, i) => {
      b.sang = false; b.tay = false;
      b.len = 0; b.hien = 0; b.nhan = 0;
      b.boc.position.copy(b.nha);
      b.boc.scale.setScalar(0);
      b.boc.visible = false; b.bong.visible = false;
      b.vung.visible = false; b.luong.visible = false;
      b.denRoi.intensity = 0;
      b.v.set(0, 0, 0);
      /* Đợi tấm phông kéo lên xong (CSS mờ dần 0,35 giây) rồi mới lần lượt mọc
         lên. Mọc cùng lúc với phông thì chưa thấy sân khấu đã thấy nhạc cụ. */
      b.cho = 0.34 + i * 0.09;
    });
    batVong();
  }

  /* ---------- Đóng sân khấu ---------- */
  function thu() {
    if (!mo) return;
    mo = false; dangVe = true; veLuc = 0;
    chu('Hộp nhạc cụ');
    Array.from(keoDs.keys()).forEach(buong);
    vat.forEach((b) => { b.sang = false; });
    batVong();
  }

  function khungDangMo() {
    return khung.classList.contains('co-nhac-cu');
  }

  /* Đặt lại cỡ bộ đệm vẽ khi khung đổi kích thước. Phải tự nhớ cỡ cũ: gọi
     setSize(w, h, FALSE) là cố ý không cho three.js đụng vào style của canvas
     (CSS đã trải nó bằng inset:0), nên hỏi lại clientWidth thì lúc nào cũng
     thấy vừa khít, chẳng bao giờ biết là bộ đệm còn đang sai cỡ. */
  function coLai(ep) {
    const w = khung.clientWidth, h = khung.clientHeight;
    if (!w || !h) return;
    if (!ep && w === coW && h === coH) return;
    coW = w; coH = h;
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
    catNen();
    xepHang();
    // đổi cỡ giữa chừng thì kéo mọi thứ về đúng chỗ mới, khỏi trôi lơ lửng sai
    vat.forEach((b) => { if (!b.tay) b.v.set(0, 0, 0); });
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
              mọc lên, đếm ngược lúc đóng sân khấu. Máy yếu vẽ chậm mà vẫn phải
              đóng trong hơn nửa giây chứ không lê thê.
       dt   — thời gian đưa vào phép tính vật lý, chặn trần 0,05 giây. Máy chậm
              hoặc tab vừa hiện lại mà để nguyên thì lò xo nhảy một bước quá
              dài, nhạc cụ văng thẳng ra ngoài vũ trụ.

       Chặn cả sàn 0 nữa: mốc lanTruoc lấy từ performance.now() lúc bật vòng,
       còn tham số nay là mốc ĐẦU khung hình — máy chậm thì mốc đầu khung có thể
       sớm hơn, ra số âm, và mọi thứ chạy giật lùi. */
    const thuc = Math.max(0, (nay - lanTruoc) / 1000);
    const dt = Math.min(thuc, 0.05);
    lanTruoc = nay;

    coLai(false);
    const t = nay / 1000;

    /* Có cây nào được nhấc lên là hạ đèn nền xuống, để luồng đèn của nó nổi
       hẳn. Tấm phông thì phải tự tối đi bằng màu vật liệu — nó dùng
       MeshBasicMaterial nên đèn trong cảnh không với tới. */
    /* Nhấc CÀNG NHIỀU cây thì càng phải nhẹ tay với ánh sáng.

       Một cây thì đúng là cảnh rọi đèn: hạ hẳn đèn nền, một luồng sáng gắt.
       Năm sáu cây thì luồng nào cũng loe ra chạm luồng bên cạnh, trên màn dọc
       điện thoại xếp zích zắc còn chồng hẳn lên nhau, cả sân khấu cháy trắng.
       Nên hạ đèn nền ít đi, và chia nhỏ độ đậm từng luồng theo số cây. */
    let soSang = 0; vat.forEach((b) => { if (b.sang) soSang++; });
    const dichManh = soSang ? Math.max(0.45, 1 - (soSang - 1) * 0.11) : 0;
    manh += (dichManh - manh) * Math.min(dt * 5.5, 1);
    const nSang = Math.max(1, soSang);
    const moLuong = 0.85 / Math.sqrt(nSang);   // thân luồng: chồng chéo vừa phải
    const moVung  = 0.85 / nSang;              // vũng trên sàn: chồng hẳn lên nhau
    const sucDen  = 44 / Math.sqrt(nSang);
    matNen.color.setScalar(1 - manh * 0.62);
    den.intensity = SANG0[0] * (1 - manh * 0.72);
    hat.intensity = SANG0[1] * (1 - manh * 0.72);
    moi.intensity = SANG0[2] * (1 - manh * 0.60);

    let con = false;

    for (const b of vat) {
      if (b.cho > 0) { b.cho -= thuc; con = true; continue; }

      /* Mọc lên khỏi mặt sàn: gốc toạ độ nằm ngay chân nên chỉ việc phóng to
         dần từ 0 là thân vươn lên, chân đứng yên. Đóng lại thì ngược. */
      const dichHien = dangVe ? 0 : 1;
      b.hien += (dichHien - b.hien) * Math.min(dt * (dangVe ? 9 : 7), 1);
      if (!dangVe && b.hien > 0.995) b.hien = 1;
      if (!b.boc.visible) { b.boc.visible = true; b.bong.visible = true; }
      // hơi vọt quá 1 rồi lún lại: nảy một nhịp cho ra vẻ bật lên khỏi sàn
      const nayHien = b.hien * (1 + (1 - b.hien) * 0.22);
      b.nhan *= Math.max(0, 1 - dt * 4.5);          // cú chạm: phồng lên rồi xẹp
      b.boc.scale.setScalar(nayHien * (1 + b.nhan * 0.12));
      if (b.hien < 0.999 || b.nhan > 0.01) con = true;

      // xoay tròn chầm chậm như bàn xoay trưng bày, cả lúc nằm sàn lẫn lúc bay
      if (!itDong) b.boc.rotation.y += TOC_XOAY * dt;

      b.len += ((b.sang ? 1 : 0) - b.len) * Math.min(dt * 4.5, 1);

      if (b.tay) {
        con = true;                       // đang trong tay người dùng, vật lý nghỉ
      } else {
        // đích: độ cao giữa khung nếu đang được nhấc, còn không thì mặt sàn
        tam3.copy(b.sang ? b.bay : b.nha);
        if (b.sang && !itDong) tam3.y += Math.sin(t * 0.9 + b.pha) * 0.06;
        // gia tốc = lò xo kéo về - lực cản; thiếu giảm chấn nên nó lượn vài nhịp
        b.v.addScaledVector(tam3.sub(b.boc.position), K_LO_XO * dt);
        b.v.addScaledVector(b.v, -D_GIAM * dt);
        b.boc.position.addScaledVector(b.v, dt);
        /* Không cho lún qua mặt sàn. Lò xo thiếu giảm chấn nên lúc hạ xuống nó
           vọt quá đích — đo được cây lún xuống dưới sàn gần 0,1 đơn vị. Chạm sàn
           thì dội ngược lên một chút, như vật rơi nảy nhẹ. */
        if (b.boc.position.y < b.nha.y) {
          b.boc.position.y = b.nha.y;
          if (b.v.y < 0) b.v.y *= -0.25;
        }
        if (b.v.lengthSq() > 0.0002) con = true;
      }

      // bóng dưới chân nhạt và loe ra khi cây bay lên cao
      b.bong.material.opacity = b.hien * (1 - b.len * 0.55);
      b.bong.scale.setScalar(b.hien * (1 + b.len * 0.3));

      // đèn rọi ngắm theo độ cao hiện tại của cây, kéo lên kéo xuống cũng bám theo
      const p = b.boc.position;
      b.denRoi.intensity = b.len * sucDen;
      b.denRoi.position.set(p.x, p.y + CAO_DEN * 0.85, p.z + CAO_DEN * 0.28);
      b.denRoi.target.position.set(p.x, p.y + b.cao * 0.5, p.z);
      b.denRoi.target.updateMatrixWorld();
      b.luong.visible = b.len > 0.01;
      b.luong.material.opacity = b.len * moLuong;
      b.vung.visible = b.len > 0.01;
      b.vung.material.opacity = b.len * moVung;
      if (b.len > 0.002 && b.len < 0.998) con = true;
    }

    renderer.render(scene, cam);

    if (dangVe) {
      veLuc += thuc;
      if (veLuc >= 0.72) {
        dangVe = false; dangChay = false;
        canvas.classList.remove('is-hien');
        vat.forEach((b) => {
          b.boc.visible = false; b.bong.visible = false;
          b.vung.visible = false; b.luong.visible = false;
        });
        return;
      }
      requestAnimationFrame(vong);
      return;
    }

    if (!mo) { dangChay = false; return; }
    // xoay tròn thì không bao giờ đứng; chỉ chế độ ít chuyển động mới nghỉ hẳn
    if (con || !itDong) requestAnimationFrame(vong);
    else dangChay = false;
  }

  /* ---------- Chạm, kéo, thả ----------
     Sân khấu che kín cảnh 360 nên mọi cú chạm rơi vào đây đều phải CHẶN LẠI,
     không cho lọt xuống .pano — không thì người xem tưởng đang vuốt sân khấu
     mà thật ra đang xoay tấm ảnh 360 nằm khuất phía sau. */
  function ndc(e) {
    const r = khung.getBoundingClientRect();
    return new THREE.Vector2(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      -(((e.clientY - r.top) / r.height) * 2 - 1),
    );
  }

  function trung(e) {
    tiaDo.setFromCamera(ndc(e), cam);
    const cham = tiaDo.intersectObjects(vat.filter((b) => b.boc.visible).map((b) => b.cau), false);
    if (!cham.length) return null;
    return vat.find((b) => b.cau === cham[0].object) || null;
  }

  function chamXuong(e) {
    if (!mo || dangVe) return;
    e.stopPropagation();
    e.preventDefault();
    const b = trung(e);
    if (!b) { haHet(); return; }           // chạm khoảng trống là cất hết xuống

    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    /* Chạm là NHẤC LÊN và kêu. Chạm lại cây đang lơ lửng thì kêu tiếp chứ
       không thả nó rơi xuống — bản trước làm thế, hoá ra cây bay lên rồi thì
       đụng vào cái là mất, chẳng nghịch được gì nữa. Muốn cất thì chạm chỗ
       trống trên sân khấu, cả đám cùng hạ.

       Mỗi ngón tay một mục trong keoDs, nên đặt mấy ngón xuống mấy cây cùng
       lúc là cả mấy cây cùng bay lên, cùng kêu. */
    nhac(b);
    b.nhan = 1; b.tay = true; b.v.set(0, 0, 0);
    keu(b);
    keoDs.set(e.pointerId, { than: b, yTruoc: b.boc.position.y, lucTruoc: performance.now() });
    canvas.classList.add('dang-keo');
    batVong();
  }

  function keoDi(e) {
    const k = keoDs.get(e.pointerId);
    if (!k) {
      // không kéo thì chỉ đổi con trỏ cho biết chỗ nào bấm được
      if (mo && !dangVe) canvas.classList.toggle('tren-vat', !!trung(e));
      return;
    }
    e.stopPropagation();
    const b = k.than;
    /* Kéo CHỈ THEO TRỤC ĐỨNG: cắt tia chuột với mặt phẳng đứng đi qua cây rồi
       lấy mỗi độ cao, x và z giữ nguyên. Chặn dưới ở mặt sàn, chặn trên ở mép
       trên khung. */
    tiaDo.setFromCamera(ndc(e), cam);
    const o = tiaDo.ray.origin, d = tiaDo.ray.direction;
    if (Math.abs(d.z) < 1e-6) return;
    const z = b.nha.z;
    const tran = -z * Math.tan(FOV * Math.PI / 360) - b.cao;
    const y = Math.max(b.nha.y, Math.min(tran, o.y + d.y * (z - o.z) / d.z - b.cao / 2));

    const nay = performance.now();
    const dt = Math.max((nay - k.lucTruoc) / 1000, 0.008);
    // vận tốc lúc thả lấy từ đoạn vừa kéo, nên hất mạnh là nó nảy cao
    b.v.set(0, Math.max(-14, Math.min(14, (y - k.yTruoc) / dt)), 0);
    b.boc.position.set(b.nha.x, y, b.nha.z);
    k.yTruoc = y;
    k.lucTruoc = nay;
  }

  function nhacTay(e) {
    if (!keoDs.has(e.pointerId)) return;
    e.stopPropagation();
    buong(e.pointerId);
  }

  function reView() { if (canvas) canvas.classList.remove('tren-vat'); }

  function buong(id) {
    const k = keoDs.get(id);
    if (!k) return;
    k.than.tay = false;
    keoDs.delete(id);
    try { canvas.releasePointerCapture(id); } catch (err) {}
    if (!keoDs.size) canvas.classList.remove('dang-keo');
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
