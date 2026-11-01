// src/ui/image-panel.js — Khối Ảnh trong Kết quả: copy từng ảnh (copy xong đánh dấu ✓), tải tất cả thành ZIP hoặc PDF.
(function (TW) {
  'use strict';

  const { $, el, button, flash } = TW.ui.dom;

  function createImagePanel({ outputService, images, clipboard, openViewer }) {
    function wireDownload(node, download, failText) {
      node.addEventListener('click', async () => {
        node.disabled = true;   // ảnh lớn đóng gói mất vài giây, tránh bấm 2 lần ra 2 file
        const ok = await download();
        node.disabled = false;
        flash(node, ok ? 'Đã tải ✓' : failText, ok ? 'done' : '');
      });
    }

    wireDownload($('#imgZip'), outputService.downloadImages, 'Không tạo được file ZIP');
    wireDownload($('#imgPdf'), outputService.downloadImageReport, 'Không tạo được file PDF');

    function card({ image, label }) {
      const node = el('div', 'icard');
      const img = el('img');
      img.src = image.src;
      img.alt = label;
      img.title = 'Bấm để xem ảnh lớn';
      img.addEventListener('click', () => openViewer(image));
      const meta = el('div', 'meta');
      meta.append(el('div', '', label));
      if (image.copied) meta.append(el('div', 'tick', '✓ Đã copy'));
      const copy = button('copy' + (image.copied ? ' done' : ''), image.copied ? 'Copy lại' : 'Copy ảnh');
      copy.addEventListener('click', async () => {
        if (await clipboard.writeImage(image)) { images.markCopied(image); render(); return; }
        copy.textContent = 'Không copy được, bấm chuột phải vào ảnh → Copy image';
        copy.classList.remove('done');
      });
      node.append(img, meta, copy);
      return node;
    }

    function render() {
      const all = outputService.imageList();
      const list = $('#imgList');
      list.textContent = '';
      $('#imgPanel').hidden = !all.length;
      $('#imgStatus').textContent = all.length ? `${all.filter(x => x.image.copied).length}/${all.length} đã copy` : '';
      all.forEach(entry => list.append(card(entry)));
    }

    return { render };
  }

  TW.ui.imagePanel = { createImagePanel };
})(window.TW);
