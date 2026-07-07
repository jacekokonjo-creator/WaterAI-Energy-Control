// WaterAI Energy Control
// Shares Module v1.0.0 — zakładka „Widoczność" (macierz: dokument × użytkownik).
//
// Tabela `resource_shares` NIE jest w modelu hybrydowym jsonb (ma kolumny
// relacyjne + unikat resource_type×resource_id×user_id), więc moduł rozmawia
// z Supabase bezpośrednio (wzorzec jak UsersModule), bez WaterAIBridge.
//
// Zasada (macierz ról 2026-07-07): admin/backOffice/energyAnalyst widzą pliki
// zawsze; salesRepresentative i client — WYŁĄCZNIE udostępnione tutaj.
// Egzekwuje to RLS w bazie (migration_003) — ta zakładka tylko steruje wpisami.
//
// Ładowany PO app-v2.js i readings.js — rozszerza window.openModule o 'visibility'.

// ── 1. MAGAZYN ────────────────────────────────────────────────────────────────

const SharesModule = {
  _cache: null,   // [{id, resource_type, resource_id, user_id, permission}]

  _sb() { return (window.WaterAISupabase && WaterAISupabase.client) || null; },

  async load() {
    const sb = this._sb();
    if (!sb) { this._cache = []; return; }
    const { data, error } = await sb.from('resource_shares')
      .select('id, resource_type, resource_id, user_id, permission');
    if (error) {
      console.warn('[shares] Nie udało się pobrać udostępnień:', error.message);
      this._cache = [];
      return;
    }
    this._cache = data || [];
  },

  getAll() { return this._cache ? JSON.parse(JSON.stringify(this._cache)) : []; },

  // permission użytkownika do zasobu: 'view' | 'edit' | null
  permFor(type, resourceUuid, userId) {
    const row = (this._cache || []).find(s =>
      s.resource_type === type && s.resource_id === resourceUuid && s.user_id === userId);
    return row ? row.permission : null;
  },

  // perm: 'view' | 'edit' | null (null = odbierz dostęp)
  async setShare(type, resourceUuid, userId, perm) {
    const sb = this._sb();
    if (!sb) throw new Error('Brak połączenia z bazą.');
    const existing = (this._cache || []).find(s =>
      s.resource_type === type && s.resource_id === resourceUuid && s.user_id === userId);

    if (!perm) {
      if (!existing) return;
      const { error } = await sb.from('resource_shares').delete().eq('id', existing.id);
      if (error) throw error;
      this._cache = this._cache.filter(s => s.id !== existing.id);
      return;
    }

    const me = (window.WaterAISupabase && WaterAISupabase.profile) ? WaterAISupabase.profile.id : null;
    const { data, error } = await sb.from('resource_shares')
      .upsert(
        { resource_type: type, resource_id: resourceUuid, user_id: userId, permission: perm, shared_by: me },
        { onConflict: 'resource_type,resource_id,user_id' })
      .select('id, resource_type, resource_id, user_id, permission')
      .single();
    if (error) throw error;
    if (existing) existing.permission = data.permission;
    else this._cache.push(data);
  }
};
window.SharesModule = SharesModule;

// ── 2. ŹRÓDŁA DOKUMENTÓW (typ zasobu → lista + uuid z mostka) ────────────────

const _shTypes = [
  { key: 'base_period', icon: '📊', label: 'Okresy bazowe' },
  { key: 'analysis',    icon: '📐', label: 'Analizy' },
  { key: 'esco_report', icon: '📈', label: 'Raporty ESCO' },
  { key: 'invoice',     icon: '🧾', label: 'Faktury' },
  { key: 'simulation',  icon: '💡', label: 'Symulacje' }
];

function _shObjName(objectId) {
  const o = (window.ObjectsModule && ObjectsModule.find) ? ObjectsModule.find(objectId) : null;
  return o ? o.name : '—';
}
function _shClientOfObject(objectId) {
  const o = (window.ObjectsModule && ObjectsModule.find) ? ObjectsModule.find(objectId) : null;
  return o ? Number(o.clientId) : null;
}
function _shClientName(clientId) {
  const c = (window.ClientsModule && ClientsModule.find) ? ClientsModule.find(clientId) : null;
  return c ? c.name : '—';
}

// Zwraca [{uuid, name, sub, clientId}] — uuid=null gdy rekordu nie ma jeszcze w bazie.
function _shListResources(typeKey) {
  const pick = (store, items, nameFn, subFn, clientFn) => items.map(it => ({
    uuid: (store && store._rowIds) ? (store._rowIds[String(it.id)] || null) : null,
    name: nameFn(it), sub: subFn(it), clientId: clientFn(it)
  }));

  if (typeKey === 'base_period' && window._basePeriodsStore && window.BasePeriodModule) {
    return pick(window._basePeriodsStore, BasePeriodModule.getAll(),
      it => it.protocolNumber || ('Okres bazowy #' + it.id),
      it => (it.protocolDate || '') + ' · ' + _shObjName(it.objectId),
      it => _shClientOfObject(it.objectId));
  }
  if (typeKey === 'analysis' && window.AnalysesModule) {
    return pick(window.AnalysesModule, AnalysesModule.getAll(),
      it => it.name || (AnalysesModule.getNumber(it.id) || ('Analiza #' + it.id)),
      it => (it.executedAt || '') + ' · ' + _shObjName(it.objectId),
      it => Number(it.clientId));
  }
  if (typeKey === 'esco_report' && window.EscoReportsModule) {
    return pick(window.EscoReportsModule, EscoReportsModule.getAll(),
      it => it.reportNumber || ('Raport #' + it.id),
      it => (it.createdAt ? it.createdAt.slice(0, 10) : '') + ' · ' + _shObjName(it.objectId),
      it => Number(it.clientId));
  }
  if (typeKey === 'invoice' && window.InvoicingModule) {
    return pick(window.InvoicingModule, InvoicingModule.getAll(),
      it => it.invoiceNumber || ('Faktura #' + it.id),
      it => (it.issueDate || '') + ' · ' + _shClientName(it.clientId),
      it => Number(it.clientId));
  }
  if (typeKey === 'simulation' && window.SimulationsModule) {
    return pick(window.SimulationsModule, SimulationsModule.getAll(),
      it => it.name || ('Symulacja #' + it.id),
      it => (it.createdAt ? it.createdAt.slice(0, 10) : '') + ' · ' + _shObjName(it.objectId),
      it => Number(it.clientId));
  }
  return null;   // moduł niezaładowany / nie na mostku
}

// ── 3. WIDOK ──────────────────────────────────────────────────────────────────

let _shType = 'esco_report';
let _shClientFilter = '';

function renderVisibilityModule() {
  const container = document.getElementById('module-content');
  if (!container) return;

  // Kolumny: tylko role, które BEZ udostępnienia nie widzą plików.
  const users = (window.UsersModule ? UsersModule.getAll() : [])
    .filter(u => u.role === 'salesRepresentative' || u.role === 'client');

  const clients = (window.ClientsModule ? ClientsModule.getAll() : []);
  let resources = _shListResources(_shType);
  const moduleMissing = resources === null;
  resources = resources || [];
  if (_shClientFilter) resources = resources.filter(r => String(r.clientId) === String(_shClientFilter));

  const typeTabs = _shTypes.map(t => `
    <button class="small-button" onclick="_shSetType('${t.key}')"
      style="${t.key === _shType ? 'background:var(--color-text-primary);color:#fff;border-color:var(--color-text-primary);' : ''}">
      ${t.icon} ${t.label}</button>`).join('');

  const userHead = users.map(u => `
    <th style="padding:8px 10px;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);text-align:center;min-width:96px;">
      ${(window.UsersModule && UsersModule.ROLES[u.role]) ? UsersModule.ROLES[u.role].icon : ''} ${escapeHtml(u.fullName || u.email || '—')}
      <div style="font-weight:400;color:var(--color-text-secondary);">${(window.UsersModule && UsersModule.ROLES[u.role]) ? UsersModule.ROLES[u.role].label : ''}</div>
    </th>`).join('');

  const rows = resources.map(r => {
    const cells = users.map(u => {
      if (!r.uuid) return `<td style="padding:8px 10px;text-align:center;color:var(--color-text-secondary);" title="Dokument nie jest jeszcze zapisany we wspólnej bazie — udostępnianie niedostępne.">—</td>`;
      const perm = SharesModule.permFor(_shType, r.uuid, u.id);
      return `<td style="padding:8px 10px;text-align:center;white-space:nowrap;">
        <label style="font-size:11px;cursor:pointer;margin-right:8px;" title="Widoczność">
          <input type="checkbox" ${perm ? 'checked' : ''} onchange="_shToggle('${r.uuid}','${u.id}','view',this)"> W</label>
        <label style="font-size:11px;cursor:pointer;" title="Edycja">
          <input type="checkbox" ${perm === 'edit' ? 'checked' : ''} onchange="_shToggle('${r.uuid}','${u.id}','edit',this)"> E</label>
      </td>`;
    }).join('');
    return `<tr style="border-bottom:1px solid var(--color-border-tertiary);">
      <td style="padding:8px 12px;font-size:13px;position:sticky;left:0;background:var(--color-background-primary);">
        <div style="font-weight:500;">${escapeHtml(r.name)}</div>
        <div style="font-size:11px;color:var(--color-text-secondary);">${escapeHtml(r.sub || '')}</div>
      </td>${cells}</tr>`;
  }).join('');

  const emptyInfo = moduleMissing
    ? 'Ten typ dokumentów nie jest jeszcze podłączony do wspólnej bazy.'
    : (users.length === 0
        ? 'Brak użytkowników z rolą Sales Representative lub Client — nie ma komu udostępniać. Pozostałe role widzą wszystkie dokumenty automatycznie.'
        : 'Brak dokumentów tego typu' + (_shClientFilter ? ' dla wybranego klienta' : '') + '.');

  container.innerHTML = `
    <div style="margin-bottom:14px;">
      <p style="font-size:13px;color:var(--color-text-secondary);margin:0 0 12px;">
        Zaznacz, którzy użytkownicy widzą (W) lub mogą edytować (E) poszczególne dokumenty.
        Role Admin, Back Office i Energy Analyst widzą wszystkie dokumenty automatycznie —
        udostępnianie dotyczy ról Sales Representative i Client.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
        ${typeTabs}
        <span style="flex:1;"></span>
        <select onchange="_shSetClientFilter(this.value)" style="font-size:13px;">
          <option value="">Wszyscy klienci</option>
          ${clients.map(c => `<option value="${c.id}" ${String(_shClientFilter) === String(c.id) ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
        </select>
      </div>
    </div>
    ${(resources.length === 0 || users.length === 0)
      ? `<div class="reminder-card"><strong>${emptyInfo}</strong></div>`
      : `<div style="overflow-x:auto;border:1px solid var(--color-border-tertiary);border-radius:10px;">
          <table style="width:100%;border-collapse:collapse;">
            <thead><tr style="background:var(--color-background-secondary);">
              <th style="padding:8px 12px;font-size:11px;font-weight:600;border-bottom:2px solid var(--color-border-tertiary);text-align:left;position:sticky;left:0;background:var(--color-background-secondary);min-width:220px;">Dokument</th>
              ${userHead}
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`}
  `;
}
window.renderVisibilityModule = renderVisibilityModule;

function _shSetType(t) { _shType = t; renderVisibilityModule(); }
window._shSetType = _shSetType;

function _shSetClientFilter(v) { _shClientFilter = v; renderVisibilityModule(); }
window._shSetClientFilter = _shSetClientFilter;

// Zmiana checkboxa: W bez E → 'view'; E → 'edit' (wymusza W); nic → usunięcie wpisu.
async function _shToggle(resourceUuid, userId, kind, el) {
  const current = SharesModule.permFor(_shType, resourceUuid, userId);
  let next;
  if (kind === 'view') next = el.checked ? (current === 'edit' ? 'edit' : 'view') : null;
  else next = el.checked ? 'edit' : (current ? 'view' : null);
  try {
    await SharesModule.setShare(_shType, resourceUuid, userId, next);
  } catch (e) {
    alert('Nie udało się zapisać udostępnienia: ' + (e.message || e));
  }
  renderVisibilityModule();
}
window._shToggle = _shToggle;

// ── 4. ROUTING — rozszerzenie openModule ─────────────────────────────────────

(function () {
  const prev = window.openModule;
  window.openModule = function (moduleName) {
    if (moduleName === 'visibility') {
      const labels = (typeof getModuleLabels === 'function') ? getModuleLabels() : {};
      const item = labels[moduleName];
      const titleEl = document.getElementById('module-title');
      if (titleEl && item) titleEl.textContent = item[1];
      const descEl = document.getElementById('module-description');
      if (descEl) descEl.textContent = '';
      const modView = document.getElementById('module-view');
      if (modView) modView.classList.add('active');
      renderVisibilityModule();
      return;
    }
    if (prev) prev(moduleName);
  };
})();
