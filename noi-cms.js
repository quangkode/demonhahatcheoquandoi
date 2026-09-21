/* ==========================================================
   Nhà hát Chèo Quân đội — đưa nội dung CMS ra trang công khai

   Từ trước tới nay kho.js mới nối MỘT CHIỀU: khách giữ chỗ thì đơn bay
   về Firestore cho Nhà hát. Chiều ngược lại chưa ai gọi, nên sửa lịch
   diễn hay tin tức trong CMS xong mở web vẫn thấy nội dung cũ. Tệp này
   nối nốt chiều đó cho hai mục đổi thường xuyên nhất.

   NAY NỐI ĐỦ CẢ SÁU MỤC. Trước đây chỉ có Lịch diễn và Tin tức; bốn mục
   còn lại — Vở diễn, Nghệ sĩ, Lãnh đạo, Thư viện ảnh — nằm trong CMS mà
   không trang nào đọc tới, nên sửa trong CMS xong mở web vẫn thấy y
   nguyên. Đó chính là chuyện "CMS với web không khớp nhau".

   NGUYÊN TẮC HỎNG THÌ GIỮ NGUYÊN, nay chặt hơn một bậc: mọi khối đều còn
   HTML viết tay làm bản dự phòng, và bản từ CMS chỉ được thay vào khi nó
   KHÔNG ÍT THẺ VÀ ÍT ẢNH HƠN bản đang có (xem thayNeuDu). Vì sao phải đo
   chứ không chỉ xem có rỗng hay không: bản ghi trong Firestore có thể đủ
   tên mà bỏ trống ô ảnh — thay vào là trang mất sạch ảnh chân dung, chẳng
   ai báo gì. Thà giữ bản cũ rồi kêu ra console.

   Đổi lại, Google vẫn đọc được mọi mục vì HTML nằm sẵn trong trang, và
   mất mạng thì trang vẫn đầy đủ. Chỉ TIN TỨC là không có bản dự phòng:
   tin đổi hằng tuần, chép cứng vào HTML là chắc chắn lạc hậu.

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

  /* ==========================================================
     BỐN MỤC "TĨNH": VỞ DIỄN, NGHỆ SĨ, LÃNH ĐẠO, THƯ VIỆN ẢNH
     ========================================================== */

  /* Thẻ nào cũng nằm trong một trong bốn lớp này, nên đếm được số thẻ của
     một khối mà không cần biết khối đó thuộc mục nào. */
  var CHON_THE = '.leader, .work, .expcard, .shot, .hero__slide, .milestone, .artist,'
    + ' .quickinfo__item, .mission, .value, .capa, .award, .martyr, .archive__item';

  /* Cửa chắn duy nhất cho cả bốn mục: bản từ CMS phải không nghèo hơn bản
     HTML viết tay thì mới được thay vào.

     Vì sao không chỉ kiểm tra "Firestore trả về rỗng": bản ghi thiếu ảnh
     vẫn là bản ghi. CMS đang có đủ 23 dòng lãnh đạo nhưng ô ảnh trống
     trơn — thay thẳng vào là 20 ảnh chân dung biến mất khỏi trang mà
     không có dấu hiệu gì. Đo cả số thẻ lẫn số ảnh thì trường hợp đó bị
     chặn lại, và người quản trị chỉ việc mở CMS bấm "Điền chỗ trống" là
     lần tải sau trang tự đổi sang bản CMS. */
  /* CMS LÀ BẢN CHÍNH. Trước đây hàm này từ chối bản từ CMS mỗi khi nó có ít
     thẻ hoặc ít ảnh hơn HTML viết sẵn. Ý tốt — không để một CMS trống làm
     rỗng trang — nhưng hoá ra nó chặn luôn việc sửa: 23 lãnh đạo trong CMS
     mới 1 người có ảnh, nên đổi ảnh trong CMS xong ngoài web không đổi gì,
     và người dùng không có cách nào biết vì sao.

     Nay chỉ còn một điều kiện: bản từ CMS phải dựng ra được ít nhất một
     thẻ. Còn ảnh thì không thiếu nữa — gomAnh() bên dưới mượn lại ảnh của
     người/vở cùng tên trong HTML viết sẵn cho những bản ghi CMS chưa có
     ảnh. Xoá một mục trong CMS giờ cũng mất thật ngoài web, đúng như mong
     đợi của người dùng. */
  function thayNeuDu(el, ten, html) {
    var tam = doc.createElement('div');
    tam.innerHTML = html;
    var moiThe = tam.querySelectorAll(CHON_THE).length;
    var cuThe = el.querySelectorAll(CHON_THE).length;

    if (!moiThe) {
      if (global.console) {
        global.console.warn('Giữ nguyên HTML viết sẵn cho "' + ten
          + '": bản từ CMS không dựng ra thẻ nào.');
      }
      return false;
    }
    if (moiThe < cuThe && global.console) {
      global.console.info('"' + ten + '": CMS có ' + moiThe + ' mục, HTML viết sẵn có '
        + cuThe + '. Trang lấy theo CMS. Thiếu mục nào thì vào CMS → Nạp dữ liệu → '
        + '"Đối chiếu với bản gốc" → "Điền chỗ trống".');
    }
    el.innerHTML = html;
    // thẻ mới chưa qua tay script.js nên chưa có hiệu ứng hiện dần
    if (global.HieuUngHien) global.HieuUngHien.quet(el);
    return true;
  }

  function theoThuTu(a, b) { return (Number(a.thuTu) || 0) - (Number(b.thuTu) || 0); }

  /* Gom ảnh đang có trong HTML viết sẵn, tra được theo tên.

     Vì sao cần: CMS mới là nơi nhập nội dung, nhưng ảnh thì phần lớn bản
     ghi còn trống (lãnh đạo 1/23, vở diễn 0/44) trong khi HTML viết sẵn có
     đủ. Gọi hàm này TRƯỚC khi thay innerHTML, rồi bản ghi nào CMS chưa có
     ảnh thì lấy lại đúng ảnh của người/vở cùng tên. Ảnh người dùng tải lên
     CMS vẫn thắng — chỉ lấp chỗ trống, không đè. */
  function gomAnh(el, chonThe, chonTen, khoaHoa) {
    var bang = {};
    if (!el) return bang;
    var ds = el.querySelectorAll(chonThe);
    for (var i = 0; i < ds.length; i++) {
      var img = ds[i].querySelector('img');
      var h = ds[i].querySelector(chonTen);
      if (!img || !h) continue;
      var src = img.getAttribute('src');
      if (!src) continue;
      var k = khoaHoa(h.textContent);
      if (k && !bang[k]) bang[k] = src;
    }
    return bang;
  }

  /* Tên vở để đối chiếu: bỏ nhãn "Trích đoạn" đứng cùng dòng, gộp khoảng
     trắng, bỏ phân biệt hoa thường. */
  function khoaVo(ten) {
    return String(ten || '').replace(/Trích đoạn/gi, '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  /* ----------------------------------------------------------
     THƯ VIỆN ẢNH (trang Tin tức)
     ---------------------------------------------------------- */

  var KHO_ANH = { thuong: '', cao: ' shot--tall', rong: ' shot--wide' };

  function veThuVien(ds) {
    // mục này nay chứa cả ảnh tư liệu của trang Lịch sử, lọc lấy đúng phần
    // thuộc trang Tin tức. Bản ghi cũ chưa có ô khu thì coi như thu-vien.
    ds = ds.filter(function (r) { return !r.khu || r.khu === 'thu-vien'; });
    var el = doc.querySelector('[data-cms="thu-vien-anh"]');
    if (!el) return;
    var h = ds.slice().sort(theoThuTu).map(function (r) {
      var a = anhCua(r);
      if (!a) return '';               // ảnh là tất cả của mục này, không có thì bỏ
      var cap = r.chuThich || '';
      return '<figure class="shot' + (KHO_ANH[r.khoAnh] || '') + '">'
        + '<button type="button" class="shot__zoom"'
        + ' data-cap="' + esc(cap) + '"'
        + ' data-credit="' + esc(r.nguon || '') + '"'
        + ' aria-label="Phóng to ảnh: ' + esc(cap) + '">'
        + '<img src="' + esc(a) + '" alt="' + esc(cap) + '" loading="lazy" />'
        + '</button></figure>';
    }).join('');
    thayNeuDu(el, 'Thư viện ảnh', h);
  }

  /* ----------------------------------------------------------
     NGHỆ SĨ (trang Nghệ sĩ)
     ---------------------------------------------------------- */

  function veNgheSi(ds) {
    ds = ds.slice().sort(theoThuTu);

    var oNsnd = doc.querySelector('[data-cms="nghe-si-nsnd"]');
    if (oNsnd) {
      var anhCuNs = gomAnh(oNsnd, '.leader', 'h4', khoaNguoi);
      thayNeuDu(oNsnd, 'Nghệ sĩ Nhân dân', ds.filter(function (r) {
        return r.danhHieu === 'NSND';
      }).map(function (r) {
        var ten = 'NSND ' + (r.hoTen || '');
        // CMS chưa có ảnh thì mượn ảnh của chính nghệ sĩ đó trong HTML viết sẵn
        var a = anhCua(r) || anhCuNs[khoaNguoi(r.hoTen)] || '';
        var nam = [];
        if (r.namNSND) nam.push('NSND ' + r.namNSND);
        if (r.namNSUT) nam.push('NSƯT ' + r.namNSUT);
        return '<figure class="leader">'
          + '<div class="leader__img">'
          + (a ? '<img src="' + esc(a) + '" alt="' + esc(ten) + '" loading="lazy" />' : '')
          + '</div><figcaption><h4>' + esc(ten) + '</h4>'
          + (nam.length ? '<p>' + esc(nam.join(' · ')) + '</p>' : '')
          + '</figcaption></figure>';
      }).join(''));
    }

    /* Trang chủ chỉ giới thiệu bốn gương mặt, danh sách đủ nằm ở nghe-si.html.
       Lấy bốn người đầu trong số NSND theo Thứ tự bên CMS — đổi Thứ tự là đổi
       được ai lên trang chủ, không phải sửa HTML. Dòng chức danh dưới tên
       (kiểu "Giám đốc Nhà hát") bỏ đi: lược đồ Nghệ sĩ không có ô đó, để
       nguyên chữ viết tay thì một hôm nào đó nó sai mà không ai biết. */
    var oNoiBat = doc.querySelector('[data-cms="nghe-si-noi-bat"]');
    if (oNoiBat) {
      var anhCuNb = gomAnh(oNoiBat, '.artist', 'h4', khoaNguoi);
      thayNeuDu(oNoiBat, 'Nghệ sĩ tiêu biểu', ds.filter(function (r) {
        return r.danhHieu === 'NSND';
      }).slice(0, 4).map(function (r) {
        var ten = 'NSND ' + (r.hoTen || '');
        var a = anhCua(r) || anhCuNb[khoaNguoi(r.hoTen)] || '';
        return '<figure class="artist">'
          + '<div class="artist__img">'
          + (a ? '<img src="' + esc(a) + '" alt="' + esc(ten) + '" loading="lazy" />' : '')
          + (r.namNSND ? '<span class="artist__nam">' + esc(r.namNSND) + '</span>' : '')
          + '</div><figcaption><h4>' + esc(ten) + '</h4></figcaption></figure>';
      }).join(''));
    }

    /* Mục NSƯT là danh sách tên suông, không ảnh — dùng thẻ .work cho gọn.

       Lọc theo DANH HIỆU HIỆN TẠI chứ không theo "có năm phong NSƯT": tám
       người đã lên NSND thì ai cũng từng là NSƯT, lọc theo năm là họ hiện
       ở cả hai mục, danh sách phồng từ 26 lên 34 và câu mở đầu "Hai mươi
       sáu nghệ sĩ" thành sai. Năm phong NSƯT của họ đã ghi ngay dưới tên
       ở mục Nghệ sĩ Nhân dân rồi. */
    var oNsut = doc.querySelector('[data-cms="nghe-si-nsut"]');
    if (oNsut) {
      thayNeuDu(oNsut, 'Nghệ sĩ Ưu tú', ds.filter(function (r) {
        return r.danhHieu === 'NSƯT';
      }).map(function (r) {
        return '<div class="work"><span class="work__year">' + esc(r.namNSUT) + '</span>'
          + '<div class="work__body"><h4>NSƯT ' + esc(r.hoTen || '') + '</h4></div></div>';
      }).join(''));
    }
  }

  /* ----------------------------------------------------------
     LÃNH ĐẠO (trang Nghệ sĩ)

     CMS lưu MỖI LẦN BỔ NHIỆM một dòng, còn trang web hiện MỖI NGƯỜI một
     thẻ. Ba người giữ hai cương vị nối nhau (Đào Văn Lê, Nguyễn Quốc
     Trượng, Vũ Tự Long) nên phải gộp lại, không thì cùng một khuôn mặt
     hiện hai lần trong một hàng, nhìn như lỗi.

     Gộp theo TÊN ĐÃ BỎ QUÂN HÀM VÀ DANH HIỆU: cùng một người nhưng dòng
     cũ ghi "Đạo diễn, NSƯT Nguyễn Quốc Trượng", dòng mới ghi "Đại tá,
     Đạo diễn, NSND Nguyễn Quốc Trượng" — so nguyên chuỗi là trượt.
     ---------------------------------------------------------- */

  var NHAN_NHOM = {
    'doan-truong': 'Đoàn trưởng',
    'giam-doc': 'Giám đốc',
    'chinh-tri-vien': 'Chính trị viên',
    'cap-pho': 'Phó Đoàn trưởng'
  };
  var BO_DANH = /(Thiếu tướng|Đại tá|Thượng tá|Trung tá|Thiếu tá|Đại úy|Thượng úy|Trung úy|Đạo diễn|Nhạc sĩ|NSND|NSƯT|NSUT)/g;

  function khoaNguoi(ten) {
    return String(ten || '').replace(BO_DANH, '')
      .replace(/[,·]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  /* Năm bắt đầu nhiệm kỳ, để xếp các cương vị của một người theo thời
     gian. "9/2014 - 12/2024" và "từ 12/2024" đều phải ra được con số. */
  function namDau(nhiemKy) {
    var m = String(nhiemKy || '').match(/\d{4}/);
    return m ? Number(m[0]) : 9999;
  }

  /* Ghép tên đầy đủ từ các ô rời của mục Nhân sự.
     Mục cũ gói cả cụm vào ô họ tên ("Đại tá, Đạo diễn, NSND Vũ Tự Long");
     mục mới tách ra từng ô, nên phải ghép lại ở chỗ hiển thị. */
  function tenDayDu(r) {
    var dau = [r.quanHam, r.ngheChinh, r.danhHieu].filter(Boolean).join(', ');
    return (dau ? dau + ' ' : '') + (r.hoTen || '');
  }

  /* Đưa bản ghi Nhân sự về đúng hình dạng veLanhDao đang chờ. Đánh dấu
     _gop để dongChuc biết đây là bản gộp: ở bản gộp, nhom + nhiemKy là
     cương vị HIỆN TẠI còn chucDanh là các cương vị TRƯỚC ĐÓ, ngược hẳn
     với mục cũ nơi chucDanh là bản kể chi tiết thay cho nhom. */
  function nhanSuThanhLanhDao(ds) {
    return ds.filter(function (r) { return r.laLanhDao; }).map(function (r) {
      return {
        hoTen: tenDayDu(r), nhom: r.nhom, nhiemKy: r.nhiemKy, chucDanh: r.chucDanh,
        anh: r.anh, thuTu: r.thuTu, _gop: true
      };
    });
  }

  function dongChuc(ds) {
    if (ds.length === 1 && ds[0]._gop) {
      var g = ds[0];
      var s = (NHAN_NHOM[g.nhom] || '') + (g.nhiemKy ? ' · ' + g.nhiemKy : '');
      return g.chucDanh ? s + ' · ' + g.chucDanh : s;
    }
    if (ds.length === 1) {
      var r = ds[0];
      var c = r.chucDanh || NHAN_NHOM[r.nhom] || '';
      // chucDanh đã tự kể nhiều cương vị kèm năm thì dùng nguyên; chắp
      // thêm nhiệm kỳ vào đuôi là thành câu thừa
      if (c.indexOf('·') >= 0) return c;
      return c + (r.nhiemKy ? ' · ' + r.nhiemKy : '');
    }
    return ds.map(function (r) {
      return ((r.chucDanh || NHAN_NHOM[r.nhom] || '') + ' ' + (r.nhiemKy || '')).trim();
    }).join(' · ');
  }

  function veLanhDao(ds) {
    var el = doc.querySelector('[data-cms="lanh-dao"]');
    if (!el) return;
    var anhCu = gomAnh(el, '.leader', 'h4', khoaNguoi);
    ds = ds.slice().sort(theoThuTu);

    var theo = {}, thuTuKhoa = [];
    ds.forEach(function (r) {
      var k = khoaNguoi(r.hoTen);
      if (!theo[k]) { theo[k] = []; thuTuKhoa.push(k); }
      theo[k].push(r);
    });

    /* Ai từng là Đoàn trưởng hoặc Giám đốc thì chỉ hiện MỘT LẦN, ở mục
       đầu, kèm cả quãng làm cấp phó trước đó — đúng như bản viết tay. */
    var muc = [
      { nhan: 'Đoàn trưởng · Giám đốc', khoa: [] },
      { nhan: 'Chính trị viên · Bí thư Đảng ủy', khoa: [] },
      { nhan: 'Phó Đoàn trưởng · Phó Giám đốc', khoa: [] }
    ];
    thuTuKhoa.forEach(function (k) {
      var co = function (nhom) {
        return theo[k].some(function (r) { return r.nhom === nhom; });
      };
      var i = (co('doan-truong') || co('giam-doc')) ? 0 : (co('chinh-tri-vien') ? 1 : 2);
      muc[i].khoa.push(k);
    });

    var nhoNhat = function (k) {
      return Math.min.apply(null, theo[k].map(function (r) { return Number(r.thuTu) || 0; }));
    };

    var h = muc.map(function (m) {
      if (!m.khoa.length) return '';
      m.khoa.sort(function (a, b) { return nhoNhat(a) - nhoNhat(b); });
      return '<h3 class="works__sub">' + esc(m.nhan) + '</h3><div class="leaders">'
        + m.khoa.map(function (k) {
            var cv = theo[k].slice().sort(function (a, b) {
              return namDau(a.nhiemKy) - namDau(b.nhiemKy);
            });
            // tên đầy đủ nhất trong các dòng: quân hàm và danh hiệu về sau cao hơn
            var ten = cv.reduce(function (a, r) {
              return String(r.hoTen || '').length > a.length ? String(r.hoTen) : a;
            }, '');
            var anh = '';
            cv.forEach(function (r) { if (!anh) anh = anhCua(r); });
            // CMS chưa có ảnh thì mượn đúng ảnh của người này trong HTML viết sẵn
            if (!anh) anh = anhCu[k] || '';
            /* Nhiệm kỳ mở đầu bằng "từ" nghĩa là chưa kết thúc — tô đỏ.
               KHÔNG dùng ranh-giới-từ sau "từ": trong biểu thức chính quy nó
               chỉ tính [A-Za-z0-9_], mà "ừ" không thuộc nhóm đó, nên mẫu ấy
               không bao giờ khớp "từ 12/2024". Đòi hẳn một khoảng trắng.
               (Đã bắt được đúng lỗi này khi so trang trước và sau.) */
            var dangTaiChuc = cv.some(function (r) {
              return /^\s*từ(\s|$)/i.test(r.nhiemKy || '');
            });

            return '<figure class="leader' + (anh ? '' : ' leader--blank') + '">'
              + '<div class="leader__img"' + (anh ? '' : ' aria-hidden="true"') + '>'
              + (anh ? '<img src="' + esc(anh) + '" alt="' + esc(ten) + '" loading="lazy" />' : '')
              + '</div><figcaption><h4>' + esc(ten) + '</h4>'
              + '<p' + (dangTaiChuc ? ' class="leader__now"' : '') + '>'
              + esc(dongChuc(cv)) + '</p></figcaption></figure>';
          }).join('')
        + '</div>';
    }).join('');

    thayNeuDu(el, 'Ban lãnh đạo', h);
  }

  /* ----------------------------------------------------------
     VỞ DIỄN (trang Vở diễn)

     Ba mục danh mục thôi. Hai mục cuối trang — "Theo giai đoạn phát
     triển" và "Vở diễn đoạt giải" — vẫn là HTML viết tay: mỗi giải phải
     ghi rõ loại huy chương, tên hội diễn và năm, mà lược đồ CMS mới chỉ
     có một ô "Giải thưởng" dạng chữ tự do.
     ---------------------------------------------------------- */

  var MUC_VO = ['cheo-co', 'nguoi-linh', 'danh-nhan'];

  /* Bỏ dấu để làm data-work — thuộc tính đó chọn cặp màu nền cho thẻ chưa
     có ảnh (xem [data-work=...] trong styles.css). */
  function boDau(s) {
    return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function theLon(r, anhCu) {
    // CMS chưa có ảnh thì mượn ảnh của chính vở đó trong HTML viết sẵn
    var a = anhCua(r) || (anhCu ? anhCu[khoaVo(r.ten)] : '') || '';
    var nhan = [r.nhanThe || '', r.nam || ''].filter(Boolean).join(' · ');
    return '<article class="expcard expcard--work" data-work="' + esc(boDau(r.ten)) + '">'
      + (a
          ? '<div class="expcard__art expcard__art--anh"><img src="' + esc(a) + '" alt="'
            + esc(r.anhMoTa || ('Cảnh trong vở ' + (r.ten || ''))) + '" loading="lazy" /></div>'
          : '<div class="expcard__art expcard__art--cho" aria-hidden="true"></div>')
      + '<div class="expcard__body">'
      + (nhan ? '<p class="expcard__kind">' + esc(nhan) + '</p>' : '')
      + '<h3>' + esc(r.ten || '') + '</h3>'
      + (r.tomTat
          ? '<p>' + esc(r.tomTat)
            + (r.anhNguon ? '<span class="expcard__ghi">' + esc(r.anhNguon) + '</span>' : '')
            + '</p>'
          : '')
      + '</div></article>';
  }

  function theNho(r) {
    return '<div class="work"><span class="work__year">' + esc(r.nam || '') + '</span>'
      + '<div class="work__body"><h4>' + esc(r.ten || '')
      + (r.trichDoan ? ' <span class="work__tag">Trích đoạn</span>' : '')
      + '</h4>' + (r.tomTat ? '<p>' + esc(r.tomTat) + '</p>' : '')
      + '</div></div>';
  }

  function veVoDien(ds) {
    ds = ds.slice().sort(theoThuTu);
    MUC_VO.forEach(function (nhom) {
      var el = doc.querySelector('[data-cms-vo="' + nhom + '"]');
      if (!el) return;
      var anhCu = gomAnh(el, '.expcard--work, .work', 'h3, h4', khoaVo);
      var cua = ds.filter(function (r) { return r.nhom === nhom; });
      var h = '';

      var lon = cua.filter(function (r) { return r.noiBat; });
      if (lon.length) h += '<div class="expgrid expgrid--wide">'
        + lon.map(function (r) { return theLon(r, anhCu); }).join('') + '</div>';

      // nhóm phụ giữ đúng thứ tự xuất hiện, không xếp lại theo bảng chữ cái
      var ten = [], theo = {};
      cua.filter(function (r) { return !r.noiBat; }).forEach(function (r) {
        var k = r.nhomPhu || '';
        if (!theo[k]) { theo[k] = []; ten.push(k); }
        theo[k].push(r);
      });

      ten.forEach(function (k) {
        if (k) h += '<h3 class="works__sub">' + esc(k) + '</h3>';
        // cả nhóm không vở nào có năm thì giấu hẳn cột năm, đỡ một cột trống
        var coNam = theo[k].some(function (r) { return r.nam; });
        h += '<div class="works' + (coNam ? '' : ' works--plain') + '">'
          + theo[k].map(theNho).join('') + '</div>';
      });

      thayNeuDu(el, 'Vở diễn — ' + nhom, h);
    });

    /* Mục "Theo giai đoạn phát triển" xếp theo TRỤC KHÁC: cùng một vở có
       thể vừa thuộc một thể loại vừa thuộc một chặng đường. Nên nó đọc ô
       "Chặng đường" của chính mục Vở diễn chứ không cần mục riêng — vở nào
       bỏ trống ô đó thì không xuất hiện ở đây. */
    var oGd = doc.querySelector('[data-cms="giai-doan"]');
    if (oGd) {
      var ten = [], theo = {};
      ds.forEach(function (r) {
        var k = (r.giaiDoan || '').trim();
        if (!k) return;
        if (!theo[k]) { theo[k] = []; ten.push(k); }
        theo[k].push(r);
      });
      if (ten.length) {
        thayNeuDu(oGd, 'Theo giai đoạn phát triển', ten.map(function (k) {
          var coNam = theo[k].some(function (r) { return r.nam; });
          return '<h3 class="works__sub">' + esc(k) + '</h3>'
            + '<div class="works' + (coNam ? '' : ' works--plain') + '">'
            + theo[k].map(theNho).join('') + '</div>';
        }).join(''));
      }
    }
    // thẻ vừa bị thay hết, bộ lọc bên script.js phải đếm lại và áp lại
    if (global.LocVo) global.LocVo.lamMoi();
  }


  /* ----------------------------------------------------------
     ẢNH BÌA (đầu trang chủ)

     Ảnh đi vào qua biến CSS --anh chứ không phải thuộc tính style viết
     thẳng trong chuỗi HTML: đường dẫn Firebase Storage có dấu & và dấu
     nháy, nhét vào style="" là gãy. Dựng xong mới gán bằng JS.
     ---------------------------------------------------------- */

  function veAnhBia(ds) {
    var el = doc.querySelector('[data-cms="anh-bia"]');
    if (!el) return;
    ds = ds.slice().sort(theoThuTu);

    var h = ds.map(function (r, i) {
      var a = anhCua(r);
      var nut = '';
      if (r.nut1Chu) nut += '<a href="' + esc(r.nut1Link || '#') + '" class="btn btn--primary">' + esc(r.nut1Chu) + '</a>';
      if (r.nut2Chu) nut += '<a href="' + esc(r.nut2Link || '#') + '" class="btn btn--ghost">' + esc(r.nut2Chu) + '</a>';
      return '<article class="hero__slide' + (i === 0 ? ' is-active' : '') + '"'
        + (a ? ' data-anh="' + esc(a) + '"' : '') + '>'
        + '<div class="container hero__content">'
        + (r.nhan ? '<p class="hero__eyebrow">' + esc(r.nhan) + '</p>' : '')
        + '<h1 class="hero__title">' + esc(r.tieuDe || '')
        + (r.tieuDeVang ? ' <span>' + esc(r.tieuDeVang) + '</span>' : '') + '</h1>'
        + (r.moTa ? '<p class="hero__desc">' + esc(r.moTa) + '</p>' : '')
        + (nut ? '<div class="hero__actions">' + nut + '</div>' : '')
        + '</div></article>';
    }).join('');

    if (!thayNeuDu(el, 'Ảnh bìa trang chủ', h)) return;

    var ss = el.querySelectorAll('[data-anh]');
    for (var i = 0; i < ss.length; i++) {
      ss[i].style.setProperty('--anh', 'url("' + ss[i].getAttribute('data-anh') + '")');
    }
    // slider đã chạy từ lúc tải trang, thẻ vừa bị thay hết nên phải dựng lại
    if (global.HeroSlider) global.HeroSlider.dungLai();
  }

  /* ----------------------------------------------------------
     DẤU MỐC (trang Lịch sử)
     ---------------------------------------------------------- */

  function veDauMoc(ds) {
    var el = doc.querySelector('[data-cms="dau-moc"]');
    if (!el) return;
    var anhCu = gomAnh(el, '.milestone', 'h3', khoaVo);
    ds = ds.slice().sort(theoThuTu);

    var h = ds.map(function (r) {
      var a = anhCua(r) || anhCu[khoaVo(r.tieuDe)] || '';
      var mt = r.anhMoTa || r.tieuDe || '';
      return '<article class="milestone">'
        + (a
            ? '<div class="milestone__art"><button type="button" class="archive__zoom" data-cap="'
              + esc(mt) + '" aria-label="Phóng to ảnh"><img src="' + esc(a) + '" alt="'
              + esc(mt) + '" loading="lazy" /></button></div>'
            : '')
        + '<p class="milestone__year">' + esc(r.moc || '') + '</p>'
        + '<h3>' + esc(r.tieuDe || '') + '</h3>'
        + (r.moTa ? '<p>' + esc(r.moTa) + '</p>' : '')
        + '</article>';
    }).join('');

    thayNeuDu(el, 'Dấu mốc', h);
  }

  /* ----------------------------------------------------------
     THÔNG TIN CHUNG (dải trên cùng, chân trang, mục Liên hệ)

     Không thay cả khối như mấy mục kia — chỉ điền vào đúng những chỗ đã
     đánh dấu sẵn trong HTML:
       data-tt="<trường>"      → thay chữ
       data-tt-tel             → đặt href="tel:…" theo số điện thoại
       data-tt-mail="<trường>" → đặt href="mailto:…"
       data-tt-link="<mạng>"   → đặt href cho biểu tượng mạng xã hội
     Ô nào CMS bỏ trống thì giữ nguyên chữ viết sẵn, không xoá thành trống.
     ---------------------------------------------------------- */

  var TT_CHU = ['diaChi', 'dienThoai', 'email', 'emailTruyenThong',
                'gioDonTiep', 'gioHanhChinh', 'gioiThieu'];
  var TT_MANG = ['facebook', 'youtube', 'tiktok'];

  function veThongTin(ds) {
    if (!ds || !ds.length) return;
    var t = ds[0];
    var i, els;

    for (var k = 0; k < TT_CHU.length; k++) {
      var truong = TT_CHU[k];
      var gia = t[truong];
      if (!gia) continue;
      els = doc.querySelectorAll('[data-tt="' + truong + '"]');
      for (i = 0; i < els.length; i++) els[i].textContent = gia;
    }

    if (t.dienThoai) {
      var so = String(t.dienThoai).replace(/[^0-9+]/g, '');
      els = doc.querySelectorAll('[data-tt-tel]');
      for (i = 0; i < els.length; i++) els[i].setAttribute('href', 'tel:' + so);
    }

    els = doc.querySelectorAll('[data-tt-mail]');
    for (i = 0; i < els.length; i++) {
      var tm = t[els[i].getAttribute('data-tt-mail')];
      if (tm) els[i].setAttribute('href', 'mailto:' + tm);
    }

    for (var m = 0; m < TT_MANG.length; m++) {
      var dc = t[TT_MANG[m]];
      if (!dc) continue;
      els = doc.querySelectorAll('[data-tt-link="' + TT_MANG[m] + '"]');
      for (i = 0; i < els.length; i++) {
        els[i].setAttribute('href', dc);
        els[i].setAttribute('target', '_blank');
        els[i].setAttribute('rel', 'noopener');
      }
    }
  }


  /* ----------------------------------------------------------
     KHỐI NỘI DUNG (9 vùng rải trên các trang)

     Chín vùng cùng một khuôn "dòng nhỏ + tiêu đề + mô tả", nên bên CMS gộp
     vào một mục và phân biệt bằng ô Khu vực. Ở đây mỗi khu chỉ khác nhau ở
     lớp CSS và thẻ bọc, nên dùng chung một bộ dựng.
     ---------------------------------------------------------- */

  var ICON = {
    ve: '<path d="M3 8.5A2 2 0 0 0 5 6.5h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 3v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-3v-2z"/><path d="M14 6.5v11" stroke-dasharray="2 2.4"/>',
    gio: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.2V12l3.2 2" stroke-linecap="round"/>',
    xe: '<path d="M4 16V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9"/><path d="M3 16h18"/><circle cx="7.5" cy="18" r="1.6"/><circle cx="16.5" cy="18" r="1.6"/><path d="M4 10h16"/>',
    hoc: '<path d="M12 4.5 21 9l-9 4.5L3 9l9-4.5z" stroke-linejoin="round"/><path d="M7 11v4.5c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5V11"/>',
    sao: '<path d="m12 4 2.3 5.1 5.7.6-4.2 3.8 1.2 5.5L12 16.3 7 19l1.2-5.5L4 9.7l5.7-.6z" stroke-linejoin="round"/>'
  };

  /* Mỗi khu: mã trong HTML, khuôn dựng một thẻ. */
  var KHU = {
    'nhanh': { chon: '[data-cms="khoi-nhanh"]', ten: 'Thông tin nhanh', ve: function (r) {
      var i = ICON[r.bieuTuong] || ICON.sao;
      return '<div class="quickinfo__item">'
        + '<span class="quickinfo__ico" aria-hidden="true">'
        + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">' + i + '</svg></span>'
        + '<div><h4>' + esc(r.tieuDe || '') + '</h4><p>' + esc(r.moTa || '') + '</p></div></div>';
    } },
    'gioi-thieu-su-menh': { chon: '[data-cms="khoi-su-menh"]', ten: 'Bốn nhiệm vụ', ve: function (r, i) {
      return '<article class="mission"><span class="mission__num">' + hai(i + 1) + '</span>'
        + '<h3>' + esc(r.tieuDe || '') + '</h3><p>' + esc(r.moTa || '') + '</p></article>';
    } },
    'gioi-thieu-gia-tri': { chon: '[data-cms="khoi-gia-tri"]', ten: 'Ba thành tố', ve: function (r) {
      return '<article class="value"><h3>' + esc(r.tieuDe || '') + '</h3>'
        + '<p>' + esc(r.moTa || '') + '</p></article>';
    } },
    'gioi-thieu-chuc-nang': { chon: '[data-cms="khoi-chuc-nang"]', ten: 'Chức năng & Năng lực', ve: function (r) {
      return '<article class="capa"><h3>' + esc(r.tieuDe || '') + '</h3>'
        + '<p>' + esc(r.moTa || '') + '</p></article>';
    } },
    'huong-dan': { chon: '[data-cms="khoi-huong-dan"]', ten: 'Hướng dẫn đặt chỗ', ve: function (r) {
      return '<article class="capa"><h3>' + esc(r.tieuDe || '') + '</h3>'
        + '<p>' + esc(r.moTa || '') + '</p></article>';
    } },
    'phan-thuong': { chon: '[data-cms="khoi-phan-thuong"]', ten: 'Phần thưởng cao quý', ve: function (r) {
      return '<article class="award' + (r.noiBat ? ' award--top' : '') + '">'
        + '<p class="award__year">' + esc(r.nhan || '') + '</p>'
        + '<h3>' + esc(r.tieuDe || '')
        + (r.ghiChu ? '<br /><span class="award__sub">' + esc(r.ghiChu) + '</span>' : '')
        + '</h3></article>';
    } },
    'liet-si': { chon: '[data-cms="khoi-liet-si"]', ten: 'Tưởng nhớ liệt sĩ', ve: function (r) {
      return '<article class="martyr">'
        + (r.nhan ? '<p class="martyr__role">' + esc(r.nhan) + '</p>' : '')
        + '<h4>' + esc(r.tieuDe || '') + '</h4>'
        + (r.ghiChu ? '<p class="martyr__note">' + esc(r.ghiChu) + '</p>' : '')
        + '</article>';
    } }
  };

  function veKhoiTrang(ds) {
    ds = ds.slice().sort(theoThuTu);

    Object.keys(KHU).forEach(function (ma) {
      var k = KHU[ma];
      var el = doc.querySelector(k.chon);
      if (!el) return;
      var cua = ds.filter(function (r) { return r.khu === ma; });
      if (!cua.length) return;
      thayNeuDu(el, k.ten, cua.map(k.ve).join(''));
    });

    /* Đôi nét: mấy đoạn văn xuôi, không phải thẻ, nên không đo bằng
       thayNeuDu được — đoạn đầu in đậm hơn (.prose__lead). */
    var oNet = doc.querySelector('[data-cms="khoi-doi-net"]');
    if (oNet) {
      var doan = ds.filter(function (r) { return r.khu === 'gioi-thieu-doi-net' && r.moTa; });
      if (doan.length) {
        oNet.innerHTML = doan.map(function (r, i) {
          return '<p' + (i === 0 ? ' class="prose__lead"' : '') + '>' + esc(r.moTa) + '</p>';
        }).join('');
      }
    }

    /* Tầm nhìn: một bản ghi, chỉ thay chữ trong hai thẻ có sẵn. */
    var tn = ds.filter(function (r) { return r.khu === 'gioi-thieu-tam-nhin'; })[0];
    if (tn) {
      var oTd = doc.querySelector('[data-cms-tn="tieuDe"]');
      var oMt = doc.querySelector('[data-cms-tn="moTa"]');
      if (oTd && tn.tieuDe) oTd.textContent = tn.tieuDe;
      if (oMt && tn.moTa) oMt.textContent = tn.moTa;
    }
  }

  /* ----------------------------------------------------------
     TƯ LIỆU & HÌNH ẢNH (trang Lịch sử)
     Dùng chung mục Thư viện ảnh bên CMS, lọc theo ô Khu vực.
     ---------------------------------------------------------- */

  function veTuLieu(ds) {
    var el = doc.querySelector('[data-cms="tu-lieu"]');
    if (!el) return;
    var cua = ds.slice().sort(theoThuTu).filter(function (r) { return r.khu === 'tu-lieu'; });
    if (!cua.length) return;

    thayNeuDu(el, 'Tư liệu & hình ảnh', cua.map(function (r) {
      var a = anhCua(r);
      if (!a) return '';
      var ct = r.chuThich || '';
      return '<figure class="archive__item"><div class="archive__art">'
        + '<button type="button" class="archive__zoom" aria-label="Phóng to ảnh">'
        + '<img src="' + esc(a) + '" alt="' + esc(ct) + '" loading="lazy" /></button></div>'
        + '<figcaption>' + esc(ct) + (r.nguon ? ' · ' + esc(r.nguon) : '') + '</figcaption></figure>';
    }).join(''));
  }

  /* ----------------------------------------------------------
     Mỗi mục chỉ gọi Firestore khi trang thật sự có khối tương ứng —
     trang chủ không việc gì phải tải 46 vở diễn.
     ---------------------------------------------------------- */

  function napMuc(bang, chon, ve) {
    if (!doc.querySelector(chon)) return null;
    return global.Kho.danhSachHien(bang).then(function (ds) {
      if (ds.length) ve(ds);
      return ds;
    })['catch'](function (e) {
      if (global.console) {
        global.console.warn('Không đọc được "' + bang + '" từ CMS:', e,
          '\n\nBa mục anh-bia, dau-moc, thong-tin là mục MỚI: Firestore trả 403 cho tới'
          + ' khi đăng lại firestore.rules bên kho CMS (Firebase Console → Firestore'
          + ' Database → tab Rules → dán đè → Publish). Trang vẫn chạy bằng HTML viết'
          + ' sẵn, chỉ là chưa lấy được bản từ CMS.');
      }
      return null;
    });
  }

  /* ----------------------------------------------------------
     NHÂN SỰ — một danh sách cho cả nghệ sĩ lẫn lãnh đạo

     CMS đã gộp hai mục nghe-si và lanh-dao làm một, vì chín người nằm ở
     cả hai chỗ: sửa bên này thì bên kia giữ bản cũ.

     Vẫn chừa đường lui về hai mục cũ. Trang web và CMS nằm ở hai kho,
     deploy không cùng lúc; mà mục nhan-su còn đòi đăng lại firestore.rules
     rồi mới bấm gộp. Trong quãng đó nhan-su hoặc rỗng hoặc trả 403 — cứ
     chạy đường cũ, trang không việc gì phải trống.
     ---------------------------------------------------------- */
  function napNhanSu() {
    if (!doc.querySelector('[data-cms^="nghe-si-"], [data-cms="lanh-dao"]')) return;

    var cu = function () {
      napMuc('nghe-si', '[data-cms^="nghe-si-"]', veNgheSi);
      napMuc('lanh-dao', '[data-cms="lanh-dao"]', veLanhDao);
    };

    global.Kho.danhSachHien('nhan-su').then(function (ds) {
      if (!ds || !ds.length) { cu(); return; }
      var ns = ds.filter(function (r) { return r.laNgheSi; });
      if (ns.length) veNgheSi(ns);
      var ld = nhanSuThanhLanhDao(ds);
      if (ld.length) veLanhDao(ld);
    })['catch'](cu);
  }

  function napKhoiTinh() {
    napMuc('khoi-trang', '[data-cms^="khoi-"], [data-cms-tn]', veKhoiTrang);
    napMuc('thu-vien-anh', '[data-cms="tu-lieu"]', veTuLieu);
    napMuc('anh-bia', '[data-cms="anh-bia"]', veAnhBia);
    napMuc('dau-moc', '[data-cms="dau-moc"]', veDauMoc);
    napMuc('thong-tin', '[data-tt]', veThongTin);
    napMuc('thu-vien-anh', '[data-cms="thu-vien-anh"]', veThuVien);
    napNhanSu();
    napMuc('vo-dien', '[data-cms-vo]', veVoDien);
  }

  /* ----------------------------------------------------------
     Chạy
     ---------------------------------------------------------- */

  // Lịch diễn chỉ có ở trang chủ và trang Đặt chỗ; trang khác gọi là phí
  // một lượt đọc Firestore mà chẳng để làm gì.
  var xongLich = (doc.querySelector('.schedule') || doc.getElementById('bookingRoot'))
    ? napLich()
    : Promise.resolve(null);

  if (doc.querySelector('.news') || doc.getElementById('newsGrid')) napTin();

  napKhoiTinh();

  global.NoiCms = {
    // dat-cho.html phải chờ cái này rồi mới dựng luồng đặt chỗ, không thì
    // nó dựng bằng danh sách suất viết cứng trong booking.js
    lichSanSang: xongLich,
    napLich: napLich,
    napTin: napTin,
    napKhoiTinh: napKhoiTinh
  };
})(window);
