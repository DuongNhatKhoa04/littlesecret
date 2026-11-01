// src/ui/image-viewer.js — Xem ảnh lớn: trước/sau (← →), kích thước gốc / vừa khung, Esc hoặc bấm nền để đóng.
(function (TW) {
  'use strict';

  const { $ } = TW.ui.dom;
  const FIT = 'Xem kích thước gốc';
  const FULL = 'Vừa khung';

  function createImageViewer({ outputService }) {
    const dialog = $('#imgDlg');
    let entries = [];
    let index = 0;

    function show() {
      const entry = entries[index];
      if (!entry) return;
      $('#vImg').src = entry.image.src;
      $('#vImg').alt = entry.label;
      $('#vCap').textContent = entry.label;
      $('#vCount').textContent = `${index + 1}/${entries.length}`;
      $('#vBody').classList.remove('full');
      $('#vSize').textContent = FIT;
      $('#vBody').scrollTo(0, 0);
      $('#vPrev').disabled = $('#vNext').disabled = entries.length < 2;
    }

    function step(delta) {
      if (entries.length < 2) return;
      index = (index + delta + entries.length) % entries.length;
      show();
    }

    function toggleSize() {
      const full = $('#vBody').classList.toggle('full');
      $('#vSize').textContent = full ? FULL : FIT;
    }

    function open(image) {
      entries = outputService.imageList();
      index = Math.max(0, entries.findIndex(entry => entry.image === image));
      show();
      if (!dialog.open) dialog.showModal();
    }

    $('#vClose').addEventListener('click', () => dialog.close());
    $('#vPrev').addEventListener('click', () => step(-1));
    $('#vNext').addEventListener('click', () => step(1));
    $('#vSize').addEventListener('click', toggleSize);
    $('#vImg').addEventListener('click', toggleSize);
    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });   // bấm nền để đóng
    dialog.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1); }
      else if (event.key === 'ArrowRight') { event.preventDefault(); step(1); }
    });

    return { open };
  }

  TW.ui.imageViewer = { createImageViewer };
})(window.TW);
