// WaterAI Energy Control
// Fabryka mostków Supabase v1.0.0 — WSPÓLNY wzorzec sync→async dla modułów danych.
//
// Każdy moduł danych dostaje z makeStore() ten sam, przetestowany rdzeń:
//   • load()   — po zalogowaniu: zaciąga wiersze tabeli do pamięci podręcznej (jedyne await),
//   • getAll() / saveAll() — synchronicznie na pamięci podręcznej (kod wołający bez zmian),
//   • zapis do bazy w tle po każdym saveAll (diff: insert/update/delete),
//   • lustro w localStorage (BackupModule i tryb offline działają dalej),
//   • migracja jednorazowa: baza pusta + dane lokalne → pytanie o przeniesienie.
//
// KOLEJNOŚĆ ŚWIĘTA (lekcja z incydentu 2026-07-05): migawka danych lokalnych
// powstaje ZANIM cokolwiek zapisze lustro. Lustro pisze się na samym końcu.
//
// Klucze obce: opcja fk tłumaczy stare id liczbowe (w `data`) na uuid wiersza
// rodzica w bazie, np. objects.client_id ← ClientsModule._rowIds[clientId].

const WaterAIBridge = {
  makeStore(cfg) {
    // cfg: { table, storageKey, label, legacyKeys?: [], fk?: { column, prop, module: () => Module } }
    return {
      storageKey: cfg.storageKey,
      table: cfg.table,

      _cache: null,
      _rowIds: {},   // String(legacy id) -> uuid wiersza
      _snap: {},     // String(legacy id) -> JSON (wykrywanie zmian)

      _sb() { return (window.WaterAISupabase && WaterAISupabase.client) || null; },
      _local() { return JSON.parse(localStorage.getItem(this.storageKey) || '[]'); },
      _mirror() { try { localStorage.setItem(this.storageKey, JSON.stringify(this._cache)); } catch (e) {} },

      _fkRow(obj) {
        if (!cfg.fk) return null;
        const parent = cfg.fk.module();
        return (parent && parent._rowIds && parent._rowIds[String(obj[cfg.fk.prop])]) || null;
      },

      async load() {
        const sb = this._sb();
        if (!sb) { this._cache = this._local(); return; }

        // 1. Migawka lokalna PRZED jakimkolwiek zapisem (v2, a w odwodzie klucze legacy).
        let localBefore = this._local();
        if (localBefore.length === 0 && cfg.legacyKeys) {
          for (const lk of cfg.legacyKeys) {
            try {
              const old = JSON.parse(localStorage.getItem(lk) || '[]');
              if (Array.isArray(old) && old.length > 0) { localBefore = old; break; }
            } catch (e) {}
          }
        }

        // 2. Stan bazy.
        const { data, error } = await sb.from(this.table).select('id, data').order('created_at');
        if (error) {
          console.warn('[' + this.table + '] Baza niedostępna, pracuję na kopii lokalnej:', error.message);
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

        // 3. Migracja jednorazowa — pytanie PRZED lustrem.
        if (this._cache.length === 0 && localBefore.length > 0) {
          if (confirm(
            'Wspólna baza jest pusta, a w tej przeglądarce jest zapisanych ' + cfg.label + ': ' + localBefore.length + '.\n\n' +
            'Przenieść je teraz do wspólnej bazy (będą widoczne na każdym komputerze)?'
          )) {
            this._cache = localBefore;
            await this._persist();
            this._mirror();
          } else {
            this._cache = localBefore;   // odmowa nie rusza danych lokalnych
          }
          return;
        }

        // 4. Lustro na końcu.
        this._mirror();
      },

      getAll() {
        if (this._cache === null) this._cache = this._local();
        return JSON.parse(JSON.stringify(this._cache));
      },

      saveAll(items) {
        this._cache = items || [];
        this._mirror();
        this._persist();
      },

      async _persist() {
        const sb = this._sb();
        if (!sb) return;
        const seen = {};
        const skipped = [];
        try {
          for (const obj of this._cache) {
            const key = String(obj.id);
            seen[key] = true;
            const json = JSON.stringify(obj);
            const row = { data: obj };
            if (cfg.fk) {
              const fkVal = this._fkRow(obj);
              if (!fkVal) { skipped.push(obj.name || key); continue; }   // rodzic nie jest w bazie
              row[cfg.fk.column] = fkVal;
            }
            const rowId = this._rowIds[key];
            if (!rowId) {
              const { data, error } = await sb.from(this.table).insert(row).select('id').single();
              if (error) throw error;
              this._rowIds[key] = data.id;
              this._snap[key] = json;
            } else if (this._snap[key] !== json) {
              const { error } = await sb.from(this.table).update(row).eq('id', rowId);
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
          if (skipped.length) {
            console.warn('[' + this.table + '] Pominięto (brak rodzica w bazie):', skipped.join(', '));
          }
        } catch (e) {
          alert('Nie udało się zapisać (' + cfg.label + ') we wspólnej bazie: ' + (e.message || e) +
                '\nZmiany pozostały zapisane lokalnie w tej przeglądarce.');
        }
      },

      legacyIdForRow(uuid) {
        for (const k in this._rowIds) if (this._rowIds[k] === uuid) return Number(k);
        return null;
      }
    };
  }
};

window.WaterAIBridge = WaterAIBridge;
