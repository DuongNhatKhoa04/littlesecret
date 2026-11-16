// src/domain/shipping-message.js — Ghép tin nhắn SMS Shipping và kiểm tra còn thiếu trường nào.
(function (TW) {
  'use strict';

  const { fillTemplate } = TW.domain.sms;
  const { FIELDS } = TW.domain.shipping;
  const { isBlank } = TW.domain.text;

  /**
   * Chưa nhập gì => rỗng.
   * @param {{ shipping: object, config: object }} input
   * @returns {string}
   */
  function buildShippingMessage({ shipping, config }) {
    if (FIELDS.every(field => isBlank(shipping[field]))) return '';
    const values = Object.fromEntries(FIELDS.map(field => [field, shipping[field].trim()]));
    return config.lines.map(line => fillTemplate(line, values)).join('\n');
  }

  /** Nhãn các trường còn thiếu, theo thứ tự trên form. */
  function missingShippingFields({ shipping, config }) {
    return FIELDS.filter(field => isBlank(shipping[field])).map(field => config.labels[field]);
  }

  TW.domain.shippingMessage = { buildShippingMessage, missingShippingFields };
})(window.TW);
