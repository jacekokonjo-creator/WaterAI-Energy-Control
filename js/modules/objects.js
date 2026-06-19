// WaterAI Energy Control
// Objects Module v2.1.0

const ObjectsModule = {
  storageKey: 'waterai_objects_v2',

  getAll() {
    return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
  },

  saveAll(objects) {
    localStorage.setItem(this.storageKey, JSON.stringify(objects));
  },

  add(object) {
    const objects = this.getAll();
    objects.push({
      id: Date.now(),
      createdAt: new Date().toISOString(),

      clientId: Number(object.clientId),
      name: object.name || '',
      objectType: object.objectType || 'HOTEL',
      status: object.status || 'IMPLEMENTATION',

      country: object.country || 'PL',
      postalCode: object.postalCode || '',
      city: object.city || '',
      street: object.street || '',
      buildingNumber: object.buildingNumber || '',
      apartmentNumber: object.apartmentNumber || '',
      googleMapsUrl: object.googleMapsUrl || '',

      // Parametry budynku
      totalArea: Number(object.totalArea || 0),
      heatedArea: Number(object.heatedArea || 0),
      cooledArea: Number(object.cooledArea || 0),
      yearBuilt: object.yearBuilt ? Number(object.yearBuilt) : null,
      description: object.description || '',

      // Ogrzewanie
      heatingSourceCO: object.heatingSourceCO || 'NONE',
      heatingSourceCWU: object.heatingSourceCWU || 'NONE',
      heatConsumptionReading: object.heatConsumptionReading || 'INVOICE',
      heatConsumptionReadingDetails: object.heatConsumptionReadingDetails || '',

      // Harmonogram
      billingCycle: object.billingCycle || 'MONTHLY',
      billingStartDate: object.billingStartDate || '',
      manualBillingDates: object.manualBillingDates || [],
      reminderDaysBefore: Number(object.reminderDaysBefore || 14),

      // Właściciele
      backOfficeOwner: object.backOfficeOwner || '',
      energyAnalystOwner: object.energyAnalystOwner || '',
      salesRepresentative: object.salesRepresentative || '',

      // Dane klimatyczne
      weatherStation: object.weatherStation || '',
      weatherSource: object.weatherSource || 'WeatherOnline / Robot Klimatu',
      weatherSourceUrl: object.weatherSourceUrl || '',
      weatherDataDownloadDate: object.weatherDataDownloadDate || '',
      baseTemperature: Number(object.baseTemperature || 21),

      // Dane energetyczne
      energyUnit: object.energyUnit || 'GJ',
      currency: object.currency || 'PLN',
      energyPrice: Number(object.energyPrice || 0),

      heatSources: object.heatSources || [],

      // Dane umowne i rozliczeniowe
      contractStartDate: object.contractStartDate || '',
      contractEndDate: object.contractEndDate || '',
      installationDate: object.installationDate || '',
      commissioningDate: object.commissioningDate || '',
      settlementModel: object.settlementModel || 'ESCO',
      escoShare: Number(object.escoShare || 50),
      paymentDays: Number(object.paymentDays || 14),
      invoiceEmail: object.invoiceEmail || ''
    });
    this.saveAll(objects);
  },

  remove(id) {
    this.saveAll(this.getAll().filter(o => Number(o.id) !== Number(id)));
  },

  find(id) {
    return this.getAll().find(o => Number(o.id) === Number(id));
  },

  findByClient(clientId) {
    return this.getAll()
      .filter(o => Number(o.clientId) === Number(clientId))
      .sort((a, b) => Number(a.id) - Number(b.id));
  },

  update(id, data) {
    this.saveAll(this.getAll().map(o => {
      if (Number(o.id) !== Number(id)) return o;
      return {
        ...o, ...data,
        clientId: Number(data.clientId || o.clientId),
        updatedAt: new Date().toISOString()
      };
    }));
  },

  // Numer obiektu = kolejna pozycja WŚRÓD OBIEKTÓW TEGO SAMEGO KLIENTA (rosnąco wg id/daty utworzenia).
  // Przeliczany dynamicznie z aktualnej listy obiektów danego klienta — bez trwałych dziur po usunięciu.
  getNumber(id) {
    const obj = this.find(id);
    if (!obj) return null;
    const siblings = this.findByClient(obj.clientId);
    const idx = siblings.findIndex(o => Number(o.id) === Number(id));
    return idx === -1 ? null : idx + 1;
  }
};

window.ObjectsModule = ObjectsModule;
