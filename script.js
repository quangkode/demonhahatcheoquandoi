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
    '.mission, .value, .capa, .award, .factbox, .honorbox, .decree,' +
    '.milestone, .leader, .work, .archive__item, .martyr, .laurel, .bangvang'
  );
  Array.prototype.forEach.call(targets, function (el) { el.classList.add('reveal'); });

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        setTimeout(function () { el.classList.add('is-in'); }, Math.min(i, 8) * 70);
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
    // hàm ghi đè trọn textContent nên hậu tố (+, %) phải đi kèm ở đây,
    // đặt trong thẻ riêng sẽ bị nhịp đếm ghi đè mất
    var suffix = el.getAttribute('data-suffix') || '';
    var dur = 1400;
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(end * eased).toLocaleString('vi-VN') + suffix;
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

  /* ---------- Trang tin tức: lọc chủ đề + xem thêm ---------- */
  var newsGrid = document.getElementById('newsGrid');
  if (newsGrid) {
    var newsMore = document.getElementById('newsMore');
    var newsEmpty = document.getElementById('newsEmpty');
    var chips = Array.prototype.slice.call(document.querySelectorAll('.chip'));
    var cards = Array.prototype.slice.call(newsGrid.querySelectorAll('.newscard'));
    // bài nổi bật nằm ngoài lưới nhưng vẫn phải theo bộ lọc
    var feature = document.querySelector('.feature');
    var VISIBLE = 4;              // số tin hiện sẵn trước khi bấm "Xem thêm"
    var filter = 'all';
    var expanded = false;

    var renderNews = function () {
      var matches = cards.filter(function (c) {
        return filter === 'all' || c.getAttribute('data-cat') === filter;
      });
      cards.forEach(function (c) {
        var i = matches.indexOf(c);
        c.hidden = i < 0 || (!expanded && i >= VISIBLE);
      });

      var featureShown = false;
      if (feature) {
        featureShown = filter === 'all' || feature.getAttribute('data-cat') === filter;
        feature.hidden = !featureShown;
      }

      // nút chỉ có việc khi còn tin bị giấu; hết việc thì ẩn hẳn cho gọn
      newsMore.hidden = matches.length <= VISIBLE;
      newsMore.textContent = newsMore.getAttribute(expanded ? 'data-less' : 'data-more');
      newsMore.setAttribute('aria-expanded', String(expanded));
      newsEmpty.hidden = matches.length > 0 || featureShown;
    };

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) { c.classList.toggle('is-active', c === chip); });
        filter = chip.getAttribute('data-filter');
        // đổi chủ đề thì thu lại, không thì bấm "Xem thêm" một lần là
        // mọi chủ đề sau đó đều mở sẵn, người dùng không hiểu vì sao
        expanded = false;
        renderNews();
      });
    });

    newsMore.addEventListener('click', function () {
      expanded = !expanded;
      renderNews();
      if (!expanded) newsGrid.scrollIntoView({ block: 'nearest' });
    });

    renderNews();
  }

  /* ---------- Phóng to ảnh tư liệu (trang Lịch sử) ----------
     Ảnh trong lưới bị cắt cover cho khung đều nhau, nên bài báo hay quyết định
     scan sẽ không đọc được ở cỡ thumbnail — bấm vào mở bản đầy đủ contain.

     Gắn theo uỷ nhiệm trên document: ô tư liệu có thể được thêm sau, không cần
     gắn lại listener. Dùng chung ScrollLock có bộ đếm ở đầu file để nếu lớp này
     chồng lên popup khác thì lớp đóng trước không mở khoá cuộn sớm.             */
  var lbBox = null, lbOpener = null;

  function closeLightbox() {
    if (!lbBox) return;
    var box = lbBox;
    lbBox = null;
    box.classList.remove('is-open');
    lock.off();
    // đợi hết transition mờ dần rồi mới gỡ, không thì biến mất cụt ngủn
    setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 260);
    if (lbOpener) { lbOpener.focus(); lbOpener = null; }
  }

  function openLightbox(btn) {
    var img = btn.querySelector('img');
    if (!img) return;
    closeLightbox();
    lbOpener = btn;

    // Thư viện ảnh không còn chú thích đè trên ảnh nên chữ nằm ở data-cap;
    // ô tư liệu vẫn viết chú thích bằng <figcaption> nên giữ đường lùi về đó.
    var fig = btn.closest('figure');
    var figCap = fig && fig.querySelector('figcaption');
    var capText = btn.getAttribute('data-cap') || (figCap ? figCap.textContent.trim() : '');
    var creditText = btn.getAttribute('data-credit') || '';

    var box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    if (capText) box.setAttribute('aria-label', capText);

    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'lightbox__close';
    close.setAttribute('aria-label', 'Đóng');
    close.innerHTML = '&times;';

    var wrap = document.createElement('div');
    var big = document.createElement('img');
    // dùng lại đúng src đã tải nên mở ra là thấy ngay, không chờ tải lần hai
    big.src = img.currentSrc || img.src;
    big.alt = img.alt || capText;
    wrap.appendChild(big);
    if (capText) {
      var p = document.createElement('p');
      p.className = 'lightbox__cap';
      p.textContent = capText;
      wrap.appendChild(p);
    }
    // ảnh lấy từ báo nên nguồn phải đi kèm; bỏ khỏi lưới cho sạch thì
    // chỗ duy nhất còn lại để ghi công là đây
    if (creditText) {
      var cr = document.createElement('p');
      cr.className = 'lightbox__credit';
      cr.textContent = creditText;
      wrap.appendChild(cr);
    }

    box.appendChild(close);
    box.appendChild(wrap);
    document.body.appendChild(box);
    lbBox = box;
    lock.on();
    // ép trình duyệt tính layout một nhịp, không thì thêm .is-open cùng khung
    // hình với lúc chèn, transition không chạy mà nhảy thẳng sang trạng thái cuối
    void box.offsetWidth;
    box.classList.add('is-open');
    close.focus();

    close.addEventListener('click', closeLightbox);
    // chỉ đóng khi bấm vào nền, bấm trúng ảnh thì giữ nguyên
    box.addEventListener('click', function (e) {
      if (e.target === box || e.target === wrap) closeLightbox();
    });
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.archive__zoom, .shot__zoom');
    if (btn) openLightbox(btn);
  });

  document.addEventListener('keydown', function (e) {
    if (lbBox && (e.key === 'Escape' || e.key === 'Esc')) closeLightbox();
  });
  /* ---------- Trang lịch sử: trục thời gian kéo-thả có trễ ----------
     Dựng theo đúng cách slider của akkersvanmargraten.nl chạy, nhưng viết
     bằng rAF và pointer event thuần thay cho GSAP + Hammer.js.

     Lõi của cảm giác "buông tay rồi nó còn trôi tiếp" nằm ở hai chỗ, KHÔNG
     phải ở một công thức ma sát nào:
       1. Trong lúc kéo, quãng dịch nhân TOC = 1.5 — tay đi 100px thì đích
          dịch 150px, nên vuốt mạnh là đích đã văng qua thẻ kế từ trước.
       2. Vị trí VẼ RA chỉ đuổi theo đích mỗi khung hình một phần EASE = 0.1,
          nên lúc buông tay nó còn tụt lại phía sau cả trăm pixel và phải bò
          tiếp mới bắt kịp. Chính khoảng tụt đó là quán tính.
     Bắt mốc khi buông cũng tính theo ĐÍCH chứ không theo chỗ đang vẽ, nếu
     không thì vuốt mạnh mấy cũng chỉ nhích đúng một thẻ.

     Ray mặc định vẫn là vùng cuộn ngang thật. Chỉ khi dựng xong mới gắn
     .keo-duoc để chuyển sang transform — script hỏng thì trang tự về cuộn
     thật, không mất chữ nào. */
  var ray = document.getElementById('dttgRay');
  if (ray) {
    var khungTruc = document.getElementById('dttg');
    var trong = document.getElementById('dttgTrong');
    var chuongs = Array.prototype.slice.call(ray.querySelectorAll('.chuong'));
    var namRay = document.getElementById('dttgNam');
    var namBtn = Array.prototype.slice.call(namRay.querySelectorAll('.nam'));
    var dayTien = document.getElementById('dttgDay');
    var soHien = document.getElementById('dttgSo');
    var nutTruoc = document.getElementById('dttgTruoc');
    var nutSau = document.getElementById('dttgSau');
    var con = document.getElementById('dttgCon');
    var diuDi = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var EASE = 0.1;      // mỗi khung hình đuổi 10% quãng còn lại
    var TOC = 1.5;       // hệ số khuếch đại quãng kéo
    var LO = 200;        // kéo lố quá hai đầu 200px rồi bật về
    var TOC_CON = 0.2;   // độ trễ của vòng tròn thay con trỏ
    var THEM = 8;        // chưa đi quá 8px thì vẫn là bôi đen chữ, chưa phải kéo

    var buoc = 0, min = 0, max = 0;
    var dich = 0, hienTai = 0, mocHien = -1;
    var sanKeo = false, dangKeo = false, batX = 0, batY = 0, goc = 0;
    var chuotX = 0, chuotY = 0, conX = 0, conY = 0, tiLe = 1, conHien = false;
    var dangChay = false;
    var tamBong = [];   // tâm mỗi thẻ, đo sẵn
    var rongRay = 0;    // bề ngang khung nhìn, đo sẵn

    khungTruc.classList.add('san-sang');
    khungTruc.classList.add('keo-duoc');

    function doLai() {
      var moc = mocHien < 0 ? 0 : mocHien;
      buoc = chuongs.length > 1
        ? (chuongs[1].offsetLeft - chuongs[0].offsetLeft)
        : ray.clientWidth;
      min = 0;
      max = -(buoc * (chuongs.length - 1));
      /* Đo sẵn tâm từng thẻ ở đây. capNhat() chạy mỗi khung hình, mà nó vừa
         ghi transform xong lại đọc offsetLeft thì ép trình duyệt tính lại bố
         cục ngay giữa khung — 60 lần một giây, máy yếu là thấy giật. Mấy số
         này chỉ đổi khi đổi bề ngang cửa sổ, mà resize đã gọi doLai rồi. */
      rongRay = ray.clientWidth;
      tamBong = chuongs.map(function (c) {
        return { el: c.querySelector('.chuong__bong'), tam: c.offsetLeft + c.offsetWidth / 2 };
      });
      dich = -moc * buoc;
      hienTai = dich;
      mocHien = -1;
      trong.style.transform = 'translate3d(' + hienTai + 'px,0,0)';
      capNhat();
    }

    function viTri() {
      if (buoc <= 0) return 0;
      return Math.max(0, Math.min(chuongs.length - 1, -hienTai / buoc));
    }

    function capNhat() {
      var vt = viTri();

      // con số năm chìm trôi chậm hơn thẻ, tạo chiều sâu khi kéo
      if (!diuDi && rongRay > 0) {
        var giua = -hienTai + rongRay / 2;
        for (var k = 0; k < tamBong.length; k++) {
          if (!tamBong[k].el) continue;
          var lech = (tamBong[k].tam - giua) / rongRay;
          tamBong[k].el.style.transform = 'translate3d(' + (lech * -78).toFixed(1) + 'px,0,0)';
        }
      }

      dayTien.style.transform = 'translateX(' + (vt * 100) + '%)';

      var i = Math.round(vt);
      if (i === mocHien) return;
      mocHien = i;

      for (var t = 0; t < chuongs.length; t++) chuongs[t].classList.toggle('hoat', t === i);
      for (var u = 0; u < namBtn.length; u++) {
        namBtn[u].classList.toggle('hoat', u === i);
        if (u === i) namBtn[u].setAttribute('aria-current', 'true');
        else namBtn[u].removeAttribute('aria-current');
      }
      soHien.textContent = i + 1;
      nutTruoc.disabled = i === 0;
      nutSau.disabled = i === chuongs.length - 1;

      if (namRay.scrollWidth > namRay.clientWidth + 4) {
        var b = namBtn[i];
        namRay.scrollTo({
          left: Math.max(0, b.offsetLeft - (namRay.clientWidth - b.offsetWidth) / 2),
          behavior: diuDi ? 'auto' : 'smooth'
        });
      }
    }

    function khung() {
      var xong = true;

      if (diuDi) {
        hienTai = dich;
      } else {
        hienTai = hienTai + (dich - hienTai) * EASE;
        if (Math.abs(dich - hienTai) < 0.08) hienTai = dich;
        else xong = false;
      }
      // làm tròn hai số lẻ: dưới ngưỡng đó chỉ là rung pixel, vẽ lại vô ích
      hienTai = Math.round(hienTai * 100) / 100;
      trong.style.transform = 'translate3d(' + hienTai + 'px,0,0)';
      capNhat();

      if (con && conHien) {
        var nhanh = dangKeo ? 1 : TOC_CON;   // đang kéo thì vòng tròn dính sát tay
        conX += (chuotX - conX) * nhanh;
        conY += (chuotY - conY) * nhanh;
        var dichTiLe = dangKeo ? 0.2 : 1;
        tiLe += (dichTiLe - tiLe) * 0.18;
        con.style.transform = 'translate3d(' + (conX - 24).toFixed(1) + 'px,'
          + (conY - 24).toFixed(1) + 'px,0) scale(' + tiLe.toFixed(3) + ')';
        if (Math.abs(chuotX - conX) > 0.4 || Math.abs(chuotY - conY) > 0.4
          || Math.abs(dichTiLe - tiLe) > 0.004) xong = false;
      }

      if (xong && !dangKeo) { dangChay = false; return; }
      requestAnimationFrame(khung);
    }

    function chay() {
      if (dangChay) return;
      dangChay = true;
      requestAnimationFrame(khung);
    }

    function toiChuong(i) {
      i = Math.max(0, Math.min(chuongs.length - 1, i));
      dich = -i * buoc;
      chay();
    }

    /* Bắt mốc gần nhất tính theo ĐÍCH, không theo chỗ đang vẽ — đích đã nhân
       TOC nên một cú vuốt mạnh tự sang thẻ kế mà không cần đo vận tốc. */
    function bat() {
      toiChuong(buoc > 0 ? Math.round(-dich / buoc) : 0);
    }

    ray.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      sanKeo = true;
      dangKeo = false;
      batX = e.clientX;
      batY = e.clientY;
      goc = dich;
      chay();
    });

    ray.addEventListener('pointermove', function (e) {
      var r = khungTruc.getBoundingClientRect();
      chuotX = e.clientX - r.left;
      chuotY = e.clientY - r.top;

      if (con && !conHien && e.pointerType === 'mouse' && !diuDi) {
        conHien = true;
        conX = chuotX; conY = chuotY;
        con.classList.add('hien');
        khungTruc.classList.add('con-hien');
      }

      if (sanKeo && !dangKeo) {
        var dx = e.clientX - batX, dy = e.clientY - batY;
        // chỉ tính là kéo khi đã đi quá ngưỡng VÀ đi ngang nhiều hơn đi dọc:
        // dưới ngưỡng thì để người đọc bôi đen chữ như bình thường
        if (Math.abs(dx) > THEM && Math.abs(dx) > Math.abs(dy)) {
          dangKeo = true;
          khungTruc.classList.add('dang-keo');
          if (window.getSelection) {
            var ch = window.getSelection();
            if (ch && ch.removeAllRanges) ch.removeAllRanges();
          }
          if (ray.setPointerCapture) {
            try { ray.setPointerCapture(e.pointerId); } catch (loi) {}
          }
        }
      }

      if (dangKeo) {
        dich = goc + (e.clientX - batX) * TOC;
        dich = Math.max(Math.min(dich, min + LO), max - LO);
      }
      chay();
    });

    function tha() {
      if (!sanKeo) return;
      sanKeo = false;
      if (dangKeo) {
        dangKeo = false;
        khungTruc.classList.remove('dang-keo');
        bat();
      }
      chay();
    }

    ray.addEventListener('pointerup', tha);
    ray.addEventListener('pointercancel', tha);
    ray.addEventListener('pointerleave', function () {
      tha();
      if (con && conHien) {
        conHien = false;
        con.classList.remove('hien');
        khungTruc.classList.remove('con-hien');
      }
    });
    // kéo rồi thả trúng chữ thì trình duyệt vẫn coi là một cú click, chặn đi
    ray.addEventListener('click', function (e) {
      if (khungTruc.classList.contains('dang-keo')) e.preventDefault();
    });
    ray.addEventListener('dragstart', function (e) { e.preventDefault(); });

    nutTruoc.addEventListener('click', function () { toiChuong(Math.round(viTri()) - 1); });
    nutSau.addEventListener('click', function () { toiChuong(Math.round(viTri()) + 1); });

    namBtn.forEach(function (btn) {
      btn.addEventListener('click', function () {
        toiChuong(parseInt(btn.getAttribute('data-di'), 10) || 0);
      });
    });

    ray.addEventListener('keydown', function (e) {
      var i = Math.round(viTri());
      if (e.key === 'ArrowRight') { e.preventDefault(); toiChuong(i + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); toiChuong(i - 1); }
      else if (e.key === 'Home') { e.preventDefault(); toiChuong(0); }
      else if (e.key === 'End') { e.preventDefault(); toiChuong(chuongs.length - 1); }
    });

    window.addEventListener('resize', doLai);
    doLai();
  }

})();
