// WaterAI Energy Control
// Clients Module v2.0.0

const ClientsModule = {
  storageKey: 'waterai_clients_v2',

  getAll() {
    return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
  },

  saveAll(clients) {
    localStorage.setItem(this.storageKey, JSON.stringify(clients));
  },

  add(client) {
    const clients = this.getAll();
    clients.push({
      id: Date.now(),
      createdAt: new Date().toISOString(),

      name: client.name || '',
      vatId: client.vatId || '',
      regon: client.regon || '',
      status: client.status || 'ACTIVE',
      cooperationStartDate: client.cooperationStartDate || '',
      notes: client.notes || '',

      country: client.country || 'PL',
      language: client.language || 'pl',
      postalCode: client.postalCode || '',
      city: client.city || '',
      street: client.street || '',
      buildingNumber: client.buildingNumber || '',
      apartmentNumber: client.apartmentNumber || '',
      googleMapsUrl: client.googleMapsUrl || '',

      invoiceEmail: client.invoiceEmail || '',
      paymentDays: Number(client.paymentDays || 14),
      settlementModel: client.settlementModel || 'ESCO',
      escoShare: Number(client.escoShare || 50),

      contacts: client.contacts || []
    });
    this.saveAll(clients);
  },

  remove(id) {
    this.saveAll(this.getAll().filter(c => c.id !== Number(id)));
  },

  find(id) {
    return this.getAll().find(c => c.id === Number(id));
  },

  update(id, data) {
    this.saveAll(this.getAll().map(c => {
      if (c.id !== Number(id)) return c;
      return { ...c, ...data, updatedAt: new Date().toISOString() };
    }));
  },

  // Numer klienta = kolejna pozycja wśród OBECNYCH klientów (sortowanie wg daty utworzenia / id rosnąco).
  // Nie jest to trwały numer zapisany w rekordzie — przelicza się dynamicznie z aktualnej listy,
  // więc po usunięciu klienta numeracja pozostałych "zagęszcza się" bez dziur.
  getOrderedList() {
    return this.getAll().slice().sort((a, b) => Number(a.id) - Number(b.id));
  },

  getNumber(id) {
    const ordered = this.getOrderedList();
    const idx = ordered.findIndex(c => Number(c.id) === Number(id));
    return idx === -1 ? null : idx + 1;
  }
};

window.ClientsModule = ClientsModule;
