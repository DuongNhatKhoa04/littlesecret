// src/domain/sms-message.js — Ghép tin nhắn xác nhận SMS Promotion và kiểm tra còn thiếu trường nào.
(function (TW) {
  'use strict';

  const { fillTemplate } = TW.domain.sms;
  const { cleanItems } = TW.domain.text;
  const BLOCK_GAP = '\n\n';
  const WRAPPING_QUOTES = /^"([\s\S]*)"$/;
  const DIGIT_GROUPING = /[,\s]/g;   // "3,178" vẫn tính được Estimate Total
  const WHOLE_NUMBER = /^\d+$/;
  const MONEY_FORMAT = { minimumFractionDigits: 2, maximumFractionDigits: 2 };

  const isBlank = (value) => !value.trim();
  const trimValues = (values) => Object.fromEntries(Object.entries(values).map(([name, value]) => [name, value.trim()]));
  const pickedTypes = (sms, config) => config.customerTypes.filter(type => sms.customerTypes[type.id].on);

  const findLanguage = (sms, config) => config.languages.find(language => language.id === sms.lang) || config.languages[0];

  /** Giá × Recipients, tính theo cent để không lệch số lẻ. Recipients không phải số nguyên => '' (bỏ dòng Estimate Total). */
  function estimateTotal(sms) {
    const recipients = sms.recipients.replace(DIGIT_GROUPING, '');
    if (!WHOLE_NUMBER.test(recipients)) return '';
    const cents = Math.round(Number(sms.price) * 100) * Number(recipients);
    return (cents / 100).toLocaleString('en-US', MONEY_FORMAT);
  }

  /** Dán cả dấu ngoặc kép từ tin mẫu thì bỏ đi, tránh ra ""…"". */
  const quoteMessage = (message) => `"${message.trim().replace(WRAPPING_QUOTES, '$1')}"`;

  const hasInput = (sms) => !isBlank(sms.shop) || !isBlank(sms.recipients) || !isBlank(sms.message) ||
    Object.values(sms.customerTypes).some(type => type.on) || cleanItems(sms.customOptions).length > 0;

  /**
   * Chưa nhập gì => rỗng. Câu chữ theo ngôn ngữ đã chọn. Type Customer: mục có sẵn theo thứ tự config (không theo thứ tự tick), rồi tới option tự thêm.
   * @param {{ sms: object, config: object }} input
   * @returns {string}
   */
  function buildSmsMessage({ sms, config }) {
    if (!hasInput(sms)) return '';
    const language = findLanguage(sms, config);
    const { lines } = language;
    const total = estimateTotal(sms);
    const fill = (line) => fillTemplate(line, { shop: sms.shop.trim(), recipients: sms.recipients.trim(), price: sms.price, total });
    const typeText = (type) => (language.customerTypes || {})[type.id] || type.text;
    const customerTypes = [
      ...pickedTypes(sms, config).map(type => fillTemplate(typeText(type), trimValues(sms.customerTypes[type.id].values))),
      ...cleanItems(sms.customOptions)
    ].map(text => '- ' + text);
    const details = [
      fill(lines.recipients), lines.customerTypes, ...customerTypes, lines.message, quoteMessage(sms.message), fill(lines.price),
      ...(total ? [fill(lines.total)] : [])
    ].join('\n');
    return [fill(lines.greeting), lines.intro, details, lines.outro].join(BLOCK_GAP);
  }

  /** Nhãn các trường còn thiếu, theo thứ tự trên form. Type Customer thiếu khi chưa tick / chưa thêm option nào, hoặc mục đã tick còn ô số trống. */
  function missingSmsFields({ sms, config }) {
    const picked = pickedTypes(sms, config);
    const nothingChosen = !picked.length && !cleanItems(sms.customOptions).length;
    const typesMissing = nothingChosen || picked.some(type => Object.values(sms.customerTypes[type.id].values).some(isBlank));
    return [
      ['shop', isBlank(sms.shop)], ['recipients', isBlank(sms.recipients)],
      ['customerTypes', typesMissing], ['message', isBlank(sms.message)]
    ].filter(([, missing]) => missing).map(([field]) => config.labels[field]);
  }

  TW.domain.smsMessage = { buildSmsMessage, missingSmsFields };
})(window.TW);
