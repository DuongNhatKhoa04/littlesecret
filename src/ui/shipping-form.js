// src/ui/shipping-form.js — Khu Nhập của SMS Shipping: Tên merchant, Tracking Number, Estimated Delivery (chọn ngày).
(function (TW) {
  'use strict';

  const { el } = TW.ui.dom;
  const { FIELDS, DATE_FIELDS } = TW.domain.shipping;

  function createShippingForm({ root, context, session, shippingService }) {
    const { labels } = context.shipping;

    function field(name) {
      const wrap = el('div', 'field');
      const input = el('input', 'text');
      const type = DATE_FIELDS.includes(name) ? 'date' : 'text';
      Object.assign(input, { id: 'ship_' + name, type, value: session.shipping()[name], autocomplete: 'off' });
      input.addEventListener('input', () => shippingService.setField(name, input.value));
      const label = el('label', '', labels[name]);
      label.htmlFor = input.id;
      wrap.append(label, input);
      return wrap;
    }

    function build() {
      root.textContent = '';
      root.append(...FIELDS.map(field));
    }

    // Ô nhập tự giữ giá trị khi gõ, không có phần nào phụ thuộc trường khác => không cần cập nhật lại form.
    const sync = () => {};

    return { build, sync };
  }

  TW.ui.shippingForm = { createShippingForm };
})(window.TW);
