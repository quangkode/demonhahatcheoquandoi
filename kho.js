/* ==========================================================
   Nhà hát Chèo Quân đội — Lớp nối Firestore cho trang web công khai

   Trang web đọc nội dung do CMS (cmscheoquandoi.vercel.app) nhập vào,
   và ghi đơn đặt chỗ ngược lại cho Nhà hát.

   Vì sao dùng REST API mà không nạp SDK Firebase:
   toàn bộ trang này là script thuần, nạp bằng thẻ <script> thường.
   SDK Firebase chỉ có bản ES module, kéo vào là phải đổi cách nạp của
   mọi tệp và mất hẳn khả năng chạy trên trình duyệt cũ. REST chỉ cần
   fetch, nhẹ hơn hẳn, và LUẬT BẢO MẬT vẫn áp dụng y như nhau —
   firestore.rules kiểm mọi lượt ghi bất kể đến từ SDK hay REST.

   Khoá dưới đây KHÔNG phải mật khẩu. Firebase thiết kế để nó nằm công
   khai trong mã trang web. Thứ chặn người lạ ghi bậy là firestore.rules
   bên kho CMS.
   ========================================================== */
(function (global) {
  'use strict';

  var DU_AN = 'cmsnhahatcheoquandoi';
  var KHOA = 'AIzaSyBNgKNSMPAOGsgLOmnH1yso3HWPcML_SIQ';

  var GOC = 'https://firestore.googleapis.com/v1/projects/' + DU_AN +
            '/databases/(default)/documents/';

  /* ----------------------------------------------------------
     Firestore REST bọc mọi giá trị trong một lớp báo kiểu:
     "Hà Nội" thành { stringValue: "Hà Nội" }. Hai hàm dưới đây
     bọc vào và bóc ra, để phần còn lại của trang web làm việc với
     object JavaScript bình thường.
     ---------------------------------------------------------- */

  function boc(v) {
    if (v === null || v === undefined) return { nullValue: null };
    if (typeof v === 'string') return { stringValue: v };
    if (typeof v === 'boolean') return { booleanValue: v };
    if (typeof v === 'number') {
      // Firestore phân biệt số nguyên và số thực. Số nguyên phải gửi
      // dưới dạng CHUỖI — đây là quy định của REST API, không phải nhầm.
      return isFinite(v) && Math.floor(v) === v
        ? { integerValue: String(v) }
        : { doubleValue: v };
    }
    if (v instanceof Date) return { timestampValue: v.toISOString() };
    if (Array.isArray(v)) {
      return { arrayValue: { values: v.map(boc) } };
    }
    return { mapValue: { fields: bocTruong(v) } };
  }

  function bocTruong(o) {
    var f = {};
    for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) f[k] = boc(o[k]);
    return f;
  }

  function moc(f) {
    if (!f) return null;
    if ('stringValue' in f) return f.stringValue;
    if ('booleanValue' in f) return f.booleanValue;
    if ('integerValue' in f) return Number(f.integerValue);
    if ('doubleValue' in f) return f.doubleValue;
    if ('timestampValue' in f) return new Date(f.timestampValue);
    if ('nullValue' in f) return null;
    if ('arrayValue' in f) return (f.arrayValue.values || []).map(moc);
    if ('mapValue' in f) return mocTruong(f.mapValue.fields);
    return null;
  }

  function mocTruong(f) {
    var o = {};
    for (var k in f) if (Object.prototype.hasOwnProperty.call(f, k)) o[k] = moc(f[k]);
    return o;
  }

  /* Tên tài liệu Firestore là một đường dẫn dài; phần cuối mới là id. */
  function layId(ten) {
    var p = String(ten || '').split('/');
    return p[p.length - 1];
  }

  /* ----------------------------------------------------------
     Đọc danh sách
     ---------------------------------------------------------- */

  /* Lấy toàn bộ tài liệu của một bảng. Firestore trả theo từng trang
     nên phải đi hết pageToken, nếu chỉ lấy trang đầu thì mục nào nhiều
     bản ghi (vở diễn, nghệ sĩ) sẽ bị cụt mà không báo lỗi gì. */
  function danhSach(bang) {
    var ra = [];

    function trang(token) {
      var url = GOC + bang + '?key=' + KHOA + '&pageSize=300' +
                (token ? '&pageToken=' + encodeURIComponent(token) : '');

      return fetch(url).then(function (r) {
        if (!r.ok) throw new Error('Không đọc được ' + bang + ' (mã ' + r.status + ')');
        return r.json();
      }).then(function (d) {
        (d.documents || []).forEach(function (tl) {
          var o = mocTruong(tl.fields || {});
          o.id = layId(tl.name);
          ra.push(o);
        });
        return d.nextPageToken ? trang(d.nextPageToken) : ra;
      });
    }

    return trang(null);
  }

  /* Chỉ lấy những mục đang bật "Hiện trên web".
     Lọc ở đây chứ không lọc bằng truy vấn Firestore: truy vấn có điều
     kiện đòi tạo chỉ mục riêng cho từng bảng, mà số bản ghi của Nhà hát
     chỉ vài chục nên lọc tại trình duyệt vừa đủ nhanh vừa đỡ phải dựng. */
  function danhSachHien(bang) {
    return danhSach(bang).then(function (ds) {
      return ds.filter(function (x) { return x.hienThi !== false; });
    });
  }

  /* ----------------------------------------------------------
     Ghi
     ---------------------------------------------------------- */

  function them(bang, duLieu) {
    return fetch(GOC + bang + '?key=' + KHOA, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: bocTruong(duLieu) })
    }).then(function (r) {
      if (r.ok) return r.json();
      // Firestore trả lỗi kèm lý do; giữ lại để còn biết là do luật chặn
      // hay do mạng, thay vì nuốt mất rồi báo chung chung.
      return r.json().catch(function () { return null; }).then(function (j) {
        var ly = j && j.error && j.error.message ? j.error.message : ('mã ' + r.status);
        throw new Error(ly);
      });
    }).then(function (d) {
      var o = mocTruong(d.fields || {});
      o.id = layId(d.name);
      return o;
    });
  }

  global.Kho = {
    danhSach: danhSach,
    danhSachHien: danhSachHien,
    them: them
  };
})(window);
