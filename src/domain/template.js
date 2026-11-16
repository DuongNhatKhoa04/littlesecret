// src/domain/template.js — Template: tạo từ ticket, áp vào ticket, tìm kiếm, gộp khi nhập file.
(function (TW) {
  'use strict';

  const { cleanItems, normalizeForSearch, asString } = TW.domain.text;
  const { copyBlocks, findConclusion } = TW.domain.ticket;


  function isValidTemplate(template, typeExists) {
    return !!template && typeof template.name === 'string' && !!template.name.trim() &&
      typeExists(template.type) && !!template.ticket && typeof template.ticket === 'object';
  }

  /** Template không lưu Phone, trạng thái checklist, ảnh. */
  function createTemplate({ name, typeKey, ticket, blockKeys, now }) {
    const blocks = {};
    blockKeys.forEach(key => {
      const items = cleanItems(ticket.blocks[key] || []);
      blocks[key] = items.length ? items : [''];
    });
    return {
      name, type: typeKey, updated: now,
      ticket: { category: ticket.category.trim(), summary: ticket.summary.trim(), conclusion: ticket.conclusion, blocks }
    };
  }

  /** Kết luận khi dùng template; giá trị đã bỏ khỏi config (vd Workaround applied) => mặc định. */
  const templateConclusion = (template, app) =>
    findConclusion(app, template.ticket.conclusion) ? template.ticket.conclusion : app.defaultConclusion;

  /** Ghi đè Loại, Tóm tắt, Kết luận, các mục; giữ Phone, ngôn ngữ, checklist. */
  function applyTemplate(ticket, template, { app, blockKeys }) {
    const source = template.ticket;
    return {
      ...ticket,
      category: asString(source.category),
      summary: asString(source.summary),
      conclusion: templateConclusion(template, app),
      blocks: copyBlocks(source.blocks, blockKeys)
    };
  }

  /** Chỉ tìm trong Tóm tắt (phần sau "LOẠI - " của title); khớp mọi từ, không phân biệt dấu; sắp theo tên. */
  function searchTemplates(templates, query) {
    const tokens = normalizeForSearch(query).split(/\s+/).filter(Boolean);
    return templates
      .filter(template => {
        const summary = normalizeForSearch(asString(template.ticket.summary));
        return tokens.every(t => summary.includes(t));
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /** Thêm hoặc thay template cùng tên. */
  function upsertTemplate(templates, template) {
    const index = templates.findIndex(t => t.name === template.name);
    if (index < 0) return [...templates, template];
    return templates.map((t, i) => i === index ? template : t);
  }

  function mergeTemplates(templates, incoming, typeExists) {
    const valid = incoming.filter(template => isValidTemplate(template, typeExists));
    let list = templates, added = 0, replaced = 0;
    valid.forEach(template => {
      if (list.some(t => t.name === template.name)) replaced++; else added++;
      list = upsertTemplate(list, template);
    });
    return { list, added, replaced, skipped: incoming.length - valid.length };
  }

  TW.domain.template = { isValidTemplate, createTemplate, templateConclusion, applyTemplate, searchTemplates, upsertTemplate, mergeTemplates };
})(window.TW);
