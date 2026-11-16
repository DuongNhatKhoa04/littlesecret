// src/domain/sms-message.js — Ghép tin nhắn xác nhận SMS Promotion và kiểm tra còn thiếu trường nào.
(function (TW) {
  'use strict';

  const { fillTemplate } = TW.domain.sms;
  const { cleanItems, isBlank, formatPhoneInput } = TW.domain.text;
  const BLOCK_GAP = '\n\n';
  const WRAPPING_QUOTES = /^"([\s\S]*)"$/;
  const LINE_BREAK = /[ \t]*\r?\n[ \t]*/g;
  const ESCAPED_NEWLINE = '\\n';   // bản copy tin SMS: xuống dòng => 2 ký tự \n, dính liền 2 dòng
  const DIGIT_GROUPING = /[,\s]/g;   // "3,178" vẫn tính được Estimate Total
  const WHOLE_NUMBER = /^\d+$/;
  const PHONE_PUNCTUATION = /[\s().+-]/g;
  const US_PHONE = /^1?\d{10}$/;
  const MONEY_FORMAT = { minimumFractionDigits: 2, maximumFractionDigits: 2 };

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

  /** Số Mỹ 10 số (có thể có 1 hoặc +1 đầu), gõ kiểu nào cũng ra (555) 123-4567; không đúng dạng đó (dữ liệu lưu trước khi ô có mask) thì in như đã gõ. */
  const formatPhone = (phone) => US_PHONE.test(phone.replace(PHONE_PUNCTUATION, '')) ? formatPhoneInput(phone) : phone.trim();

  /** Tin khách nhận theo mẫu promoText, bọc ngoặc kép. Message dán cả dấu ngoặc kép từ tin mẫu thì bỏ đi, tránh ngoặc lồng nhau. */
  function promoText(sms, config, lineBreak) {
    const message = sms.message.trim().replace(WRAPPING_QUOTES, '$1').replace(LINE_BREAK, lineBreak);
    return fillTemplate(config.promoText, { shop: sms.shop.trim(), shopPhone: formatPhone(sms.shopPhone), message });
  }

  /** Trong tin gửi tiệm: xuống dòng thật, để merchant đọc đúng như sẽ nhận. */
  const promoMessage = (sms, config) => `"${promoText(sms, config, '\n')}"`;

  /** Nút Copy Confirm SMS: 1 dòng, không ngoặc kép, xuống dòng thành \n để dán vào hệ thống gửi SMS. */
  const buildPromoText = ({ sms, config }) => promoText(sms, config, ESCAPED_NEWLINE);

  const hasInput = (sms) => !isBlank(sms.shop) || !isBlank(sms.shopPhone) || !isBlank(sms.recipients) || !isBlank(sms.message) ||
    Object.values(sms.customerTypes).some(type => type.on) || cleanItems(sms.customOptions).length > 0;

  /**
   * Chi tiết từ Recipients tới hết Message (không có giá): in vào mục Đã support của ticket, và là phần giữa tin nhắn gửi tiệm.
   * Chưa nhập gì => rỗng. Câu chữ theo ngôn ngữ đã chọn. Type Customer: mục có sẵn theo thứ tự config (không theo thứ tự tick), rồi tới option tự thêm.
   * @param {{ sms: object, config: object }} input
   * @returns {string}
   */
  function buildSmsDetails({ sms, config }) {
    if (!hasInput(sms)) return '';
    const language = findLanguage(sms, config);
    const { lines } = language;
    const typeText = (type) => (language.customerTypes || {})[type.id] || type.text;
    const customerTypes = [
      ...pickedTypes(sms, config).map(type => fillTemplate(typeText(type), trimValues(sms.customerTypes[type.id].values))),
      ...cleanItems(sms.customOptions)
    ].map(text => '- ' + text);
    return [
      fillTemplate(lines.recipients, { recipients: sms.recipients.trim() }), lines.customerTypes, ...customerTypes, lines.message, promoMessage(sms, config)
    ].join('\n');
  }

  /** Price per SMS + Estimate Total: chỉ có trong tin gửi tiệm, không vào ticket. Không tính được tổng thì bỏ dòng tổng. */
  function priceLines(sms, lines) {
    const total = estimateTotal(sms);
    return [fillTemplate(lines.price, { price: sms.price }), ...(total ? [fillTemplate(lines.total, { total })] : [])];
  }

  /** Tin nhắn gửi tiệm: lời chào, chi tiết, giá, lời dặn. Chưa nhập gì => rỗng. */
  function buildSmsMessage({ sms, config }) {
    const details = buildSmsDetails({ sms, config });
    if (!details) return '';
    const { lines } = findLanguage(sms, config);
    return [lines.greeting, lines.intro, [details, ...priceLines(sms, lines)].join('\n'), lines.outro].join(BLOCK_GAP);
  }

  /** Nhãn các trường còn thiếu, theo thứ tự trên form. Type Customer thiếu khi chưa tick / chưa thêm option nào, hoặc mục đã tick còn ô số trống. */
  function missingSmsFields({ sms, config }) {
    const picked = pickedTypes(sms, config);
    const nothingChosen = !picked.length && !cleanItems(sms.customOptions).length;
    const typesMissing = nothingChosen || picked.some(type => Object.values(sms.customerTypes[type.id].values).some(isBlank));
    return [
      ['shop', isBlank(sms.shop)], ['shopPhone', isBlank(sms.shopPhone)], ['recipients', isBlank(sms.recipients)],
      ['customerTypes', typesMissing], ['message', isBlank(sms.message)]
    ].filter(([, missing]) => missing).map(([field]) => config.labels[field]);
  }

  TW.domain.smsMessage = { buildSmsDetails, buildSmsMessage, buildPromoText, missingSmsFields };
})(window.TW);
