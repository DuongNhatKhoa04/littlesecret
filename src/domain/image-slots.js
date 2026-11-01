// src/domain/image-slots.js — Các chỗ gắn ảnh của 1 loại ticket và nhãn của chúng.
(function (TW) {
  'use strict';

  const { imageKey } = TW.domain.checklist;
  const { isConclusionSection } = TW.domain.ticket;

  const SEPARATOR = ' – ';
  const NOTE = /\s*\([^)]*\)/g;   // ghi chú cách làm trong ngoặc ở tên nhóm: "(nếu có)", "(làm theo thứ tự)"…

  const withoutNotes = (text) => text.replace(NOTE, '').trim();
  const sameText = (a, b) => a.toLocaleLowerCase() === b.toLocaleLowerCase();

  /**
   * Tên ngắn cho ảnh (không dùng cho nội dung ticket): bỏ ghi chú trong ngoặc ở nhóm/parent,
   * không lặp khi tên mục trùng tên nhóm (vd "Setup terminal – Setup terminal").
   */
  function checklistLabel(group, item) {
    const parts = [withoutNotes(group.title), item.parent && withoutNotes(item.parent), item.text].filter(Boolean);
    return parts.filter((part, i) => i === 0 || !sameText(part, parts[i - 1])).join(SEPARATOR);
  }

  const sectionSlots = (type) => type.sections
    .filter(section => !isConclusionSection(section))
    .map(section => ({ key: section.key, label: section.label }));

  function checklistSlots(type) {
    if (!type.checklist) return [];
    return type.checklist.groups.flatMap(group => group.items
      .filter(item => !item.noImage)
      .map(item => ({ key: imageKey(item.id), label: checklistLabel(group, item) })));
  }

  /** Theo thứ tự hiện trong nội dung: checklist trước, rồi các mục. */
  const imageSlots = (type) => [...checklistSlots(type), ...sectionSlots(type)];

  /** Mục chỉ có 1 ảnh thì không cần đánh số. */
  const imageLabel = (slot, index, total) => (total > 1 ? `${slot.label}${SEPARATOR}ảnh ${index + 1}` : slot.label);

  /** Chỗ dán ảnh mặc định khi không đứng ở mục nào: mục nhập đầu tiên. */
  function defaultImageKey(type) {
    const first = sectionSlots(type)[0] || imageSlots(type)[0];
    return first ? first.key : null;
  }

  TW.domain.imageSlots = { imageSlots, imageLabel, defaultImageKey };
})(window.TW);
