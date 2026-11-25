"""Đóng gói bản gửi đồng nghiệp: 1 file HTML gộp toàn bộ CSS + JS, bỏ comment (dev tool, không bắt buộc).

Dùng:  python tests/tools/build_release.py
Ra:    release/ticket-writer.html  (double-click là chạy, không cần folder src/ config/ styles/)
Kiểm tra bản gộp:  python tests/tools/smoke_ui.py release/ticket-writer.html

Không có docs/, tests/, tên file, cấu trúc thư mục, comment. Code vẫn đọc được bằng DevTools (JS chạy trong trình duyệt
thì không giấu được), chỉ khó đọc / khó sửa hơn.
Dữ liệu đã lưu (ticket đang nhập, template, tag…) không mất khi đổi sang bản này: Chrome cho mọi trang file:// chung 1 kho lưu trữ.
"""
import base64
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "release" / "ticket-writer.html"

STYLE_TAG = re.compile(r'<link rel="stylesheet" href="([^"]+)">\n?')
SCRIPT_TAG = re.compile(r'<script src="([^"]+)"></script>\n?')
HTML_COMMENT = re.compile(r"[ \t]*<!--.*?-->[ \t]*\n?", re.S)
CSS_COMMENT = re.compile(r"/\*.*?\*/", re.S)
CSS_URL = re.compile(r'url\("([^":)]+)"\)')   # url("fonts/…") tương đối: bản 1 file không có folder styles/ để trỏ tới
# Sau các ký tự / từ này, "/" mở đầu regex chứ không phải phép chia
REGEX_AFTER_CHARS = set("(,=:[!&|?{};+-*%<>~^")
REGEX_AFTER_WORDS = {"return", "typeof", "case", "in", "of", "delete", "void", "throw", "new", "else", "do"}


def strip_js(source):
    """Bỏ comment, thụt đầu dòng và dòng trống; không đụng chuỗi '…' "…" `…` và regex /…/."""
    out = []
    i, n = 0, len(source)
    modes = ["code"]          # code | template; code trong ${…} của template là "code" có đếm ngoặc
    braces = [0]
    last = ""                 # ký tự có nghĩa gần nhất ngoài khoảng trắng / comment
    word = ""                 # từ khóa / tên gần nhất (để biết "/" sau return là regex)
    line_start = True

    def end_line():
        text = "".join(out)
        cut = text.rfind("\n") + 1
        if text[cut:].strip():
            out.append("\n")
        else:
            del out[:]
            out.append(text[:cut])

    while i < n:
        ch = source[i]
        if modes[-1] == "template":
            if ch == "\\":
                out.append(source[i:i + 2]); i += 2; continue
            if ch == "`":
                out.append(ch); modes.pop(); braces.pop(); i += 1; last = "`"; word = ""; continue
            if source.startswith("${", i):
                out.append("${"); modes.append("code"); braces.append(0); i += 2; last = "{"; word = ""; continue
            out.append(ch); i += 1; continue

        nxt = source[i + 1] if i + 1 < n else ""
        if line_start and ch in " \t":
            i += 1; continue
        line_start = False
        if ch == "\n":
            end_line(); line_start = True; i += 1; continue
        if ch == "/" and nxt == "/":
            while i < n and source[i] != "\n":
                i += 1
            continue
        if ch == "/" and nxt == "*":
            i = source.index("*/", i + 2) + 2
            continue
        if ch in "'\"":
            j = i + 1
            while source[j] != ch:
                j += 2 if source[j] == "\\" else 1
            out.append(source[i:j + 1]); i = j + 1; last = ch; word = ""; continue
        if ch == "`":
            out.append(ch); modes.append("template"); braces.append(0); i += 1; continue
        if ch == "/" and (last in REGEX_AFTER_CHARS or last == "" or word in REGEX_AFTER_WORDS):
            j, in_class = i + 1, False
            while in_class or source[j] != "/":
                if source[j] == "\\":
                    j += 1
                elif source[j] == "[":
                    in_class = True
                elif source[j] == "]":
                    in_class = False
                j += 1
            j += 1
            while j < n and source[j].isalpha():   # cờ g, i, u…
                j += 1
            out.append(source[i:j]); i = j; last = "/"; word = ""; continue
        if ch == "{":
            braces[-1] += 1
        elif ch == "}":
            if len(modes) > 1 and braces[-1] == 0:   # hết ${…}, quay về chuỗi template
                out.append(ch); modes.pop(); braces.pop(); i += 1; continue
            braces[-1] -= 1
        if ch.isalnum() or ch in "_$":
            j = i
            while j < n and (source[j].isalnum() or source[j] in "_$"):
                j += 1
            word = source[i:j]; out.append(word); last = word[-1]; i = j; continue
        out.append(ch); i += 1
        if not ch.isspace():
            last = ch; word = ""
    end_line()
    return "".join(out).strip() + "\n"


def strip_css(source):
    lines = (line.strip() for line in CSS_COMMENT.sub("", source).splitlines())
    return "\n".join(line for line in lines if line) + "\n"


def inline_urls(css, css_path):
    """Nhúng file font (url tương đối trong CSS) thành data: URI."""
    def to_data(match):
        data = base64.b64encode((css_path.parent / match.group(1)).read_bytes()).decode("ascii")
        return 'url("data:font/woff2;base64,%s")' % data
    return CSS_URL.sub(to_data, css)


def safe_inline(code):
    """Chữ </script> / <!-- trong code làm hỏng thẻ <script> khi nhúng thẳng vào HTML."""
    return code.replace("</script", "<\\/script").replace("<!--", "<\\!--")


def build():
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    styles = STYLE_TAG.findall(html)
    scripts = SCRIPT_TAG.findall(html)
    css = "".join(inline_urls(strip_css((ROOT / href).read_text(encoding="utf-8")), ROOT / href) for href in styles)
    js = "".join(strip_js((ROOT / src).read_text(encoding="utf-8")) for src in scripts)

    html = HTML_COMMENT.sub("", html)
    html = STYLE_TAG.sub("", html, count=len(styles) - 1)
    html = STYLE_TAG.sub(lambda _: "<style>\n" + css + "</style>\n", html)
    html = SCRIPT_TAG.sub("", html, count=len(scripts) - 1)
    html = SCRIPT_TAG.sub(lambda _: "<script>\n" + safe_inline(js) + "</script>\n", html)
    html = re.sub(r"\n{3,}", "\n\n", html)

    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(html, encoding="utf-8", newline="\n")
    sources = sum((ROOT / path).stat().st_size for path in styles + scripts) + (ROOT / "index.html").stat().st_size
    sys.stdout.reconfigure(encoding="utf-8")
    print("Đã tạo %s: gộp %d file CSS + %d file JS, %d KB (gốc %d KB)" % (
        OUT.relative_to(ROOT), len(styles), len(scripts), OUT.stat().st_size // 1024, sources // 1024))


if __name__ == "__main__":
    build()
