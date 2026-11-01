// src/ui/dom.js — Hàm dựng DOM dùng chung. Chỉ dùng textContent, không innerHTML.
(function (TW) {
  'use strict';

  const FLASH_MS = 1500;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  /** skipTab: nút phụ trong form không nhận Tab để Tab đi thẳng qua các ô nhập. */
  function button(className, text, { title, ariaLabel, onClick, disabled = false, skipTab = false } = {}) {
    const node = el('button', className, text);
    node.type = 'button';
    if (title) node.title = title;
    if (ariaLabel) node.setAttribute('aria-label', ariaLabel);
    if (skipTab) node.tabIndex = -1;
    node.disabled = disabled;
    if (onClick) node.addEventListener('click', onClick);
    return node;
  }

  function link({ label, url }) {
    const node = el('a', '', `(${label})`);
    node.href = url;
    node.target = '_blank';
    node.rel = 'noopener noreferrer';
    return node;
  }

  function fileInput({ accept, multiple, onFiles }) {
    const input = el('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = multiple;
    input.hidden = true;
    input.addEventListener('change', () => { onFiles([...input.files]); input.value = ''; });
    return input;
  }

  function autoGrow(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 2 + 'px';
  }

  /** Đổi chữ nút trong chốc lát rồi trả lại chữ cũ. */
  function flash(node, text, className) {
    if (!node.dataset.label) node.dataset.label = node.textContent;
    node.textContent = text;
    if (className) node.classList.add(className);
    clearTimeout(node.flashTimer);
    node.flashTimer = setTimeout(() => {
      node.textContent = node.dataset.label;
      if (className) node.classList.remove(className);
    }, FLASH_MS);
  }

  /** Nhóm radio dạng thẻ. options: [{ value, label, hint? }] */
  function choiceGroup({ name, options, value, onChange }) {
    const wrap = el('div', 'choices');
    options.forEach(option => {
      const card = el('label', 'choice');
      const radio = el('input');
      radio.type = 'radio';
      radio.name = name;
      radio.value = option.value;
      radio.checked = option.value === value;
      radio.addEventListener('change', () => onChange(option.value));
      const text = el('div');
      text.append(el('b', '', option.label));
      if (option.hint) text.append(el('span', '', option.hint));
      card.append(radio, text);
      wrap.append(card);
    });
    return wrap;
  }

  /** Hàng nút chọn 1. options: [{ id, label }] */
  function segmented({ options, value, onSelect, ariaLabel }) {
    const wrap = el('div', 'seg');
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', ariaLabel);
    options.forEach(option => {
      const node = button('', option.label, { onClick: () => onSelect(option.id) });
      node.setAttribute('aria-pressed', String(option.id === value));
      wrap.append(node);
    });
    return wrap;
  }

  /** Nhận ảnh kéo thả vào target. */
  function acceptImageDrop(target, onFiles) {
    target.addEventListener('dragover', (event) => {
      if (![...event.dataTransfer.types].includes('Files')) return;
      event.preventDefault();
      target.classList.add('dropping');
    });
    target.addEventListener('dragleave', () => target.classList.remove('dropping'));
    target.addEventListener('drop', (event) => {
      target.classList.remove('dropping');
      const files = [...event.dataTransfer.files].filter(file => file.type.startsWith('image/'));
      if (!files.length) return;
      event.preventDefault();
      onFiles(files);
    });
  }

  /** Đang gõ dấu bằng bộ gõ (Unikey/IME): không xử lý phím. */
  const isComposing = (event) => event.isComposing || event.keyCode === 229;

  /** Điểm dừng Tab như trình duyệt: bỏ ô ẩn/khóa/tabIndex âm; nhóm radio chỉ dừng ở ô đang chọn (chưa chọn thì ô đầu). */
  function isTabStop(node, root) {
    if (node.tabIndex < 0 || node.disabled || !node.getClientRects().length) return false;
    if (node.type !== 'radio') return true;
    const group = $$('input[type="radio"]', root).filter(radio => radio.name === node.name);
    return node.checked || (!group.some(radio => radio.checked) && group[0] === node);
  }

  /** Enter ở ô 1 dòng: sang ô kế tiếp trong root, giống Tab. */
  function focusNext(from, root) {
    const stops = $$('input, textarea, button, [tabindex]', root).filter(node => node === from || isTabStop(node, root));
    const next = stops[stops.indexOf(from) + 1];
    if (next) next.focus();
  }

  TW.ui.dom = { $, $$, el, button, link, fileInput, autoGrow, flash, choiceGroup, segmented, acceptImageDrop, isComposing, focusNext };
})(window.TW);
