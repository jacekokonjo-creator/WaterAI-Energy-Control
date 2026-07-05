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
