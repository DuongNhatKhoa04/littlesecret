// tests/phone.test.js — Nhận ảnh iPhone qua phone-upload: đọc link, hỏi hàng chờ, giao ảnh, dừng khi mất kết nối (hàng chờ giả).
(function (TW) {
  'use strict';

  const { test, assertEqual } = TW.tests;
  const A = TW.application;
  const { parsePhoneLink, deskUrl } = TW.domain.phoneLink;
  const { encodeQr } = TW.domain.qrCode;
  const context = A.context.createContext(TW.registry);
  const key = context.app.phoneKey;
  const LINK = 'http://192.168.0.111:8765/jmb85xf7i2e7';

  test('link phone-upload: lấy port + mã, luôn hỏi qua 127.0.0.1', () => {
    assertEqual(parsePhoneLink(`  ${LINK}/ `), { port: 8765, token: 'jmb85xf7i2e7' });
    assertEqual(['next', 'info', 'rotate'].map(action => deskUrl(parsePhoneLink(LINK), action)),
      ['next', 'info', 'rotate'].map(action => `http://127.0.0.1:8765/jmb85xf7i2e7/${action}`));
  });

  test('link phone-upload: sai dạng / thiếu mã / port lạ => null', () => {
    assertEqual(['', 'abc', 'http://1.2.3.4:8765/', 'http://1.2.3.4:8765/short', 'http://1.2.3.4:99999/jmb85xf7i2e7',
      'http://1.2.3.4/jmb85xf7i2e7', 'http://1.2.3.4:8765/jmb85xf7i2e7/next',
      'http://192.168.0.111:8765/u/qw45pwrbcuj8'].map(parsePhoneLink), Array(8).fill(null));   // link iPad không phải link máy tính
  });

  /** Hàng chờ giả: replies lần lượt là kết quả mỗi lần hỏi; hết thì báo mất kết nối. */
  function setup({ replies = [], saved = {}, ready = () => true } = {}) {
    const data = { [key]: saved };
    const storage = { read: (name) => data[name] || null, write: (name, value) => { data[name] = value; return true; } };
    const asked = [];
    const ipad = { ok: true, urls: ['http://192.168.0.111:8765/u/qw45pwrbcuj8'], expiresAt: '2026-11-13T05:00:00Z' };
    const inbox = {
      next: async (url) => { asked.push(url); return replies.shift() || { ok: false, file: null }; },
      info: async (url) => { asked.push(url); return ipadReply; },
      rotate: async (url) => { asked.push(url); return { ...ipadReply, urls: ['http://192.168.0.111:8765/u/newcode23456'] }; }
    };
    let ipadReply = ipad;
    const received = [];
    const events = [];
    const phone = A.phoneService.createPhoneService({
      context, storage, inbox, isReady: ready, onFile: (file) => received.push(file.name), sleep: () => settle()   // phải nhường timer, không thì vòng chờ chạy mãi
    });
    phone.subscribe((event) => events.push(event));
    return { phone, data, asked, received, events, failIpad: () => { ipadReply = { ok: false, urls: [], expiresAt: '' }; } };
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

  test('iPad: lấy link QR / đổi mã ngay qua mã máy tính; phone-upload tắt => Mất kết nối', async () => {
    const { phone, asked, failIpad } = setup({ replies: [EMPTY, EMPTY, EMPTY] });
    phone.connect(LINK);
    const info = await phone.ipadLink();
    const renewed = await phone.renewIpadLink();
    assertEqual([info.urls[0], renewed.urls[0], asked.filter(url => !url.endsWith('/next'))],
      ['http://192.168.0.111:8765/u/qw45pwrbcuj8', 'http://192.168.0.111:8765/u/newcode23456',
        ['http://127.0.0.1:8765/jmb85xf7i2e7/info', 'http://127.0.0.1:8765/jmb85xf7i2e7/rotate']]);
    failIpad();
    assertEqual([(await phone.ipadLink()).ok, phone.status()], [false, 'lost']);
  });

  test('mã QR: link iPad => phiên bản 3 (29×29), 3 ô tìm vị trí ở góc, cùng link => cùng mã', () => {
    const grid = encodeQr('http://192.168.0.111:8765/u/qw45pwrbcuj8');
    const finder = (x, y) => [0, 1, 2, 3, 4, 5, 6].map(i => [grid[y][x + i], grid[y + 6][x + i], grid[y + i][x], grid[y + i][x + 6]]).flat().every(Boolean);
    assertEqual([grid.length, grid.every(row => row.length === 29), finder(0, 0), finder(22, 0), finder(0, 22), grid[2][2], grid[1][1]],
      [29, true, true, true, true, true, false]);
    assertEqual(JSON.stringify(encodeQr('http://192.168.0.111:8765/u/qw45pwrbcuj8')), JSON.stringify(grid));
  });

  test('mã QR: chọn phiên bản theo độ dài (tối đa 106 byte), quá dài => null', () => {
    assertEqual(['a'.repeat(14), 'a'.repeat(15), 'a'.repeat(26), 'a'.repeat(106), 'a'.repeat(107)].map(text => {
      const grid = encodeQr(text);
      return grid ? grid.length : null;
    }), [21, 25, 25, 41, null]);
  });
})(window.TW);
