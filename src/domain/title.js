// src/domain/title.js — Ghép title từ Loại + Tóm tắt; tách/nối danh sách Loại.
(function (TW) {
  'use strict';

  const SEPARATOR = ' - ';

  /** "abc - Clover" → ["ABC", "CLOVER"] */
  const parseCategories = (category) =>
    category.split(/\s+-\s+/).map(tag => tag.trim().toUpperCase()).filter(Boolean);

  const joinCategories = (tags) => tags.join(SEPARATOR);

  /** Có Loại: "LOẠI - TÓM TẮT" (dấu " - " hiện sẵn kể cả khi chưa có tóm tắt); không có: "TÓM TẮT". */
  function buildTitle({ category, summary }) {
    const cleanCategory = category.trim().replace(/[\s-]+$/, '');
    const cleanSummary = summary.trim();
    return (cleanCategory ? cleanCategory + SEPARATOR + cleanSummary : cleanSummary).toUpperCase();
  }

  /** Title theo loại ticket: loại noCategory (không có ô Loại) bỏ Loại đang lưu, chỉ còn Tóm tắt. */
  const ticketTitle = (type, ticket) => buildTitle(type && type.noCategory ? { ...ticket, category: '' } : ticket);

  TW.domain.title = { parseCategories, joinCategories, buildTitle, ticketTitle };
})(window.TW);
