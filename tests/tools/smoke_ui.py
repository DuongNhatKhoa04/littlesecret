"""Bấm thử giao diện thật bằng Chrome headless (dev tool, không bắt buộc).

Dùng:  python tests/tools/smoke_ui.py
Tạo tạm _smoke.html (bản sao index.html + kịch bản smoke_ui.js) cạnh index.html, chạy, rồi xóa.
Chạy theo giờ thật (không dùng --virtual-time-budget): giờ ảo trôi hết trong lúc trình duyệt giải mã ảnh / tạo file,
nên các bước dán ảnh, ZIP, PDF chập chờn hoặc treo. Trang tự gửi kết quả về server nhỏ trên 127.0.0.1 khi chạy xong.
"""
import http.server
import json
import os
import pathlib
import subprocess
import sys
import tempfile
import threading

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from run_tests import find_browser  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parents[2]
TIMEOUT_S = 120
CATCH = ("<script>window.__smokeErrors=[];window.addEventListener('error',e=>window.__smokeErrors.push("
         "e.message+' @ '+(e.filename||'').split('/').pop()+':'+e.lineno));</script>")


def run_page(page):
    """Mở trang bằng Chrome headless, đợi trang POST kết quả (JSON) về. None = hết giờ."""
    received = {}
    done = threading.Event()

    class Handler(http.server.BaseHTTPRequestHandler):
        def do_POST(self):
            received["body"] = self.rfile.read(int(self.headers["Content-Length"])).decode("utf-8")
            self.send_response(204)
            self.end_headers()
            done.set()

        def log_message(self, *args):
            pass

    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as profile:
            chrome = subprocess.Popen(
                [find_browser(), "--headless=new", "--disable-gpu", "--user-data-dir=" + profile,
                 "--allow-file-access-from-files", page.as_uri() + "?port=%d" % server.server_port],
                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            done.wait(TIMEOUT_S)
            # Windows: Chrome có nhiều process con, chỉ kill process chính thì profile tạm còn bị khóa
            if os.name == "nt":
                subprocess.run(["taskkill", "/T", "/F", "/PID", str(chrome.pid)], capture_output=True)
            else:
                chrome.kill()
            chrome.wait()
    finally:
        server.shutdown()
    return json.loads(received["body"]) if "body" in received else None


def main():
    source = (ROOT / "index.html").read_text(encoding="utf-8")
    page = source.replace("<body>", "<body>\n" + CATCH, 1).replace(
        "</body>", '<script src="tests/tools/smoke_ui.js"></script>\n</body>')
    temp = ROOT / "_smoke.html"
    temp.write_text(page, encoding="utf-8")
    try:
        result = run_page(temp)
    finally:
        temp.unlink()
    sys.stdout.reconfigure(encoding="utf-8")
    if result is None:
        sys.exit("Không có kết quả smoke sau %ds (trang lỗi hoặc treo trước khi chạy xong)" % TIMEOUT_S)
    for line in result["log"]:
        print(line)
    for error in result["errors"]:
        print("JS ERROR", error)
    failed = result["errors"] or any(line.startswith("FAIL") for line in result["log"])
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
