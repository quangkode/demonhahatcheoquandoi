/* ==========================================================
   Nhà hát Chèo Quân đội — Khung xem toàn cảnh 360°

   Cách dựng: ảnh cầu (equirectangular) được đặt làm nền, kéo tới đâu
   thì dời nền tới đó. Nền lặp ngang nên quay hết một vòng 360° là khớp
   lại liền mạch, không thấy mối nối.

   Vì sao không dựng hình trụ bằng CSS 3D: đã thử, và Chromium bỏ vẽ phần
   lớn các dải khi phần tử cha có overflow:hidden hoặc clip-path — hình bị
   thủng thành từng mảng đen. Đây là lỗi thuộc về khâu dựng hình của trình
   duyệt, né được nhưng rất mong manh và mỗi trình duyệt một khác. Cách phẳng
   này đổi lại không có hiệu ứng méo phối cảnh, nhưng chạy giống hệt nhau ở
   mọi máy và ăn đúng loại ảnh mà máy 360 nào cũng xuất ra.

   ----------------------------------------------------------
   THAY ẢNH 360 THẬT CỦA NHÀ HÁT
   ----------------------------------------------------------
   Không cần sửa gì trong tệp này. Chỉ cần trỏ biến --pano của từng cảnh
   sang ảnh thật, trong styles.css:

     .pano[data-scene="khan-phong"] { --pano: url("./anh/khan-phong.jpg"); }

   Ảnh phải là ảnh cầu chuẩn (equirectangular), tỉ lệ đúng 2:1 —
   ví dụ 4096x2048 — là loại mà mọi máy ảnh 360 đều xuất ra.
   Ảnh chưa đủ trần và sàn thì đừng ép vào 2:1, mà khai tỉ lệ thật ở
   data-ti-le của nút điểm dừng — xem Pano.prototype.tiLeCua.

   Thêm cảnh mới thì thêm một nút [data-scene-btn] trong trang là xong.
   ========================================================== */
(function (global) {
  'use strict';

  /* Bề ngang khung nhìn thấy bao nhiêu độ. Chiều dọc đi theo chiều ngang vì
     ảnh cầu luôn 2:1, nên góc càng rộng thì càng thấy nhiều trần và sàn.

     Để 78 thì khung chỉ thấy khoảng 44 độ theo chiều dọc — một dải ngang hẹp,
     nhìn như bị cắt cụt trần lẫn sàn, không ra hình một căn phòng. 112 thấy
     được 63 độ, đủ ôm từ mép trần xuống hết dãy ghế.

     Góc rộng còn đỡ vỡ ảnh: ảnh chỉ phải kéo giãn 2 lần thay vì 2,9 lần. */
  var FOV_DEFAULT = 112;
  var FOV_MIN = 50;           // càng nhỏ càng phóng to; dưới 50 là vỡ nhoè
  var FOV_MAX = 140;
  var AUTO_SPEED = 0.004;     // độ mỗi mili-giây khi tự xoay

  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

  function prefersReduced() {
    return !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* ==========================================================
     Engine
     ========================================================== */
  function Pano(root) {
    this.root = root;
    this.view = root.querySelector('.pano__view');
    if (!this.view) return;

    this.yaw = 0;             // độ, 0-360, tăng dần khi nhìn sang phải
    this.pitchFrac = 0.5;     // 0 = nhìn hết lên, 1 = nhìn hết xuống
    this.fov = FOV_DEFAULT;
    this.dragging = false;
    this.immersive = false;
    this.visible = true;
    this.hidden = false;
    this.auto = !prefersReduced();
    this.last = null;

    this.dungKhung();
    this.nhanBanDiem();
    this.bindDrag();
    this.bindControls();
    this.bindLifecycle();
    this.tiLe = this.tiLeCua(root.getAttribute('data-scene'));
    this.yaw = this.gocDau(root.getAttribute('data-scene'));
    this.layout();

    this.tick = this.tick.bind(this);
    this.prev = null;
    global.requestAnimationFrame(this.tick);
  }

  /* Bề ngang khung ứng với `fov` độ, mà trọn vòng là 360 độ,
     nên ảnh phải rộng gấp 360/fov lần bề ngang khung. Cao bằng nửa rộng
     vì ảnh cầu luôn theo tỉ lệ 2:1. */
  Pano.prototype.layout = function () {
    var w = this.root.clientWidth;
    var h = this.root.clientHeight;
    if (!w || !h) return;

    this.imgW = w * 360 / this.fov;
    this.imgH = this.imgW / this.tiLe;
    /* Dải ảnh thấp hơn khung thì phóng thêm cho vừa chiều cao. Thà thấy hẹp
       bớt theo bề ngang còn hơn hở hai vệt nền trên dưới — hay gặp trên điện
       thoại dựng đứng, nơi khung cao mà hẹp. */
    if (this.imgH < h) { this.imgH = h; this.imgW = h * this.tiLe; }
    this.maxY = Math.max(0, this.imgH - h);   // khoảng còn ngước/cúi được

    this.view.style.backgroundSize = this.imgW.toFixed(1) + 'px ' + this.imgH.toFixed(1) + 'px';
    this.apply();
  };

  Pano.prototype.apply = function () {
    // nền lặp ngang nên toạ độ x không cần gò về 0-360, cứ trôi là khớp
    var x = -(this.yaw / 360) * this.imgW;
    var y = -this.pitchFrac * this.maxY;
    this.view.style.backgroundPosition = x.toFixed(1) + 'px ' + y.toFixed(1) + 'px';
  };

  /* ---------- Bộ khung riêng của chế độ toàn màn hình ----------
     Dựng bằng JS chứ không viết sẵn trong HTML: mấy nút này chỉ có nghĩa khi
     pano.js chạy được, nên tệp này hỏng thì trang không còn nút chết nào. */
  Pano.prototype.dungKhung = function () {
    var self = this;

    function nut(cha, lop, html, nhan, lam) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = lop;
      b.innerHTML = html;
      b.setAttribute('aria-label', nhan);
      b.title = nhan;
      b.addEventListener('click', function (e) { e.stopPropagation(); lam(); });
      // thiếu dòng này thì cú bấm bị khung hiểu nhầm thành thao tác kéo
      b.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
      cha.appendChild(b);
      return b;
    }

    /* Khối chữ nổi trên ảnh, nếu trang có. Lời mời được chèn VÀO khối đó để
       nó đi liền một mạch với tiêu đề, còn cả tấm ảnh phía sau thì để trống
       cho thao tác chạm-để-vào. Trang nào không có khối chữ thì lời mời rơi
       về giữa khung như cũ. */
    this.hero = this.root.closest ? this.root.closest('.hero360') : null;
    var khoiChu = this.hero
      ? (this.hero.querySelector('.hero360__trong') || this.hero.querySelector('.hero360__chu'))
      : null;

    nut(khoiChu || this.root, 'pano__moi',
      '<span class="pano__moi-vong" aria-hidden="true">'
      + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" '
      + 'stroke-linecap="round" stroke-linejoin="round">'
      + '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></span>'
      + '<span>Bước vào không gian</span>',
      'Xem toàn cảnh chiếm trọn màn hình',
      function () { self.setImmersive(true); });

    nut(this.root, 'pano__dong',
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" '
      + 'stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
      'Thoát toàn màn hình',
      function () { self.setImmersive(false); });

    /* ---------- Cánh cửa ----------
       Bảng phải dựng TRƯỚC nút vì nhanBanDiem() chạy ngay sau hàm này và cần
       chỗ để thả bản sao hàng điểm dừng vào. */
    this.bang = document.createElement('div');
    this.bang.className = 'pano__bang';
    this.bang.id = 'panoBang';
    this.bang.innerHTML = '<p class="pano__bang-tieu">Chọn không gian</p>';
    this.bang.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    this.root.appendChild(this.bang);

    this.cuaMo = false;
    this.cua = nut(this.root, 'pano__cua',
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" '
      + 'stroke-linecap="round" stroke-linejoin="round">'
      + '<path d="M6 21V4.6a1.6 1.6 0 0 1 1.3-1.57l8-1.6A1.6 1.6 0 0 1 17.2 3v18"/>'
      + '<path d="M3 21h18"/><circle cx="14" cy="12.4" r=".95" fill="currentColor" stroke="none"/>'
      + '</svg>',
      'Mở cửa sang không gian khác',
      function () { self.moCua(!self.cuaMo); });
    this.cua.setAttribute('aria-expanded', 'false');
    this.cua.setAttribute('aria-controls', 'panoBang');

    /* ---------- Hộp nhạc cụ ---------- */
    this.hopMo = false;
    this.hop = nut(this.root, 'pano__hop',
      '<span class="pano__hop-vong" aria-hidden="true">'
      + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" '
      + 'stroke-linecap="round" stroke-linejoin="round">'
      + '<path d="M3 9.4 5.3 5a2 2 0 0 1 1.8-1.1h9.8A2 2 0 0 1 18.7 5L21 9.4"/>'
      + '<rect x="3" y="9.4" width="18" height="10.7" rx="2"/>'
      + '<path d="M3 13.6h18"/><path d="M10.4 13.6h3.2v3h-3.2z"/></svg></span>'
      + '<span class="pano__hop-chu">Hộp nhạc cụ</span>',
      'Mở hộp nhạc cụ',
      function () { self.moHop(!self.hopMo); });
    this.hop.setAttribute('aria-pressed', 'false');
  };

  /* Mở hoặc đóng hộp nhạc cụ.

     pano.js KHÔNG tự vẽ nhạc cụ — nó chỉ bắn ra một sự kiện, nhac-cu.js nghe
     rồi dựng cảnh 3D. Tách rời như vậy để mạng chặn CDN three.js hay tệp mô
     hình hỏng thì khung 360 vẫn chạy nguyên vẹn, chỉ là bấm hộp không ra gì. */
  Pano.prototype.moHop = function (on) {
    this.hopMo = !!on;
    if (this.hop) {
      this.hop.setAttribute('aria-pressed', String(this.hopMo));
      var nhan = this.hopMo ? 'Đóng hộp nhạc cụ' : 'Mở hộp nhạc cụ';
      this.hop.setAttribute('aria-label', nhan);
      this.hop.title = nhan;
    }
    this.root.classList.toggle('co-nhac-cu', this.hopMo);
    /* Mở hộp là dừng tự xoay. Nhạc cụ neo theo CĂN PHÒNG chứ không dán vào màn
       hình, nên cảnh cứ xoay đều thì chúng lừ lừ trôi khỏi khung, mở hộp ra
       một lúc là trống trơn. */
    if (this.hopMo) this.setAuto(false);
    this.bao('pano:hop', { mo: this.hopMo });
  };

  Pano.prototype.bao = function (ten, chi) {
    try {
      this.root.dispatchEvent(new CustomEvent(ten, { detail: chi }));
    } catch (e) {}
  };

  /* Hướng nhìn hiện tại quy ra GÓC THẬT, để nhac-cu.js gắn camera 3D trùng
     khít với khung 360. Nhờ vậy nhạc cụ đứng yên trong phòng khi người xem kéo
     nhìn quanh, chứ không dán cứng vào màn hình như một lớp dán đè lên.

     yaw    : độ, hướng nằm CHÍNH GIỮA khung (mép trái khung mới là this.yaw)
     pitch  : độ, dương là đang ngước lên
     fovDoc : góc mở theo CHIỀU DỌC — three.js dùng fov dọc, this.fov là ngang */
  Pano.prototype.huongNhin = function () {
    var h = this.root.clientHeight;
    return {
      yaw: this.yaw + this.fov / 2,
      pitch: 90 - 180 * (this.pitchFrac * this.maxY + h / 2) / this.imgH,
      fovDoc: 180 * h / this.imgH
    };
  };

  /* Mở hoặc đóng bảng sau cánh cửa. */
  Pano.prototype.moCua = function (on) {
    this.cuaMo = !!on;
    if (this.bang) this.bang.classList.toggle('is-mo', this.cuaMo);
    if (this.cua) this.cua.setAttribute('aria-expanded', String(this.cuaMo));
  };

  /* Hàng điểm dừng dùng khi đã toàn màn hình. Nhân bản đúng hàng nút có sẵn
     trên trang chứ không viết lại, để danh sách điểm dừng chỉ khai báo một
     nơi duy nhất; setScene() vốn đã đồng bộ trạng thái cho MỌI [data-scene-btn]
     trong tài liệu nên bản sao tự chạy đúng mà không phải thêm gì.

     Không có hàng này thì vào toàn màn hình là kẹt luôn ở một cảnh, vì hàng
     nút gốc nằm khuất dưới lớp phủ. */
  Pano.prototype.nhanBanDiem = function () {
    var self = this;
    var goc = document.querySelector('.scenes');
    if (!goc || !this.bang) return;
    var ban = goc.cloneNode(true);
    ban.classList.add('scenes--trong');
    // bảng chỉ hiện khi đã toàn màn hình VÀ đã mở cửa, nên lúc bình thường bản
    // sao nằm trong display:none — trình đọc màn hình không đọc hai lần một hàng
    this.bang.appendChild(ban);

    // chọn xong thì khép cửa lại, đỡ che mất cảnh vừa đổi sang
    ban.addEventListener('click', function (e) {
      if (e.target && e.target.closest && e.target.closest('[data-scene-btn]')) self.moCua(false);
    });
  };

  /* ---------- Kéo để nhìn quanh ---------- */
  Pano.prototype.bindDrag = function () {
    var self = this;
    var r = this.root;
    var dat = null;      // chỗ và lúc đặt tay xuống, để phân biệt chạm với kéo

    r.addEventListener('pointerdown', function (e) {
      if (e.button != null && e.button !== 0) return;
      self.dragging = true;
      self.last = { x: e.clientX, y: e.clientY };
      dat = { x: e.clientX, y: e.clientY, t: Date.now() };
      r.classList.add('is-dragging');
      try { r.setPointerCapture(e.pointerId); } catch (err) {}
    });

    r.addEventListener('pointermove', function (e) {
      if (!self.dragging || !self.last) return;
      var dx = e.clientX - self.last.x;
      var dy = e.clientY - self.last.y;
      /* Chỉ khi đã thật sự kéo mới tắt tự xoay và ẩn dòng gợi ý. Đặt ở
         pointerdown như trước thì một cú chạm để bước vào cũng giết luôn
         tự xoay, vào tới nơi là cảnh đứng im. */
      if (self.auto) self.setAuto(false);
      r.classList.add('has-moved');
      // kéo ngang bao nhiêu điểm ảnh thì cảnh trôi đúng bấy nhiêu — bám tay
      self.yaw -= dx / self.imgW * 360;
      if (self.maxY > 0) self.pitchFrac = clamp(self.pitchFrac - dy / self.maxY, 0, 1);
      self.last = { x: e.clientX, y: e.clientY };
      self.apply();
    });

    var end = function (e) {
      if (!self.dragging) return;
      self.dragging = false;
      self.last = null;
      r.classList.remove('is-dragging');
      try { r.releasePointerCapture(e.pointerId); } catch (err) {}

      /* CHẠM VÀO ẢNH LÀ BƯỚC VÀO.
         Cả tấm ảnh là nút bấm, đúng như khung ngó trước cần: chữ nổi lên
         trên, ảnh nằm sau, chạm vào ảnh là chữ biến mất và cảnh chiếm trọn
         màn hình. Mấy nút nổi bên trên đều chặn pointerdown nên cú bấm vào
         chúng không lọt xuống đây.

         Phải là pointerup thật (pointercancel thì thôi), di chuyển dưới 9px
         và nhấc tay trong 600ms — quá ngưỡng đó là người dùng đang kéo nhìn
         quanh chứ không định bấm. */
      var d = dat; dat = null;
      if (e.type !== 'pointerup' || !d) return;
      if (Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) >= 9) return;
      if (Date.now() - d.t >= 600) return;

      if (!self.immersive) self.setImmersive(true);
      else if (self.cuaMo) self.moCua(false);   // trong rồi thì chạm là khép cửa
    };
    r.addEventListener('pointerup', end);
    r.addEventListener('pointercancel', end);

    // lăn chuột để phóng to / thu nhỏ
    r.addEventListener('wheel', function (e) {
      e.preventDefault();
      self.zoom(e.deltaY > 0 ? 5 : -5);
    }, { passive: false });

    // điều khiển bằng bàn phím cho người không dùng chuột
    r.addEventListener('keydown', function (e) {
      var deg = self.fov / 12;
      if (e.key === 'ArrowLeft') self.yaw -= deg;
      else if (e.key === 'ArrowRight') self.yaw += deg;
      else if (e.key === 'ArrowUp') self.pitchFrac = clamp(self.pitchFrac - .06, 0, 1);
      else if (e.key === 'ArrowDown') self.pitchFrac = clamp(self.pitchFrac + .06, 0, 1);
      else if (e.key === '+' || e.key === '=') self.zoom(-6);
      else if (e.key === '-') self.zoom(6);
      else return;
      e.preventDefault();
      self.setAuto(false);
      r.classList.add('has-moved');
      self.apply();
    });
  };

  Pano.prototype.zoom = function (delta) {
    this.fov = clamp(this.fov + delta, FOV_MIN, FOV_MAX);
    this.layout();      // pitchFrac giữ nguyên nên phóng to không bị nhảy góc nhìn
  };

  Pano.prototype.setAuto = function (on) {
    this.auto = on && !prefersReduced();
    var btn = this.root.querySelector('[data-pano="auto"]');
    if (btn) {
      btn.setAttribute('aria-pressed', String(this.auto));
      btn.setAttribute('aria-label', this.auto ? 'Dừng tự xoay' : 'Tự xoay quanh');
      btn.title = this.auto ? 'Dừng tự xoay' : 'Tự xoay quanh';
    }
  };

  /* ---------- Toàn màn hình ----------
     Dùng lớp CSS chứ không dùng Fullscreen API: iPhone không cho phần tử
     thường vào chế độ toàn màn hình (chỉ video), nên cách này mới chạy
     đồng nhất trên mọi máy.                                              */
  Pano.prototype.setImmersive = function (on) {
    if (on === this.immersive) return;
    this.immersive = on;
    this.root.classList.toggle('is-immersive', on);
    // khối chữ nổi trên ảnh tắt đi: vào trong rồi thì chỉ còn cảnh
    if (this.hero) this.hero.classList.toggle('is-full', on);
    if (!on) { this.moCua(false); this.moHop(false); }
    /* Báo ra ngay lúc vừa vào: nhac-cu.js nhân lúc này tải trước mấy tệp .glb
       để khi người xem bấm hộp là bung ra liền, không phải đợi. */
    this.bao('pano:full', { on: on });
    // dòng gợi ý "Kéo để nhìn quanh" chỉ hiện trong này, cho nó một lượt nữa
    if (on) this.root.classList.remove('has-moved');

    var lock = global.ScrollLock;
    if (lock) { on ? lock.on() : lock.off(); }

    var btn = this.root.querySelector('[data-pano="expand"]');
    if (btn) {
      btn.setAttribute('aria-pressed', String(on));
      btn.setAttribute('aria-label', on ? 'Thoát toàn màn hình' : 'Xem toàn màn hình');
      btn.title = on ? 'Thoát toàn màn hình' : 'Xem toàn màn hình';
    }
    // khung đổi kích thước nên phải tính lại cỡ ảnh
    var self = this;
    global.requestAnimationFrame(function () { self.layout(); });
    if (on) this.root.focus();
  };

  /* Hướng nhìn lúc vừa mở một cảnh, ghi ở data-yaw của nút điểm dừng, tính
     bằng độ kể từ mép trái ảnh — ảnh cầu trải 360 độ nên giữa ảnh là 180.
     Trừ đi nửa bề ngang khung nhìn để hướng đó nằm CHÍNH GIỮA khung chứ không
     nằm ở mép trái. Không ghi data-yaw thì mở ra đúng mép trái ảnh như cũ.

     Cần cái này vì mép trái ảnh cầu rơi vào đâu là tuỳ lúc chụp: ảnh khán
     phòng có sân khấu nằm giữa ảnh, để mặc định thì mở lên nhìn thẳng vào
     cửa thoát hiểm phía sau lưng. */
  /* Bề ngang chia bề cao của tệp ảnh cảnh này, ghi ở data-ti-le của nút điểm
     dừng. Ảnh cầu đầy đủ là 2 (360 độ ngang, 180 độ dọc) nên đó là mặc định.

     Cả bốn điểm dừng hiện đều dùng mặc định. Chỉ khai số khác khi ảnh chưa đủ
     trần và sàn — ví dụ một DẢI quanh tầm mắt phủ trọn 360 độ ngang nhưng chỉ
     khoảng 90 độ dọc thì tỉ lệ là 4. Ép dải đó vào khuôn 2:1 là kéo cao gấp
     đôi, tường méo hết; khai đúng tỉ lệ thì tường giữ nguyên hình. */
  Pano.prototype.tiLeCua = function (id) {
    var nut = document.querySelector('[data-scene-btn="' + id + '"][data-ti-le]');
    var v = nut ? parseFloat(nut.getAttribute('data-ti-le')) : NaN;
    return isNaN(v) || v <= 0 ? 2 : v;
  };

  Pano.prototype.gocDau = function (id) {
    var nut = document.querySelector('[data-scene-btn="' + id + '"][data-yaw]');
    var huong = nut ? parseFloat(nut.getAttribute('data-yaw')) : NaN;
    return isNaN(huong) ? 0 : huong - this.fov / 2;
  };

  Pano.prototype.setScene = function (id) {
    this.root.setAttribute('data-scene', id);
    this.tiLe = this.tiLeCua(id);
    this.yaw = this.gocDau(id);
    this.pitchFrac = 0.5;
    this.layout();

    Array.prototype.forEach.call(document.querySelectorAll('[data-scene-btn]'), function (b) {
      var on = b.getAttribute('data-scene-btn') === id;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', String(on));
    });

    var label = document.getElementById('panoSceneName');
    var active = document.querySelector('[data-scene-btn="' + id + '"]');
    if (label && active) label.textContent = active.textContent.trim();
  };

  Pano.prototype.bindControls = function () {
    var self = this;

    Array.prototype.forEach.call(this.root.querySelectorAll('[data-pano]'), function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();      // đừng để cú bấm biến thành thao tác kéo
        var act = btn.getAttribute('data-pano');
        if (act === 'in') self.zoom(-10);
        else if (act === 'out') self.zoom(10);
        else if (act === 'auto') self.setAuto(!self.auto);
        else if (act === 'expand') self.setImmersive(!self.immersive);
        else if (act === 'reset') {
          self.fov = FOV_DEFAULT;
          self.yaw = self.gocDau(self.root.getAttribute('data-scene'));
          self.pitchFrac = 0.5; self.layout();
        }
        if (act !== 'auto') self.root.classList.add('has-moved');
      });
      // giữ nút không bị kéo theo khi người dùng rê chuột trên khung
      btn.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    });

    Array.prototype.forEach.call(document.querySelectorAll('[data-scene-btn]'), function (btn) {
      btn.addEventListener('click', function () {
        self.setScene(btn.getAttribute('data-scene-btn'));
      });
    });

    // Esc khép cửa trước, bấm tiếp mới thoát hẳn — đỡ văng ra ngoài oan
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !self.immersive) return;
      if (self.cuaMo) self.moCua(false);
      else self.setImmersive(false);
    });
  };

  Pano.prototype.bindLifecycle = function () {
    var self = this;
    var relayout = function () { self.layout(); };

    global.addEventListener('resize', relayout, { passive: true });
    global.addEventListener('orientationchange', function () {
      // trình duyệt cập nhật kích thước sau sự kiện này một nhịp
      global.setTimeout(relayout, 120);
    }, { passive: true });

    // cuộn khuất khỏi màn hình hoặc chuyển tab thì ngừng vẽ cho đỡ tốn pin
    if ('IntersectionObserver' in global) {
      new IntersectionObserver(function (entries) {
        self.visible = entries[0].isIntersecting;
      }, { threshold: 0.05 }).observe(this.root);
    }
    document.addEventListener('visibilitychange', function () {
      self.hidden = document.hidden;
    });
  };

  Pano.prototype.tick = function (ts) {
    if (this.prev == null) this.prev = ts;
    var dt = Math.min(ts - this.prev, 64);   // chặn bước nhảy lớn khi tab vừa hiện lại
    this.prev = ts;

    if (this.auto && !this.dragging && this.visible && !this.hidden) {
      this.yaw += AUTO_SPEED * dt;
      this.apply();
    }
    global.requestAnimationFrame(this.tick);
  };

  /* ==========================================================
     API công khai
     ========================================================== */
  global.Pano = {
    mount: function (el) {
      if (!el || !el.querySelector('.pano__view')) return null;
      var p = new Pano(el);
      // nhac-cu.js cần hỏi hướng nhìn mỗi khung hình nên phải với tới được
      el.__pano = p;
      return p;
    }
  };
})(window);
