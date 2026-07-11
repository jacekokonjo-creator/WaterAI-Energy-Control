// WaterAI Energy Control
// Documents Module v2.0.0 — Supabase: metadane w tabeli `documents` (mostek),
// pliki w buckecie Storage `document-files` (w rekordzie tylko `storagePath`).
// Jednorazowa migracja przenosi stare pliki base64 z localStorage do bucketa.

const DOC_BUCKET = 'document-files';

const _documentsStore = (window.WaterAIBridge && WaterAIBridge.makeStore)
  ? WaterAIBridge.makeStore({
      table: 'documents',
      storageKey: 'waterai_documents_v1',
      label: 'dokumentów',
      fk: { column: 'client_id', prop: 'clientId', module: () => window.ClientsModule },
      fk2: { column: 'object_id', prop: 'objectId', module: () => window.ObjectsModule }
    })
  : (console.warn('[DocumentsModule] Brak WaterAIBridge — tryb lokalny (localStorage).'), {
      storageKey: 'waterai_documents_v1',
      async load() {},
      getAll() { return JSON.parse(localStorage.getItem(this.storageKey) || '[]'); },
      saveAll(items) { localStorage.setItem(this.storageKey, JSON.stringify(items)); }
    });

const DocumentsModule = {
  ..._documentsStore,

  CATEGORIES: {
    INVOICE_HEAT:        { label: 'Faktura za ciepło',        icon: '🔥', group: 'Faktury od klienta' },
    INVOICE_ELECTRICITY: { label: 'Faktura za energię',       icon: '⚡', group: 'Faktury od klienta' },
    INVOICE_GAS:         { label: 'Faktura za gaz',           icon: '💨', group: 'Faktury od klienta' },
    INVOICE_WATER:       { label: 'Faktura za wodę',          icon: '💧', group: 'Faktury od klienta' },
    CONTRACT_ENERGY:     { label: 'Umowa energetyczna',       icon: '📃', group: 'Umowy' },
    CONTRACT_HEAT:       { label: 'Umowa na ciepło',          icon: '📃', group: 'Umowy' },
    TARIFF:              { label: 'Taryfa',                   icon: '📋', group: 'Umowy' },
    ANNEX:               { label: 'Aneks',                    icon: '📎', group: 'Umowy' },
    TECH_MANUAL:         { label: 'Instrukcja techniczna',    icon: '📘', group: 'Dokumentacja techniczna' },
    TECH_CERT:           { label: 'Certyfikat',               icon: '🏆', group: 'Dokumentacja techniczna' },
    TECH_DECLARATION:    { label: 'Deklaracja zgodności',     icon: '✅', group: 'Dokumentacja techniczna' },
    TECH_DATASHEET:      { label: 'Karta katalogowa',         icon: '📄', group: 'Dokumentacja techniczna' },
    PHOTO_BEFORE:        { label: 'Zdjęcie przed montażem',   icon: '📷', group: 'Zdjęcia' },
    PHOTO_AFTER:         { label: 'Zdjęcie po montażu',       icon: '📷', group: 'Zdjęcia' },
    PHOTO_DEVICE:        { label: 'Zdjęcie urządzenia',       icon: '📷', group: 'Zdjęcia' },
    PHOTO_METER:         { label: 'Zdjęcie licznika',         icon: '📷', group: 'Zdjęcia' },
    PHOTO_BUILDING:      { label: 'Zdjęcie obiektu',          icon: '🏢', group: 'Zdjęcia' },
    OTHER:               { label: 'Inne',                     icon: '📁', group: 'Inne' }
  },

  add(doc) {
    const items = this.getAll();
    const rec = {
      id: Date.now(),
      createdAt: new Date().toISOString(),

      clientId: Number(doc.clientId),
      objectId: doc.objectId ? Number(doc.objectId) : null,
      folderId: doc.folderId ? Number(doc.folderId) : null,

      name: doc.name || '',
      category: doc.category || 'OTHER',
      subcategory: doc.subcategory || '',
      documentDate: doc.documentDate || '',
      description: doc.description || '',
      tags: doc.tags || [],

      fileName: doc.fileName || '',
      fileType: doc.fileType || '',
      fileSize: doc.fileSize || 0,
      fileUrl: doc.fileUrl || '',
      storagePath: doc.storagePath || '',
      thumbnailUrl: doc.thumbnailUrl || '',

      uploadedBy: doc.uploadedBy || ''
    };
    items.push(rec);
    this.saveAll(items);
    return rec;
  },

  // ── Pliki w buckecie Storage ──────────────────────────────────────────────
  _sbc() { return (window.WaterAISupabase && WaterAISupabase.client) || null; },
  _safeName(n) { return String(n || 'plik').replace(/[^\w.\-]+/g, '_').slice(-80); },
  _dataUrlToBlob(u) {
    const parts = u.split(',');
    const mime = (parts[0].match(/data:([^;]+)/) || [null, 'application/octet-stream'])[1];
    const bin = atob(parts[1]);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  },

  async uploadFile(docId, fileName, blobOrDataUrl) {
    const sb = this._sbc();
    if (!sb) return null;
    const blob = typeof blobOrDataUrl === 'string' ? this._dataUrlToBlob(blobOrDataUrl) : blobOrDataUrl;
    const path = docId + '/' + this._safeName(fileName);
    const { error } = await sb.storage.from(DOC_BUCKET).upload(path, blob, { upsert: true });
    if (error) { console.warn('[documents] Upload pliku nieudany:', error.message); return null; }
    return path;
  },

  async fileUrlFor(doc) {
    if (doc && doc.storagePath) {
      const sb = this._sbc();
      if (!sb) return null;
      const { data, error } = await sb.storage.from(DOC_BUCKET).createSignedUrl(doc.storagePath, 600);
      if (error) { console.warn('[documents] Nie udało się pobrać linku:', error.message); return null; }
      return data.signedUrl;
    }
    return (doc && doc.fileUrl) || null;
  },

  // Jednorazowo: stare pliki base64 (fileUrl 'data:...') → bucket Storage.
  // Odchudza localStorage (limit 5 MB) i tabelę `documents`.
  async migrateFilesToStorage() {
    const sb = this._sbc();
    if (!sb) return;
    const prof = (window.WaterAISupabase && WaterAISupabase.profile) || null;
    if (!prof || ['admin', 'backOffice', 'energyAnalyst'].indexOf(prof.role) < 0) return;
    const items = this.getAll();
    let moved = 0;
    for (const d of items) {
      if (d.fileUrl && d.fileUrl.indexOf('data:') === 0 && !d.storagePath) {
        const path = await this.uploadFile(d.id, d.fileName || d.name, d.fileUrl);
        if (path) { d.storagePath = path; d.fileUrl = ''; moved++; }
      }
    }
    if (moved) {
      console.log('[documents] Przeniesiono ' + moved + ' plik(ów) do Storage (bucket ' + DOC_BUCKET + ').');
      this.saveAll(items);
    }
  },

  move(docId, targetFolderId) {
    this.update(docId, { folderId: targetFolderId ? Number(targetFolderId) : null });
  },

  findByFolder(folderId) {
    if (folderId === null || folderId === undefined) {
      return this.getAll().filter(d => !d.folderId);
    }
    return this.getAll().filter(d => Number(d.folderId) === Number(folderId));
  },

  remove(id) {
    this.saveAll(this.getAll().filter(d => Number(d.id) !== Number(id)));
  },

  find(id) {
    return this.getAll().find(d => Number(d.id) === Number(id));
  },

  findByClient(clientId) {
    return this.getAll().filter(d => Number(d.clientId) === Number(clientId));
  },

  findByObject(objectId) {
    return this.getAll().filter(d => Number(d.objectId) === Number(objectId));
  },

  search(query, clientId) {
    const q = query.toLowerCase();
    return this.getAll().filter(d => {
      if (clientId && Number(d.clientId) !== Number(clientId)) return false;
      return (
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        (d.tags || []).some(t => t.toLowerCase().includes(q))
      );
    });
  },

  update(id, data) {
    this.saveAll(this.getAll().map(d => {
      if (Number(d.id) !== Number(id)) return d;
      return { ...d, ...data, updatedAt: new Date().toISOString() };
    }));
  },

  getGrouped(clientId, objectId) {
    let docs = this.getAll().filter(d => Number(d.clientId) === Number(clientId));
    if (objectId) docs = docs.filter(d => Number(d.objectId) === Number(objectId));

    const groups = {};
    docs.forEach(d => {
      const cat = this.CATEGORIES[d.category];
      const group = cat ? cat.group : 'Inne';
      if (!groups[group]) groups[group] = [];
      groups[group].push(d);
    });
    return groups;
  }
};

window.DocumentsModule = DocumentsModule;
