// WaterAI Energy Control
// Fabryka mostków Supabase v1.2.0 — WSPÓLNY wzorzec sync→async dla modułów danych.
// v1.2.0 (2026-07-11): (a) _persist zserializowany kolejką — równoległe saveAll
// wyścigały się i podwójnie insertowały te same rekordy; (b) load() wykrywa
// w bazie wiersze-duplikaty (ten sam data.id), pomija je i kasuje z tabeli.
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

      _fkRow(f, obj) {
        if (!f) return null;
        const parent = f.module();
        return (parent && parent._rowIds && parent._rowIds[String(obj[f.prop])]) || null;
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
        this._cache = [];
        const dupRowIds = [];
        (data || []).forEach(r => {
          const obj = r.data || {};
          const key = String(obj.id);
          if (this._rowIds[key]) { dupRowIds.push(r.id); return; }   // duplikat z wyścigu zapisów
          this._rowIds[key] = r.id;
          this._snap[key] = JSON.stringify(obj);
          this._cache.push(obj);
        });
        if (dupRowIds.length) {
          console.warn('[' + this.table + '] Usuwam ' + dupRowIds.length + ' zduplikowanych wierszy z bazy (ten sam data.id).');
          const { error: delErr } = await sb.from(this.table).delete().in('id', dupRowIds);
          if (delErr) console.warn('[' + this.table + '] Nie udało się skasować duplikatów:', delErr.message);
        }

        // 3. Migracja jednorazowa — pytanie PRZED lustrem. TYLKO dla admina:
        // rola client/salesRep widzi baze przycieta przez RLS, wiec "pusto w bazie"
        // nic nie znaczy, a proba przeniesienia i tak polegnie na RLS.
        const _prof = (window.WaterAISupabase && WaterAISupabase.profile) || null;
        if (this._cache.length === 0 && localBefore.length > 0 && _prof && _prof.role === 'admin') {
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

        // 3b. Auto-odzysk: rekordy z lokalnego lustra, których nie ma w bazie
        // (np. zapis przy wygasłej sesji — insert odbił się o 401, a lustro zdążyło).
        // Tylko role widzące pełną bazę (RLS); dla client/salesRep „brak w bazie" nic nie znaczy.
        if (_prof && ['admin', 'backOffice', 'energyAnalyst'].indexOf(_prof.role) >= 0 && localBefore.length) {
          const known = new Set(this._cache.map(o => String(o.id)));
          const lost = localBefore.filter(o => o && o.id != null && !known.has(String(o.id)));
          if (lost.length) {
            console.warn('[' + this.table + '] Przywracam ' + lost.length + ' rekord(ów) z lokalnego lustra nieobecnych w bazie (np. zapis przy wygasłej sesji).');
            this._cache = this._cache.concat(lost);
            this._persist();
          }
        }

        // 4. Lustro na końcu — ale nie dla roli client (jej widok jest przyciety
        // przez RLS i nadpisalby pelna lokalna kopie z sesji admina w tej samej przegladarce).
        if (!_prof || _prof.role !== 'client') this._mirror();
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

      // Serializacja zapisu: kolejne saveAll tylko oznacza „jest nowy stan";
      // pętla insert/update/delete nigdy nie biegnie równolegle sama ze sobą.
      _persist() {
        this._dirty = true;
        if (this._persisting) return this._persisting;
        const runner = (async () => {
          while (this._dirty) {
            this._dirty = false;
            await this._persistOnce();
          }
          this._persisting = null;
        })();
        this._persisting = runner;
        return runner;
      },

      async _persistOnce() {
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
              const fkVal = this._fkRow(cfg.fk, obj);
              if (!fkVal) { skipped.push(obj.name || key); continue; }   // rodzic nie jest w bazie
              row[cfg.fk.column] = fkVal;
            }
            if (cfg.fk2) {
              const fk2Val = this._fkRow(cfg.fk2, obj);
              if (fk2Val) row[cfg.fk2.column] = fk2Val;   // opcjonalny — brak nie blokuje
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
