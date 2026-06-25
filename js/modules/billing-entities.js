// WaterAI Energy Control
// Billing Entities Module v1.0.0
// Podmioty (firmy) wystawiające faktury — kilka spółek w różnych krajach.
// Dostęp do danych zawsze przez ten moduł (nie bezpośrednio do localStorage).

const BillingEntitiesModule = {
  storageKey: 'waterai_billing_entities_v1',

  // Domyślne ustawienia per kraj. To TYLKO wartości startowe — wszystko edytowalne.
  // Stawki VAT i etykiety identyfikatorów można nadpisać w panelu podmiotu.
  COUNTRIES: {
    PL: { name: 'Polska',      flag: '🇵🇱', currency: 'PLN', vat: 23, taxNoLabel: 'NIP',            vatIdLabel: 'VAT-UE (PL…)' },
    SK: { name: 'Słowacja',    flag: '🇸🇰', currency: 'EUR', vat: 23, taxNoLabel: 'IČO / DIČ',      vatIdLabel: 'IČ DPH (SK…)' },
    CZ: { name: 'Czechy',      flag: '🇨🇿', currency: 'CZK', vat: 21, taxNoLabel: 'IČO',            vatIdLabel: 'DIČ (CZ…)' },
    DE: { name: 'Niemcy',      flag: '🇩🇪', currency: 'EUR', vat: 19, taxNoLabel: 'Steuernummer',   vatIdLabel: 'USt-IdNr (DE…)' },
    AT: { name: 'Austria',     flag: '🇦🇹', currency: 'EUR', vat: 20, taxNoLabel: 'Firmenbuchnr.',  vatIdLabel: 'UID (ATU…)' },
    GB: { name: 'Anglia (UK)', flag: '🇬🇧', currency: 'GBP', vat: 20, taxNoLabel: 'Company No.',    vatIdLabel: 'VAT Reg. No. (GB…)' }
  },

  getAll() {
    return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
  },

  saveAll(items) {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  },

  add(e) {
    const items = this.getAll();
    const item = this._normalize(e);
    item.id = Date.now();
    item.createdAt = new Date().toISOString();
    if (item.isDefault) items.forEach(x => { x.isDefault = false; });
    items.push(item);
    this.saveAll(items);
    return item;
  },

  update(id, e) {
    const items = this.getAll();
    if (e && e.isDefault) items.forEach(x => { x.isDefault = false; });
    this.saveAll(items.map(x => {
      if (Number(x.id) !== Number(id)) return x;
      const merged = this._normalize({ ...x, ...e });
      merged.id = x.id;
      merged.createdAt = x.createdAt;
      merged.updatedAt = new Date().toISOString();
      return merged;
    }));
  },

  remove(id) {
    this.saveAll(this.getAll().filter(x => Number(x.id) !== Number(id)));
  },

  find(id) {
    return this.getAll().find(x => Number(x.id) === Number(id));
  },

  getDefault() {
    const all = this.getAll();
    return all.find(x => x.isDefault) || all[0] || null;
  },

  _normalize(e) {
    const c = this.COUNTRIES[e.country] || this.COUNTRIES.PL;
    const vat = (e.defaultVatRate !== undefined && e.defaultVatRate !== null && e.defaultVatRate !== '')
      ? Number(e.defaultVatRate) : c.vat;
    return {
      name:           (e.name || '').trim(),
      country:        e.country || 'PL',
      taxNo:          (e.taxNo || '').trim(),
      vatId:          (e.vatId || '').trim(),
      addressLine:    (e.addressLine || '').trim(),
      postalCity:     (e.postalCity || '').trim(),
      email:          (e.email || '').trim(),
      phone:          (e.phone || '').trim(),
      bankName:       (e.bankName || '').trim(),
      iban:           (e.iban || '').trim(),
      swift:          (e.swift || '').trim(),
      defaultCurrency: e.defaultCurrency || c.currency,
      defaultVatRate:  isNaN(vat) ? c.vat : vat,
      numberPrefix:   (e.numberPrefix || '').trim(),
      footerNote:     (e.footerNote || '').trim(),
      isDefault:      !!e.isDefault
    };
  },

  // Tworzy 6 podmiotów startowych (po jednym na kraj) — TYLKO gdy lista jest pusta.
  // Dane rejestrowe (NIP/IČO, adres, konto) celowo puste — do uzupełnienia w panelu.
  seedDefaults() {
    if (this.getAll().length) return;
    const order = ['PL', 'SK', 'CZ', 'DE', 'AT', 'GB'];
    const now = new Date().toISOString();
    const seed = order.map((code, i) => {
      const c = this.COUNTRIES[code];
      const n = this._normalize({
        name: `WaterAI ${c.name}`,
        country: code,
        defaultCurrency: c.currency,
        defaultVatRate: c.vat,
        numberPrefix: `FV-${code}`,
        isDefault: code === 'PL'
      });
      n.id = Date.now() + i;
      n.createdAt = now;
      return n;
    });
    this.saveAll(seed);
  }
};

window.BillingEntitiesModule = BillingEntitiesModule;
