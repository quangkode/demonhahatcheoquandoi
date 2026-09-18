/* ==========================================================
   Nhà hát Chèo Quân đội — đưa nội dung CMS ra trang công khai

   Từ trước tới nay kho.js mới nối MỘT CHIỀU: khách giữ chỗ thì đơn bay
   về Firestore cho Nhà hát. Chiều ngược lại chưa ai gọi, nên sửa lịch
   diễn hay tin tức trong CMS xong mở web vẫn thấy nội dung cũ. Tệp này
   nối nốt chiều đó cho hai mục đổi thường xuyên nhất.

   CỐ Ý CHỈ NỐI LỊCH DIỄN VÀ TIN TỨC. Vở diễn, nghệ sĩ, lãnh đạo, lịch
   sử gần như không đổi; để HTML viết sẵn thì trang hiện ngay khi tải và
   Google đọc được, còn đọc qua Firestore thì nội dung về sau khi trang
   đã vẽ xong — máy tìm kiếm không thấy gì, người dùng thấy khoảng trống
   nhấp nháy. Đánh đổi đó chỉ đáng với nội dung thay đổi hằng tuần.

   LỊCH DIỄN theo NGUYÊN TẮC HỎNG THÌ GIỮ NGUYÊN: khối đó vẫn có sẵn HTML
   viết tay, chỉ khi Firestore trả về danh sách KHÔNG RỖNG mới thay đi. Mất
   mạng, sai luật, Firestore rỗng — trang vẫn y như trước.

   TIN TỨC thì KHÔNG còn bản viết tay nào nữa. Trước đây trang chủ và trang
   Tin tức đều chép cứng sáu bài, mỗi bài bấm vào là nhảy thẳng sang báo
   gốc; sửa trong CMS chẳng ăn thua vì trang Tin tức còn không đọc CMS.
   Nay cả hai trang đều để trống rồi đổ từ CMS xuống, nên hỏng mạng là mất
   khối tin — đổi lại thêm tin bên CMS là hiện ngay ở cả hai chỗ, và không
   bài nào hất người đọc sang trang khác nữa.
   ========================================================== */
(function (global) {
  'use strict';

  var doc = global.document;
  if (!doc || !global.Kho) return;

  var THU = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  var CHU_DE = { 'hoat-dong': 'Hoạt động', 'su-kien': 'Sự kiện' };
  var SO_SUAT_TRANG_CHU = 4;
  var SO_TIN_TRANG_CHU = 4;

  function hai(n) { return (n < 10 ? '0' : '') + n; }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* Ngày từ Firestore về có khi là chuỗi "2026-08-08", có khi là mốc thời
     gian đầy đủ. Cắt lấy mười ký tự đầu rồi dựng lúc 00:00 giờ máy: nếu để
     new Date("2026-08-08") thì trình duyệt hiểu là 00:00 giờ UTC, ai ở múi
     giờ Việt Nam mở trang sẽ thấy lùi mất một ngày. */
  function ngayCua(v) {
    if (!v) return null;
    if (typeof v.getTime === 'function') return isNaN(v.getTime()) ? null : v;
    var d = new Date(String(v).slice(0, 10) + 'T00:00:00');
    return isNaN(d.getTime()) ? null : d;
  }

  /* Dữ liệu gốc từng bị nạp vào Firestore hai lần nên còn bản đúp. Lọc ở
     đây để trang công khai không hiện đôi — nhưng ĐÂY CHỈ LÀ TẤM CHẮN.
     Chỗ sửa thật là bấm "Xoá sạch rồi nạp lại" trong CMS. */
  function boTrung(ds, khoa) {
    var da = {};
    return ds.filter(function (x) {
      var k = khoa(x);
      if (da[k]) return false;
      da[k] = true;
      return true;
    });
  }

  function thay(el, html) {
    if (el) el.innerHTML = html;
  }

  /* ----------------------------------------------------------
     LỊCH DIỄN
     ---------------------------------------------------------- */

  /* Đổi bản ghi CMS sang đúng bộ trường mà booking.js đang dùng. Giữ maCu
     làm id khi có: booking.js sinh sơ đồ ghế cố định theo id, mà đơn đặt
     chỗ cũ cũng lưu đúng mã đó — đổi id là hai bên lệch nhau. */
  function suatTuCms(r) {
    var d = ngayCua(r.ngay);
    if (!d) return null;
    var tong = Number(r.tongGhe) || 0;
    var daDat = Number(r.daDat) || 0;
    return {
      id: r.maCu || r.id,
      ngayThat: d,
      day: hai(d.getDate()),
      month: 'Tháng ' + (d.getMonth() + 1),
      year: String(d.getFullYear()),
      weekday: THU[d.getDay()],
      time: r.gio || '20:00',
      title: r.tenVo || '',
      genre: r.theLoai || '',
      venue: r.diaDiem || '',
      address: r.diaChi || '',
      duration: r.thoiLuong || '',
      // Không có trường "đã nhận bao nhiêu chỗ" thì coi như còn trống hết.
      // Số đơn thật nằm ở bảng dat-cho, mà luật chỉ cho quản trị đọc bảng
      // đó — trang công khai không được phép biết, và như vậy là đúng.
      fill: tong > 0 ? Math.max(0, Math.min(1, daDat / tong)) : 0
    };
  }

  function veLichDien(ds) {
    var khung = doc.querySelector('.schedule');
    if (!khung) return;

    if (!ds.length) {
      thay(khung, '<p class="notebox">Nhà hát đang xếp lịch cho những suất diễn tới. '
        + 'Mời quý khán giả theo dõi trang này hoặc liên hệ trực tiếp để biết sớm nhất.</p>');
      return;
    }

    var trangThai = (global.Booking && global.Booking.statusOf) || function () {
      return { label: 'Còn chỗ', cls: 'tag--green', key: 'open' };
    };

    thay(khung, ds.map(function (s) {
      var t = trangThai(s);
      var meta = [s.time, s.venue, s.genre].filter(Boolean).join(' · ');
      var nut = t.key === 'full'
        ? '<button type="button" class="btn btn--sm btn--muted" disabled>Đã kín chỗ</button>'
        : '<button type="button" class="btn btn--sm" data-book="' + esc(s.id) + '">Đặt chỗ</button>';
      return '<article class="sched">'
        + '<div class="sched__date"><strong>' + esc(s.day) + '</strong>'
        + '<span>TH.' + (s.ngayThat.getMonth() + 1) + '</span></div>'
        + '<div class="sched__body"><h3>' + esc(s.title) + '</h3>'
        + '<p class="sched__meta">' + esc(meta) + '</p></div>'
        + '<div class="sched__act"><span class="tag ' + t.cls + '">' + esc(t.label) + '</span>'
        + nut + '</div>'
        + '</article>';
    }).join(''));
  }

  function napLich() {
    return global.Kho.danhSachHien('lich-dien').then(function (ds) {
      var suat = boTrung(ds, function (r) {
        return (r.tenVo || '') + '|' + String(r.ngay).slice(0, 10) + '|' + (r.gio || '');
      }).map(suatTuCms).filter(Boolean);

      // Suất đã diễn thì không xếp lịch lẫn nhận đặt chỗ nữa
      var homNay = new Date();
      homNay.setHours(0, 0, 0, 0);
      suat = suat.filter(function (s) { return s.ngayThat >= homNay; });
      suat.sort(function (a, b) { return a.ngayThat - b.ngayThat; });

      // Thay đúng chỗ trong mảng cũ chứ không gán mảng mới: booking.js giữ
      // tham chiếu tới chính mảng này, gán đè là nó vẫn cầm mảng cũ.
      if (global.Booking && global.Booking.shows && suat.length) {
        var kho = global.Booking.shows;
        kho.length = 0;
        suat.forEach(function (s) { kho.push(s); });
      }

      // Firestore rỗng hoặc lỗi thì giữ nguyên HTML viết sẵn; có dữ liệu
      // thật mới vẽ lại, kể cả khi lọc xong không còn suất nào sắp tới.
      if (ds.length) veLichDien(suat.slice(0, SO_SUAT_TRANG_CHU));
      return suat;
    })['catch'](function (e) {
      if (global.console) global.console.warn('Không đọc được lịch diễn từ CMS:', e);
      return null;
    });
  }

  /* ----------------------------------------------------------
     TIN TỨC
     ---------------------------------------------------------- */

  function ngayVN(d) {
    return hai(d.getDate()) + '/' + hai(d.getMonth() + 1) + '/' + d.getFullYear();
  }

  function anhCua(r) {
    return (r.anh && r.anh.url) ? r.anh.url : '';
  }

  /* Tiêu đề bài LUÔN dẫn về trang của Nhà hát, không bao giờ nhảy thẳng
     sang báo. Bản trước: bài nào chưa có toàn văn thì dẫn thẳng sang bài
     gốc — bấm một cái là rời hẳn khỏi trang Nhà hát sang một trang lạ.
     Nay bài nào cũng mở tại chỗ; bài chưa có toàn văn thì tin-bai.html
     hiện phần tóm tắt. */
  function tieuDeCoLink(r, the) {
    var t = esc(r.tieuDe);
    var trong = r.id
      ? '<a href="./tin-bai.html?id=' + encodeURIComponent(r.id) + '">' + t + '</a>'
      : t;
    return '<' + the + '>' + trong + '</' + the + '>';
  }

  /* Tên báo để nguyên chữ, KHÔNG bọc liên kết: vẫn ghi công đầy đủ mà không
     hất người đọc sang trang khác. */
  function dongNguon(r) {
    return r.nguonTen
      ? '<p class="news__source">Nguồn: ' + esc(r.nguonTen) + '</p>'
      : '';
  }

  function anhCo(r, lop) {
    var a = anhCua(r);
    if (!a) return '';
    return '<div class="' + lop + '"><img src="' + esc(a) + '" alt="' + esc(r.tieuDe || '')
      + '" loading="lazy" />'
      + (r.anhNguon ? '<span class="art__credit">' + esc(r.anhNguon) + '</span>' : '')
      + '</div>';
  }

  function dongNgay(r) {
    var d = ngayCua(r.ngay);
    return '<p class="news__meta">' + (d ? ngayVN(d) : '') + ' · '
      + esc(CHU_DE[r.chuDe] || r.chuDe || '') + '</p>';
  }

  function veTinTrangChu(ds) {
    var khung = doc.querySelector('.news');
    if (!khung) return;
    if (!ds.length) {
      thay(khung, '<p class="news__tai">Chưa có tin nào.</p>');
      return;
    }

    var dau = ds[0];
    var lead = '<article class="news__lead">'
      + anhCo(dau, 'news__img')
      + '<div class="news__body">'
      + dongNgay(dau)
      + tieuDeCoLink(dau, 'h3')
      + '<p>' + esc(dau.tomTat || '') + '</p>'
      + dongNguon(dau)
      + '</div></article>';

    var list = ds.slice(1, SO_TIN_TRANG_CHU).map(function (r) {
      var a = anhCua(r);
      return '<article class="news__item">'
        + '<div class="news__thumb">'
        + (a ? '<img src="' + esc(a) + '" alt="" loading="lazy" />' : '')
        + '</div><div>'
        + dongNgay(r)
        + tieuDeCoLink(r, 'h4')
        + '</div></article>';
    }).join('');

    thay(khung, lead + '<div class="news__list">' + list + '</div>');
  }

  /* ----------------------------------------------------------
     TRANG TIN TỨC

     Bài mới nhất lên ô nổi bật, còn lại xuống lưới. Vẽ xong phải gọi
     LocTin.lamMoi(): bộ lọc chủ đề bên script.js chạy lúc trang vừa tải,
     sớm hơn lúc Firestore trả lời, nên nó cần được bảo là có thẻ mới.
     ---------------------------------------------------------- */

  function theTin(r) {
    return '<article class="newscard" data-cat="' + esc(r.chuDe || '') + '">'
      + anhCo(r, 'newscard__art')
      + '<div class="newscard__body">'
      + dongNgay(r)
      + tieuDeCoLink(r, 'h3')
      + '<p>' + esc(r.tomTat || '') + '</p>'
      + dongNguon(r)
      + '</div></article>';
  }

  function veTinTrangTin(ds) {
    var oNoiBat = doc.getElementById('tinNoiBat');
    var luoi = doc.getElementById('newsGrid');
    if (!oNoiBat || !luoi) return;

    var oTai = doc.getElementById('newsTai');
    if (oTai) oTai.hidden = ds.length > 0;
    if (oTai && !ds.length) oTai.textContent = 'Chưa có tin nào.';
    if (!ds.length) { thay(oNoiBat, ''); thay(luoi, ''); return; }

    var dau = ds[0];
    thay(oNoiBat, '<article class="feature" data-cat="' + esc(dau.chuDe || '') + '">'
      + (anhCua(dau)
          ? '<div class="feature__art"><img src="' + esc(anhCua(dau)) + '" alt="'
            + esc(dau.tieuDe || '') + '" />'
            + '<span class="feature__tag">Tin nổi bật</span>'
            + (dau.anhNguon ? '<span class="art__credit">' + esc(dau.anhNguon) + '</span>' : '')
            + '</div>'
          : '')
      + '<div class="feature__body">'
      + dongNgay(dau)
      + tieuDeCoLink(dau, 'h3')
      + '<p>' + esc(dau.tomTat || '') + '</p>'
      + dongNguon(dau)
      + '</div></article>');

    thay(luoi, ds.slice(1).map(theTin).join(''));
    if (global.LocTin) global.LocTin.lamMoi();
  }

  function baoHongTin(loi) {
    var oTai = doc.getElementById('newsTai');
    if (oTai) { oTai.hidden = false; oTai.textContent = 'Chưa tải được tin tức.'; }
    var khung = doc.querySelector('.news');
    if (khung && !khung.querySelector('.news__lead')) {
      thay(khung, '<p class="news__tai">Chưa tải được tin tức.</p>');
    }
    if (global.console) global.console.warn('Không đọc được tin tức từ CMS:', loi);
  }

  function napTin() {
    return global.Kho.danhSachHien('tin-tuc').then(function (ds) {
      var tin = boTrung(ds, function (r) {
        return (r.tieuDe || '') + '|' + String(r.ngay).slice(0, 10);
      });
      tin.sort(function (a, b) {
        var x = ngayCua(a.ngay), y = ngayCua(b.ngay);
        return (y ? y.getTime() : 0) - (x ? x.getTime() : 0);
      });
      veTinTrangChu(tin);
      veTinTrangTin(tin);
      return tin;
    })['catch'](function (e) {
      baoHongTin(e);
      return null;
    });
  }

  /* ----------------------------------------------------------
     Chạy
     ---------------------------------------------------------- */

  var xongLich = napLich();

  if (doc.querySelector('.news') || doc.getElementById('newsGrid')) napTin();

  global.NoiCms = {
    // dat-cho.html phải chờ cái này rồi mới dựng luồng đặt chỗ, không thì
    // nó dựng bằng danh sách suất viết cứng trong booking.js
    lichSanSang: xongLich,
    napLich: napLich,
    napTin: napTin
  };
})(window);
