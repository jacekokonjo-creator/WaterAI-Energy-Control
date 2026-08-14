/* Ładuje REALNE pliki aplikacji w jsdom, w kolejności z index.html.
   Supabase jest odcięty (brak sieci), więc _mkStore spada do trybu lokalnego
   na localStorage — dokładnie ta sama ścieżka co offline w przeglądarce. */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const REPO = '/home/claude/repo';

function boot(opts = {}) {
  const html = fs.readFileSync(path.join(REPO, 'index.html'), 'utf8');
  const dom = new JSDOM('<!doctype html><html><body><div id="module-content"></div></body></html>', {
    url: 'https://control.waterai.cloud/',
    runScripts: 'dangerously',
    pretendToBeVisual: true
  });
  const w = dom.window;

  // minimalne protezy, których jsdom nie ma
  w.alert = () => {};
  w.confirm = () => true;
  w.prompt = () => '';
  w.scrollTo = () => {};
  w.print = () => {};
  if (!w.HTMLCanvasElement.prototype.getContext) {
    w.HTMLCanvasElement.prototype.getContext = () => null;
  } else {
    w.HTMLCanvasElement.prototype.getContext = () => ({
      fillRect(){}, clearRect(){}, beginPath(){}, moveTo(){}, lineTo(){}, stroke(){},
      fillText(){}, measureText(){return{width:10};}, arc(){}, fill(){}, closePath(){},
      save(){}, restore(){}, translate(){}, rotate(){}, setLineDash(){},
      set fillStyle(v){}, get fillStyle(){return '#000';},
      set strokeStyle(v){}, get strokeStyle(){return '#000';},
      set font(v){}, get font(){return '';},
      set textAlign(v){}, get textAlign(){return 'left';},
      set lineWidth(v){}, get lineWidth(){return 1;}
    });
  }

  const errors = [];
  w.addEventListener('error', e => errors.push('window.error: ' + e.message));
  const origErr = console.error;

  // kolejność ładowania = kolejność <script src> w index.html
  const files = [...html.matchAll(/<script src="(js\/[^"?]+)/g)].map(m => m[1]);

  // wyciągnij inline'owy JS z index.html (definicje ról, login, roleModules itd.)
  const inline = [...html.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);

  // wstrzykujemy jako PRAWDZIWE <script> — inaczej `let`/`const` na poziomie
  // pliku dostaje zasięg eval-a i znika, zamiast trafić do globalnego
  // środowiska leksykalnego (tak jak w przeglądarce).
  const runScript = (code, label) => {
    const el = dom.window.document.createElement('script');
    el.textContent = code;
    try { dom.window.document.head.appendChild(el); }
    catch (e) { errors.push(`${label}: ${e.message}`); }
  };
  const loaded = [];
  for (const f of files) {
    const src = fs.readFileSync(path.join(REPO, f), 'utf8');
    const before = errors.length;
    runScript(src, 'ŁADOWANIE ' + f);
    if (errors.length === before) loaded.push(f);
  }
  // inline dopiero po plikach (tak jak w index.html — jest na końcu body)
  if (opts.inline !== false) {
    inline.forEach((code, i) => runScript(code, 'INLINE #' + i));
  }

  return { dom, w, errors, loaded, files };
}

module.exports = { boot, REPO };
