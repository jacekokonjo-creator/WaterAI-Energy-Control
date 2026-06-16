// WaterAI Energy Control
// Calendar Module v1.0.0

const CalendarModule = {
  storageKey: 'waterai_calendar_v1',

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

  getAll() {
    return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
  },

  saveAll(items) {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  },

  add(event) {
    const items = this.getAll();
    items.push({
      id: Date.now(),
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

  getToday() {
    const today = new Date().toISOString().slice(0, 10);
    return this.getAll().filter(e => e.dueDate === today && e.status === 'PENDING');
  },

  getOverdue() {
    const today = new Date().toISOString().slice(0, 10);
    return this.getAll()
      .filter(e => e.dueDate < today && e.status === 'PENDING')
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  },

  getUpcoming(days) {
    const today = new Date();
    const future = new Date(today);
    future.setDate(future.getDate() + days);
    const todayStr = today.toISOString().slice(0, 10);
    const futureStr = future.toISOString().slice(0, 10);
    return this.getAll()
      .filter(e => e.dueDate > todayStr && e.dueDate <= futureStr && e.status === 'PENDING')
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  },

  getByMonth(year, month) {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    return this.getAll().filter(e => e.dueDate.startsWith(prefix));
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
