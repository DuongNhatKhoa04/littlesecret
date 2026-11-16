"""Sinh 4 sơ đồ docs/diagrams/{architecture,dependency,uml-class,sequence}.html (skin mặc định của skill diagram-design).

Dùng:  python tests/tools/generate_diagrams.py
Nội dung sơ đồ viết tay trong file này: đổi kiến trúc thì sửa ở đây rồi chạy lại.
"""
import pathlib

OUT = pathlib.Path(__file__).resolve().parents[2] / 'docs' / 'diagrams'
PAPER, INK, MUTED, SOFT, ACCENT, LINK = '#f5f5f5', '#2d3142', '#4f5d75', '#5a6580', '#bf4520', '#2e5aa8'
ACCENT_TINT = 'rgba(191,69,32,0.08)'
SANS, MONO = "'Geist', sans-serif", "'Geist Mono', monospace"
def ink(a): return f'rgba(45,49,66,{a})'

HEAD = '''<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500;600&family=Noto+Serif:ital@0;1&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
    :root {{
      --color-paper: #f5f5f5; --color-ink: #2d3142; --color-muted: #4f5d75; --color-accent: #bf4520;
      --font-sans: 'Geist', system-ui, sans-serif;
      --font-serif: 'Instrument Serif', 'Noto Serif', serif;
      --font-mono: 'Geist Mono', ui-monospace, monospace;
    }}
    body {{ font-family: var(--font-sans); background: var(--color-paper); color: var(--color-ink);
      min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 3rem 2rem; }}
    .frame {{ max-width: 1200px; width: 100%; }}
    .diagram-container {{ width: 100%; overflow-x: auto; }}
    .eyebrow {{ font-family: var(--font-mono); font-size: 0.66rem; font-weight: 500; letter-spacing: 0.18em;
      text-transform: uppercase; color: var(--color-muted); margin-bottom: 0.5rem; }}
    h1 {{ font-family: var(--font-serif); font-size: clamp(1.5rem, 2.4vw + 0.75rem, 2rem); font-weight: 400;
      letter-spacing: -0.02em; line-height: 1.15; margin-bottom: 1.5rem; }}
    .note {{ font-size: 0.85rem; color: var(--color-muted); line-height: 1.5; margin-top: 1rem; max-width: 72ch; }}
    .note code {{ font-family: var(--font-mono); font-size: 0.8rem; }}
    svg {{ width: 100%; min-width: {w}px; display: block; }}
    @media print {{ .diagram-container {{ overflow-x: visible; }} svg {{ min-width: 0; }} }}
  </style>
</head>
<body>
  <div class="frame">
    <p class="eyebrow">{eyebrow}</p>
    <h1>{title}</h1>
    <div class="diagram-container">
      <svg viewBox="0 0 {w} {h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="{slug}-title {slug}-desc">
        <title id="{slug}-title">{title}</title>
        <desc id="{slug}-desc">{desc}</desc>
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#4f5d75"/></marker>
          <marker id="arrow-accent" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#bf4520"/></marker>
          <marker id="arrow-link" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#2e5aa8"/></marker>
{defs}
        </defs>
        <rect width="100%" height="100%" fill="#f5f5f5"/>
'''
TAIL = '''      </svg>
    </div>
    <p class="note">{note}</p>
  </div>
</body>
</html>
'''

def page(slug, w, h, eyebrow, title, desc, body, note, defs=''):
    html = HEAD.format(slug=slug, w=w, h=h, eyebrow=eyebrow, title=title, desc=desc, defs=defs) + body + TAIL.format(note=note)
    (OUT / f'{slug}.html').write_text(html, encoding='utf-8')

def g4(v): return int(-(-v // 4) * 4)
def mono_w(text, size=8): return g4(len(text) * size * 0.62 + 8)

def text(x, y, s, size=9, fill=INK, family=MONO, anchor='middle', weight=None, spacing=None, italic=False):
    extra = (f' font-weight="{weight}"' if weight else '') + (f' letter-spacing="{spacing}"' if spacing else '') + (' font-style="italic"' if italic else '')
    return f'        <text x="{x}" y="{y}" fill="{fill}" font-size="{size}" font-family="{family}" text-anchor="{anchor}"{extra}>{s}</text>\n'

def label_above(cx, line_y, s, fill=SOFT):
    w = mono_w(s)
    return (f'        <rect x="{cx - w // 2}" y="{line_y - 20}" width="{w}" height="12" rx="2" fill="{PAPER}"/>\n'
            + text(cx, line_y - 11, s, 8, fill, spacing='0.06em'))

def label_right(line_x, cy, s, fill=SOFT):
    w = mono_w(s)
    x = line_x + 8
    return (f'        <rect x="{x}" y="{cy - 6}" width="{w}" height="12" rx="2" fill="{PAPER}"/>\n'
            + text(x + w // 2, cy + 3, s, 8, fill, spacing='0.06em'))

def path(d, stroke=MUTED, marker='arrow', dash=None, width=1.2):
    dash_attr = f' stroke-dasharray="{dash}"' if dash else ''
    mk = f' marker-end="url(#{marker})"' if marker else ''
    return f'        <path d="{d}" fill="none" stroke="{stroke}" stroke-width="{width}"{dash_attr}{mk}/>\n'

KINDS = {
    'internal': ('#ffffff', INK, None),
    'focal': (ACCENT_TINT, ACCENT, None),
    'store': (ink(0.05), MUTED, None),
    'external': (ink(0.03), ink(0.30), None),
    'optional': ('#ffffff', MUTED, '4,3'),
    'user': (ink(0.03), MUTED, None),
}

def node(x, y, w, h, name, sub, tag, kind='internal', badge=None):
    fill, stroke, dash = KINDS[kind]
    dash_attr = f' stroke-dasharray="{dash}"' if dash else ''
    cx, cy = x + w // 2, y + h // 2
    tw = max(28, mono_w(tag, 7) - 4)
    s = (f'        <rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="{PAPER}"/>\n'
         f'        <rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="{fill}" stroke="{stroke}" stroke-width="1"{dash_attr}/>\n'
         f'        <rect x="{x + 8}" y="{y + 6}" width="{tw}" height="12" rx="2" fill="transparent" stroke="{stroke}" stroke-opacity="0.5" stroke-width="0.8"/>\n'
         + text(x + 8 + tw // 2, y + 15, tag, 7, ACCENT if kind == 'focal' else MUTED, spacing='0.08em')
         + text(cx, cy + 6, name, 12, INK, SANS, weight=600)
         + text(cx, cy + 20, sub, 9, MUTED))
    if badge is not None:
        bw = mono_w(badge, 8)
        s += (f'        <rect x="{x + w - bw - 6}" y="{y + 6}" width="{bw}" height="12" rx="2" fill="{PAPER}" stroke="{ink(0.30)}" stroke-width="0.8"/>\n'
              + text(x + w - 6 - bw // 2, y + 15, badge, 8, MUTED, spacing='0.06em'))
    return s

def zone(x, y, w, h, s):
    lw = mono_w(s, 7) + 4
    return (f'        <rect x="{x}" y="{y}" width="{w}" height="{h}" rx="8" fill="{ink(0.02)}" stroke="{ink(0.10)}" stroke-width="0.8"/>\n'
            f'        <rect x="{x + 12}" y="{y + 4}" width="{lw}" height="12" rx="2" fill="{PAPER}"/>\n'
            + text(x + 12 + lw // 2, y + 13, s, 7, SOFT, spacing='0.14em'))

def legend(y, w, items):
    s = (f'        <line x1="40" y1="{y}" x2="{w - 40}" y2="{y}" stroke="{ink(0.10)}" stroke-width="0.8"/>\n'
         + text(40, y + 16, 'CHÚ THÍCH', 8, MUTED, anchor='start', spacing='0.18em'))
    x = 40
    for draw, label, width in items:
        s += draw(x, y + 32) + text(x + 36, y + 36, label, 8.5, MUTED, SANS, anchor='start')
        x += width
    return s

def leg_line(stroke=MUTED, marker='arrow', dash=None):
    return lambda x, y: path(f'M{x},{y} H{x + 28}', stroke, marker, dash)

def leg_box(kind):
    fill, stroke, dash = KINDS[kind]
    d = f' stroke-dasharray="{dash}"' if dash else ''
    return lambda x, y: f'        <rect x="{x + 2}" y="{y - 6}" width="24" height="12" rx="3" fill="{fill}" stroke="{stroke}" stroke-width="1"{d}/>\n'

# ---------------------------------------------------------------- 1. Architecture (lúc chạy)
def architecture():
    W, H = 1000, 620
    b = ''
    b += zone(200, 108, 420, 272, 'TRÌNH DUYỆT · MÁY SUPPORT')
    b += zone(680, 168, 232, 212, 'TRANG TICKET (WEB NGOÀI)')
    b += zone(24, 428, 392, 112, 'TẠM ẨN · PHONE-UPLOAD (LAN)')
    # mũi tên trước node
    b += path('M160,248 H232')
    b += path('M392,234 H404 Q412,234 412,226 V176 Q412,168 420,168 H432')
    b += path('M392,248 H432')
    b += path('M392,262 H404 Q412,262 412,270 V320 Q412,328 420,328 H432')
    b += path('M592,328 H716')
    b += path('M796,300 V256', ACCENT, 'arrow-accent', width=1.4)
    b += path('M312,276 V460', LINK, 'arrow-link', '5,4')
    b += path('M160,488 H232', MUTED, 'arrow', '5,4')
    b += label_above(196, 248, 'NHẬP')
    b += label_above(654, 328, 'ĐỌC CLIPBOARD')
    b += label_right(796, 278, 'ĐIỀN FORM', ACCENT)
    b += label_right(312, 410, 'GỌI 127.0.0.1', LINK)
    b += label_above(196, 488, 'GỬI ẢNH')
    # node
    b += node(40, 220, 120, 56, 'Support', 'người dùng', 'USER', 'user')
    b += node(232, 220, 160, 56, 'Ticket Writer', 'index.html · file://', 'APP', 'focal')
    b += node(432, 140, 160, 56, 'localStorage', 'state · template · gợi ý', 'KV', 'store')
    b += node(432, 220, 160, 56, 'IndexedDB', 'ảnh đang dán', 'DB', 'store')
    b += node(432, 300, 160, 56, 'Clipboard', 'Title · Nội dung · SMS · ảnh', 'OS', 'store')
    b += node(716, 200, 160, 56, 'Ticket system', 'Subject · Description', 'EXT', 'external')
    b += node(716, 300, 160, 56, 'Điền ticket', 'bookmarklet', 'JS', 'internal')
    b += node(40, 460, 120, 56, 'iPad / iPhone', 'Safari · quét QR', 'IOS', 'optional')
    b += node(232, 460, 160, 56, 'phone-upload', 'PowerShell · :8765', 'SRV', 'optional')
    b += legend(560, W, [
        (leg_line(), 'gọi / ghi', 130),
        (leg_line(ACCENT, 'arrow-accent'), 'đường chính: điền ticket', 210),
        (leg_line(LINK, 'arrow-link', '5,4'), 'HTTP cục bộ (tạm ẩn)', 190),
        (leg_box('store'), 'kho của trình duyệt', 170),
        (leg_box('optional'), 'tạm ẩn', 120),
    ])
    page('architecture', W, H, 'Architecture · Ticket Writer', 'Ticket Writer lúc chạy',
         'Sơ đồ kiến trúc lúc chạy: Support nhập vào Ticket Writer chạy trên file://, app lưu vào localStorage và IndexedDB, copy ra clipboard để bookmarklet Điền ticket điền trang ticket; phone-upload nhận ảnh iPad đang tạm ẩn.',
         b, 'App không có server: mọi dữ liệu nằm trong trình duyệt của máy support. Đường ra ngoài duy nhất là clipboard → bookmarklet <code>Điền ticket</code> trên trang ticket. '
            'Nhánh phone-upload đang tắt bằng <code>phoneUpload.hidden</code> trong <code>config/app.js</code> (đang dùng Send Anywhere).')

# ---------------------------------------------------------------- 2. Dependency graph (layer)
def dependency():
    W, H = 960, 580
    b = ''
    b += path('M320,116 V140 Q320,148 312,148 H248 Q240,148 240,156 V180')
    b += path('M360,116 V300')
    b += path('M400,116 V140 Q400,148 408,148 H592 Q600,148 600,156 V180')
    b += path('M268,236 V260 Q268,268 276,268 H312 Q320,268 320,276 V300')
    b += path('M212,236 V440 Q212,448 220,448 H280', MUTED, 'arrow', '4,3', 1)
    b += path('M332,356 V420')
    b += path('M388,356 V380 Q388,388 396,388 H632 Q640,388 640,396 V420')
    b += path('M600,236 V380 a8,8 0 0,0 0,16 V420', MUTED, 'arrow', '4,3', 1)
    b += path('M800,116 V364 Q800,372 792,372 H688 Q680,372 680,380 V420')
    b += label_right(212, 384, 'CHỈ ĐỌC')
    b += label_above(500, 388, 'PORT, REGISTRY')
    b += label_right(600, 300, 'CÀI ĐẶT PORT')
    b += label_right(800, 240, 'ĐĂNG KÝ')
    b += node(280, 60, 160, 56, 'main.js', 'composition root', 'ROOT', badge='0 in')
    b += node(720, 60, 160, 56, 'config', 'loại · checklist · SMS', 'CFG', badge='0 in')
    b += node(160, 180, 160, 56, 'ui', 'DOM · form · dialog', 'UI', badge='1 in')
    b += node(520, 180, 160, 56, 'infrastructure', 'localStorage · IDB', 'INFRA', badge='1 in')
    b += node(280, 300, 160, 56, 'application', 'store · service', 'APP', badge='2 in')
    b += node(280, 420, 160, 56, 'domain', 'hàm thuần', 'DOM', 'store', badge='2 in')
    b += node(560, 420, 160, 56, 'core', 'registry · ports', 'CORE', 'store', badge='3 in')
    b += legend(516, W, [
        (leg_line(), 'phụ thuộc (gọi / dùng)', 200),
        (leg_line(MUTED, 'arrow', '4,3'), 'chỉ đọc · cài đặt port', 200),
        (leg_box('store'), 'lá: không phụ thuộc layer nào', 240),
        (lambda x, y: f'        <rect x="{x + 2}" y="{y - 6}" width="28" height="12" rx="2" fill="{PAPER}" stroke="{ink(0.30)}" stroke-width="0.8"/>\n' + text(x + 16, y + 3, 'N in', 8, MUTED), 'số layer dùng nó', 160),
    ])
    page('dependency', W, H, 'Dependency graph · Ticket Writer', 'Chiều phụ thuộc giữa các layer',
         'Đồ thị phụ thuộc giữa các layer: main.js nối ui, application, infrastructure; ui gọi application và chỉ đọc domain; application dùng domain và port; infrastructure cài đặt port; config đăng ký vào registry; không có vòng phụ thuộc.',
         b, 'Mọi mũi tên đều đi xuống: <b>không có vòng phụ thuộc</b>. <code>domain</code> và <code>core</code> là lá, không gọi layer nào. '
            'Không vẽ cho gọn: mọi file đều dùng <code>core/namespace.js</code> (biến <code>TW</code>); <code>main.js</code> còn đọc <code>registry</code> để tạo context. '
            'Port chỉ là typedef JSDoc, application không biết adapter cụ thể nào được dùng.')

# ---------------------------------------------------------------- 3. UML class (port KeyValueStore)
UML_DEFS = f'''          <marker id="uml-triangle" markerWidth="16" markerHeight="12" refX="15" refY="6" orient="auto" markerUnits="userSpaceOnUse"><polygon points="0 0, 16 6, 0 12" fill="{PAPER}" stroke="{INK}" stroke-width="1"/></marker>
          <marker id="uml-diamond-filled" markerWidth="18" markerHeight="10" refX="0" refY="5" orient="auto" markerUnits="userSpaceOnUse"><polygon points="0 5, 9 0, 18 5, 9 10" fill="{INK}"/></marker>
          <marker id="uml-diamond-hollow" markerWidth="18" markerHeight="10" refX="0" refY="5" orient="auto" markerUnits="userSpaceOnUse"><polygon points="0 5, 9 0, 18 5, 9 10" fill="{PAPER}" stroke="{INK}" stroke-width="1"/></marker>
          <marker id="uml-open" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,0 L9,4 L0,8" fill="none" stroke="{MUTED}" stroke-width="1"/></marker>'''

def uml_class(x, y, w, name, attrs, ops, interface=False):
    """Trả về (svg, chiều cao). Ngăn tên 40px, mỗi ngăn thành viên 20px/dòng + 20px đệm."""
    h = 40 + (20 * len(attrs) + 20 if attrs else 0) + (20 * len(ops) + 20 if ops else 0)
    cx = x + w // 2
    if interface:
        s = (f'        <rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="rgba(191,69,32,0.04)" stroke="{ACCENT}" stroke-width="1"/>\n'
             f'        <rect x="{x}" y="{y}" width="{w}" height="40" rx="6" fill="rgba(191,69,32,0.10)"/>\n'
             f'        <rect x="{x}" y="{y + 32}" width="{w}" height="8" fill="rgba(191,69,32,0.10)"/>\n'
             f'        <line x1="{x}" y1="{y + 40}" x2="{x + w}" y2="{y + 40}" stroke="rgba(191,69,32,0.40)" stroke-width="1"/>\n'
             + text(cx, y + 16, '«interface»', 8, ACCENT, spacing='0.08em')
             + text(cx, y + 32, name, 12, INK, SANS, weight=600))
    else:
        s = (f'        <rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="#ffffff" stroke="{INK}" stroke-width="1"/>\n'
             + text(cx, y + 24, name, 12, INK, SANS, weight=600))
    cy = y + 40
    for group in (attrs, ops):
        if not group:
            continue
        if cy > y + 40 or not interface:
            s += f'        <line x1="{x}" y1="{cy}" x2="{x + w}" y2="{cy}" stroke="{ink(0.22)}" stroke-width="1"/>\n'
        for i, member in enumerate(group):
            s += text(x + 16, cy + 20 * (i + 1), member, 9, INK, anchor='start')
        cy += 20 * len(group) + 20
    return s, h

def uml():
    W, H = 960, 640
    b = ''
    # quan hệ trước
    b += path('M560,240 V140', ACCENT, 'uml-triangle', '5,4', 1)
    b += path('M810,240 V140', ACCENT, 'uml-triangle', '5,4', 1)
    b += path('M320,64 H440', MUTED, 'uml-open', '4,3', 1)
    b += path('M320,240 H372 Q380,240 380,232 V96 Q380,88 388,88 H440', MUTED, 'uml-open', '4,3', 1)
    b += path('M320,464 H396 Q404,464 404,456 V120 Q404,112 412,112 H440', MUTED, 'uml-open', '4,3', 1)
    b += label_above(352, 64, 'DÙNG')
    for svg, _ in [
        uml_class(440, 40, 400, 'KeyValueStore', [], ['+ read(key: string): any', '+ write(key: string, value: any): boolean'], interface=True),
        uml_class(440, 240, 240, 'LocalStorageAdapter', [], ['+ read(key): any  // lỗi → null', '+ write(key, value): boolean']),
        uml_class(720, 240, 180, 'FakeStorage (test)', ['+ data: Object'], ['+ read(key): any', '+ write(key, value): true']),
        uml_class(40, 40, 280, 'SummaryHistoryService', ['- entries: string[]  // ≤ 300'], ['+ list(): string[]', '+ remember(value): void']),
        uml_class(40, 220, 280, 'CategoryService', ['- custom: string[]'], ['+ options(): string[]', '+ add(value): void', '+ remove(value): void', '+ importMany(values): number']),
        uml_class(40, 440, 280, 'SessionRepository', [], ['+ load(): State', '+ save(state): boolean']),
    ]:
        b += svg
    y = 572
    b += (f'        <line x1="40" y1="{y}" x2="{W - 40}" y2="{y}" stroke="{ink(0.10)}" stroke-width="0.8"/>\n'
          + text(40, y + 16, 'CHÚ THÍCH · QUAN HỆ', 8, MUTED, anchor='start', spacing='0.18em'))
    items = [(INK, 'uml-triangle', None, 'end', 'Kế thừa'), (INK, 'uml-triangle', '5,4', 'end', 'Cài đặt (implements)'),
             (INK, 'uml-diamond-filled', None, 'start', 'Composition · sở hữu'), (INK, 'uml-diamond-hollow', None, 'start', 'Aggregation · có'),
             (MUTED, 'uml-open', None, 'end', 'Association'), (MUTED, 'uml-open', '4,3', 'end', 'Phụ thuộc · dùng')]
    x = 40
    for stroke, marker, dash, end, name in items:
        d = f' stroke-dasharray="{dash}"' if dash else ''
        b += f'        <line x1="{x}" y1="{y + 36}" x2="{x + 28}" y2="{y + 36}" stroke="{stroke}" stroke-width="1"{d} marker-{end}="url(#{marker})"/>\n'
        b += text(x + 36, y + 40, name, 8.5, MUTED, SANS, anchor='start')
        x += 148
    page('uml-class', W, H, 'UML class · Ticket Writer', 'Port KeyValueStore và nơi dùng',
         'Sơ đồ lớp UML: interface KeyValueStore được LocalStorageAdapter và FakeStorage của test cài đặt; SummaryHistoryService, CategoryService và SessionRepository chỉ phụ thuộc vào interface này.',
         b, 'Code thật là factory + closure (<code>createLocalStorage()</code>, <code>createSummaryHistoryService(deps)</code>), không phải <code>class</code>; sơ đồ vẽ theo UML để thấy hợp đồng. '
            'Service nhận <code>storage</code> qua tham số nên test thay bằng FakeStorage mà không đổi code (D + L trong SOLID). '
            'ThemeService, StaffService, TemplateService, PhoneService cũng dùng port này, không vẽ cho gọn.',
         UML_DEFS)

# ---------------------------------------------------------------- 4. Sequence (gõ Tóm tắt → Kết quả)
def sequence():
    W, H = 1080, 800
    X = {'user': 100, 'form': 300, 'svc': 500, 'store': 700, 'out': 900}
    b = ''
    for cx in X.values():
        b += f'        <line x1="{cx}" y1="112" x2="{cx}" y2="712" stroke="{ink(0.22)}" stroke-width="1" stroke-dasharray="3,3"/>\n'
    # khung opt
    b += (f'        <rect x="64" y="560" width="400" height="144" rx="4" fill="{ink(0.02)}" stroke="{ink(0.22)}" stroke-width="1"/>\n'
          f'        <rect x="64" y="560" width="40" height="16" rx="2" fill="{PAPER}" stroke="{ink(0.22)}" stroke-width="1"/>\n'
          + text(84, 572, 'OPT', 8, MUTED, spacing='0.12em')
          + text(76, 592, '[change: Enter / rời ô]', 8, MUTED, anchor='start', spacing='0.04em'))
    for cx, top, bottom in [(300, 160, 216), (500, 208, 264), (700, 256, 376), (900, 368, 528), (300, 628, 692)]:
        b += f'        <rect x="{cx - 4}" y="{top}" width="8" height="{bottom - top}" fill="{ink(0.06)}" stroke="{MUTED}" stroke-width="0.8"/>\n'
    line = lambda x1, x2, y, stroke=MUTED, marker='arrow', dash=None, width=1.2: path(f'M{x1},{y} H{x2}', stroke, marker, dash, width)
    loop = lambda cx, y: path(f'M{cx + 4},{y} H{cx + 40} V{y + 32} H{cx + 4}')
    b += line(100, 296, 160)
    b += line(304, 496, 208)
    b += line(504, 696, 256)
    b += loop(700, 296)
    b += path(f'M704,368 H896', MUTED, 'seq-open', '5,4')
    b += loop(900, 400)
    b += loop(900, 456)
    b += line(896, 100, 520, ACCENT, 'arrow-accent', None, 1.4)
    b += line(100, 296, 628)
    b += loop(300, 652)
    b += label_above(200, 160, 'GÕ TÓM TẮT')
    b += label_above(400, 208, 'SETFIELD(SUMMARY)')
    b += label_above(600, 256, 'UPDATE(MUTATE)')
    b += label_right(740, 312, 'LƯU LOCALSTORAGE')
    b += label_above(800, 368, 'SCHEDULE()')
    b += label_right(940, 416, 'CHỜ 400MS')
    b += label_right(940, 472, 'TITLE + BODY')
    b += label_above(600, 520, 'TITLE IN HOA · NÚT COPY', ACCENT)
    b += label_above(216, 628, 'ENTER / RỜI Ô')
    b += label_right(340, 668, 'LƯU GỢI Ý IN HOA')
    for key, name, sub in [('user', 'Support', 'người dùng'), ('form', 'TicketForm', 'ui/ticket-form'), ('svc', 'TicketService', 'application'),
                           ('store', 'Store', 'application/store'), ('out', 'OutputView', 'ui/output-view')]:
        cx = X[key]
        kind = 'user' if key == 'user' else 'internal'
        fill, stroke, _ = KINDS[kind]
        b += (f'        <rect x="{cx - 76}" y="64" width="152" height="48" rx="6" fill="{fill}" stroke="{stroke}" stroke-width="1"/>\n'
              + text(cx, 86, name, 12, INK, SANS, weight=600) + text(cx, 102, sub, 9, MUTED))
    b += legend(740, W, [
        (leg_line(), 'gọi (sync)', 140),
        (leg_line(MUTED, 'seq-open', '5,4'), 'báo không chờ (async)', 200),
        (leg_line(ACCENT, 'arrow-accent'), 'kết quả người dùng thấy', 220),
        (lambda x, y: f'        <rect x="{x + 10}" y="{y - 8}" width="8" height="16" fill="{ink(0.06)}" stroke="{MUTED}" stroke-width="0.8"/>\n', 'đang xử lý', 140),
    ])
    defs = f'          <marker id="seq-open" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polyline points="0 0, 8 3, 0 6" fill="none" stroke="{MUTED}" stroke-width="1.2"/></marker>'
    page('sequence', W, H, 'Sequence · Ticket Writer', 'Gõ Tóm tắt đến khi Kết quả cập nhật',
         'Sơ đồ tuần tự: Support gõ Tóm tắt, TicketForm gọi TicketService.setField, Store đổi state và lưu localStorage, báo OutputView; sau 400ms OutputView dựng Title in hoa và mở nút Copy; khi rời ô, Tóm tắt được lưu IN HOA vào danh sách gợi ý.',
         b, 'Store không tự lưu: hàm <code>subscribe</code> trong <code>main.js</code> gọi <code>repository.save()</code> rồi <code>output.schedule()</code>. '
            'Title, Nội dung và điều kiện Copy do <code>outputService.compute()</code> ghép từ <code>domain/title</code>, <code>domain/body</code>, <code>domain/validation</code>; '
            'khối SMS Promotion đang bật thì chi tiết từ <code>domain/sms-message</code> in thêm cuối mục Đã support. '
            'Gợi ý Tóm tắt dùng sự kiện <code>change</code>, nên gõ từng phím không ghi vào lịch sử.',
         defs)

if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    architecture(); dependency(); uml(); sequence()
    print('ok')
