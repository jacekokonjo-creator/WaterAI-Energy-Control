// WaterAI Energy Control
// Objects Module v1.0.0

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

      heatedArea: Number(object.heatedArea || 0),
      volume: Number(object.volume || 0),
      constructionYear: Number(object.constructionYear || 0),
      usersCount: Number(object.usersCount || 0),

      billingCycle: object.billingCycle || "MONTHLY",
      customPeriodFrom: object.customPeriodFrom || "",
      customPeriodTo: object.customPeriodTo || "",

      backOfficeOwner: object.backOfficeOwner || "",
      energyAnalystOwner: object.energyAnalystOwner || "",

      heatSources: object.heatSources || []
    });

    this.saveAll(objects);
  },

  remove(id) {
    const objects = this.getAll().filter(object => object.id !== Number(id));
    this.saveAll(objects);
  },

  find(id) {
    return this.getAll().find(object => object.id === Number(id));
  },

  findByClient(clientId) {
    return this.getAll().filter(object => object.clientId === Number(clientId));
  },

  update(id, updatedObject) {
    const objects = this.getAll().map(object => {
      if (object.id !== Number(id)) return object;

      return {
        ...object,
        ...updatedObject,
        updatedAt: new Date().toISOString()
      };
    });

    this.saveAll(objects);
  }
};

window.ObjectsModule = ObjectsModule;
