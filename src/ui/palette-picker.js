// src/ui/palette-picker.js — Chọn màu giao diện trong menu Khác. Gắn data-palette lên <html>; CSS (styles/palette-*.css) đọc thuộc tính này.
(function (TW) {
  'use strict';

  const { $, el } = TW.ui.dom;

  function createPalettePicker({ paletteService }) {
    const group = $('#paletteSeg');

    function apply(palette) {
      if (paletteService.isDefault(palette)) delete document.documentElement.dataset.palette;
      else document.documentElement.dataset.palette = palette.id;
      [...group.children].forEach(node => node.setAttribute('aria-pressed', String(node.dataset.palette === palette.id)));
    }

    paletteService.list().forEach(palette => {
      const option = el('button', 'menu-item palette-option', palette.label);
      option.type = 'button';
      option.dataset.palette = palette.id;
      option.addEventListener('click', () => apply(paletteService.select(palette.id)));
      group.append(option);
    });
    apply(paletteService.current());
  }

  TW.ui.palettePicker = { createPalettePicker };
})(window.TW);
