// src/ui/phone-dialog.js — Hộp Nhận ảnh iOS: mã QR để iPad / iPhone quét mở trang gửi ảnh, giờ hết hạn, Đổi mã ngay, Tắt.
(function (TW) {
  'use strict';

  const { $ } = TW.ui.dom;
  const { encodeQr } = TW.domain.qrCode;

  const MODULE_PX = 8;
  const QUIET_ZONE = 4;   // viền trắng 4 ô theo chuẩn, thiếu thì camera khó nhận
  // Luôn đen trên trắng, kể cả giao diện tối: nhiều camera không đọc được mã QR đảo màu
  const QR_DARK = '#000000';
  const QR_LIGHT = '#ffffff';
  const LOADING = 'Đang lấy mã…';
  const NO_SERVER = 'Không gọi được phone-upload. Mở phone-upload.bat rồi bấm nút Nhận ảnh iOS lại.';
  const NO_LAN = 'Máy tính chưa vào mạng LAN / Wi-Fi nên iPad không kết nối được.';
  const CONFIRM_RENEW = 'Đổi mã iPad? Trang gửi ảnh đang mở trên iPad sẽ không gửi được nữa, phải quét mã mới.';

  const pad = (value) => String(value).padStart(2, '0');
  const formatTime = (date) => `${pad(date.getHours())}:${pad(date.getMinutes())} ${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;

  function drawQr(canvas, grid) {
    const side = (grid.length + QUIET_ZONE * 2) * MODULE_PX;
    canvas.width = side;
    canvas.height = side;
    const context = canvas.getContext('2d');
    context.fillStyle = QR_LIGHT;
    context.fillRect(0, 0, side, side);
    context.fillStyle = QR_DARK;
    grid.forEach((row, y) => row.forEach((isDark, x) => {
      if (isDark) context.fillRect((x + QUIET_ZONE) * MODULE_PX, (y + QUIET_ZONE) * MODULE_PX, MODULE_PX, MODULE_PX);
    }));
  }

  function createPhoneDialog({ phoneService }) {
    const dialog = $('#phoneDlg');
    const canvas = $('#phoneQr');

    function showMessage(text) {
      canvas.hidden = true;
      $('#phoneLinkText').textContent = '';
      $('#phoneExpiry').textContent = text;
    }

    async function show(loadLink) {
      showMessage(LOADING);
      const { ok, urls, expiresAt } = await loadLink();
      if (!ok) { showMessage(NO_SERVER); return; }
      const grid = urls.length ? encodeQr(urls[0]) : null;
      if (!grid) { showMessage(NO_LAN); return; }
      drawQr(canvas, grid);
      canvas.hidden = false;
      $('#phoneLinkText').textContent = urls.join('\n');
      $('#phoneExpiry').textContent = `Mã hết hạn lúc ${formatTime(new Date(expiresAt))}, sau đó bấm nút Nhận ảnh iOS để lấy mã mới.`;
    }

    $('#phoneClose').addEventListener('click', () => dialog.close());
    $('#phoneStop').addEventListener('click', () => { phoneService.stop(); dialog.close(); });
    $('#phoneRenew').addEventListener('click', () => { if (confirm(CONFIRM_RENEW)) show(phoneService.renewIpadLink); });

    return {
      open() {
        if (!dialog.open) dialog.showModal();
        show(phoneService.ipadLink);
      }
    };
  }

  TW.ui.phoneDialog = { createPhoneDialog };
})(window.TW);
