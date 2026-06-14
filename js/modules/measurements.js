// WaterAI Energy Control
// Measurements Module v1.0.0

const MeasurementsModule = {
  storageKey: "waterai_measurements_v1",

  getAll() {
    return JSON.parse(localStorage.getItem(this.storageKey) || "[]");
  },

  saveAll(measurements) {
    localStorage.setItem(this.storageKey, JSON.stringify(measurements));
  },

  add(measurement) {
    const measurements = this.getAll();

    measurements.push({
      id: Date.now(),
      createdAt: new Date().toISOString(),

      clientId: Number(measurement.clientId),
      objectId: Number(measurement.objectId),
      measurementDate: measurement.measurementDate || "",
      measurementType: measurement.measurementType || "HEAT_CO",
      value: Number(measurement.value || 0),
      unit: measurement.unit || "GJ",
      source: measurement.source || "MANUAL",
      note: measurement.note || ""
    });

    this.saveAll(measurements);
  },

  remove(id) {
    const measurements = this.getAll().filter(item => item.id !== Number(id));
    this.saveAll(measurements);
  },

  find(id) {
    return this.getAll().find(item => item.id === Number(id));
  },

  findByObject(objectId) {
    return this.getAll()
      .filter(item => item.objectId === Number(objectId))
      .sort((a, b) => String(b.measurementDate).localeCompare(String(a.measurementDate)));
  },

  findByClient(clientId) {
    return this.getAll()
      .filter(item => item.clientId === Number(clientId))
      .sort((a, b) => String(b.measurementDate).localeCompare(String(a.measurementDate)));
  },

  update(id, updatedMeasurement) {
    const measurements = this.getAll().map(item => {
      if (item.id !== Number(id)) return item;

      return {
        ...item,
        ...updatedMeasurement,
        clientId: Number(updatedMeasurement.clientId),
        objectId: Number(updatedMeasurement.objectId),
        value: Number(updatedMeasurement.value || 0),
        updatedAt: new Date().toISOString()
      };
    });

    this.saveAll(measurements);
  }
};

window.MeasurementsModule = MeasurementsModule;
