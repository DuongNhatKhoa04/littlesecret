// src/core/namespace.js — Tạo biến toàn cục duy nhất của app. Phải là <script> đầu tiên.
(function () {
  'use strict';

  window.TW = { domain: {}, application: {}, infra: {}, ui: {} };
})();
