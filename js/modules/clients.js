// Clients Module v0.8.0

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
            status: client.status || "ACTIVE",

            name: client.name || "",
            nip: client.nip || "",
            country: client.country || "PL",

            invoiceEmail: client.invoiceEmail || "",
            paymentDays: client.paymentDays || 14,

            escoShare: client.escoShare || 50
        });

        this.saveAll(clients);
    },

    remove(id) {
        const clients = this
            .getAll()
            .filter(client => client.id !== id);

        this.saveAll(clients);
    },

    find(id) {
        return this
            .getAll()
            .find(client => client.id === id);
    }
};// clients module
