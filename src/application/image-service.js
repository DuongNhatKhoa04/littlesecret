// src/application/image-service.js — Ảnh của từng mục, chỉ giữ trong bộ nhớ (mất khi tải lại trang, cố ý).
(function (TW) {
  'use strict';

  const { itemIdFromImageKey } = TW.domain.checklist;

  /**
   * @param {{ files: FileAdapter, onChecklistImage: (itemId: string) => void }} deps
   */
  function createImageService({ files, onChecklistImage }) {
    let images = {};   // key mục -> StoredImage[]
    const listeners = new Set();
    const notify = (key) => listeners.forEach(listener => listener(key));

    async function add(key, fileList) {
      const target = images[key] = images[key] || [];
      let failed = 0;
      for (const file of fileList) {
        const src = await files.readAsDataUrl(file);   // đọc nguyên file gốc, không nén
        if (src) target.push({ src, blob: file, copied: false }); else failed++;
      }
      const itemId = itemIdFromImageKey(key);
      if (itemId && target.length) onChecklistImage(itemId);
      notify(key);
      return { failed };
    }

    return {
      add,
      list: (key) => images[key] || [],
      counts() {
        const counts = {};
        Object.keys(images).forEach(key => { counts[key] = images[key].length; });
        return counts;
      },
      remove(key, index) { (images[key] || []).splice(index, 1); notify(key); },
      markCopied(image) { image.copied = true; notify(null); },
      /** key = chỉ xóa ảnh của mục đó (vd Ticket mới ở SMS Promotion); không truyền = xóa hết. */
      clear(key) {
        if (key) delete images[key]; else images = {};
        notify(key || null);
      },
      /** listener(key): key = mục vừa đổi, null = nhiều mục */
      subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
    };
  }

  TW.application.imageService = { createImageService };
})(window.TW);
