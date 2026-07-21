/* ==========================================================
   Nhà hát Chèo Quân đội — Đặt chỗ xem chèo (miễn phí)
   Dùng chung cho trang dat-cho.html và popup ở trang chủ.
   ========================================================== */
(function (global) {
  'use strict';

  /* ---------- Dữ liệu suất diễn ---------- */
  var SHOWS = [
    {
      id: 'nhc-0808', day: '08', month: 'Tháng 8', year: '2026', weekday: 'Thứ Sáu',
      time: '20:00', title: 'Quan Âm Thị Kính', genre: 'Chèo cổ',
      venue: 'Rạp Nhà hát Chèo Quân đội', address: 'Số 3 Nguyễn Tri Phương, Ba Đình, Hà Nội',
      duration: '120 phút', fill: 0.24
    },
    {
      id: 'nhc-1508', day: '15', month: 'Tháng 8', year: '2026', weekday: 'Thứ Sáu',
      time: '20:00', title: 'Bến nước Trường Sơn', genre: 'Chèo hiện đại', flag: 'Công diễn',
      venue: 'Rạp Nhà hát Chèo Quân đội', address: 'Số 3 Nguyễn Tri Phương, Ba Đình, Hà Nội',
      duration: '135 phút', fill: 0.82
    },
    {
      id: 'nhc-2208', day: '22', month: 'Tháng 8', year: '2026', weekday: 'Thứ Sáu',
      time: '20:00', title: 'Lưu Bình - Dương Lễ', genre: 'Chèo cổ',
      venue: 'Nhà văn hóa Quân khu 3', address: 'TP. Hải Phòng',
      duration: '110 phút', fill: 0.38
    },
    {
      id: 'nhc-2908', day: '29', month: 'Tháng 8', year: '2026', weekday: 'Thứ Sáu',
      time: '19:30', title: 'Đêm nhạc: Điệu chèo người lính', genre: 'Chương trình nghệ thuật',
      venue: 'Rạp Nhà hát Chèo Quân đội', address: 'Số 3 Nguyễn Tri Phương, Ba Đình, Hà Nội',
      duration: '100 phút', fill: 1
    }
  ];

  var ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  var PER_ROW = 16;
  var AISLES = [4, 12];              // chèn lối đi sau ghế số 4 và 12
  var MAX_SEATS = 6;

  /* ---------- Tiện ích ---------- */
  function seededRandom(seed) {
    var s = 0;
    for (var i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  // Ghế đã có người đặt — sinh cố định theo mã suất để không đổi mỗi lần tải lại
  function occupiedSeats(show) {
    var rand = seededRandom(show.id);
    var taken = {};
    ROWS.forEach(function (r) {
      for (var n = 1; n <= PER_ROW; n++) {
        if (show.fill >= 1) { taken[r + n] = true; continue; }   // suất đã kín chỗ
        if (rand() < show.fill) taken[r + n] = true;
      }
    });
    return taken;
  }

  function validSeat(seat) {
    var m = /^([A-J])(\d{1,2})$/.exec(String(seat));
    if (!m) return false;
    var n = parseInt(m[2], 10);
    return ROWS.indexOf(m[1]) > -1 && n >= 1 && n <= PER_ROW;
  }

  function seatsLeft(show) {
    var taken = occupiedSeats(show);
    return ROWS.length * PER_ROW - Object.keys(taken).length;
  }

  function statusOf(show) {
    var left = seatsLeft(show);
    if (left <= 0) return { key: 'full', label: 'Hết chỗ', cls: 'tag--red' };
    if (left < 45) return { key: 'few', label: 'Sắp hết chỗ', cls: 'tag--amber' };
    return { key: 'open', label: 'Còn chỗ', cls: 'tag--green' };
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function bookingCode() {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
    var out = '';
    for (var i = 0; i < 5; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return 'NHC-' + out;
  }

  /* ---------- Khoá cuộn nền ----------
     Dùng chung cho popup đặt chỗ và menu mobile. Có bộ đếm để khi menu và popup
     chồng lên nhau thì lớp đóng trước không mở khoá sớm.
     Cố ý KHÔNG dùng mẹo "position:fixed cho body": cách đó chặn cuộn triệt để hơn
     nhưng lại làm header dính bị đẩy khỏi màn hình, mà nút đóng menu nằm ngay trên
     header. Thay vào đó dùng overflow:hidden kết hợp overscroll-behavior:contain
     trên chính lớp phủ (xem .nav và .bkmodal__body trong styles.css).              */
  var lockDepth = 0;

  var ScrollLock = {
    on: function () {
      if (lockDepth++ === 0) document.body.classList.add('is-locked');
    },
    off: function () {
      if (lockDepth > 0 && --lockDepth === 0) document.body.classList.remove('is-locked');
    }
  };

  /* ==========================================================
     Engine
     ========================================================== */
  function Booking(root, options) {
    options = options || {};
    this.root = root;
    this.embedded = !!options.embedded;      // true khi nằm trong popup
    this.onClose = options.onClose || null;
    this.show = options.showId ? findShow(options.showId) : null;
    this.step = this.show ? 2 : 1;
    this.selected = [];
    this.taken = this.show ? occupiedSeats(this.show) : {};
    this.code = null;

    // đăng ký một lần cho cả vòng đời: xoay ngang/dọc hay đổi cỡ cửa sổ
    // đều phải tính lại xem sơ đồ ghế còn cuộn được về phía nào
    var self = this;
    this._onResize = function () { self.syncFade(); };
    window.addEventListener('resize', this._onResize, { passive: true });
    window.addEventListener('orientationchange', this._onResize, { passive: true });

    this.render();
  }

  // cập nhật hai dải mờ báo hiệu sơ đồ ghế còn cuộn được sang trái/phải
  Booking.prototype.syncFade = function () {
    var outer = this.root.querySelector('.seatmap-outer');
    var wrap = this.root.querySelector('.seatmap-wrap');
    if (!outer || !wrap) return;
    var max = wrap.scrollWidth - wrap.clientWidth;
    // câu "vuốt ngang" chỉ hiện khi sơ đồ thật sự rộng hơn khung — trên tablet
    // và desktop sơ đồ lọt trọn thì nhắc vuốt là thừa và gây hiểu nhầm
    outer.classList.toggle('is-scrollable', max > 4);
    outer.classList.toggle('can-scroll-left', wrap.scrollLeft > 4);
    outer.classList.toggle('can-scroll-right', wrap.scrollLeft < max - 4);
  };

  Booking.prototype.destroy = function () {
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('orientationchange', this._onResize);
  };

  function findShow(id) {
    for (var i = 0; i < SHOWS.length; i++) if (SHOWS[i].id === id) return SHOWS[i];
    return null;
  }

  Booking.prototype.go = function (step) {
    this.step = step;
    this.render();
    var top = this.root.querySelector('.bk__steps');
    if (top && !this.embedded) {
      var y = top.getBoundingClientRect().top + window.scrollY - 150;
      window.scrollTo({ top: y, behavior: 'smooth' });
    } else if (this.embedded) {
      this.root.scrollTop = 0;
    }
  };

  Booking.prototype.pickShow = function (id) {
    this.show = findShow(id);
    this.taken = occupiedSeats(this.show);
    this.selected = [];
    this.go(2);
  };

  Booking.prototype.toggleSeat = function (seat) {
    if (!validSeat(seat) || this.taken[seat]) return;
    var i = this.selected.indexOf(seat);
    if (i > -1) {
      this.selected.splice(i, 1);
    } else {
      if (this.selected.length >= MAX_SEATS) {
        this.notice = 'Mỗi lượt đặt tối đa ' + MAX_SEATS + ' chỗ. Cần nhiều hơn, vui lòng liên hệ phòng vé.';
        this.render();
        return;
      }
      this.selected.push(seat);
    }
    this.notice = null;
    this.render();
  };

  Booking.prototype.reset = function () {
    this.show = null;
    this.selected = [];
    this.code = null;
    this.form = null;
    this.go(1);
  };

  /* ---------- Render ---------- */
  Booking.prototype.render = function () {
    // Mỗi lần chạm vào ghế là dựng lại toàn bộ HTML. Trên điện thoại sơ đồ ghế
    // phải cuộn ngang, nên nếu không giữ lại scrollLeft thì cứ chọn một ghế là
    // sơ đồ lại nhảy về mép trái — gần như không thể chọn ghế ở dãy bên phải.
    var prevWrap = this.root.querySelector('.seatmap-wrap');
    var prevScroll = prevWrap ? prevWrap.scrollLeft : -1;

    var html = '';
    html += this.renderSteps();
    if (this.step === 1) html += this.renderStepShows();
    if (this.step === 2) html += this.renderStepSeats();
    if (this.step === 3) html += this.renderStepForm();
    if (this.step === 4) html += this.renderStepDone();
    this.root.innerHTML = html;

    var wrap = this.root.querySelector('.seatmap-wrap');
    if (wrap) {
      if (prevScroll >= 0) {
        wrap.scrollLeft = prevScroll;
      } else {
        // lần đầu mở sơ đồ: căn giữa để thấy ngay khu ghế trung tâm
        wrap.scrollLeft = Math.max(0, (wrap.scrollWidth - wrap.clientWidth) / 2);
      }
    }

    this.bind();
  };

  Booking.prototype.renderSteps = function () {
    var labels = ['Chọn suất diễn', 'Chọn chỗ ngồi', 'Thông tin người đặt', 'Hoàn tất'];
    var self = this;
    var items = labels.map(function (label, i) {
      var n = i + 1;
      var cls = n === self.step ? 'is-active' : (n < self.step ? 'is-done' : '');
      return '<li class="' + cls + '"><span class="bk__stepnum">' + n + '</span>' +
             '<span class="bk__steplabel">' + label + '</span></li>';
    }).join('');
    return '<ol class="bk__steps">' + items + '</ol>';
  };

  /* --- Bước 1: chọn suất --- */
  Booking.prototype.renderStepShows = function () {
    var cards = SHOWS.map(function (s) {
      var st = statusOf(s);
      var left = seatsLeft(s);
      var full = st.key === 'full';
      return '' +
        '<article class="bkshow' + (full ? ' is-full' : '') + '">' +
          '<div class="bkshow__date"><strong>' + s.day + '</strong><span>' + s.month + '</span><em>' + s.weekday + '</em></div>' +
          '<div class="bkshow__body">' +
            '<h3>' + esc(s.title) + (s.flag ? ' <span class="badge">' + esc(s.flag) + '</span>' : '') + '</h3>' +
            '<p class="bkshow__meta">' + s.time + ' · ' + esc(s.genre) + ' · ' + s.duration + '</p>' +
            '<p class="bkshow__venue">' + esc(s.venue) + ' — ' + esc(s.address) + '</p>' +
          '</div>' +
          '<div class="bkshow__act">' +
            '<span class="tag ' + st.cls + '">' + st.label + '</span>' +
            '<span class="bkshow__left">' + (full ? 'Đã kín chỗ' : 'Còn trống ' + left + ' chỗ') + '</span>' +
            (full
              ? '<button class="btn btn--sm btn--muted" type="button" disabled>Hết chỗ</button>'
              : '<button class="btn btn--sm" type="button" data-pick="' + s.id + '">Chọn suất này</button>') +
          '</div>' +
        '</article>';
    }).join('');

    return '' +
      '<div class="bk__panel">' +
        '<div class="bk__note">Toàn bộ suất diễn của Nhà hát đều <strong>miễn phí</strong>. Bạn chỉ cần giữ chỗ trước để Nhà hát bố trí đón tiếp.</div>' +
        '<div class="bkshows">' + cards + '</div>' +
      '</div>';
  };

  /* --- Bước 2: chọn ghế --- */
  Booking.prototype.renderStepSeats = function () {
    var self = this;
    var s = this.show;

    var rowsHtml = ROWS.map(function (r) {
      var cells = '';
      for (var n = 1; n <= PER_ROW; n++) {
        var id = r + n;
        var cls = 'seat';
        if (self.taken[id]) cls += ' is-taken';
        if (self.selected.indexOf(id) > -1) cls += ' is-picked';
        cells += '<button type="button" class="' + cls + '" data-seat="' + id + '" ' +
                 (self.taken[id] ? 'disabled aria-label="Ghế ' + id + ' đã có người đặt"' : 'aria-label="Ghế ' + id + '"') +
                 '>' + n + '</button>';
        if (AISLES.indexOf(n) > -1) cells += '<span class="seat-aisle" aria-hidden="true"></span>';
      }
      return '<div class="seatrow"><span class="seatrow__label">' + r + '</span>' + cells +
             '<span class="seatrow__label">' + r + '</span></div>';
    }).join('');

    var picked = this.selected.length
      ? this.selected.slice().sort().map(function (x) { return '<span class="chip">' + x + '</span>'; }).join('')
      : '<span class="bk__empty">Chưa chọn chỗ nào</span>';

    return '' +
      '<div class="bk__panel bk__panel--seats">' +
        '<div class="bk__main">' +
          // sân khấu nằm chung khung cuộn với sơ đồ nên luôn thẳng hàng với dãy ghế
          '<div class="seatmap-outer">' +
            '<div class="seatmap-wrap">' +
              '<div class="seatmap-inner">' +
                '<div class="stage"><span>SÂN KHẤU</span></div>' +
                '<div class="seatmap">' + rowsHtml + '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<p class="seatmap-hint">Vuốt ngang để xem toàn bộ sơ đồ ghế</p>' +
          '<div class="legend">' +
            '<span><i class="legend__box"></i> Còn trống</span>' +
            '<span><i class="legend__box legend__box--picked"></i> Bạn đang chọn</span>' +
            '<span><i class="legend__box legend__box--taken"></i> Đã có người</span>' +
          '</div>' +
          (this.notice ? '<p class="bk__warn">' + esc(this.notice) + '</p>' : '') +
        '</div>' +

        '<aside class="bk__side bk__side--seats">' +
          '<div class="bkcard">' +
            '<h3>' + esc(s.title) + '</h3>' +
            '<dl class="bkcard__list">' +
              '<dt>Suất diễn</dt><dd>' + s.time + ' · ' + s.weekday + ', ' + s.day + '/' + s.month.replace('Tháng ', '') + '/' + s.year + '</dd>' +
              '<dt>Địa điểm</dt><dd>' + esc(s.venue) + '</dd>' +
              '<dt>Thời lượng</dt><dd>' + s.duration + '</dd>' +
            '</dl>' +
            '<div class="bkcard__picked"><span class="bkcard__label">Chỗ đã chọn</span><div class="chips">' + picked + '</div></div>' +
            '<p class="bkcard__free">Vé mời miễn phí · Tối đa ' + MAX_SEATS + ' chỗ mỗi lượt đặt</p>' +
            '<div class="bk__actions">' +
              '<button type="button" class="btn btn--ghost btn--sm" data-back="1">Đổi suất</button>' +
              '<button type="button" class="btn btn--primary" data-next="3"' + (this.selected.length ? '' : ' disabled') + '>Tiếp tục</button>' +
            '</div>' +
          '</div>' +
        '</aside>' +
      '</div>';
  };

  /* --- Bước 3: thông tin --- */
  Booking.prototype.renderStepForm = function () {
    var s = this.show;
    var seats = this.selected.slice().sort().join(', ');
    var f = this.form || {};

    return '' +
      '<div class="bk__panel bk__panel--seats">' +
        '<div class="bk__main">' +
          '<form class="bkform" id="bkForm" novalidate>' +
            '<h3 class="bkform__title">Thông tin người đặt chỗ</h3>' +
            '<div class="bkform__grid">' +
              '<label class="field"><span>Họ và tên <b>*</b></span>' +
                '<input name="name" required value="' + esc(f.name || '') + '" placeholder="Nguyễn Văn A" /></label>' +
              '<label class="field"><span>Số điện thoại <b>*</b></span>' +
                '<input name="phone" required inputmode="tel" value="' + esc(f.phone || '') + '" placeholder="09xx xxx xxx" /></label>' +
              '<label class="field"><span>Email</span>' +
                '<input name="email" type="email" value="' + esc(f.email || '') + '" placeholder="email@example.com" /></label>' +
              '<label class="field"><span>Đơn vị / Cơ quan</span>' +
                '<input name="org" value="' + esc(f.org || '') + '" placeholder="Không bắt buộc" /></label>' +
              '<label class="field field--full"><span>Ghi chú cho Nhà hát</span>' +
                '<textarea name="note" rows="3" placeholder="Ví dụ: đi cùng người cao tuổi, cần chỗ gần lối ra…">' + esc(f.note || '') + '</textarea></label>' +
            '</div>' +
            '<p class="bkform__hint">Nhà hát dùng số điện thoại để xác nhận lại chỗ ngồi trước ngày diễn. Thông tin chỉ phục vụ công tác đón tiếp.</p>' +
            '<div class="bk__actions">' +
              '<button type="button" class="btn btn--ghost btn--sm" data-back="2">Quay lại chọn chỗ</button>' +
              '<button type="submit" class="btn btn--primary">Xác nhận đặt chỗ</button>' +
            '</div>' +
          '</form>' +
        '</div>' +

        '<aside class="bk__side bk__side--form">' +
          '<div class="bkcard">' +
            '<h3>' + esc(s.title) + '</h3>' +
            '<dl class="bkcard__list">' +
              '<dt>Suất diễn</dt><dd>' + s.time + ' · ' + s.weekday + ', ' + s.day + '/' + s.month.replace('Tháng ', '') + '/' + s.year + '</dd>' +
              '<dt>Địa điểm</dt><dd>' + esc(s.venue) + '</dd>' +
              '<dt>Chỗ ngồi</dt><dd>' + seats + '</dd>' +
              '<dt>Số lượng</dt><dd>' + this.selected.length + ' chỗ</dd>' +
            '</dl>' +
            '<p class="bkcard__free">Vé mời miễn phí — Nhà hát không thu bất kỳ khoản phí nào.</p>' +
          '</div>' +
        '</aside>' +
      '</div>';
  };

  /* --- Bước 4: hoàn tất --- */
  Booking.prototype.renderStepDone = function () {
    var s = this.show;
    var f = this.form || {};
    var seats = this.selected.slice().sort().join(', ');

    return '' +
      '<div class="bk__panel">' +
        '<div class="bkdone">' +
          '<div class="bkdone__tick" aria-hidden="true">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m4.5 12.5 5 5 10-11"/></svg>' +
          '</div>' +
          '<h3>Đã giữ chỗ thành công</h3>' +
          '<p class="bkdone__sub">Nhà hát sẽ liên hệ số ' + esc(f.phone || '') + ' để xác nhận trước ngày diễn.</p>' +

          '<div class="ticket">' +
            '<div class="ticket__head">' +
              '<span>Phiếu giữ chỗ</span>' +
              '<strong>' + this.code + '</strong>' +
            '</div>' +
            '<div class="ticket__body">' +
              '<dl>' +
                '<dt>Vở diễn</dt><dd>' + esc(s.title) + '</dd>' +
                '<dt>Suất diễn</dt><dd>' + s.time + ' · ' + s.weekday + ', ' + s.day + '/' + s.month.replace('Tháng ', '') + '/' + s.year + '</dd>' +
                '<dt>Địa điểm</dt><dd>' + esc(s.venue) + '<br /><small>' + esc(s.address) + '</small></dd>' +
                '<dt>Chỗ ngồi</dt><dd>' + seats + ' <small>(' + this.selected.length + ' chỗ)</small></dd>' +
                '<dt>Người đặt</dt><dd>' + esc(f.name || '') + (f.org ? ' — ' + esc(f.org) : '') + '</dd>' +
              '</dl>' +
              '<p class="ticket__free">MIỄN PHÍ</p>' +
            '</div>' +
          '</div>' +

          '<ul class="bkdone__notes">' +
            '<li>Vui lòng có mặt trước giờ diễn 20 phút và đọc mã giữ chỗ tại quầy đón tiếp.</li>' +
            '<li>Chỗ ngồi được giữ đến trước giờ mở màn 10 phút, sau đó Nhà hát có thể bố trí cho khách khác.</li>' +
            '<li>Cần thay đổi hoặc hủy chỗ, xin gọi 024 3845 7583 trong giờ hành chính.</li>' +
          '</ul>' +

          '<div class="bk__actions bk__actions--center">' +
            '<button type="button" class="btn btn--ghost" data-print="1">In phiếu</button>' +
            '<button type="button" class="btn btn--primary" data-reset="1">Đặt suất khác</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  };

  /* ---------- Gắn sự kiện ---------- */
  Booking.prototype.bind = function () {
    var self = this;
    var r = this.root;

    // Hai dải mờ hai bên sơ đồ ghế, chỉ hiện khi thực sự còn cuộn được.
    // Listener 'scroll' gắn vào phần tử mới sau mỗi lần render nên tự mất theo node;
    // listener 'resize'/'orientationchange' thì chỉ đăng ký một lần trong constructor
    // để không dồn lại sau mỗi lần chọn ghế.
    var wrap = r.querySelector('.seatmap-wrap');
    if (wrap) {
      wrap.addEventListener('scroll', function () { self.syncFade(); }, { passive: true });
    }
    this.syncFade();

    r.querySelectorAll('[data-pick]').forEach(function (b) {
      b.addEventListener('click', function () { self.pickShow(b.getAttribute('data-pick')); });
    });

    r.querySelectorAll('[data-seat]').forEach(function (b) {
      b.addEventListener('click', function () { self.toggleSeat(b.getAttribute('data-seat')); });
    });

    r.querySelectorAll('[data-back]').forEach(function (b) {
      b.addEventListener('click', function () { self.go(parseInt(b.getAttribute('data-back'), 10)); });
    });

    r.querySelectorAll('[data-next]').forEach(function (b) {
      b.addEventListener('click', function () { self.go(parseInt(b.getAttribute('data-next'), 10)); });
    });

    var reset = r.querySelector('[data-reset]');
    if (reset) reset.addEventListener('click', function () { self.reset(); });

    var print = r.querySelector('[data-print]');
    if (print) print.addEventListener('click', function () { window.print(); });

    var form = r.querySelector('#bkForm');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var data = {
          name: form.name.value.trim(),
          phone: form.phone.value.trim(),
          email: form.email.value.trim(),
          org: form.org.value.trim(),
          note: form.note.value.trim()
        };
        if (!data.name || !data.phone) {
          form.querySelectorAll('input[required]').forEach(function (i) {
            i.classList.toggle('is-error', !i.value.trim());
          });
          return;
        }
        self.form = data;
        self.code = bookingCode();
        self.go(4);
      });
    }
  };

  /* ==========================================================
     API công khai
     ========================================================== */
  global.ScrollLock = ScrollLock;

  global.Booking = {
    shows: SHOWS,
    statusOf: statusOf,
    seatsLeft: seatsLeft,

    // Gắn luồng đặt chỗ vào một phần tử có sẵn (trang dat-cho.html)
    mount: function (el, opts) {
      if (!el) return null;
      return new Booking(el, opts || {});
    },

    // Mở popup đặt chỗ (trang chủ)
    openModal: function (showId) {
      var old = document.querySelector('.bkmodal');
      if (old) old.remove();

      var wrap = document.createElement('div');
      wrap.className = 'bkmodal';
      wrap.innerHTML =
        '<div class="bkmodal__backdrop" data-close="1"></div>' +
        '<div class="bkmodal__dialog" role="dialog" aria-modal="true" aria-label="Đặt chỗ xem chèo">' +
          '<header class="bkmodal__head">' +
            '<div><p class="bkmodal__eyebrow">Giữ chỗ miễn phí</p><h2>Đặt chỗ xem chèo</h2></div>' +
            '<button type="button" class="bkmodal__close" data-close="1" aria-label="Đóng">&times;</button>' +
          '</header>' +
          '<div class="bkmodal__body"></div>' +
        '</div>';
      document.body.appendChild(wrap);
      ScrollLock.on();

      var instance = null;
      var close = function () {
        if (instance) instance.destroy();
        wrap.remove();
        ScrollLock.off();
        document.removeEventListener('keydown', onKey);
      };
      var onKey = function (e) { if (e.key === 'Escape') close(); };

      wrap.querySelectorAll('[data-close]').forEach(function (b) {
        b.addEventListener('click', close);
      });
      document.addEventListener('keydown', onKey);

      instance = new Booking(wrap.querySelector('.bkmodal__body'), {
        showId: showId, embedded: true, onClose: close
      });
      return close;
    }
  };
})(window);
