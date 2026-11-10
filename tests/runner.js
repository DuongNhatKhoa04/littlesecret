// tests/runner.js — Bộ chạy test tối giản, chạy trong trình duyệt (double-click tests/index.html).
(function (TW) {
  'use strict';

  const cases = [];

  function test(name, fn) { cases.push({ name, fn }); }

  function assert(condition, message) {
    if (!condition) throw new Error(message || 'Điều kiện sai');
  }

  function assertEqual(actual, expected, message) {
    const a = JSON.stringify(actual);
    const e = JSON.stringify(expected);
    if (a !== e) throw new Error(`${message ? message + '\n' : ''}Mong đợi: ${e}\nNhận được: ${a}`);
  }

  // fn có thể là async (vd lưu offline phải chờ tải file ZIP)
  async function runCase({ name, fn }) {
    try { await fn(); return { name, ok: true }; } catch (error) { return { name, ok: false, error: error.message }; }
  }

  function render(results) {
    const failed = results.filter(r => !r.ok);
    const summary = document.getElementById('summary');
    summary.textContent = `${failed.length ? 'FAIL' : 'PASS'} ${results.length - failed.length}/${results.length}`;
    summary.className = failed.length ? 'fail' : 'pass';
    document.title = summary.textContent;
    const list = document.getElementById('results');
    results.forEach(r => {
      const row = document.createElement('li');
      row.className = r.ok ? 'pass' : 'fail';
      row.textContent = (r.ok ? '✓ ' : '✗ ') + r.name + (r.ok ? '' : '\n' + r.error);
      list.append(row);
    });
  }

  async function run() {
    const results = [];
    for (const testCase of cases) results.push(await runCase(testCase));
    render(results);
  }

  TW.tests = { ...TW.tests, test, assert, assertEqual, run };
})(window.TW);
