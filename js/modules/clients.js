// WaterAI Energy Control
// Clients Module v3.0.0 — PILOT Supabase (tabela `clients`)
//
// Publiczne API BEZ ZMIAN (getAll/saveAll/add/remove/find/update/getOrderedList/getNumber),
// więc kod wołający (app.build.js, app-v2.js, index.html) pozostaje nietknięty.
// Wzorzec mostka sync→async:
//   • load()  — po zalogowaniu zaciąga klientów z bazy do pamięci podręcznej (JEDYNE await),
//   • getAll()/saveAll() — działają synchronicznie na pamięci podręcznej jak dotąd,
//   • _persist() — po każdym saveAll dosyła zmiany do Supabase w tle (diff: insert/update/delete),
//   • localStorage pozostaje LUSTREM awaryjnym (działa BackupModule; offline nie gubi danych).
// W bazie: jeden wiersz = jeden klient; pełny obiekt v2 (z legacy id liczbowym) w kolumnie `data`.

const ClientsModule = {
  storageKey: 'waterai_clients_v2',
  table: 'clients',

  _cache: null,   // tablica klientów w kształcie v2
  _rowIds: {},    // String(legacy id) -> uuid wiersza w bazie
  _snap: {},      // String(legacy id) -> JSON (wykrywanie zmian, żeby nie pisać bez potrzeby)

  _local() { return JSON.parse(localStorage.getItem(this.storageKey) || '[]'); },
  _mirror() { try { localStorage.setItem(this.storageKey, JSON.stringify(this._cache)); } catch (e) {} },
  _sb() { return (window.WaterAISupabase && WaterAISupabase.client) || null; },

  // Jednorazowe zaciągnięcie z bazy — wywoływane po zalogowaniu, PRZED renderem dashboardu.
  async load() {
    const sb = this._sb();
    if (!sb) { this._cache = this._local(); return; }

    // KOLEJNOŚĆ KRYTYCZNA: najpierw zdejmij migawkę danych lokalnych,
    // dopiero potem wolno cokolwiek nadpisywać lustrem (poprawka po incydencie
    // 2026-07-05: lustro pustej bazy kasowało lokalnych klientów przed migracją).
    let localBefore = this._local();
    if (localBefore.length === 0) {
      // ratunek: v2 mogło zostać nadpisane albo nigdy nie powstać — sprawdź klucz legacy v1
      try {
        const v1 = JSON.parse(localStorage.getItem('waterai_clients_v1') || '[]');
        if (Array.isArray(v1) && v1.length > 0) localBefore = v1;
      } catch (e) {}
    }

    const { data, error } = await sb.from(this.table).select('id, data').order('created_at');
    if (error) {
      console.warn('[ClientsModule] Baza niedostępna, pracuję na kopii lokalnej:', error.message);
      this._cache = localBefore;
      return;
    }

    this._rowIds = {}; this._snap = {};
    this._cache = (data || []).map(r => {
      const obj = r.data || {};
      this._rowIds[String(obj.id)] = r.id;
      this._snap[String(obj.id)] = JSON.stringify(obj);
      return obj;
    });

    // Migracja jednorazowa: baza pusta, a lokalnie (v2 lub v1) są dane → zaproponuj przeniesienie.
    if (this._cache.length === 0 && localBefore.length > 0) {
      if (confirm(
        'Wspólna baza jest pusta, a w tej przeglądarce jest zapisanych klientów: ' + localBefore.length + '.\n\n' +
        'Przenieść ich teraz do wspólnej bazy (będą widoczni na każdym komputerze)?'
      )) {
        this._cache = localBefore;
        await this._persist();
        this._mirror();
      } else {
        // odmowa = NIE ruszaj danych lokalnych; pracuj na nich, bez zapisu lustra
        this._cache = localBefore;
      }
      return;
    }

    this._mirror();   // lustro dopiero PO decyzjach o migracji
  },

  getAll() {
    if (this._cache === null) this._cache = this._local();   // awaryjnie, gdyby ktoś wołał przed load()
    return JSON.parse(JSON.stringify(this._cache));
  },

  saveAll(clients) {
    this._cache = clients || [];
    this._mirror();
    this._persist();   // w tle; błąd zgłosi alertem, dane i tak są w lustrze lokalnym
  },

  async _persist() {
    const sb = this._sb();
    if (!sb) return;
    const seen = {};
    try {
      for (const obj of this._cache) {
        const key = String(obj.id);
        seen[key] = true;
        const json = JSON.stringify(obj);
        const rowId = this._rowIds[key];
        if (!rowId) {
          const { data, error } = await sb.from(this.table).insert({ data: obj }).select('id').single();
          if (error) throw error;
          this._rowIds[key] = data.id;
          this._snap[key] = json;
        } else if (this._snap[key] !== json) {
          const { error } = await sb.from(this.table).update({ data: obj }).eq('id', rowId);
          if (error) throw error;
          this._snap[key] = json;
        }
      }
      for (const key of Object.keys(this._rowIds)) {
        if (!seen[key]) {
          const { error } = await sb.from(this.table).delete().eq('id', this._rowIds[key]);
          if (error) throw error;
          delete this._rowIds[key]; delete this._snap[key];
        }
      }
    } catch (e) {
      alert('Nie udało się zapisać klientów we wspólnej bazie: ' + (e.message || e) +
            '\nZmiany pozostały zapisane lokalnie w tej przeglądarce.');
    }
  },

  // uuid wiersza w bazie -> legacy id (potrzebne dla kont klientów: profiles.client_id).
  legacyIdForRow(uuid) {
    for (const k in this._rowIds) if (this._rowIds[k] === uuid) return Number(k);
    return null;
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
