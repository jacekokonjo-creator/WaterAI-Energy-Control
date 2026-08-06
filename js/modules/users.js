// WaterAI Energy Control
// Users & Roles Module v2.0.0 — PRAWDZIWE konta (Supabase Auth + tabela profiles)
//
// v1 trzymał listę użytkowników w localStorage (atrapa bez wpływu na logowanie).
// v2: lista = tabela `profiles`; dodanie użytkownika = rejestracja w Supabase Auth
// (osobny, tymczasowy klient — sesja admina zostaje nietknięta) + wpis profilu.
// Zalogować się może WYŁĄCZNIE konto, które ma profil (gate w enterApp).
//
// Publiczne API zachowane dla reszty kodu: getAll / findByRole / ROLES
// (obiekty mają firstName/lastName/clientId jak w v1).

const UsersModule = {
  storageKey: 'waterai_users_v1',   // legacy — tylko fallback offline

  ROLES: {
    admin:              { label: 'Admin',               icon: '🔑', color: '#7B1FA2', bg: '#F3E5F5', description: 'Pełny dostęp do systemu, zarządzanie kontami wszystkich użytkowników.' },
    backOffice:         { label: 'Back Office',         icon: '🗂️', color: '#0C447C', bg: '#E6F1FB', description: 'Obsługa klientów, dokumenty, faktury, kalendarz.' },
    energyAnalyst:      { label: 'Energy Analyst',      icon: '📈', color: '#27500A', bg: '#E6F5EC', description: 'Pomiary, analizy, protokoły TYM, raporty ESCO.' },
    salesRepresentative:{ label: 'Sales Representative',icon: '🤝', color: '#E65100', bg: '#FFF3E0', description: 'Dostęp do klientów, obiektów i raportów sprzedażowych.' },
    client:             { label: 'Client',              icon: '👤', color: '#555',    bg: '#F5F5F5', description: 'Podgląd własnych obiektów, pomiarów i raportów ESCO.' }
  },

  _cache: null,

  _sb() { return (window.WaterAISupabase && WaterAISupabase.client) || null; },

  _mapProfile(p) {
    const parts = String(p.full_name || '').trim().split(/\s+/);
    const firstName = parts.shift() || '';
    const lastName = parts.join(' ');
    const legacyClientId = (p.client_id && typeof ClientsModule !== 'undefined' && ClientsModule.legacyIdForRow)
      ? ClientsModule.legacyIdForRow(p.client_id) : null;
    const roles = (Array.isArray(p.roles) && p.roles.length) ? p.roles : [p.role || 'client'];
    return {
      id: p.id,                       // uuid z auth.users
      roles,                          // role NADANE (migracja 007)
      effectiveRoles: UsersModule.expandRoles(roles),  // po hierarchii
      firstName, lastName,
      fullName: p.full_name || '',
      email: (p.data && p.data.email) || '',
      role: roles[0],                 // rola główna — zgodność wstecz
      clientId: legacyClientId,
      clientRowId: p.client_id || null,
      status: 'ACTIVE',
      createdAt: p.created_at || ''
    };
  },

  async load() {
    const sb = this._sb();
    if (!sb) {
      this._cache = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
      return;
    }
    const { data, error } = await sb.from('profiles')
      .select('id, full_name, role, roles, client_id, data, created_at')
      .order('created_at');
    if (error) {
      console.warn('[users] Nie udało się pobrać profili:', error.message);
      this._cache = [];
      return;
    }
    this._cache = (data || []).map(p => this._mapProfile(p));
  },

  getAll() {
    if (this._cache === null) this._cache = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    return JSON.parse(JSON.stringify(this._cache));
  },

  // Hierarchia ról — odpowiednik SQL expand_roles() z migracji 007.
  // admin ⇒ backOffice ⇒ energyAnalyst; admin ⇒ salesRepresentative.
  expandRoles(rs) {
    const out = new Set(rs || []);
    if (out.has('admin')) { out.add('backOffice'); out.add('energyAnalyst'); out.add('salesRepresentative'); }
    if (out.has('backOffice')) { out.add('energyAnalyst'); }
    return Array.from(out);
  },

  // Konto z rolą NADANĄ wśród wielu też ma się znaleźć w wyniku.
  findByRole(role) {
    return this.getAll().filter(u => (u.roles || [u.role]).includes(role));
  },

  // Uprawnienie wynikające z hierarchii (np. backOffice ma prawa analityka).
  findByEffectiveRole(role) {
    return this.getAll().filter(u => (u.effectiveRoles || []).includes(role));
  },

  find(id) {
    return this.getAll().find(u => String(u.id) === String(id));
  },

  // ── Operacje na prawdziwych kontach (tylko admin — pilnuje też RLS) ────────

  async createAccount(opts) {
    // opts: { fullName, email, password, role, clientLegacyId }
    const sb = this._sb();
    if (!sb) throw new Error('Brak połączenia z bazą (Supabase).');
    if (!window.supabase || !window.supabase.createClient) throw new Error('Biblioteka supabase-js niedostępna.');

    // Tymczasowy klient — signUp NIE dotyka sesji zalogowanego admina.
    const tmp = window.supabase.createClient(WaterAISupabase.URL, WaterAISupabase.KEY,
      { auth: { persistSession: false, autoRefreshToken: false } });

    const { data, error } = await tmp.auth.signUp({
      email: opts.email,
      password: opts.password,
      options: { data: { full_name: opts.fullName } }
    });
    if (error) {
      if (/already registered/i.test(error.message || '')) {
        throw new Error('Ten adres e-mail ma juz konto w systemie logowania (Auth). ' +
          'Nie zakladaj go drugi raz - jesli konto nie ma profilu, dopisz profil SQL-em w Supabase, ' +
          'a jesli ma, znajdziesz je na liscie ponizej.');
      }
      throw new Error(error.message);
    }
    const user = data && data.user;
    if (!user || !user.id) throw new Error('Rejestracja nie zwróciła identyfikatora konta.');
    if (Array.isArray(user.identities) && user.identities.length === 0) {
      throw new Error('Ten adres e-mail jest już zarejestrowany.');
    }

    const roles = Array.isArray(opts.roles) && opts.roles.length ? opts.roles : [opts.role || 'client'];
    const row = { id: user.id, full_name: opts.fullName, roles, role: roles[0], data: { email: opts.email } };
    if (roles.includes('client') && opts.clientLegacyId && typeof ClientsModule !== 'undefined' && ClientsModule._rowIds) {
      row.client_id = ClientsModule._rowIds[String(opts.clientLegacyId)] || null;
    }
    const { error: e2 } = await sb.from('profiles').upsert(row, { onConflict: 'id' });
    if (e2) throw new Error('Konto e-mail utworzone, ale zapis profilu się nie powiódł: ' + e2.message +
      '\nBez profilu to konto NIE zaloguje się do aplikacji — spróbuj dodać je ponownie lub zgłoś problem.');

    await this.load();
    return user.id;
  },

  async updateProfile(id, patch) {
    // patch: { fullName?, role?, clientLegacyId?, email? }
    const sb = this._sb();
    if (!sb) throw new Error('Brak połączenia z bazą (Supabase).');
    const current = this.find(id);
    const row = {};
    if (patch.fullName != null) row.full_name = patch.fullName;
    const roles = Array.isArray(patch.roles) && patch.roles.length
      ? patch.roles : (patch.role != null ? [patch.role] : null);
    if (roles) {
      row.roles = roles;
      row.role  = roles[0];
      row.client_id = (roles.includes('client') && patch.clientLegacyId
        && typeof ClientsModule !== 'undefined' && ClientsModule._rowIds)
        ? (ClientsModule._rowIds[String(patch.clientLegacyId)] || null) : null;
    }
    row.data = { email: patch.email != null ? patch.email : (current ? current.email : '') };
    const { error } = await sb.from('profiles').update(row).eq('id', id);
    if (error) throw new Error(error.message);
    await this.load();
  },

  async removeProfile(id) {
    const sb = this._sb();
    if (!sb) throw new Error('Brak połączenia z bazą (Supabase).');
    const { error } = await sb.from('profiles').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await this.load();
  }
};

window.UsersModule = UsersModule;

// ═══════════════════════════════════════════════════════════════════════════════
// WIDOK: Użytkownicy i role
// ═══════════════════════════════════════════════════════════════════════════════

let usersActiveRole = 'all';
let showUserForm = false;
let editingUserId = null;

function _usrEsc(v) { return (typeof escapeHtml === 'function') ? escapeHtml(v == null ? '' : String(v)) : String(v == null ? '' : v); }
function _usrIsAdmin() {
  return (typeof realRoles !== 'undefined') ? realRoles.includes('admin')
       : (typeof realRole !== 'undefined' && realRole === 'admin');
}
// Zarządzanie kontami: administrator + Back Office. Back Office NIE może jednak
// tworzyć ani modyfikować kont z rolą 'admin' (blokada eskalacji uprawnień) —
// egzekwowane tu w UI oraz w RLS (migration_005).
function _usrCanManage() {
  return _usrIsAdmin() || ((typeof realRoles !== 'undefined')
    ? realRoles.includes('backOffice')
    : (typeof realRole !== 'undefined' && realRole === 'backOffice'));
}

function renderUsersModule() {
  const container = document.getElementById('module-content');
  if (!container) return;

  const sb = (window.WaterAISupabase && WaterAISupabase.client) || null;
  const allUsers = UsersModule.getAll();
  const clients = (typeof ClientsModule !== 'undefined') ? ClientsModule.getAll() : [];
  const isAdmin = _usrIsAdmin();
  const canManage = _usrCanManage();
  const myId = (window.WaterAISupabase && WaterAISupabase.profile) ? WaterAISupabase.profile.id : null;

  const _rolesOf = u => (u.roles && u.roles.length) ? u.roles : [u.role];
  const filtered = usersActiveRole === 'all' ? allUsers : allUsers.filter(u => _rolesOf(u).includes(usersActiveRole));
  const q = (window._usrSearch || '').toLowerCase();
  const display = filtered.filter(u => !q ||
    (u.firstName + ' ' + u.lastName).toLowerCase().includes(q) ||
    (u.email || '').toLowerCase().includes(q));

  const sort = window._usrSort || 'name_asc';
  const clientNameOf = u => (_rolesOf(u).includes('client') && u.clientId && typeof ClientsModule !== 'undefined')
    ? (((ClientsModule.find(u.clientId) || {}).name) || '') : '';
  const sortVal = (u, col) =>
    col === 'name' ? (u.firstName + ' ' + u.lastName).trim().toLowerCase()
    : col === 'email' ? (u.email || '').toLowerCase()
    : col === 'role' ? _rolesOf(u).join(',')
    : clientNameOf(u).toLowerCase();
  const sortCol = sort.replace(/_(asc|desc)$/, '');
  const sortDir = sort.endsWith('_desc') ? -1 : 1;
  display.sort((a, b) => sortVal(a, sortCol).localeCompare(sortVal(b, sortCol), 'pl') * sortDir);

  const roleCounts = {};
  Object.keys(UsersModule.ROLES).forEach(r => { roleCounts[r] = allUsers.filter(u => _rolesOf(u).includes(r)).length; });

  const roleTabs = `
    <div class="meas-tabs" style="margin-bottom:16px;">
      <button type="button" class="meas-tab ${usersActiveRole === 'all' ? 'active' : ''}" onclick="usersActiveRole='all';renderUsersModule();">👥 Wszyscy (${allUsers.length})</button>
      ${Object.entries(UsersModule.ROLES).map(([key, r]) => `
        <button type="button" class="meas-tab ${usersActiveRole === key ? 'active' : ''}"
          style="${usersActiveRole === key ? `color:${r.color};border-bottom-color:${r.color};` : ''}"
          onclick="usersActiveRole='${key}';renderUsersModule();">${r.icon} ${r.label} (${roleCounts[key] || 0})</button>`).join('')}
    </div>`;

  const roleInfoCard = usersActiveRole !== 'all' ? (() => {
    const r = UsersModule.ROLES[usersActiveRole];
    return `<div style="border:1px solid ${r.color}44;border-radius:10px;padding:12px 16px;margin-bottom:16px;background:${r.bg};display:flex;align-items:center;gap:12px;">
      <span style="font-size:24px;">${r.icon}</span>
      <div><strong style="color:${r.color};font-size:14px;">${r.label}</strong>
      <p style="margin:2px 0 0;font-size:12px;color:${r.color};opacity:0.85;">${r.description}</p></div></div>`;
  })() : '';

  const infoBar = `
    <div style="border:1px solid var(--color-border-tertiary);border-radius:10px;padding:10px 14px;margin-bottom:16px;background:var(--color-background-secondary);font-size:12px;color:var(--color-text-secondary);">
      🔒 Zalogować się mogą <b>wyłącznie</b> konta utworzone tutaj przez administratora lub Back Office. Konto założone poza aplikacją (bez profilu) jest blokowane przy wejściu.
      ${sb ? '' : '<br><b style="color:#c00;">Brak połączenia z bazą — zarządzanie kontami jest niedostępne.</b>'}
    </div>`;

  const lbl = 'display:block;font-size:12px;color:var(--color-text-secondary);margin-bottom:4px;';
  const inp = 'width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid var(--color-border-tertiary);border-radius:8px;font-size:13px;';

  const editUser = editingUserId ? UsersModule.find(editingUserId) : null;

  const formHtml = (showUserForm && canManage && sb) ? `
    <div style="border:1px solid var(--color-border-tertiary);border-radius:12px;padding:16px;margin-bottom:20px;background:var(--color-background-primary);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <b style="font-size:15px;">${editUser ? 'Edytuj użytkownika' : 'Nowe konto użytkownika'}</b>
        <button class="small-button" onclick="showUserForm=false;editingUserId=null;renderUsersModule();">✕ Zamknij</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:12px;">
        <div><label style="${lbl}">Imię i nazwisko</label>
          <input id="usr-fullname" value="${_usrEsc(editUser ? editUser.fullName : '')}" placeholder="np. Jan Kowalski" style="${inp}"></div>
        <div><label style="${lbl}">E-mail (login)</label>
          <input id="usr-email" type="email" value="${_usrEsc(editUser ? editUser.email : '')}" placeholder="${editUser && !editUser.email ? 'uzupełnij e-mail (login) tego konta' : 'np. j.okon@waterai.cloud'}" style="${inp}" ${editUser && editUser.email ? 'disabled title="Loginu (e-mail w Auth) nie zmienisz z poziomu aplikacji"' : ''}></div>
        ${editUser ? '' : `<div><label style="${lbl}">Hasło startowe (min. 6 znaków)</label>
          <input id="usr-password" type="text" placeholder="użytkownik może je potem zmienić" style="${inp}"></div>`}
        <div><label style="${lbl}">Role <span style="font-weight:400;color:var(--color-text-secondary);">(można zaznaczyć kilka)</span></label>
          <div id="usr-roles" style="${inp}padding:8px 10px;display:flex;flex-direction:column;gap:6px;">
            ${Object.entries(UsersModule.ROLES).filter(([k]) => isAdmin || k !== 'admin').map(([k, r]) => `
              <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;">
                <input type="checkbox" class="usr-role-cb" value="${k}"
                  ${(editUser ? (editUser.roles || [editUser.role]) : ['client']).includes(k) ? 'checked' : ''}
                  onchange="_usrRolesChanged()">
                <span style="font-weight:600;padding:2px 9px;border-radius:20px;background:${r.bg};color:${r.color};">${r.icon} ${r.label}</span>
              </label>`).join('')}
          </div>
          <p id="usr-roles-hint" style="font-size:11px;color:var(--color-text-secondary);margin:6px 0 0;"></p></div>
        <div id="usr-client-field" style="${(editUser ? (editUser.roles || [editUser.role]) : ['client']).includes('client') ? '' : 'display:none;'}">
          <label style="${lbl}">Klient (dla roli Client)</label>
          <select id="usr-client" style="${inp}">
            <option value="">— wybierz klienta —</option>
            ${clients.map(c => `<option value="${c.id}" ${editUser && Number(editUser.clientId) === Number(c.id) ? 'selected' : ''}>${_usrEsc(c.name)}</option>`).join('')}
          </select></div>
      </div>
      ${editUser ? '' : `<p style="font-size:12px;color:var(--color-text-secondary);margin:0 0 12px;">Po zapisaniu przekaż użytkownikowi e-mail i hasło startowe. Jeśli w Supabase włączone jest potwierdzanie adresu e-mail, użytkownik przed pierwszym logowaniem musi kliknąć link z wiadomości.</p>`}
      <div style="display:flex;gap:10px;justify-content:flex-end;">
        <button class="small-button" onclick="showUserForm=false;editingUserId=null;renderUsersModule();">Anuluj</button>
        <button class="primary-button" id="usr-save-btn" onclick="_usrSave()">${editUser ? 'Zapisz zmiany' : 'Utwórz konto'}</button>
      </div>
    </div>` : '';

  const th = 'padding:8px 12px;text-align:left;font-size:11px;font-weight:600;color:var(--color-text-secondary);border-bottom:2px solid var(--color-border-tertiary);background:var(--color-background-secondary);white-space:nowrap;';
  const td = 'padding:10px 12px;border-bottom:1px solid var(--color-border-tertiary);font-size:13px;vertical-align:middle;';

  const rows = display.map(u => {
    const uRoles = (u.roles && u.roles.length) ? u.roles : [u.role];
    const badges = uRoles.map(k => {
      const rr = UsersModule.ROLES[k] || UsersModule.ROLES.client;
      return `<span style="font-size:11px;font-weight:600;padding:2px 9px;border-radius:20px;background:${rr.bg};color:${rr.color};white-space:nowrap;">${rr.icon} ${rr.label}</span>`;
    }).join(' ');
    // role dziedziczone z hierarchii — pokazane osobno, bo nie są nadane wprost
    const inherited = (u.effectiveRoles || []).filter(k => !uRoles.includes(k));
    const clientName = u.clientId && typeof ClientsModule !== 'undefined' ? ((ClientsModule.find(u.clientId) || {}).name || '—') : '—';
    const isMe = myId && String(u.id) === String(myId);
    return `<tr>
      <td style="${td}"><b>${_usrEsc((u.firstName + ' ' + u.lastName).trim() || '—')}</b>${isMe ? ' <span style="font-size:11px;color:var(--color-text-secondary);">(to Ty)</span>' : ''}</td>
      <td style="${td}">${_usrEsc(u.email || '—')}</td>
      <td style="${td}"><div style="display:flex;flex-wrap:wrap;gap:4px;">${badges}</div>${inherited.length ? `<div style="font-size:10px;color:var(--color-text-secondary);margin-top:3px;" title="Wynika z hierarchii ról, nie nadane wprost">+ dziedziczone: ${inherited.map(k => (UsersModule.ROLES[k] || {}).label || k).join(', ')}</div>` : ''}</td>
      <td style="${td}">${uRoles.includes('client') ? _usrEsc(clientName) : '—'}</td>
      <td style="${td}white-space:nowrap;text-align:right;">
        ${(canManage && sb && (!uRoles.includes('admin') || isAdmin)) ? `<button class="small-button" style="font-size:12px;padding:4px 10px;" onclick="editingUserId='${u.id}';showUserForm=true;renderUsersModule();">Edytuj</button>
        <button class="small-button" style="font-size:12px;padding:4px 10px;" onclick="_usrSendReset('${_usrEsc(u.email)}')">Reset hasła</button>
        ${isMe ? '' : `<button class="small-button" style="font-size:12px;padding:4px 10px;color:#c00;border-color:#c00;" onclick="_usrRemove('${u.id}')">Zablokuj</button>`}` : ''}
      </td>
    </tr>`;
  }).join('');

  container.innerHTML = `
    ${roleTabs}
    ${roleInfoCard}
    ${infoBar}
    <div style="display:flex;gap:10px;align-items:center;margin-bottom:14px;">
      <input id="usr-search-input" type="text" placeholder="Szukaj po nazwisku lub e-mailu…" value="${_usrEsc(window._usrSearch || '')}"
        style="flex:1;box-sizing:border-box;padding:8px 12px;border:1px solid var(--color-border-tertiary);border-radius:8px;font-size:13px;"
        oninput="window._usrSearch=this.value;renderUsersModule();document.getElementById('usr-search-input').focus();">
      ${canManage && sb && !showUserForm ? '<button class="primary-button" style="font-size:13px;padding:8px 18px;white-space:nowrap;" onclick="showUserForm=true;editingUserId=null;renderUsersModule();">+ Dodaj użytkownika</button>' : ''}
    </div>
    ${formHtml}
    ${display.length ? `
    <div style="border:1px solid var(--color-border-tertiary);border-radius:10px;overflow:auto;">
      <table style="width:100%;border-collapse:collapse;min-width:640px;">
        <thead><tr>${(() => {
          const thS = (col, label) => {
            const next = sort === col + '_asc' ? col + '_desc' : col + '_asc';
            const arrow = sort === col + '_asc' ? ' \u2191' : (sort === col + '_desc' ? ' \u2193' : '');
            return `<th style="${th}cursor:pointer;" onclick="window._usrSort='${next}';renderUsersModule();">${label}${arrow}</th>`;
          };
          return thS('name','Użytkownik') + thS('email','E-mail (login)') + thS('role','Rola') + thS('client','Klient') + `<th style="${th}"></th>`;
        })()}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>` : '<p style="color:var(--color-text-secondary);font-size:14px;">Brak użytkowników w tym widoku.</p>'}
  `;
}

// Zaznaczone role z checkboxów formularza.
function _usrSelectedRoles() {
  return Array.from(document.querySelectorAll('.usr-role-cb'))
    .filter(cb => cb.checked).map(cb => cb.value);
}

// Reakcja na zmianę zaznaczenia: pole klienta + podpowiedź o rolach dziedziczonych.
function _usrRolesChanged() {
  const roles = _usrSelectedRoles();
  const cf = document.getElementById('usr-client-field');
  if (cf) cf.style.display = roles.includes('client') ? '' : 'none';

  const hint = document.getElementById('usr-roles-hint');
  if (!hint) return;
  if (roles.includes('client') && roles.length > 1) {
    hint.style.color = '#c00';
    hint.textContent = 'Rola Client jest wyłączna — nie łączy się z rolami wewnętrznymi.';
    return;
  }
  hint.style.color = 'var(--color-text-secondary)';
  const inherited = UsersModule.expandRoles(roles).filter(r => !roles.includes(r));
  hint.textContent = inherited.length
    ? 'Dodatkowo z hierarchii ról: ' + inherited.map(r => (UsersModule.ROLES[r] || {}).label || r).join(', ')
    : '';
}
window._usrSelectedRoles = _usrSelectedRoles;
window._usrRolesChanged  = _usrRolesChanged;

async function _usrSave() {
  const g = id => document.getElementById(id);
  const fullName = g('usr-fullname').value.trim();
  const roles = _usrSelectedRoles();
  const clientLegacyId = roles.includes('client') ? (g('usr-client').value || null) : null;

  if (!fullName) { alert('Podaj imię i nazwisko.'); return; }
  if (!roles.length) { alert('Zaznacz co najmniej jedną rolę.'); return; }
  if (roles.includes('client') && roles.length > 1) {
    alert('Rola Client jest wyłączna — konto klienta widzi wyłącznie własne dane i nie łączy się z rolami wewnętrznymi.'); return;
  }
  if (roles.includes('client') && !clientLegacyId) { alert('Dla roli Client wybierz klienta.'); return; }

  const btn = g('usr-save-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Zapisywanie…'; }

  try {
    if (editingUserId) {
      const emailEl = g('usr-email');
      const patch = { fullName, roles, clientLegacyId };
      if (emailEl && !emailEl.disabled && emailEl.value.trim()) patch.email = emailEl.value.trim();
      await UsersModule.updateProfile(editingUserId, patch);
    } else {
      const email = g('usr-email').value.trim();
      const password = g('usr-password').value;
      if (!email || email.indexOf('@') < 1) { throw new Error('Podaj poprawny adres e-mail.'); }
      if (!password || password.length < 6) { throw new Error('Hasło startowe musi mieć min. 6 znaków.'); }
      await UsersModule.createAccount({ fullName, email, password, roles, clientLegacyId });
      alert('Konto utworzone: ' + email + '\nPrzekaż użytkownikowi login i hasło startowe.');
    }
    showUserForm = false; editingUserId = null;
    renderUsersModule();
  } catch (e) {
    alert('Nie udało się zapisać: ' + (e.message || e));
    if (btn) { btn.disabled = false; btn.textContent = editingUserId ? 'Zapisz zmiany' : 'Utwórz konto'; }
  }
}

async function _usrRemove(id) {
  const u = UsersModule.find(id);
  if (!u) return;
  if (!confirm('Zablokować dostęp dla „' + ((u.firstName + ' ' + u.lastName).trim() || u.email) + '"?\n\nProfil zostanie usunięty — to konto nie zaloguje się już do aplikacji.')) return;
  try {
    await UsersModule.removeProfile(id);
    renderUsersModule();
  } catch (e) {
    alert('Nie udało się usunąć profilu: ' + (e.message || e));
  }
}

window.renderUsersModule = renderUsersModule;

async function _usrSendReset(email) {
  if (!email) { alert('Ten profil nie ma zapisanego adresu e-mail (pole data.email) - uzupelnij go w edycji lub SQL-em.'); return; }
  if (!confirm('Wyslac na ' + email + ' link do ustawienia nowego hasla?')) return;
  try {
    const { error } = await WaterAISupabase.client.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname
    });
    if (error) throw error;
    alert('Link wyslany na ' + email + '.\nPo kliknieciu w link uzytkownik trafi do aplikacji i zostanie poproszony o nowe haslo.\n\nUwaga: na darmowym planie Supabase wbudowana poczta ma niski limit wysylek - jesli mail nie dociera, skonfiguruj wlasne SMTP (Authentication -> Emails).');
  } catch (e) {
    alert('Nie udalo sie wyslac linku: ' + (e.message || e));
  }
}
