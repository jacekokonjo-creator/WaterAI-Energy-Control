// ─────────────────────────────────────────────────────────────────────────
// note-i18n.js — tłumaczenie TREŚCI wpisanej przez analityka.
//
// Czym się różni od i18n-domain.js: tamten silnik podmienia napisy interfejsu
// według słownika „dokładny tekst polski → tłumaczenie". Swobodnej prozy (opis
// metodyki, wydzielenie c.w.u., założenia) w słowniku nigdy nie będzie, a
// dopasowanie podłańcuchowe podmieniałoby w niej pojedyncze słowa („Gaz",
// „Opis", „Hotel", „Dni") i dawało mieszankę językową. Dlatego takie bloki są
// oznaczone data-i18n-skip, a tłumaczy je ten moduł — maszynowo, przez Edge
// Function `translate-note` (klucz API dostawcy zostaje po stronie serwera).
//
// Użycie w kodzie renderującym:
//   NoteI18n.wrap(tekst)                 → HTML bloku, sam się przetłumaczy
//   NoteI18n.wrap(tekst, {inline:true})  → bez marginesu, do komórki tabeli
//   await NoteI18n.ready()               → czeka na trwające tłumaczenia (wydruk)
//
// Cache: pamięć procesu → localStorage → tabela note_translations (Edge
// Function). Ten sam opis tłumaczy się raz na język.
// ─────────────────────────────────────────────────────────────────────────
(function () {
  'use strict';

  const SUPPORTED = ['en', 'de', 'at', 'cs', 'sk', 'es'];

  const LABEL = {
    en: { done: 'Machine translation · original: Polish', busy: 'Translating…', fail: 'Translation unavailable — original text shown' },
    de: { done: 'Maschinelle Übersetzung · Original: Polnisch', busy: 'Übersetzung…', fail: 'Übersetzung nicht verfügbar — Originaltext' },
    at: { done: 'Maschinelle Übersetzung · Original: Polnisch', busy: 'Übersetzung…', fail: 'Übersetzung nicht verfügbar — Originaltext' },
    cs: { done: 'Strojový překlad · originál: polština', busy: 'Překlad…', fail: 'Překlad není dostupný — původní text' },
    sk: { done: 'Strojový preklad · originál: poľština', busy: 'Preklad…', fail: 'Preklad nie je dostupný — pôvodný text' },
    es: { done: 'Traducción automática · original: polaco', busy: 'Traduciendo…', fail: 'Traducción no disponible — texto original' }
  };

  const mem = new Map();          // hash:lang → tekst
  const pending = new Map();      // hash:lang → Promise
  let scheduled = false;

  function lang() {
    try { return (typeof currentLanguage !== 'undefined') ? currentLanguage : (window.currentLanguage || 'pl'); }
    catch (e) { return 'pl'; }
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/\n/g, '&#10;');
  }

  async function hashOf(s) {
    if (!(window.crypto && crypto.subtle)) return 'len' + s.length + ':' + s.slice(0, 64);
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function lsGet(k) { try { return localStorage.getItem('wai_tr:' + k); } catch (e) { return null; } }
  function lsSet(k, v) {
    try { localStorage.setItem('wai_tr:' + k, v); }
    catch (e) { /* quota — cache serwerowy i tak zadziała */ }
  }

  async function translate(text, lg) {
    const key = (await hashOf(text)) + ':' + lg;
    if (mem.has(key)) return mem.get(key);
    const cached = lsGet(key);
    if (cached != null) { mem.set(key, cached); return cached; }
    if (pending.has(key)) return pending.get(key);

    const p = (async () => {
      const sb = window.WaterAISupabase && WaterAISupabase.client;
      if (!sb || !sb.functions) throw new Error('Brak klienta Supabase.');
      const { data, error } = await sb.functions.invoke('translate-note', { body: { text, lang: lg } });
      if (error) throw error;
      if (!data || data.error) throw new Error((data && data.error) || 'Pusta odpowiedź.');
      const out = String(data.translated || '');
      mem.set(key, out); lsSet(key, out);
      return out;
    })().finally(() => pending.delete(key));

    pending.set(key, p);
    return p;
  }

  // ── Render ──────────────────────────────────────────────────────────────
  // data-i18n-skip: blok jest poza zasięgiem silnika słownikowego.
  function wrap(text, opts) {
    const t = String(text == null ? '' : text).trim();
    if (!t) return '';
    const o = opts || {};
    const mt = o.inline ? '0' : '4px';
    return '<div class="wai-note" data-i18n-skip data-note-src="' + esc(t) + '"' +
      ' style="margin-top:' + mt + ';">' +
      '<div class="wai-note-body" style="white-space:pre-wrap;line-height:1.55;">' + esc(t) + '</div>' +
      '</div>';
  }

  function badge(el, cls, txt) {
    let b = el.querySelector(':scope > .wai-note-badge');
    if (!txt) { if (b) b.remove(); return; }
    if (!b) {
      b = document.createElement('div');
      b.className = 'wai-note-badge';
      b.style.cssText = 'font-size:11px;margin-top:4px;opacity:.75;font-style:italic;';
      el.appendChild(b);
    }
    b.style.color = (cls === 'fail') ? '#b45309' : 'var(--color-text-secondary)';
    b.textContent = txt;
  }

  function paint(el, text) {
    const body = el.querySelector(':scope > .wai-note-body');
    if (body) body.textContent = text;
  }

  function scanOne(el) {
    const src = el.getAttribute('data-note-src') || '';
    const lg = lang();

    if (!SUPPORTED.includes(lg)) {          // PL albo język bez wsparcia — oryginał
      if (el.dataset.noteLang) {
        paint(el, src); badge(el, '', ''); delete el.dataset.noteLang;
      }
      return;
    }
    if (el.dataset.noteLang === lg) return;  // już w tym języku
    el.dataset.noteLang = lg;

    const L = LABEL[lg];
    badge(el, '', L.busy);
    translate(src, lg).then(txt => {
      if (el.dataset.noteLang !== lg) return;   // język zmienił się w międzyczasie
      if (txt) { paint(el, txt); badge(el, '', L.done); }
      else { paint(el, src); badge(el, 'fail', L.fail); }
    }).catch(err => {
      console.warn('[note-i18n] Tłumaczenie nieudane:', err && (err.message || err));
      if (el.dataset.noteLang !== lg) return;
      paint(el, src); badge(el, 'fail', L.fail);
    });
  }

  function scan() {
    document.querySelectorAll('.wai-note[data-note-src]').forEach(scanOne);
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(function () { scheduled = false; scan(); }, 60);
  }

  function ready() {
    return Promise.all(Array.from(pending.values())).catch(() => {});
  }

  function start() {
    new MutationObserver(function (muts) {
      for (const m of muts) if (m.type === 'childList' && m.addedNodes.length) { schedule(); return; }
    }).observe(document.body, { childList: true, subtree: true });

    const _setLang = window.setLanguage;
    if (typeof _setLang === 'function') {
      window.setLanguage = function (l) { _setLang(l); schedule(); };
    }
    // Wydruk: dociągnij tłumaczenia, zanim przeglądarka zrobi zrzut strony.
    window.addEventListener('beforeprint', function () { scan(); });

    scan();
  }

  window.NoteI18n = { wrap: wrap, translate: translate, ready: ready, refresh: scan };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
