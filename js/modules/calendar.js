// WaterAI Energy Control
// Calendar Module v2.0.0 — Supabase (tabela `calendar_events`) przez mostek WaterAIBridge.
// Publiczne API bez zmian. Wcześniej: wyłącznie localStorage (limit 5 MB!).

const _calendarStore = (window.WaterAIBridge && WaterAIBridge.makeStore)
  ? WaterAIBridge.makeStore({
      table: 'calendar_events',
      storageKey: 'waterai_calendar_v1',
      label: 'wydarzeń kalendarza',
      fk2: { column: 'client_id', prop: 'clientId', module: () => window.ClientsModule }
    })
  : (console.warn('[CalendarModule] Brak WaterAIBridge — tryb lokalny (localStorage).'), {
      storageKey: 'waterai_calendar_v1',
      async load() {},
      getAll() { return JSON.parse(localStorage.getItem(this.storageKey) || '[]'); },
      saveAll(items) { localStorage.setItem(this.storageKey, JSON.stringify(items)); }
    });

const CalendarModule = {
  ..._calendarStore,

  EVENT_TYPES: {
    MEASUREMENT_DUE:  { label: 'Termin pomiarów',            icon: '📊', color: '#185FA5' },
    NEXT_READING:     { label: 'Termin odczytu',             icon: '🔢', color: '#185FA5' },
    ANALYSIS_DUE:     { label: 'Termin analizy',             icon: '📈', color: '#27500A' },
    PROTOCOL_DUE:     { label: 'Termin protokołu',           icon: '📋', color: '#27500A' },
    ESCO_REPORT_DUE:  { label: 'Termin raportu ESCO',        icon: '⚡', color: '#633806' },
    INVOICE_DUE:      { label: 'Termin wystawienia FV',      icon: '🧾', color: '#7A4A00' },
    PAYMENT_DUE:      { label: 'Termin płatności klienta',   icon: '💰', color: '#c00' },
    CONTRACT_EXPIRY:  { label: 'Wygaśnięcie umowy',          icon: '📃', color: '#c00' },
    INSPECTION:       { label: 'Przegląd instalacji',        icon: '🔍', color: '#0C447C' },
    SERVICE:          { label: 'Serwis',                     icon: '🔧', color: '#0C447C' },
    REMINDER:         { label: 'Własne przypomnienie',       icon: '🔔', color: '#666' }
  },

  RECURRENCES: {
    ONE_TIME:    'Jednorazowe',
    MONTHLY:     'Co miesiąc',
    BIMONTHLY:   'Co 2 miesiące',
    QUARTERLY:   'Co kwartał',
    HALF_YEAR:   'Co pół roku',
    YEARLY:      'Co rok'
  },

  add(event) {
    const items = this.getAll();
    items.push({
      id: (window._waNextIdFor ? _waNextIdFor(items) : Date.now()),
      createdAt: new Date().toISOString(),

      clientId: event.clientId ? Number(event.clientId) : null,
      objectId: event.objectId ? Number(event.objectId) : null,

      title: event.title || '',
      description: event.description || '',
      eventType: event.eventType || 'REMINDER',
      dueDate: event.dueDate || '',
      reminderDays: event.reminderDays || [0, 1, 7, 30],

      status: event.status || 'PENDING',
      completedAt: null,
      completedBy: '',

      recurrence: event.recurrence || 'ONE_TIME',
      recurrenceEndDate: event.recurrenceEndDate || null,

      responsibleRole: event.responsibleRole || 'BACK_OFFICE',
      responsiblePerson: event.responsiblePerson || '',

      linkedDocumentId: event.linkedDocumentId || null,
      linkedInvoiceId: event.linkedInvoiceId || null,
      linkedMeasurementId: event.linkedMeasurementId || null,
      linkedProtocolId: event.linkedProtocolId || null,

      externalSystem: event.externalSystem || '',
      externalTaskId: event.externalTaskId || '',
      syncStatus: 'NOT_SYNCED'
    });
    this.saveAll(items);
  },

  remove(id) {
    this.saveAll(this.getAll().filter(e => Number(e.id) !== Number(id)));
  },

  find(id) {
    return this.getAll().find(e => Number(e.id) === Number(id));
  },

  findByClient(clientId) {
    return this.getAll().filter(e => Number(e.clientId) === Number(clientId));
  },

  update(id, data) {
    this.saveAll(this.getAll().map(e => {
      if (Number(e.id) !== Number(id)) return e;
      return { ...e, ...data, updatedAt: new Date().toISOString() };
    }));
  },

  markDone(id, person) {
    this.update(id, {
      status: 'DONE',
      completedAt: new Date().toISOString(),
      completedBy: person || ''
    });
  },

  // Dzień wg czasu LOKALNego użytkownika. `toISOString()` zwraca UTC, więc
  // w Polsce (UTC+1/+2) wieczorem podawał już jutrzejszą datę — zadania na
  // dziś wypadały z „Dziś", a jutrzejsze wskakiwały do „Po terminie".
  _today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  // Termin w formacie RRRR-MM-DD; brak terminu → null (a NIE pusty string,
  // bo '' < '2026-08-14' jest prawdą i zadania bez terminu lądowały
  // w „Po terminie", strasząc użytkownika nieistniejącym zaległym zadaniem).
  _due(e) {
    const v = (e && e.dueDate != null) ? String(e.dueDate) : '';
    return /^\d{4}-\d{2}-\d{2}/.test(v) ? v : null;
  },

  getToday() {
    const today = this._today();
    return this.getAll().filter(e => this._due(e) === today && e.status === 'PENDING');
  },

  getOverdue() {
    const today = this._today();
    return this.getAll()
      .filter(e => { const d = this._due(e); return d !== null && d < today && e.status === 'PENDING'; })
      .sort((a, b) => this._due(a).localeCompare(this._due(b)));
  },

  getUpcoming(days) {
    const today = new Date();
    const future = new Date(today);
    future.setDate(future.getDate() + days);
    const todayStr = this._today();
    const futureStr = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}`;
    return this.getAll()
      .filter(e => { const d = this._due(e); return d !== null && d > todayStr && d <= futureStr && e.status === 'PENDING'; })
      .sort((a, b) => this._due(a).localeCompare(this._due(b)));
  },

  // Bez terminu → poza kalendarzem miesięcznym (zamiast wyjątku na undefined).
  getByMonth(year, month) {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    return this.getAll().filter(e => { const d = this._due(e); return d !== null && d.startsWith(prefix); });
  },

  // Zadania bez terminu — wcześniej nie dało się ich nigdzie zobaczyć.
  getUndated() {
    return this.getAll().filter(e => this._due(e) === null && e.status === 'PENDING');
  },

  getDashboardSummary() {
    return {
      today: this.getToday(),
      overdue: this.getOverdue(),
      upcoming7: this.getUpcoming(7),
      upcoming30: this.getUpcoming(30)
    };
  }
};

window.CalendarModule = CalendarModule;
