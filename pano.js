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

    function nut(lop, html, nhan, lam) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = lop;
      b.innerHTML = html;
      b.setAttribute('aria-label', nhan);
      b.title = nhan;
      b.addEventListener('click', function (e) { e.stopPropagation(); lam(); });
      // thiếu dòng này thì cú bấm bị khung hiểu nhầm thành thao tác kéo
      b.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
      self.root.appendChild(b);
      return b;
    }

    // Lời mời bước vào. Bấm là cảnh chiếm trọn màn hình: chỉ còn ảnh 360 và
    // mấy nút điều khiển, không còn tiêu đề hay phần nào khác của trang.
    nut('pano__moi',
      '<span class="pano__moi-vong" aria-hidden="true">'
      + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" '
      + 'stroke-linecap="round" stroke-linejoin="round">'
      + '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></span>'
      + '<span>Bước vào không gian</span>',
      'Xem toàn cảnh chiếm trọn màn hình',
      function () { self.setImmersive(true); });

    nut('pano__dong',
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" '
      + 'stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
      'Thoát toàn màn hình',
      function () { self.setImmersive(false); });
  };

  /* Hàng điểm dừng dùng khi đã toàn màn hình. Nhân bản đúng hàng nút có sẵn
     trên trang chứ không viết lại, để danh sách điểm dừng chỉ khai báo một
     nơi duy nhất; setScene() vốn đã đồng bộ trạng thái cho MỌI [data-scene-btn]
     trong tài liệu nên bản sao tự chạy đúng mà không phải thêm gì.

     Không có hàng này thì vào toàn màn hình là kẹt luôn ở một cảnh, vì hàng
     nút gốc nằm khuất dưới lớp phủ. */
  Pano.prototype.nhanBanDiem = function () {
    var goc = document.querySelector('.scenes');
    if (!goc) return;
    var ban = goc.cloneNode(true);
    ban.classList.add('scenes--trong');
    // chưa toàn màn hình thì CSS để display:none, nên bản sao không lọt vào
    // cây trợ năng — không có chuyện trình đọc màn hình đọc hai lần một hàng nút
    this.root.appendChild(ban);
  };

  /* ---------- Kéo để nhìn quanh ---------- */
  Pano.prototype.bindDrag = function () {
    var self = this;
    var r = this.root;

    r.addEventListener('pointerdown', function (e) {
      if (e.button != null && e.button !== 0) return;
      self.dragging = true;
      self.setAuto(false);
      self.last = { x: e.clientX, y: e.clientY };
      r.classList.add('is-dragging');
      r.classList.add('has-moved');          // ẩn dòng gợi ý sau lần chạm đầu
      try { r.setPointerCapture(e.pointerId); } catch (err) {}
    });

    r.addEventListener('pointermove', function (e) {
      if (!self.dragging || !self.last) return;
      var dx = e.clientX - self.last.x;
      var dy = e.clientY - self.last.y;
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

     Ảnh khán phòng hiện là một DẢI quanh tầm mắt, tỉ lệ 4: phủ trọn 360 độ
     ngang nhưng chỉ khoảng 90 độ dọc, chưa có trần và sàn. Ép dải đó vào
     khuôn 2:1 là kéo cao gấp đôi, tường méo hết. Khai đúng tỉ lệ thì tường
     giữ nguyên hình. Khi nào ghép thêm ảnh trần và sàn thì hạ số này xuống. */
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

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && self.immersive) self.setImmersive(false);
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
      return new Pano(el);
    }
  };
})(window);
