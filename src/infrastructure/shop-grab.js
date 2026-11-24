// src/infrastructure/shop-grab.js — Bookmark "Lấy thông tin tiệm": chạy trên trang ticket (Link Ticket / Tên tiệm / MID / nội dung) hoặc Lead (Link Lead / DBA / MID / ZIP), copy lại; Ticket Writer đọc lại để điền Chuyển case.
// Ticket Writer không chạm được vào tab khác, nên đưa dữ liệu qua clipboard (chiều ngược với ticket-fill.js).
(function (TW) {
  'use strict';

  const MARK = 'ticket-writer-shop';   // đánh dấu clipboard là thông tin tiệm của Ticket Writer, không phải chữ bất kỳ

  // Chạy trên trang portal, không phải Ticket Writer: phải tự đủ, chỉ dùng tham số (được chuyển thành chữ trong link bookmark).
  // Trang ticket (có dòng `Ticket #… for <Tên tiệm> / <MID>`) => Link Ticket; không thì coi là trang Lead => Link Lead + ZIP.
  async function grabShopPage(config, mark) {
    function fromTicket() {
      const header = document.querySelector(config.ticketHeader);
      const match = header && header.textContent.replace(/\s+/g, ' ').trim().match(new RegExp(config.ticketPattern));
      if (!match) return null;
      // innerText giữ xuống dòng của nội dung nhiều đoạn (textContent dính liền các đoạn)
      const description = document.querySelector(config.description);
      const issue = description ? description.innerText.replace(/\n{3,}/g, '\n\n').trim() : '';
      return { data: { ticket: location.href, shop: match[1].trim(), mid: match[2], issue }, labels: { shop: 'Tên tiệm', mid: 'MID', issue: 'Nội dung' } };
    }
    function fromLead() {
      const valueOf = (selector) => { const node = document.querySelector(selector); return node ? node.value.trim() : ''; };
      const zipShape = new RegExp(config.zipPattern);
      const zips = [...new Set([...document.querySelectorAll(config.zip)]
        .map(node => (node.dataset.value || (node.querySelector('input') || {}).value || '').trim())
        .filter(value => zipShape.test(value)))];
      // Nhiều ô chọn cùng dạng ZIP => không biết ô nào là Business ZIP: bỏ trống còn hơn lấy nhầm
      const data = { lead: location.href, shop: valueOf(config.shop), mid: valueOf(config.mid), zip: zips.length === 1 ? zips[0] : '' };
      return { data, labels: { shop: 'DBA', mid: 'MID', zip: 'Business ZIP' } };
    }
    async function copy(text) {
      try { await navigator.clipboard.writeText(text); return true; } catch (error) {
        const area = document.createElement('textarea');
        area.value = text;
        document.body.append(area);
        area.select();
        let copied = false;
        try { copied = document.execCommand('copy'); } catch (fallbackError) { copied = false; }
        area.remove();
        return copied;
      }
    }
    const { data, labels } = fromTicket() || fromLead();
    const missing = Object.keys(labels).filter(id => !data[id]).map(id => labels[id]);
    if (missing.length === Object.keys(labels).length) { alert('Ticket Writer: không thấy Tên tiệm, MID. Mở đúng trang ticket / Lead rồi bấm lại.'); return; }
    const text = JSON.stringify({ app: mark, ...data });
    if (!await copy(text)) { prompt('Ticket Writer: không copy được. Bấm Ctrl+C rồi OK:', text); return; }
    const found = [data.shop, data.mid && 'MID ' + data.mid, data.zip && 'ZIP ' + data.zip].filter(Boolean).join(' · ');
    alert('Ticket Writer: đã copy ' + found + (data.ticket ? ' + link ticket' : ' + link lead') + (data.issue ? ' + nội dung' : '') + (missing.length ? '\nKhông thấy: ' + missing.join(', ') : '') +
      '\nVề Ticket Writer → Chuyển case → bấm Ctrl+V.');
  }

  /** Chữ không phải dữ liệu của bookmark (hoặc JSON hỏng) => null. */
  function parse(text) {
    let data = null;
    try { data = JSON.parse(text); } catch (error) { return null; }
    return data && data.app === MARK ? data : null;
  }

  /** @param {{ ticketHeader: string, ticketPattern: string, description: string, shop: string, mid: string, zip: string, zipPattern: string }} config  @returns {ShopGrab} */
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
