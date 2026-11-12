// src/application/phone-service.js — Nhận ảnh iPhone / iPad qua phone-upload: hỏi định kỳ, có ảnh thì giao cho mục đang nhận ảnh.
(function (TW) {
  'use strict';

  const { parsePhoneLink, inboxUrl } = TW.domain.phoneLink;

  /** off: chưa bật · on: đang nhận · lost: không gọi được phone-upload (chưa chạy / sai link) */
  const STATUS = Object.freeze({ off: 'off', on: 'on', lost: 'lost' });
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  /**
   * @param {{ context: object, storage: KeyValueStore, inbox: PhoneInbox, isReady: () => boolean, onFile: (file: File) => void, sleep?: (ms: number) => Promise<void> }} deps
   *   isReady: có mục nhận ảnh không (vd SMS Shipping không có) — không có thì để ảnh chờ ở phone-upload, không lấy về rồi bỏ
   */
  function createPhoneService({ context, storage, inbox, isReady, onFile, sleep = wait }) {
    const { phoneKey, phoneUpload } = context.app;
    const saved = storage.read(phoneKey) || {};
    let link = typeof saved.link === 'string' && parsePhoneLink(saved.link) ? saved.link : '';
    let enabled = saved.enabled === true;
    let status = STATUS.off;
    let run = 0;   // mỗi lần bật / tắt tăng 1 => vòng hỏi cũ tự dừng
    const listeners = new Set();
    const notify = (event) => listeners.forEach(listener => listener(event));

    function setStatus(next) {
      if (status === next) return;
      status = next;
      notify('status');
    }

    function persist() { storage.write(phoneKey, { link, enabled }); }

    async function poll(id, url) {
      while (id === run) {
        if (!isReady()) { await sleep(phoneUpload.pollMs); continue; }
        const { ok, file } = await inbox.next(url);
        if (file) { onFile(file); notify('received'); }   // đã lấy khỏi hàng chờ => luôn giao, kể cả vừa bấm tắt
        if (id !== run) return;
        // Lỗi => dừng hẳn, không hỏi lại liên tục (mỗi lần hỏi hỏng Chrome ghi 1 lỗi đỏ trong Console); bấm nút để thử lại
        if (!ok) { run++; setStatus(STATUS.lost); return; }
        if (!file) await sleep(phoneUpload.pollMs);   // có ảnh thì hỏi tiếp ngay: iPhone thường gửi nhiều ảnh 1 lúc
      }
    }

    function start() {
      const parsed = parsePhoneLink(link);
      if (!parsed) return false;
      run++;
      setStatus(STATUS.on);
      poll(run, inboxUrl(parsed));
      return true;
    }

    return {
      status: () => status,
      link: () => link,
      /** Lưu link và bắt đầu nhận. false = không phải link phone-upload */
      connect(text) {
        if (!parsePhoneLink(text)) return false;
        link = String(text).trim();
        enabled = true;
        persist();
        return start();
      },
      stop() {
        run++;
        enabled = false;
        persist();
        setStatus(STATUS.off);
      },
      /** Mở trang: lần trước đang bật thì bật lại */
      resume() { if (enabled) start(); },
      /** listener(event): 'status' = đổi trạng thái, 'received' = vừa nhận 1 ảnh */
      subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
    };
  }

  TW.application.phoneService = { createPhoneService, STATUS };
})(window.TW);
