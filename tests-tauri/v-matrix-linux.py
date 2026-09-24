#!/usr/bin/env python3
"""Matriz V1-V9 del plan de portapapeles sobre Linux X11 (harness manual).

Uso:
    xvfb-run -a dbus-run-session -- sh tests-tauri/v-matrix-linux.sh

Requiere: xdotool, xclip, python3-pyatspi, at-spi2-core, xvfb y el binario
debug compilado (pnpm test:e2e:tauri lo genera en src-tauri/target/debug).

Interacciona con la app por vías reales: teclas sintéticas X11 (xdotool),
portapapeles X11 (xclip, incluido el target text/html) y el bus de
accesibilidad AT-SPI (lo que consumiria Orca). No es un test automatizado de
CI: hay acarreo de estado entre fases y tiempos sensibles al entorno.
"""

import re
import subprocess
import sys
import time

import pyatspi

RESULTS = []


def report(vid, desc, ok, detail=''):
    RESULTS.append((vid, desc, ok, detail))
    print(f'{"PASS" if ok else "FAIL"} {vid} {desc} {detail}', flush=True)


WID = None


def xdo(*args):
    subprocess.run(['xdotool'] + [str(a) for a in args], check=True)


def key(*keys):
    for k in keys:
        xdo('key', '--window', WID, k)
        time.sleep(0.15)


def type_text(s):
    xdo('type', '--window', WID, '--delay', '20', s)


def click_at(x, y, button='1'):
    xdo('mousemove', x, y)
    time.sleep(0.2)
    xdo('click', button)


def clip_get(target=None):
    cmd = ['xclip', '-o', '-selection', 'clipboard']
    if target:
        cmd += ['-t', target]
    r = subprocess.run(cmd, capture_output=True, text=True)
    return r.stdout


def clip_set(s):
    subprocess.run(['xclip', '-selection', 'clipboard'], input=s.encode(),
                   check=True)


def desktop_app():
    d = pyatspi.Registry.getDesktop(0)
    for i in range(d.childCount):
        a = d.getChildAtIndex(i)
        if 'bruma' in (a.name or '').lower():
            return a
    return None


def find_all(node, pred, out, depth=0, maxdepth=16):
    if depth > maxdepth:
        return
    try:
        if pred(node):
            out.append(node)
        for i in range(min(node.childCount, 100)):
            find_all(node.getChildAtIndex(i), pred, out, depth + 1, maxdepth)
    except Exception:
        pass


def find(node, pred):
    out = []
    find_all(node, pred, out)
    return out[0] if out else None


def press(acc):
    act = acc.queryAction()
    act.doAction(0)


def center(acc):
    c = acc.queryComponent()
    ext = c.getExtents(pyatspi.DESKTOP_COORDS)
    return ext.x + ext.width // 2, ext.y + ext.height // 2


def click_acc(acc, button='1'):
    x, y = center(acc)
    click_at(x, y, button)


def norm(name):
    return (name or '').lower()


def names_match(name, options):
    return any(o.lower() in norm(name) for o in options)


def menu_item(app, menu_name, item_name):
    menus = menu_name if isinstance(menu_name, (list, tuple)) else [menu_name]
    items = item_name if isinstance(item_name, (list, tuple)) else [item_name]
    menu = find(app, lambda n: n.getRoleName() == 'menu' and names_match(n.name, menus))
    if not menu:
        return None
    # click real sobre el título del menú para abrir el popup
    try:
        click_acc(menu)
    except Exception:
        return None
    time.sleep(0.8)
    item = find(app, lambda n: 'menu item' in n.getRoleName() and names_match(n.name, items))
    if not item:
        key('Escape')
        return None
    try:
        click_acc(item)
    except Exception:
        key('Escape')
        return None
    time.sleep(0.4)
    return item


def editor_acc(app):
    return find(app, lambda n: n.getRoleName() == 'entry' and 'ditor' in (n.name or ''))


def editor_text(app):
    e = editor_acc(app)
    if not e:
        return None
    t = e.queryText()
    return t.getText(0, t.characterCount)


def focus_editor(app):
    e = editor_acc(app)
    if not e:
        return False
    try:
        e.queryComponent().grabFocus()
    except Exception:
        pass
    for _ in range(4):
        click_acc(e)
        time.sleep(0.5)
        before = editor_text(app) or ''
        type_text('.')
        time.sleep(0.5)
        after = editor_text(app) or ''
        if len(after) > len(before):
            key('ctrl+z')
            time.sleep(0.4)
            return True
    return False


def new_doc(app):
    menu_item(app, ['Archivo', 'File'], ['Nuevo', 'New'])
    time.sleep(1.5)
    key('Escape')
    time.sleep(0.5)
    return focus_editor(app)


def wait_window():
    global WID
    for _ in range(60):
        r = subprocess.run(['xdotool', 'search', '--name', 'Bruma'],
                           capture_output=True, text=True)
        if r.stdout.strip():
            WID = r.stdout.strip().split()[-1]
            subprocess.run(['xdotool', 'windowfocus', WID], capture_output=True)
            return True
        time.sleep(0.5)
    return False


def wait_app():
    for _ in range(40):
        a = desktop_app()
        if a:
            return a
        time.sleep(0.5)
    return None


if not wait_window():
    print('NO WINDOW')
    sys.exit(1)
app = wait_app()
if not app:
    print('NO APP ON A11Y')
    sys.exit(1)
for _ in range(30):
    if find(app, lambda n: n.getRoleName() == 'document web'):
        break
    time.sleep(0.5)
key('Escape')  # descarta 'Recuperar sesión' si aparece
time.sleep(1)
key('Escape')
time.sleep(1)

# --- SETUP: Ctrl+N real ---
ok = False
for _ in range(4):
    key('ctrl+n')
    time.sleep(2.5)
    if editor_acc(app):
        ok = True
        break
ok = ok and focus_editor(app)
report('SETUP', 'Ctrl+N abre documento nuevo (entry accesible)', ok)

# --- V1: Ctrl+C / Ctrl+V en el editor ---
type_text('hola mundo linux')
time.sleep(0.8)
key('ctrl+a'); time.sleep(0.4)
key('ctrl+c'); time.sleep(0.6)
c = clip_get()
key('End'); time.sleep(0.3)
key('Return'); time.sleep(0.3)
key('ctrl+v'); time.sleep(0.8)
txt = editor_text(app) or ''
report('V1', 'Ctrl+C/V en el editor',
       'hola mundo linux' in c and txt.count('hola mundo linux') >= 2,
       f'clip={c[:40]!r}')

# --- V2: menú Editar ---
new_doc(app)
type_text('abc')
time.sleep(0.6)
menu_item(app, ['Editar', 'Edit'], ['Seleccionar todo', 'Select all']); time.sleep(0.5)
menu_item(app, ['Editar', 'Edit'], ['Copiar', 'Copy']); time.sleep(0.6)
c = clip_get()
ok_copy = 'abc' in c
clip_set('PASTE-MENU')
key('End'); time.sleep(0.2)
menu_item(app, ['Editar', 'Edit'], ['Pegar', 'Paste']); time.sleep(0.8)
txt = editor_text(app) or ''
report('V2', 'Menú Editar Copiar/Pegar', ok_copy and 'PASTE-MENU' in txt,
       f'copy={ok_copy} txt={txt[:50]!r}')

# --- V3: botón Pegar (navigator.clipboard.readText) — click real ---
new_doc(app)
type_text('aaa')
time.sleep(0.5)
clip_set('PASTE-BUTTON')
time.sleep(0.8)
btn = find(app, lambda n: n.getRoleName() == 'push button' and names_match(n.name, ['Pegar', 'Paste']) and 'ega' not in norm(n.name))
if btn:
    click_acc(btn)
    time.sleep(1.2)
    txt = editor_text(app) or ''
    report('V3', 'Botón Pegar navigator.clipboard', 'PASTE-BUTTON' in txt,
           f'txt={txt[:50]!r}')
else:
    report('V3', 'Botón Pegar navigator.clipboard', False,
           'botón no encontrado/deshabilitado')

# --- V4: Ctrl+Z / Ctrl+Y en el editor ---
focus_editor(app)
type_text('XYZ')
time.sleep(0.6)
key('ctrl+z'); time.sleep(0.8)
txt = editor_text(app) or ''
undone = 'XYZ' not in txt
key('ctrl+y'); time.sleep(0.8)
txt2 = editor_text(app) or ''
report('V4', 'Ctrl+Z / Ctrl+Y en el editor', undone and 'XYZ' in txt2,
       f'undone={undone} redone={"XYZ" in txt2}')

# --- V5: Ctrl+Z en el campo de búsqueda ---
key('ctrl+f'); time.sleep(1.2)
type_text('buscar-esto'); time.sleep(0.7)
search = find(app, lambda n: n.getRoleName() == 'entry' and names_match(n.name, ['uscar', 'earch']))
before = None
if search:
    t = search.queryText(); before = t.getText(0, t.characterCount)
key('ctrl+z'); time.sleep(0.6)
after = None
if search:
    try:
        t = search.queryText(); after = t.getText(0, t.characterCount)
    except Exception:
        pass
report('V5', 'Ctrl+Z deshace en campo de búsqueda',
       before == 'buscar-esto' and (after == '' or after is None),
       f'before={before!r} after={after!r}')
key('Escape'); time.sleep(0.5)

# --- V6: copiar selección de texto en la vista previa ---
new_doc(app)
type_text('TEXTO-UNICO-PREVIEW-123')
time.sleep(0.6)
txt_ed = editor_text(app) or ''
print('V6-pre editor:', txt_ed[:60], flush=True)
menu_item(app, ['Ver', 'View'], ['Vista previa', 'Preview']); time.sleep(1.5)
# arrastrar sobre el contenido de la preview para seleccionar texto real
def dump_web(node, depth=0, maxdepth=14):
    try:
        name = (node.name or '')[:50]
        role = node.getRoleName()
    except Exception:
        return
    if 'text' in role or 'paragraph' in role or 'heading' in role or 'section' in role or 'document' in role:
        print('  ' * depth + f'{role} {name!r}', flush=True)
    if depth >= maxdepth:
        return
    try:
        for i in range(min(node.childCount, 80)):
            dump_web(node.getChildAtIndex(i), depth + 1, maxdepth)
    except Exception:
        pass


dump_web(app)
prev = find(app, lambda n: 'TEXTO-UNICO' in (n.name or ''))
drag_ok = False
if prev:
    c = prev.queryComponent()
    ext = c.getExtents(pyatspi.DESKTOP_COORDS)
    xdo('mousemove', ext.x + 2, ext.y + ext.height // 2)
    time.sleep(0.2)
    xdo('mousedown', '1')
    time.sleep(0.2)
    xdo('mousemove', ext.x + ext.width - 2, ext.y + ext.height // 2)
    time.sleep(0.2)
    xdo('mouseup', '1')
    time.sleep(0.5)
    key('ctrl+c'); time.sleep(0.6)
    c = clip_get()
    drag_ok = 'TEXTO-UNICO' in c
report('V6', 'Copiar selección desde vista previa', drag_ok,
       f'clip={c[:60]!r}' if prev else 'preview acc no encontrada')
menu_item(app, ['Ver', 'View'], ['Editor']); time.sleep(1.2)

# --- V7: menú contextual propio en editor ---
focus_editor(app)
e = editor_acc(app)
click_acc(e, '3')
time.sleep(1.0)
ctx = find(app, lambda n: 'menu item' in n.getRoleName() and names_match(
    n.name, ['Cortar', 'Cut', 'Copiar', 'Copy', 'Pegar', 'Paste',
             'Seleccionar todo', 'Select all']))
found_names = []
if ctx:
    parent = ctx.get_parent()
    if parent:
        for i in range(parent.childCount):
            found_names.append(parent.getChildAtIndex(i).name)
key('Escape'); time.sleep(0.5)
report('V7', 'Menú contextual propio en editor', ctx is not None,
       f'items={found_names}')

# --- V8: menú nativo cambia de idioma ---
menu_item(app, ['Idioma', 'Language'], ['Inglés', 'English']); time.sleep(1.5)
menus = []
mb = find(app, lambda n: n.getRoleName() == 'menu bar')
if mb:
    for i in range(mb.childCount):
        menus.append(mb.getChildAtIndex(i).name)
ok_en = 'File' in menus or 'Edit' in menus
menu_item(app, ['Idioma', 'Language'], ['Español', 'Spanish']); time.sleep(1.2)
report('V8', 'Menú nativo cambia al cambiar idioma', ok_en, f'menus={menus}')

# --- V9: Copiar como HTML ---
focus_editor(app)
key('ctrl+a'); time.sleep(0.3)
menu_item(app, ['Editar', 'Edit'], ['Copiar como HTML', 'Copy as HTML']); time.sleep(1.0)
time.sleep(0.5)
targets = clip_get('TARGETS')
html = clip_get('text/html')
report('V9', 'Copiar como HTML (target text/html)', '<' in html,
       f'targets={targets.strip()[:120]!r} html={html[:80]!r}')

print('=== RESUMEN ===')
for vid, desc, ok, detail in RESULTS:
    print(f'{"PASS" if ok else "FAIL"} {vid}')
