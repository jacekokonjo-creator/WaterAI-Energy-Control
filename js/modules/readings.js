// WaterAI Energy Control
// Readings Module v1.2.0 — zakładka „Pomiary" (rejestr odczytów/zużycia per obiekt)
// v1.2.0 (układ uzgodniony w makietach): dane z FV (medium+pelet, data odczytu,
// okres, źródło, waluta, nr FV, dostawca), przelicznik gazu m³→kWh, pozycje
// kosztów z jednostką z listy i jedn. ceny [waluta/j.m.], podsumowanie netto
// + pasek VAT z kwotami brutto; zużycie liczone z pozycji Z (bez osobnego pola);
// Szczegóły stałe (wprowadził/odczytał) + osobna sekcja „Opis kosztów".
//
// Dane: tabela `readings` w Supabase (wzorzec hybrydowy: kolumna data jsonb),
// lustro localStorage: waterai_readings_v1. Załączniki: Supabase Storage,
// bucket `reading-attachments` (w rekordzie tylko metadane).
//
// Ładowany PO app-v2.js — rozszerza window.openModule o 'readings'/'myReadings'.

// ── 1. MAGAZYN DANYCH ────────────────────────────────────────────────────────

const _readingsStore = (window.WaterAIBridge && WaterAIBridge.makeStore)
  ? WaterAIBridge.makeStore({
      table: 'readings',
      storageKey: 'waterai_readings_v1',
      label: 'pomiarów',
      fk: { column: 'object_id', prop: 'objectId', module: () => window.ObjectsModule }
    })
  : (console.warn('[readings] Brak WaterAIBridge — tryb lokalny.'), {
      storageKey: 'waterai_readings_v1',
      async load() {},
      getAll() { return JSON.parse(localStorage.getItem(this.storageKey) || '[]'); },
      saveAll(items) { localStorage.setItem(this.storageKey, JSON.stringify(items)); },
      legacyIdForRow() { return null; }
    });

const ReadingsModule = {
  ..._readingsStore,
  storageKey: 'waterai_readings_v1',

  _normalize(r) {
    return {
      ...r,
      clientId: Number(r.clientId),
      objectId: Number(r.objectId),
      value: Number(r.value || 0),
      energyValue: r.energyValue === '' || r.energyValue == null ? null : Number(r.energyValue),
      costNet: r.costNet === '' || r.costNet == null ? null : Number(r.costNet),
      vatRate: r.vatRate === '' || r.vatRate == null ? null : Number(r.vatRate),
      costGross: r.costGross === '' || r.costGross == null ? null : Number(r.costGross),
      unitCost: r.unitCost === '' || r.unitCost == null ? null : Number(r.unitCost),
      invoiceItems: Array.isArray(r.invoiceItems) ? r.invoiceItems : [],
      attachments: Array.isArray(r.attachments) ? r.attachments : []
    };
  },

  add(reading) {
    const items = this.getAll();
    items.push(this._normalize({
      id: reading.id || Date.now(),
      createdAt: new Date().toISOString(),
      ...reading
    }));
    this.saveAll(items);
  },

  update(id, patch) {
    const items = this.getAll().map(item => {
      if (Number(item.id) !== Number(id)) return item;
      return this._normalize({ ...item, ...patch, id: item.id, updatedAt: new Date().toISOString() });
    });
    this.saveAll(items);
  },

  remove(id) {
    this.saveAll(this.getAll().filter(item => Number(item.id) !== Number(id)));
  },

  find(id) {
    return this.getAll().find(item => Number(item.id) === Number(id));
  },

  findByObject(objectId) {
    return this.getAll()
      .filter(item => Number(item.objectId) === Number(objectId))
      .sort((a, b) => String(b.periodFrom || '').localeCompare(String(a.periodFrom || '')));
  }
};

window.ReadingsModule = ReadingsModule;

// ── 2. SŁOWNIKI ──────────────────────────────────────────────────────────────

const RD_SOURCES = {
  METER:   { label: 'Odczyt z licznika',        icon: '🔢', bg: '#E1F5EE', fg: '#085041' },
  REMOTE:  { label: 'Zdalny odczyt z licznika', icon: '📡', bg: '#EEEDFE', fg: '#3C3489' },
  INVOICE: { label: 'Wskazanie z FV',           icon: '🧾', bg: '#FAECE7', fg: '#712B13' },
  CLIENT:  { label: 'Odczyt klienta',           icon: '👤', bg: '#F1EFE8', fg: '#444441' }
};
const RD_UNITS = ['GJ', 'MWh', 'kWh', 'm3', 'Gcal'];
const RD_UNIT_LABELS = { m3: 'm³' };
const RD_CURRENCIES = ['PLN', 'EUR', 'CZK', 'GBP'];
const RD_VALUE_TYPES = { READING: 'Wskazanie licznika', CONSUMPTION: 'Zużycie w okresie' };
const RD_MEDIA = { HEAT: 'Ciepło sieciowe', GAS: 'Gaz', ELECTRICITY: 'Energia elektryczna', PELLET: 'Pelet', WATER: 'Woda', OTHER: 'Inne' };
const RD_ITEM_UNITS = ['kWh', 'MWh', 'GJ', 'm3', 't', 'MW', 'mies.', 'szt.'];
const RD_FUEL_UNITS = ['kWh', 'MWh', 'GJ', 'm3', 't'];
const RD_FV_TEMPLATES = [
  'Energia czynna (prąd)',
  'Paliwo gazowe / energia czynna (SOPo)',
  'Opłata dystrybucyjna zmienna',
  'Opłata dystrybucyjna stała',
  'Opłata stała za punkt poboru',
  'Magazynowanie gazu (SOPs)',
  'Opłata za przesył (transport) — zmienna',
  'Opłata abonamentowa',
  'Opłata mocowa',
  'Opłata jakościowa',
  'Opłata OZE i kogeneracyjna',
  'Opłata handlowa',
  'Opłata sieciowa stała (moc umowna)',
  'Opłata przejściowa',
  'Akcyza / podatek od energii',
  'Inna pozycja'
];
// Domyslny typ kosztu pozycji: VARIABLE (zalezny od zuzycia) / FIXED (staly)
const RD_FV_DEFAULT_TYPE = {
  'Energia czynna (prąd)': 'VARIABLE',
  'Paliwo gazowe / energia czynna (SOPo)': 'VARIABLE',
  'Opłata dystrybucyjna zmienna': 'VARIABLE',
  'Opłata dystrybucyjna stała': 'FIXED',
  'Opłata stała za punkt poboru': 'FIXED',
  'Magazynowanie gazu (SOPs)': 'VARIABLE',
  'Opłata za przesył (transport) — zmienna': 'VARIABLE',
  'Opłata abonamentowa': 'FIXED',
  'Opłata mocowa': 'VARIABLE',
  'Opłata handlowa': 'FIXED',
  'Opłata sieciowa stała (moc umowna)': 'FIXED',
  'Opłata przejściowa': 'FIXED',
  'Opłata jakościowa': 'VARIABLE',
  'Opłata OZE i kogeneracyjna': 'VARIABLE',
  'Akcyza / podatek od energii': 'VARIABLE',
  'Inna pozycja': 'VARIABLE'
};
const RD_BUCKET = 'reading-attachments';

// ── 3. STAN WIDOKU ───────────────────────────────────────────────────────────

let _rdClientId = null;
let _rdObjectId = null;
let _rdLockClientId = null;   // rola client: przypięty klient
let _rdMode = null;           // null | 'single' | 'serial'
let _rdEditingId = null;
let _rdItems = [];            // pozycje z FV (szkic formularza)
let _rdFiles = [];            // File[] czekające na upload
let _rdKeepAtt = [];          // istniejące załączniki przy edycji

function _rdUnit(u) { return RD_UNIT_LABELS[u] || u || ''; }
function _rdProfile() { return (window.WaterAISupabase && WaterAISupabase.profile) || null; }
function _rdIsInternal() { return typeof currentRole !== 'undefined' && currentRole !== 'client'; }
function _rdEsc(v) { return (typeof escapeHtml === 'function') ? escapeHtml(v == null ? '' : String(v)) : String(v == null ? '' : v); }
function _rdNum(v, dec) {
  if (v == null || v === '' || isNaN(Number(v))) return '—';
  return Number(v).toLocaleString('pl-PL', { minimumFractionDigits: dec == null ? 0 : dec, maximumFractionDigits: dec == null ? 3 : dec });
}
function _rdDatePL(iso) {
  if (!iso) return '—';
  const p = String(iso).slice(0, 10).split('-');
  return p.length === 3 ? p[2] + '.' + p[1] + '.' + p[0] : iso;
}
function _rdMonthBounds(y, m) {
  const last = new Date(y, m, 0).getDate();
  const mm = String(m).padStart(2, '0');
  return { from: y + '-' + mm + '-01', to: y + '-' + mm + '-' + String(last).padStart(2, '0') };
}
function _rdSb() { return (window.WaterAISupabase && WaterAISupabase.client) || null; }

// ── 4. WIDOK GŁÓWNY ──────────────────────────────────────────────────────────

function renderReadingsModule(lockClientId) {
  const container = document.getElementById('module-content');
  if (!container) return;

  _rdLockClientId = lockClientId ? Number(lockClientId) : null;

  const clientsAll = ClientsModule.getAll();
  const clients = _rdLockClientId ? clientsAll.filter(c => Number(c.id) === _rdLockClientId) : clientsAll;

  if (clients.length === 0) {
    container.innerHTML = '<p style="color:var(--color-text-secondary);font-size:14px;">' +
      (_rdLockClientId ? 'Brak przypisanego klienta do tego konta.' : 'Najpierw dodaj klienta w module „Klienci".') + '</p>';
    return;
  }

  if (_rdLockClientId) _rdClientId = _rdLockClientId;
  if (!_rdClientId || !clients.some(c => Number(c.id) === Number(_rdClientId))) _rdClientId = Number(clients[0].id);

  const objs = ObjectsModule.findByClient(_rdClientId);
  if (!_rdObjectId || !objs.some(o => Number(o.id) === Number(_rdObjectId))) {
    _rdObjectId = objs[0] ? Number(objs[0].id) : null;
  }
  const obj = _rdObjectId ? ObjectsModule.find(_rdObjectId) : null;

  const lbl = 'display:block;font-size:12px;color:var(--color-text-secondary);margin-bottom:4px;';
  const inp = 'width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid var(--color-border-tertiary);border-radius:8px;font-size:13px;';

  const selector = `
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;padding:14px 16px;background:var(--color-background-secondary);border:1px solid var(--color-border-tertiary);border-radius:10px;">
      <div style="flex:1;min-width:200px;"><label style="${lbl}">Klient</label>
        <select onchange="_rdSelectClient(this.value)" style="${inp}" ${_rdLockClientId ? 'disabled' : ''}>
          ${clients.map(c => { const cn = ClientsModule.getNumber(c.id); return `<option value="${c.id}" ${Number(c.id) === Number(_rdClientId) ? 'selected' : ''}>${cn ? 'K' + cn + ' — ' : ''}${_rdEsc(c.name)}</option>`; }).join('')}
        </select></div>
      <div style="flex:1;min-width:200px;"><label style="${lbl}">Obiekt</label>
        <select onchange="_rdSelectObject(this.value)" style="${inp}">
          ${objs.map(o => { const cn = ClientsModule.getNumber(o.clientId); const on = ObjectsModule.getNumber(o.id); return `<option value="${o.id}" ${Number(o.id) === Number(_rdObjectId) ? 'selected' : ''}>${(cn && on) ? 'K' + cn + '-' + on + ' — ' : ''}${_rdEsc(o.name || 'Obiekt')}</option>`; }).join('')}
        </select></div>
    </div>`;

  if (!obj) {
    container.innerHTML = selector + '<p style="color:var(--color-text-secondary);font-size:14px;">Ten klient nie ma jeszcze obiektów.</p>';
    return;
  }

  const infoBar = `
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:13px;color:var(--color-text-secondary);background:var(--color-background-secondary);border:1px solid var(--color-border-tertiary);border-radius:10px;padding:8px 14px;margin-bottom:16px;">
      <span>Jednostka obiektu: <b style="color:var(--color-text-primary);">${_rdEsc(_rdUnit(obj.energyUnit || 'GJ'))}</b></span>
      <span>·</span>
      <span>Waluta: <b style="color:var(--color-text-primary);">${_rdEsc(obj.currency || 'PLN')}</b></span>
      <span style="margin-left:auto;display:flex;gap:8px;">
        ${_rdMode ? '' : `<button class="primary-button" style="font-size:13px;padding:7px 14px;" onclick="_rdOpenForm('single')">+ Dodaj pomiar</button>
        <button class="small-button" style="font-size:13px;padding:7px 14px;" onclick="_rdOpenForm('serial')">+ Pomiar seryjny</button>
        ${_rdIsInternal() ? `<button class="small-button" style="font-size:12px;color:#8A2E2E;" onclick="_rdWipeObject()" title="Usuwa wszystkie pomiary tego obiektu — także ze wspólnej bazy">🗑 Wyczyść obiekt</button>` : ''}`}
      </span>
    </div>`;

  let formHtml = '';
  if (_rdMode === 'single') formHtml = _rdSingleFormHtml(obj);
  if (_rdMode === 'serial') formHtml = _rdSerialFormHtml(obj);

  container.innerHTML = selector + infoBar + formHtml + _rdTableHtml(obj);
  if (_rdMode === 'single') { _rdRenderItems(); _rdRenderFileChips(); _rdGasCalc(); }
}

function _rdSelectClient(v) {
  _rdClientId = Number(v);
  const objs = ObjectsModule.findByClient(_rdClientId);
  _rdObjectId = objs[0] ? Number(objs[0].id) : null;
  _rdMode = null; _rdEditingId = null;
  renderReadingsModule(_rdLockClientId);
}
function _rdSelectObject(v) {
  _rdObjectId = Number(v);
  _rdMode = null; _rdEditingId = null;
  renderReadingsModule(_rdLockClientId);
}
function _rdCancel() {
  _rdMode = null; _rdEditingId = null; _rdItems = []; _rdFiles = []; _rdKeepAtt = [];
  renderReadingsModule(_rdLockClientId);
}
function _rdOpenForm(mode) {
  _rdMode = mode; _rdEditingId = null; _rdItems = []; _rdFiles = []; _rdKeepAtt = [];
  renderReadingsModule(_rdLockClientId);
}

// ── 5. TABELA POMIARÓW ───────────────────────────────────────────────────────

function _rdCanEdit(r) {
  if (_rdIsInternal()) return true;
  const p = _rdProfile();
  return !!(p && r.enteredById && String(r.enteredById) === String(p.id));
}

function _rdTableHtml(obj) {
  const all = ReadingsModule.findByObject(obj.id);
  // L.p. chronologiczne wg okresu (najstarszy pomiar = 1) — stale, niezalezne od sortowania
  const chrono = all.slice().sort((a, b) =>
    String(a.periodFrom || '').localeCompare(String(b.periodFrom || '')) || (Number(a.id) - Number(b.id)));
  const lpOf = {};
  chrono.forEach((r, i) => { lpOf[r.id] = i + 1; });

  const sort = window._rdSort || 'lp_desc';
  const col = sort.replace(/_(asc|desc)$/, '');
  const dir = sort.endsWith('_desc') ? -1 : 1;
  const sv = r =>
    col === 'date' ? String(r.readingDate || '') :
    col === 'value' ? Number(r.value || 0) :
    lpOf[r.id];
  // Filtr zakresu dat (okres pomiaru nachodzący na wybrany zakres)
  const fFrom = window._rdFilterFrom || '';
  const fTo = window._rdFilterTo || '';
  const inRange = r => {
    const pf = r.periodFrom || r.readingDate || '';
    const pt = r.periodTo || r.periodFrom || r.readingDate || '';
    if (fFrom && pt < fFrom) return false;
    if (fTo && pf > fTo) return false;
    return true;
  };
  const filtered = all.filter(inRange);
  const rows = filtered.slice().sort((a, b) => {
    const va = sv(a), vb = sv(b);
    return (typeof va === 'string' ? va.localeCompare(vb) : va - vb) * dir;
  });

  const filterBar = `
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:13px;color:var(--color-text-secondary);margin-bottom:10px;">
      <b style="font-size:12px;white-space:nowrap;">Pokaż okres:</b>
      <input type="date" value="${fFrom}" style="width:150px;flex:0 0 auto;display:inline-block;padding:5px 8px;border:1px solid var(--color-border-tertiary);border-radius:6px;font-size:12px;"
        onchange="window._rdFilterFrom=this.value;renderReadingsModule(_rdLockClientId);">
      <span>–</span>
      <input type="date" value="${fTo}" style="width:150px;flex:0 0 auto;display:inline-block;padding:5px 8px;border:1px solid var(--color-border-tertiary);border-radius:6px;font-size:12px;"
        onchange="window._rdFilterTo=this.value;renderReadingsModule(_rdLockClientId);">
      ${(fFrom || fTo) ? `<button class="small-button" style="font-size:12px;" onclick="window._rdFilterFrom='';window._rdFilterTo='';renderReadingsModule(_rdLockClientId);">✕ Wyczyść filtr</button>
      <span>· widoczne: <b>${rows.length}</b> z ${all.length}</span>` : ''}
    </div>`;

  if (all.length === 0) {
    return '<p style="color:var(--color-text-secondary);font-size:14px;">Brak pomiarów dla tego obiektu. Dodaj pierwszy przyciskiem „+ Dodaj pomiar" lub wklej listę przez „+ Pomiar seryjny".</p>';
  }
  if (rows.length === 0) {
    return filterBar + '<p style="color:var(--color-text-secondary);font-size:14px;">Brak pomiarów w wybranym zakresie dat.</p>';
  }

  // Wykrywanie duplikatów (ten sam okres, typ, wartość i jednostka)
  const dupSeen = {};
  let dupCount = 0;
  all.forEach(r => {
    const key = [r.periodFrom, r.periodTo, Number(r.value || 0)].join('|');
    if (dupSeen[key]) dupCount++; else dupSeen[key] = true;
  });
  const dupBar = (dupCount && _rdIsInternal()) ? `
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;border:1px solid #F0C987;background:#FDF6E9;border-radius:10px;padding:10px 14px;margin-bottom:12px;font-size:13px;color:#854F0B;">
      <span>⚠ Wykryto <b>${dupCount}</b> zduplikowanych pomiarów (ten sam okres i wartość).</span>
      <button class="small-button" style="font-size:12px;" onclick="_rdDedupe()">Usuń duplikaty</button>
    </div>` : '';

  const th = 'text-align:left;padding:8px 10px;font-size:11px;font-weight:600;color:var(--color-text-secondary);border-bottom:2px solid var(--color-border-tertiary);background:var(--color-background-secondary);white-space:nowrap;';
  const td = 'padding:8px 10px;font-size:13px;vertical-align:top;';

  const body = rows.map(r => {
    const src = RD_SOURCES[r.dataSource] || RD_SOURCES.METER;
    const canEdit = _rdCanEdit(r);
    const att = (r.attachments || []);
    const attHtml = att.length
      ? att.map(a => `<a href="#" onclick="_rdOpenAttachment('${_rdEsc(a.path)}');return false;" style="font-size:12px;color:var(--color-text-secondary);text-decoration:underline;margin-right:8px;">📎 ${_rdEsc(a.name)}</a>`).join('')
      : '';
    const metaBits = [];
    if (r.invoiceNumber || r.supplier) metaBits.push('FV: ' + [r.invoiceNumber, r.supplier].filter(Boolean).map(_rdEsc).join(' — '));
    if (r.performedBy) metaBits.push('Odczyt: ' + _rdEsc(r.performedBy));
    if (r.enteredByName) metaBits.push('Wprowadził: ' + _rdEsc(r.enteredByName) + (r.enteredAt ? ', ' + _rdDatePL(r.enteredAt) : ''));
    if (r.energyValue != null && r.energyValue !== 0) metaBits.push('Energia: ' + _rdNum(r.energyValue) + ' ' + _rdEsc(_rdUnit(r.energyUnit || 'kWh')));
    if (r.invoiceItems && r.invoiceItems.length) {
      let vSum = 0, fSum = 0;
      r.invoiceItems.forEach(it => { const v = Number(it.value || 0); if ((it.costType || 'VARIABLE') === 'FIXED') fSum += v; else vSum += v; });
      let fv = 'FV netto — zmienne: ' + _rdNum(vSum, 2) + ' · stałe: ' + _rdNum(fSum, 2) + ' ' + _rdEsc(r.currency || '');
      const enBase = (r.energyValue != null && r.energyValue > 0) ? r.energyValue : null;
      if (enBase && vSum > 0) fv += ' · cena zmienna: ' + (vSum / enBase).toFixed(5) + ' ' + _rdEsc(r.currency || '') + '/' + _rdEsc(_rdUnit(r.energyUnit || 'kWh'));
      metaBits.push(fv);
    }
    if (r.note) metaBits.push('Uwagi: ' + _rdEsc(r.note));
    const meta = (metaBits.length || attHtml)
      ? `<tr><td colspan="7" style="padding:0 10px 8px;font-size:12px;color:var(--color-text-secondary);border-bottom:1px solid var(--color-border-tertiary);">${metaBits.join(' · ')}${attHtml ? '<br>' + attHtml : ''}</td></tr>`
      : '';
    const gross = r.costGross != null ? r.costGross : (r.costNet != null && r.vatRate != null ? r.costNet * (1 + r.vatRate / 100) : null);
    return `
      <tr>
        <td style="${td}color:var(--color-text-secondary);">${lpOf[r.id]}</td>
        <td style="${td}">${_rdDatePL(r.readingDate)}<div style="font-size:11px;color:var(--color-text-secondary);">${_rdDatePL(r.periodFrom)} – ${_rdDatePL(r.periodTo)}</div></td>
        <td style="${td}"><span style="background:${src.bg};color:${src.fg};border-radius:10px;padding:2px 8px;font-size:12px;white-space:nowrap;">${src.icon} ${src.label}</span></td>
        <td style="${td}text-align:right;">${_rdNum(r.value)} ${_rdEsc(_rdUnit(r.unit))}<div style="font-size:11px;color:var(--color-text-secondary);">${r.medium && RD_MEDIA[r.medium] ? RD_MEDIA[r.medium] + ' · ' : ''}${RD_VALUE_TYPES[r.valueType] || ''}</div></td>
        <td style="${td}text-align:right;">${gross != null ? '<b>' + _rdNum(gross, 2) + '</b> ' + _rdEsc(r.currency || '') : '—'}${r.costNet != null ? '<div style="font-size:11px;color:var(--color-text-secondary);">netto ' + _rdNum(r.costNet, 2) + '</div>' : ''}</td>
        <td style="${td}text-align:center;">${att.length ? '📎 ' + att.length : ''}</td>
        <td style="${td}text-align:right;white-space:nowrap;">
          ${canEdit ? `<button class="small-button" style="font-size:12px;padding:4px 8px;" onclick="_rdEdit(${r.id})">✏️</button>
          <button class="small-button" style="font-size:12px;padding:4px 8px;" onclick="_rdDelete(${r.id})">🗑️</button>` : ''}
        </td>
      </tr>${meta}`;
  }).join('');

  return filterBar + dupBar + `
    <div style="border:1px solid var(--color-border-tertiary);border-radius:10px;overflow:auto;">
      <table style="width:100%;border-collapse:collapse;min-width:640px;">
        <thead><tr>${(() => {
          const thS = (c, label, extra) => {
            const next = sort === c + '_asc' ? c + '_desc' : c + '_asc';
            const arrow = sort === c + '_asc' ? ' \u2191' : (sort === c + '_desc' ? ' \u2193' : '');
            return `<th style="${th}${extra || ''}cursor:pointer;" onclick="window._rdSort='${next}';renderReadingsModule(_rdLockClientId);">${label}${arrow}</th>`;
          };
          return thS('lp', 'L.p.') + thS('date', 'Data / okres') +
            `<th style="${th}">Źródło danych</th>` +
            thS('value', 'Wartość', 'text-align:right;') +
            `<th style="${th}text-align:right;">Koszt</th><th style="${th}text-align:center;">Pliki</th><th style="${th}"></th>`;
        })()}</tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>
    <p style="font-size:12px;color:var(--color-text-secondary);margin-top:8px;">Pomiarów: ${rows.length}${rows.length !== all.length ? ' (z ' + all.length + ' ogółem)' : ''}</p>
    ${_rdEscoSummaryHtml(all)}`;
}

// Podsumowanie kosztow zmiennych (podstawa oszczednosci ESCO) w przeliczeniu na jednostke
function _rdEscoSummaryHtml(all) {
  const toKWh = { kWh: 1, MWh: 1000, GJ: 277.7778 };
  const byCur = {};
  let used = 0;
  all.forEach(r => {
    const items = r.invoiceItems || [];
    if (!items.length) return;
    let vSum = 0, fSum = 0;
    items.forEach(it => {
      const v = Number(it.value || 0);
      if ((it.costType || 'VARIABLE') === 'FIXED') fSum += v; else vSum += v;
    });
    if (vSum <= 0) return;
    const cur = r.currency || '?';
    if (!byCur[cur]) byCur[cur] = { vSum: 0, fSum: 0, enKWh: 0, fuel: {} };
    const b = byCur[cur];
    b.vSum += vSum; b.fSum += fSum;
    used++;
    if (r.energyValue != null && r.energyValue > 0) {
      b.enKWh += Number(r.energyValue) * (toKWh[r.energyUnit || 'kWh'] || 1);
    } else if ((r.unit === 'kWh' || r.unit === 'MWh' || r.unit === 'GJ') &&
               (r.valueType === 'CONSUMPTION' || r.dataSource === 'INVOICE')) {
      b.enKWh += Number(r.value || 0) * toKWh[r.unit];
    }
    if (r.valueType === 'CONSUMPTION' || r.dataSource === 'INVOICE') {
      const u = _rdUnit(r.unit);
      b.fuel[u] = (b.fuel[u] || 0) + Number(r.value || 0);
    }
  });
  if (!used) return '';
  const lines = Object.keys(byCur).map(cur => {
    const b = byCur[cur];
    let l = '<b>' + _rdNum(b.vSum, 2) + ' ' + _rdEsc(cur) + '</b> kosztów zmiennych (stałe: ' + _rdNum(b.fSum, 2) + ')';
    if (b.enKWh > 0) l += ' &nbsp;·&nbsp; <b>' + (b.vSum / b.enKWh).toFixed(5) + ' ' + _rdEsc(cur) + '/kWh</b>';
    Object.keys(b.fuel).forEach(u => {
      if (b.fuel[u] > 0) l += ' &nbsp;·&nbsp; ' + (b.vSum / b.fuel[u]).toFixed(4) + ' ' + _rdEsc(cur) + '/' + _rdEsc(u) + ' (' + _rdNum(b.fuel[u]) + ' ' + _rdEsc(u) + ')';
    });
    return '<div style="margin-top:4px;">' + l + '</div>';
  }).join('');
  return `
    <div style="border:1px solid #BBD9A9;background:#F2F8EC;border-radius:10px;padding:12px 16px;margin-top:12px;">
      <div style="font-size:12px;font-weight:700;letter-spacing:.5px;color:#27500A;margin-bottom:4px;">📊 PODSUMOWANIE ESCO — KOSZTY ZMIENNE (te, na które mamy wpływ)</div>
      <div style="font-size:13px;color:#27500A;">${lines}</div>
      <div style="font-size:11px;color:#27500A;opacity:.75;margin-top:6px;">Na podstawie ${used} pomiarów z rozbiciem pozycji FV. Cena za jednostkę = suma pozycji zmiennych ÷ energia / paliwo z tych pomiarów.</div>
    </div>`;
}

// ── 6. FORMULARZ POJEDYNCZY ──────────────────────────────────────────────────

function _rdSingleFormHtml(obj) {
  const editing = _rdEditingId ? ReadingsModule.find(_rdEditingId) : null;
  const r = editing || {};
  const p = _rdProfile();
  const today = new Date().toISOString().slice(0, 10);
  const defUnit = r.unit || obj.energyUnit || 'GJ';
  const defCur = r.currency || obj.currency || 'PLN';
  const isClientRole = !_rdIsInternal();
  const defSource = r.dataSource || (isClientRole ? 'CLIENT' : 'METER');
  const defPerformed = r.performedBy != null ? r.performedBy : (isClientRole && p ? (p.full_name || '') : '');
  const enteredName = editing ? (r.enteredByName || '—') : ((p && (p.full_name || '')) || 'bieżący użytkownik');
  const sb = _rdSb();

  if (editing) _rdKeepAtt = (r.attachments || []).slice();
  if (editing) _rdItems = (r.invoiceItems || []).slice();
  if (editing && (r.note || r.energyValue != null || r.valueType === 'READING')) window._rdDetailsOpen = true;

  const performedHints = [];
  ReadingsModule.findByObject(obj.id).forEach(x => { if (x.performedBy && performedHints.indexOf(x.performedBy) === -1) performedHints.push(x.performedBy); });
  if (typeof UsersModule !== 'undefined') { try { UsersModule.getAll().forEach(u => { const n = u.name || u.fullName || u.email; if (n && performedHints.indexOf(n) === -1) performedHints.push(n); }); } catch (e) {} }

  const lbl = 'display:block;font-size:12px;color:var(--color-text-secondary);margin-bottom:4px;';
  const inp = 'width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid var(--color-border-tertiary);border-radius:8px;font-size:13px;';
  const grid3 = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:12px;';

  return `
  <div style="border:1px solid var(--color-border-tertiary);border-radius:12px;padding:16px;margin-bottom:20px;background:var(--color-background-primary);">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <b style="font-size:15px;">${editing ? 'Edycja pomiaru' : 'Nowy pomiar'}</b>
      <button class="small-button" onclick="_rdCancel()">✕ Zamknij</button>
    </div>

    <div style="font-size:11px;font-weight:700;letter-spacing:.5px;color:var(--color-text-secondary);margin:2px 0 8px;">🧾 DANE Z FAKTURY / ODCZYTU</div>
    <div style="background:var(--color-background-secondary);border:1px solid var(--color-border-tertiary);border-radius:10px;padding:12px 12px 0;margin-bottom:14px;">
    <div style="${grid3}">
      <div><label style="${lbl}">Medium</label>
        <select id="rd-medium" style="${inp}" onchange="_rdMediumChanged(this.value)">${Object.keys(RD_MEDIA).map(k => `<option value="${k}" ${(r.medium || 'HEAT') === k ? 'selected' : ''}>${RD_MEDIA[k]}</option>`).join('')}</select></div>
      <div><label style="${lbl}">Data odczytu</label><input id="rd-date" type="date" value="${r.readingDate || today}" style="${inp}"></div>
      <div><label style="${lbl}">Okres od</label><input id="rd-from" type="date" value="${r.periodFrom || ''}" style="${inp}"></div>
      <div><label style="${lbl}">Okres do</label><input id="rd-to" type="date" value="${r.periodTo || ''}" style="${inp}"></div>
    </div>
    <div style="${grid3}">
      <div><label style="${lbl}">Źródło danych</label>
        <select id="rd-source" style="${inp}">${Object.keys(RD_SOURCES).map(k => `<option value="${k}" ${defSource === k ? 'selected' : ''}>${RD_SOURCES[k].label}</option>`).join('')}</select></div>
      <div><label style="${lbl}">Waluta</label>
        <select id="rd-currency" style="${inp}" onchange="_rdRenderItems()">${RD_CURRENCIES.map(c => `<option value="${c}" ${defCur === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
      <div><label style="${lbl}">Nr faktury</label>
        <input id="rd-invno" type="text" value="${_rdEsc(r.invoiceNumber || '')}" placeholder="np. 034015/2025" style="${inp}"></div>
      <div><label style="${lbl}">Dostawca</label>
        <input id="rd-supplier" type="text" value="${_rdEsc(r.supplier || '')}" placeholder="np. LPEC / Veolia / Energie2" style="${inp}"></div>
    </div>
    </div>

    <div id="rd-gas-block" style="display:${(r.medium || 'HEAT') === 'GAS' ? 'block' : 'none'};border:1px solid #F0C987;background:#FDF6E9;border-radius:10px;padding:12px;margin-bottom:14px;">
      <div style="font-size:12px;font-weight:700;color:#854F0B;margin-bottom:8px;">🔥 Przelicznik gazu m³ → kWh</div>
      <div style="display:flex;align-items:flex-end;gap:10px;flex-wrap:wrap;">
        <div><label style="${lbl}color:#854F0B;">Zużycie z licznika [m³]</label>
          <input id="rd-gas-m3" type="number" step="any" value="${r.gasMeterM3 != null ? r.gasMeterM3 : ''}" style="${inp}width:130px;text-align:right;" oninput="_rdGasCalc()"></div>
        <span style="padding-bottom:9px;color:#854F0B;">×</span>
        <div><label style="${lbl}color:#854F0B;">Współczynnik [kWh/m³]</label>
          <input id="rd-gas-factor" type="number" step="any" value="${r.gasFactor != null ? r.gasFactor : ''}" style="${inp}width:120px;text-align:right;" oninput="_rdGasCalc()"></div>
        <span style="padding-bottom:9px;color:#854F0B;">=</span>
        <div><label style="${lbl}color:#854F0B;">Energia [kWh]</label>
          <input id="rd-gas-kwh" type="text" disabled style="${inp}width:130px;text-align:right;background:var(--color-background-secondary);"></div>
        <button class="small-button" style="font-size:12px;margin-bottom:1px;" onclick="_rdGasApply()">Wstaw ilość do pozycji kWh</button>
      </div>
    </div>

    <div style="font-size:11px;font-weight:700;letter-spacing:.5px;color:var(--color-text-secondary);margin:2px 0 8px;">💰 ROZPISANE KOSZTY NETTO — co za co idzie</div>
    <div style="border:1px solid var(--color-border-tertiary);border-radius:10px;padding:12px;margin-bottom:14px;">
      <div id="rd-items"></div>
      <button class="small-button" style="font-size:12px;margin-top:4px;" onclick="_rdAddItem()">+ Dodaj pozycję</button>
      <div id="rd-items-sum" style="margin-top:10px;"></div>
      <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;font-size:13px;color:var(--color-text-secondary);border:1px solid var(--color-border-tertiary);border-radius:8px;padding:8px 12px;margin-top:10px;">
        <span>VAT <input id="rd-vat" type="number" step="any" value="${r.vatRate != null ? r.vatRate : '23'}" style="${inp}width:60px;display:inline-block;text-align:right;padding:4px 6px;" oninput="_rdItemsSum()"> %</span>
        <span>·</span>
        <span>Z brutto: <b id="rd-b-z" style="color:var(--color-text-primary);">—</b></span>
        <span>S brutto: <b id="rd-b-s" style="color:var(--color-text-primary);">—</b></span>
        <span>Razem brutto: <b id="rd-b-t" style="color:var(--color-text-primary);">—</b></span>
      </div>
    </div>

    <div style="border-top:1px solid var(--color-border-tertiary);padding-top:12px;margin-bottom:12px;">
      <b style="font-size:13px;">Szczegóły</b>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-top:8px;">
        <div><label style="${lbl}">Wprowadził do systemu (automatycznie)</label>
          <input type="text" value="${_rdEsc(enteredName)}" style="${inp}background:var(--color-background-secondary);" disabled></div>
        <div><label style="${lbl}">Odczytu dokonał (dowolny wpis)</label>
          <input id="rd-performed" type="text" list="rd-who" value="${_rdEsc(defPerformed)}" placeholder="np. p. Novák — konserwator" style="${inp}">
          <datalist id="rd-who">${performedHints.map(h => `<option value="${_rdEsc(h)}">`).join('')}</datalist></div>
      </div>
    </div>

    <div style="border-top:1px solid var(--color-border-tertiary);padding-top:12px;margin-bottom:12px;">
      <b style="font-size:13px;">Opis kosztów</b>
      <textarea id="rd-note" style="${inp}height:72px;margin-top:8px;" placeholder="np. rozliczenie 01–17.03 wg licznika; od 18.03 nowa taryfa; korekta K/413/24 uwzględniona">${_rdEsc(r.note || '')}</textarea>
    </div>

    <div style="border-top:1px solid var(--color-border-tertiary);padding-top:12px;margin-bottom:12px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <b style="font-size:13px;">📎 Załączniki</b>
        <span style="font-size:12px;color:var(--color-text-secondary);">(faktura PDF, zrzut z aplikacji, zdjęcie licznika — można kilka)</span>
      </div>
      ${sb
        ? `<input id="rd-files" type="file" multiple onchange="_rdFilesChosen(this)" style="font-size:13px;margin-bottom:8px;">
           <div id="rd-file-chips" style="display:flex;gap:8px;flex-wrap:wrap;"></div>`
        : `<p style="font-size:12px;color:var(--color-text-secondary);margin:0;">Załączniki wymagają połączenia ze wspólną bazą (Supabase). W trybie lokalnym są wyłączone.</p>`}
    </div>

    <div style="display:flex;gap:10px;justify-content:flex-end;">
      <button class="small-button" onclick="_rdCancel()">Anuluj</button>
      <button class="primary-button" id="rd-save-btn" onclick="_rdSaveSingle()">${editing ? 'Zapisz zmiany' : 'Zapisz pomiar'}</button>
    </div>
  </div>`;
}

function _rdMediumChanged(v) {
  const gb = document.getElementById('rd-gas-block');
  if (gb) gb.style.display = v === 'GAS' ? 'block' : 'none';
}

// ── 6d. Przelicznik gazu m³ → kWh ────────────────────────────────────────────

function _rdGasCalc() {
  const m3 = parseFloat((document.getElementById('rd-gas-m3') || {}).value);
  const f = parseFloat((document.getElementById('rd-gas-factor') || {}).value);
  const out = document.getElementById('rd-gas-kwh');
  if (!out) return;
  out.value = (!isNaN(m3) && !isNaN(f) && m3 > 0 && f > 0) ? _rdNum(m3 * f, 0) : '';
}

function _rdGasApply() {
  const m3 = parseFloat((document.getElementById('rd-gas-m3') || {}).value);
  const f = parseFloat((document.getElementById('rd-gas-factor') || {}).value);
  if (isNaN(m3) || isNaN(f) || m3 <= 0 || f <= 0) { alert('Podaj zużycie z licznika [m³] i współczynnik [kWh/m³].'); return; }
  const energy = Math.round(m3 * f);
  let touched = 0;
  _rdItems.forEach(it => {
    if (it.unit === 'kWh') {
      it.qty = energy;
      const q = parseFloat(it.qty), c = parseFloat(it.unitPrice);
      if (!isNaN(q) && !isNaN(c)) it.value = (q * c).toFixed(2);
      touched++;
    }
  });
  if (!touched) { alert('Brak pozycji z jednostką kWh — najpierw dodaj pozycje, potem wstaw ilość.'); return; }
  _rdRenderItems();
}

// ── 6a. Pozycje z faktury ────────────────────────────────────────────────────

function _rdAddItem() {
  _rdItems.push({ name: RD_FV_TEMPLATES[0], ctype: RD_FV_DEFAULT_TYPE[RD_FV_TEMPLATES[0]] || 'VARIABLE', customName: '', qty: '', unit: '', unitPrice: '', value: '' });
  _rdRenderItems();
}
function _rdRemoveItem(i) { _rdItems.splice(i, 1); _rdRenderItems(); }
function _rdItemChange(i, field, v) {
  _rdItems[i][field] = v;
  if (field === 'name') {
    _rdItems[i].ctype = RD_FV_DEFAULT_TYPE[v] || 'VARIABLE';
    const sel = document.getElementById('rd-item-ctype-' + i);
    if (sel) sel.value = _rdItems[i].ctype;
  }
  if (field === 'unit') {
    const pu = document.getElementById('rd-item-pu-' + i);
    const curEl = document.getElementById('rd-currency');
    if (pu) pu.textContent = v ? (curEl ? curEl.value : 'PLN') + '/' + _rdUnit(v) : '';
  }
  if (field === 'qty' || field === 'unitPrice') {
    const q = parseFloat(_rdItems[i].qty), c = parseFloat(_rdItems[i].unitPrice);
    if (!isNaN(q) && !isNaN(c)) {
      _rdItems[i].value = (q * c).toFixed(2);
      const el = document.getElementById('rd-item-val-' + i);
      if (el) el.value = _rdItems[i].value;
    }
  }
  _rdItemsSum();
}
function _rdItemsSum() {
  let sum = 0, varSum = 0, fixSum = 0, any = false;
  _rdItems.forEach(it => {
    const v = parseFloat(it.value);
    if (!isNaN(v)) {
      sum += v; any = true;
      if ((it.ctype || 'VARIABLE') === 'FIXED') fixSum += v; else varSum += v;
    }
  });
  const curEl = document.getElementById('rd-currency');
  const cur = curEl ? curEl.value : 'PLN';
  const el = document.getElementById('rd-items-sum');
  if (el) {
    if (!any) { el.innerHTML = ''; }
    else {
      const chip = (label, val, strong) =>
        '<div style="background:var(--color-background-secondary);border:1px solid var(--color-border-tertiary);border-radius:8px;padding:8px 12px;">' +
        '<div style="font-size:11px;color:var(--color-text-secondary);">' + label + '</div>' +
        '<div style="font-size:16px;font-weight:700;' + (strong ? 'color:#27500A;' : '') + '">' + val + '</div></div>';
      el.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;">' +
        chip('Koszt zmienny (Z) netto', _rdNum(varSum, 2) + ' ' + _rdEsc(cur), true) +
        chip('Koszt stały (S) netto', _rdNum(fixSum, 2) + ' ' + _rdEsc(cur)) +
        chip('Razem netto', _rdNum(sum, 2) + ' ' + _rdEsc(cur)) +
        '</div>';
    }
  }
  const vat = parseFloat((document.getElementById('rd-vat') || {}).value);
  const set = (id, txt) => { const e = document.getElementById(id); if (e) e.textContent = txt; };
  if (any && !isNaN(vat)) {
    const f = x => _rdNum(x * (1 + vat / 100), 2) + ' ' + cur;
    set('rd-b-z', f(varSum)); set('rd-b-s', f(fixSum)); set('rd-b-t', f(sum));
  } else {
    set('rd-b-z', '—'); set('rd-b-s', '—'); set('rd-b-t', '—');
  }
}
function _rdRenderItems() {
  const box = document.getElementById('rd-items');
  if (!box) return;
  const curEl = document.getElementById('rd-currency');
  const cur = curEl ? curEl.value : 'PLN';
  const inp = 'box-sizing:border-box;padding:6px 8px;border:1px solid var(--color-border-tertiary);border-radius:6px;font-size:12px;';
  const cols = 'display:grid;grid-template-columns:minmax(120px,2fr) 78px 72px 82px 72px 88px 76px 26px;gap:6px;align-items:center;';
  const hd = 'font-size:11px;color:var(--color-text-secondary);font-weight:600;';
  const head = _rdItems.length ? `
    <div style="${cols}margin-bottom:4px;">
      <span style="${hd}">Pozycja</span><span style="${hd}text-align:right;">Ilość</span><span style="${hd}">Jednostka</span>
      <span style="${hd}text-align:right;">Cena</span><span style="${hd}">Jedn. ceny</span><span style="${hd}text-align:right;">Wartość</span>
      <span style="${hd}">Typ</span><span></span>
    </div>` : '';
  box.innerHTML = head + _rdItems.map((it, i) => {
    const known = !it.unit || RD_ITEM_UNITS.indexOf(it.unit) >= 0;
    const unitList = known ? RD_ITEM_UNITS : [it.unit].concat(RD_ITEM_UNITS);
    const unitOpts = '<option value="">—</option>' + unitList.map(u => `<option value="${_rdEsc(u)}" ${it.unit === u ? 'selected' : ''}>${_rdEsc(_rdUnit(u))}</option>`).join('');
    return `
    <div style="${cols}margin-bottom:6px;">
      <span style="display:flex;flex-direction:column;gap:4px;">
        <select style="${inp}width:100%;" onchange="_rdItemChange(${i},'name',this.value)">
          ${RD_FV_TEMPLATES.map(t => `<option value="${_rdEsc(t)}" ${it.name === t ? 'selected' : ''}>${_rdEsc(t)}</option>`).join('')}
        </select>
        ${it.name === 'Inna pozycja' ? `<input type="text" placeholder="własna nazwa" value="${_rdEsc(it.customName || '')}" style="${inp}width:100%;" oninput="_rdItemChange(${i},'customName',this.value)">` : ''}
      </span>
      <input type="number" step="any" placeholder="ilość" value="${it.qty}" style="${inp}text-align:right;" oninput="_rdItemChange(${i},'qty',this.value)">
      <select style="${inp}" onchange="_rdItemChange(${i},'unit',this.value)">${unitOpts}</select>
      <input type="number" step="any" placeholder="cena" value="${it.unitPrice}" style="${inp}text-align:right;" oninput="_rdItemChange(${i},'unitPrice',this.value)">
      <span id="rd-item-pu-${i}" style="font-size:11px;color:var(--color-text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${it.unit ? _rdEsc(cur + '/' + _rdUnit(it.unit)) : ''}</span>
      <input id="rd-item-val-${i}" type="number" step="any" placeholder="wartość" value="${it.value}" style="${inp}text-align:right;" oninput="_rdItemChange(${i},'value',this.value)">
      <select id="rd-item-ctype-${i}" style="${inp}" title="Zmienna: zależy od zużycia (podstawa oszczędności ESCO). Stała: niezależna od zużycia." onchange="_rdItemChange(${i},'ctype',this.value)">
        <option value="VARIABLE" ${(it.ctype||'VARIABLE')==='VARIABLE'?'selected':''}>Z</option>
        <option value="FIXED" ${it.ctype==='FIXED'?'selected':''}>S</option>
      </select>
      <button class="small-button" style="font-size:12px;padding:4px 6px;" onclick="_rdRemoveItem(${i})">✕</button>
    </div>`;}).join('');
  _rdItemsSum();
}

// ── 6b. Załączniki ───────────────────────────────────────────────────────────

function _rdFilesChosen(input) {
  for (const f of input.files) _rdFiles.push(f);
  input.value = '';
  _rdRenderFileChips();
}
function _rdRemovePending(i) { _rdFiles.splice(i, 1); _rdRenderFileChips(); }
function _rdRemoveExisting(i) { _rdKeepAtt.splice(i, 1); _rdRenderFileChips(); }
function _rdRenderFileChips() {
  const box = document.getElementById('rd-file-chips');
  if (!box) return;
  const chip = 'display:inline-flex;align-items:center;gap:6px;background:var(--color-background-secondary);border:1px solid var(--color-border-tertiary);border-radius:10px;padding:4px 10px;font-size:12px;';
  const kb = n => n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
  box.innerHTML =
    _rdKeepAtt.map((a, i) => `<span style="${chip}">📎 ${_rdEsc(a.name)} <a href="#" onclick="_rdRemoveExisting(${i});return false;" style="color:var(--color-text-secondary);text-decoration:none;">✕</a></span>`).join('') +
    _rdFiles.map((f, i) => `<span style="${chip}">🆕 ${_rdEsc(f.name)} <span style="color:var(--color-text-secondary);">${kb(f.size)}</span> <a href="#" onclick="_rdRemovePending(${i});return false;" style="color:var(--color-text-secondary);text-decoration:none;">✕</a></span>`).join('');
}

async function _rdUploadPending(objectId, readingId) {
  const sb = _rdSb();
  const uploaded = [];
  if (!sb || _rdFiles.length === 0) return uploaded;
  for (const f of _rdFiles) {
    const safe = f.name.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(-80);
    const path = objectId + '/' + readingId + '/' + Date.now() + '_' + safe;
    const { error } = await sb.storage.from(RD_BUCKET).upload(path, f, { upsert: false });
    if (error) throw new Error('„' + f.name + '": ' + error.message);
    uploaded.push({ name: f.name, path: path, size: f.size, type: f.type || '' });
  }
  return uploaded;
}

async function _rdOpenAttachment(path) {
  const sb = _rdSb();
  if (!sb) { alert('Podgląd załączników wymaga połączenia z bazą (Supabase).'); return; }
  const { data, error } = await sb.storage.from(RD_BUCKET).createSignedUrl(path, 600);
  if (error || !data || !data.signedUrl) { alert('Nie udało się otworzyć pliku: ' + (error ? error.message : 'brak adresu')); return; }
  window.open(data.signedUrl, '_blank');
}

// ── 6c. Zapis pojedynczy ─────────────────────────────────────────────────────

async function _rdSaveSingle() {
  const g = id => document.getElementById(id);
  const obj = ObjectsModule.find(_rdObjectId);
  if (!obj) return;
  const editingRec = _rdEditingId ? (ReadingsModule.find(_rdEditingId) || {}) : {};

  const readingDate = g('rd-date').value;
  const periodFrom = g('rd-from').value;
  const periodTo = g('rd-to').value;
  if (!readingDate || !periodFrom || !periodTo) { alert('Uzupełnij datę odczytu oraz okres od–do.'); return; }
  if (periodTo < periodFrom) { alert('„Okres do" jest wcześniejszy niż „okres od".'); return; }

  const p = _rdProfile();
  const cleanItems = _rdItems
    .filter(it => it.qty !== '' || it.value !== '' || it.customName)
    .map(it => ({ name: it.name === 'Inna pozycja' && it.customName ? it.customName : it.name, costType: it.ctype || 'VARIABLE', qty: it.qty === '' ? null : Number(it.qty), unit: it.unit || '', unitPrice: it.unitPrice === '' ? null : Number(it.unitPrice), value: it.value === '' ? null : Number(it.value) }));

  // Zużycie: największa ilość wśród pozycji Z w jednostce energii/paliwa;
  // dla gazu awaryjnie energia z przelicznika m³ × współczynnik.
  let cons = 0, consUnit = '';
  cleanItems.forEach(it => {
    if (it.costType !== 'FIXED' && it.qty != null && RD_FUEL_UNITS.indexOf(it.unit) >= 0 && Number(it.qty) > cons) {
      cons = Number(it.qty); consUnit = it.unit;
    }
  });
  const gasM3 = g('rd-gas-m3') ? parseFloat(g('rd-gas-m3').value) : NaN;
  const gasFactor = g('rd-gas-factor') ? parseFloat(g('rd-gas-factor').value) : NaN;
  if (!cons && !isNaN(gasM3) && !isNaN(gasFactor) && gasM3 > 0 && gasFactor > 0) {
    cons = Math.round(gasM3 * gasFactor); consUnit = 'kWh';
  }
  if (!cons) { alert('Dodaj przynajmniej jedną pozycję zmienną (Z) z ilością w jednostce energii lub paliwa (kWh, MWh, GJ, m³, t) — z niej liczone jest zużycie.'); return; }

  let sum = 0, varSum = 0;
  cleanItems.forEach(it => { const v = Number(it.value || 0); sum += v; if (it.costType !== 'FIXED') varSum += v; });
  const vat = g('rd-vat') ? parseFloat(g('rd-vat').value) : NaN;

  const rec = {
    clientId: _rdClientId,
    objectId: _rdObjectId,
    readingDate, periodFrom, periodTo,
    dataSource: g('rd-source').value,
    valueType: editingRec.valueType || 'CONSUMPTION',
    value: cons,
    unit: consUnit || obj.energyUnit || 'GJ',
    medium: g('rd-medium').value,
    invoiceNumber: g('rd-invno').value.trim(),
    supplier: g('rd-supplier').value.trim(),
    gasMeterM3: isNaN(gasM3) ? null : gasM3,
    gasFactor: isNaN(gasFactor) ? null : gasFactor,
    energyValue: editingRec.energyValue != null ? editingRec.energyValue : null,
    energyUnit: editingRec.energyUnit || 'kWh',
    costNet: sum > 0 ? Number(sum.toFixed(2)) : null,
    vatRate: isNaN(vat) ? null : vat,
    costGross: (sum > 0 && !isNaN(vat)) ? Number((sum * (1 + vat / 100)).toFixed(2)) : null,
    unitCost: (varSum > 0 && cons > 0) ? Number((varSum / cons).toFixed(5)) : null,
    currency: g('rd-currency').value,
    invoiceItems: cleanItems,
    performedBy: g('rd-performed').value.trim(),
    note: g('rd-note').value.trim()
  };

  const btn = g('rd-save-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Zapisywanie…'; }

  const recId = _rdEditingId || Date.now();
  let attachments = _rdKeepAtt.slice();
  try {
    const uploaded = await _rdUploadPending(_rdObjectId, recId);
    attachments = attachments.concat(uploaded);
  } catch (e) {
    alert('Nie udało się wgrać załącznika: ' + (e.message || e) + '\nPomiar zostanie zapisany bez tego pliku.');
  }
  rec.attachments = attachments;

  if (_rdEditingId) {
    ReadingsModule.update(_rdEditingId, rec);
  } else {
    rec.id = recId;
    rec.enteredById = p ? p.id : null;
    rec.enteredByName = p ? (p.full_name || '') : '';
    rec.enteredAt = new Date().toISOString();
    ReadingsModule.add(rec);
  }
  _rdCancel();
}

function _rdEdit(id) {
  _rdEditingId = Number(id);
  _rdMode = 'single';
  _rdFiles = [];
  const r = ReadingsModule.find(id);
  _rdItems = r && r.invoiceItems ? r.invoiceItems.map(it => ({ name: RD_FV_TEMPLATES.indexOf(it.name) >= 0 ? it.name : 'Inna pozycja', customName: RD_FV_TEMPLATES.indexOf(it.name) >= 0 ? '' : it.name, ctype: it.costType || RD_FV_DEFAULT_TYPE[it.name] || 'VARIABLE', qty: it.qty != null ? it.qty : '', unit: it.unit || '', unitPrice: it.unitPrice != null ? it.unitPrice : '', value: it.value != null ? it.value : '' })) : [];
  renderReadingsModule(_rdLockClientId);
}

function _rdWipeObject() {
  const obj = ObjectsModule.find(_rdObjectId);
  const mine = ReadingsModule.findByObject(_rdObjectId);
  if (!mine.length) { alert('Ten obiekt nie ma pomiarów.'); return; }
  if (!confirm('Usunąć WSZYSTKIE pomiary obiektu „' + (obj ? obj.name : '') + '" (' + mine.length + ' szt.)?')) return;
  if (!confirm('Na pewno? To skasuje ' + mine.length + ' pomiarów również ze wspólnej bazy. Operacji nie można cofnąć.')) return;
  const keep = ReadingsModule.getAll().filter(r => String(r.objectId) !== String(_rdObjectId));
  ReadingsModule.saveAll(keep);
  renderReadingsModule(_rdLockClientId);
}

function _rdDedupe() {
  const all = ReadingsModule.getAll();
  const seen = {};
  const keep = [];
  let removed = 0;
  all.slice().sort((a, b) => Number(a.id) - Number(b.id)).forEach(r => {
    const key = [r.objectId, r.periodFrom, r.periodTo, Number(r.value || 0)].join('|');
    if (seen[key]) { removed++; return; }
    seen[key] = true; keep.push(r);
  });
  if (!removed) { alert('Nie znaleziono duplikatów.'); return; }
  if (!confirm('Znaleziono ' + removed + ' zduplikowanych pomiarów (ten sam obiekt, okres i wartość — we wszystkich obiektach). Zostawić po jednym i usunąć resztę?')) return;
  ReadingsModule.saveAll(keep);
  alert('Usunięto ' + removed + ' duplikatów. Pozostało ' + keep.length + ' pomiarów.');
  renderReadingsModule(_rdLockClientId);
}

function _rdDelete(id) {
  const r = ReadingsModule.find(id);
  if (!r) return;
  if (!confirm('Usunąć pomiar z okresu ' + _rdDatePL(r.periodFrom) + ' – ' + _rdDatePL(r.periodTo) + '?')) return;
  ReadingsModule.remove(id);
  renderReadingsModule(_rdLockClientId);
}

// ── 7. WPIS SERYJNY ──────────────────────────────────────────────────────────

function _rdSerialFormHtml(obj) {
  const lbl = 'display:block;font-size:12px;color:var(--color-text-secondary);margin-bottom:4px;';
  const inp = 'width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid var(--color-border-tertiary);border-radius:8px;font-size:13px;';
  const isClientRole = !_rdIsInternal();
  return `
  <div style="border:1px solid var(--color-border-tertiary);border-radius:12px;padding:16px;margin-bottom:20px;background:var(--color-background-primary);">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
      <b style="font-size:15px;">Wpis seryjny — wklej listę miesięcy</b>
      <button class="small-button" onclick="_rdCancel()">✕ Zamknij</button>
    </div>
    <p style="font-size:13px;color:var(--color-text-secondary);margin:0 0 10px;"><b>Wskazania licznika (kumulaty):</b> <code>DD.MM.RRRR – wartość</code> — dowolne daty (miesięczne lub dobowe), zużycie liczone jako różnica wskazań. <b>Zużycie miesięczne:</b> <code>MM/RR – wartość</code>. Tolerowane: przecinek PL, jednostka (kWh/GJ…), wiodący „+”, kumulata w nawiasie.</p>
    <textarea id="rd-serial-text" style="${inp}height:110px;font-family:monospace;font-size:12px;" placeholder="22.04.2026 – 11076,9&#10;23.04.2026 – 11185,447&#10;24.04.2026 – 11247,834"></textarea>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin:10px 0;">
      <div><label style="${lbl}">Źródło dla wszystkich</label>
        <select id="rd-serial-source" style="${inp}">${Object.keys(RD_SOURCES).map(k => `<option value="${k}" ${(isClientRole ? 'CLIENT' : 'CLIENT') === k ? 'selected' : ''}>${RD_SOURCES[k].label}</option>`).join('')}</select></div>
      <div><label style="${lbl}">Jednostka</label>
        <select id="rd-serial-unit" style="${inp}">${RD_UNITS.map(u => `<option value="${u}" ${(obj.energyUnit || 'GJ') === u ? 'selected' : ''}>${_rdUnit(u)}</option>`).join('')}</select></div>
      <div><label style="${lbl}">Odczytu dokonał</label>
        <input id="rd-serial-performed" type="text" placeholder="np. klient — zestawienie własne" style="${inp}"></div>
    </div>
    <button class="small-button" style="font-size:13px;" onclick="_rdParseSerial()">Podgląd wierszy</button>
    <div id="rd-serial-preview" style="margin-top:10px;"></div>
  </div>`;
}

function _rdParseSerial() {
  const unit = document.getElementById('rd-serial-unit').value;
  const source = document.getElementById('rd-serial-source').value;
  const text = document.getElementById('rd-serial-text').value;
  const lines = text.split('\n').map(s => s.trim()).filter(Boolean);
  const existing = ReadingsModule.findByObject(_rdObjectId);
  const seen = {};
  const rows = [];

  function cleanNum(s) {
    if (s == null) return NaN;
    s = String(s).replace(/kwh|mwh|gj|gcal|m3|m\u00b3/ig, '').replace(/\+/g, '')
                 .replace(/\s/g, '').replace(',', '.').replace(/[^0-9.\-]/g, '');
    return s === '' ? NaN : parseFloat(s);
  }
  // Dla wskazań: kumulata w nawiasie jest właściwym odczytem; inaczej liczba przed nawiasem.
  function parseVal(raw, preferParen) {
    const pm = raw.match(/\(([^)]*)\)/);
    const inner = pm ? cleanNum(pm[1]) : NaN;
    const outer = cleanNum(raw.replace(/\([^)]*\)/, ''));
    if (preferParen && !isNaN(inner)) return inner;
    if (!isNaN(outer)) return outer;
    return inner;
  }
  function validDate(d, m, y) {
    if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1) return false;
    return d <= new Date(y, m, 0).getDate();
  }

  lines.forEach(line => {
    // 1) WSKAZANIE LICZNIKA — DD.MM.RRRR – wartość (kumulata)
    let m = line.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})(?!\d)\s*[\u2013\u2014:\-]?\s*(.+)$/);
    if (m) {
      let d = Number(m[1]), mo = Number(m[2]), y = Number(m[3]);
      if (y < 100) y += 2000;
      if (!validDate(d, mo, y)) { rows.push({ raw: line, ok: false, msg: 'błędna data' }); return; }
      const value = parseVal(m[4], true);
      if (isNaN(value)) { rows.push({ raw: line, ok: false, msg: 'nie umiem odczytać wartości' }); return; }
      const iso = y + '-' + String(mo).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      let ok = true, msg = 'OK';
      const key = 'R|' + iso;
      if (seen[key]) { ok = false; msg = 'duplikat daty na liście'; }
      else if (existing.some(x => x.valueType === 'READING' && x.dataSource === source && x.unit === unit && String(x.readingDate || '').slice(0, 10) === iso)) { ok = false; msg = 'wskazanie z tej daty już jest w bazie'; }
      seen[key] = true;
      rows.push({ raw: line, ok, msg, kind: 'READING', iso, value, from: iso, to: iso });
      return;
    }
    // 2) ZUŻYCIE MIESIĘCZNE — MM/RR – wartość
    m = line.match(/^(\d{1,2})\s*[\/.\-]\s*(\d{2,4})\s*[\u2013\u2014:\-]\s*(.+)$/);
    if (m) {
      const month = Number(m[1]);
      let year = Number(m[2]); if (year < 100) year += 2000;
      const value = parseVal(m[3], false);
      if (month < 1 || month > 12) { rows.push({ raw: line, ok: false, msg: 'miesiąc poza zakresem 1–12' }); return; }
      if (isNaN(value)) { rows.push({ raw: line, ok: false, msg: 'nie umiem odczytać wartości' }); return; }
      const b = _rdMonthBounds(year, month);
      const key = 'C|' + year + '-' + String(month).padStart(2, '0');
      let ok = true, msg = 'OK';
      if (seen[key]) { ok = false; msg = 'duplikat ' + String(month).padStart(2, '0') + '/' + String(year).slice(-2) + ' na liście'; }
      else if (existing.some(x => x.periodFrom === b.from && x.periodTo === b.to && x.valueType === 'CONSUMPTION')) { ok = false; msg = 'ten miesiąc już jest w bazie'; }
      seen[key] = true;
      rows.push({ raw: line, ok, msg, kind: 'CONSUMPTION', from: b.from, to: b.to, value });
      return;
    }
    rows.push({ raw: line, ok: false, msg: 'nierozpoznany format' });
  });

  // 3) KONTROLA MONOTONICZNOŚCI wskazań (kumulaty nie mogą maleć w serii źródło+jednostka)
  const series = existing.filter(x => x.valueType === 'READING' && x.dataSource === source && x.unit === unit)
    .map(x => ({ iso: String(x.readingDate || '').slice(0, 10), value: Number(x.value || 0), old: true }))
    .concat(rows.filter(r => r.ok && r.kind === 'READING').map(r => ({ iso: r.iso, value: r.value, old: false })))
    .sort((a, b) => a.iso.localeCompare(b.iso));
  for (let i = 1; i < series.length; i++) {
    if (series[i].value < series[i - 1].value) {
      rows.forEach(r => { if (r.ok && r.kind === 'READING' && r.iso === series[i].iso) { r.ok = false; r.msg = 'wskazanie spada względem wcześniejszego — inny licznik lub błędna data?'; } });
    }
  }

  window._rdSerialRows = rows;
  const okCount = rows.filter(r => r.ok).length;

  const box = document.getElementById('rd-serial-preview');
  if (!rows.length) { box.innerHTML = '<p style="font-size:13px;color:var(--color-text-secondary);">Wklej listę powyżej i kliknij „Podgląd wierszy".</p>'; return; }

  const badge = (ok, msg) => ok
    ? '<span style="background:#EAF3DE;color:#27500A;border-radius:10px;padding:2px 8px;font-size:12px;">✓ OK</span>'
    : '<span style="background:#FAEEDA;color:#633806;border-radius:10px;padding:2px 8px;font-size:12px;">⚠ ' + _rdEsc(msg) + '</span>';

  box.innerHTML = `
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead><tr style="color:var(--color-text-secondary);text-align:left;">
        <th style="padding:5px 8px;font-weight:600;font-size:11px;border-bottom:2px solid var(--color-border-tertiary);">Data / okres</th>
        <th style="padding:5px 8px;font-weight:600;font-size:11px;text-align:right;border-bottom:2px solid var(--color-border-tertiary);">Wartość (${_rdEsc(_rdUnit(unit))})</th>
        <th style="padding:5px 8px;font-weight:600;font-size:11px;border-bottom:2px solid var(--color-border-tertiary);">Status</th>
      </tr></thead>
      <tbody>${rows.map(r => `
        <tr>
          <td style="padding:5px 8px;border-bottom:1px solid var(--color-border-tertiary);">${r.kind === 'READING' ? _rdDatePL(r.iso) + ' <span style="color:var(--color-text-secondary);font-size:11px;">· wskazanie</span>' : (r.from ? _rdDatePL(r.from) + ' – ' + _rdDatePL(r.to) : _rdEsc(r.raw))}</td>
          <td style="padding:5px 8px;text-align:right;border-bottom:1px solid var(--color-border-tertiary);">${r.value != null ? _rdNum(r.value) : '—'}</td>
          <td style="padding:5px 8px;border-bottom:1px solid var(--color-border-tertiary);">${badge(r.ok, r.msg)}</td>
        </tr>`).join('')}</tbody>
    </table>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;">
      <span style="font-size:13px;color:var(--color-text-secondary);">Rozpoznano ${rows.length} wierszy · ${okCount} OK · ${rows.length - okCount} pominiętych</span>
      ${okCount ? `<button class="primary-button" style="font-size:13px;" onclick="_rdSaveSerial()">Zapisz ${okCount} pozycji</button>` : ''}
    </div>
    <p style="font-size:12px;color:var(--color-text-secondary);margin-top:6px;">Zapisane zostaną tylko wiersze ze statusem OK. Wiersze z ostrzeżeniem popraw na liście i kliknij podgląd ponownie.</p>`;
}

function _rdSaveSerial() {
  const rows = (window._rdSerialRows || []).filter(r => r.ok);
  if (!rows.length) return;
  const g = id => document.getElementById(id);
  const p = _rdProfile();
  const obj = ObjectsModule.find(_rdObjectId);
  const source = g('rd-serial-source').value;
  const unit = g('rd-serial-unit').value;
  const performed = g('rd-serial-performed').value.trim();
  const now = new Date().toISOString();
  const today = now.slice(0, 10);

  // Jeden zbiorczy saveAll (add() w pętli powielał wiersze — bug 2026-07-06).
  let idBase = Date.now();
  const items = ReadingsModule.getAll();
  rows.forEach(r => {
    items.push(ReadingsModule._normalize({
      id: idBase++,
      createdAt: now,
      clientId: _rdClientId,
      objectId: _rdObjectId,
      readingDate: r.kind === 'READING' ? r.iso : today,
      periodFrom: r.from,
      periodTo: r.to,
      dataSource: source,
      valueType: r.kind,
      value: r.value,
      unit: unit,
      currency: (obj && obj.currency) || 'PLN',
      invoiceItems: [],
      attachments: [],
      performedBy: performed,
      note: '',
      enteredById: p ? p.id : null,
      enteredByName: p ? (p.full_name || '') : '',
      enteredAt: now
    }));
  });
  ReadingsModule.saveAll(items);
  alert('Zapisano ' + rows.length + ' pozycji.');
  _rdCancel();
}

// ── 8. ROUTING — rozszerzenie openModule ─────────────────────────────────────

(function () {
  const prev = window.openModule;
  window.openModule = function (moduleName) {
    if (moduleName === 'readings' || moduleName === 'myReadings') {
      const labels = (typeof getModuleLabels === 'function') ? getModuleLabels() : {};
      const item = labels[moduleName];
      const titleEl = document.getElementById('module-title');
      if (titleEl && item) titleEl.textContent = item[1];
      const descEl = document.getElementById('module-description');
      if (descEl) descEl.textContent = '';
      const modView = document.getElementById('module-view');
      if (modView) modView.classList.add('active');

      if (moduleName === 'myReadings' && typeof currentRole !== 'undefined' && currentRole === 'client') {
        renderReadingsModule(typeof previewClientId !== 'undefined' ? previewClientId : null);
      } else {
        renderReadingsModule(null);
      }
      return;
    }
    if (prev) prev(moduleName);
  };
})();

window.renderReadingsModule = renderReadingsModule;
