// WaterAI Energy Control
// Simulations Module v1.1.0 — „Symulacja oszczędności" (prognoza wieloletnia).
//
// v1.1 (2026-07-07): wydruk przebudowany na pełny dokument w stylistyce raportów
// ESCO — okładka (osobna strona), podsumowanie wykonawcze, statyczna sekcja
// metodyki (TYM / obłożenie / powierzchnia / intensywność / harmonogram /
// niestandardowa + dowód regresją), założenia, wyniki, porównanie scenariuszy,
// mechanizm rozliczenia ESCO z osią czasu, zastrzeżenia. Numeracja SYM/rok/…
// jak w raportach. Poprawki KPI dla inwestycji = 0 (czysty ESCO bez wkładu).
//
// Silnik obliczeniowy odwzorowuje 1:1 arkusz „ZYSK" z pliku Kalkulacja.xlsx
// (ZWERYFIKOWANY LICZBOWO — nie zmieniać bez ponownej weryfikacji):
//   E(rok)  = roczny koszt ogrzewania rosnący o wzrost cen
//   F       = E × zakładana oszczędność
//   K       = F × udział klienta w oszczędnościach (Excel: 50%)
//   L       = F × rata zwrotu inwestycji (Excel: 25% = połowa udziału WaterAI)
//   M       = rata zwrotu faktycznie wypłacona: min(L, inwestycja − suma dotychczasowych L)
//   Wpływy klienta G = K + M  (efektywnie 75% przed spłatą inwestycji, 50% po)
//   Payback = pierwszy rok, w którym skumulowane wpływy ≥ koszt inwestycji
//   KPI: zysk netto, CAGR = (zysk/inwestycja)^(1/lata) − 1, ROI
//
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

  // Warianty rozliczenia — kaucja zwrotna / opłata niezwrotna / bez opłat.
  SETTLEMENTS: {
    DEPOSIT: {
      label: 'Kaucja zwrotna',
      short: 'kaucja zwrotna',
      feeLabel: 'Kaucja zwrotna',
      desc: 'Klient wpłaca zwrotną kaucję i do czasu jej zwrotu otrzymuje podwyższony udział w oszczędnościach; po zwrocie obowiązuje udział docelowy.'
    },
    FEE: {
      label: 'Opłata niezwrotna',
      short: 'opłata za wdrożenie',
      feeLabel: 'Opłata za wdrożenie',
      desc: 'Klient wnosi jednorazową, bezzwrotną opłatę za wdrożenie i od pierwszego roku otrzymuje ustalony udział w oszczędnościach.'
    },
    FREE: {
      label: 'Bez opłat',
      short: 'bez opłat',
      feeLabel: '—',
      desc: 'Klient nie ponosi żadnej opłaty i od pierwszego roku otrzymuje ustalony udział w oszczędnościach.'
    }
  },

  DEFAULTS: {
    settlementType: 'DEPOSIT',
    years: 10,
    investment: 0,
    heatingCost: 0,
    priceGrowthPct: 6.48,
    clientSharePct: 50,
    paybackReturnPct: 25,
    currency: 'PLN',
    scenarios: [{ label: 'A', savingsPct: 18, note: '', base: true }]
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

// ── 2. SILNIK ────────────────────────────────────────────────────────────────
//
// Trzy warianty rozliczenia (p.settlementType):
//   'DEPOSIT' — kaucja zwrotna: 75/25 → 50/50 do czasu zwrotu kaucji, potem stały
//               udział. ODWZOROWANIE 1:1 arkusza ZYSK (Kalkulacja.xlsx),
//               ZWERYFIKOWANE LICZBOWO — NIE ZMIENIAĆ tej gałęzi bez ponownej weryfikacji.
//   'FEE'     — opłata niezwrotna z góry: klient płaci jednorazowo (p.investment),
//               opłata jest kosztem policzonym OSOBNO (nie odrabia się z oszczędności),
//               klient dostaje stały % (clientSharePct) od roku 1, bez raty zwrotu (M=0).
//   'FREE'    — klient nic nie płaci: FEE z opłatą 0 (stały % od roku 1).
//
// p: {years, investment, heatingCost, priceGrowthPct, clientSharePct, paybackReturnPct, settlementType}
// savingsPct: % oszczędności scenariusza. Zwraca {rows, kpi}.

// Gałąź kaucji zwrotnej — kod przepisany BEZ ZMIAN z wersji zweryfikowanej z Excelem.
function _simEngineDeposit(p, savingsPct) {
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
    totalSavings: rows.reduce((a, r) => a + r.F, 0),
    netProfit: last.I,
    roi: last.roi,
    cagr: (inv > 0 && last.I > 0) ? Math.pow(last.I / inv, 1 / years) - 1 : null
  };
  return { rows, kpi };
}

// Gałąź opłaty niezwrotnej (FEE) i „za darmo" (FREE = fee 0).
// Klient dostaje stały % oszczędności od roku 1; opłata to koszt początkowy,
// od którego liczymy skumulowany wynik (I = wpływy narastająco − opłata).
function _simEngineFee(p, savingsPct) {
  const years = Math.max(1, Math.min(30, Number(p.years) || 10));
  const fee = Number(p.investment) || 0;   // to samo pole UI: opłata jednorazowa
  const g = (Number(p.priceGrowthPct) || 0) / 100;
  const s = (Number(savingsPct) || 0) / 100;
  const kShare = (Number(p.clientSharePct) || 0) / 100;

  const rows = [];
  let E = Number(p.heatingCost) || 0;
  let H = 0, paybackYear = null;

  for (let y = 1; y <= years; y++) {
    if (y > 1) E = E * (1 + g);
    const F = E * s;                 // generowane roczne oszczędności
    const K = F * kShare;            // stały udział klienta (od roku 1)
    const M = 0;                     // brak raty zwrotu w tym wariancie
    const G = K;                     // wpływy klienta = sam udział
    H += G;
    const I = H - fee;               // wynik narastająco po odjęciu opłaty
    const roi = fee > 0 ? I / fee : 0;
    if (paybackYear === null && I >= 0) paybackYear = y;
    rows.push({ year: y, E, F, K, M, G, H, I, roi });
  }

  const last = rows[rows.length - 1];
  const kpi = {
    paybackYear,                     // dla FREE (fee=0) → rok 1; UI i tak ukryje payback gdy fee=0
    totalInflows: last.H,
    totalSavings: rows.reduce((a, r) => a + r.F, 0),
    netProfit: last.I,
    roi: last.roi,
    cagr: (fee > 0 && last.I > 0) ? Math.pow(last.I / fee, 1 / years) - 1 : null
  };
  return { rows, kpi };
}

function simCalcScenario(p, savingsPct) {
  const t = p.settlementType || 'DEPOSIT';
  return (t === 'FEE' || t === 'FREE') ? _simEngineFee(p, savingsPct) : _simEngineDeposit(p, savingsPct);
}
window.simCalcScenario = simCalcScenario;

// ── 3. POMOCNICZE ────────────────────────────────────────────────────────────

const _SIM_COLORS = ['#0C447C', '#27500A', '#E65100'];

function _simFmt(v, d) {
  if (v === null || v === undefined || isNaN(v)) return '—';
  return Number(v).toLocaleString('pl-PL', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
}
function _simPct(v, d) { return (v === null || v === undefined) ? '—' : (v * 100).toLocaleString('pl-PL', { minimumFractionDigits: d == null ? 1 : d, maximumFractionDigits: d == null ? 1 : d }) + '%'; }
function _simCli(id) { return window.ClientsModule ? ClientsModule.find(id) : null; }
function _simCliName(id) { const c = _simCli(id); return c ? c.name : '—'; }
function _simObjName(id) { const o = (id && window.ObjectsModule) ? ObjectsModule.find(id) : null; return o ? o.name : '—'; }
function _simIsStaff() { return typeof currentRole === 'undefined' || ['admin', 'backOffice', 'energyAnalyst'].includes(currentRole); }
function _simYearsTxt(y) { return y === 1 ? '1 roku' : (y + ' latach'); }
function _simUserName() {
  const p = (window.WaterAISupabase && WaterAISupabase.profile) ? WaterAISupabase.profile : null;
  if (!p) return '';
  return p.fullName || p.full_name || ((p.firstName || '') + ' ' + (p.lastName || '')).trim() || p.email || '';
}
// Lista pracowników (admin/backOffice/energyAnalyst) dla pola „Sporządził".
function _simPreparedOptions(selectedName) {
  let staff = [];
  if (typeof UsersModule !== 'undefined' && UsersModule.findByRole) {
    ['admin', 'backOffice', 'energyAnalyst'].forEach(r => { staff = staff.concat(UsersModule.findByRole(r)); });
  }
  const names = [];
  staff.forEach(u => {
    const n = (u.fullName || ((u.firstName || '') + ' ' + (u.lastName || '')).trim()).trim();
    if (n && !names.includes(n)) names.push(n);
  });
  if (selectedName && !names.includes(selectedName)) names.unshift(selectedName); // zachowaj historyczną wartość
  const opts = names.map(n => `<option value="${escapeHtml(n)}" ${selectedName === n ? 'selected' : ''}>${escapeHtml(n)}</option>`).join('');
  return `<option value="">— wybierz —</option>` + opts +
    (names.length ? '' : `<option value="" disabled>brak użytkowników (admin / backOffice / energyAnalyst)</option>`);
}
function _simBaseScenario(sim) {
  const sc = sim.scenarios || [];
  return sc.find(x => x.base) || sc[0] || null;
}
function _simCliAddr(c) {
  if (!c) return '';
  const l1 = [c.street, c.buildingNumber].filter(Boolean).join(' ') + (c.apartmentNumber ? '/' + c.apartmentNumber : '');
  const l2 = [c.postalCode, c.city].filter(Boolean).join(' ');
  return [l1.trim(), l2, c.country].filter(Boolean).join(', ');
}

// Numeracja jak w raportach ESCO: SYM/rok/nrKlienta/nrObiektu/nr kolejny.
function simSuggestNumber(clientId, objectId) {
  const year = new Date().getFullYear();
  const cn = (clientId && window.ClientsModule && typeof ClientsModule.getNumber === 'function') ? ClientsModule.getNumber(clientId) : null;
  const on = (objectId && window.ObjectsModule && typeof ObjectsModule.getNumber === 'function') ? ObjectsModule.getNumber(objectId) : null;
  const seq = String(SimulationsModule.getAll().filter(s => Number(s.clientId) === Number(clientId)).length + 1).padStart(3, '0');
  if (cn && on) return `SYM/${year}/${cn}/${on}/${seq}`;
  if (cn) return `SYM/${year}/${cn}/${seq}`;
  return `SYM/${year}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${seq}`;
}
window.simSuggestNumber = simSuggestNumber;

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
    if (investment > 0 && sr.kpi.paybackYear) {
      const r = sr.rows[sr.kpi.paybackYear - 1];
      ctx.fillStyle = '#fff'; ctx.strokeStyle = col; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.arc(xFor(r.year), yFor(r.H), 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.lineWidth = 1;
    }
  });

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
  .sim-scen-dot { width:12px; height:12px; border-radius:3px; display:inline-block; flex:0 0 auto; }
  canvas.sim-cv { width:100%; height:300px; border:1px solid var(--color-border-tertiary); border-radius:8px; background:#fff; }
  canvas.sim-cv-bar { width:100%; height:260px; border:1px solid var(--color-border-tertiary); border-radius:8px; background:#fff; }

  /* ── Dokument (podgląd/druk) w stylistyce raportu ESCO ── */
  #sim-print { max-width:900px; margin:0 auto; }
  .sim-cover { border:1px solid #dbe5f0; border-radius:18px; padding:34px 38px 26px; background:#fff;
    box-shadow:0 10px 26px rgba(12,68,124,.08); display:flex; flex-direction:column; margin-bottom:26px; }
  .sim-cover-head { display:flex; justify-content:space-between; align-items:flex-start; gap:14px; margin-bottom:26px; }
  .sim-cover-logo { height:52px; width:auto; max-width:60%; object-fit:contain; }
  .sim-cover-num { text-align:right; }
  .sim-cover-num-lbl { font-size:10px; letter-spacing:1.4px; text-transform:uppercase; color:var(--color-text-tertiary); font-weight:700; }
  .sim-cover-num-val { font-size:17px; font-weight:800; color:#0C447C; font-variant-numeric:tabular-nums; }
  .sim-cover-kicker { display:inline-block; font-size:11px; font-weight:700; letter-spacing:1.2px; text-transform:uppercase;
    color:#0C447C; background:#E6F1FB; border-radius:20px; padding:4px 14px; margin-bottom:12px; }
  .sim-cover h1 { margin:0 0 8px; font-size:32px; color:#111; }
  .sim-cover-sub { font-size:13px; color:var(--color-text-secondary); margin-bottom:22px; max-width:640px; }
  .sim-cover-meta { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:8px; }
  .sim-cm-card { border:1px solid #e6edf5; border-radius:12px; padding:14px 16px; background:#FAFCFE; }
  .sim-cm-lbl { font-size:10px; letter-spacing:1.2px; text-transform:uppercase; color:#0C447C; font-weight:700; margin-bottom:6px; }
  .sim-cm-val { font-size:16px; font-weight:700; color:#111; }
  .sim-cm-sub { font-size:12px; color:var(--color-text-secondary); margin-top:3px; }
  .sim-cover-result { margin-top:auto; padding-top:24px; }
  .sim-cover-result-head { font-size:12px; text-transform:uppercase; letter-spacing:1.4px; color:var(--color-text-tertiary); font-weight:700; margin-bottom:10px; }
  .sim-hero { background:linear-gradient(135deg,#0C447C,#1a6bb5); color:#fff; border-radius:16px; padding:20px 28px;
    display:flex; justify-content:space-between; align-items:center; gap:16px; box-shadow:0 8px 22px rgba(12,68,124,.26);
    -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .sim-hero-lbl { font-size:16px; font-weight:600; opacity:.94; text-transform:uppercase; letter-spacing:.6px; line-height:1.2; }
  .sim-hero-val { font-size:56px; font-weight:800; line-height:1; font-variant-numeric:tabular-nums; white-space:nowrap; }
  .sim-hero-val span { font-size:26px; font-weight:700; margin-left:4px; }
  .sim-cover-kpis { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-top:14px; }
  .sim-cover-kpi { border:1px solid #e6edf5; border-radius:12px; padding:16px 14px; background:#fff; text-align:center; }
  .sim-cover-kpi .v { font-size:21px; font-weight:800; color:#0C447C; font-variant-numeric:tabular-nums; }
  .sim-cover-kpi .v span { font-size:13px; font-weight:600; }
  .sim-cover-kpi .k { font-size:11px; color:var(--color-text-secondary); margin-top:6px; line-height:1.3; }
  .sim-cover-foot { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-top:22px; padding-top:14px;
    border-top:1px solid #e6edf5; font-size:11px; color:var(--color-text-tertiary); }
  .sim-sec { margin-bottom:24px; }
  .sim-sec-h { display:flex; align-items:baseline; gap:10px; border-bottom:2px solid #0C447C; padding-bottom:6px; margin-bottom:12px; }
  .sim-sec-h .n { font-size:13px; font-weight:800; color:#0C447C; }
  .sim-sec-h h3 { margin:0; font-size:17px; color:#0C447C; }
  .sim-desc { font-size:13px; line-height:1.55; color:#222; margin:0 0 10px; }
  .sim-formula { border-left:3px solid #0C447C; background:#F4F8FC; border-radius:0 10px 10px 0; padding:10px 16px;
    font-family:Georgia,'Times New Roman',serif; font-size:14px; margin:10px 0; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .sim-method { border:1px solid #e6edf5; border-radius:12px; padding:12px 16px; margin-bottom:10px; background:#fff; }
  .sim-method h5 { margin:0 0 6px; font-size:13px; color:#0C447C; }
  .sim-method h5 .tag { font-size:10px; font-weight:700; color:#27500A; background:#EAF3DE; border-radius:12px; padding:2px 9px; margin-left:8px; vertical-align:1px; }
  .sim-method p { margin:0; font-size:12px; line-height:1.5; color:#333; }
  .sim-method .sim-formula { margin:8px 0 0; font-size:13px; }
  .sim-method.proof { border-color:#cfe3cf; background:#FBFDF9; }
  .sim-method.proof h5 { color:#27500A; }
  .sim-params { width:100%; border-collapse:collapse; font-size:13px; }
  .sim-params td { padding:7px 10px; border-bottom:1px solid var(--color-border-tertiary); }
  .sim-params td:first-child { color:var(--color-text-secondary); width:46%; }
  .sim-params td:last-child { font-weight:600; text-align:right; font-variant-numeric:tabular-nums; }
  .sim-scen-chip { display:flex; align-items:center; gap:10px; border:1px solid #e6edf5; border-radius:10px; padding:9px 12px; margin-bottom:8px; background:#fff; }
  .sim-scen-chip .pct { font-weight:800; color:#0C447C; font-size:15px; white-space:nowrap; }
  .sim-scen-chip .base { font-size:10px; font-weight:700; color:#0C447C; background:#E6F1FB; border-radius:12px; padding:2px 9px; }
  .sim-scen-chip .note { font-size:12px; color:var(--color-text-secondary); }
  .sim-cmp th, .sim-cmp td { text-align:center; }
  .sim-cmp td:first-child, .sim-cmp th:first-child { text-align:left; }
  .sim-steps { display:flex; gap:8px; flex-wrap:wrap; margin-top:10px; }
  .sim-step { flex:1 1 150px; border:1px solid #e6edf5; border-radius:10px; padding:10px 12px; background:#FAFCFE; }
  .sim-step .no { font-size:11px; font-weight:800; color:#0C447C; }
  .sim-step .t { font-size:12px; font-weight:600; margin-top:2px; }
  .sim-step .d { font-size:11px; color:var(--color-text-secondary); margin-top:3px; line-height:1.4; }
  .sim-footnote { font-size:10px; color:var(--color-text-tertiary); line-height:1.5; }

  @media(max-width:680px){ .sim-cover{padding:22px 18px 18px;} .sim-cover h1{font-size:24px;}
    .sim-cover-meta{grid-template-columns:1fr;} .sim-cover-kpis{grid-template-columns:1fr;}
    .sim-hero{flex-direction:column;align-items:flex-start;} .sim-hero-val{font-size:42px;} }

  @media print {
    body * { visibility:hidden !important; }
    #sim-print, #sim-print * { visibility:visible !important; }
    #sim-print { position:absolute; left:0; top:0; width:100%; max-width:none; margin:0; padding:0; border:none; }
    .sim-noprint { display:none !important; }
    .sim-cover { min-height:244mm; box-shadow:none; page-break-after:always; break-after:page; border:1px solid #dbe5f0; }
    .sim-sec { break-inside:auto; page-break-inside:auto; }
    .sim-sec-h { break-after:avoid; page-break-after:avoid; }
    .sim-desc { orphans:3; widows:3; }
    .sim-kpis, table.sim-t, table.sim-params, .sim-formula, .sim-method, .sim-scen-chip, .sim-steps,
    canvas.sim-cv, canvas.sim-cv-bar { break-inside:avoid; page-break-inside:avoid; }
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
    const inv = Number(sim.investment) || 0;
    const best = inv > 0
      ? ((sim.scenarios || []).map(sc => simCalcScenario(sim, sc.savingsPct).kpi.paybackYear).filter(x => x).sort((a, b) => a - b)[0] || null)
      : null;
    const scen = (sim.scenarios || []).map((sc, i) =>
      `<span style="font-size:11px;font-weight:600;color:${_SIM_COLORS[i % 3]};margin-right:8px;">${escapeHtml(sc.label)}: ${_simFmt(sc.savingsPct, 1)}%</span>`).join('');
    return `<tr style="border-bottom:1px solid var(--color-border-tertiary);">
      <td style="padding:10px 12px;font-size:13px;">
        <div style="font-weight:500;">${escapeHtml(sim.name || ('Symulacja #' + sim.id))}</div>
        <div style="font-size:11px;color:var(--color-text-secondary);">${escapeHtml(sim.simNumber || '—')} · ${escapeHtml(_simCliName(sim.clientId))} · ${escapeHtml(_simObjName(sim.objectId))}</div>
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
    : { ...JSON.parse(JSON.stringify(SimulationsModule.DEFAULTS)),
        name: '', simNumber: '', clientId: '', objectId: '', status: 'DRAFT', notes: '',
        preparedBy: _simUserName() };
  if (!(_simDraft.scenarios || []).some(sc => sc.base) && _simDraft.scenarios && _simDraft.scenarios.length) {
    _simDraft.scenarios[0].base = true;
  }

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
        <div class="sim-g2">
          <div class="sim-field"><label>Numer symulacji</label>
            <input id="sim-number" value="${escapeHtml(_simDraft.simNumber || '')}" placeholder="SYM/rok/klient/obiekt/nr" oninput="_simRecalc()"></div>
          <div class="sim-field"><label>Sporządził</label>
            <select id="sim-prepared" onchange="_simRecalc()">${_simPreparedOptions(_simDraft.preparedBy || '')}</select></div>
        </div>
        <div class="sim-field"><label>Klient</label>
          <select id="sim-client" onchange="_simClientChanged()">
            <option value="">— wybierz —</option>
            ${clients.map(c => `<option value="${c.id}" ${String(_simDraft.clientId) === String(c.id) ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
          </select></div>
        <div class="sim-field"><label>Obiekt</label>
          <select id="sim-object" onchange="_simObjectChanged()">${_simObjectOptions(_simDraft.clientId, _simDraft.objectId)}</select></div>

        <div class="sim-field"><label>Wariant rozliczenia</label>
          <select id="sim-settlement" onchange="_simSettlementChanged()">
            ${Object.keys(SimulationsModule.SETTLEMENTS).map(k =>
              `<option value="${k}" ${(_simDraft.settlementType || 'DEPOSIT') === k ? 'selected' : ''}>${SimulationsModule.SETTLEMENTS[k].label}</option>`).join('')}
          </select></div>
        <p id="sim-settlement-desc" style="font-size:11px;color:var(--color-text-secondary);margin:-4px 0 12px;">
          ${SimulationsModule.SETTLEMENTS[_simDraft.settlementType || 'DEPOSIT'].desc}</p>

        <div class="sim-g2">
          <div class="sim-field" id="sim-fee-wrap" style="${(_simDraft.settlementType === 'FREE') ? 'display:none;' : ''}">
            <label id="sim-fee-label">${SimulationsModule.SETTLEMENTS[_simDraft.settlementType || 'DEPOSIT'].feeLabel}</label>
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
          <div class="sim-field" id="sim-lshare-wrap" style="${(_simDraft.settlementType || 'DEPOSIT') !== 'DEPOSIT' ? 'display:none;' : ''}">
            <label>Rata zwrotu kaucji [% oszcz./rok]</label>
            <input id="sim-lshare" type="number" step="0.1" min="0" max="100" value="${_simDraft.paybackReturnPct}" oninput="_simRecalc()"></div>
        </div>
        <p id="sim-lshare-hint" style="font-size:11px;color:var(--color-text-secondary);margin:0 0 12px;${(_simDraft.settlementType || 'DEPOSIT') !== 'DEPOSIT' ? 'display:none;' : ''}">
          Rata zwrotu: część oszczędności zwracana klientowi z udziału WaterAI — do wysokości kaucji
          (klient wpłaca kaucję, firma zwraca ją ze swojej części oszczędności).</p>

        <h4>Scenariusze (% oszczędności)</h4>
        <p style="font-size:11px;color:var(--color-text-secondary);margin:0 0 8px;">
          Kropka = scenariusz bazowy (trafia na okładkę i do podsumowania wykonawczego).</p>
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
    <div style="border:1px solid var(--color-border-tertiary);border-radius:8px;padding:8px;margin-bottom:8px;">
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;">
        <input type="radio" name="sim-base" title="Scenariusz bazowy" ${sc.base ? 'checked' : ''}
          onchange="_simDraft.scenarios.forEach((s,j)=>s.base=(j===${i}));_simRecalc(true)">
        <span class="sim-scen-dot" style="background:${_SIM_COLORS[i % 3]};"></span>
        <input style="width:52px;font-size:13px;" value="${escapeHtml(sc.label)}" oninput="_simDraft.scenarios[${i}].label=this.value;_simRecalc(true)">
        <input style="flex:1;font-size:13px;" type="number" step="0.1" min="0" max="100" value="${sc.savingsPct}"
          oninput="_simDraft.scenarios[${i}].savingsPct=Number(this.value)||0;_simRecalc(true)">
        <span style="font-size:12px;color:var(--color-text-secondary);">%</span>
        ${(_simDraft.scenarios.length > 1)
          ? `<button class="small-button" onclick="_simRemoveScenario(${i})" title="Usuń scenariusz">✕</button>` : ''}
      </div>
      <input style="width:100%;box-sizing:border-box;font-size:12px;" value="${escapeHtml(sc.note || '')}"
        placeholder="uzasadnienie scenariusza (opcjonalnie, trafi do dokumentu)"
        oninput="_simDraft.scenarios[${i}].note=this.value;_simRecalc(true)">
    </div>`).join('');
}

function _simClientChanged() {
  const sel = document.getElementById('sim-client');
  _simDraft.clientId = sel.value ? Number(sel.value) : '';
  _simDraft.objectId = '';
  document.getElementById('sim-object').innerHTML = _simObjectOptions(_simDraft.clientId, '');
  const numEl = document.getElementById('sim-number');
  if (numEl && !numEl.value && _simDraft.clientId) numEl.value = simSuggestNumber(_simDraft.clientId, null);
  _simRecalc();
}
window._simClientChanged = _simClientChanged;

function _simObjectChanged() {
  const objSel = document.getElementById('sim-object');
  const numEl = document.getElementById('sim-number');
  const objId = objSel.value ? Number(objSel.value) : '';
  // odśwież sugestię numeru tylko jeśli pole ma nadal automatyczny wzorzec SYM/… lub jest puste
  if (numEl && _simDraft.clientId && (!numEl.value || /^SYM\//.test(numEl.value)) && !_simEditId) {
    numEl.value = simSuggestNumber(_simDraft.clientId, objId || null);
  }
  _simRecalc();
}
window._simObjectChanged = _simObjectChanged;

function _simAddScenario() {
  const labels = ['A', 'B', 'C'];
  _simDraft.scenarios.push({ label: labels[_simDraft.scenarios.length] || '?', savingsPct: 18, note: '', base: false });
  simRerenderScenarioInputs();
  _simRecalc(true);
}
window._simAddScenario = _simAddScenario;

function _simRemoveScenario(i) {
  _simDraft.scenarios.splice(i, 1);
  if (_simDraft.scenarios.length && !_simDraft.scenarios.some(sc => sc.base)) _simDraft.scenarios[0].base = true;
  simRerenderScenarioInputs();
  _simRecalc(true);
}
window._simRemoveScenario = _simRemoveScenario;

function simRerenderScenarioInputs() {
  const box = document.getElementById('sim-scenarios');
  if (box) box.innerHTML = _simScenarioInputs();
}

function _simSettlementChanged() {
  const sel = document.getElementById('sim-settlement');
  if (!sel) return;
  const t = sel.value;
  _simDraft.settlementType = t;
  const cfg = SimulationsModule.SETTLEMENTS[t] || SimulationsModule.SETTLEMENTS.DEPOSIT;
  const desc = document.getElementById('sim-settlement-desc');
  if (desc) desc.textContent = cfg.desc;
  const feeWrap = document.getElementById('sim-fee-wrap');
  const feeLbl = document.getElementById('sim-fee-label');
  if (feeWrap) feeWrap.style.display = (t === 'FREE') ? 'none' : '';
  if (feeLbl) feeLbl.textContent = cfg.feeLabel;
  const lWrap = document.getElementById('sim-lshare-wrap');
  const lHint = document.getElementById('sim-lshare-hint');
  if (lWrap) lWrap.style.display = (t === 'DEPOSIT') ? '' : 'none';
  if (lHint) lHint.style.display = (t === 'DEPOSIT') ? '' : 'none';
  if (t === 'FREE') { const inv = document.getElementById('sim-investment'); if (inv) inv.value = 0; }
  _simRecalc();
}
window._simSettlementChanged = _simSettlementChanged;

// skipForm=true: nie czytaj pól formularza (zmiana przyszła spoza inputów parametrów)
function _simRecalc(skipForm) {
  if (!_simDraft) return;
  if (!skipForm) {
    const g = id => document.getElementById(id);
    if (g('sim-name')) {
      _simDraft.name = g('sim-name').value;
      _simDraft.simNumber = g('sim-number').value.trim();
      _simDraft.preparedBy = g('sim-prepared').value.trim();
      _simDraft.objectId = g('sim-object').value ? Number(g('sim-object').value) : '';
      if (g('sim-settlement')) _simDraft.settlementType = g('sim-settlement').value;
      _simDraft.investment = Number(g('sim-investment').value) || 0;
      _simDraft.currency = g('sim-currency').value;
      _simDraft.heatingCost = Number(g('sim-heating').value) || 0;
      _simDraft.priceGrowthPct = Number(g('sim-growth').value) || 0;
      _simDraft.years = Number(g('sim-years').value) || 10;
      _simDraft.clientSharePct = Number(g('sim-kshare').value) || 0;
      _simDraft.paybackReturnPct = Number(g('sim-lshare').value) || 0;
      if (_simDraft.settlementType === 'FREE') _simDraft.investment = 0;
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
  if (!(_simDraft.heatingCost > 0)) { alert('Podaj roczny koszt ogrzewania (> 0).'); return; }
  if (!_simDraft.name) _simDraft.name = 'Symulacja — ' + _simCliName(_simDraft.clientId);
  if (!_simDraft.simNumber) _simDraft.simNumber = simSuggestNumber(_simDraft.clientId, _simDraft.objectId || null);
  if (_simEditId) SimulationsModule.update(_simEditId, _simDraft);
  else SimulationsModule.add(_simDraft);
  renderSimulationsModule();
}
window.simSave = simSave;

// ── 7. WYNIKI (panel „na żywo" w edytorze) ───────────────────────────────────

function _simCalcAll(sim) {
  return (sim.scenarios || []).map(sc => ({ ...simCalcScenario(sim, sc.savingsPct), label: sc.label, savingsPct: sc.savingsPct, note: sc.note || '', base: !!sc.base }));
}

function _simKpiCards(sim, results) {
  const cur = sim.currency || 'PLN';
  const inv = Number(sim.investment) || 0;
  const stType = sim.settlementType || 'DEPOSIT';
  const roiLbl = stType === 'FEE' ? 'ROI (zysk / opłata)' : 'ROI (zysk / kaucja)';
  return results.map((r, i) => `
    ${inv > 0 ? `<div class="sim-kpi" style="border-top:3px solid ${_SIM_COLORS[i % 3]};">
      <div class="v">${r.kpi.paybackYear ? ('rok ' + r.kpi.paybackYear) : '—'}</div>
      <div class="k">Payback · scen. ${escapeHtml(r.label)} (${_simFmt(r.savingsPct, 1)}%)</div>
    </div>` : `<div class="sim-kpi" style="border-top:3px solid ${_SIM_COLORS[i % 3]};">
      <div class="v">${_simFmt(r.kpi.totalSavings)} <span style="font-size:11px;">${cur}</span></div>
      <div class="k">Suma oszczędności · scen. ${escapeHtml(r.label)} (${_simFmt(r.savingsPct, 1)}%)</div>
    </div>`}
    <div class="sim-kpi" style="border-top:3px solid ${_SIM_COLORS[i % 3]};">
      <div class="v">${_simFmt(r.kpi.netProfit)} <span style="font-size:11px;">${cur}</span></div>
      <div class="k">Zysk netto klienta po ${_simYearsTxt(sim.years)}</div>
    </div>
    <div class="sim-kpi" style="border-top:3px solid ${_SIM_COLORS[i % 3]};">
      <div class="v">${inv > 0 ? ('×' + _simFmt(r.kpi.roi, 2)) : '—'}</div>
      <div class="k">${roiLbl}</div>
    </div>
    <div class="sim-kpi" style="border-top:3px solid ${_SIM_COLORS[i % 3]};">
      <div class="v">${r.kpi.cagr === null ? '—' : _simPct(r.kpi.cagr)}</div>
      <div class="k">CAGR</div>
    </div>`).join('');
}

function _simScenTables(sim, results) {
  const cur = sim.currency || 'PLN';
  const inv = Number(sim.investment) || 0;
  const stType = sim.settlementType || 'DEPOSIT';
  const showReturn = stType === 'DEPOSIT';   // kolumna „Rata zwrotu" tylko dla kaucji
  const vsLbl = stType === 'FEE' ? 'Wynik vs opłata' : (stType === 'FREE' ? 'Zysk narastająco' : 'Wynik vs kaucja');
  const zeroLbl = stType === 'FEE' ? 'rok zwrotu opłaty' : 'rok zwrotu kaucji';
  return results.map((r, i) => `
    <div class="sim-scen-hdr">
      <span class="sim-scen-dot" style="background:${_SIM_COLORS[i % 3]};"></span>
      <strong style="font-size:13px;">Scenariusz ${escapeHtml(r.label)} — oszczędność ${_simFmt(r.savingsPct, 1)}%${r.base ? ' · bazowy' : ''}</strong>
    </div>
    <div style="overflow-x:auto;border:1px solid var(--color-border-tertiary);border-radius:8px;margin-bottom:6px;">
      <table class="sim-t"><thead><tr>
        <th>Rok</th><th>Koszt ogrzewania</th><th>Oszczędności</th><th>Udział klienta</th>
        ${showReturn ? '<th>Rata zwrotu</th>' : ''}<th>Wpływy klienta</th><th>Narastająco</th><th>${vsLbl}</th>${inv > 0 ? '<th>ROI</th>' : ''}
      </tr></thead><tbody>
      ${r.rows.map(row => `<tr ${inv > 0 && r.kpi.paybackYear === row.year ? `class="sim-pb" title="${zeroLbl}"` : ''}>
        <td>${row.year}</td><td>${_simFmt(row.E)}</td><td>${_simFmt(row.F)}</td><td>${_simFmt(row.K)}</td>
        ${showReturn ? `<td>${_simFmt(row.M)}</td>` : ''}<td>${_simFmt(row.G)}</td><td>${_simFmt(row.H)}</td>
        <td style="color:${row.I >= 0 ? '#27500A' : '#c00'};font-weight:600;">${_simFmt(row.I)}</td>
        ${inv > 0 ? `<td>×${_simFmt(row.roi, 2)}</td>` : ''}</tr>`).join('')}
      </tbody></table></div>
    <p style="font-size:10px;color:var(--color-text-secondary);margin:0 0 14px;">Kwoty w ${cur} netto.${inv > 0 ? ' Wiersz zielony = ' + zeroLbl + '.' : ''}</p>`).join('');
}

function _simResultsHtml(sim, cid) {
  const results = _simCalcAll(sim);
  if (!results.length) return '<div class="reminder-card"><strong>Dodaj co najmniej jeden scenariusz.</strong></div>';
  return `
    <div class="sim-kpis">${_simKpiCards(sim, results)}</div>
    <canvas id="${cid}-line" class="sim-cv"></canvas>
    <div style="height:12px;"></div>
    <canvas id="${cid}-bars" class="sim-cv-bar"></canvas>
    <div style="height:6px;"></div>
    ${_simScenTables(sim, results)}`;
}

// ── 8. DOKUMENT (podgląd / druk w stylu raportu ESCO) ────────────────────────

function _simSection(no, title, inner) {
  return `<div class="sim-sec">
    <div class="sim-sec-h"><span class="n">${no}</span><h3>${title}</h3></div>${inner}</div>`;
}

// Sekcja 2 — statyczny opis metod pomiaru i rozliczania (zawsze ten sam).
function _simMethodsHtml() {
  return `
    <p class="sim-desc">Symulacja pokazuje potencjał finansowy wdrożenia. Rzeczywiste oszczędności — po uruchomieniu systemu — są mierzone i rozliczane według jednej z poniższych metod, uzgodnionej w umowie ESCO, a wynik każdorazowo weryfikowany niezależnym dowodem technicznym (regresja liniowa). Dokładnie w ten sposób powstają cykliczne raporty rozliczeniowe ESCO, które klient otrzymuje po każdym zamkniętym okresie.</p>

    <div class="sim-method">
      <h5>Korekta TYM — stopniodni <span class="tag">metoda domyślna</span></h5>
      <p>Zużycie okresu bazowego (PRZED) i okresu po wdrożeniu (PO) jest przeliczane do identycznych, standardowych warunków pogodowych Typowego Roku Meteorologicznego z użyciem stopniodni grzewczych (HDD). Eliminuje wpływ różnic klimatycznych między sezonami — porównujemy jabłka z jabłkami, niezależnie od tego, czy zima była łagodna, czy sroga.</p>
      <div class="sim-formula">Qs = Q<sub>c.o.</sub> · φ&nbsp;&nbsp;&nbsp;gdzie&nbsp;&nbsp;φ = ΣSD<sub>std</sub> / ΣSD<sub>rzecz</sub></div>
    </div>

    <div class="sim-method">
      <h5>Korekta obłożenia</h5>
      <p>Dla obiektów o zmiennym obłożeniu (hotele, pensjonaty, obiekty opieki) zużycie odnosi się do rzeczywistej liczby osobodób. Wynik nie jest zaburzony przez sezonowość gości — mierzymy sprawność energetyczną, nie frekwencję.</p>
      <div class="sim-formula">q = Q / liczba osobodób w okresie</div>
    </div>

    <div class="sim-method">
      <h5>Korekta powierzchni</h5>
      <p>Gdy między okresami zmienia się powierzchnia ogrzewana (rozbudowa, wyłączenie skrzydła, zmiana najemców), zużycie przelicza się na metr kwadratowy rzeczywiście ogrzewanej powierzchni.</p>
      <div class="sim-formula">q = Q / m² powierzchni ogrzewanej</div>
    </div>

    <div class="sim-method">
      <h5>Korekta intensywności</h5>
      <p>Porównanie jednostkowego zużycia energii przypadającego na jeden standardowy stopniodzień. Pozwala zestawiać okresy o różnej długości i różnym przebiegu pogody na wspólnej, znormalizowanej bazie.</p>
      <div class="sim-formula">q = Qs / ΣSD<sub>std</sub></div>
    </div>

    <div class="sim-method">
      <h5>Korekta harmonogramu</h5>
      <p>Dla obiektów o zmiennym trybie pracy (szkoły, biura, hale produkcyjne) zużycie normalizuje się do rzeczywistych dni i godzin pracy instalacji — dni wolne, przerwy i zmiany harmonogramu nie zniekształcają wyniku.</p>
    </div>

    <div class="sim-method">
      <h5>Metoda niestandardowa</h5>
      <p>Uzgodniona umownie kombinacja powyższych korekt, dopasowana do specyfiki obiektu i dostępnych danych pomiarowych — stosowana tam, gdzie pojedyncza korekta nie oddaje charakteru eksploatacji.</p>
    </div>

    <div class="sim-method proof">
      <h5>Dowód techniczny — regresja liniowa</h5>
      <p>Niezależnie od metody rozliczeniowej każdy wynik jest weryfikowany analizą regresji liniowej na ciągłych odczytach czujników (co 10 minut: temperatura zewnętrzna, temperatura zasilania, zużycie). Dla okresów PRZED i PO wyznacza się charakterystyki pracy obiektu, a porównanie prostych izoluje czysty efekt sterowania — to dowód inżynierski, niezależny od danych rozliczeniowych z liczników i faktur.</p>
      <div class="sim-formula">y = a·x + b&nbsp;&nbsp;&nbsp;(osobno dla okresu PRZED i PO)</div>
    </div>

    <p class="sim-desc" style="margin-top:10px;">Podstawą faktur są wyłącznie zamknięte okresy rozliczeniowe, rozliczone metodą zapisaną w umowie ESCO i udokumentowane raportem rozliczeniowym z pełną częścią dowodową.</p>`;
}

function _simExecSummary(sim, results) {
  const cur = sim.currency || 'PLN';
  const inv = Number(sim.investment) || 0;
  const stType = sim.settlementType || 'DEPOSIT';
  const bs = results.find(r => r.base) || results[0];
  const effPct = Math.min(100, (Number(sim.clientSharePct) || 0) + (Number(sim.paybackReturnPct) || 0));
  const objTxt = sim.objectId ? (' w obiekcie ' + escapeHtml(_simObjName(sim.objectId))) : '';

  let s1 = `W horyzoncie ${sim.years} lat, przy założeniu oszczędności ${_simFmt(bs.savingsPct, 1)}% (scenariusz bazowy ${escapeHtml(bs.label)}), `
    + `system WaterAI wygeneruje${objTxt} oszczędności o łącznej wartości około ${_simFmt(bs.kpi.totalSavings)} ${cur} netto. `
    + `Z tej kwoty wpływy klienta wyniosą ${_simFmt(bs.kpi.totalInflows)} ${cur}`;
  if (stType === 'DEPOSIT' && inv > 0) {
    s1 += `, a wpłacona kaucja ${_simFmt(inv)} ${cur} zostanie zwrócona ${bs.kpi.paybackYear ? ('w roku ' + bs.kpi.paybackYear) : 'poza przyjętym horyzontem'} — `
      + `do czasu jej zwrotu klient otrzymuje efektywnie ${_simFmt(effPct, 1)}% generowanych oszczędności, później ${_simFmt(sim.clientSharePct, 1)}%. `
      + `Zysk netto klienta po ${_simYearsTxt(sim.years)} wynosi ${_simFmt(bs.kpi.netProfit)} ${cur}`
      + (bs.kpi.cagr !== null ? ` (CAGR ${_simPct(bs.kpi.cagr)})` : '') + '.';
  } else if (stType === 'FEE' && inv > 0) {
    s1 += `. Klient wnosi jednorazową, bezzwrotną opłatę za wdrożenie ${_simFmt(inv)} ${cur} i od pierwszego roku otrzymuje stały udział ${_simFmt(sim.clientSharePct, 1)}% oszczędności; `
      + `opłata zwróci się ${bs.kpi.paybackYear ? ('w roku ' + bs.kpi.paybackYear) : 'poza przyjętym horyzontem'}. `
      + `Zysk netto klienta po ${_simYearsTxt(sim.years)} (po odjęciu opłaty) wynosi ${_simFmt(bs.kpi.netProfit)} ${cur}.`;
  } else {
    s1 += ` — klient nie ponosi żadnej opłaty wstępnej i od pierwszego roku otrzymuje stały udział ${_simFmt(sim.clientSharePct, 1)}% oszczędności, więc cała kwota stanowi czysty zysk netto.`;
  }

  let s2 = '';
  if (results.length > 1) {
    const sorted = results.slice().sort((a, b) => a.savingsPct - b.savingsPct);
    s2 = ` Zależnie od scenariusza (${_simFmt(sorted[0].savingsPct, 1)}–${_simFmt(sorted[sorted.length - 1].savingsPct, 1)}% oszczędności) `
      + `zysk netto klienta po ${_simYearsTxt(sim.years)} mieści się w przedziale od ${_simFmt(sorted[0].kpi.netProfit)} do ${_simFmt(sorted[sorted.length - 1].kpi.netProfit)} ${cur}.`;
  }
  const s3 = ` Sposób pomiaru i rozliczania osiągniętych oszczędności przedstawia sekcja 2 — po wdrożeniu wyniki są potwierdzane cyklicznymi raportami ESCO z pełną częścią dowodową.`;

  return `<p class="sim-desc">${s1}${s2}${s3}</p>`;
}

function _simComparisonHtml(sim, results) {
  const cur = sim.currency || 'PLN';
  const inv = Number(sim.investment) || 0;
  const stType = sim.settlementType || 'DEPOSIT';
  const paybackLbl = stType === 'FEE' ? 'Payback (rok zwrotu opłaty)' : 'Payback (rok zwrotu kaucji)';
  const roiLbl = stType === 'FEE' ? 'ROI (zysk / opłata)' : 'ROI (zysk / kaucja)';
  const th = results.map((r, i) => `<th style="color:${_SIM_COLORS[i % 3]};">Scen. ${escapeHtml(r.label)} (${_simFmt(r.savingsPct, 1)}%)${r.base ? ' ·bazowy' : ''}</th>`).join('');
  const row = (label, fn) => `<tr><td>${label}</td>${results.map(r => `<td>${fn(r)}</td>`).join('')}</tr>`;
  return `
    <div style="overflow-x:auto;border:1px solid var(--color-border-tertiary);border-radius:8px;">
    <table class="sim-t sim-cmp"><thead><tr><th>Wskaźnik</th>${th}</tr></thead><tbody>
      ${inv > 0 ? row(paybackLbl, r => r.kpi.paybackYear ? ('rok ' + r.kpi.paybackYear) : '—') : ''}
      ${row('Suma wygenerowanych oszczędności [' + cur + ']', r => _simFmt(r.kpi.totalSavings))}
      ${row('Łączne wpływy klienta [' + cur + ']', r => _simFmt(r.kpi.totalInflows))}
      ${row('Zysk netto klienta [' + cur + ']', r => _simFmt(r.kpi.netProfit))}
      ${inv > 0 ? row(roiLbl, r => '×' + _simFmt(r.kpi.roi, 2)) : ''}
      ${inv > 0 ? row('CAGR', r => r.kpi.cagr === null ? '—' : _simPct(r.kpi.cagr)) : ''}
    </tbody></table></div>`;
}

function _simMechanismHtml(sim, results) {
  const cur = sim.currency || 'PLN';
  const inv = Number(sim.investment) || 0;
  const stType = sim.settlementType || 'DEPOSIT';
  const setl = SimulationsModule.SETTLEMENTS[stType] || SimulationsModule.SETTLEMENTS.DEPOSIT;
  const k = Number(sim.clientSharePct) || 0, l = Number(sim.paybackReturnPct) || 0;
  const bs = results.find(r => r.base) || results[0];
  const r1 = bs.rows[0];

  let variantTxt, formula;
  if (stType === 'DEPOSIT') {
    variantTxt = (inv > 0 && l > 0)
      ? `W wariancie „kaucja zwrotna” klient wpłaca zwrotną kaucję ${_simFmt(inv)} ${cur}. Do czasu jej zwrotu otrzymuje podwyższony udział: swój stały ${_simFmt(k, 1)}% oszczędności powiększony o ratę zwrotu ${_simFmt(l, 1)}% (łącznie efektywnie ${_simFmt(Math.min(100, k + l), 1)}%), aż kaucja zostanie zwrócona w całości. Po zwrocie obowiązuje docelowy podział ${_simFmt(k, 1)}% / ${_simFmt(100 - k, 1)}%.`
      : `W wariancie „kaucja zwrotna” klient otrzymuje stały udział ${_simFmt(k, 1)}% / ${_simFmt(100 - k, 1)}% od pierwszego roku.`;
    formula = `<div class="sim-formula">Rok 1 (scenariusz ${escapeHtml(bs.label)}): oszczędność ${_simFmt(r1.F)} ${cur} → udział klienta ${_simFmt(k, 1)}% = ${_simFmt(r1.K)} ${cur}
      &nbsp;·&nbsp; rata zwrotu kaucji = ${_simFmt(r1.M)} ${cur} &nbsp;→&nbsp; <strong>wpływy klienta ${_simFmt(r1.G)} ${cur}</strong></div>`;
  } else if (stType === 'FEE') {
    variantTxt = `W wariancie „opłata niezwrotna” klient wnosi jednorazową, bezzwrotną opłatę za wdrożenie ${_simFmt(inv)} ${cur} i od pierwszego roku otrzymuje ustalony udział ${_simFmt(k, 1)}% w oszczędnościach. Opłata jest kosztem początkowym — łączny wynik klienta liczony jest po jej odjęciu; zwraca się w momencie, gdy skumulowany udział w oszczędnościach ją pokryje.`;
    formula = `<div class="sim-formula">Rok 1 (scenariusz ${escapeHtml(bs.label)}): oszczędność ${_simFmt(r1.F)} ${cur} → <strong>udział klienta ${_simFmt(k, 1)}% = ${_simFmt(r1.K)} ${cur}</strong>&nbsp;·&nbsp; opłata wstępna ${_simFmt(inv)} ${cur} (jednorazowo)</div>`;
  } else { // FREE
    variantTxt = `W wariancie „bez opłat” klient nie ponosi żadnej opłaty wstępnej i od pierwszego roku otrzymuje ustalony udział ${_simFmt(k, 1)}% w oszczędnościach. Całość jego wpływów stanowi czysty zysk.`;
    formula = `<div class="sim-formula">Rok 1 (scenariusz ${escapeHtml(bs.label)}): oszczędność ${_simFmt(r1.F)} ${cur} → <strong>wpływy klienta ${_simFmt(r1.K)} ${cur}</strong> (udział ${_simFmt(k, 1)}%, bez opłaty)</div>`;
  }

  return `
    <p class="sim-desc">Model ESCO oznacza, że wynagrodzenie WaterAI pochodzi wyłącznie z realnie osiągniętych i udowodnionych oszczędności — bez oszczędności nie ma opłat. ${variantTxt}</p>
    ${formula}
    <div class="sim-steps">
      <div class="sim-step"><div class="no">1</div><div class="t">Audyt i symulacja</div><div class="d">Analiza obiektu i kosztów, prognoza potencjału — niniejszy dokument.</div></div>
      <div class="sim-step"><div class="no">2</div><div class="t">Umowa ESCO</div><div class="d">Ustalenie metody rozliczeniowej, udziałów i okresu bazowego.</div></div>
      <div class="sim-step"><div class="no">3</div><div class="t">Montaż i okres bazowy</div><div class="d">Instalacja systemu, rejestracja charakterystyki odniesienia.</div></div>
      <div class="sim-step"><div class="no">4</div><div class="t">Aktywacja optymalizacji</div><div class="d">Uruchomienie sterowania WaterAI, ciągły pomiar co 10 minut.</div></div>
      <div class="sim-step"><div class="no">5</div><div class="t">Raporty i rozliczenia</div><div class="d">Cykliczne raporty ESCO z częścią dowodową — podstawa rozliczeń.</div></div>
    </div>`;
}

function _simDocHtml(sim) {
  const results = _simCalcAll(sim);
  if (!results.length) return '<div class="reminder-card"><strong>Dodaj co najmniej jeden scenariusz.</strong></div>';
  const cur = sim.currency || 'PLN';
  const inv = Number(sim.investment) || 0;
  const stType = sim.settlementType || 'DEPOSIT';
  const setl = SimulationsModule.SETTLEMENTS[stType] || SimulationsModule.SETTLEMENTS.DEPOSIT;
  const st = SimulationsModule.STATUSES[sim.status] || SimulationsModule.STATUSES.DRAFT;
  const bs = results.find(r => r.base) || results[0];
  const c = _simCli(sim.clientId);
  const addr = _simCliAddr(c);
  const today = new Date().toLocaleDateString('pl-PL');
  const created = sim.createdAt ? sim.createdAt.slice(0, 10) : '—';

  // Hero + kafle okładki. payback ma sens tylko gdy jest opłata/kaucja (inv>0).
  const paybackLbl = stType === 'FEE' ? 'Zwrot opłaty<br>(payback)' : 'Zwrot kaucji<br>(payback)';
  const hero = inv > 0
    ? `<div class="sim-hero"><div class="sim-hero-lbl">${paybackLbl}</div>
       <div class="sim-hero-val">${bs.kpi.paybackYear ? ('rok ' + bs.kpi.paybackYear) : '> ' + sim.years + ' lat'}</div></div>`
    : `<div class="sim-hero"><div class="sim-hero-lbl">Zysk netto klienta<br>po ${_simYearsTxt(sim.years)}</div>
       <div class="sim-hero-val">${_simFmt(bs.kpi.netProfit)}<span>${cur}</span></div></div>`;

  const coverKpis = inv > 0
    ? `<div class="sim-cover-kpi"><div class="v">${_simFmt(bs.kpi.netProfit)} <span>${cur}</span></div><div class="k">Zysk netto klienta po ${_simYearsTxt(sim.years)}</div></div>
       <div class="sim-cover-kpi"><div class="v">${_simFmt(bs.kpi.totalInflows)} <span>${cur}</span></div><div class="k">Łączne wpływy klienta</div></div>
       <div class="sim-cover-kpi"><div class="v">${bs.kpi.cagr === null ? '—' : _simPct(bs.kpi.cagr)}</div><div class="k">CAGR</div></div>`
    : `<div class="sim-cover-kpi"><div class="v">${_simFmt(bs.kpi.totalSavings)} <span>${cur}</span></div><div class="k">Suma wygenerowanych oszczędności</div></div>
       <div class="sim-cover-kpi"><div class="v">${_simFmt(bs.kpi.totalInflows)} <span>${cur}</span></div><div class="k">Łączne wpływy klienta</div></div>
       <div class="sim-cover-kpi"><div class="v">${_simFmt(sim.clientSharePct, 1)}%</div><div class="k">Udział klienta w oszczędnościach</div></div>`;

  const cover = `
    <div class="sim-cover">
      <div class="sim-cover-head">
        <img src="logo-waterai.png" alt="WaterAI" class="sim-cover-logo" />
        <div class="sim-cover-num"><div class="sim-cover-num-lbl">Nr symulacji</div>
          <div class="sim-cover-num-val">${escapeHtml(sim.simNumber || '—')}</div></div>
      </div>
      <div><span class="sim-cover-kicker">Symulacja oszczędności · Prognoza ESCO</span></div>
      <h1>Symulacja oszczędności energii</h1>
      <div class="sim-cover-sub">Wieloletnia prognoza efektu wdrożenia systemu WaterAI — potencjał finansowy, scenariusze oraz metodyka pomiaru i rozliczania oszczędności w modelu ESCO</div>
      <div class="sim-cover-meta">
        <div class="sim-cm-card"><div class="sim-cm-lbl">Dla kogo</div>
          <div class="sim-cm-val">${escapeHtml(_simCliName(sim.clientId))}</div>
          ${addr ? `<div class="sim-cm-sub">${escapeHtml(addr)}</div>` : ''}
          ${c && c.vatId ? `<div class="sim-cm-sub">NIP/IČO: ${escapeHtml(c.vatId)}</div>` : ''}
          ${sim.objectId ? `<div class="sim-cm-sub">Obiekt: ${escapeHtml(_simObjName(sim.objectId))}</div>` : ''}</div>
        <div class="sim-cm-card"><div class="sim-cm-lbl">Sporządził</div>
          <div class="sim-cm-val">${escapeHtml(sim.preparedBy || '—')}</div>
          <div class="sim-cm-sub">Data utworzenia: ${created}</div></div>
        <div class="sim-cm-card"><div class="sim-cm-lbl">Założenia główne</div>
          <div class="sim-cm-val">${_simFmt(sim.heatingCost)} ${cur}/rok</div>
          <div class="sim-cm-sub">koszt ogrzewania · wzrost cen ${_simFmt(sim.priceGrowthPct, 2)}%/rok · horyzont ${sim.years} lat</div>
          ${setl.feeLabel !== '—' ? `<div class="sim-cm-sub">${setl.feeLabel}: ${_simFmt(inv)} ${cur}</div>` : `<div class="sim-cm-sub">Bez opłaty wstępnej</div>`}
          <div class="sim-cm-sub">Scenariuszy: ${results.length} · bazowy ${escapeHtml(bs.label)} (${_simFmt(bs.savingsPct, 1)}%)</div></div>
        <div class="sim-cm-card"><div class="sim-cm-lbl">Rozliczenie i status</div>
          <div class="sim-cm-val">${setl.label}</div>
          <div class="sim-cm-sub" style="margin-top:6px;"><span style="font-size:12px;font-weight:700;padding:3px 12px;border-radius:20px;background:${st.bg};color:${st.color};">${st.label}</span></div></div>
      </div>
      <div class="sim-cover-result">
        <div class="sim-cover-result-head">Wynik prognozy — scenariusz bazowy</div>
        ${hero}
        <div class="sim-cover-kpis">${coverKpis}</div>
      </div>
      <div class="sim-cover-foot">
        <div>System <strong>WaterAI Energy Control</strong> · Utworzono: ${created} · Wydruk z dnia: ${today}</div>
        <div>control.waterai.cloud</div>
      </div>
    </div>`;

  const s3 = `
    <table class="sim-params"><tbody>
      <tr><td>Wariant rozliczenia</td><td>${setl.label}</td></tr>
      <tr><td>Roczny koszt ogrzewania (rok 1)</td><td>${_simFmt(sim.heatingCost)} ${cur}</td></tr>
      <tr><td>Roczny wzrost cen energii</td><td>${_simFmt(sim.priceGrowthPct, 2)}%</td></tr>
      ${setl.feeLabel !== '—' ? `<tr><td>${setl.feeLabel}</td><td>${_simFmt(inv)} ${cur}</td></tr>` : `<tr><td>Opłata wstępna</td><td>brak</td></tr>`}
      <tr><td>Udział klienta w oszczędnościach</td><td>${_simFmt(sim.clientSharePct, 1)}%</td></tr>
      ${stType === 'DEPOSIT' ? `<tr><td>Rata zwrotu kaucji</td><td>${_simFmt(sim.paybackReturnPct, 1)}% oszczędności / rok</td></tr>` : ''}
      <tr><td>Horyzont symulacji</td><td>${sim.years} lat</td></tr>
      <tr><td>Waluta</td><td>${cur}</td></tr>
    </tbody></table>
    <div style="height:12px;"></div>
    ${results.map((r, i) => `<div class="sim-scen-chip">
      <span class="sim-scen-dot" style="background:${_SIM_COLORS[i % 3]};"></span>
      <span class="pct">${escapeHtml(r.label)}: ${_simFmt(r.savingsPct, 1)}%</span>
      ${r.base ? '<span class="base">bazowy</span>' : ''}
      ${r.note ? `<span class="note">${escapeHtml(r.note)}</span>` : ''}
    </div>`).join('')}
    <p class="sim-footnote">Parametry przyjęto ręcznie na podstawie danych klienta i doświadczeń z obiektów referencyjnych; wartości można zweryfikować po udostępnieniu faktur i danych pomiarowych.</p>`;

  const s4 = `
    <div class="sim-kpis">${_simKpiCards(sim, results)}</div>
    <canvas id="sim-doc-line" class="sim-cv"></canvas>
    <div style="height:12px;"></div>
    <canvas id="sim-doc-bars" class="sim-cv-bar"></canvas>
    <div style="height:8px;"></div>
    ${_simScenTables(sim, results)}`;

  const s7 = `
    <p class="sim-footnote">Dokument ma charakter poglądowy. Przedstawione wartości są prognozą opartą na przyjętych założeniach (roczny koszt ogrzewania, wzrost cen energii, zakładany procent oszczędności) i nie stanowią oferty w rozumieniu Kodeksu cywilnego ani gwarancji wyniku. Rzeczywiste rozliczenia będą dokonywane wyłącznie za zamknięte okresy rozliczeniowe, metodą opisaną w sekcji 2 i zapisaną w umowie ESCO, na podstawie zmierzonych danych, i dokumentowane cyklicznymi raportami rozliczeniowymi. WaterAI Energy Control.</p>
    ${sim.notes ? `<p class="sim-desc" style="margin-top:8px;"><strong>Notatki:</strong> ${escapeHtml(sim.notes)}</p>` : ''}`;

  return cover
    + _simSection(1, 'Podsumowanie wykonawcze', _simExecSummary(sim, results))
    + _simSection(2, 'Jak zmierzymy i udowodnimy oszczędności', _simMethodsHtml())
    + _simSection(3, 'Założenia symulacji i scenariusze', s3)
    + _simSection(4, 'Wyniki scenariuszy', s4)
    + _simSection(5, 'Porównanie scenariuszy', _simComparisonHtml(sim, results))
    + _simSection(6, 'Mechanizm rozliczenia ESCO i dalsze kroki', _simMechanismHtml(sim, results))
    + _simSection(7, 'Zastrzeżenia', s7);
}

function simView(id) {
  const sim = SimulationsModule.find(id);
  const container = document.getElementById('module-content');
  if (!sim || !container) return;

  container.innerHTML = SIM_STYLE + `
    <div class="sim-noprint" style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap;">
      <button class="small-button" onclick="renderSimulationsModule()">← Lista symulacji</button>
      <div style="display:flex;gap:8px;">
        ${_simIsStaff() ? `<button class="small-button" onclick="simEdit(${sim.id})">✏️ Edytuj</button>` : ''}
        <button class="primary-button" onclick="simPrintPDF()" style="font-size:13px;padding:9px 18px;">🖨 Drukuj / PDF</button>
      </div>
    </div>
    <div id="sim-print">${_simDocHtml(sim)}</div>`;

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
