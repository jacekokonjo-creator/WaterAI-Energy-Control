// WaterAI Energy Control
// Documents Module v1.0.0

const DocumentsModule = {
  storageKey: 'waterai_documents_v1',

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

  getAll() {
    return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
  },

  saveAll(items) {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  },

  add(doc) {
    const items = this.getAll();
    items.push({
      id: Date.now(),
      createdAt: new Date().toISOString(),

      clientId: Number(doc.clientId),
      objectId: doc.objectId ? Number(doc.objectId) : null,

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
      thumbnailUrl: doc.thumbnailUrl || '',

      uploadedBy: doc.uploadedBy || ''
    });
    this.saveAll(items);
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
