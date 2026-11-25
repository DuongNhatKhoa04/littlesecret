// src/domain/text.js — Xử lý chữ: viết hoa đầu dòng, gạch đầu dòng, chuẩn hóa để tìm kiếm.
(function (TW) {
  'use strict';

  // Từ đầu chứa các ký tự này trông như link/email/đường dẫn/tên file => giữ nguyên
  const PATH_LIKE = /[/\\@:_.]/;

  /** Viết hoa chữ cái đầu dòng, trừ link/email/tên file hoặc từ đã có chữ hoa bên trong (iPhone). */
  function capitalizeLine(line) {
    const match = /^(\s*)(\S+)([\s\S]*)$/.exec(line);
    if (!match) return line;
    const [, lead, word, rest] = match;
    if (!/^\p{Ll}/u.test(word) || PATH_LIKE.test(word) || /\p{Lu}/u.test(word.slice(1))) return line;
    const first = word[0].toUpperCase();
    if (first.length !== 1) return line;   // vd "ß" → "SS" làm đổi độ dài, lệch con trỏ
    return lead + first + word.slice(1) + rest;
  }

  const capitalizeLines = (text) => text.split('\n').map(capitalizeLine).join('\n');

  /** Tên người: viết hoa chữ cái đầu mỗi từ (đầu chuỗi / sau khoảng trắng), không đổi phần còn lại (giữ McDonald). */
  const capitalizeWords = (text) => text.replace(/(^|\s)(\p{Ll})/gu, (all, lead, letter) => {
    const upper = letter.toUpperCase();
    return lead + (upper.length === 1 ? upper : letter);   // "ß" → "SS" làm đổi độ dài, lệch con trỏ
  });

  /** Bỏ ý trống, trim từng ý. */
  const cleanItems = (items) => items.map(item => item.trim()).filter(Boolean);

  /** 1 ý → "- dòng 1" + các dòng sau thụt 2 khoảng trắng. */
  function bulletize(text) {
    const lines = text.trim().split('\n').map(line => line.trim()).filter(Boolean);
    return '- ' + lines[0] + lines.slice(1).map(line => '\n  ' + line).join('');
  }

  /** Bỏ dấu tiếng Việt, giữ nguyên hoa/thường. */
  const removeDiacritics = (text) =>
    text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');

  /** Bỏ dấu tiếng Việt + viết thường để so khớp khi tìm. */
  const normalizeForSearch = (text) => removeDiacritics(text).toLowerCase();

  /**
   * Gợi ý của ô Loại / Tóm tắt: giữ mục BẮT ĐẦU bằng chữ đang gõ (khớp lần lượt từ ký tự đầu, không phân biệt dấu / hoa thường),
   * sắp theo bảng chữ cái tiếng Việt. Ô trống => mọi mục.
   */
  function searchSuggestions(items, query) {
    const prefix = normalizeForSearch(query.trim());
    return items.filter(item => normalizeForSearch(item).startsWith(prefix)).sort((a, b) => a.localeCompare(b, 'vi'));
  }

  /** Tên Loại người dùng gõ: gộp khoảng trắng, bỏ " - " (là dấu nối giữa các Loại), viết HOA. */
  const cleanCategory = (text) => text.trim().replace(/\s+-\s+/g, ' ').replace(/\s+/g, ' ').toUpperCase();

  /** Chuỗi trống / chỉ có khoảng trắng. */
  const isBlank = (value) => !value.trim();

  /** Dữ liệu đọc từ storage / file có thể sai kiểu: không phải chuỗi thì thành ''. */
  const asString = (value) => typeof value === 'string' ? value : '';

  /** 7 => "07" (ngày, giờ trong tên file / mã). */
  const pad2 = (value) => String(value).padStart(2, '0');

  const US_PHONE_DIGITS = 10;

  /** Ô Phone: chỉ giữ số, tối đa 10 số, gõ tới đâu format tới đó: "(111", "(111) 111", "(111) 111-1111". Dán "+1 555…" (11 số, đầu 1) thì bỏ số 1. */
  function formatPhoneInput(text) {
    let digits = text.replace(/\D/g, '');
    if (digits.length === US_PHONE_DIGITS + 1 && digits[0] === '1') digits = digits.slice(1);
    digits = digits.slice(0, US_PHONE_DIGITS);
    if (!digits) return '';
    if (digits.length <= 3) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  TW.domain.text = { isBlank, asString, pad2, formatPhoneInput, capitalizeLine, capitalizeLines, capitalizeWords, cleanItems, bulletize, removeDiacritics, normalizeForSearch, searchSuggestions, cleanCategory };
})(window.TW);
