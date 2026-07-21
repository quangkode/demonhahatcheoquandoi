/* Nhà hát Chèo Quân đội — tương tác trang chủ */
(function () {
  'use strict';

  var navToggle = document.getElementById('navToggle');
  var nav = document.getElementById('nav');
  var header = document.getElementById('header');
  var toTop = document.getElementById('toTop');

  var DESKTOP_NAV = 861;   // khớp với breakpoint 860px trong styles.css

  /* ---------- Khoá cuộn nền ----------
     Dùng chung cho menu mobile, popup đặt chỗ và chế độ toàn màn hình của khung
     360. Có bộ đếm để khi hai lớp chồng nhau thì lớp đóng trước không mở khoá sớm.
     Cố ý KHÔNG dùng mẹo "position:fixed cho body": cách đó chặn cuộn triệt để hơn
     nhưng lại đẩy header dính ra khỏi màn hình, mà nút đóng menu nằm ngay trên
     header. Thay vào đó dùng overflow:hidden kèm overscroll-behavior:contain
     trên chính lớp phủ (xem .nav và .bkmodal__body trong styles.css).            */
  var lockDepth = 0;
  var lock = {
    on: function () {
      if (lockDepth++ === 0) document.body.classList.add('is-locked');
    },
    off: function () {
      if (lockDepth > 0 && --lockDepth === 0) document.body.classList.remove('is-locked');
    }
  };
  window.ScrollLock = lock;

  /* ---------- Neo menu mobile vào đáy header thật ----------
     Header dính ở top:0 còn thanh trên cùng thì cuộn mất, nên khoảng cách từ mép
     màn hình tới đáy header thay đổi theo vị trí cuộn — trước đây giá trị này bị
     ghi cứng 120px nên menu lúc hở một khoảng, lúc đè lên header.

     Thêm một điểm dễ sập bẫy: .header có backdrop-filter, mà backdrop-filter thì
     biến phần tử thành KHỐI CHỨA của mọi con position:fixed. Nghĩa là top của
     panel được tính từ mép trên header chứ không phải từ mép trên khung nhìn —
     và điều này lại không đúng ở trình duyệt nào không dựng backdrop-filter.
     Nên ở đây đo thẳng gốc toạ độ thực tế thay vì phỏng đoán.                    */
  function syncNavTop() {
    // ở bố cục desktop .nav nằm trong dòng header, đo lúc đó là vô nghĩa
    if (window.innerWidth >= DESKTOP_NAV) return;
    var root = document.documentElement;
    root.style.setProperty('--nav-top', '0px');
    var origin = nav.getBoundingClientRect().top;         // gốc của khối chứa
    var target = header.getBoundingClientRect().bottom;   // chỗ cần neo tới
    root.style.setProperty('--nav-top', Math.round(target - origin) + 'px');
    // chiều cao cũng phải tự tính vì bottom:0 sẽ bám đáy header chứ không phải
    // đáy màn hình; innerHeight bám theo thanh địa chỉ co giãn trên di động
    root.style.setProperty('--nav-h', Math.round(window.innerHeight - target) + 'px');
  }

  /* ---------- Menu mobile ---------- */
  function setNav(open) {
    nav.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
    if (open) { syncNavTop(); lock.on(); } else { lock.off(); }
  }

  navToggle.addEventListener('click', function () {
    setNav(!nav.classList.contains('is-open'));
  });

  nav.addEventListener('click', function (e) {
    if (e.target.closest('a') && nav.classList.contains('is-open')) setNav(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      setNav(false);
      navToggle.focus();
    }
  });

  /* ---------- Header đổ bóng khi cuộn ---------- */
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle('is-stuck', y > 12);
    toTop.classList.toggle('is-visible', y > 500);
    // cố ý KHÔNG gọi syncNavTop ở đây: phép đo bắt trình duyệt dựng lại bố cục,
    // mà lúc menu mở thì nền đã bị khoá cuộn nên header cũng không xê dịch
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Đổi cỡ / xoay máy ---------- */
  function onViewportChange() {
    // xoay ngang giữa lúc menu đang mở: quay về bố cục desktop thì phải nhả khoá cuộn
    if (window.innerWidth >= DESKTOP_NAV && nav.classList.contains('is-open')) setNav(false);
    syncNavTop();
  }

  window.addEventListener('resize', onViewportChange, { passive: true });
  // orientationchange bắn trước khi trình duyệt cập nhật kích thước → đợi một nhịp
  window.addEventListener('orientationchange', function () {
    setTimeout(onViewportChange, 120);
  });

  toTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ---------- Slider hero (chỉ có ở trang chủ) ---------- */
  var slides = Array.prototype.slice.call(document.querySelectorAll('.hero__slide'));
  var dotsWrap = document.getElementById('heroDots');

  if (slides.length && dotsWrap) {
    var current = 0;
    var timer = null;
    var DELAY = 6000;

    var dots = slides.map(function (_, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Slide ' + (i + 1));
      if (i === 0) b.classList.add('is-active');
      b.addEventListener('click', function () { go(i); });
      dotsWrap.appendChild(b);
      return b;
    });

    var go = function (i) {
      current = (i + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('is-active', k === current); });
      dots.forEach(function (d, k) { d.classList.toggle('is-active', k === current); });
      restart();
    };

    var restart = function () {
      clearInterval(timer);
      timer = setInterval(function () { go(current + 1); }, DELAY);
    };

    document.querySelector('.hero__nav--next').addEventListener('click', function () { go(current + 1); });
    document.querySelector('.hero__nav--prev').addEventListener('click', function () { go(current - 1); });

    document.addEventListener('keydown', function (e) {
      // đang gõ trong ô nhập hoặc đang mở popup thì phím mũi tên không thuộc về slider
      var t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      if (document.querySelector('.bkmodal')) return;
      if (e.key === 'ArrowRight') go(current + 1);
      if (e.key === 'ArrowLeft') go(current - 1);
    });

    var hero = document.getElementById('hero');
    hero.addEventListener('mouseenter', function () { clearInterval(timer); });
    hero.addEventListener('mouseleave', restart);

    /* ---------- Vuốt ngang để chuyển slide ----------
       Trên điện thoại/tablet không có nút ‹ › (đã ẩn ở breakpoint 860px)
       nên vuốt là cách chuyển slide duy nhất.                              */
    var startX = 0, startY = 0, tracking = false;

    hero.addEventListener('touchstart', function (e) {
      var t = e.changedTouches[0];
      startX = t.clientX; startY = t.clientY; tracking = true;
      clearInterval(timer);           // đang chạm thì ngừng tự chuyển
    }, { passive: true });

    hero.addEventListener('touchend', function (e) {
      if (!tracking) return;
      tracking = false;
      var t = e.changedTouches[0];
      var dx = t.clientX - startX;
      var dy = t.clientY - startY;
      // chỉ nhận là vuốt ngang khi lệch ngang rõ hơn hẳn lệch dọc,
      // nếu không sẽ cướp mất thao tác cuộn trang của người dùng
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? current + 1 : current - 1);
      else restart();
    }, { passive: true });

    hero.addEventListener('touchcancel', function () { tracking = false; restart(); }, { passive: true });

    /* chuyển tab hoặc tắt màn hình thì dừng hẳn cho đỡ tốn pin */
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) clearInterval(timer);
      else restart();
    });

    restart();
  }

  /* ---------- Mở popup đặt chỗ từ lịch biểu diễn ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-book]'), function (btn) {
    btn.addEventListener('click', function () {
      if (window.Booking) window.Booking.openModal(btn.getAttribute('data-book'));
      else window.location.href = './dat-cho.html?suat=' + btn.getAttribute('data-book');
    });
  });

  /* ---------- Mục lục dính: nút hamburger + tô sáng mục đang xem ---------- */
  var subnav = document.getElementById('subnav');
  if (subnav) {
    var subToggle = document.getElementById('subnavToggle');
    var subMenu = document.getElementById('subnavMenu');
    var subCurrent = document.getElementById('subnavCurrent');
    var subLinks = Array.prototype.slice.call(subMenu.querySelectorAll('a'));
    var sections = subLinks
      .map(function (a) { return document.querySelector(a.getAttribute('href')); })
      .filter(Boolean);

    var isSubOpen = function () { return subToggle.getAttribute('aria-expanded') === 'true'; };

    var setSubnav = function (open) {
      if (open) {
        // Giới hạn chiều cao theo khoảng trống thật còn lại bên dưới thanh mục lục.
        // Thanh này dính, nhưng khi trang chưa cuộn tới thì nó vẫn nằm giữa màn hình,
        // lúc đó bảng xổ ra sẽ thò xuống dưới mép dưới nếu cứ để chiều cao cố định.
        //
        // Riêng lúc trang còn ở đầu, khoảng trống bên dưới có khi chỉ còn vài chục
        // điểm ảnh (điện thoại xoay ngang là rõ nhất) — ít hơn cả mức tối thiểu 180px,
        // nên bảng thò hẳn xuống dưới mép màn hình. Cuộn cho thanh về đúng chỗ dính
        // của nó trước rồi mới đo, khi đó lúc nào cũng có đủ chỗ.
        var rect = subnav.getBoundingClientRect();
        var stickTop = header ? header.getBoundingClientRect().bottom : 0;
        if (window.innerHeight - rect.bottom - 12 < 180 && rect.top > stickTop + 1) {
          var prevBehavior = document.documentElement.style.scrollBehavior;
          document.documentElement.style.scrollBehavior = 'auto';
          window.scrollBy(0, rect.top - stickTop);
          document.documentElement.style.scrollBehavior = prevBehavior;
        }
        var space = window.innerHeight - subnav.getBoundingClientRect().bottom - 12;
        subMenu.style.maxHeight = Math.max(180, space) + 'px';
      }
      subMenu.classList.toggle('is-open', open);
      subToggle.setAttribute('aria-expanded', String(open));
    };

    subToggle.addEventListener('click', function (e) {
      // chặn nổi bọt để chính cú bấm này không rơi vào handler "bấm ra ngoài" bên dưới
      e.stopPropagation();
      setSubnav(!isSubOpen());
    });

    subMenu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setSubnav(false);
    });

    document.addEventListener('click', function (e) {
      if (isSubOpen() && !subnav.contains(e.target)) setSubnav(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isSubOpen()) {
        setSubnav(false);
        subToggle.focus();
      }
    });

    var syncSubnav = function () {
      // Ngưỡng cũ (đáy thanh + 20px) đòi mép trên của mục phải gần chạm thanh
      // mới tính là "đang xem", nên tên mục trên nút hay chạy sau mắt người đọc
      // gần một màn hình. Lấy thêm khoảng 28% chiều cao khung nhìn cho khớp hơn.
      var offset = subnav.getBoundingClientRect().bottom + Math.min(240, window.innerHeight * 0.28);
      var activeIndex = 0;
      sections.forEach(function (sec, i) {
        if (sec.getBoundingClientRect().top <= offset) activeIndex = i;
      });
      subLinks.forEach(function (a, i) { a.classList.toggle('is-active', i === activeIndex); });
      // mục lục đã thu gọn nên tên mục đang xem hiện ngay trên nút bấm
      if (subCurrent) subCurrent.textContent = subLinks[activeIndex].textContent;
    };

    window.addEventListener('scroll', syncSubnav, { passive: true });
    syncSubnav();
  }

  /* ---------- Hiệu ứng xuất hiện khi cuộn ---------- */
  var targets = document.querySelectorAll(
    '.sched, .artist, .news__lead, .news__item, .about__media, .about__text, .quickinfo__item,' +
    '.mission, .value, .capa, .award, .tl, .factbox, .honorbox, .decree'
  );
  Array.prototype.forEach.call(targets, function (el) { el.classList.add('reveal'); });

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        setTimeout(function () { el.classList.add('is-in'); }, i * 70);
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    Array.prototype.forEach.call(targets, function (el) { io.observe(el); });
  } else {
    Array.prototype.forEach.call(targets, function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Đếm số liệu ---------- */
  var counters = document.querySelectorAll('[data-count]');

  function runCounter(el) {
    var end = parseInt(el.getAttribute('data-count'), 10);
    var dur = 1400;
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(end * eased).toLocaleString('vi-VN');
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if ('IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        runCounter(entry.target);
        co.unobserve(entry.target);
      });
    }, { threshold: 0.5 });
    Array.prototype.forEach.call(counters, function (el) { co.observe(el); });
  } else {
    Array.prototype.forEach.call(counters, runCounter);
  }

  /* ---------- Đăng ký nhận bản tin (demo) ---------- */
  var form = document.querySelector('.subscribe');
  if (form) {
    form.addEventListener('submit', function () {
      var input = form.querySelector('input');
      if (!input.value) return;
      alert('Cảm ơn bạn! Chúng tôi sẽ gửi bản tin tới ' + input.value);
      input.value = '';
    });
  }
})();
