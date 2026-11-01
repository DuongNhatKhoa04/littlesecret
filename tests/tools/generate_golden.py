"""Sinh tests/golden-expected.js: chạy hàm compose() của BẢN GỐC ../ticket-writer.html trên tests/golden-cases.js.

Dùng:  python tests/tools/generate_golden.py
Chỉ chạy lại khi thêm/sửa ca trong golden-cases.js. Không sửa tay golden-expected.js.
"""
import html
import json
import pathlib
import re
import sys
import tempfile

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from run_tests import dump_dom  # noqa: E402

PROJECT = pathlib.Path(__file__).resolve().parents[2]
ORIGINAL = PROJECT.parent / "ticket-writer.html"

# Chạy trong trang bản gốc: state, emptyTicket, BLOCK_KEYS, images, compose là biến toàn cục của bản gốc.
RUNNER = """
<script>window.TW = { tests: {} };</script>
<script src="%s"></script>
<script>
(function () {
  const out = TW.tests.goldenCases.map(c => {
    state.type = c.type;
    state.ticket = Object.assign(emptyTicket(), JSON.parse(JSON.stringify(c.ticket)));
    BLOCK_KEYS.forEach(k => { if (!state.ticket.blocks[k]) state.ticket.blocks[k] = ['']; });
    if (!state.ticket.chk) state.ticket.chk = {};
    images = {};
    Object.entries(c.images || {}).forEach(([k, n]) => { images[k] = Array.from({ length: n }, () => ({ src: '' })); });
    const r = compose();
    return { name: c.name, title: r.title, body: r.body, missingAction: r.missingAction, missingImgs: r.missingImgs };
  });
  const pre = document.createElement('pre'); pre.id = 'golden'; pre.textContent = JSON.stringify(out);
  document.body.append(pre);
})();
</script>
"""

HEADER = "// tests/golden-expected.js — SINH TỰ ĐỘNG từ ../ticket-writer.html bằng tests/tools/generate_golden.py. Không sửa tay.\n"


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    cases_uri = (PROJECT / "tests" / "golden-cases.js").as_uri()
    page_html = ORIGINAL.read_text(encoding="utf-8").replace("</body>", RUNNER % cases_uri + "</body>")
    with tempfile.TemporaryDirectory() as folder:
        page = pathlib.Path(folder) / "golden.html"
        page.write_text(page_html, encoding="utf-8")
        dom = dump_dom(page)
    match = re.search(r'<pre id="golden">(.*?)</pre>', dom, re.S)
    if not match:
        sys.exit("Không lấy được kết quả từ bản gốc")
    data = json.loads(html.unescape(match.group(1)))
    body = json.dumps(data, ensure_ascii=False, indent=2).replace("\n", "\n  ")
    js = HEADER + "(function (TW) {\n  'use strict';\n  TW.tests.goldenExpected = " + body + ";\n})(window.TW);\n"
    (PROJECT / "tests" / "golden-expected.js").write_text(js, encoding="utf-8")
    print(f"Đã ghi {len(data)} ca")


if __name__ == "__main__":
    main()
