"""Chạy tests/index.html bằng Chrome headless và in kết quả ra terminal.

Dùng:  python tests/tools/run_tests.py [đường_dẫn_html]
Mặc định chạy tests/index.html. Thoát mã 1 nếu có test lỗi.
"""
import html
import pathlib
import re
import subprocess
import sys
import tempfile

CHROME_PATHS = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
]


def find_browser():
    for path in CHROME_PATHS:
        if pathlib.Path(path).exists():
            return path
    sys.exit("Không tìm thấy Chrome/Edge")


def dump_dom(page):
    with tempfile.TemporaryDirectory() as profile:
        return subprocess.run(
            [find_browser(), "--headless=new", "--disable-gpu", "--user-data-dir=" + profile,
             "--allow-file-access-from-files", "--virtual-time-budget=20000", "--dump-dom", page.as_uri()],
            capture_output=True, text=True, encoding="utf-8", timeout=120).stdout


def main():
    page = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else pathlib.Path(__file__).parents[1] / "index.html").resolve()
    dom = dump_dom(page)
    summary = re.search(r'<h1 id="summary"[^>]*>(.*?)</h1>', dom, re.S)
    failures = [html.unescape(x) for x in re.findall(r'<li class="fail">(.*?)</li>', dom, re.S)]
    sys.stdout.reconfigure(encoding="utf-8")
    print(html.unescape(summary.group(1)) if summary else "Không đọc được kết quả")
    for failure in failures:
        print(failure)
    sys.exit(1 if failures or not summary or "PASS" not in summary.group(1) else 0)


if __name__ == "__main__":
    main()
