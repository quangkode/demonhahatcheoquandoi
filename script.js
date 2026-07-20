/* Nhà hát Chèo Quân đội — tương tác trang chủ */
(function () {
  'use strict';

  /* ---------- Menu mobile ---------- */
  var navToggle = document.getElementById('navToggle');
  var nav = document.getElementById('nav');

  navToggle.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });

  nav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A' && nav.classList.contains('is-open')) {
      nav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });

  /* ---------- Header đổ bóng khi cuộn ---------- */
  var header = document.getElementById('header');
  var toTop = document.getElementById('toTop');

  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle('is-stuck', y > 12);
    toTop.classList.toggle('is-visible', y > 500);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

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
      if (e.key === 'ArrowRight') go(current + 1);
      if (e.key === 'ArrowLeft') go(current - 1);
    });

    var hero = document.getElementById('hero');
    hero.addEventListener('mouseenter', function () { clearInterval(timer); });
    hero.addEventListener('mouseleave', restart);
    restart();
  }

  /* ---------- Mở popup đặt chỗ từ lịch biểu diễn ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-book]'), function (btn) {
    btn.addEventListener('click', function () {
      if (window.Booking) window.Booking.openModal(btn.getAttribute('data-book'));
      else window.location.href = './dat-cho.html?suat=' + btn.getAttribute('data-book');
    });
  });

  /* ---------- Mục lục dính: tô sáng mục đang xem ---------- */
  var subnav = document.getElementById('subnav');
  if (subnav) {
    var subLinks = Array.prototype.slice.call(subnav.querySelectorAll('a'));
    var sections = subLinks
      .map(function (a) { return document.querySelector(a.getAttribute('href')); })
      .filter(Boolean);

    var syncSubnav = function () {
      var offset = subnav.getBoundingClientRect().bottom + 20;
      var activeIndex = 0;
      sections.forEach(function (sec, i) {
        if (sec.getBoundingClientRect().top <= offset) activeIndex = i;
      });
      subLinks.forEach(function (a, i) { a.classList.toggle('is-active', i === activeIndex); });
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
