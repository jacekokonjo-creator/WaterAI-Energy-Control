// WaterAI Energy Control
// Objects Module v1.1.1

const ObjectsModule = {
  storageKey: "waterai_objects_v1",

  getAll() {
    return JSON.parse(localStorage.getItem(this.storageKey) || "[]");
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
      name: object.name || "",
      objectType: object.objectType || "HOTEL",
      status: object.status || "IMPLEMENTATION",

      country: object.country || "PL",
      postalCode: object.postalCode || "",
      city: object.city || "",
      street: object.street || "",
      buildingNumber: object.buildingNumber || "",
      apartmentNumber: object.apartmentNumber || "",
      googleMapsUrl: object.googleMapsUrl || "",

      heatingSourceCO: object.heatingSourceCO || "NONE",
      heatingSourceCWU: object.heatingSourceCWU || "NONE",
      heatConsumptionReading: object.heatConsumptionReading || "INVOICE",
      heatConsumptionReadingDetails: object.heatConsumptionReadingDetails || "",

      billingCycle: object.billingCycle || "MONTHLY",
      billingStartDate: object.billingStartDate || "",
      manualBillingDates: object.manualBillingDates || [],
      reminderDaysBefore: Number(object.reminderDaysBefore || 14),

      backOfficeOwner: object.backOfficeOwner || "",
      energyAnalystOwner: object.energyAnalystOwner || "",

      // DANE KLIMATYCZNE TYM
      weatherStation: object.weatherStation || "",
      weatherSource: object.weatherSource || "WeatherOnline / Robot Klimatu",
      weatherSourceUrl: object.weatherSourceUrl || "",
      weatherDataDownloadDate: object.weatherDataDownloadDate || "",
      baseTemperature: Number(object.baseTemperature || 21),

      // DANE ENERGETYCZNE
      energyUnit: object.energyUnit || "GJ",
      currency: object.currency || "PLN",
      energyPrice: Number(object.energyPrice || 0),

      heatSources: object.heatSources || []
    });

    this.saveAll(objects);
  },

  remove(id) {
    const objects = this.getAll().filter(object => Number(object.id) !== Number(id));
    this.saveAll(objects);
  },

  find(id) {
    return this.getAll().find(object => Number(object.id) === Number(id));
  },

  findByClient(clientId) {
    return this.getAll().filter(object => Number(object.clientId) === Number(clientId));
  },

  update(id, updatedObject) {
    const objects = this.getAll().map(object => {
      if (Number(object.id) !== Number(id)) return object;

      return {
        ...object,
        ...updatedObject,
        clientId: Number(updatedObject.clientId),
        updatedAt: new Date().toISOString()
      };
    });

    this.saveAll(objects);
  }
};

window.ObjectsModule = ObjectsModule;
