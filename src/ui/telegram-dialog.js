// src/ui/telegram-dialog.js — Nút "Gửi Telegram" (Chuyển case, Alt+G) + hộp xem trước: group, tin, số ảnh; dán token / tên lần đầu; xác nhận mới gửi.
(function (TW) {
  'use strict';

  const { $, flash } = TW.ui.dom;
  const TEXT = {
    title: 'Gửi vào group ',
    photos: (count) => (count ? `Kèm ${count} ảnh Issue (gửi ngay dưới tin).` : 'Không kèm ảnh.'),
    badToken: 'Token chưa đúng dạng <số>:<chuỗi>. Dán đúng nguyên token, không thêm chữ "bot", không khoảng trắng.',
    sending: 'Đang gửi…',
    sent: 'Đã gửi ✓',
    textOnly: 'Tin chữ ĐÃ vào group, ảnh chưa gửi được (đừng gửi lại cả tin): ',
    forget: 'Xóa token bot trên máy này? Muốn gửi tiếp phải dán lại token.'
  };
  const CLOSE_AFTER_MS = 900;
  const SHORTCUT_KEY = 'g';

  /** @param {{ session: object, telegramService: object, staffService: object, hidden: boolean }} deps   hidden: tạm ẩn (config telegram.hidden) */
  function createTelegramDialog({ session, telegramService, staffService, hidden }) {
    const dialog = $('#tgDlg');
    const button = $('#sendTg');
    const send = $('#tgSend');
    const status = (text) => { $('#tgStatus').textContent = text; };

    function render() {
      const draft = telegramService.draft();
      $('#tgTitle').textContent = TEXT.title + draft.group;
      $('#tgPreview').textContent = draft.text;
      $('#tgPhotos').textContent = TEXT.photos(draft.photoCount);
      $('#tgProblem').textContent = draft.problem;
      $('#tgProblem').hidden = !draft.problem;
      $('#tgTokenRow').hidden = telegramService.hasToken();
      $('#tgForget').hidden = !telegramService.hasToken();
      send.disabled = !!draft.problem;
    }

    function open() {
      $('#tgName').value = staffService.name();
      $('#tgToken').value = '';
      status('');
      render();
      dialog.showModal();
      const empty = [$('#tgToken'), $('#tgName')].find(input => !input.closest('[hidden]') && !input.value);
      (empty || send).focus();
    }

    async function submit() {
      send.disabled = true;
      status(TEXT.sending);
      const result = await telegramService.send();
      if (result.ok) {
        status(TEXT.sent);
        flash(button, TEXT.sent, 'done');
        setTimeout(() => dialog.close(), CLOSE_AFTER_MS);
        return;
      }
      status(result.textSent ? TEXT.textOnly + result.error : result.error);
      send.disabled = false;
    }

    // Token đúng dạng thì lưu ngay và xóa khỏi ô (không để token nằm trên màn hình)
    $('#tgToken').addEventListener('input', (event) => {
      const value = event.target.value.trim();
      if (telegramService.saveToken(value)) { event.target.value = ''; status(''); render(); } else status(value ? TEXT.badToken : '');
    });
    $('#tgName').addEventListener('input', (event) => { staffService.setName(event.target.value); render(); });
    $('#tgForget').addEventListener('click', () => { if (confirm(TEXT.forget)) { telegramService.clearToken(); render(); $('#tgToken').focus(); } });
    send.addEventListener('click', submit);
    $('#tgClose').addEventListener('click', () => dialog.close());
    button.addEventListener('click', open);
    // Alt+G mở hộp xem trước như bấm nút, không gửi thẳng: tin ra Internet nên vẫn xác nhận (Enter ở nút Gửi).
    // Không xét nút đang khóa: nút cập nhật trễ khi đang gõ, còn hộp tự tính lại và báo lý do chưa gửi được.
    document.addEventListener('keydown', (event) => {
      if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.key.toLowerCase() !== SHORTCUT_KEY) return;
      if (hidden || !session.isPassCase() || dialog.open) return;
      event.preventDefault();
      open();
    });

    /** Gọi mỗi lần khu Kết quả vẽ lại: nút chỉ có ở Chuyển case, khóa khi tin chưa copy được. */
    function renderButton(result) {
      button.hidden = hidden || !session.isPassCase();
      button.disabled = !result.canCopyBody;
    }

    return { renderButton };
  }

  TW.ui.telegramDialog = { createTelegramDialog };
})(window.TW);
