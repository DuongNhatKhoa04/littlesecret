// config/sms/review.js — SMS Xin review: bang → chi nhánh → link Google review, câu mời theo ngôn ngữ.
(function (registry) {
  'use strict';

  const { setReview } = registry;

  setReview({
    labels: { state: 'Bang', language: 'Ngôn ngữ tin nhắn', branch: 'Chi nhánh', invalidState: 'Bang hợp lệ', staff: 'Tên nhân viên' },

    // Link Google review của từng chi nhánh. Key = `branch` trong `states`.
    links: {
      Arlington: 'https://g.page/r/CSNU0_lEme3rEBM/review',
      Atlanta: 'https://g.page/r/CTki3AA3lGIkEBM/review',
      Houston: 'https://g.page/r/CXbRhObNeE8NEBM/review'
    },

    // Bang thuộc chi nhánh nào. Người dùng gõ `code` (không phân biệt hoa thường); `name` chỉ để hiện trong gợi ý.
    states: [
      { code: 'AK', name: 'Alaska', branch: 'Arlington' },
      { code: 'AR', name: 'Arkansas', branch: 'Arlington' },
      { code: 'AZ', name: 'Arizona', branch: 'Arlington' },
      { code: 'CA', name: 'California', branch: 'Arlington' },
      { code: 'CO', name: 'Colorado', branch: 'Arlington' },
      { code: 'HI', name: 'Hawaii', branch: 'Arlington' },
      { code: 'IA', name: 'Iowa', branch: 'Arlington' },
      { code: 'ID', name: 'Idaho', branch: 'Arlington' },
      { code: 'IL', name: 'Illinois', branch: 'Arlington' },
      { code: 'KS', name: 'Kansas', branch: 'Arlington' },
      { code: 'MN', name: 'Minnesota', branch: 'Arlington' },
      { code: 'MO', name: 'Missouri', branch: 'Arlington' },
      { code: 'MT', name: 'Montana', branch: 'Arlington' },
      { code: 'ND', name: 'North Dakota', branch: 'Arlington' },
      { code: 'NE', name: 'Nebraska', branch: 'Arlington' },
      { code: 'NM', name: 'New Mexico', branch: 'Arlington' },
      { code: 'NV', name: 'Nevada', branch: 'Arlington' },
      { code: 'OK', name: 'Oklahoma', branch: 'Arlington' },
      { code: 'OR', name: 'Oregon', branch: 'Arlington' },
      { code: 'SD', name: 'South Dakota', branch: 'Arlington' },
      { code: 'UT', name: 'Utah', branch: 'Arlington' },
      { code: 'WA', name: 'Washington', branch: 'Arlington' },
      { code: 'WI', name: 'Wisconsin', branch: 'Arlington' },
      { code: 'WY', name: 'Wyoming', branch: 'Arlington' },
      { code: 'TX', name: 'Texas', branch: 'Arlington' },
      { code: 'AL', name: 'Alabama', branch: 'Atlanta' },
      { code: 'CT', name: 'Connecticut', branch: 'Atlanta' },
      { code: 'DC', name: 'District of Columbia', branch: 'Atlanta' },
      { code: 'DE', name: 'Delaware', branch: 'Atlanta' },
      { code: 'FL', name: 'Florida', branch: 'Atlanta' },
      { code: 'GA', name: 'Georgia', branch: 'Atlanta' },
      { code: 'IN', name: 'Indiana', branch: 'Atlanta' },
      { code: 'KY', name: 'Kentucky', branch: 'Atlanta' },
      { code: 'MA', name: 'Massachusetts', branch: 'Atlanta' },
      { code: 'MD', name: 'Maryland', branch: 'Atlanta' },
      { code: 'ME', name: 'Maine', branch: 'Atlanta' },
      { code: 'MI', name: 'Michigan', branch: 'Atlanta' },
      { code: 'NC', name: 'North Carolina', branch: 'Atlanta' },
      { code: 'NH', name: 'New Hampshire', branch: 'Atlanta' },
      { code: 'NJ', name: 'New Jersey', branch: 'Atlanta' },
      { code: 'NY', name: 'New York', branch: 'Atlanta' },
      { code: 'OH', name: 'Ohio', branch: 'Atlanta' },
      { code: 'PA', name: 'Pennsylvania', branch: 'Atlanta' },
      { code: 'RI', name: 'Rhode Island', branch: 'Atlanta' },
      { code: 'SC', name: 'South Carolina', branch: 'Atlanta' },
      { code: 'TN', name: 'Tennessee', branch: 'Atlanta' },
      { code: 'VA', name: 'Virginia', branch: 'Atlanta' },
      { code: 'VT', name: 'Vermont', branch: 'Atlanta' },
      { code: 'WV', name: 'West Virginia', branch: 'Atlanta' },
      { code: 'LA', name: 'Louisiana', branch: 'Houston' },
      { code: 'MS', name: 'Mississippi', branch: 'Houston' }
    ],

    // Ngôn ngữ tin nhắn, ngôn ngữ đầu là mặc định. id lưu trong state => không đổi id đang có.
    // lines: từng dòng tin nhắn, '' = dòng trống. {link} = link của chi nhánh phụ trách bang.
    languages: [
      {
        id: 'en', label: 'English',
        lines: [
          'Greeting,',
          '',
          'Thank you for contacting MAC USA. If you have a moment, we’d appreciate hearing about your experience on Google: {link}',
          '',
          'Have a nice day!'
        ]
      },
      {
        id: 'vi', label: 'Tiếng Việt',
        lines: [
          'Xin chào,',
          '',
          'Cảm ơn anh/chị đã liên hệ MAC USA. Nếu có thời gian, anh/chị có thể chia sẻ trải nghiệm của mình trên Google tại đây: {link}',
          '',
          'Chúc anh/chị một ngày tốt lành!'
        ]
      }
    ]
  });
})(window.TW.registry);
