// config/sms/shipping.js — SMS Shipping: tin nhắn báo tiệm thiết bị đã được gửi đi.
(function (registry) {
  'use strict';

  const { setShipping } = registry;

  setShipping({
    labels: { merchant: 'Tên merchant', tracking: 'Tracking Number', delivery: 'Estimated Delivery' },

    // Ngày Estimated Delivery in ra tin nhắn, vd "Wednesday, November 4, 2026"
    dateLocale: 'en-US',
    dateFormat: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },

    // Từng dòng tin nhắn, '' = dòng trống. {merchant} {tracking} {delivery} lấy từ form.
    lines: [
      'Dear {merchant},',
      '',
      'We wanted to inform you that your equipment has been shipped via UPS. Below are the details for your reference:',
      '',
      'Tracking Number: {tracking}',
      'Estimated Delivery: {delivery}',
      '',
      'Important: Once your equipment arrives, please call us at +1 888-873-7799 at least 24 hours in advance to schedule your setup & training appointment. ' +
        'This allows our technician to prepare and ensures your terminal is ready to use as soon as possible. ' +
        'If you have any questions or need further assistance, please do not hesitate to reach out to us.',
      '',
      'Have a good day!'
    ]
  });
})(window.TW.registry);
