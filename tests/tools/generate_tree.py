"""Sinh docs/diagrams/tree.html: cây thư mục dự án (tổng quan + src/ + config/), số file đếm từ ổ đĩa.

Dùng:  python tests/tools/generate_tree.py   (thêm/bớt file thì chạy lại để số file đúng)
"""
import pathlib

import generate_diagrams as g   # cùng thư mục: dùng lại hàm vẽ node / path / text

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs' / 'diagrams'


def count(rel):
    return sum(1 for p in (ROOT / rel).rglob('*') if p.is_file() and '__pycache__' not in p.parts)


W, NODE_H = 960, 52


def bus(px, py, children_x, cy):
    mid = (py + cy) // 2
    s = g.path(f'M{px},{py} V{mid}', g.MUTED, None, width=1)
    s += g.path(f'M{min(children_x)},{mid} H{max(children_x)}', g.MUTED, None, width=1)
    for x in children_x:
        s += g.path(f'M{x},{mid} V{cy}', g.MUTED, None, width=1)
    return s


def tnode(cx, y, w, name, sub, tag, kind='internal', badge=None):
    return g.node(cx - w // 2, y, w, NODE_H, name, sub, tag, kind, badge)


def svg(slug, h, title, desc, body):
    return (f'    <div class="diagram-container">\n'
            f'      <svg viewBox="0 0 {W} {h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="{slug}-title {slug}-desc">\n'
            f'        <title id="{slug}-title">{title}</title>\n        <desc id="{slug}-desc">{desc}</desc>\n'
            f'        <rect width="100%" height="100%" fill="{g.PAPER}"/>\n{body}      </svg>\n    </div>\n')


def overview():
    leaves = [(100, 'styles/', f'{count("styles")} file CSS', 'CSS', 'internal'),
              (252, 'config/', f'{count("config")} file · dữ liệu', 'CFG', 'internal'),
              (404, 'src/', f'{count("src")} file JS · logic', 'JS', 'internal'),
              (556, 'tests/', 'test + tool Python', 'TEST', 'store'),
              (708, 'docs/', 'tài liệu + sơ đồ', 'DOC', 'store'),
              (860, 'phone-upload/', 'nhận ảnh (tạm ẩn)', 'SRV', 'optional')]
    b = bus(480, 76, [252, 708], 144) + bus(252, 196, [100, 252, 404], 264) + bus(708, 196, [556, 708, 860], 264)
    b += tnode(480, 24, 176, 'littlesecret/', 'index.html · README', 'ROOT', 'focal')
    b += tnode(252, 144, 176, 'Chạy app', 'index.html nạp hết', 'APP')
    b += tnode(708, 144, 176, 'Phụ trợ', 'không cần để chạy', 'DEV', 'store')
    for cx, name, sub, tag, kind in leaves:
        b += tnode(cx, 264, 144, name, sub, tag, kind)
    return svg('tree-overview', 340, 'Cây thư mục Ticket Writer · tổng quan',
               'Cây thư mục: gốc dự án chia thành nhóm chạy app (styles, config, src) và nhóm phụ trợ (tests, docs, phone-upload).', b)


def src_tree():
    layers = [('core/', 'TW · registry · ports', 'CORE'), ('domain/', 'hàm thuần, không DOM', 'DOM'),
              ('application/', 'store + service', 'APP'), ('infrastructure/', 'adapter API trình duyệt', 'INFRA'),
              ('ui/', 'view · form · dialog', 'UI')]
    xs = [112, 296, 480, 664, 848]
    b = bus(480, 76, xs, 144)
    b += tnode(480, 24, 176, 'src/', 'main.js = composition root', 'JS')
    for x, (name, sub, tag) in zip(xs, layers):
        b += tnode(x, 144, 160, name, sub, tag, 'focal' if name == 'domain/' else 'internal', f'{count("src/" + name)} file')
    return svg('tree-src', 220, 'src/ · 5 layer',
               'Cây thư mục src: main.js và 5 layer core, domain, application, infrastructure, ui kèm số file mỗi layer.', b)


def config_tree():
    kids = [('app.js', 'version · key · nhãn', 'CFG', None), ('notifications.js', 'cảnh báo lưu trữ', 'CFG', None),
            ('tickets/', 'incident · transfer · pass-case', 'DIR', count('config/tickets')),
            ('setup/', 'catalog + checklist', 'DIR', count('config/setup')),
            ('sms/', 'promotion · shipping…', 'DIR', count('config/sms'))]
    xs = [112, 296, 480, 664, 848]
    b = bus(480, 76, xs, 144) + bus(664, 196, [480, 664, 848], 264)
    b += tnode(480, 24, 176, 'config/', 'chỉ khai báo, không logic', 'CFG')
    for x, (name, sub, tag, n) in zip(xs, kids):
        b += tnode(x, 144, 160, name, sub, tag, badge=f'{n} file' if n else None)
    b += tnode(480, 264, 160, 'catalog.js', 'Thiết bị → Hãng → Model', 'CFG', 'store')
    b += tnode(664, 264, 160, 'pos/', 'abc/new', 'DIR', 'store', f'{count("config/setup/pos")} file')
    b += tnode(848, 264, 160, 'terminal/', 'pax · valor', 'DIR', 'store', f'{count("config/setup/terminal")} file')
    return svg('tree-config', 340, 'config/ · dữ liệu cấu hình',
               'Cây thư mục config: app.js, notifications.js, tickets, setup (catalog, pos, terminal) và sms.', b)


head = g.HEAD.split('<body>')[0].format(slug='tree', w=W, h=0, eyebrow='', title='Cây thư mục Ticket Writer', desc='', defs='')
head = head.replace('.diagram-container { width: 100%; overflow-x: auto; }',
                    '.diagram-container { width: 100%; overflow-x: auto; margin-bottom: 2rem; }\n'
                    '    h2 { font-family: var(--font-mono); font-size: 0.7rem; letter-spacing: 0.18em; text-transform: uppercase;'
                    ' color: var(--color-muted); font-weight: 500; margin: 0.5rem 0; }')
note = ('Số file đếm lúc sinh sơ đồ. Thêm loại ticket hoặc checklist = thêm file trong <code>config/</code>, không sửa <code>src/</code>. '
        'Checklist setup theo đường <code>config/setup/&lt;thiết bị&gt;/&lt;hãng&gt;/&lt;new|replace&gt;/&lt;checklist&gt;.js</code>. '
        'Ở gốc còn <code>README.md</code>, <code>CLAUDE.md</code>, <code>CHANGELOG.md</code>, <code>skills-lock.json</code>.')
html = (head + '<body>\n  <div class="frame">\n    <p class="eyebrow">Tree · Ticket Writer</p>\n    <h1>Cây thư mục Ticket Writer</h1>\n'
        + '    <h2>1 · Tổng quan</h2>\n' + overview()
        + '    <h2>2 · src/ (Clean Architecture)</h2>\n' + src_tree()
        + '    <h2>3 · config/ (thêm loại / checklist ở đây)</h2>\n' + config_tree()
        + f'    <p class="note">{note}</p>\n  </div>\n</body>\n</html>\n')
(OUT / 'tree.html').write_text(html, encoding='utf-8')
print('ok')
