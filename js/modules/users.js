// WaterAI Energy Control
// Users & Roles Module v1.0.0

const UsersModule = {
  storageKey: 'waterai_users_v1',

  ROLES: {
    admin:              { label: 'Admin',               icon: '🔑', color: '#7B1FA2', bg: '#F3E5F5', description: 'Pełny dostęp do systemu, zarządzanie kontami wszystkich użytkowników.' },
    backOffice:         { label: 'Back Office',         icon: '🗂️', color: '#0C447C', bg: '#E6F1FB', description: 'Obsługa klientów, dokumenty, faktury, kalendarz.' },
    energyAnalyst:      { label: 'Energy Analyst',      icon: '📈', color: '#27500A', bg: '#E6F5EC', description: 'Pomiary, analizy, protokoły TYM, raporty ESCO.' },
    salesRepresentative:{ label: 'Sales Representative',icon: '🤝', color: '#E65100', bg: '#FFF3E0', description: 'Dostęp do klientów, obiektów i raportów sprzedażowych.' },
    client:             { label: 'Client',              icon: '👤', color: '#555',    bg: '#F5F5F5', description: 'Podgląd własnych obiektów, pomiarów i raportów ESCO.' }
  },

  // Roles that can create new accounts
  CAN_CREATE: {
    admin:   ['admin', 'backOffice', 'energyAnalyst', 'salesRepresentative', 'client'],
    backOffice: ['client']
  },

  getAll() {
    return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
  },

  saveAll(items) {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  },

  add(user) {
    const items = this.getAll();
    const id = Date.now();
    items.push({
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      firstName: user.firstName || '',
      lastName:  user.lastName  || '',
      email:     user.email     || '',
      phone:     user.phone     || '',
      role:      user.role      || 'client',
      clientId:  user.clientId  ? Number(user.clientId) : null,
      status:    user.status    || 'ACTIVE',   // ACTIVE | INACTIVE | PENDING
      notes:     user.notes     || '',
      language:  user.language  || 'pl',
      // password stored as placeholder — real auth via backend
      passwordHash: user.passwordHash || ''
    });
    this.saveAll(items);
    return id;
  },

  update(id, data) {
    this.saveAll(this.getAll().map(u => {
      if (Number(u.id) !== Number(id)) return u;
      return { ...u, ...data, updatedAt: new Date().toISOString() };
    }));
  },

  remove(id) {
    this.saveAll(this.getAll().filter(u => Number(u.id) !== Number(id)));
  },

  find(id) {
    return this.getAll().find(u => Number(u.id) === Number(id));
  },

  findByRole(role) {
    return this.getAll().filter(u => u.role === role);
  },

  findByClient(clientId) {
    return this.getAll().filter(u => Number(u.clientId) === Number(clientId));
  },

  STATUS_LABELS: {
    ACTIVE:   { label: 'Aktywny',    color: '#27500A', bg: '#E6F5EC' },
    INACTIVE: { label: 'Nieaktywny', color: '#666',    bg: '#F5F5F5' },
    PENDING:  { label: 'Oczekujący', color: '#E65100', bg: '#FFF3E0' }
  }
};

window.UsersModule = UsersModule;

// ═══════════════════════════════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════════════════════════════

let usersActiveRole = 'all';
let showUserForm = false;
let editingUserId = null;

function renderUsersModule() {
  const container = document.getElementById('module-content');
  if (!container) return;

  const allUsers = UsersModule.getAll();
  const clients  = (typeof ClientsModule !== 'undefined') ? ClientsModule.getAll() : [];

  const filtered = usersActiveRole === 'all'
    ? allUsers
    : allUsers.filter(u => u.role === usersActiveRole);

  const roleCounts = {};
  Object.keys(UsersModule.ROLES).forEach(r => {
    roleCounts[r] = allUsers.filter(u => u.role === r).length;
  });

  // Role tab buttons
  const roleTabs = `
    <div class="meas-tabs" style="margin-bottom:20px;">
      <button type="button" class="meas-tab ${usersActiveRole === 'all' ? 'active' : ''}"
        onclick="usersActiveRole='all'; renderUsersModule();">
        👥 Wszyscy (${allUsers.length})
      </button>
      ${Object.entries(UsersModule.ROLES).map(([key, r]) => `
        <button type="button" class="meas-tab ${usersActiveRole === key ? 'active' : ''}"
          style="${usersActiveRole === key ? `color:${r.color};border-bottom-color:${r.color};` : ''}"
          onclick="usersActiveRole='${key}'; renderUsersModule();">
          ${r.icon} ${r.label} (${roleCounts[key] || 0})
        </button>
      `).join('')}
    </div>`;

  // Role description card
  const roleInfoCard = usersActiveRole !== 'all' ? (() => {
    const r = UsersModule.ROLES[usersActiveRole];
    return `
    <div style="border:1px solid ${r.color}44;border-radius:10px;padding:12px 16px;margin-bottom:16px;background:${r.bg};display:flex;align-items:center;gap:12px;">
      <span style="font-size:24px;">${r.icon}</span>
      <div>
        <strong style="color:${r.color};font-size:14px;">${r.label}</strong>
        <p style="margin:2px 0 0;font-size:12px;color:${r.color};opacity:0.85;">${r.description}</p>
      </div>
    </div>`;
  })() : '';

  // Form
  const roleOptions = Object.entries(UsersModule.ROLES)
    .map(([k, r]) => `<option value="${k}" ${(editingUserId ? (UsersModule.find(editingUserId)||{}).role : usersActiveRole !== 'all' ? usersActiveRole : '') === k ? 'selected' : ''}>${r.icon} ${r.label}</option>`)
    .join('');

  const clientOptions = `<option value="">— brak (użytkownik wewnętrzny) —</option>` +
    clients.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');

  const editUser = editingUserId ? UsersModule.find(editingUserId) : null;

  const formHtml = showUserForm ? `
  <div style="border:1px solid #B5D4F4;border-radius:14px;padding:20px;margin-bottom:20px;background:var(--color-background-primary);">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <h4 style="margin:0;font-size:15px;color:#0C447C;">${editUser ? 'Edytuj użytkownika' : 'Nowe konto użytkownika'}</h4>
      <button class="small-button" onclick="showUserForm=false;editingUserId=null;renderUsersModule();">✕</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div>
        <label style="font-size:12px;color:var(--color-text-secondary);display:block;margin-bottom:4px;">Imię *</label>
        <input id="usr-firstName" value="${escapeHtml(editUser ? editUser.firstName : '')}" placeholder="np. Jan" style="width:100%;box-sizing:border-box;" />
      </div>
      <div>
        <label style="font-size:12px;color:var(--color-text-secondary);display:block;margin-bottom:4px;">Nazwisko *</label>
        <input id="usr-lastName" value="${escapeHtml(editUser ? editUser.lastName : '')}" placeholder="np. Kowalski" style="width:100%;box-sizing:border-box;" />
      </div>
      <div>
        <label style="font-size:12px;color:var(--color-text-secondary);display:block;margin-bottom:4px;">E-mail *</label>
        <input id="usr-email" type="email" value="${escapeHtml(editUser ? editUser.email : '')}" placeholder="jan.kowalski@firma.pl" style="width:100%;box-sizing:border-box;" />
      </div>
      <div>
        <label style="font-size:12px;color:var(--color-text-secondary);display:block;margin-bottom:4px;">Telefon</label>
        <input id="usr-phone" value="${escapeHtml(editUser ? editUser.phone : '')}" placeholder="+48 600 000 000" style="width:100%;box-sizing:border-box;" />
      </div>
      <div>
        <label style="font-size:12px;color:var(--color-text-secondary);display:block;margin-bottom:4px;">Rola *</label>
        <select id="usr-role" onchange="toggleUserClientField()" style="width:100%;box-sizing:border-box;">${roleOptions}</select>
      </div>
      <div>
        <label style="font-size:12px;color:var(--color-text-secondary);display:block;margin-bottom:4px;">Status</label>
        <select id="usr-status" style="width:100%;box-sizing:border-box;">
          ${Object.entries(UsersModule.STATUS_LABELS).map(([k,v]) =>
            `<option value="${k}" ${(editUser ? editUser.status : 'ACTIVE') === k ? 'selected' : ''}>${v.label}</option>`
          ).join('')}
        </select>
      </div>
      <div id="usr-client-field" style="${editUser && editUser.role === 'client' ? '' : 'display:none;'}grid-column:1/-1;">
        <label style="font-size:12px;color:var(--color-text-secondary);display:block;margin-bottom:4px;">Przypisany klient (dla roli Client)</label>
        <select id="usr-clientId" style="width:100%;box-sizing:border-box;">
          ${clients.map(c => `<option value="${c.id}" ${editUser && Number(editUser.clientId) === Number(c.id) ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
        </select>
      </div>
      <div>
        <label style="font-size:12px;color:var(--color-text-secondary);display:block;margin-bottom:4px;">Język</label>
        <select id="usr-language" style="width:100%;box-sizing:border-box;">
          <option value="pl" ${(editUser ? editUser.language : 'pl') === 'pl' ? 'selected' : ''}>🇵🇱 Polski</option>
          <option value="en" ${(editUser ? editUser.language : '') === 'en' ? 'selected' : ''}>🇬🇧 English</option>
          <option value="de" ${(editUser ? editUser.language : '') === 'de' ? 'selected' : ''}>🇩🇪 Deutsch</option>
          <option value="cs" ${(editUser ? editUser.language : '') === 'cs' ? 'selected' : ''}>🇨🇿 Čeština</option>
          <option value="sk" ${(editUser ? editUser.language : '') === 'sk' ? 'selected' : ''}>🇸🇰 Slovenčina</option>
        </select>
      </div>
      <div style="grid-column:1/-1;">
        <label style="font-size:12px;color:var(--color-text-secondary);display:block;margin-bottom:4px;">Notatki</label>
        <input id="usr-notes" value="${escapeHtml(editUser ? editUser.notes : '')}" placeholder="opcjonalne notatki" style="width:100%;box-sizing:border-box;" />
      </div>
      ${!editUser ? `
      <div style="grid-column:1/-1;padding:10px 14px;background:#FFF9E6;border:1px solid #FAC775;border-radius:8px;font-size:12px;color:#633806;">
        🔐 Hasło tymczasowe zostanie wygenerowane automatycznie i wysłane na podany adres e-mail po wdrożeniu systemu logowania.
      </div>` : ''}
      <div style="grid-column:1/-1;display:flex;gap:10px;margin-top:4px;">
        <button class="primary-button" onclick="saveUser()" style="padding:9px 24px;">
          ${editUser ? 'Zapisz zmiany' : 'Utwórz konto'}
        </button>
        <button class="small-button" onclick="showUserForm=false;editingUserId=null;renderUsersModule();">Anuluj</button>
      </div>
    </div>
  </div>` : '';

  // Users table
  const rows = filtered.map(u => {
    const r = UsersModule.ROLES[u.role] || { icon: '👤', label: u.role, color: '#666', bg: '#f5f5f5' };
    const s = UsersModule.STATUS_LABELS[u.status] || { label: u.status, color: '#666', bg: '#f5f5f5' };
    const client = u.clientId ? (ClientsModule.find(u.clientId) || {}).name || '—' : '—';
    return `<tr style="border-bottom:1px solid var(--color-border-tertiary);">
      <td style="padding:10px 12px;">
        <div style="font-size:13px;font-weight:500;">${escapeHtml(u.firstName)} ${escapeHtml(u.lastName)}</div>
        <div style="font-size:11px;color:var(--color-text-secondary);">${escapeHtml(u.email)}</div>
      </td>
      <td style="padding:10px 12px;">
        <span style="font-size:12px;font-weight:500;padding:3px 10px;border-radius:20px;background:${r.bg};color:${r.color};">
          ${r.icon} ${r.label}
        </span>
      </td>
      <td style="padding:10px 12px;font-size:12px;color:var(--color-text-secondary);">${escapeHtml(u.phone || '—')}</td>
      <td style="padding:10px 12px;font-size:12px;color:var(--color-text-secondary);">${escapeHtml(client)}</td>
      <td style="padding:10px 12px;">
        <span style="font-size:11px;font-weight:500;padding:2px 8px;border-radius:20px;background:${s.bg};color:${s.color};">${s.label}</span>
      </td>
      <td style="padding:10px 12px;white-space:nowrap;">
        <button class="small-button" onclick="editUser(${u.id})">Edytuj</button>
        <button class="small-button" onclick="if(confirm('Usuń konto ${escapeHtml(u.firstName)} ${escapeHtml(u.lastName)}?')){UsersModule.remove(${u.id});renderUsersModule();}" style="color:#c00;border-color:#c00;">Usuń</button>
      </td>
    </tr>`;
  }).join('');

  const tableHtml = `
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
    <h3 style="margin:0;font-size:15px;font-weight:500;">
      ${usersActiveRole === 'all' ? 'Wszyscy użytkownicy' : (UsersModule.ROLES[usersActiveRole]||{}).label || ''}
      <span style="font-size:12px;color:var(--color-text-secondary);font-weight:400;">(${filtered.length})</span>
    </h3>
    <button class="primary-button" style="font-size:13px;padding:8px 16px;"
      onclick="showUserForm=true;editingUserId=null;renderUsersModule();">
      + Nowe konto
    </button>
  </div>
  ${filtered.length === 0 ? `
    <div class="reminder-card">
      <strong>Brak użytkowników</strong>
      <div class="reminder-meta">Kliknij „+ Nowe konto" aby dodać pierwszego użytkownika.</div>
    </div>` : `
  <div style="overflow-x:auto;border:1px solid var(--color-border-tertiary);border-radius:10px;">
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:var(--color-background-secondary);">
          <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Użytkownik</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Rola</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Telefon</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Klient</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Status</th>
          <th style="padding:8px 12px;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);">Akcje</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`}`;

  // Role overview cards
  const roleCards = `
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;margin-bottom:20px;">
    ${Object.entries(UsersModule.ROLES).map(([key, r]) => `
    <div style="border:1px solid ${r.color}44;border-radius:10px;padding:12px;background:${r.bg};cursor:pointer;"
      onclick="usersActiveRole='${key}';renderUsersModule();">
      <div style="font-size:22px;margin-bottom:4px;">${r.icon}</div>
      <div style="font-size:20px;font-weight:700;color:${r.color};">${roleCounts[key] || 0}</div>
      <div style="font-size:12px;color:${r.color};font-weight:500;">${r.label}</div>
    </div>`).join('')}
  </div>`;

  container.innerHTML = `
    <style>
      .meas-tabs { display:flex; gap:0; flex-wrap:wrap; border-bottom:2px solid var(--color-border-tertiary); }
      .meas-tab { padding:9px 18px; font-size:13px; font-weight:500; cursor:pointer; border:none; background:transparent; color:var(--color-text-secondary); border-bottom:3px solid transparent; margin-bottom:-2px; transition:all 0.15s; }
      .meas-tab.active { color:#0C447C; border-bottom-color:#0C447C; }
      .meas-tab:hover:not(.active) { background:var(--color-background-secondary); }
    </style>
    ${usersActiveRole === 'all' ? roleCards : ''}
    ${roleTabs}
    ${roleInfoCard}
    ${formHtml}
    ${tableHtml}
  `;
}

function saveUser() {
  const firstName = document.getElementById('usr-firstName').value.trim();
  const lastName  = document.getElementById('usr-lastName').value.trim();
  const email     = document.getElementById('usr-email').value.trim();
  if (!firstName || !lastName || !email) { alert('Podaj imię, nazwisko i e-mail.'); return; }

  const role = document.getElementById('usr-role').value;
  const clientIdEl = document.getElementById('usr-clientId');

  const data = {
    firstName, lastName, email,
    phone:    document.getElementById('usr-phone').value.trim(),
    role,
    status:   document.getElementById('usr-status').value,
    language: document.getElementById('usr-language').value,
    notes:    document.getElementById('usr-notes').value.trim(),
    clientId: (role === 'client' && clientIdEl) ? clientIdEl.value : null
  };

  if (editingUserId) {
    UsersModule.update(editingUserId, data);
    editingUserId = null;
  } else {
    UsersModule.add(data);
  }

  showUserForm = false;
  renderUsersModule();
}

function editUser(id) {
  editingUserId = id;
  showUserForm = true;
  renderUsersModule();
}

function toggleUserClientField() {
  const role = document.getElementById('usr-role').value;
  const field = document.getElementById('usr-client-field');
  if (field) field.style.display = role === 'client' ? 'block' : 'none';
}
