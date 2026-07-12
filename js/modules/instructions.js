// js/modules/instructions.js
// ─────────────────────────────────────────────────────────────────────────────
// Zakładka „Instrukcja korzystania z WaterAI Energy Control".
// Treść zależna od roli:
//   • wewnętrzne (admin / backOffice / energyAnalyst) — pełny opis systemu i ról,
//   • client — wersja „Jak system działa dla Ciebie",
//   • salesRepresentative — wersja „Jak system działa dla Ciebie".
// Moduł jest wyłącznie prezentacyjny (żadnych danych, żadnego localStorage).
// Wzorzec wpięcia jak w backup.js — rozszerza window.openModule o 'instructions'.
// ─────────────────────────────────────────────────────────────────────────────
const InstructionsModule = {
  _internalRoles: ['admin', 'backOffice', 'energyAnalyst'],

  _role() {
    if (typeof currentRole !== 'undefined' && currentRole) return currentRole;
    if (typeof realRole !== 'undefined' && realRole) return realRole;
    return 'admin';
  },

  _card(inner) {
    return '<div style="border:1px solid var(--color-border-tertiary);border-radius:12px;' +
      'padding:18px 20px;margin-bottom:16px;">' + inner + '</div>';
  },

  _h(txt) {
    return '<div style="font-size:15px;font-weight:600;color:#0C447C;margin-bottom:8px;">' + txt + '</div>';
  },

  _p(txt) {
    return '<div style="font-size:13px;color:var(--color-text-secondary);line-height:1.6;margin-bottom:8px;">' + txt + '</div>';
  },

  _list(items) {
    return '<ul style="margin:6px 0 0;padding-left:18px;font-size:13px;color:var(--color-text-secondary);line-height:1.6;">' +
      items.map(function (i) { return '<li style="margin-bottom:6px;">' + i + '</li>'; }).join('') + '</ul>';
  },

  _role_block(name, desc) {
    return '<div style="padding:12px 0;border-top:1px solid var(--color-border-tertiary);">' +
      '<div style="font-size:14px;font-weight:600;color:var(--color-text-primary);margin-bottom:3px;">' + name + '</div>' +
      '<div style="font-size:13px;color:var(--color-text-secondary);line-height:1.6;">' + desc + '</div></div>';
  },

  _internal() {
    var intro = this._card(
      '<div style="font-size:16px;font-weight:600;color:#0C447C;margin-bottom:6px;">📖 Instrukcja korzystania z WaterAI Energy Control</div>' +
      this._p('WaterAI Energy Control służy do pomiaru i rozliczania oszczędności energii w modelu ESCO. ' +
        'Pracujemy na strukturze: Klient → jego Obiekty (budynki) → dla obiektów prowadzimy Pomiary, ' +
        'Okresy bazowe, Analizy, Raporty ESCO, Faktury i Symulacje oszczędności.')
    );

    var layers = this._card(
      this._h('Dwie warstwy dostępu') +
      this._p('Kto co widzi, wynika z dwóch niezależnych rzeczy:') +
      this._list([
        '<strong>Rola</strong> — stała; określa, co dana osoba w ogóle może robić (np. wpisywać pomiary, wystawiać faktury, zarządzać kontami).',
        '<strong>Udostępnienie</strong> — nadawane osobno dla pojedynczego dokumentu; daje konkretnej osobie prawo <strong>Widzi (W)</strong> lub <strong>Edytuje (E)</strong> na czymś, czego z samej roli by nie zobaczyła. To narzędzie do celowego pokazywania wybranych dokumentów Klientowi i Sales Repowi. Udostępniać można: Okresy bazowe (Protokoły TYM), Analizy, Raporty ESCO, Faktury i Symulacje.'
      ])
    );

    var modules = this._card(
      this._h('Moduły systemu') +
      this._p('Klienci, Obiekty, Pomiary, Okresy bazowe, Analizy, Raporty ESCO, Faktury, ' +
        '<strong>Symulacje oszczędności</strong>, <strong>Widoczność</strong> (zarządzanie udostępnianiem dokumentów), ' +
        'Kalendarz, Użytkownicy, Ustawienia, Instrukcja.')
    );

    var roles = this._card(
      this._h('Role') +
      this._role_block('Administrator',
        'Pełna kontrola. Widzi i edytuje wszystko: wszystkich klientów, obiekty, pomiary, okresy bazowe, analizy, ' +
        'raporty ESCO, faktury i symulacje. Zakłada, edytuje i blokuje konta. Może usunąć dowolny rekord. ' +
        'Zarządza udostępnianiem (moduł Widoczność). Konfiguruje system (język, ustawienia, kopie zapasowe).') +
      this._role_block('Back Office',
        'Obsługa operacyjno-rozliczeniowa. Pełny dostęp do klientów, obiektów, pomiarów, raportów i faktur; ' +
        'wystawia faktury i tworzy symulacje. Może usuwać rekordy. Zarządza udostępnianiem (nadaje W/E dokumentów). ' +
        'Nie zakłada kont użytkowników.') +
      this._role_block('Energy Analyst',
        'Rdzeń merytoryczny. Pełny dostęp do danych energetycznych: klienci, obiekty, pomiary, okresy bazowe; ' +
        'tworzy analizy, raporty ESCO i symulacje. Zarządza udostępnianiem. ' +
        'Nie usuwa cudzych rekordów (tylko własne) i nie zakłada kont.') +
      this._role_block('Sales Representative',
        'Opiekun handlowy klienta. Dodaje klientów i obiekty oraz wpisuje pomiary; w warstwie operacyjnej widzi ' +
        'i prowadzi te obiekty, przy których jest przypisany jako opiekun. Dokumenty (okresy bazowe, analizy, ' +
        'raporty ESCO, faktury, symulacje) widzi wyłącznie wtedy, gdy zostaną mu wprost udostępnione. ' +
        'Widzi swoją prowizję, naliczaną zgodnie z zawartą umową. ' +
        'Nie wystawia faktur, nie usuwa cudzych rekordów, nie zakłada kont, nie udostępnia.') +
      this._role_block('Klient',
        'Odbiorca usługi. Widzi swoje obiekty i swoje pomiary; może dodawać odczyty dla swoich obiektów. ' +
        'Widzi dotyczące go dokumenty (raporty ESCO, analizy, faktury) — te, które sam dodał, oraz to, ' +
        'co zostanie mu wprost udostępnione. Nie widzi nic cudzego, niczego nie usuwa ani nie udostępnia.')
    );

    return '<div style="max-width:820px;">' + intro + layers + modules + roles + '</div>';
  },

  _client() {
    var card = this._card(
      '<div style="font-size:16px;font-weight:600;color:#0C447C;margin-bottom:6px;">📖 Jak system działa dla Ciebie</div>' +
      this._p('WaterAI Energy Control pokazuje zużycie energii Twoich obiektów oraz oszczędności rozliczane w modelu ESCO.') +
      this._list([
        'Widzisz swoje obiekty i ich pomiary.',
        'Możesz dodawać odczyty (pomiary) dla swoich obiektów.',
        'Widzisz dokumenty, które sam dodałeś, oraz te udostępnione Ci przez zespół WaterAI (raporty ESCO, analizy, faktury).',
        'Widzisz wyłącznie swoje dane — nie masz dostępu do danych innych klientów.'
      ])
    );
    return '<div style="max-width:820px;">' + card + '</div>';
  },

  _salesRep() {
    var card = this._card(
      '<div style="font-size:16px;font-weight:600;color:#0C447C;margin-bottom:6px;">📖 Jak system działa dla Ciebie</div>' +
      this._p('Jako partner handlowy prowadzisz obiekty klientów i wprowadzasz dane pomiarowe.') +
      this._list([
        'Dodajesz klientów oraz obiekty.',
        'Wpisujesz pomiary dla obiektów, którymi się opiekujesz.',
        'Dokumenty (analizy, raporty ESCO, okresy bazowe, faktury) otrzymujesz wtedy, gdy zespół WaterAI udostępni Ci je do wglądu lub edycji.',
        'Widzisz swoją prowizję, naliczaną zgodnie z zawartą umową.'
      ])
    );
    return '<div style="max-width:820px;">' + card + '</div>';
  },

  render() {
    var role = this._role();
    if (this._internalRoles.indexOf(role) >= 0) return this._internal();
    if (role === 'client') return this._client();
    if (role === 'salesRepresentative') return this._salesRep();
    return this._internal();
  }
};
window.InstructionsModule = InstructionsModule;

// ── Wpięcie strony „Instrukcja" do routingu modułów (wzorzec z backup.js) ──
(function () {
  const _prev = window.openModule;
  window.openModule = function (moduleName) {
    if (moduleName === 'instructions') {
      const labels = (typeof getModuleLabels === 'function') ? getModuleLabels() : {};
      const item = labels['instructions'];
      const titleEl = document.getElementById('module-title');
      if (titleEl && item) titleEl.textContent = item[1];
      const modView = document.getElementById('module-view');
      if (modView) modView.classList.add('active');
      const descEl = document.getElementById('module-description');
      if (descEl) descEl.textContent = '';
      const content = document.getElementById('module-content');
      if (content) content.innerHTML = InstructionsModule.render();
      return;
    }
    if (_prev) return _prev(moduleName);
  };
})();
