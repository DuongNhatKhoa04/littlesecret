// tests/phone.test.js — Nhận ảnh iPhone qua phone-upload: đọc link, hỏi hàng chờ, giao ảnh, dừng khi mất kết nối (hàng chờ giả).
(function (TW) {
  'use strict';

  const { test, assertEqual } = TW.tests;
  const A = TW.application;
  const { parsePhoneLink, inboxUrl } = TW.domain.phoneLink;
  const context = A.context.createContext(TW.registry);
  const key = context.app.phoneKey;
  const LINK = 'http://192.168.0.111:8765/jmb85xf7i2e7';

  test('link phone-upload: lấy port + mã, luôn hỏi qua 127.0.0.1', () => {
    assertEqual(parsePhoneLink(`  ${LINK}/ `), { port: 8765, token: 'jmb85xf7i2e7' });
    assertEqual(inboxUrl(parsePhoneLink(LINK)), 'http://127.0.0.1:8765/jmb85xf7i2e7/next');
  });

  test('link phone-upload: sai dạng / thiếu mã / port lạ => null', () => {
    assertEqual(['', 'abc', 'http://1.2.3.4:8765/', 'http://1.2.3.4:8765/short', 'http://1.2.3.4:99999/jmb85xf7i2e7',
      'http://1.2.3.4/jmb85xf7i2e7', 'http://1.2.3.4:8765/jmb85xf7i2e7/next'].map(parsePhoneLink), Array(7).fill(null));
  });

  /** Hàng chờ giả: replies lần lượt là kết quả mỗi lần hỏi; hết thì báo mất kết nối. */
  function setup({ replies = [], saved = {}, ready = () => true } = {}) {
    const data = { [key]: saved };
    const storage = { read: (name) => data[name] || null, write: (name, value) => { data[name] = value; return true; } };
    const asked = [];
    const inbox = { next: async (url) => { asked.push(url); return replies.shift() || { ok: false, file: null }; } };
    const received = [];
    const events = [];
    const phone = A.phoneService.createPhoneService({
      context, storage, inbox, isReady: ready, onFile: (file) => received.push(file.name), sleep: () => settle()   // phải nhường timer, không thì vòng chờ chạy mãi
    });
    phone.subscribe((event) => events.push(event));
    return { phone, data, asked, received, events };
  }
  const settle = () => new Promise(resolve => setTimeout(resolve, 0));
  const image = (name) => ({ ok: true, file: new File([], name, { type: 'image/png' }) });
  const EMPTY = { ok: true, file: null };

  test('iPhone: dán link => nhận lần lượt mọi ảnh, giao vào mục, lưu link', async () => {
    const { phone, data, asked, received, events } = setup({ replies: [image('a.png'), image('b.png'), EMPTY] });
    assertEqual(phone.connect(` ${LINK} `), true);
    await settle();
    assertEqual([received, asked[0], data[key], events.filter(e => e === 'received').length],
      [['a.png', 'b.png'], 'http://127.0.0.1:8765/jmb85xf7i2e7/next', { link: LINK, enabled: true }, 2]);
  });

  test('iPhone: phone-upload tắt / sai link => Mất kết nối, ngừng hỏi', async () => {
    const { phone, asked } = setup({ replies: [EMPTY] });
    phone.connect(LINK);
    await settle();
    await settle();
    assertEqual([phone.status(), asked.length], ['lost', 2]);
  });

  test('iPhone: link sai dạng => không bật', () => {
    const { phone, data } = setup();
    assertEqual([phone.connect('http://abc'), phone.status(), data[key]], [false, 'off', {}]);
  });

  test('iPhone: màn hình không có mục nhận ảnh => không lấy ảnh về (để chờ ở phone-upload)', async () => {
    let ready = false;
    const { phone, asked, received } = setup({ replies: [image('a.png'), EMPTY], ready: () => ready });
    phone.connect(LINK);
    await settle();
    assertEqual(asked.length, 0);
    ready = true;
    await settle();
    await settle();
    assertEqual(received, ['a.png']);
    phone.stop();
  });

  test('iPhone: tắt => lưu tắt; mở lại trang => bật lại nếu lần trước đang bật', async () => {
    const first = setup({ replies: [EMPTY] });
    first.phone.connect(LINK);
    first.phone.stop();
    assertEqual([first.phone.status(), first.data[key]], ['off', { link: LINK, enabled: false }]);
    const again = setup({ saved: { link: LINK, enabled: true }, replies: [image('c.png'), EMPTY] });
    assertEqual(again.phone.link(), LINK);
    again.phone.resume();
    await settle();
    assertEqual([again.phone.status(), again.received], ['on', ['c.png']]);
    again.phone.stop();
  });
})(window.TW);
