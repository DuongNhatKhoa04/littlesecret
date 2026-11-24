// src/infrastructure/clipboard.js — Copy chữ / ảnh và đọc ảnh từ clipboard. Lỗi quyền hoặc trình duyệt không hỗ trợ => trả kết quả an toàn.
(function (TW) {
  'use strict';

  const PNG = 'image/png';
  const TEXT = 'text/plain';
  const HTML = 'text/html';

  // Dự phòng khi Clipboard API bị chặn: chọn chữ trong textarea ẩn rồi execCommand('copy').
  function copyWithTextarea(text) {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.append(area);
    area.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (error) { ok = false; }
    area.remove();
    return ok;
  }

  // Dự phòng khi Clipboard API bị chặn: execCommand('copy') rồi tự đặt cả chữ thường và HTML trong sự kiện copy.
  function copyRichWithEvent(text, html) {
    const fill = (event) => {
      event.clipboardData.setData('text/plain', text);
      event.clipboardData.setData('text/html', html);
      event.preventDefault();
    };
    document.addEventListener('copy', fill);
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (error) { ok = false; }
    document.removeEventListener('copy', fill);
    return ok;
  }

  const textBlob = (text, type) => new Blob([text], { type });

  // Clipboard chỉ nhận image/png; ảnh chụp màn hình vốn là PNG nên thường không phải chuyển.
  function toPngBlob(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d').drawImage(img, 0, 0);
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('png')), PNG);
      };
      img.onerror = () => reject(new Error('image'));
      img.src = src;
    });
  }

  /** @returns {TextClipboard & RichClipboard & ImageClipboard} */
  function createClipboard() {
    return {
      async writeText(text) {
        try { await navigator.clipboard.writeText(text); return true; } catch (error) { return copyWithTextarea(text); }
      },
      async writeRich(text, html) {
        try {
          await navigator.clipboard.write([new ClipboardItem({ [TEXT]: textBlob(text, TEXT), [HTML]: textBlob(html, HTML) })]);
          return true;
        } catch (error) { return copyRichWithEvent(text, html); }
      },
      async writeImage(image) {
        try {
          const blob = image.blob && image.blob.type === PNG ? Promise.resolve(image.blob) : toPngBlob(image.src);
          await navigator.clipboard.write([new ClipboardItem({ [PNG]: blob })]);
          return true;
        } catch (error) { return false; }
      },
      async readImages() {
        try {
          if (!navigator.clipboard || !navigator.clipboard.read) return null;
          const files = [];
          for (const item of await navigator.clipboard.read()) {
            const type = item.types.find(t => t.startsWith('image/'));
            if (type) files.push(new File([await item.getType(type)], 'paste.' + type.split('/')[1], { type }));
          }
          return files;
        } catch (error) { return null; }
      }
    };
  }

  TW.infra.clipboard = { createClipboard };
})(window.TW);
