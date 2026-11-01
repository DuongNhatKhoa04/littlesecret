// config/setup/catalog.js — Danh mục chọn setup: Thiết bị → Hãng → Model, và Quy trình. Thêm hãng/model mới ở đây.
(function (registry) {
  'use strict';

  const { setCatalog } = registry;

  setCatalog({
    flows: [
      { id: 'new',     label: 'Ship mới' },
      { id: 'replace', label: 'Replace' }
    ],
    devices: [
      { id: 'pos', label: 'POS', brands: [
        { id: 'abc', label: 'ABC', models: [] }
      ] },
      { id: 'terminal', label: 'Terminal', brands: [
        { id: 'valor',  label: 'Valor (VL)', models: ['VL100', 'VL100 Pro', 'VL550'] },
        { id: 'pax',    label: 'PAX',        models: ['A920', 'A920 Pro', 'A3700'] },
        { id: 'clover', label: 'Clover',     models: ['Clover Flex', 'Clover Mini'] }
      ] }
    ]
  });
})(window.TW.registry);
