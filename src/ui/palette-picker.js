// src/ui/palette-picker.js — Chọn màu giao diện trong menu Khác: dòng "Đã chọn: …" + ô tròn tô màu. Gắn data-palette lên <html>; CSS (styles/palette-*.css) đọc thuộc tính này.
(function (TW) {
  'use strict';

  const { $, el } = TW.ui.dom;

  function createPalettePicker({ paletteService }) {
    const group = $('#paletteSeg');

    function apply(palette) {
      if (paletteService.isDefault(palette)) delete document.documentElement.dataset.palette;
      else document.documentElement.dataset.palette = palette.id;
      $('#paletteName').textContent = palette.label;
      [...group.children].forEach(node => node.setAttribute('aria-pressed', String(node.dataset.palette === palette.id)));
    }

    /** Ô tròn chỉ có màu; tên màu ở title / aria-label (rê chuột, trình đọc màn hình) và dòng "Đã chọn". */
    function swatch(palette) {
      const option = el('button', 'swatch');
      Object.assign(option, { type: 'button', title: palette.label });
      option.setAttribute('aria-label', palette.label);
      option.dataset.palette = palette.id;
      option.style.background = palette.swatch;
      option.addEventListener('click', () => apply(paletteService.select(palette.id)));
      return option;
    }

    group.append(...paletteService.list().map(swatch));
    apply(paletteService.current());
  }

  TW.ui.palettePicker = { createPalettePicker };
})(window.TW);
