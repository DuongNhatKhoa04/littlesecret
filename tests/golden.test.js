// tests/golden.test.js — Title + Nội dung + điều kiện copy phải giống hệt bản gốc ../ticket-writer.html.
(function (TW) {
  'use strict';

  const { test, assertEqual, goldenCases, goldenExpected } = TW.tests;
  const { buildTitle } = TW.domain.title;
  const { buildBody } = TW.domain.body;
  const { isActionMissing, countMissingImages } = TW.domain.validation;
  const { sanitizeTicket, findConclusion } = TW.domain.ticket;
  const context = TW.application.context.createContext(TW.registry);

  // Cố ý khác bản gốc vì config đổi sau này (REQUIREMENTS §14.4). Chỉ ghi đè đúng trường bị ảnh hưởng;
  // nội dung chỉ được NỐI THÊM vào sau bản gốc (appendBody), phần gốc vẫn phải giống hệt.
  // Ngoại lệ duy nhất được ghi đè cả nội dung (body): loại Hỗ trợ merchant (REQUIREMENTS §6, §14.5).
  const merged = (body) => ({ body, missingAction: false });   // gộp incident + request, Kết luận cũ => mặc định Resolved (không in, ẩn Việc cần làm tiếp), không khóa copy; bỏ Nguyên nhân
  const CHANGED_SINCE_ORIGINAL = {
    'incident đủ mục, Workaround, ý nhiều dòng': merged('Phone: 0901234567\n\nVấn đề:\n- Terminal không kết nối được\n  Từ sáng nay\n\n' +
      'Đã support:\n- Restart router\n- Đổi dây LAN\n\nNote:\n- Gọi lại sau 2h'),
    'incident Not resolved bước đầu (Phone + Hiện trạng)': merged('Phone: 123\n\nVấn đề:\n- Máy in không ra giấy\n\nNote:\n- note'),
    'incident Not resolved đã troubleshoot, thiếu đề xuất': merged('Vấn đề:\n- A\n\nĐã support:\n- B'),
    'incident Resolved, không phone': merged('Vấn đề:\n- Wifi rớt\n\nĐã support:\n- Đổi kênh'),
    'request Workaround thiếu hành động đề xuất': merged('Phone: 555\n\nVấn đề:\n- Đổi giá dịch vụ\n\nĐã support:\n- Đã đổi 1 phần'),
    'request Resolved đủ': merged('Phone: 777\n\nVấn đề:\n- Thêm 2 nhân viên\n\nĐã support:\n- Đã thêm\n\nNote:\n- Line 1\n  Line 2'),
    'setup POS: tick, N/A, thiếu ảnh, Firewall có cha': { missingImgs: 15 },   // 7 mục chưa đụng tới đã chuyển sang không cần ảnh
    'newDb: Pricing có cha, đủ ảnh 1 phần': {
      missingImgs: 5,                                                         // Appointment, Tạo OneDrive đã chuyển sang không cần ảnh
      appendBody: '\n\nUpload lên CRM:\n- [ ] Upload shop email + naildata lên ticket crm'   // nhóm mới ở cuối
    },
    // PAX: thêm bước cuối "Close batch sau khi test sale"; Check Display / Screen chuyển sang không cần ảnh
    'setupPax: mọi mục N/A': { appendBody: '\n- [ ] Close batch sau khi test sale' },
    'setupPax: chưa đụng gì, chỉ phone': { missingImgs: 6, appendBody: '\n- [ ] Close batch sau khi test sale' }
  };

  function expectedFor(input, i) {
    const { appendBody = '', ...fields } = CHANGED_SINCE_ORIGINAL[input.name] || {};
    const original = goldenExpected[i];
    return { ...original, body: original.body + appendBody, ...fields };
  }

  goldenCases.forEach((input, i) => {
    test(`golden: ${input.name}`, () => {
      const expected = expectedFor(input, i);
      const type = context.typeOf(input.type);
      const ticket = sanitizeTicket(input.ticket, context);
      const imageCounts = input.images || {};
      assertEqual(buildTitle(ticket), expected.title, 'title');
      assertEqual(buildBody({ type, ticket, imageCounts, model: '', app: context.app }), expected.body, 'body');
      assertEqual(isActionMissing({ type, ticket, conclusion: findConclusion(context.app, ticket.conclusion) }), expected.missingAction, 'missingAction');
      assertEqual(countMissingImages({ type, ticket, imageCounts }), expected.missingImgs, 'missingImages');
    });
  });
})(window.TW);
