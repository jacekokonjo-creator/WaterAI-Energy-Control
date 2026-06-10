// WaterAI Energy Control
// Clients Module v0.8.1

const ClientsModule = {
  storageKey: "waterai_clients_v1",

  getAll() {
    return JSON.parse(localStorage.getItem(this.storageKey) || "[]");
  },

  saveAll(clients) {
    localStorage.setItem(this.storageKey, JSON.stringify(clients));
  },

  add(client) {
    const clients = this.getAll();

    clients.push({
      id: Date.now(),
      createdAt: new Date().toISOString(),

      name: client.name || "",
      vatId: client.vatId || "",
      country: client.country || "PL",
      language: client.language || "pl",

      postalCode: client.postalCode || "",
      city: client.city || "",
      street: client.street || "",
      buildingNumber: client.buildingNumber || "",
      apartmentNumber: client.apartmentNumber || "",
      googleMapsUrl: client.googleMapsUrl || "",

      invoiceEmail: client.invoiceEmail || "",
      paymentDays: Number(client.paymentDays || 14),
      settlementModel: client.settlementModel || "ESCO",
      escoShare: Number(client.escoShare || 50),

      contacts: client.contacts || [],
        });

    this.saveAll(clients);
  },

  remove(id) {
    const clients = this.getAll().filter(client => client.id !== Number(id));
    this.saveAll(clients);
  },

  find(id) {
    return this.getAll().find(client => client.id === Number(id));
  },

  update(id, updatedClient) {
    const clients = this.getAll().map(client => {
      if (client.id !== Number(id)) return client;

      return {
        ...client,
        ...updatedClient,
        updatedAt: new Date().toISOString()
      };
    });

    this.saveAll(clients);
  }
};

window.ClientsModule = ClientsModule;
