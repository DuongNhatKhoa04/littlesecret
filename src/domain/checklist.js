// src/domain/checklist.js — Trạng thái từng mục checklist: tick, N/A, cần bao nhiêu ảnh, tiến độ.
(function (TW) {
  'use strict';

  const IMAGE_KEY_PREFIX = 'chk:';
  const NOT_CHECKED = Object.freeze({ done: false, na: false });

  const imageKey = (itemId) => IMAGE_KEY_PREFIX + itemId;
  const itemIdFromImageKey = (key) => key.startsWith(IMAGE_KEY_PREFIX) ? key.slice(IMAGE_KEY_PREFIX.length) : null;

  /** noImage => 0, minImages => n, mặc định 1. */
  const requiredImages = (item) => item.noImage ? 0 : (item.minImages || 1);

  /** Mục con in ra "Cha – Con". */
  const itemLabel = (item) => item.parent ? `${item.parent} – ${item.text}` : item.text;

  const checkOf = (checks, itemId) => checks[itemId] || NOT_CHECKED;
  const imageCountOf = (imageCounts, itemId) => imageCounts[imageKey(itemId)] || 0;

  function itemStatus(item, checks, imageCounts) {
    const check = checkOf(checks, item.id);
    const need = requiredImages(item);
    const have = imageCountOf(imageCounts, item.id);
    return { done: check.done, na: check.na, need, have, missing: !check.na && have < need };
  }

  const allItems = (checklist) => checklist.groups.flatMap(group => group.items);

  /** required = số mục cần ảnh (chưa N/A), ok = số mục đó đã đủ ảnh. */
  function progress(checklist, checks, imageCounts) {
    const result = { required: 0, ok: 0, na: 0 };
    allItems(checklist).forEach(item => {
      const status = itemStatus(item, checks, imageCounts);
      if (status.na) result.na++;
      else if (status.need) { result.required++; if (!status.missing) result.ok++; }
    });
    return result;
  }

  const isGroupAllNa = (group, checks) => group.items.every(item => checkOf(checks, item.id).na);

  /** Đã đụng tới checklist chưa (có tick, N/A hoặc ảnh ở bất kỳ mục nào). */
  const isTouched = (checklist, checks, imageCounts) => allItems(checklist).some(item => {
    const check = checkOf(checks, item.id);
    return check.done || check.na || imageCountOf(imageCounts, item.id) > 0;
  });

  TW.domain.checklist = {
    imageKey, itemIdFromImageKey, requiredImages, itemLabel, checkOf, itemStatus, allItems, progress, isGroupAllNa, isTouched
  };
})(window.TW);
