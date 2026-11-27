// src/infrastructure/shop-grab.js — Bookmark "Lấy thông tin tiệm": chạy trên trang ticket (Link Ticket / Tên tiệm / MID / nội dung), My Merchant (link trang / Tên tiệm / MID) hoặc Lead (Link Lead / DBA / MID), copy lại; Ticket Writer đọc lại để điền Chuyển case.
// Ticket Writer không chạm được vào tab khác, nên đưa dữ liệu qua clipboard (chiều ngược với ticket-fill.js).
(function (TW) {
  'use strict';

  const MARK = 'ticket-writer-shop';   // đánh dấu clipboard là thông tin tiệm của Ticket Writer, không phải chữ bất kỳ

  // Chạy trên trang portal, không phải Ticket Writer: phải tự đủ, chỉ dùng tham số (được chuyển thành chữ trong link bookmark).
  // Thứ tự nhận trang: ticket (dòng `Ticket #… for <Tên tiệm> / <MID>`) → My Merchant (dòng `<Tên tiệm> / <MID>` có link .mid-link) → Lead.
  // Không lấy Business ZIP: FRT tự hỏi merchant.
  async function grabShopPage(config, mark) {
    const headerMatch = (node, pattern) => node && node.textContent.replace(/\s+/g, ' ').trim().match(new RegExp(pattern));
    function fromTicket() {
      const match = headerMatch(document.querySelector(config.ticketHeader), config.ticketPattern);
      if (!match) return null;
      // innerText giữ xuống dòng của nội dung nhiều đoạn (textContent dính liền các đoạn)
      const description = document.querySelector(config.description);
      const issue = description ? description.innerText.replace(/\n{3,}/g, '\n\n').trim() : '';
      return { data: { ticket: location.href, shop: match[1].trim(), mid: match[2], issue }, labels: { shop: 'Tên tiệm', mid: 'MID', issue: 'Nội dung' }, link: 'link ticket' };
    }
    function fromMerchant() {
      const midLink = document.querySelector(config.merchantMid);
      const match = midLink && headerMatch(midLink.closest(config.merchantHeader), config.merchantPattern);
      if (!match) return null;
      return { data: { lead: location.href, shop: match[1].trim(), mid: midLink.textContent.trim() }, labels: { shop: 'Tên tiệm', mid: 'MID' }, link: 'link merchant' };
    }
    function fromLead() {
      const valueOf = (selector) => { const node = document.querySelector(selector); return node ? node.value.trim() : ''; };
      return { data: { lead: location.href, shop: valueOf(config.shop), mid: valueOf(config.mid) }, labels: { shop: 'DBA', mid: 'MID' }, link: 'link lead' };
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
    const { data, labels, link } = fromTicket() || fromMerchant() || fromLead();
    const missing = Object.keys(labels).filter(id => !data[id]).map(id => labels[id]);
    if (missing.length === Object.keys(labels).length) { alert('Ticket Writer: không thấy Tên tiệm, MID. Mở đúng trang ticket / My Merchant / Lead rồi bấm lại.'); return; }
    const text = JSON.stringify({ app: mark, ...data });
    if (!await copy(text)) { prompt('Ticket Writer: không copy được. Bấm Ctrl+C rồi OK:', text); return; }
    const found = [data.shop, data.mid && 'MID ' + data.mid].filter(Boolean).join(' · ');
    alert('Ticket Writer: đã copy ' + found + ' + ' + link + (data.issue ? ' + nội dung' : '') + (missing.length ? '\nKhông thấy: ' + missing.join(', ') : '') +
      '\nVề Ticket Writer → Chuyển case → bấm Ctrl+V.');
  }

  /** Chữ không phải dữ liệu của bookmark (hoặc JSON hỏng) => null. */
  function parse(text) {
    let data = null;
    try { data = JSON.parse(text); } catch (error) { return null; }
    return data && data.app === MARK ? data : null;
  }

  /** @param {{ ticketHeader: string, ticketPattern: string, description: string, merchantMid: string, merchantHeader: string, merchantPattern: string, shop: string, mid: string }} config  @returns {ShopGrab} */
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
