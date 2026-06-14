// WaterAI Energy Control
// Measurements / ESCO Protocol Module v2.0.0

const MeasurementsModule = {
storageKey: "waterai_measurements_v2",

getAll() {
return JSON.parse(localStorage.getItem(this.storageKey) || "[]");
},

saveAll(items) {
localStorage.setItem(this.storageKey, JSON.stringify(items));
},

add(protocol) {
const items = this.getAll();

```
items.push({
  id: Date.now(),
  createdAt: new Date().toISOString(),
  ...protocol,
  clientId: Number(protocol.clientId),
  objectId: Number(protocol.objectId),
  baseTemperature: Number(protocol.baseTemperature || 21),
  billingPeriodStartReading: Number(protocol.billingPeriodStartReading || 0),
  billingPeriodEndReading: Number(protocol.billingPeriodEndReading || 0),
  comparisonPeriodStartReading: Number(protocol.comparisonPeriodStartReading || 0),
  comparisonPeriodEndReading: Number(protocol.comparisonPeriodEndReading || 0),
  billingConsumption: Number(protocol.billingConsumption || 0),
  comparisonConsumption: Number(protocol.comparisonConsumption || 0)
});

this.saveAll(items);
```

},

update(id, updatedProtocol) {
const items = this.getAll().map(item => {
if (Number(item.id) !== Number(id)) return item;

```
  return {
    ...item,
    ...updatedProtocol,
    clientId: Number(updatedProtocol.clientId),
    objectId: Number(updatedProtocol.objectId),
    baseTemperature: Number(updatedProtocol.baseTemperature || 21),
    billingPeriodStartReading: Number(updatedProtocol.billingPeriodStartReading || 0),
    billingPeriodEndReading: Number(updatedProtocol.billingPeriodEndReading || 0),
    comparisonPeriodStartReading: Number(updatedProtocol.comparisonPeriodStartReading || 0),
    comparisonPeriodEndReading: Number(updatedProtocol.comparisonPeriodEndReading || 0),
    billingConsumption: Number(updatedProtocol.billingConsumption || 0),
    comparisonConsumption: Number(updatedProtocol.comparisonConsumption || 0),
    updatedAt: new Date().toISOString()
  };
});

this.saveAll(items);
```

},

remove(id) {
const items = this.getAll().filter(item => Number(item.id) !== Number(id));
this.saveAll(items);
},

find(id) {
return this.getAll().find(item => Number(item.id) === Number(id));
},

findByObject(objectId) {
return this.getAll()
.filter(item => Number(item.objectId) === Number(objectId))
.sort((a, b) => String(b.protocolDate || "").localeCompare(String(a.protocolDate || "")));
},

findByClient(clientId) {
return this.getAll()
.filter(item => Number(item.clientId) === Number(clientId))
.sort((a, b) => String(b.protocolDate || "").localeCompare(String(a.protocolDate || "")));
}
};

window.MeasurementsModule = MeasurementsModule;
