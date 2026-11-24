// src/domain/backup.js — File sao lưu gợi ý Tóm tắt, gợi ý tên người support thêm, template để chuyển sang máy / trình duyệt khác.
(function (TW) {
  'use strict';

  const { asString, pad2 } = TW.domain.text;

  const FORMAT = 'ticket-writer-backup';   // nhận ra đúng file sao lưu khi khôi phục
  const FORMAT_VERSION = 1;
  const FILE_PREFIX = 'ticket-writer-backup-';

  /** ticket-writer-backup-YYYYMMDD-HHmm.json theo giờ máy. */
  const backupFileName = (date) => FILE_PREFIX + `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}-` +
    `${pad2(date.getHours())}${pad2(date.getMinutes())}.json`;

  /**
   * @param {{ savedAt: number, appVersion: string, data: Object<string, any> }} input   data: key storage => giá trị; chưa có dữ liệu thì bỏ key
   */
  function createBackupFile({ savedAt, appVersion, data }) {
    const kept = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== null && value !== undefined));
    return { format: FORMAT, version: FORMAT_VERSION, savedAt, appVersion, data: kept };
  }

  /**
   * Chỉ nhận key trong allowedKeys (file sửa tay / bản khác thêm key lạ thì bỏ). Không đúng dạng => null.
   * @returns {{ appVersion: string, savedAt: number, data: Object<string, any> } | null}
   */
  function parseBackupFile(raw, allowedKeys) {
    if (!raw || typeof raw !== 'object' || raw.format !== FORMAT || !raw.data || typeof raw.data !== 'object') return null;
    const data = Object.fromEntries(allowedKeys.filter(key => key in raw.data && raw.data[key] !== null).map(key => [key, raw.data[key]]));
    return { appVersion: asString(raw.appVersion), savedAt: Number(raw.savedAt) || 0, data };
  }

  TW.domain.backup = { backupFileName, createBackupFile, parseBackupFile };
})(window.TW);
