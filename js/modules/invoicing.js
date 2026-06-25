// WaterAI Energy Control
// Invoicing Module v1.0.0

const InvoicingModule = {
  storageKey: 'waterai_invoices_v1',

  TYPES: {
    INVOICE:          { label: 'Faktura',              icon: '🧾' },
    CORRECTION:       { label: 'Korekta',              icon: '✏️' },
    ADVANCE:          { label: 'Faktura zaliczkowa',   icon: '💰' },
    ESCO_SETTLEMENT:  { label: 'Rozliczenie ESCO',     icon: '⚡' }
  },

  STATUSES: {
    DRAFT:    { label: 'Projekt',              color: '#7A4A00', bg: '#FEF3DC' },
    ISSUED:   { label: 'Wystawiona',           color: '#0C447C', bg: '#E6F1FB' },
    PAID:     { label: 'Opłacona',             color: '#27500A', bg: '#EAF3DE' },
    PARTIAL:  { label: 'Częściowo opłacona',   color: '#633806', bg: '#FEF3DC' },
    OVERDUE:  { label: 'Po terminie',          color: '#c00',    bg: '#fee' }
  },

  getAll() {
    return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
  },

  saveAll(items) {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  },

  add(inv) {
    const items = this.getAll();
    const grossAmount = Number(inv.netAmount || 0) * (1 + Number(inv.vatRate || 23) / 100);
    const vatAmount = grossAmount - Number(inv.netAmount || 0);

    items.push({
      id: Date.now(),
      createdAt: new Date().toISOString(),

      clientId: Number(inv.clientId),
      objectId: inv.objectId ? Number(inv.objectId) : null,
      issuerId: inv.issuerId ? Number(inv.issuerId) : null,

      invoiceNumber: inv.invoiceNumber || this.generateNumber(),
      invoiceType: inv.invoiceType || 'INVOICE',
      issueDate: inv.issueDate || new Date().toISOString().slice(0, 10),
      dueDate: inv.dueDate || '',

      netAmount: Number(inv.netAmount || 0),
      vatRate: Number(inv.vatRate || 23),
      vatAmount: Number(vatAmount.toFixed(2)),
      grossAmount: Number(grossAmount.toFixed(2)),
      currency: inv.currency || 'PLN',

      protocolIds: inv.protocolIds || [],
      savedEnergy: Number(inv.savedEnergy || 0),
      savedMoney: Number(inv.savedMoney || 0),
      escoShare: Number(inv.escoShare || 50),

      status: inv.status || 'DRAFT',
      paidAmount: Number(inv.paidAmount || 0),
      paidAt: inv.paidAt || null,

      notes: inv.notes || '',
      attachments: inv.attachments || []
    });
    this.saveAll(items);
  },

  generateNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const all = this.getAll().filter(i => i.invoiceNumber.startsWith(`FV/${year}/`));
    const num = String(all.length + 1).padStart(3, '0');
    return `FV/${year}/${month}/${num}`;
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
