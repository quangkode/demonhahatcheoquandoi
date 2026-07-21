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
   Thêm cảnh mới thì thêm một nút [data-scene-btn] trong trang là xong.
   ========================================================== */
(function (global) {
  'use strict';

  var FOV_DEFAULT = 78;       // bề ngang khung nhìn thấy bao nhiêu độ
  var FOV_MIN = 30;           // càng nhỏ càng phóng to
  var FOV_MAX = 120;
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

    this.bindDrag();
    this.bindControls();
    this.bindLifecycle();
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
    this.imgH = this.imgW / 2;
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

  Pano.prototype.setScene = function (id) {
    this.root.setAttribute('data-scene', id);
    this.yaw = 0;
    this.pitchFrac = 0.5;
    this.apply();

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
          self.yaw = 0; self.pitchFrac = 0.5; self.fov = FOV_DEFAULT; self.layout();
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
