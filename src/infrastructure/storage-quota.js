// src/infrastructure/storage-quota.js — StorageQuota: hỏi trình duyệt đã dùng bao nhiêu dung lượng (localStorage + IndexedDB) trên tổng cho phép.
(function (TW) {
  'use strict';

  /** @returns {StorageQuota} */
  function createStorageQuota() {
    return {
      async estimate() {
        try {
          const { usage, quota } = await navigator.storage.estimate();
          return { usage, quota };
        } catch (error) { return null; }   // trình duyệt không hỗ trợ => không cảnh báo sắp đầy
      }
    };
  }

  TW.infra.storageQuota = { createStorageQuota };
})(window.TW);
