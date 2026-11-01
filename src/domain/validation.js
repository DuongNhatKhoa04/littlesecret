// src/domain/validation.js — Điều kiện được copy nội dung: đủ mục đề xuất bắt buộc, đủ ảnh checklist.
(function (TW) {
  'use strict';

  const { cleanItems } = TW.domain.text;
  const { isConclusionSection } = TW.domain.ticket;
  const { allItems, itemStatus } = TW.domain.checklist;

  const isEmptySection = (section, ticket) => cleanItems(ticket.blocks[section.key] || []).length === 0;

  /** Đã có nội dung ở mục nào ngoài mục đầu tiên và Note chưa (tức là đã qua bước đầu). */
  function isPastFirstStep(type, ticket) {
    const inputSections = type.sections.filter(section => !isConclusionSection(section));
    return inputSections.slice(1).some(section => !section.note && !isEmptySection(section, ticket));
  }

  /** Kết luận cần hành động đề xuất mà mục đó còn trống. */
  function isActionMissing({ type, ticket, conclusion }) {
    if (!conclusion || !conclusion.requiresAction) return false;
    const missing = type.sections.some(section => section.actionFor && isEmptySection(section, ticket));
    if (!missing) return false;
    return !conclusion.relaxWhenInitial || isPastFirstStep(type, ticket);
  }

  /** Số mục checklist chưa N/A mà chưa đủ ảnh (0 nếu checklist không bắt buộc ảnh). */
  function countMissingImages({ type, ticket, imageCounts }) {
    if (!type.checklist || !type.checklist.requireImages) return 0;
    return allItems(type.checklist).filter(item => itemStatus(item, ticket.chk, imageCounts).missing).length;
  }

  const canCopyBody = ({ body, missingAction, missingImages }) => !!body && !missingAction && missingImages === 0;

  TW.domain.validation = { isActionMissing, countMissingImages, canCopyBody };
})(window.TW);
