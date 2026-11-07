// src/domain/review-message.js — Ghép tin nhắn SMS Xin review và kiểm tra bang đã nhập có hợp lệ không.
(function (TW) {
  'use strict';

  const { fillTemplate } = TW.domain.sms;
  const { findState } = TW.domain.review;

  /**
   * Chưa nhập bang hoặc bang không có trong danh sách => rỗng.
   * @param {{ review: object, config: object }} input
   * @returns {string}
   */
  function buildReviewMessage({ review, config }) {
    const state = findState(review.usState, config);
    if (!state) return '';
    const language = config.languages.find(item => item.id === review.lang) || config.languages[0];
    return language.lines.map(line => fillTemplate(line, { link: config.links[state.branch] })).join('\n');
  }

  /** Đã gõ bang nhưng không tìm thấy thì báo; chưa gõ gì thì chưa báo. */
  function missingReviewFields({ review, config }) {
    return review.usState.trim() && !findState(review.usState, config) ? [config.labels.invalidState] : [];
  }

  TW.domain.reviewMessage = { buildReviewMessage, missingReviewFields };
})(window.TW);
