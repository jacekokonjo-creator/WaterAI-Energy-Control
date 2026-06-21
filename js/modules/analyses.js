// WaterAI Energy Control
// Analyses Module v1.0.0
// Rozszerzalny system typów analiz

const AnalysesModule = {
  storageKey: 'waterai_analyses_v1',

  TYPES: {
    TYM:        { label: 'Korekta TYM',             icon: '🌡️' },
    REGRESSION: { label: 'Regresja liniowa',         icon: '📈' },
    OCCUPANCY:  { label: 'Korekta obłożenia',        icon: '🏨' },
    AREA:       { label: 'Korekta powierzchni',       icon: '📐' },
    VOLUME:     { label: 'Korekta intensywności',     icon: '⚙️' },
    SCHEDULE:   { label: 'Korekta harmonogramu',      icon: '🕐' },
    CUSTOM:     { label: 'Metoda niestandardowa',     icon: '🔬' }
  },

  STATUSES: {
    DRAFT:    { label: 'Roboczy',    color: '#7A4A00' },
    COMPLETE: { label: 'Ukończony',  color: '#27500A' },
    APPROVED: { label: 'Zatwierdzony', color: '#0C447C' }
  },

  getAll() {
    return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
  },

  saveAll(items) {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  },

  add(analysis) {
    const items = this.getAll();
    items.push({
      id: Date.now(),
      createdAt: new Date().toISOString(),

      clientId: Number(analysis.clientId),
      objectId: Number(analysis.objectId),
      measurementIds: analysis.measurementIds || [],

      name: analysis.name || '',
      analysisType: analysis.analysisType || 'TYM',
      executedAt: analysis.executedAt || new Date().toISOString().slice(0, 10),
      author: analysis.author || '',
      status: analysis.status || 'DRAFT',

      inputParams: analysis.inputParams || {},
      results: analysis.results || {},
      chartData: analysis.chartData || {},
      comments: analysis.comments || '',
      customFields: analysis.customFields || {}
    });
    this.saveAll(items);
  },

  remove(id) {
    this.saveAll(this.getAll().filter(a => Number(a.id) !== Number(id)));
  },

  find(id) {
    return this.getAll().find(a => Number(a.id) === Number(id));
  },

  findByObject(objectId) {
    return this.getAll()
      .filter(a => Number(a.objectId) === Number(objectId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  findByClient(clientId) {
    return this.getAll()
      .filter(a => Number(a.clientId) === Number(clientId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  update(id, data) {
    this.saveAll(this.getAll().map(a => {
      if (Number(a.id) !== Number(id)) return a;
      return { ...a, ...data, updatedAt: new Date().toISOString() };
    }));
  },

  // Numer analizy = K{nr klienta}-{nr obiektu}/{kolejna pozycja wśród analiz tego obiektu}.
  // Przeliczany dynamicznie (rosnąco wg id), spójny ze schematem numeracji protokołów.
  getNumber(id) {
    const a = this.find(id);
    if (!a) return null;
    const siblings = this.getAll()
      .filter(x => Number(x.objectId) === Number(a.objectId))
      .sort((x, y) => Number(x.id) - Number(y.id));
    const idx = siblings.findIndex(x => Number(x.id) === Number(id));
    if (idx === -1) return null;
    const cn = (typeof ClientsModule !== 'undefined' && a.clientId) ? ClientsModule.getNumber(a.clientId) : null;
    const on = (typeof ObjectsModule !== 'undefined' && a.objectId) ? ObjectsModule.getNumber(a.objectId) : null;
    const seq = String(idx + 1).padStart(3, '0');
    return (cn && on) ? ('A/K' + cn + '-' + on + '/' + seq) : ('A/' + seq);
  }
};

window.AnalysesModule = AnalysesModule;
