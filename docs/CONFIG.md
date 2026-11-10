# Cấu hình nội dung

Mọi nội dung (loại ticket, mục, checklist, nhãn, link) nằm trong `config/`. Sửa nội dung **không cần** mở `src/`.

Sau khi thêm file mới: thêm `<script src="...">` vào **`index.html` và `tests/index.html`** ở nhóm `config/` tương ứng, tăng `version` trong `config/app.js`, chạy test (`tests/index.html`). Test `config.test.js` sẽ báo nếu `meta` không khớp catalog hoặc `id` mục bị trùng.

---

## 1. Viết ticket — `config/tickets/<key>.js`

```js
(function (registry) {
  'use strict';

  const { addTicket, NOTE } = registry;

  addTicket('incident', {
    label: 'Hỗ trợ merchant',         // chữ trên nút
    tag: 'Incident',
    formerKeys: ['request'],          // key loại cũ đã gộp vào loại này
    sections: [
      { key: 's1', label: 'Vấn đề', ph: 'Merchant cần support gì…' },
      { key: 's2', label: 'Đã support', ph: 'Đã kiểm tra / làm những gì…' },
      { key: 'c',  label: 'Kết luận', kind: 'conclusion' },
      { key: 's5', label: 'Việc cần làm tiếp', ph: '…', actionFor: true },
      NOTE
    ]
  });
})(window.TW.registry);
```

Mọi file config theo đúng khuôn này: IIFE nhận `registry`, lấy hàm cần dùng ở dòng `const` (không destructure ngay ở tham số — có `'use strict'` thì đó là lỗi cú pháp).

| Trường của loại | Ý nghĩa |
|---|---|
| `label` | Chữ trên nút chọn loại |
| `tag` | Tên ngắn |
| `sections` | Các mục, theo thứ tự hiện trên form và trong nội dung |
| `showLang: true` | Hiện chọn Ngôn ngữ merchant, ghi ` - ENG`/` - VIE` sau Phone |
| `noCategory: true` | Không có ô Loại; title chỉ có Tóm tắt |
| `smsPromotion: true` | Có khối tùy chọn SMS Promotion ở cuối form (REQUIREMENTS §16). Phải có ít nhất 1 loại ticket bật cờ này |
| `footer` | Câu cố định cuối nội dung |
| `formerKeys` | Key các loại cũ đã gộp vào loại này. State / template lưu key cũ vẫn mở bằng loại này. Key cũ không được dùng lại cho loại mới |

| Trường của mục | Ý nghĩa |
|---|---|
| `key` | Khóa dữ liệu (bảng dưới) |
| `label` | Tiêu đề mục, in ra nội dung dạng `<label>:` |
| `ph` | Gợi ý trong ô nhập đầu tiên |
| `kind: 'conclusion'` | Mục chọn Kết luận thay vì nhập ý |
| `actionFor: true` | Bắt buộc khi Kết luận có `requiresAction`; ẩn (không hiện, không in) khi Kết luận có `hidesAction` |
| `note: true` | Mục ghi chú: không tính là "đã có bước xử lý" |

`NOTE` = mục Note dùng chung (`{ key: 's6', label: 'Note', ph: 'Ghi chú thêm (tùy chọn)…', note: true }`).

### Key mục dùng chung

Cùng key giữa các loại = cùng dữ liệu → đổi loại ticket vẫn giữ nội dung. Vì vậy **cùng key phải cùng ý nghĩa**:

| Key | Ý nghĩa | Đang dùng |
|---|---|---|
| `s1` | Đầu vào: merchant báo / yêu cầu gì | Vấn đề, Yêu cầu (Chuyển CS/MKT) |
| `s2` | Đã làm gì | Đã support |
| `s3` | Nguyên nhân | (đã bỏ — không dùng lại key cho ý nghĩa khác) |
| `s4` | Kết quả sau khi support | (đã bỏ — không dùng lại key cho ý nghĩa khác) |
| `c` | Kết luận (không lưu ý, lưu giá trị chọn) | Kết luận |
| `s5` | Việc cần làm tiếp | Việc cần làm tiếp |
| `s6` | Ghi chú | Note |

Mục có ý nghĩa mới → dùng key mới (`s7`, …), không tái dụng key cũ.

---

## 2. Danh mục setup — `config/setup/catalog.js`

Khai báo các cấp chọn. Thêm hãng/model mới ở đây.

```js
setCatalog({   // const { setCatalog } = registry;
  flows: [
    { id: 'new',     label: 'Ship mới' },
    { id: 'replace', label: 'Replace' }
  ],
  devices: [
    { id: 'pos', label: 'POS', brands: [
      { id: 'abc', label: 'ABC', models: [] }
    ] },
    { id: 'terminal', label: 'Terminal', brands: [
      { id: 'valor',  label: 'Valor (VL)', models: ['VL100', 'VL100 Pro', 'VL550'] },
      { id: 'pax',    label: 'PAX',        models: ['A920', 'A920 Pro', 'A3700'] },
      { id: 'clover', label: 'Clover',     models: ['Clover Flex', 'Clover Mini'] }
    ] }
  ]
});
```

- `id`: tiếng Anh, viết thường, dùng làm tên folder.
- `models`: danh sách model của hãng, theo thứ tự hiện trên form. **Thêm model mới = thêm 1 chuỗi vào đây**; checklist có `models: []` tự áp dụng cho model mới.
- Hãng có model → hiện cấp chọn Model (chỉ 1 model thì tự chọn) và ghi dòng `Model: <tên>` vào nội dung ticket. Hãng không có model (POS ABC) → không có cấp Model, không có dòng Model.

---

## 3. Checklist setup — `config/setup/<device>/<brand>/<flow>/<checklist>.js`

Ví dụ `config/setup/terminal/pax/new/setup.js`:

```js
addSetup('setupPax', {   // const { addSetup, NOTE } = registry;
  label: 'Setup PAX', tag: 'Setup PAX',
  meta: { device: 'terminal', brand: 'pax', flow: 'new', models: [], order: 1 },
  sections: [NOTE],
  checklist: {
    title: 'Setup PAX (A920 / A920 Pro / A3700)',
    requireImages: true,
    groups: [
      { title: 'Cần setup', items: [
        { id: 'pax-qc',  noImage: true, text: 'Check QC note', warn: 'Nếu note ghi Error thì …' },
        { id: 'pax-mid', text: 'Check MID', sub: ['Chụp ảnh Host Settings'] }
      ] }
    ]
  }
});
```

### `meta` — checklist này thuộc nhánh nào

| Trường | Ý nghĩa |
|---|---|
| `device` | `id` thiết bị trong catalog (`pos`, `terminal`) |
| `brand` | `id` hãng (`abc`, `valor`, `pax`, `clover`) |
| `flow` | `new` hoặc `replace` |
| `models` | Model áp dụng. **Rỗng = mọi model của hãng.** Chỉ ghi khi checklist riêng cho model đó |
| `order` | Thứ tự làm khi 1 nhánh có nhiều checklist. Bước chuẩn bị trước khi ship đứng trước bước tại tiệm (vd POS ABC Ship mới: Tạo DB = 1, Setup POS = 2) |

`meta` phải khớp với đường dẫn folder chứa file.

**Cách tool tìm checklist**: lấy mọi checklist cùng `device` + `brand` + `flow`, và có `models` rỗng hoặc chứa model đang chọn. Có 1 thì mở luôn; có nhiều thì hiện thêm cấp chọn Checklist (theo `order`); không có thì báo "Chưa có checklist" kèm đường dẫn file cần tạo.

### `checklist`

| Trường | Ý nghĩa |
|---|---|
| `title` | Tên checklist, hiện trên form, không in ra nội dung |
| `requireImages: true` | Mục chưa N/A mà thiếu ảnh → khóa Copy nội dung |
| `groups` | Các nhóm `{ title, items }`. `title` in ra nội dung dạng `<title>:`. Tên ảnh bỏ phần trong ngoặc của `title` (ghi chú cách làm như `(nếu có)`), nên đừng để thông tin cần thiết trong ngoặc ở `title` |

### Mục checklist

| Trường | Ý nghĩa |
|---|---|
| `id` | **Bắt buộc, duy nhất toàn dự án.** Prefix theo checklist (`pax-`, `trn-`, `valor-b-`, `new-`…). Không đổi id đang có |
| `text` | Nội dung bước, in ra nội dung ticket |
| `sub` | Mảng ghi chú con. Chỉ hiện trên form |
| `warn` | Dòng cảnh báo. Chỉ hiện trên form |
| `warnLink` | Link sau cảnh báo `{ label, url }` |
| `links` | Mảng link `{ label, url }` gắn sau `text` |
| `noImage: true` | Không cần ảnh, chỉ tick (không có nút / ô dán ảnh). Bước thường N/A hoặc không cần bằng chứng thì đặt cờ này |
| `minImages: n` | Cần n ảnh (mặc định 1) |
| `parent` | Tên mục cha. Các mục **liền nhau** cùng `parent` gom dưới 1 tiêu đề; nội dung in `<parent> – <text>`. Tên ảnh bỏ phần trong ngoặc của `parent` như `title` nhóm |

---

## 4. SMS Promotion — `config/sms/promotion.js`

```js
setSms({   // const { setSms } = registry;
  prices: ['0.02', '0.04', '0.06', '0.08'],
  customerTypes: [
    { id: 'lastVisit',  text: 'Last Visit <= {days}',              values: { days: '365' } },
    { id: 'lastVisitAtLeast', text: 'Last Visit >= {days}',        values: { days: '90' } },
    { id: 'visitTimes', text: 'Times visit between {min} - {max}', values: { min: '1', max: '10000' } }
  ],
  labels: { toggle: 'SMS Promotion', language: 'Ngôn ngữ tin nhắn', shop: 'Tên tiệm', shopPhone: 'Phone tiệm', recipients: 'Recipients', customerTypes: 'Type Customer', message: 'Message', price: 'Price per SMS ($)' },
  promoText: '{shop} {shopPhone} {message} Reply STOP To Optout.',
  languages: [
    { id: 'en', label: 'English', lines: { greeting: 'Greeting,', /* intro, recipients, customerTypes, message, price, total, outro */ } },
    { id: 'vi', label: 'Tiếng Việt', lines: { /* ... */ }, customerTypes: { lastVisit: 'Lần ghé gần nhất <= {days} ngày', /* ... */ } }
  ]
});
```

| Trường | Ý nghĩa |
|---|---|
| `prices` | Giá mỗi SMS được chọn (chuỗi, in nguyên văn sau `$`). Giá đầu là mặc định |
| `customerTypes` | Lựa chọn Type Customer theo thứ tự hiện + in ra. `{tên}` trong `text` = ô số trên form; `values` = số mặc định (chuỗi). **Thêm lựa chọn = thêm 1 dòng.** `id` lưu trong state: không đổi id đang có |
| `labels` | Nhãn trường trên form, cũng dùng trong cảnh báo "Còn thiếu". `toggle` = chữ cạnh ô tick mở khối SMS |
| `promoText` | Mẫu tin khách nhận, in trong ngoặc kép dưới dòng Message, giống nhau ở mọi ngôn ngữ. `{shop}`, `{shopPhone}`, `{message}` thay bằng dữ liệu form |
| `languages` | Ngôn ngữ tin nhắn, theo thứ tự hiện trên form; ngôn ngữ đầu là mặc định. `id` lưu trong state: không đổi id đang có |
| `languages[].lines` | Câu chữ từng dòng tin nhắn. `{recipients}`, `{price}` thay bằng dữ liệu form, `{total}` = giá × Recipients (dòng `total` tự bỏ khi Recipients không phải số) |
| `languages[].customerTypes` | Câu Type Customer theo ngôn ngữ, key = `id` của `customerTypes`, cùng chỗ `{tên}`. Thiếu id nào thì in `text` gốc |

## 4b. SMS Shipping — `config/sms/shipping.js`

```js
setShipping({   // const { setShipping } = registry;
  labels: { merchant: 'Tên merchant', tracking: 'Tracking Number', delivery: 'Estimated Delivery' },
  lines: ['Dear {merchant},', '', 'We wanted to inform you ...', '', 'Tracking Number: {tracking}', 'Estimated Delivery: {delivery}', '', 'Important: ...']
});
```

| Trường | Ý nghĩa |
|---|---|
| `labels` | Nhãn trường trên form, cũng dùng trong cảnh báo "Còn thiếu" |
| `lines` | Từng dòng tin nhắn, `''` = dòng trống. `{merchant}`, `{tracking}`, `{delivery}` thay bằng dữ liệu form (đã trim) |

## 4c. SMS Xin review — `config/sms/review.js`

```js
setReview({   // const { setReview } = registry;
  labels: { state: 'Bang', language: 'Ngôn ngữ tin nhắn', branch: 'Chi nhánh', invalidState: 'Bang hợp lệ', staff: 'Tên nhân viên' },
  links: { Arlington: 'https://g.page/r/…/review', Atlanta: '…', Houston: '…' },
  states: [{ code: 'TX', name: 'Texas', branch: 'Arlington' } /* … */],
  languages: [{ id: 'en', label: 'English', lines: ['Greeting,', '', '… on Google: {link}', '', 'Have a nice day'] } /* … */]
});
```

| Trường | Ý nghĩa |
|---|---|
| `labels` | Nhãn trên form. `invalidState` dùng trong cảnh báo "Còn thiếu" khi gõ bang không có trong danh sách |
| `links` | Link Google review của từng chi nhánh, key = `branch`. **Đổi link = sửa 1 dòng ở đây** |
| `states` | Bang → chi nhánh. Chuyển bang sang chi nhánh khác = sửa `branch`. `branch` phải có trong `links` (test `review.test.js` báo nếu thiếu) |
| `languages` | Ngôn ngữ tin nhắn, theo thứ tự hiện trên form; ngôn ngữ đầu là mặc định. `id` lưu trong state: không đổi id đang có |
| `languages[].lines` | Từng dòng tin nhắn, `''` = dòng trống. `{link}` thay bằng link của chi nhánh phụ trách bang |

---

## 5. Cấu hình chung — `config/app.js`

| Trường | Ý nghĩa |
|---|---|
| `version` | `vYYYY-MM-DD.N`, tăng mỗi lần sửa |
| `autoCapitalize` | Tự viết hoa chữ đầu mỗi dòng |
| `debounceMs` | Độ trễ cập nhật Kết quả |
| `storageKey`, `templateKey`, `categoryKey`, `staffKey` | Key localStorage. **Không đổi** |
| `ticketFill` | Bookmark `Điền ticket`: selector ô `subject` / `description` / `comment` (ô Comment ở khung Checklist), `commentText` (`done`), nút bấm sau khi điền = phần tử `uploadLabel` có chữ `uploadText`. Đổi thì người dùng phải kéo lại bookmark |
| `categories` | Loại có sẵn (`ABC`, `CLOVER`, `PAX`, `INTERNET`) |
| `marks` | Ký hiệu checklist trong nội dung: `[x]`, `[ ]`, `[N/A]` |
| `langs` | `ENG`, `VIE` |
| `defaultConclusion` | Kết luận mặc định |
| `conclusions` | `{ value, hint, requiresAction, showInBody, relaxWhenInitial, hidesAction }` — xem REQUIREMENTS §6.3 |
| `groups` | Nhóm ở cấp 1: `ticket`, `setup`, `sms`. `hidden: true` = tạm ẩn nút của nhóm (dữ liệu, checklist giữ nguyên); xóa `hidden` là hiện lại |
| `smsKinds` | Cấp con của nhóm SMS: `shipping`, `review`; mục đầu là mặc định. Không dùng lại id `promotion`: state cũ mang id đó được chuyển sang khối SMS của `Hỗ trợ merchant`. `id` lưu trong state: không đổi id đang có. Thêm loại SMS mới cần thêm cả config + domain + form (như Shipping), không chỉ 1 dòng ở đây |
| `labels` | Nhãn các trường chung |
