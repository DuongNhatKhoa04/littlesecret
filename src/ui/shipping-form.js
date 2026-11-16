// src/ui/shipping-form.js — Khu Nhập của SMS Shipping: Tên merchant, Tracking Number, Estimated Delivery.
(function (TW) {
  'use strict';

  const { labeledField, textInput } = TW.ui.dom;
  const { FIELDS } = TW.domain.shipping;

  function createShippingForm({ root, context, session, shippingService }) {
    const { labels } = context.shipping;

    const field = (name) => labeledField(labels[name],
      textInput({ id: 'ship_' + name, value: session.shipping()[name], onInput: (value) => shippingService.setField(name, value) }));

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
