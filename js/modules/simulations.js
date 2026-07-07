// WaterAI Energy Control
// Simulations Module v1.0.0 — „Symulacja oszczędności" (prognoza wieloletnia).
//
// Silnik obliczeniowy odwzorowuje 1:1 arkusz „ZYSK" z pliku Kalkulacja.xlsx:
//   E(rok)  = roczny koszt ogrzewania rosnący o wzrost cen
//   F       = E × zakładana oszczędność
//   K       = F × udział klienta w oszczędnościach (Excel: 50%)
//   L       = F × rata zwrotu inwestycji (Excel: 25% = połowa udziału WaterAI)
//   M       = rata zwrotu faktycznie wypłacona: min(L, inwestycja − suma dotychczasowych L)
//   Wpływy klienta G = K + M  (efektywnie 75% przed spłatą inwestycji, 50% po)
//   Payback = pierwszy rok, w którym skumulowane wpływy ≥ koszt inwestycji
//   KPI: zysk netto, CAGR = (zysk/inwestycja)^(1/lata) − 1, ROI
//
// Scenariusze A/B/C: te same parametry, różny % oszczędności — porównanie obok siebie.
// Dane w tabeli `simulations` (mostek WaterAIBridge), lustro waterai_simulations_v1.
// Udostępnianie: zakładka „Widoczność" (resource_shares, typ 'simulation').
// Ładowany PO shares.js — rozszerza window.openModule o 'simulation'.

// ── 1. MAGAZYN ────────────────────────────────────────────────────────────────

const _simulationsStore = (window.WaterAIBridge && WaterAIBridge.makeStore)
  ? WaterAIBridge.makeStore({
      table: 'simulations',
      storageKey: 'waterai_simulations_v1',
      label: 'symulacji',
      fk:  { column: 'client_id', prop: 'clientId', module: () => window.ClientsModule },
      fk2: { column: 'object_id', prop: 'objectId', module: () => window.ObjectsModule }
    })
  : (console.warn('[simulations] Brak WaterAIBridge — tryb lokalny.'), {
      storageKey: 'waterai_simulations_v1',
      async load() {},
      getAll() { return JSON.parse(localStorage.getItem(this.storageKey) || '[]'); },
      saveAll(items) { localStorage.setItem(this.storageKey, JSON.stringify(items)); },
      legacyIdForRow() { return null; }
    });

const SimulationsModule = {
  ..._simulationsStore,

  storageKey: 'waterai_simulations_v1',

  STATUSES: {
    DRAFT:     { label: 'Robocza',        color: '#7A4A00', bg: '#FEF3DC' },
    PRESENTED: { label: 'Zaprezentowana', color: '#0C447C', bg: '#E6F1FB' },
    ACCEPTED:  { label: 'Zaakceptowana',  color: '#27500A', bg: '#EAF3DE' }
  },

  DEFAULTS: {
    years: 10,
    investment: 0,
    heatingCost: 0,
    priceGrowthPct: 6.48,
    clientSharePct: 50,
    paybackReturnPct: 25,
    currency: 'PLN',
    scenarios: [{ label: 'A', savingsPct: 18 }]
  },

  add(sim) {
    const items = this.getAll();
    const rec = { ...JSON.parse(JSON.stringify(this.DEFAULTS)), ...sim,
      id: Date.now(), createdAt: new Date().toISOString(), status: sim.status || 'DRAFT' };
    items.push(rec);
    this.saveAll(items);
    return rec;
  },

  update(id, data) {
    this.saveAll(this.getAll().map(s =>
      Number(s.id) === Number(id) ? { ...s, ...data, id: s.id, updatedAt: new Date().toISOString() } : s));
  },

  remove(id) { this.saveAll(this.getAll().filter(s => Number(s.id) !== Number(id))); },

  find(id) { return this.getAll().find(s => Number(s.id) === Number(id)); },

  findByClient(clientId) {
    return this.getAll().filter(s => Number(s.clientId) === Number(clientId));
  }
};
window.SimulationsModule = SimulationsModule;

// ── 2. SILNIK (odwzorowanie arkusza ZYSK) ────────────────────────────────────

// p: {years, investment, heatingCost, priceGrowthPct, clientSharePct, paybackReturnPct}
// savingsPct: % oszczędności scenariusza. Zwraca {rows, kpi}.
function simCalcScenario(p, savingsPct) {
  const years = Math.max(1, Math.min(30, Number(p.years) || 10));
  const inv = Number(p.investment) || 0;
  const g = (Number(p.priceGrowthPct) || 0) / 100;
  const s = (Number(savingsPct) || 0) / 100;
  const kShare = (Number(p.clientSharePct) || 0) / 100;
  const lShare = (Number(p.paybackReturnPct) || 0) / 100;

  const rows = [];
  let E = Number(p.heatingCost) || 0;
  let H = 0, cumL = 0, paybackYear = null;

  for (let y = 1; y <= years; y++) {
    if (y > 1) E = E * (1 + g);
    const F = E * s;                 // generowane roczne oszczędności
    const K = F * kShare;            // stały udział klienta
    const L = F * lShare;            // rata obliczeniowa zwrotu inwestycji
    const M = cumL >= inv ? 0 : Math.min(L, inv - cumL);   // rata wypłacona (Excel: SUM(L) do wysokości inwestycji)
    cumL += L;
    const G = K + M;                 // wpływy klienta
    H += G;                          // wpływy narastająco
    const I = H - inv;               // oszczędność klienta narastająco
    const roi = inv > 0 ? I / inv : 0;
    if (paybackYear === null && I >= 0) paybackYear = y;
    rows.push({ year: y, E, F, K, M, G, H, I, roi });
  }

  const last = rows[rows.length - 1];
  const kpi = {
    paybackYear,
    totalInflows: last.H,
    netProfit: last.I,
    roi: last.roi,
    cagr: (inv > 0 && last.I > 0) ? Math.pow(last.I / inv, 1 / years) - 1 : null
  };
  return { rows, kpi };
}
window.simCalcScenario = simCalcScenario;

// ── 3. POMOCNICZE ────────────────────────────────────────────────────────────

const _SIM_COLORS = ['#0C447C', '#27500A', '#E65100'];

function _simFmt(v, d) {
  if (v === null || v === undefined || isNaN(v)) return '—';
  return Number(v).toLocaleString('pl-PL', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
}
function _simPct(v, d) { return v === null ? '—' : (v * 100).toLocaleString('pl-PL', { minimumFractionDigits: d == null ? 1 : d, maximumFractionDigits: d == null ? 1 : d }) + '%'; }
function _simCliName(id) { const c = window.ClientsModule ? ClientsModule.find(id) : null; return c ? c.name : '—'; }
function _simObjName(id) { const o = (id && window.ObjectsModule) ? ObjectsModule.find(id) : null; return o ? o.name : '—'; }
function _simIsStaff() { return typeof currentRole === 'undefined' || ['admin', 'backOffice', 'energyAnalyst'].includes(currentRole); }

// Wykres liniowy: skumulowane wpływy klienta per scenariusz + linia kosztu inwestycji.
function _simLineChart(cv, series, investment, currency) {
  if (!cv) return;
  const dpr = window.devicePixelRatio || 1;
  const W = cv.clientWidth || 640, H = 300;
  cv.width = W * dpr; cv.height = H * dpr;
  const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#222'; ctx.font = '600 12px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('Skumulowane wpływy klienta vs koszt inwestycji', 8, 16);
  ctx.fillStyle = '#999'; ctx.textAlign = 'right'; ctx.font = '10px sans-serif';
  ctx.fillText('[' + (currency || 'PLN') + ']', W - 12, 16);

  const pad = { l: 68, r: 16, t: 30, b: 44 };
  const plotW = W - pad.l - pad.r, plotH = H - pad.t - pad.b;
  const years = Math.max(...series.map(sr => sr.rows.length));
  let maxV = investment;
  series.forEach(sr => sr.rows.forEach(r => { if (r.H > maxV) maxV = r.H; }));
  maxV = Math.max(1, maxV) * 1.1;

  const xFor = y => pad.l + plotW * (y - 1) / Math.max(1, years - 1);
  const yFor = v => pad.t + plotH - (v / maxV) * plotH;

  ctx.textAlign = 'right'; ctx.font = '10px sans-serif';
  for (let i = 0; i <= 4; i++) {
    const val = maxV * i / 4, y = yFor(val);
    ctx.strokeStyle = '#ececec'; ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
    ctx.fillStyle = '#999'; ctx.fillText(_simFmt(val), pad.l - 6, y + 3);
  }
  ctx.textAlign = 'center'; ctx.fillStyle = '#555'; ctx.font = '600 11px sans-serif';
  for (let y = 1; y <= years; y++) ctx.fillText('R' + y, xFor(y), H - pad.b + 18);

  // linia inwestycji
  if (investment > 0) {
    const yi = yFor(investment);
    ctx.strokeStyle = '#c00'; ctx.setLineDash([6, 4]); ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(pad.l, yi); ctx.lineTo(W - pad.r, yi); ctx.stroke();
    ctx.setLineDash([]); ctx.lineWidth = 1;
    ctx.fillStyle = '#c00'; ctx.textAlign = 'left'; ctx.font = '600 10px sans-serif';
    ctx.fillText('Inwestycja ' + _simFmt(investment), pad.l + 4, yi - 5);
  }

  series.forEach((sr, si) => {
    const col = _SIM_COLORS[si % _SIM_COLORS.length];
    ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.beginPath();
    sr.rows.forEach((r, i) => { const x = xFor(r.year), y = yFor(r.H); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
    ctx.stroke(); ctx.lineWidth = 1;
    sr.rows.forEach(r => {
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(xFor(r.year), yFor(r.H), 3, 0, Math.PI * 2); ctx.fill();
    });
    if (sr.kpi.paybackYear) {   // znacznik payback
      const r = sr.rows[sr.kpi.paybackYear - 1];
      ctx.fillStyle = '#fff'; ctx.strokeStyle = col; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.arc(xFor(r.year), yFor(r.H), 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.lineWidth = 1;
    }
  });

  // legenda
  let lx = pad.l, ly = H - 10;
  series.forEach((sr, si) => {
    const col = _SIM_COLORS[si % _SIM_COLORS.length];
    ctx.fillStyle = col; ctx.fillRect(lx, ly - 8, 10, 10);
    ctx.fillStyle = '#555'; ctx.font = '10px sans-serif'; ctx.textAlign = 'left';
    const label = 'Scenariusz ' + sr.label + ' (' + _simFmt(sr.savingsPct, 1) + '%)';
    ctx.fillText(label, lx + 14, ly);
    lx += ctx.measureText(label).width + 32;
  });
}

// ── 4. STAN I STYL ───────────────────────────────────────────────────────────

let _simDraft = null;    // edytowana symulacja (kopia robocza)
let _simEditId = null;   // null = nowa

const SIM_STYLE = `<style>
  .sim-grid { display:grid; grid-template-columns:340px 1fr; gap:18px; align-items:start; }
  @media(max-width:900px){ .sim-grid { grid-template-columns:1fr; } }
  .sim-panel { border:1px solid var(--color-border-tertiary); border-radius:10px; padding:14px; background:var(--color-background-primary); }
  .sim-panel h4 { margin:0 0 10px; font-size:13px; }
  .sim-field { margin-bottom:10px; }
  .sim-field label { font-size:11px; color:var(--color-text-secondary); display:block; margin-bottom:3px; }
  .sim-field input, .sim-field select, .sim-field textarea { width:100%; box-sizing:border-box; font-size:13px; }
  .sim-g2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .sim-kpis { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:10px; margin-bottom:14px; }
  .sim-kpi { border:1px solid #e6edf5; border-radius:10px; padding:12px 10px; background:#fff; text-align:center; }
  .sim-kpi .v { font-size:18px; font-weight:800; color:#0C447C; font-variant-numeric:tabular-nums; }
  .sim-kpi .k { font-size:10px; color:var(--color-text-secondary); margin-top:4px; line-height:1.3; }
  .sim-t { width:100%; border-collapse:collapse; font-size:12px; }
  .sim-t th { text-align:right; padding:6px 8px; font-size:10px; font-weight:600; color:var(--color-text-secondary); border-bottom:2px solid var(--color-border-tertiary); background:var(--color-background-secondary); white-space:nowrap; }
  .sim-t th:first-child { text-align:left; }
  .sim-t td { padding:6px 8px; border-bottom:1px solid var(--color-border-tertiary); text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; }
  .sim-t td:first-child { text-align:left; font-weight:600; }
  .sim-t tr.sim-pb td { background:#EAF3DE; }
  .sim-scen-hdr { display:flex; align-items:center; gap:8px; margin:16px 0 8px; }
  .sim-scen-dot { width:12px; height:12px; border-radius:3px; display:inline-block; }
  canvas.sim-cv { width:100%; height:300px; border:1px solid var(--color-border-tertiary); border-radius:8px; background:#fff; }
  canvas.sim-cv-bar { width:100%; height:260px; border:1px solid var(--color-border-tertiary); border-radius:8px; background:#fff; }
  @media print {
    body * { visibility:hidden !important; }
    #sim-print, #sim-print * { visibility:visible !important; }
    #sim-print { position:absolute; left:0; top:0; width:100%; margin:0; padding:0; border:none; }
    .sim-noprint { display:none !important; }
    .sim-kpis, .sim-t, canvas.sim-cv, canvas.sim-cv-bar { break-inside:avoid; page-break-inside:avoid; }
    @page { margin: 12mm; }
  }
</style>`;

// ── 5. LISTA ─────────────────────────────────────────────────────────────────

function renderSimulationsModule() {
  const container = document.getElementById('module-content');
  if (!container) return;
  _simDraft = null; _simEditId = null;

  const sims = SimulationsModule.getAll().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  const staff = _simIsStaff();

  const rows = sims.map(sim => {
    const st = SimulationsModule.STATUSES[sim.status] || SimulationsModule.STATUSES.DRAFT;
    const best = (sim.scenarios || []).map(sc => simCalcScenario(sim, sc.savingsPct).kpi.paybackYear).filter(x => x).sort((a, b) => a - b)[0] || null;
    const scen = (sim.scenarios || []).map((sc, i) =>
      `<span style="font-size:11px;font-weight:600;color:${_SIM_COLORS[i % 3]};margin-right:8px;">${escapeHtml(sc.label)}: ${_simFmt(sc.savingsPct, 1)}%</span>`).join('');
    return `<tr style="border-bottom:1px solid var(--color-border-tertiary);">
      <td style="padding:10px 12px;font-size:13px;">
        <div style="font-weight:500;">${escapeHtml(sim.name || ('Symulacja #' + sim.id))}</div>
        <div style="font-size:11px;color:var(--color-text-secondary);">${escapeHtml(_simCliName(sim.clientId))} · ${escapeHtml(_simObjName(sim.objectId))}</div>
      </td>
      <td style="padding:10px 12px;">${scen}</td>
      <td style="padding:10px 12px;font-size:13px;text-align:center;">${best ? ('rok ' + best) : '—'}</td>
      <td style="padding:10px 12px;text-align:center;"><span style="font-size:11px;font-weight:600;padding:2px 9px;border-radius:20px;background:${st.bg};color:${st.color};">${st.label}</span></td>
      <td style="padding:10px 12px;font-size:12px;color:var(--color-text-secondary);">${sim.createdAt ? sim.createdAt.slice(0, 10) : '—'}</td>
      <td style="padding:10px 12px;white-space:nowrap;text-align:right;">
        <button class="small-button" onclick="simView(${sim.id})" title="Podgląd / druk">👁</button>
        ${staff ? `<button class="small-button" onclick="simEdit(${sim.id})" title="Edytuj">✏️</button>
        <button class="small-button" onclick="simDelete(${sim.id})" title="Usuń">🗑</button>` : ''}
      </td></tr>`;
  }).join('');

  container.innerHTML = SIM_STYLE + `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap;">
      <p style="font-size:13px;color:var(--color-text-secondary);margin:0;">
        Wieloletnia prognoza oszczędności dla klienta i obiektu — payback, zysk netto, ROI i porównanie scenariuszy.</p>
      ${staff ? `<button class="primary-button" onclick="simEdit(null)" style="font-size:13px;padding:10px 20px;">＋ Nowa symulacja</button>` : ''}
    </div>
    ${sims.length === 0
      ? `<div class="reminder-card"><strong>Brak symulacji.</strong>${staff ? ' Kliknij „Nowa symulacja”, aby utworzyć pierwszą.' : ''}</div>`
      : `<div style="overflow-x:auto;border:1px solid var(--color-border-tertiary);border-radius:10px;">
          <table style="width:100%;border-collapse:collapse;">
            <thead><tr style="background:var(--color-background-secondary);">
              <th style="padding:8px 12px;font-size:11px;font-weight:600;text-align:left;border-bottom:2px solid var(--color-border-tertiary);">Symulacja</th>
              <th style="padding:8px 12px;font-size:11px;font-weight:600;text-align:left;border-bottom:2px solid var(--color-border-tertiary);">Scenariusze</th>
              <th style="padding:8px 12px;font-size:11px;font-weight:600;text-align:center;border-bottom:2px solid var(--color-border-tertiary);">Payback</th>
              <th style="padding:8px 12px;font-size:11px;font-weight:600;text-align:center;border-bottom:2px solid var(--color-border-tertiary);">Status</th>
              <th style="padding:8px 12px;font-size:11px;font-weight:600;text-align:left;border-bottom:2px solid var(--color-border-tertiary);">Utworzono</th>
              <th style="border-bottom:2px solid var(--color-border-tertiary);"></th>
            </tr></thead><tbody>${rows}</tbody></table></div>`}
  `;
}
window.renderSimulationsModule = renderSimulationsModule;

function simDelete(id) {
  const sim = SimulationsModule.find(id);
  if (!sim) return;
  if (!confirm('Usunąć symulację „' + (sim.name || ('#' + id)) + '”?')) return;
  SimulationsModule.remove(id);
  renderSimulationsModule();
}
window.simDelete = simDelete;

// ── 6. EDYTOR ────────────────────────────────────────────────────────────────

function simEdit(id) {
  const container = document.getElementById('module-content');
  if (!container) return;
  _simEditId = id;
  _simDraft = id
    ? JSON.parse(JSON.stringify(SimulationsModule.find(id)))
    : { ...JSON.parse(JSON.stringify(SimulationsModule.DEFAULTS)), name: '', clientId: '', objectId: '', status: 'DRAFT', notes: '' };

  const clients = window.ClientsModule ? ClientsModule.getAll() : [];

  container.innerHTML = SIM_STYLE + `
    <div class="sim-noprint" style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap;">
      <button class="small-button" onclick="renderSimulationsModule()">← Lista symulacji</button>
      <div style="display:flex;gap:8px;">
        <button class="primary-button" onclick="simSave()" style="font-size:13px;padding:9px 18px;">💾 Zapisz</button>
      </div>
    </div>
    <div class="sim-grid">
      <div class="sim-panel">
        <h4>Parametry symulacji</h4>
        <div class="sim-field"><label>Nazwa symulacji</label>
          <input id="sim-name" value="${escapeHtml(_simDraft.name || '')}" placeholder="np. Modernizacja węzła — wariant 2026" oninput="_simRecalc()"></div>
        <div class="sim-field"><label>Klient</label>
          <select id="sim-client" onchange="_simClientChanged()">
            <option value="">— wybierz —</option>
            ${clients.map(c => `<option value="${c.id}" ${String(_simDraft.clientId) === String(c.id) ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
          </select></div>
        <div class="sim-field"><label>Obiekt</label>
          <select id="sim-object" onchange="_simRecalc()">${_simObjectOptions(_simDraft.clientId, _simDraft.objectId)}</select></div>
        <div class="sim-g2">
          <div class="sim-field"><label>Koszt inwestycji</label>
            <input id="sim-investment" type="number" step="0.01" min="0" value="${_simDraft.investment}" oninput="_simRecalc()"></div>
          <div class="sim-field"><label>Waluta</label>
            <select id="sim-currency" onchange="_simRecalc()">
              ${['PLN', 'EUR', 'CZK'].map(c => `<option ${_simDraft.currency === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select></div>
        </div>
        <div class="sim-field"><label>Roczny koszt ogrzewania (rok 1)</label>
          <input id="sim-heating" type="number" step="0.01" min="0" value="${_simDraft.heatingCost}" oninput="_simRecalc()"></div>
        <div class="sim-g2">
          <div class="sim-field"><label>Roczny wzrost cen energii [%]</label>
            <input id="sim-growth" type="number" step="0.01" value="${_simDraft.priceGrowthPct}" oninput="_simRecalc()"></div>
          <div class="sim-field"><label>Horyzont [lata]</label>
            <input id="sim-years" type="number" min="1" max="30" value="${_simDraft.years}" oninput="_simRecalc()"></div>
        </div>
        <div class="sim-g2">
          <div class="sim-field"><label>Udział klienta w oszczędnościach [%]</label>
            <input id="sim-kshare" type="number" step="0.1" min="0" max="100" value="${_simDraft.clientSharePct}" oninput="_simRecalc()"></div>
          <div class="sim-field"><label>Rata zwrotu inwestycji [% oszcz./rok]</label>
            <input id="sim-lshare" type="number" step="0.1" min="0" max="100" value="${_simDraft.paybackReturnPct}" oninput="_simRecalc()"></div>
        </div>
        <p style="font-size:11px;color:var(--color-text-secondary);margin:0 0 12px;">
          Rata zwrotu: część oszczędności zwracana klientowi z udziału WaterAI — do wysokości kosztu inwestycji
          (klient finansuje inwestycję, firma ją spłaca ze swojej części).</p>

        <h4>Scenariusze (% oszczędności)</h4>
        <div id="sim-scenarios">${_simScenarioInputs()}</div>
        ${(_simDraft.scenarios || []).length < 3
          ? `<button class="small-button sim-noprint" onclick="_simAddScenario()">＋ Dodaj scenariusz</button>` : ''}

        <div class="sim-field" style="margin-top:14px;"><label>Status</label>
          <select id="sim-status" onchange="_simRecalc()">
            ${Object.keys(SimulationsModule.STATUSES).map(k =>
              `<option value="${k}" ${_simDraft.status === k ? 'selected' : ''}>${SimulationsModule.STATUSES[k].label}</option>`).join('')}
          </select></div>
        <div class="sim-field"><label>Notatki</label>
          <textarea id="sim-notes" rows="3" oninput="_simRecalc()">${escapeHtml(_simDraft.notes || '')}</textarea></div>
      </div>
      <div id="sim-results"></div>
    </div>`;

  _simRecalc();
}
window.simEdit = simEdit;

function _simObjectOptions(clientId, objectId) {
  const objs = (clientId && window.ObjectsModule) ? ObjectsModule.findByClient(clientId) : [];
  return `<option value="">— wybierz —</option>` +
    objs.map(o => `<option value="${o.id}" ${String(objectId) === String(o.id) ? 'selected' : ''}>${escapeHtml(o.name)}</option>`).join('');
}

function _simScenarioInputs() {
  return (_simDraft.scenarios || []).map((sc, i) => `
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
      <span class="sim-scen-dot" style="background:${_SIM_COLORS[i % 3]};"></span>
      <input style="width:52px;font-size:13px;" value="${escapeHtml(sc.label)}" oninput="_simDraft.scenarios[${i}].label=this.value;_simRecalc(true)">
      <input style="flex:1;font-size:13px;" type="number" step="0.1" min="0" max="100" value="${sc.savingsPct}"
        oninput="_simDraft.scenarios[${i}].savingsPct=Number(this.value)||0;_simRecalc(true)">
      <span style="font-size:12px;color:var(--color-text-secondary);">%</span>
      ${(_simDraft.scenarios.length > 1)
        ? `<button class="small-button" onclick="_simRemoveScenario(${i})" title="Usuń scenariusz">✕</button>` : ''}
    </div>`).join('');
}

function _simClientChanged() {
  const sel = document.getElementById('sim-client');
  _simDraft.clientId = sel.value ? Number(sel.value) : '';
  _simDraft.objectId = '';
  document.getElementById('sim-object').innerHTML = _simObjectOptions(_simDraft.clientId, '');
  _simRecalc();
}
window._simClientChanged = _simClientChanged;

function _simAddScenario() {
  const labels = ['A', 'B', 'C'];
  _simDraft.scenarios.push({ label: labels[_simDraft.scenarios.length] || '?', savingsPct: 18 });
  simRerenderScenarioInputs();
  _simRecalc(true);
}
window._simAddScenario = _simAddScenario;

function _simRemoveScenario(i) {
  _simDraft.scenarios.splice(i, 1);
  simRerenderScenarioInputs();
  _simRecalc(true);
}
window._simRemoveScenario = _simRemoveScenario;

function simRerenderScenarioInputs() {
  const box = document.getElementById('sim-scenarios');
  if (box) box.innerHTML = _simScenarioInputs();
}

// skipForm=true: nie czytaj pól formularza (zmiana przyszła spoza inputów parametrów)
function _simRecalc(skipForm) {
  if (!_simDraft) return;
  if (!skipForm) {
    const g = id => document.getElementById(id);
    if (g('sim-name')) {
      _simDraft.name = g('sim-name').value;
      _simDraft.objectId = g('sim-object').value ? Number(g('sim-object').value) : '';
      _simDraft.investment = Number(g('sim-investment').value) || 0;
      _simDraft.currency = g('sim-currency').value;
      _simDraft.heatingCost = Number(g('sim-heating').value) || 0;
      _simDraft.priceGrowthPct = Number(g('sim-growth').value) || 0;
      _simDraft.years = Number(g('sim-years').value) || 10;
      _simDraft.clientSharePct = Number(g('sim-kshare').value) || 0;
      _simDraft.paybackReturnPct = Number(g('sim-lshare').value) || 0;
      _simDraft.status = g('sim-status').value;
      _simDraft.notes = g('sim-notes').value;
    }
  }
  const box = document.getElementById('sim-results');
  if (box) box.innerHTML = _simResultsHtml(_simDraft, 'sim-live');
  requestAnimationFrame(() => _simDrawCharts(_simDraft, 'sim-live'));
}
window._simRecalc = _simRecalc;

function simSave() {
  if (!_simDraft.clientId) { alert('Wybierz klienta symulacji.'); return; }
  if (!(_simDraft.investment > 0)) { alert('Podaj koszt inwestycji (> 0).'); return; }
  if (!(_simDraft.heatingCost > 0)) { alert('Podaj roczny koszt ogrzewania (> 0).'); return; }
  if (!_simDraft.name) _simDraft.name = 'Symulacja — ' + _simCliName(_simDraft.clientId);
  if (_simEditId) SimulationsModule.update(_simEditId, _simDraft);
  else SimulationsModule.add(_simDraft);
  renderSimulationsModule();
}
window.simSave = simSave;

// ── 7. WYNIKI (wspólne dla edytora i podglądu/druku) ─────────────────────────

function _simResultsHtml(sim, cid) {
  const results = (sim.scenarios || []).map(sc => ({ ...simCalcScenario(sim, sc.savingsPct), label: sc.label, savingsPct: sc.savingsPct }));
  if (!results.length) return '<div class="reminder-card"><strong>Dodaj co najmniej jeden scenariusz.</strong></div>';
  const cur = sim.currency || 'PLN';

  const kpiCards = results.map((r, i) => `
    <div class="sim-kpi" style="border-top:3px solid ${_SIM_COLORS[i % 3]};">
      <div class="v">${r.kpi.paybackYear ? ('rok ' + r.kpi.paybackYear) : '—'}</div>
      <div class="k">Payback · scen. ${escapeHtml(r.label)} (${_simFmt(r.savingsPct, 1)}%)</div>
    </div>
    <div class="sim-kpi" style="border-top:3px solid ${_SIM_COLORS[i % 3]};">
      <div class="v">${_simFmt(r.kpi.netProfit)} <span style="font-size:11px;">${cur}</span></div>
      <div class="k">Zysk netto klienta po ${sim.years} lat.</div>
    </div>
    <div class="sim-kpi" style="border-top:3px solid ${_SIM_COLORS[i % 3]};">
      <div class="v">${r.kpi.roi === null ? '—' : _simFmt(r.kpi.roi, 2)}</div>
      <div class="k">ROI (× inwestycja)</div>
    </div>
    <div class="sim-kpi" style="border-top:3px solid ${_SIM_COLORS[i % 3]};">
      <div class="v">${r.kpi.cagr === null ? '—' : _simPct(r.kpi.cagr)}</div>
      <div class="k">CAGR</div>
    </div>`).join('');

  const tables = results.map((r, i) => `
    <div class="sim-scen-hdr">
      <span class="sim-scen-dot" style="background:${_SIM_COLORS[i % 3]};"></span>
      <strong style="font-size:13px;">Scenariusz ${escapeHtml(r.label)} — oszczędność ${_simFmt(r.savingsPct, 1)}%</strong>
    </div>
    <div style="overflow-x:auto;border:1px solid var(--color-border-tertiary);border-radius:8px;margin-bottom:6px;">
      <table class="sim-t"><thead><tr>
        <th>Rok</th><th>Koszt ogrzewania</th><th>Oszczędności</th><th>Udział klienta</th>
        <th>Rata zwrotu</th><th>Wpływy klienta</th><th>Narastająco</th><th>Wynik vs inwestycja</th><th>ROI</th>
      </tr></thead><tbody>
      ${r.rows.map(row => `<tr ${r.kpi.paybackYear === row.year ? 'class="sim-pb" title="Rok zwrotu inwestycji"' : ''}>
        <td>${row.year}</td><td>${_simFmt(row.E)}</td><td>${_simFmt(row.F)}</td><td>${_simFmt(row.K)}</td>
        <td>${_simFmt(row.M)}</td><td>${_simFmt(row.G)}</td><td>${_simFmt(row.H)}</td>
        <td style="color:${row.I >= 0 ? '#27500A' : '#c00'};font-weight:600;">${_simFmt(row.I)}</td>
        <td>${_simFmt(row.roi, 2)}</td></tr>`).join('')}
      </tbody></table></div>
    <p style="font-size:10px;color:var(--color-text-secondary);margin:0 0 14px;">Kwoty w ${cur} netto. Wiersz zielony = rok zwrotu inwestycji.</p>`).join('');

  return `
    <div class="sim-kpis">${kpiCards}</div>
    <canvas id="${cid}-line" class="sim-cv"></canvas>
    <div style="height:12px;"></div>
    <canvas id="${cid}-bars" class="sim-cv-bar"></canvas>
    <div style="height:6px;"></div>
    ${tables}`;
}

function _simDrawCharts(sim, cid) {
  const results = (sim.scenarios || []).map(sc => ({ ...simCalcScenario(sim, sc.savingsPct), label: sc.label, savingsPct: sc.savingsPct }));
  if (!results.length) return;
  _simLineChart(document.getElementById(cid + '-line'), results, Number(sim.investment) || 0, sim.currency);

  if (typeof _anwBar === 'function') {
    const years = results[0].rows.length;
    const groups = [];
    for (let y = 0; y < years; y++) {
      groups.push({
        label: 'R' + (y + 1),
        bars: results.map((r, i) => ({
          v: r.rows[y] ? r.rows[y].F : 0,
          c: _SIM_COLORS[i % 3],
          n: 'Scenariusz ' + r.label
        }))
      });
    }
    _anwBar(document.getElementById(cid + '-bars'), groups,
      { title: 'Generowane roczne oszczędności', unit: sim.currency || 'PLN' });
  }
}

// ── 8. PODGLĄD / DRUK ────────────────────────────────────────────────────────

function simView(id) {
  const sim = SimulationsModule.find(id);
  const container = document.getElementById('module-content');
  if (!sim || !container) return;
  const st = SimulationsModule.STATUSES[sim.status] || SimulationsModule.STATUSES.DRAFT;

  container.innerHTML = SIM_STYLE + `
    <div class="sim-noprint" style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap;">
      <button class="small-button" onclick="renderSimulationsModule()">← Lista symulacji</button>
      <div style="display:flex;gap:8px;">
        ${_simIsStaff() ? `<button class="small-button" onclick="simEdit(${sim.id})">✏️ Edytuj</button>` : ''}
        <button class="primary-button" onclick="simPrintPDF()" style="font-size:13px;padding:9px 18px;">🖨 Drukuj / PDF</button>
      </div>
    </div>
    <div id="sim-print">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;border-bottom:2px solid var(--color-border-tertiary);padding-bottom:12px;margin-bottom:14px;">
        <div>
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.2px;color:var(--color-text-tertiary);font-weight:700;">Symulacja oszczędności</div>
          <h2 style="margin:4px 0 6px;font-size:20px;">${escapeHtml(sim.name || ('Symulacja #' + sim.id))}</h2>
          <div style="font-size:13px;color:var(--color-text-secondary);">
            Klient: <strong>${escapeHtml(_simCliName(sim.clientId))}</strong> ·
            Obiekt: <strong>${escapeHtml(_simObjName(sim.objectId))}</strong></div>
        </div>
        <div style="text-align:right;font-size:12px;color:var(--color-text-secondary);">
          <span style="font-size:11px;font-weight:600;padding:2px 9px;border-radius:20px;background:${st.bg};color:${st.color};">${st.label}</span>
          <div style="margin-top:6px;">Utworzono: ${sim.createdAt ? sim.createdAt.slice(0, 10) : '—'}</div>
        </div>
      </div>
      <div style="font-size:12px;color:var(--color-text-secondary);margin-bottom:14px;">
        Koszt inwestycji: <strong>${_simFmt(sim.investment)} ${sim.currency}</strong> ·
        Roczny koszt ogrzewania: <strong>${_simFmt(sim.heatingCost)} ${sim.currency}</strong> ·
        Wzrost cen: <strong>${_simFmt(sim.priceGrowthPct, 2)}%/rok</strong> ·
        Udział klienta: <strong>${_simFmt(sim.clientSharePct, 1)}%</strong> ·
        Rata zwrotu: <strong>${_simFmt(sim.paybackReturnPct, 1)}%</strong> ·
        Horyzont: <strong>${sim.years} lat</strong></div>
      <div id="sim-view-results">${_simResultsHtml(sim, 'sim-doc')}</div>
      ${sim.notes ? `<div style="font-size:12px;color:var(--color-text-secondary);margin-top:10px;"><strong>Notatki:</strong> ${escapeHtml(sim.notes)}</div>` : ''}
      <div style="margin-top:16px;padding-top:10px;border-top:1px solid var(--color-border-tertiary);font-size:10px;color:var(--color-text-tertiary);">
        Dokument ma charakter poglądowy — prognoza na podstawie przyjętych założeń, nie stanowi oferty w rozumieniu Kodeksu cywilnego. WaterAI Energy Control.</div>
    </div>`;

  requestAnimationFrame(() => _simDrawCharts(sim, 'sim-doc'));
}
window.simView = simView;

function simPrintPDF() { window.print(); }
window.simPrintPDF = simPrintPDF;

// ── 9. ROUTING — rozszerzenie openModule ─────────────────────────────────────

(function () {
  const prev = window.openModule;
  window.openModule = function (moduleName) {
    if (moduleName === 'simulation') {
      const labels = (typeof getModuleLabels === 'function') ? getModuleLabels() : {};
      const item = labels[moduleName];
      const titleEl = document.getElementById('module-title');
      if (titleEl && item) titleEl.textContent = item[1];
      const descEl = document.getElementById('module-description');
      if (descEl) descEl.textContent = '';
      const modView = document.getElementById('module-view');
      if (modView) modView.classList.add('active');
      renderSimulationsModule();
      return;
    }
    if (prev) prev(moduleName);
  };
})();
