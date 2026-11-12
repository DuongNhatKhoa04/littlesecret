// src/ui/paste-handler.js — Ctrl+V ảnh ở bất kỳ đâu: dán vào mục đang đứng, không thì mục focus gần nhất, không thì mục đầu.
// Trả target() để ảnh từ nguồn khác (iPhone qua phone-upload) vào cùng mục như Ctrl+V.
(function (TW) {
  'use strict';

  /** Mục chứa phần tử: mục checklist / ô dán ảnh có data-img-key, ô nhập ý có data-key. */
  function imageKeyOf(node) {
    if (!node || !node.closest) return null;
    const holder = node.closest('[data-img-key]');
    if (holder) return holder.dataset.imgKey;
    return node.dataset && node.dataset.key ? node.dataset.key : null;
  }

  const isTextInput = (node) => !!node && (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA' || node.isContentEditable);

  function installPasteHandler({ outputService, imageZone }) {
    let lastKey = null;   // mục được focus gần nhất

    document.addEventListener('focusin', (event) => {
      const key = imageKeyOf(event.target);
      if (key) lastKey = key;
    });

    document.addEventListener('paste', (event) => {
      const items = [...(event.clipboardData ? event.clipboardData.items : [])];
      const files = items.filter(i => i.kind === 'file' && i.type.startsWith('image/')).map(i => i.getAsFile()).filter(Boolean);
      if (!files.length) return;
      if (items.some(i => i.kind === 'string' && i.type === 'text/plain')) return;   // clipboard có cả chữ => dán chữ như thường
      let key = imageKeyOf(event.target);
      if (!key) {
        if (isTextInput(event.target) || document.querySelector('dialog[open]')) return;
        key = outputService.pasteTarget(lastKey);
      }
      if (!key) return;
      event.preventDefault();
      imageZone.addFiles(key, files);
    });

    /** Mục nhận ảnh khi không đứng trong mục nào. null = màn hình hiện tại không có mục nhận ảnh */
    return { target: () => outputService.pasteTarget(lastKey) };
  }

  TW.ui.pasteHandler = { installPasteHandler };
})(window.TW);
