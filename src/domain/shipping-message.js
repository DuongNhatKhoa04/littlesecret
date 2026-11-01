// src/domain/shipping-message.js — Ghép tin nhắn SMS Shipping và kiểm tra còn thiếu trường nào.
(function (TW) {
  'use strict';

  const { fillTemplate } = TW.domain.sms;
  const { FIELDS } = TW.domain.shipping;

  const isBlank = (value) => !value.trim();
  const trimValues = (shipping) => Object.fromEntries(FIELDS.map(field => [field, shipping[field].trim()]));

  /**
   * Chưa nhập gì => rỗng.
   * @param {{ shipping: object, config: object }} input
   * @returns {string}
   */
  function buildShippingMessage({ shipping, config }) {
    if (FIELDS.every(field => isBlank(shipping[field]))) return '';
    const values = trimValues(shipping);
    return config.lines.map(line => fillTemplate(line, values)).join('\n');
  }

  /** Nhãn các trường còn thiếu, theo thứ tự trên form. */
  function missingShippingFields({ shipping, config }) {
    return FIELDS.filter(field => isBlank(shipping[field])).map(field => config.labels[field]);
  }

  TW.domain.shippingMessage = { buildShippingMessage, missingShippingFields };
})(window.TW);
