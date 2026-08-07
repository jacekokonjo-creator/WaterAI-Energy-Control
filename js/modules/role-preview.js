// js/modules/role-preview.js
// ─────────────────────────────────────────────────────────────────────────────
// Zakładka „Podgląd ról" — WYŁĄCZNIE dla administratora.
// Zastępuje pasek „Tryb testowy roli" z góry panelu głównego.
//
// Dwa tryby:
//   • rola      — podgląd tego, co widzi dowolna rola (kafelki + zakres danych),
//   • użytkownik — podgląd konkretnego konta: rola tego konta + jego zakres danych
//                  (klient → swój client_id; sales rep → obiekty, których jest opiekunem).
//
// UWAGA (świadome ograniczenie): to podgląd WARSTWY APLIKACJI, nie test RLS.
// Zapytania do bazy lecą nadal na sesji admina, więc baza zwraca komplet danych,
// a zawężenie robi front. Do sprawdzenia realnych uprawnień trzeba zalogować się
// na dane konto. Baner na górze mówi o tym wprost, żeby nikt się nie pomylił.
// ─────────────────────────────────────────────────────────────────────────────

const RolePreviewModule = {
  ROLE_LABELS: {
    admin: 'Administrator',
    backOffice: 'Back Office',
    energyAnalyst: 'Energy Analyst',
    salesRepresentative: 'Sales Representative',
    client: 'Klient'
  },

  // Czy zalogowane konto to admin (podgląd jest tylko dla niego).
  isAdmin() {
    try {
      if (typeof assignedRoles !== 'undefined' && Array.isArray(assignedRoles)) {
        return assignedRoles.includes('admin');
      }
    } catch (e) {}
    return false;
  },

  active() {
    return (typeof previewUserId !== 'undefined' && previewUserId) ||
           (typeof realRole !== 'undefined' && typeof currentRole !== 'undefined' && currentRole !== realRole);
  },

  _esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  },

  _users() {
    if (typeof UsersModule === 'undefined' || !UsersModule.getAll) return [];
    try { return UsersModule.getAll(); } catch (e) { return []; }
  },

  _clientName(id) {
    if (!id || typeof ClientsModule === 'undefined') return '';
    const c = ClientsModule.find(id);
    return c ? c.name : '';
  },

  // ── Baner „jesteś w podglądzie" — wstrzykiwany nad panel główny ────────────
  renderBanner() {
    const host = document.getElementById('role-preview-banner');
    if (!host) return;
    if (!this.isAdmin() || !this.active()) { host.innerHTML = ''; host.style.display = 'none'; return; }

    let who = this.ROLE_LABELS[currentRole] || currentRole;
    if (typeof previewUserId !== 'undefined' && previewUserId) {
      const u = this._users().find(x => String(x.id) === String(previewUserId));
      if (u) who = (u.fullName || u.email || who) + ' · ' + (this.ROLE_LABELS[u.role] || u.role);
    } else if (currentRole === 'client' && typeof previewClientId !== 'undefined' && previewClientId) {
      who += ' · ' + this._clientName(previewClientId);
    }

    host.style.display = 'block';
    host.innerHTML =
      '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;background:#FAEEDA;' +
      'border:1px solid #EF9F27;border-radius:10px;padding:10px 14px;margin-bottom:14px;">' +
        '<span style="font-size:13px;font-weight:600;color:#633806;">👁️ Podgląd: ' + this._esc(who) + '</span>' +
        '<span style="font-size:11px;color:#854F0B;flex:1;min-width:200px;">' +
          'Widzisz aplikację tak, jak widzi ją to konto. Uprawnienia w bazie nadal są Twoje (admin).</span>' +
        '<button class="small-button" onclick="RolePreviewModule.stop()">Zakończ podgląd</button>' +
      '</div>';
  },

  // ── Sterowanie ────────────────────────────────────────────────────────────
  // UWAGA: currentRole / previewClientId to zmienne `let` z index.html — nie są
  // właściwościami window, więc NIE wolno ich ustawiać przez window.x. Jedyna
  // poprawna droga to funkcje setRole() i setPreviewClient() z index.html.
  startRole(role) {
    if (!this.isAdmin() || !role) return;
    window.previewUserId = null;
    window.previewUserName = '';
    setRole(role);                       // resetuje też previewClientId
    if (role === 'client' && typeof ClientsModule !== 'undefined') {
      const first = ClientsModule.getAll()[0] || null;
      if (first) setPreviewClient(first.id);
    }
    this.afterSwitch();
  },

  startUser(userId) {
    if (!this.isAdmin() || !userId) return;
    const u = this._users().find(x => String(x.id) === String(userId));
    if (!u) return;
    setRole(u.role || 'client');
    if (u.role === 'client' && u.clientId) setPreviewClient(u.clientId);
    window.previewUserId = String(u.id);
    window.previewUserName = u.fullName || u.email || '';
    this.afterSwitch();
  },

  stop() {
    window.previewUserId = null;
    window.previewUserName = '';
    setPreviewClient('');
    setRole((typeof realRole !== 'undefined' && realRole) ? realRole : 'admin');
    this.afterSwitch();
    if (typeof openModule === 'function') openModule('rolePreview');
  },

  // Po przełączeniu wracamy na pulpit — o to chodzi w podglądzie: admin ma
  // zobaczyć kafelki i ekrany tak, jak widzi je tamto konto. Wyjście przez baner.
  afterSwitch() {
    if (typeof closeModule === 'function') closeModule();
    if (typeof renderDashboard === 'function') renderDashboard();
    this.renderBanner();
  },

  // ── Ekran modułu ──────────────────────────────────────────────────────────
  render() {
    if (!this.isAdmin()) {
      return '<div class="reminder-card"><strong>Brak dostępu.</strong>' +
        '<div class="reminder-meta">Podgląd ról jest dostępny wyłącznie dla administratora.</div></div>';
    }

    const users = this._users();
    const roles = Object.keys(this.ROLE_LABELS);
    const cur = (typeof currentRole !== 'undefined') ? currentRole : 'admin';
    const pu = (typeof previewUserId !== 'undefined') ? previewUserId : null;

    const roleBtns = roles.map(r => {
      const on = (!pu && cur === r);
      return '<button class="small-button" onclick="RolePreviewModule.startRole(\'' + r + '\')" ' +
        'style="font-size:13px;padding:8px 14px;' +
        (on ? 'background:#0C447C;color:#fff;border-color:#0C447C;' : '') + '">' +
        this._esc(this.ROLE_LABELS[r]) + '</button>';
    }).join(' ');

    const clientPicker = (cur === 'client' && !pu)
      ? '<div style="margin-top:12px;">' +
          '<label style="font-size:12px;color:var(--color-text-secondary);display:block;margin-bottom:4px;">Jako który klient:</label>' +
          '<select onchange="setPreviewClient(this.value);RolePreviewModule.renderBanner();" ' +
            'style="font-size:13px;padding:6px 10px;border:1px solid var(--color-border-tertiary);border-radius:8px;min-width:260px;">' +
            (typeof ClientsModule !== 'undefined' ? ClientsModule.getAll().map(c =>
              '<option value="' + c.id + '"' +
              ((typeof previewClientId !== 'undefined' && Number(previewClientId) === Number(c.id)) ? ' selected' : '') +
              '>' + this._esc(c.name) + '</option>').join('') : '') +
          '</select></div>'
      : '';

    const userRows = users.length === 0
      ? '<tr><td colspan="4" style="padding:18px;text-align:center;font-size:13px;color:var(--color-text-secondary);">' +
        'Brak kont do podglądu.</td></tr>'
      : users.map(u => {
          const on = pu && String(pu) === String(u.id);
          const scope = (u.role === 'client')
            ? (u.clientId ? this._clientName(u.clientId) : '⚠️ konto klienta bez przypisanego klienta')
            : (u.role === 'salesRepresentative' ? 'obiekty, których jest opiekunem' : 'pełny dostęp wewnętrzny');
          return '<tr style="border-bottom:1px solid var(--color-border-tertiary);' +
            (on ? 'background:#E6F1FB;' : '') + '">' +
            '<td style="padding:9px 10px;font-size:13px;font-weight:500;">' + this._esc(u.fullName || '—') + '</td>' +
            '<td style="padding:9px 10px;font-size:12px;color:var(--color-text-secondary);">' + this._esc(u.email || '') + '</td>' +
            '<td style="padding:9px 10px;font-size:12px;">' + this._esc(this.ROLE_LABELS[u.role] || u.role || '—') +
              '<div style="font-size:11px;color:var(--color-text-secondary);">' + this._esc(scope) + '</div></td>' +
            '<td style="padding:9px 10px;text-align:right;white-space:nowrap;">' +
              (on
                ? '<button class="small-button" onclick="RolePreviewModule.stop()">Zakończ</button>'
                : '<button class="small-button" onclick="RolePreviewModule.startUser(\'' + this._esc(u.id) + '\')">Podejrzyj</button>') +
            '</td></tr>';
        }).join('');

    return '' +
      '<div style="border:1px solid var(--color-border-tertiary);border-radius:12px;padding:18px 20px;margin-bottom:16px;">' +
        '<div style="font-size:15px;font-weight:600;color:#0C447C;margin-bottom:6px;">Podgląd według roli</div>' +
        '<div style="font-size:13px;color:var(--color-text-secondary);line-height:1.6;margin-bottom:12px;">' +
          'Zobacz, jakie kafelki i jaki zakres danych ma dana rola. Nie dotyczy konkretnej osoby — to widok modelowy.</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;">' + roleBtns + '</div>' +
        clientPicker +
      '</div>' +

      '<div style="border:1px solid var(--color-border-tertiary);border-radius:12px;padding:18px 20px;margin-bottom:16px;">' +
        '<div style="font-size:15px;font-weight:600;color:#0C447C;margin-bottom:6px;">Podgląd jako konkretny użytkownik</div>' +
        '<div style="font-size:13px;color:var(--color-text-secondary);line-height:1.6;margin-bottom:12px;">' +
          'Wchodzisz w widok wybranego konta: jego rola i jego zakres danych. ' +
          'Dla klienta oznacza to jego obiekty i dokumenty, dla handlowca — obiekty, których jest opiekunem.</div>' +
        '<div style="overflow-x:auto;border:1px solid var(--color-border-tertiary);border-radius:10px;">' +
          '<table style="width:100%;border-collapse:collapse;">' +
            '<thead><tr style="background:var(--color-background-secondary);">' +
              '<th style="padding:8px 10px;font-size:11px;font-weight:600;text-align:left;border-bottom:2px solid var(--color-border-tertiary);">Osoba</th>' +
              '<th style="padding:8px 10px;font-size:11px;font-weight:600;text-align:left;border-bottom:2px solid var(--color-border-tertiary);">E-mail</th>' +
              '<th style="padding:8px 10px;font-size:11px;font-weight:600;text-align:left;border-bottom:2px solid var(--color-border-tertiary);">Rola i zakres</th>' +
              '<th style="border-bottom:2px solid var(--color-border-tertiary);"></th>' +
            '</tr></thead><tbody>' + userRows + '</tbody></table></div>' +
      '</div>' +

      '<div style="border:1px solid #EF9F27;background:#FAEEDA;border-radius:12px;padding:14px 18px;">' +
        '<div style="font-size:13px;font-weight:600;color:#633806;margin-bottom:4px;">Czego ten podgląd NIE sprawdza</div>' +
        '<div style="font-size:12px;color:#854F0B;line-height:1.6;">' +
          'Zapytania do bazy lecą nadal na Twojej sesji administratora, więc baza zwraca komplet danych, ' +
          'a zawężenie robi aplikacja. To dobre narzędzie do sprawdzenia, <strong>co użytkownik zobaczy na ekranie</strong>, ' +
          'ale nie zastąpi testu uprawnień — te egzekwuje RLS w Supabase. ' +
          'Żeby sprawdzić realny dostęp, trzeba zalogować się na dane konto.</div>' +
      '</div>';
  }
};

window.RolePreviewModule = RolePreviewModule;
window.previewUserId = null;
window.previewUserName = '';

// ── Wpięcie do routingu modułów (wzorzec z instructions.js) ─────────────────
(function () {
  const _prev = window.openModule;
  window.openModule = function (moduleName) {
    if (moduleName === 'rolePreview') {
      const titleEl = document.getElementById('module-title');
      if (titleEl) titleEl.textContent = 'Podgląd ról';
      const modView = document.getElementById('module-view');
      if (modView) modView.classList.add('active');
      const descEl = document.getElementById('module-description');
      if (descEl) descEl.textContent = '';
      const content = document.getElementById('module-content');
      if (content) content.innerHTML = RolePreviewModule.render();
      RolePreviewModule.renderBanner();
      return;
    }
    if (_prev) return _prev(moduleName);
  };
})();
