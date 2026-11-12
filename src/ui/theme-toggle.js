// src/ui/theme-toggle.js — Nút đổi giao diện ở header. Gắn data-theme lên <html>; CSS (tokens.css) đọc thuộc tính này.
(function (TW) {
  'use strict';

  const { $ } = TW.ui.dom;
  const AUTO = 'auto';   // theo hệ điều hành => không gắn data-theme, để @media prefers-color-scheme quyết định

  function createThemeToggle({ themeService }) {
    const toggle = $('#themeBtn');

    function apply({ id, label }) {
      if (id === AUTO) delete document.documentElement.dataset.theme;
      else document.documentElement.dataset.theme = id;
      toggle.textContent = label;
    }

    toggle.addEventListener('click', () => apply(themeService.cycle()));
    apply(themeService.current());
  }

  TW.ui.themeToggle = { createThemeToggle };
})(window.TW);
