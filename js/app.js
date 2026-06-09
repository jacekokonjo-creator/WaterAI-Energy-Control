// WaterAI Energy Control
// Main Application v0.8.0

function getClients() {
    if (typeof ClientsModule === "undefined") {
        return [];
    }

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
            <p>Brak klientów.</p>
        `;
        return;
    }

    container.innerHTML = clients
        .map(client => `
            <div class="client-card">
                <strong>${client.name}</strong><br>

                NIP: ${client.nip || "-"}<br>
                Kraj: ${client.country || "-"}<br>
                Email FV: ${client.invoiceEmail || "-"}<br>
                Termin płatności: ${client.paymentDays} dni<br>
                Udział WaterAI: ${client.escoShare}%<br>
                Status: ${client.status}

                <div style="margin-top:10px;">
                    <button onclick="deleteClient(${client.id})">
                        Usuń
                    </button>
                </div>
            </div>
        `)
        .join("");
}

function renderClientsModule() {
    const moduleContent =
        document.getElementById("module-content");

    if (!moduleContent) {
        return;
    }

    moduleContent.innerHTML = `
        <h3>Nowy klient</h3>

        <div style="display:grid;gap:12px;max-width:600px;">
            <input id="client-name" placeholder="Nazwa klienta">

            <input id="client-nip" placeholder="NIP">

            <input id="client-country" value="PL">

            <input id="client-email" placeholder="Email do FV">

            <input id="client-payment" type="number" value="14">

            <input id="client-esco" type="number" value="50">

            <select id="client-status">
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
            </select>

            <button onclick="saveClientForm()">
                Dodaj klienta
            </button>
        </div>

        <hr style="margin:25px 0;">

        <h3>Lista klientów</h3>

        <div id="clients-list"></div>
    `;

    renderClientsList();
}

function saveClientForm() {
    addClient({
        name: document.getElementById("client-name").value,
        nip: document.getElementById("client-nip").value,
        country: document.getElementById("client-country").value,
        invoiceEmail: document.getElementById("client-email").value,
        paymentDays: parseInt(
            document.getElementById("client-payment").value || 14
        ),
        escoShare: parseInt(
            document.getElementById("client-esco").value || 50
        ),
        status: document.getElementById("client-status").value
    });

    renderClientsModule();
}// WaterAI Energy Control - application logic
