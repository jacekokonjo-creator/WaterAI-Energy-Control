// WaterAI Energy Control
// Billing Entities Module v2.0.0 — podmioty (firmy) wystawiające faktury.
// v2.0.0 (2026-08-08): przejście na wspólny mostek Supabase (tabela `billing_entities`,
// polityka RLS `p_be_int` — czytają role wewnętrzne, zapisuje admin i Back Office).
// Tabela istnieje od schema.sql, więc ta zmiana NIE wymaga uruchamiania SQL-a.
// Dane sprzedawcy (NIP, adres, konto) były dotąd per przeglądarka — teraz są wspólne,
// więc faktura wydrukowana na dowolnym komputerze ma komplet danych.
// Dostęp do danych zawsze przez ten moduł (nie bezpośrednio do localStorage).

// TRYB AWARYJNY: bez WaterAIBridge moduł działa po staremu na localStorage.
const _billingStore = (window.WaterAIBridge && WaterAIBridge.makeStore)
  ? WaterAIBridge.makeStore({
      table: 'billing_entities',
      storageKey: 'waterai_billing_entities_v1',
      label: 'podmiotów wystawiających'
    })
  : (console.warn('[billing-entities] Brak WaterAIBridge — tryb lokalny.'), {
      storageKey: 'waterai_billing_entities_v1',
      async load() {},
      getAll() { return JSON.parse(localStorage.getItem(this.storageKey) || '[]'); },
      saveAll(items) { localStorage.setItem(this.storageKey, JSON.stringify(items)); },
      legacyIdForRow() { return null; }
    });

const BillingEntitiesModule = {
  ..._billingStore,

  storageKey: 'waterai_billing_entities_v1',

  // Domyślne ustawienia per kraj. To TYLKO wartości startowe — wszystko edytowalne.
  // Stawki VAT i etykiety identyfikatorów można nadpisać w panelu podmiotu.
  COUNTRIES: {
    PL: { name: 'Polska',      flag: '🇵🇱', currency: 'PLN', vat: 23, lang: 'pl', taxNoLabel: 'NIP',            vatIdLabel: 'VAT-UE (PL…)' },
    SK: { name: 'Słowacja',    flag: '🇸🇰', currency: 'EUR', vat: 23, lang: 'sk', taxNoLabel: 'IČO / DIČ',      vatIdLabel: 'IČ DPH (SK…)' },
    CZ: { name: 'Czechy',      flag: '🇨🇿', currency: 'CZK', vat: 21, lang: 'cs', taxNoLabel: 'IČO',            vatIdLabel: 'DIČ (CZ…)' },
    DE: { name: 'Niemcy',      flag: '🇩🇪', currency: 'EUR', vat: 19, lang: 'de', taxNoLabel: 'Steuernummer',   vatIdLabel: 'USt-IdNr (DE…)' },
    AT: { name: 'Austria',     flag: '🇦🇹', currency: 'EUR', vat: 20, lang: 'at', taxNoLabel: 'Firmenbuchnr.',  vatIdLabel: 'UID (ATU…)' },
    GB: { name: 'Anglia (UK)', flag: '🇬🇧', currency: 'GBP', vat: 20, lang: 'en', taxNoLabel: 'Company No.',    vatIdLabel: 'VAT Reg. No. (GB…)' },
    CH: { name: 'Szwajcaria',  flag: '🇨🇭', currency: 'CHF', vat: 8.1, lang: 'en', taxNoLabel: 'UID / ID',       vatIdLabel: 'MWST (CHE…)' }
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
      // Język dokumentu wystawianego przez ten podmiot — niezależny od języka
      // interfejsu. Domyślnie język kraju rejestracji, ale w pełni edytowalny.
      language:       e.language || c.lang || 'pl',
      defaultCurrency: e.defaultCurrency || c.currency,
      defaultVatRate:  isNaN(vat) ? c.vat : vat,
      numberPrefix:   (e.numberPrefix || '').trim(),
      footerNote:     (e.footerNote || '').trim(),
      isDefault:      !!e.isDefault
    };
  },

  // Tworzy 6 podmiotów startowych (po jednym na kraj) — TYLKO gdy lista jest pusta.
  // Dane rejestrowe (NIP/IČO, adres, konto) celowo puste — do uzupełnienia w panelu.
  // Spółki grupy — dane rejestrowe przekazane 2026-08-08.
  // Idempotentne: pomija spółki, które już są na liście (dopasowanie po nazwie).
  // numberPrefix celowo pusty → wszystkie używają formatu FV/rok/miesiąc/nr.
  // Ustaw prefiks (np. FV-SK), jeśli któraś spółka ma mieć własną serię numerów.
  GROUP_COMPANIES: [
    {
      name: 'Water AI P.S.A.',
      country: 'PL',
      addressLine: 'ul. Szczęsna 26',
      postalCity: '02-454 Warszawa',
      taxNo: '5213935935',
      vatId: 'PL5213935935',
      defaultCurrency: 'PLN',
      defaultVatRate: 23,
      footerNote: 'REGON: 38964342300000, KRS: 0000913254',
      isDefault: true
    },
    {
      name: 'Water AI s.r.o. (SK)',
      country: 'SK',
      addressLine: 'ul. Zamocka 22',
      postalCity: '811-01 Bratislava',
      taxNo: '57018804 (IČO), 2122537890 (DIČ)',
      vatId: '',
      bankName: 'Československá obchodná banka, a.s., Michalská 18, 815 63 Bratislava',
      iban: 'SK57 7500 0000 0040 3516 7204',
      swift: 'CEKOSKBX',
      defaultCurrency: 'EUR',
      defaultVatRate: 23,
      footerNote: 'Obchodný register Okresného súdu Bratislava I, oddiel: Sro, vložka č.: 188857/B'
    },
    {
      name: 'Water AI s.r.o. (CZ)',
      country: 'CZ',
      addressLine: 'ul. Ovocný trh 1096/1',
      postalCity: '110 00 Praha 1',
      taxNo: '19226799',
      vatId: '',
      bankName: 'MONETA Money Bank, Netroufalky 770/16, Brno',
      iban: 'CZ46 0600 0000 0002 7591 7918',
      swift: 'AGBACZPP',
      defaultCurrency: 'CZK',
      defaultVatRate: 21,
      footerNote: 'Zapsáno v obchodním rejstříku pod spis. zn. C 383346 vedená u Městského soudu v Praze · č. účtu CZK: 275917918/0600'
    },
    {
      name: 'Blue Boson AG',
      country: 'CH',
      language: 'en',
      addressLine: 'Gartenstrasse 6',
      postalCity: 'CH-6300 Zug',
      taxNo: 'CHE-301.960.915 (UID), CH-170-3049005-8 (ID)',
      vatId: '',
      bankName: 'PostFinance AG',
      iban: 'CH04 0900 0000 1631 6086 4',
      swift: 'POFICHBEXXX',
      defaultCurrency: 'CHF',
      defaultVatRate: 8.1,
      footerNote: 'Commercial Register and Bankruptcy Office of the Canton of Zug, publ. SOGC No. 1005855608'
    }
  ],

  // Zwraca liczbę faktycznie dodanych spółek (pominięte = już były).
  seedCompanies() {
    const existing = this.getAll();
    const has = name => existing.some(e => String(e.name || '').trim().toLowerCase() === name.trim().toLowerCase());
    const now = new Date().toISOString();
    const anyDefault = existing.some(e => e.isDefault);

    let added = 0;
    this.GROUP_COMPANIES.forEach((c, i) => {
      if (has(c.name)) return;
      const n = this._normalize(Object.assign({}, c, {
        // Nie odbieramy gwiazdki podmiotowi, który już jest domyślny.
        isDefault: c.isDefault && !anyDefault
      }));
      n.id = Date.now() + i;
      n.createdAt = now;
      existing.push(n);
      added++;
    });

    if (added) this.saveAll(existing);
    return added;
  }
};

window.BillingEntitiesModule = BillingEntitiesModule;
