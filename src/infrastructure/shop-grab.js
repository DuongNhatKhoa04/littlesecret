// src/infrastructure/shop-grab.js — Bookmark "Lấy thông tin tiệm": chạy trên trang Lead, copy Link Lead / DBA / MID / ZIP; Ticket Writer đọc lại để điền Chuyển case.
// Ticket Writer không chạm được vào tab khác, nên đưa dữ liệu qua clipboard (chiều ngược với ticket-fill.js).
(function (TW) {
  'use strict';

  const MARK = 'ticket-writer-shop';   // đánh dấu clipboard là thông tin tiệm của Ticket Writer, không phải chữ bất kỳ

  // Chạy trên trang Lead, không phải Ticket Writer: phải tự đủ, chỉ dùng tham số (được chuyển thành chữ trong link bookmark).
  async function grabShopPage(config, mark) {
    const valueOf = (selector) => { const node = document.querySelector(selector); return node ? node.value.trim() : ''; };
    const zipShape = new RegExp(config.zipPattern);
    const zips = [...new Set([...document.querySelectorAll(config.zip)]
      .map(node => (node.dataset.value || (node.querySelector('input') || {}).value || '').trim())
      .filter(value => zipShape.test(value)))];
    // Nhiều ô chọn cùng dạng ZIP => không biết ô nào là Business ZIP: bỏ trống còn hơn lấy nhầm
    const data = { app: mark, lead: location.href, shop: valueOf(config.shop), mid: valueOf(config.mid), zip: zips.length === 1 ? zips[0] : '' };
    const labels = { shop: 'DBA', mid: 'MID', zip: 'Business ZIP' };
    const missing = Object.keys(labels).filter(id => !data[id]).map(id => labels[id]);
    if (missing.length === 3) { alert('Ticket Writer: không thấy DBA, MID, Business ZIP. Mở đúng trang Lead rồi bấm lại.'); return; }
    const text = JSON.stringify(data);
    let copied = false;
    try { await navigator.clipboard.writeText(text); copied = true; } catch (error) {
      const area = document.createElement('textarea');
      area.value = text;
      document.body.append(area);
      area.select();
      try { copied = document.execCommand('copy'); } catch (fallbackError) { copied = false; }
      area.remove();
    }
    if (!copied) { prompt('Ticket Writer: không copy được. Bấm Ctrl+C rồi OK:', text); return; }
    const found = [data.shop, data.mid && 'MID ' + data.mid, data.zip && 'ZIP ' + data.zip].filter(Boolean).join(' · ');
    alert('Ticket Writer: đã copy ' + found + (missing.length ? '\nKhông thấy: ' + missing.join(', ') : '') +
      '\nVề Ticket Writer → Chuyển case → bấm "Dán thông tin tiệm".');
  }

  /** Chữ không phải dữ liệu của bookmark (hoặc JSON hỏng) => null. */
  function parse(text) {
    let data = null;
    try { data = JSON.parse(text); } catch (error) { return null; }
    return data && data.app === MARK ? data : null;
  }

  /** @param {{ shop: string, mid: string, zip: string, zipPattern: string }} config  @returns {ShopGrab} */
  function createShopGrab(config) {
    const code = `void (${grabShopPage})(${JSON.stringify(config)}, ${JSON.stringify(MARK)})`;
    return {
      bookmarkletUrl: () => 'javascript:' + encodeURIComponent(code),
      parse,
      async read() {
        let text = '';
        try { text = await navigator.clipboard.readText(); } catch (error) { return { status: 'blocked' }; }
        const data = parse(text);
        return data ? { status: 'ok', data } : { status: 'none' };
      }
    };
  }

  TW.infra.shopGrab = { createShopGrab };
})(window.TW);
