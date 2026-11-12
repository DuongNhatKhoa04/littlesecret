// src/infrastructure/image-store.js — ImageStore trên IndexedDB: giữ ảnh qua lần tải lại trang. localStorage quá nhỏ cho ảnh gốc.
// IndexedDB có thể bị chặn / đầy => không bao giờ throw ra ngoài, app vẫn chạy với ảnh chỉ trong bộ nhớ.
(function (TW) {
  'use strict';

  const STORE = 'images';   // 1 bản ghi = danh sách ảnh của 1 mục, key = key mục
  const DB_VERSION = 1;

  const requestResult = (request) => new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  /** @param {string} dbName  @returns {ImageStore} */
  function createImageStore(dbName) {
    let db = null;

    function open() {
      if (!db) {
        const request = window.indexedDB.open(dbName, DB_VERSION);
        request.onupgradeneeded = () => request.result.createObjectStore(STORE);
        db = requestResult(request);
      }
      return db;
    }

    /** Chạy action trong 1 transaction, chờ ghi xong hẳn rồi mới trả kết quả của action. */
    async function run(mode, action) {
      const transaction = (await open()).transaction(STORE, mode);
      const result = action(transaction.objectStore(STORE));
      await new Promise((resolve, reject) => {
        transaction.oncomplete = resolve;
        transaction.onerror = transaction.onabort = () => reject(transaction.error);
      });
      return result;
    }

    return {
      async loadAll() {
        try {
          const [keys, values] = await run('readonly', store => [store.getAllKeys(), store.getAll()]);
          return Object.fromEntries(keys.result.map((key, i) => [key, values.result[i]]));
        } catch (error) { return {}; }
      },
      async save(key, images) {
        try { await run('readwrite', store => images.length ? store.put(images, key) : store.delete(key)); return true; } catch (error) { return false; }
      },
      async clear() {
        try { await run('readwrite', store => store.clear()); return true; } catch (error) { return false; }
      }
    };
  }

  TW.infra.imageStore = { createImageStore };
})(window.TW);
