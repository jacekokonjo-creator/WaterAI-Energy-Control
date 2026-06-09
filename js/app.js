// WaterAI Energy Control
// Main Application v0.8.0

function getClients() {
    return ClientsModule.getAll();
}

function addClient(formData) {
    ClientsModule.add(formData);
    renderClientsList();
}

function deleteClient(id) {
    if (!confirm("Usunąć klienta?")) {
        return;
    }

    ClientsModule.remove(id);
    renderClientsList();
}

function renderClientsList() {
    const container = document.getElementById("clients-list");

    if (!container) {
        return;
    }

    const clients = getClients();

    if (clients.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                Brak klientów.
            </div>
        `;
        return;
    }

    container.innerHTML = clients.map(client => `
        <div class="client-card">
            <h3>${client.name}</h3>

            <p><strong>NIP:</strong> ${client.nip}</p>
            <p><strong>Kraj:</strong> ${client.country}</p>
            <p><strong>Email FV:</strong> ${client.invoiceEmail}</p>
            <p><strong>Termin płatności:</strong> ${client.paymentDays} dni</p>
            <p><strong>Udział WaterAI:</strong> ${client.escoShare}%</p>
            <p><strong>Status:</strong> ${client.status}</p>

            <button onclick="deleteClient(${client.id})">
                Usuń
            </button>
        </div>
    `).join("");
}

function createClient(form) {
    const client = {
        name: form.name.value,
        nip: form.nip.value,
        country: form.country.value,
        invoiceEmail: form.invoiceEmail.value,
        paymentDays: Number(form.paymentDays.value),
        escoShare: Number(form.escoShare.value),
        status: form.status.value
    };

    addClient(client);
    form.reset();
}

document.addEventListener("DOMContentLoaded", () => {
    renderClientsList();
});
