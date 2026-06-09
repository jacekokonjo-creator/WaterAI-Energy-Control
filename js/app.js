// WaterAI Energy Control
// Main Application v0.8.1

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getClients() {
  return ClientsModule.getAll();
}

function createClient(form) {
  const contacts = [];

  document.querySelectorAll(".contact-row").forEach(row => {
    const name = row.querySelector("[name='contactName']").value.trim();
    const role = row.querySelector("[name='contactRole']").value.trim();
    const email = row.querySelector("[name='contactEmail']").value.trim();
    const phone = row.querySelector("[name='contactPhone']").value.trim();

    if (name || role || email || phone) {
      contacts.push({ name, role, email, phone });
    }
  });

  ClientsModule.add({
    name: form.name.value.trim(),
    clientType: form.clientType.value,
    vatId: form.vatId.value.trim(),
    country: form.country.value,
    language: form.language.value,

    postalCode: form.postalCode.value.trim(),
    city: form.city.value.trim(),
    street: form.street.value.trim(),
    buildingNumber: form.buildingNumber.value.trim(),
    apartmentNumber: form.apartmentNumber.value.trim(),
    googleMapsUrl: form.googleMapsUrl.value.trim(),

    invoiceEmail: form.invoiceEmail.value.trim(),
    paymentDays: Number(form.paymentDays.value),
    settlementModel: form.settlementModel.value,
    escoShare: Number(form.escoShare.value),

    contacts,
    status: form.status.value
  });

  form.reset();
  renderClientsList();
}

function deleteClient(id) {
  if (!confirm("Czy na pewno usunąć klienta?")) return;
  ClientsModule.remove(id);
  renderClientsList();
}

function addContactRow() {
  const container = document.getElementById("contacts-container");

  const row = document.createElement("div");
  row.className = "contact-row calendar-form";
  row.style.gridColumn = "1 / -1";
  row.style.marginTop = "10px";

  row.innerHTML = `
    <div>
      <label>Osoba kontaktowa</label>
      <input name="contactName" type="text" placeholder="Imię i nazwisko" />
    </div>

    <div>
      <label>Funkcja</label>
      <input name="contactRole" type="text" placeholder="np. Księgowość / Techniczny" />
    </div>

    <div>
      <label>Email</label>
      <input name="contactEmail" type="email" />
    </div>

    <div>
      <label>Telefon</label>
      <input name="contactPhone" type="text" />
    </div>
  `;

  container.appendChild(row);
}

function renderClientsList() {
  const container = document.getElementById("clients-list");
  if (!container) return;

  const clients = getClients();

  if (clients.length === 0) {
    container.innerHTML = `<p>Brak klientów. Dodaj pierwszego klienta.</p>`;
    return;
  }

  container.innerHTML = clients.map(client => `
    <div class="reminder-card">
      <strong>${escapeHtml(client.name)}</strong>

      <div class="reminder-meta">
        Typ klienta: ${escapeHtml(client.clientType)}<br />
        VAT ID: ${escapeHtml(client.vatId)}<br />
        Kraj: ${escapeHtml(client.country)}<br />
        Język: ${escapeHtml(client.language)}<br />
        Adres: ${escapeHtml(client.postalCode)} ${escapeHtml(client.city)}, 
        ${escapeHtml(client.street)} ${escapeHtml(client.buildingNumber)}
        ${client.apartmentNumber ? "/" + escapeHtml(client.apartmentNumber) : ""}<br />
        Google Maps: ${
          client.googleMapsUrl
            ? `<a href="${escapeHtml(client.googleMapsUrl)}" target="_blank">Otwórz lokalizację</a>`
            : "brak"
        }<br />
        Email FV: ${escapeHtml(client.invoiceEmail)}<br />
        Termin płatności: ${escapeHtml(client.paymentDays)} dni<br />
        Model rozliczeń: ${escapeHtml(client.settlementModel)}<br />
        Udział WaterAI: ${escapeHtml(client.escoShare)}%<br />
        Status: ${escapeHtml(client.status)}
      </div>

      <div class="reminder-meta" style="margin-top: 12px;">
        <strong>Kontakty:</strong><br />
        ${
          client.contacts && client.contacts.length
            ? client.contacts.map(contact => `
                ${escapeHtml(contact.name)} — ${escapeHtml(contact.role)}<br />
                ${escapeHtml(contact.email)} | ${escapeHtml(contact.phone)}<br />
              `).join("")
            : "brak"
        }
      </div>

      <div style="margin-top: 12px;">
        <button class="small-button" onclick="deleteClient(${client.id})">Usuń</button>
      </div>
    </div>
  `).join("");
}
