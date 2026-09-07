// js/modules/sales-handbook.js
// ─────────────────────────────────────────────────────────────────────────────
// Zakładka „Podręcznik sprzedaży" (2026-09-07).
//
// Podręcznik jest samodzielną aplikacją HTML (własne style, wyszukiwarka,
// akademia, kalkulator HDD, generator maili) i leży w podrecznik/podrecznik-sprzedazy.html.
// Osadzamy go w ramce (iframe), a nie wklejamy do DOM aplikacji, bo:
//   • ma własny CSS na elementach globalnych (body, h1, tabele) — kolidowałby ze stylem WaterAI,
//   • ma własny JS ze zmiennymi globalnymi (SECTIONS, cur, esc…) — kolidowałby z modułami,
//   • aktualizacja podręcznika = podmiana jednego pliku, bez dotykania kodu aplikacji.
//
// Kafelek 📕 mają role wewnętrzne (admin, backOffice, energyAnalyst) oraz
// salesRepresentative — to narzędzie handlowca. Klient go NIE widzi (roleModules w index.html).
// Moduł jest wyłącznie prezentacyjny: żadnych danych, żadnego zapisu.
// Wpięcie jak w backup.js / instructions.js — rozszerza openModule.
// ─────────────────────────────────────────────────────────────────────────────
const SalesHandbookModule = {
  SRC: 'podrecznik/podrecznik-sprzedazy.html',

  // Wersja w URL wymusza pobranie nowego pliku po podmianie podręcznika.
  VERSION: '2026-09-07',

  render: function () {
    const src = this.SRC + '?v=' + this.VERSION;
    return (
      '<div style="display:flex;justify-content:flex-end;gap:8px;margin:0 0 8px;">' +
        '<a href="' + src + '" target="_blank" rel="noopener" class="small-button" ' +
          'style="text-decoration:none;">↗ Otwórz w nowej karcie</a>' +
      '</div>' +
      '<iframe id="sales-handbook-frame" src="' + src + '" title="Podręcznik sprzedaży Water AI" ' +
        'style="width:100%;height:calc(100vh - 220px);min-height:600px;border:1px solid #e0e0e0;' +
        'border-radius:10px;background:#fff;"></iframe>'
    );
  }
};
window.SalesHandbookModule = SalesHandbookModule;

// ── Wpięcie do routingu modułów ─────────────────────────────────────────────
(function () {
  const _prev = window.openModule;
  window.openModule = function (moduleName) {
    if (moduleName === 'salesHandbook') {
      const labels = (typeof getModuleLabels === 'function') ? getModuleLabels() : {};
      const item = labels['salesHandbook'];
      const titleEl = document.getElementById('module-title');
      if (titleEl && item) titleEl.textContent = item[1];
      const modView = document.getElementById('module-view');
      if (modView) modView.classList.add('active');
      const descEl = document.getElementById('module-description');
      if (descEl) descEl.textContent = item ? item[2] : '';
      const content = document.getElementById('module-content');
      if (content) content.innerHTML = SalesHandbookModule.render();
      // Treść w ramce jest po polsku i nie przechodzi przez silnik i18n aplikacji;
      // przy zmianie języka odświeżamy tylko tytuł/opis kafelka.
      window._i18nRerender = function () { window.openModule('salesHandbook'); };
      return;
    }
    if (_prev) return _prev(moduleName);
  };
})();
