// tests/catch-errors.js — Ghi lỗi JS lúc tải trang ra màn hình (lỗi cú pháp ở file khác không hiện trong danh sách test). Load đầu tiên.
(function () {
  'use strict';

  window.addEventListener('error', (event) => {
    const row = document.createElement('li');
    row.className = 'fail';
    row.textContent = `✗ LỖI TẢI: ${event.message} (${(event.filename || '').split('/').slice(-2).join('/')}:${event.lineno})`;
    document.getElementById('results').append(row);
    document.title = 'FAIL load';
  });
})();
