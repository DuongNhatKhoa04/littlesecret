// src/domain/shipping-message.js — Ghép tin nhắn SMS Shipping và kiểm tra còn thiếu trường nào.
(function (TW) {
  'use strict';

  const { fillTemplate } = TW.domain.sms;
  const { FIELDS, DATE_FIELDS } = TW.domain.shipping;

  const isBlank = (value) => !value.trim();

  /** "2026-11-04" → "Wednesday, November 4, 2026" (theo config.dateLocale). Tính theo UTC để không lệch ngày theo múi giờ máy. */
  function formatDate(isoDate, config) {
    const [year, month, day] = isoDate.split('-').map(Number);
    return new Intl.DateTimeFormat(config.dateLocale, { ...config.dateFormat, timeZone: 'UTC' })
      .format(new Date(Date.UTC(year, month - 1, day)));
  }

  const valueOf = (field, shipping, config) => {
    const value = shipping[field].trim();
    return DATE_FIELDS.includes(field) && value ? formatDate(value, config) : value;
  };

  /**
   * Chưa nhập gì => rỗng.
   * @param {{ shipping: object, config: object }} input
   * @returns {string}
   */
  function buildShippingMessage({ shipping, config }) {
    if (FIELDS.every(field => isBlank(shipping[field]))) return '';
    const values = Object.fromEntries(FIELDS.map(field => [field, valueOf(field, shipping, config)]));
    return config.lines.map(line => fillTemplate(line, values)).join('\n');
  }

  /** Nhãn các trường còn thiếu, theo thứ tự trên form. */
  function missingShippingFields({ shipping, config }) {
    return FIELDS.filter(field => isBlank(shipping[field])).map(field => config.labels[field]);
  }

  TW.domain.shippingMessage = { buildShippingMessage, missingShippingFields };
})(window.TW);
