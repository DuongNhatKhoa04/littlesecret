// src/infrastructure/ticket-fill.js — Điền Subject / Description / Comment (Checklist) rồi bấm Upload File(s) trên trang ticket bằng bookmarklet.
// Ticket Writer không chạm được vào tab khác, nên đưa dữ liệu qua clipboard; bookmarklet chạy trên tab ticket đọc lại rồi điền.
(function (TW) {
  'use strict';

  const MARK = 'ticket-writer-fill';   // đánh dấu clipboard là dữ liệu của Ticket Writer, không phải chữ bất kỳ

  // Chạy trên trang ticket, không phải Ticket Writer: phải tự đủ, chỉ dùng tham số (được chuyển thành chữ trong link bookmark).
  async function fillTicketPage(config, mark) {
    const fail = (message) => alert('Ticket Writer: ' + message);
    let text = '';
    try { text = await navigator.clipboard.readText(); } catch (error) {
      text = prompt('Không đọc được clipboard. Dán (Ctrl+V) vào đây rồi bấm OK:') || '';
    }
    let data = null;
    try { data = JSON.parse(text); } catch (error) { data = null; }
    if (!data || data.app !== mark) { fail('Clipboard chưa có ticket. Bấm "Copy để điền" ở Ticket Writer trước.'); return; }
    const label = [...document.querySelectorAll(config.uploadLabel)].find(node => node.textContent.trim() === config.uploadText);
    const found = {
      Subject: document.querySelector(config.subject),
      Description: document.querySelector(config.description),
      [config.uploadText]: label ? label.closest('button, [role="button"], a') || label : null
    };
    const missing = Object.keys(found).filter(name => !found[name]);
    // Thiếu ô nào thì không điền gì: tránh điền nửa chừng trên nhầm trang
    if (missing.length) { fail(`Không thấy ${missing.join(', ')}. Mở đúng tab ticket rồi bấm lại.`); return; }
    // Ô Comment chỉ có khi ticket có khung Checklist: không có thì bỏ qua, không báo
    const comment = document.querySelector(config.comment);
    const fields = [[found.Subject, data.subject], [found.Description, data.description]];
    if (comment) fields.push([comment, config.commentText]);
    fields.forEach(([node, value]) => {
      // Form React giữ giá trị riêng: gán qua setter gốc rồi phát sự kiện thì form mới nhận
      Object.getOwnPropertyDescriptor(Object.getPrototypeOf(node), 'value').set.call(node, value);
      node.dispatchEvent(new Event('input', { bubbles: true }));
      node.dispatchEvent(new Event('change', { bubbles: true }));
    });
    found[config.uploadText].click();
  }

  /** @param {{ subject: string, description: string, comment: string, commentText: string, uploadLabel: string, uploadText: string }} config  @returns {TicketFill} */
  function createTicketFill(config) {
    const code = `void (${fillTicketPage})(${JSON.stringify(config)}, ${JSON.stringify(MARK)})`;
    return {
      payload: (title, body) => JSON.stringify({ app: MARK, subject: title, description: body }),
      bookmarkletUrl: () => 'javascript:' + encodeURIComponent(code)
    };
  }

  TW.infra.ticketFill = { createTicketFill };
})(window.TW);
