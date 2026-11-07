// src/domain/review.js — Dữ liệu form SMS Xin review: tạo mới, làm sạch dữ liệu đọc từ storage, tìm bang.
(function (TW) {
  'use strict';

  const createEmptyReview = (config) => ({ usState: '', lang: config.languages[0].id });

  function sanitizeReview(raw, config) {
    const review = createEmptyReview(config);
    if (!raw || typeof raw !== 'object') return review;
    if (typeof raw.usState === 'string') review.usState = raw.usState;
    if (config.languages.some(language => language.id === raw.lang)) review.lang = raw.lang;
    return review;
  }

  /** Tìm theo chữ viết tắt của bang, không phân biệt hoa thường. Không có => null. */
  function findState(input, config) {
    const code = input.trim().toUpperCase();
    return config.states.find(state => state.code === code) || null;
  }

  /** Bang có chữ viết tắt bắt đầu bằng phần đã gõ, xếp A→Z. */
  function suggestStates(input, config) {
    const prefix = input.trim().toUpperCase();
    return config.states.filter(state => state.code.startsWith(prefix)).sort((a, b) => a.code.localeCompare(b.code));
  }

  TW.domain.review = { createEmptyReview, sanitizeReview, findState, suggestStates };
})(window.TW);
