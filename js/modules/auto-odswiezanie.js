// js/modules/auto-odswiezanie.js
// ─────────────────────────────────────────────────────────────────────────────
// Cykliczne odświeżanie długo otwartych widoków.
//
// PO CO TO JEST — i czego NIE robi.
// Podgląd ról i Instrukcja nie pobierają żadnych danych: obie strony powstają
// z kodu przy każdym otwarciu, więc w obrębie jednej sesji nigdy nie są
// nieaktualne. Samo „przerysuj co 24 h" niczego by nie naprawiło.
//
// Nieaktualne stają się dopiero wtedy, gdy karta zostaje otwarta przez dobę
// albo tydzień, a w tym czasie wyjdzie nowa wersja aplikacji — przeglądarka
// nadal trzyma stary kod. Dlatego cykl robi DWIE rzeczy:
//   1. przerysowuje widok z bieżącej konfiguracji (łapie zmiany ról i modułów
//      wprowadzone w tej samej sesji, np. po edycji uprawnień),
//   2. sprawdza, czy na serwerze leży nowsza wersja aplikacji, i jeśli tak —
//      pokazuje dyskretny pasek z prośbą o odświeżenie.
// Bez punktu 2 cykl byłby atrapą.
//
// Wersję rozpoznajemy po parametrze ?v= przy js/modules/app-v2.js w index.html.
// To ten sam znacznik, który już służy do omijania cache przeglądarki, więc nie
// trzeba dokładać osobnego pliku z numerem wersji.
//
// Odświeżenie nigdy nie przerywa pracy: widok przerysowuje się tylko wtedy, gdy
// jest FAKTYCZNIE otwarty i karta jest widoczna, a pasek o nowej wersji trzeba
// kliknąć samemu — nic nie przeładowuje się samo pod palcami.
// ─────────────────────────────────────────────────────────────────────────────
(function () {
  'use strict';

  const GODZINA = 60 * 60 * 1000;
  const TIK = 5 * 60 * 1000;          // jak często sprawdzamy, czy coś się przeterminowało

  const AutoOdswiezanie = {
    // Zarejestrowane widoki: nazwa -> { ttl, odswiez, ostatnio }
    _zadania: {},
    _aktywny: null,                    // nazwa widoku otwartego w tej chwili
    _timer: null,
    _wersjaZaladowana: null,
    _pasekPokazany: false,

    GODZINA: GODZINA,
    DOBA: 24 * GODZINA,
    TYDZIEN: 7 * 24 * GODZINA,

    // Wywoływane przez moduł przy każdym otwarciu jego strony.
    pilnuj(nazwa, ttlMs, odswiez) {
      const z = this._zadania[nazwa] || (this._zadania[nazwa] = {});
      z.ttl = ttlMs;
      z.odswiez = odswiez;
      z.ostatnio = Date.now();
      this._aktywny = nazwa;
      this._start();
    },

    // Widok zamknięty (otwarto inny moduł) — przestajemy go przerysowywać.
    zwolnij(nazwa) {
      if (this._aktywny === nazwa) this._aktywny = null;
    },

    _start() {
      if (this._timer) return;
      this._wersjaZaladowana = this._wersjaZDokumentu(document);
      this._timer = setInterval(() => this._tik(), TIK);
      // Powrót do karty po dłuższej przerwie — sprawdź od razu, nie czekaj na tik.
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) this._tik();
      });
    },

    _tik() {
      if (document.hidden) return;                 // karta w tle — nie ruszamy DOM
      const nazwa = this._aktywny;
      if (!nazwa) return;
      const z = this._zadania[nazwa];
      if (!z || !z.odswiez) return;
      if (Date.now() - z.ostatnio < z.ttl) return;

      z.ostatnio = Date.now();
      try { z.odswiez(); } catch (e) { console.warn('[auto-odswiezanie] Przerysowanie „' + nazwa + '" nieudane:', e); }
      this._sprawdzWersje();
    },

    // Numer wersji = wartość ?v= przy app-v2.js. Jeden znacznik na całą aplikację.
    _wersjaZDokumentu(doc) {
      try {
        const skrypty = doc.querySelectorAll('script[src*="app-v2.js"]');
        for (const s of skrypty) {
          const m = String(s.getAttribute('src') || '').match(/[?&]v=(\d+)/);
          if (m) return m[1];
        }
      } catch (e) { /* dokument z fetch bywa niekompletny — traktujemy jak brak wersji */ }
      return null;
    },

    async _sprawdzWersje() {
      if (this._pasekPokazany || !this._wersjaZaladowana) return;
      try {
        const odp = await fetch('index.html', { cache: 'no-store' });
        if (!odp.ok) return;
        const tekst = await odp.text();
        const m = tekst.match(/app-v2\.js\?v=(\d+)/);
        if (!m) return;
        if (m[1] !== this._wersjaZaladowana) this._pokazPasek();
      } catch (e) {
        // brak sieci albo blokada — cicho, to tylko podpowiedź, nie funkcja krytyczna
      }
    },

    _pokazPasek() {
      if (this._pasekPokazany || document.getElementById('wa-nowa-wersja')) return;
      this._pasekPokazany = true;
      const pasek = document.createElement('div');
      pasek.id = 'wa-nowa-wersja';
      pasek.setAttribute('style',
        'position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:9999;' +
        'display:flex;gap:12px;align-items:center;background:#0C447C;color:#fff;' +
        'padding:10px 16px;border-radius:999px;font-size:13px;box-shadow:0 4px 18px rgba(0,0,0,.25);');
      pasek.innerHTML =
        '<span>Dostępna jest nowsza wersja aplikacji.</span>' +
        '<button type="button" style="background:#fff;color:#0C447C;border:0;border-radius:999px;' +
        'padding:5px 14px;font-size:13px;font-weight:600;cursor:pointer;">Odśwież</button>' +
        '<button type="button" style="background:transparent;color:#fff;border:0;font-size:16px;' +
        'cursor:pointer;line-height:1;" title="Zamknij">✕</button>';
      const przyciski = pasek.querySelectorAll('button');
      przyciski[0].onclick = function () { location.reload(); };
      przyciski[1].onclick = function () { pasek.remove(); };
      document.body.appendChild(pasek);
    }
  };

  window.WaterAIAutoOdswiezanie = AutoOdswiezanie;
})();
