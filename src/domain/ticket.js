// src/domain/ticket.js — Hình dạng dữ liệu 1 ticket: tạo mới, làm sạch dữ liệu đọc từ storage.
(function (TW) {
  'use strict';

  const { cleanItems } = TW.domain.text;
  const TEXT_FIELDS = ['category', 'summary', 'phone', 'merchant'];

  const isConclusionSection = (section) => section.kind === 'conclusion';
  const isStringList = (value) => Array.isArray(value) && value.length > 0 && value.every(x => typeof x === 'string');

  /** Key các mục nhập ý của mọi loại. Cùng key dùng chung dữ liệu => đổi loại vẫn giữ nội dung. */
  const collectBlockKeys = (types) => [...new Set(types.flatMap(type =>
    type.sections.filter(section => !isConclusionSection(section)).map(section => section.key)))];

  /** Chép các mục từ nguồn; mục thiếu/sai kiểu thành 1 ý trống. */
  function copyBlocks(source, blockKeys) {
    const blocks = {};
    blockKeys.forEach(key => {
      const items = source && source[key];
      blocks[key] = isStringList(items) ? items.slice() : [''];
    });
    return blocks;
  }

  function createEmptyTicket({ app, blockKeys }) {
    return {
      category: '', summary: '', phone: '', merchant: '', lang: app.langs[0], conclusion: app.defaultConclusion,
      blocks: copyBlocks(null, blockKeys), chk: {}
    };
  }

  function copyChecks(source) {
    const checks = {};
    if (!source || typeof source !== 'object') return checks;
    Object.keys(source).forEach(id => {
      const value = source[id];
      if (value && typeof value === 'object') checks[id] = { done: value.done === true, na: value.na === true };
    });
    return checks;
  }

  const findConclusion = (app, value) => app.conclusions.find(c => c.value === value) || null;

  /** Mục actionFor bị ẩn (không hiện trên form, không in) khi kết luận có hidesAction. */
  const isSectionHidden = (section, conclusion) => !!section.actionFor && !!conclusion && !!conclusion.hidesAction;

  /** Dữ liệu đọc từ storage có thể cũ/hỏng: giữ phần hợp lệ, còn lại lấy mặc định. */
  function sanitizeTicket(raw, { app, blockKeys }) {
    const ticket = createEmptyTicket({ app, blockKeys });
    if (!raw || typeof raw !== 'object') return ticket;
    TEXT_FIELDS.forEach(field => { if (typeof raw[field] === 'string') ticket[field] = raw[field]; });
    if (app.langs.includes(raw.lang)) ticket.lang = raw.lang;
    if (findConclusion(app, raw.conclusion)) ticket.conclusion = raw.conclusion;
    ticket.blocks = copyBlocks(raw.blocks, blockKeys);
    ticket.chk = copyChecks(raw.chk);
    return ticket;
  }

  const hasAnyContent = (ticket, blockKeys) => !!(ticket.category.trim() || ticket.summary.trim() ||
    blockKeys.some(key => cleanItems(ticket.blocks[key] || []).length));

  TW.domain.ticket = {
    isConclusionSection, collectBlockKeys, copyBlocks, createEmptyTicket, sanitizeTicket, findConclusion, isSectionHidden, hasAnyContent
  };
})(window.TW);
