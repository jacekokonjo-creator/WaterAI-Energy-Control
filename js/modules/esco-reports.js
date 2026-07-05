// WaterAI Energy Control
// EscoReportsModule v1.0.0 + magazyny okresów bazowych i baz intensywności.
// Spłata długu technicznego: raporty ESCO dotąd żyły jako bezpośredni localStorage
// w app-v2.js — teraz mają moduł na wspólnym mostku (tabela esco_reports).
// BasePeriodModule i IntensityBaseModule (definiowane w app-v2.js) delegują
// get/save do magazynów poniżej.

function _mkStore(cfg, fallbackKey) {
  if (window.WaterAIBridge && WaterAIBridge.makeStore) return WaterAIBridge.makeStore(cfg);
  console.warn('[' + cfg.table + '] Brak WaterAIBridge — tryb lokalny.');
  return {
    storageKey: fallbackKey,
    async load() {},
    getAll() { return JSON.parse(localStorage.getItem(this.storageKey) || '[]'); },
    saveAll(x) { localStorage.setItem(this.storageKey, JSON.stringify(x)); },
    legacyIdForRow() { return null; }
  };
}

const EscoReportsModule = _mkStore({
  table: 'esco_reports',
  storageKey: 'waterai_esco_reports_v1',
  label: 'raportów ESCO',
  fk:  { column: 'client_id', prop: 'clientId', module: () => window.ClientsModule },
  fk2: { column: 'object_id', prop: 'objectId', module: () => window.ObjectsModule }
}, 'waterai_esco_reports_v1');
window.EscoReportsModule = EscoReportsModule;

window._basePeriodsStore = _mkStore({
  table: 'base_periods',
  storageKey: 'waterai_base_periods_v1',
  label: 'okresów bazowych',
  fk: { column: 'object_id', prop: 'objectId', module: () => window.ObjectsModule }
}, 'waterai_base_periods_v1');

window._intensityStore = _mkStore({
  table: 'intensity_bases',
  storageKey: 'waterai_intensity_base_v1',
  label: 'baz intensywności'
}, 'waterai_intensity_base_v1');


// ── Magazyn danych regresji (tabela regression_sensors: 1 wiersz = 1 obiekt) ──
// data = { protocols: [...], rows: { "<protocolId>": [...odczyty czujników] } }.
// Ciche dosłanie: przy pierwszym load() dane lokalne obiektów nieobecnych w bazie
// są wysyłane automatycznie (bez dialogu). Lustro w starych kluczach localStorage
// utrzymuje działanie BackupModule i trybu offline.
window._regressionStore = {
  _cache: null,          // legacyOid -> { protocols: [], rows: {} }
  _pidToOid: {},
  _protoKey: oid => 'waterai_regression_protocols_' + oid,
  _rowsKey:  pid => 'waterai_regression_rows_' + pid,
  _sb() { return (window.WaterAISupabase && WaterAISupabase.client) || null; },
  _localList(oid) { try { return JSON.parse(localStorage.getItem(this._protoKey(oid)) || '[]'); } catch (e) { return []; } },
  _localRows(pid) { try { return JSON.parse(localStorage.getItem(this._rowsKey(pid)) || '[]'); } catch (e) { return []; } },
  _mirror(oid) {
    const e = this._cache && this._cache[oid]; if (!e) return;
    try {
      localStorage.setItem(this._protoKey(oid), JSON.stringify(e.protocols || []));
      Object.keys(e.rows || {}).forEach(pid => localStorage.setItem(this._rowsKey(pid), JSON.stringify(e.rows[pid])));
    } catch (err) { /* limit pamięci — dane i tak są w bazie */ }
  },
  _register(oid, protocols) { (protocols || []).forEach(p => { this._pidToOid[String(p.id)] = String(oid); }); },

  async load() {
    const sb = this._sb();
    this._cache = {}; this._pidToOid = {};
    if (sb) {
      const { data, error } = await sb.from('regression_sensors').select('object_id, data');
      if (!error) {
        (data || []).forEach(r => {
          const legacy = (window.ObjectsModule && ObjectsModule.legacyIdForRow) ? ObjectsModule.legacyIdForRow(r.object_id) : null;
          if (legacy === null) return;
          const oid = String(legacy);
          this._cache[oid] = { protocols: (r.data && r.data.protocols) || [], rows: (r.data && r.data.rows) || {} };
          this._register(oid, this._cache[oid].protocols);
          this._mirror(oid);
        });
      } else {
        console.warn('[regression_sensors] Baza niedostępna:', error.message);
      }
    }
    // ciche dosłanie lokalnych danych obiektów nieobecnych w bazie
    const localOids = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.indexOf('waterai_regression_protocols_') === 0 && k.indexOf('migrated') === -1)
        localOids.push(k.slice('waterai_regression_protocols_'.length));
    }
    for (const oid of localOids) {
      if (this._cache[oid]) continue;
      const protocols = this._localList(oid);
      if (!protocols.length) continue;
      const rows = {};
      protocols.forEach(p => { rows[String(p.id)] = this._localRows(p.id); });
      this._cache[oid] = { protocols, rows };
      this._register(oid, protocols);
      console.log('[regression_sensors] Dosyłam lokalne dane obiektu', oid, '(' + protocols.length + ' protokołów)');
      await this._persist(oid);
    }
  },

  async _persist(oid) {
    const sb = this._sb(); if (!sb) return;
    const uuid = (window.ObjectsModule && ObjectsModule._rowIds) ? ObjectsModule._rowIds[String(oid)] : null;
    if (!uuid) { console.warn('[regression_sensors] Obiekt', oid, 'nie jest w bazie — pomijam.'); return; }
    const { error } = await sb.from('regression_sensors').upsert({ object_id: uuid, data: this._cache[oid] });
    if (error) alert('Nie udało się zapisać danych regresji w bazie: ' + error.message + '\nZmiany pozostały lokalnie.');
  },

  getProtocols(oid) {
    oid = String(oid);
    if (this._cache && (oid in this._cache)) return JSON.parse(JSON.stringify(this._cache[oid].protocols));
    return this._localList(oid);
  },
  saveProtocols(oid, list) {
    oid = String(oid);
    if (this._cache === null) { localStorage.setItem(this._protoKey(oid), JSON.stringify(list)); return; }
    if (!this._cache[oid]) this._cache[oid] = { protocols: [], rows: {} };
    this._cache[oid].protocols = list || [];
    this._register(oid, list);
    this._mirror(oid);
    this._persist(oid);
  },
  getRows(pid) {
    const oid = this._pidToOid[String(pid)];
    if (oid && this._cache && this._cache[oid]) return JSON.parse(JSON.stringify(this._cache[oid].rows[String(pid)] || []));
    return this._localRows(pid);
  },
  saveRows(pid, rows) {
    let oid = this._pidToOid[String(pid)];
    if (!oid && this._cache) {
      for (const o in this._cache)
        if ((this._cache[o].protocols || []).some(p => String(p.id) === String(pid))) { oid = o; this._pidToOid[String(pid)] = o; break; }
    }
    if (!oid || this._cache === null) { localStorage.setItem(this._rowsKey(pid), JSON.stringify(rows)); return; }
    this._cache[oid].rows[String(pid)] = rows || [];
    this._mirror(oid);
    this._persist(oid);
  },
  removeRows(pid) {
    const oid = this._pidToOid[String(pid)];
    try { localStorage.removeItem(this._rowsKey(pid)); } catch (e) {}
    if (oid && this._cache && this._cache[oid]) {
      delete this._cache[oid].rows[String(pid)];
      delete this._pidToOid[String(pid)];
      this._persist(oid);
    }
  }
};
