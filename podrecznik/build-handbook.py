#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Buduje js/modules/sales-handbook.js z samodzielnego pliku podrecznik-sprzedazy.html.

Użycie (po podmianie podręcznika):
    python3 podrecznik/build-handbook.py
    → nadpisuje js/modules/sales-handbook.js; potem podbij ?v= w index.html.

Co robi:
  • CSS: każdy selektor dostaje prefiks .wai-handbook (żeby style podręcznika nie
    wyciekały na aplikację i odwrotnie); znaczniki header/main/aside/section.out
    zamieniane na klasy .hb-header/.hb-main/.hb-aside/.hb-out.
  • HTML: to samo mapowanie znaczników, wszystkie id dostają prefiks hb-.
  • JS: dane + logika zamknięte w IIFE (żadnych globali), document.getElementById
    → $id (z prefiksem hb-), nasłuchy na document → na kontenerze modułu,
    stan (cur/AC/checked/MAIL) trwały między otwarciami zakładki.
"""
import re, json, pathlib, datetime

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'podrecznik' / 'podrecznik-sprzedazy.html'
OUT = ROOT / 'js' / 'modules' / 'sales-handbook.js'

t = SRC.read_text(encoding='utf-8')
css = re.findall(r'<style[^>]*>(.*?)</style>', t, flags=re.S)[0]
scripts = re.findall(r'<script[^>]*>(.*?)</script>', t, flags=re.S)
data_js, logic_js = scripts[0], scripts[1]
body = re.search(r'<body[^>]*>(.*)</body>', t, flags=re.S).group(1)
body = re.sub(r'<script.*?</script>', '', body, flags=re.S).strip()

# ── CSS ──────────────────────────────────────────────────────────────────────
TAG_MAP = [
    (r'(?<![\w.#-])section\.out(?![\w-])', '.hb-out'),
    (r'(?<![\w-])\.out(?![\w-])', '.hb-out'),
    (r'(?<![\w.#-])header(?![\w-])', '.hb-header'),
    (r'(?<![\w.#-])main(?![\w-])', '.hb-main'),
    (r'(?<![\w.#-])aside(?![\w-])', '.hb-aside'),
]
def map_tags(sel):
    for pat, rep in TAG_MAP:
        sel = re.sub(pat, rep, sel)
    return sel

def scope_selector(sel):
    sel = sel.strip()
    if not sel: return sel
    if sel == ':root': return '.wai-handbook'
    if sel == 'html,body' or sel == 'html, body': return '.wai-handbook'
    if sel == '*': return '.wai-handbook *'
    parts = []
    for p in sel.split(','):
        p = map_tags(p.strip())
        if not p.startswith('.wai-handbook'):
            p = '.wai-handbook ' + p
        parts.append(p)
    return ','.join(parts)

def scope_css(src):
    out, buf, depth = [], '', 0
    i = 0
    while i < len(src):
        c = src[i]
        if c == '{':
            sel = buf
            buf = ''
            if sel.strip().startswith('@'):
                out.append(sel + '{'); depth += 1
            else:
                out.append(scope_selector(sel) + '{'); depth += 1
        elif c == '}':
            out.append(buf + '}'); buf = ''; depth -= 1
        else:
            buf += c
        i += 1
    out.append(buf)
    return ''.join(out)

scoped_css = scope_css(css)
# html,body miało margin:0 i tło całej strony — w aplikacji chcemy tylko kontener.
scoped_css = scoped_css.replace('.wai-handbook{margin:0;background:var(--bg)',
                                '.wai-handbook{margin:0;border-radius:10px;overflow:hidden;background:var(--bg)')
# Nagłówek podręcznika nie powinien "przyklejać się" ponad nagłówkiem aplikacji.
scoped_css = scoped_css.replace('position:sticky;top:0;z-index:5', 'position:relative;z-index:1')
# Wysokość: w aplikacji nie zakładamy pełnego okna.
scoped_css = scoped_css.replace('min-height:calc(100vh - 60px)', 'min-height:60vh')
# Reset wewnętrznych stylów aplikacji na przyciskach/inputach w kontenerze.
scoped_css += ('\n.wai-handbook button{box-shadow:none;text-transform:none;letter-spacing:0}'
               '\n.wai-handbook h1,.wai-handbook h2,.wai-handbook h3{color:inherit}'
               '\n@media print{body *{visibility:hidden}.wai-handbook,.wai-handbook *{visibility:visible}'
               '.wai-handbook{position:absolute;left:0;top:0;width:100%}}')

# ── HTML ────────────────────────────────────────────────────────────────────
html = body
html = re.sub(r'<header>', '<div class="hb-header">', html)
html = html.replace('</header>', '</div>')
html = re.sub(r'<main>', '<div class="hb-main">', html)
html = html.replace('</main>', '</div>')
html = re.sub(r'<aside id="side">', '<div class="hb-aside" id="side">', html)
html = html.replace('</aside>', '</div>')
html = re.sub(r'<section class="out">', '<div class="hb-out">', html)
html = html.replace('</section>', '</div>')
html = re.sub(r'\bid="([A-Za-z0-9_-]+)"', r'id="hb-\1"', html)
html = '<div class="wai-handbook" id="hb-root" data-i18n-skip lang="pl">\n' + html + '\n</div>'

# ── JS: logika ──────────────────────────────────────────────────────────────
js = logic_js
js = js.replace('document.getElementById(', '$id(')
js = js.replace('document.querySelector("main")', '$root.querySelector(".hb-main")')
js = js.replace('document.addEventListener(', '$root.addEventListener(')
js = js.replace('window.addEventListener("message",', 'hbOnce("message",')
js = re.sub(r'\bid=\\"([A-Za-z0-9_-]+)\\"', r'id=\\"hb-\1\\"', js)   # w łańcuchach z \"
js = re.sub(r'\bid="([A-Za-z0-9_-]+)"', r'id="hb-\1"', js)          # w szablonach `...`
js = js.replace('b.id==="kgo"', 'b.id==="hb-kgo"')
js = js.replace('e.target.id==="bsel"', 'e.target.id==="hb-bsel"')
js = js.replace('window.__hits', 'HB.__hits')
# Stan ma przetrwać zamknięcie i ponowne otwarcie zakładki.
js = re.sub(r'^let (cur|MAIL|AC|checked)=', r'\1=\1||', js, flags=re.M)
assert '$id("nav")' in js and 'cur=cur||' in js and 'checked=checked||' in js, 'Nie rozpoznano struktury logiki'

module = f'''// js/modules/sales-handbook.js
// ─────────────────────────────────────────────────────────────────────────────
// Zakładka „Podręcznik sprzedaży" — PLIK GENEROWANY, nie edytuj ręcznie.
// Źródło: podrecznik/podrecznik-sprzedazy.html  →  python3 podrecznik/build-handbook.py
// Wygenerowano: {datetime.date.today().isoformat()}
//
// Podręcznik jest natywną częścią aplikacji: jego HTML wchodzi do #module-content,
// CSS jest zawężony do .wai-handbook, a cała logika (wyszukiwarka, akademia,
// kalkulator HDD, generator maili) działa w zamknięciu bez globali.
// Kontener ma data-i18n-skip — treść jest po polsku i nie przechodzi przez
// silnik tłumaczeń aplikacji. Moduł jest wyłącznie prezentacyjny.
// Kafelek 📕: admin, backOffice, energyAnalyst, salesRepresentative (roleModules w index.html).
// ─────────────────────────────────────────────────────────────────────────────
(function () {{
  const HB = {{}};
  const CSS = {json.dumps(scoped_css, ensure_ascii=False)};
  const HTML = {json.dumps(html, ensure_ascii=False)};

  // ── Dane podręcznika (segmenty, prawo, obiekcje, akademia, maile) ──────────
{data_js}

  // ── Stan trwały między otwarciami zakładki ─────────────────────────────────
  let cur, MAIL, AC, checked;
  let $root = null;
  const $id = function (id) {{ return document.getElementById('hb-' + id); }};
  const _once = {{}};
  function hbOnce(ev, fn) {{ if (_once[ev]) return; _once[ev] = true; window.addEventListener(ev, fn); }}

  function ensureStyles() {{
    if (document.getElementById('wai-handbook-css')) return;
    const st = document.createElement('style'); st.id = 'wai-handbook-css'; st.textContent = CSS;
    document.head.appendChild(st);
    if (!document.getElementById('wai-handbook-font')) {{
      const l = document.createElement('link'); l.id = 'wai-handbook-font'; l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Serif:ital,wght@0,400;0,500;1,400&display=swap';
      document.head.appendChild(l);
    }}
  }}

  // ── Logika podręcznika (wiąże nasłuchy z aktualnym DOM) ────────────────────
  function boot() {{
{js}
  }}

  window.SalesHandbookModule = {{
    render: function (container) {{
      ensureStyles();
      container.innerHTML = HTML;
      $root = document.getElementById('hb-root');
      boot();
    }}
  }};

  // ── Wpięcie do routingu modułów (wzorzec z backup.js / instructions.js) ────
  const _prev = window.openModule;
  window.openModule = function (moduleName) {{
    if (moduleName === 'salesHandbook') {{
      const labels = (typeof getModuleLabels === 'function') ? getModuleLabels() : {{}};
      const item = labels['salesHandbook'];
      const titleEl = document.getElementById('module-title');
      if (titleEl && item) titleEl.textContent = item[1];
      const modView = document.getElementById('module-view');
      if (modView) modView.classList.add('active');
      const descEl = document.getElementById('module-description');
      if (descEl) descEl.textContent = item ? item[2] : '';
      const content = document.getElementById('module-content');
      if (content) window.SalesHandbookModule.render(content);
      window._i18nRerender = function () {{ window.openModule('salesHandbook'); }};
      return;
    }}
    if (_prev) return _prev(moduleName);
  }};
}})();
'''
OUT.write_text(module, encoding='utf-8')
print('OK →', OUT, len(module), 'bytes')
