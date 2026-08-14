// WaterAI Energy Control
// Invoicing Module v2.1.0 — faktury na wspólnym mostku Supabase (tabela `invoices`).
// v2.1.0 (2026-08-08): faktura może wskazywać PODSTAWĘ — analizę albo raport ESCO
// (`sourceType` + `sourceId`). Zapisujemy też migawkę wskaźników z chwili wystawienia
// (okres, oszczędność energii/kosztu, udział ESCO), żeby późniejsza zmiana analizy
// nie zmieniała treści już wystawionej faktury. Cały rekord idzie do kolumny `data`
// (jsonb), więc nowe pola NIE wymagają migracji SQL.
// v1 trzymał faktury wyłącznie w localStorage; v2 przechodzi na WaterAIBridge
// (wzorzec jak AnalysesModule/ReadingsModule): load() po zalogowaniu, getAll/saveAll
// synchronicznie na cache, zapis do bazy w tle, lustro localStorage bez zmian.
// Publiczne API (add/remove/find/update/getDashboard/…) — bez zmian.

// TRYB AWARYJNY: bez WaterAIBridge moduł działa po staremu na localStorage.
const _invoicingStore = (window.WaterAIBridge && WaterAIBridge.makeStore)
  ? WaterAIBridge.makeStore({
      table: 'invoices',
      storageKey: 'waterai_invoices_v1',
      label: 'faktur',
      fk: { column: 'client_id', prop: 'clientId', module: () => window.ClientsModule }
    })
  : (console.warn('[invoicing] Brak WaterAIBridge — tryb lokalny.'), {
      storageKey: 'waterai_invoices_v1',
      async load() {},
      getAll() { return JSON.parse(localStorage.getItem(this.storageKey) || '[]'); },
      saveAll(items) { localStorage.setItem(this.storageKey, JSON.stringify(items)); },
      legacyIdForRow() { return null; }
    });

const InvoicingModule = {
  ..._invoicingStore,

  storageKey: 'waterai_invoices_v1',

  TYPES: {
    INVOICE:          { label: 'Faktura',              icon: '🧾' },
    CORRECTION:       { label: 'Korekta',              icon: '✏️' },
    ADVANCE:          { label: 'Faktura zaliczkowa',   icon: '💰' },
    ESCO_SETTLEMENT:  { label: 'Rozliczenie ESCO',     icon: '⚡' }
  },

  // Podstawa faktury — z czego wzięły się podpowiedziane kwoty.
  SOURCE_TYPES: {
    ANALYSIS:    { label: 'Analiza',     icon: '📊' },
    ESCO_REPORT: { label: 'Raport ESCO', icon: '⚡' }
  },

  STATUSES: {
    DRAFT:    { label: 'Projekt',              color: '#7A4A00', bg: '#FEF3DC' },
    ISSUED:   { label: 'Wystawiona',           color: '#0C447C', bg: '#E6F1FB' },
    PAID:     { label: 'Opłacona',             color: '#27500A', bg: '#EAF3DE' },
    PARTIAL:  { label: 'Częściowo opłacona',   color: '#633806', bg: '#FEF3DC' },
    OVERDUE:  { label: 'Po terminie',          color: '#c00',    bg: '#fee' }
  },

  add(inv) {
    const items = this.getAll();
    // UWAGA: `||` zamiast `??` zamieniało stawkę 0% na 23% — faktura z odwrotnym
    // obciążeniem, eksportem lub zwolnieniem była liczona z pełnym VAT-em.
    // To samo dotyczy udziału ESCO 0%. Zero jest tu poprawną wartością.
    const _net = Number(inv.netAmount ?? 0) || 0;
    const _vatRate = (inv.vatRate === '' || inv.vatRate == null || isNaN(Number(inv.vatRate))) ? 23 : Number(inv.vatRate);
    const grossAmount = _net * (1 + _vatRate / 100);
    const vatAmount = grossAmount - _net;

    items.push({
      id: (window._waNextIdFor ? _waNextIdFor(items) : Date.now()),
      createdAt: new Date().toISOString(),

      clientId: Number(inv.clientId),
      objectId: inv.objectId ? Number(inv.objectId) : null,
      issuerId: inv.issuerId ? Number(inv.issuerId) : null,

      invoiceNumber: inv.invoiceNumber || this.generateNumber(),
      invoiceType: inv.invoiceType || 'INVOICE',
      issueDate: inv.issueDate || new Date().toISOString().slice(0, 10),
      dueDate: inv.dueDate || '',

      netAmount: _net,
      vatRate: _vatRate,
      vatAmount: Number(vatAmount.toFixed(2)),
      grossAmount: Number(grossAmount.toFixed(2)),
      currency: inv.currency || 'PLN',

      // Podstawa faktury: 'ANALYSIS' | 'ESCO_REPORT' | null.
      // sourceId celowo bez rzutowania — analizy mają id liczbowe, raporty ESCO tekstowe ('esco_…').
      sourceType: inv.sourceType || null,
      sourceId: (inv.sourceId === '' || inv.sourceId == null) ? null : inv.sourceId,
      sourceNumber: inv.sourceNumber || '',
      periodFrom: inv.periodFrom || '',
      periodTo: inv.periodTo || '',

      protocolIds: inv.protocolIds || [],
      savedEnergy: Number(inv.savedEnergy || 0),
      savedMoney: Number(inv.savedMoney || 0),
      escoShare: (inv.escoShare === '' || inv.escoShare == null || isNaN(Number(inv.escoShare))) ? 50 : Number(inv.escoShare),
      energyUnit: inv.energyUnit || '',

      status: inv.status || 'DRAFT',
      paidAmount: Number(inv.paidAmount || 0),
      paidAt: inv.paidAt || null,

      notes: inv.notes || '',
      attachments: inv.attachments || []
    });
    this.saveAll(items);
  },

  // Numer FV: <prefiks>/<rok>/<miesiąc>/<kolejny>, np. FV/2026/08/001.
  // Kolejny = największy dotąd użyty W TEJ SERII (prefiks+rok+miesiąc) + 1, a nie „ilość + 1":
  // dzięki temu usunięcie faktury nie powoduje powtórzenia numeru.
  // Prefiks bierze się z podmiotu wystawiającego (numberPrefix), domyślnie 'FV'.
  generateNumber(opts) {
    const o = opts || {};
    const d = o.date ? new Date(o.date) : new Date();
    const base = isNaN(d.getTime()) ? new Date() : d;
    const year = base.getFullYear();
    const month = String(base.getMonth() + 1).padStart(2, '0');
    const prefix = String(o.prefix || 'FV').trim() || 'FV';
    const head = `${prefix}/${year}/${month}/`;

    let max = 0;
    this.getAll().forEach(i => {
      const n = String(i.invoiceNumber || '');
      if (n.indexOf(head) !== 0) return;
      const seq = parseInt(n.slice(head.length), 10);
      if (!isNaN(seq) && seq > max) max = seq;
    });
    return head + String(max + 1).padStart(3, '0');
  },

  remove(id) {
    this.saveAll(this.getAll().filter(i => Number(i.id) !== Number(id)));
  },

  find(id) {
    return this.getAll().find(i => Number(i.id) === Number(id));
  },

  findByClient(clientId) {
    return this.getAll()
      .filter(i => Number(i.clientId) === Number(clientId))
      .sort((a, b) => b.issueDate.localeCompare(a.issueDate));
  },

  // Faktury wystawione już z tej samej podstawy — ostrzeżenie przed podwójnym fakturowaniem.
  findBySource(sourceType, sourceId) {
    if (!sourceType || sourceId == null || sourceId === '') return [];
    return this.getAll().filter(i =>
      i.sourceType === sourceType && String(i.sourceId) === String(sourceId));
  },

  update(id, data) {
    this.saveAll(this.getAll().map(i => {
      if (Number(i.id) !== Number(id)) return i;
      const net = Number(data.netAmount ?? i.netAmount);
      const vat = Number(data.vatRate ?? i.vatRate);
      const gross = net * (1 + vat / 100);
      return {
        ...i, ...data,
        netAmount: net,
        vatRate: vat,
        vatAmount: Number((gross - net).toFixed(2)),
        grossAmount: Number(gross.toFixed(2)),
        updatedAt: new Date().toISOString()
      };
    }));
  },

  updateStatus(id, status, paidAmount) {
    this.update(id, {
      status,
      paidAmount: Number(paidAmount || 0),
      paidAt: status === 'PAID' ? new Date().toISOString().slice(0, 10) : null
    });
  },

  getDashboard() {
    const all = this.getAll();
    const today = new Date().toISOString().slice(0, 10);

    return {
      totalIssued:  all.filter(i => i.status !== 'DRAFT').reduce((s, i) => s + i.grossAmount, 0),
      totalPaid:    all.filter(i => i.status === 'PAID').reduce((s, i) => s + i.grossAmount, 0),
      totalOverdue: all.filter(i => i.status === 'OVERDUE' || (i.status === 'ISSUED' && i.dueDate && i.dueDate < today)).reduce((s, i) => s + (i.grossAmount - i.paidAmount), 0),
      countOverdue: all.filter(i => i.status === 'OVERDUE' || (i.status === 'ISSUED' && i.dueDate && i.dueDate < today)).length,
      countDraft:   all.filter(i => i.status === 'DRAFT').length
    };
  }
};

window.InvoicingModule = InvoicingModule;
