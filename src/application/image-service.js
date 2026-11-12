// src/application/image-service.js — Ảnh của từng mục: giữ trong bộ nhớ, lưu kèm vào ImageStore để tải lại trang không mất.
(function (TW) {
  'use strict';

  const { itemIdFromImageKey } = TW.domain.checklist;

  /** Không truyền ImageStore (vd trong test) => ảnh chỉ trong bộ nhớ. */
  const MEMORY_ONLY = { loadAll: async () => ({}), save: async () => true, clear: async () => true };
  const NO_NOTICES = { toggle: () => {} };
  const SAVE_FAILED = 'imageSaveFailed';

  /**
   * @param {{ files: FileAdapter, imageStore?: ImageStore, notices?: { toggle: Function }, onChecklistImage: (itemId: string) => void }} deps
   */
  function createImageService({ files, imageStore = MEMORY_ONLY, notices = NO_NOTICES, onChecklistImage }) {
    let images = {};   // key mục -> StoredImage[]
    let clearCount = 0;
    const listeners = new Set();
    const notify = (key) => listeners.forEach(listener => listener(key));
    const unsavedKeys = new Set();   // mục có ảnh chưa lưu được => tải lại trang sẽ mất

    async function persist(key) {
      const saved = await imageStore.save(key, (images[key] || []).map(({ blob, copied }) => ({ blob, copied })));
      if (saved) unsavedKeys.delete(key); else unsavedKeys.add(key);
      notices.toggle(SAVE_FAILED, unsavedKeys.size > 0);
    }

    async function toStoredImage(saved) {
      if (!saved || !(saved.blob instanceof Blob)) return null;   // dữ liệu hỏng => bỏ ảnh đó
      const src = await files.readAsDataUrl(saved.blob);
      return src ? { src, blob: saved.blob, copied: saved.copied === true } : null;
    }

    async function restore() {
      const clearsBefore = clearCount;
      const saved = await imageStore.loadAll();
      for (const [key, list] of Object.entries(saved)) {
        if (!Array.isArray(list)) continue;
        const restored = (await Promise.all(list.map(toStoredImage))).filter(Boolean);
        if (restored.length) images[key] = restored;
      }
      // Bấm Ticket mới / mở file offline trong lúc đang nạp => ảnh cũ không còn thuộc ticket này
      if (clearCount !== clearsBefore) images = {};
      notify(null);
    }
    // Ticket đang nhập (tick checklist) đã lưu ở localStorage nên nạp ảnh không cần tick lại
    const ready = restore().catch(() => notify(null));

    async function add(key, fileList) {
      await ready;   // thêm ảnh trước khi nạp xong thì không bị ảnh đã lưu ghi đè
      const target = images[key] = images[key] || [];
      let failed = 0;
      for (const file of fileList) {
        const src = await files.readAsDataUrl(file);   // đọc nguyên file gốc, không nén
        if (src) target.push({ src, blob: file, copied: false }); else failed++;
      }
      const itemId = itemIdFromImageKey(key);
      if (itemId && target.length) onChecklistImage(itemId);
      persist(key);
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
      remove(key, index) { (images[key] || []).splice(index, 1); persist(key); notify(key); },
      markCopied(image) {
        image.copied = true;
        const key = Object.keys(images).find(name => images[name].includes(image));
        if (key) persist(key);
        notify(null);
      },
      clear() {
        images = {};
        clearCount++;
        unsavedKeys.clear();
        notices.toggle(SAVE_FAILED, false);
        ready.then(() => imageStore.clear());
        notify(null);
      },
      /** listener(key): key = mục vừa đổi, null = nhiều mục */
      subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
    };
  }

  TW.application.imageService = { createImageService };
})(window.TW);
