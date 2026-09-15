/* ==========================================================
   Trang đọc một bài viết: tin-bai.html?id=<mã bài>

   Đọc bài từ Firestore (qua kho.js) rồi dựng ra màn hình. Cuối bài luôn
   có khối "Nguồn: <tên báo>" kèm liên kết về bài gốc — bài lấy từ báo về
   thì phải dẫn nguồn, không có ngoại lệ.

   Nội dung bài đã được CMS lọc theo danh sách thẻ cho phép trước khi lưu
   (xem js/doc-bai.js bên kho CMS), nên tới đây chỉ còn p, h2-h4, ul, ol,
   blockquote, figure, img, a, table. Vẫn quét lại một lượt ở đây trước
   khi đưa vào trang: dữ liệu có thể bị sửa tay trên Firebase Console,
   mà tin vào dữ liệu "chắc là sạch rồi" là cách thủng bảo mật kinh điển.
   ========================================================== */
(function (global) {
  'use strict';

  var doc = global.document;

  var THE_CHO_PHEP = {
    P:1, BR:1, H2:1, H3:1, H4:1, UL:1, OL:1, LI:1, BLOCKQUOTE:1,
    STRONG:1, B:1, EM:1, I:1, FIGURE:1, FIGCAPTION:1, IMG:1, A:1,
    TABLE:1, THEAD:1, TBODY:1, TR:1, TH:1, TD:1
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
    });
  }

  /* Quét lại nội dung: giữ đúng thẻ trong danh sách, bỏ mọi thuộc tính
     trừ href/src/alt, và chỉ nhận href/src bắt đầu bằng http(s) — chặn
     javascript: lẫn data:. */
  function quet(html) {
    var hop = doc.createElement('div');
    hop.innerHTML = html;

    /* Vứt hẳn cả ruột mấy thẻ này TRƯỚC khi bóc vỏ những thẻ lạ khác.
       Thiếu bước này thì <script>alert(1)</script> tuy không chạy được
       nhưng phần chữ bên trong lại lọt ra thành văn bản hiện trên trang,
       người đọc thấy một dòng mã giữa bài. */
    var bo = hop.querySelectorAll('script,style,noscript,iframe,svg,template,form,input,textarea,select,button,object,embed');
    for (var k = bo.length - 1; k >= 0; k--) bo[k].parentNode.removeChild(bo[k]);

    var ds = hop.querySelectorAll('*');
    for (var i = ds.length - 1; i >= 0; i--) {
      var el = ds[i];
      if (!THE_CHO_PHEP[el.tagName]) {
        // bỏ vỏ giữ ruột, đừng làm mất chữ
        while (el.firstChild) el.parentNode.insertBefore(el.firstChild, el);
        el.parentNode.removeChild(el);
        continue;
      }
      for (var j = el.attributes.length - 1; j >= 0; j--) {
        var a = el.attributes[j].name;
        var v = el.getAttribute(a);
        var giu = (el.tagName === 'A' && a === 'href') ||
                  (el.tagName === 'IMG' && (a === 'src' || a === 'alt'));
        if (!giu) { el.removeAttribute(a); continue; }
        if (a !== 'alt' && !/^https?:\/\//i.test(v)) el.removeAttribute(a);
      }
      if (el.tagName === 'A' && el.getAttribute('href')) {
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener');
      }
      if (el.tagName === 'IMG') {
        el.setAttribute('loading', 'lazy');
        if (!el.getAttribute('src')) el.parentNode.removeChild(el);
      }
    }
    return hop.innerHTML;
  }

  function ngayVN(v) {
    if (!v) return '';
    var d = v instanceof Date ? v : new Date(v);
    return isNaN(d) ? '' : d.toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' });
  }

  var CHU_DE = { 'hoat-dong': 'Hoạt động', 'su-kien': 'Sự kiện' };

  function anhCua(r) {
    if (!r.anh) return '';
    return typeof r.anh === 'string' ? r.anh : (r.anh.url || '');
  }

  function bao(chu, phu) {
    doc.getElementById('bvNoiDung').innerHTML =
      '<div class="baiviet__trong"><h1>' + esc(chu) + '</h1><p>' + esc(phu || '') + '</p>' +
      '<p><a class="btn btn--primary" href="./tin-tuc.html">Về trang Tin tức</a></p></div>';
    doc.getElementById('bvCrumb').textContent = chu;
  }

  function ve(r) {
    var anh = anhCua(r);
    var ngay = ngayVN(r.ngay);

    doc.title = (r.tieuDe || 'Bài viết') + ' - Nhà hát Chèo Quân đội';
    doc.getElementById('bvCrumb').textContent = r.tieuDe || 'Bài viết';

    var h = '<article class="baiviet__bai">'
      + '<p class="baiviet__meta">' + esc(ngay)
      + (r.chuDe ? ' · ' + esc(CHU_DE[r.chuDe] || r.chuDe) : '') + '</p>'
      + '<h1 class="baiviet__tieude">' + esc(r.tieuDe || '') + '</h1>'
      + (r.tomTat ? '<p class="baiviet__tomtat">' + esc(r.tomTat) + '</p>' : '');

    if (anh) {
      h += '<figure class="baiviet__anhbia"><img src="' + esc(anh) + '" alt="" />'
        + (r.anhNguon ? '<figcaption>' + esc(r.anhNguon) + '</figcaption>' : '')
        + '</figure>';
    }

    if (r.noiDung) {
      h += '<div class="baiviet__than">' + quet(r.noiDung) + '</div>';
    } else {
      /* Bài cũ chỉ có tóm tắt, chưa lấy toàn văn. Đừng để trang trống
         trơn — đưa người đọc sang bài gốc. */
      h += '<p class="baiviet__thieu">Bài này hiện chỉ có phần tóm tắt. '
        + (r.nguonUrl ? 'Mời bạn đọc toàn văn tại bài gốc bên dưới.' : '') + '</p>';
    }

    if (r.nguonTen || r.nguonUrl) {
      h += '<aside class="baiviet__nguon">'
        + '<span class="baiviet__nguon-nhan">Nguồn</span>'
        + (r.nguonUrl
            ? '<a href="' + esc(r.nguonUrl) + '" target="_blank" rel="noopener">'
              + esc(r.nguonTen || r.nguonUrl) + '</a>'
            : '<strong>' + esc(r.nguonTen) + '</strong>')
        + '<p>Bài viết thuộc bản quyền của cơ quan báo chí nêu trên. '
        + 'Nhà hát Chèo Quân đội đăng lại để lưu giữ tư liệu về hoạt động của đơn vị.</p>'
        + '</aside>';
    }

    h += '<p class="baiviet__ve"><a class="btn btn--ghost" href="./tin-tuc.html">← Về trang Tin tức</a></p>'
      + '</article>';

    doc.getElementById('bvNoiDung').innerHTML = h;
  }

  function chay() {
    var id = new URLSearchParams(global.location.search).get('id');
    if (!id) return bao('Thiếu mã bài viết', 'Đường dẫn không có tham số id.');
    if (!global.Kho) return bao('Chưa nối được kho dữ liệu', 'Thiếu kho.js.');

    global.Kho.danhSach('tin-tuc').then(function (ds) {
      var r = null;
      for (var i = 0; i < ds.length; i++) if (ds[i].id === id) { r = ds[i]; break; }
      if (!r) return bao('Không tìm thấy bài viết', 'Bài này có thể đã bị gỡ.');
      if (r.hienThi === false) return bao('Bài viết đang ẩn', 'Bài này chưa được đăng công khai.');
      ve(r);
    })['catch'](function (e) {
      bao('Không tải được bài viết', e && e.message ? e.message : '');
    });
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', chay);
  else chay();
})(window);
