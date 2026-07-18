// js/modules/backup.js
// ─────────────────────────────────────────────────────────────────────────────
// Kopia zapasowa / przywracanie WSZYSTKICH danych WaterAI (klucze localStorage
// z prefiksem "waterai_"). Eksport-import do pliku JSON.
//
// Po co: dane domenowe żyją we wspólnej bazie (Supabase); localStorage trzyma
// lokalną kopię (lustro) do pracy offline. Ten moduł eksportuje/importuje tę
// lokalną kopię (wszystkie klucze "waterai_"). Operuje na localStorage celowo
// bezpośrednio (to z natury operacja na całym magazynie, ponad pojedynczymi modułami).
// ─────────────────────────────────────────────────────────────────────────────
function _waLocale() {
  var m = { pl:'pl-PL', en:'en-GB', de:'de-DE', cs:'cs-CZ', sk:'sk-SK', es:'es-ES', at:'de-AT' };
  var l;
  try { l = (typeof currentLanguage !== 'undefined' && currentLanguage) || (window.currentLanguage) || 'pl'; }
  catch (e) { l = 'pl'; }
  return m[l] || 'pl-PL';
}

const BackupModule = {
  PREFIX: 'waterai_',
  APP_VERSION: 'v0.7.0',

  // Wszystkie klucze WaterAI obecne w tej przeglądarce.
  _allKeys() {
    const out = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.indexOf(this.PREFIX) === 0) out.push(k);
    }
    return out;
  },

  // Zbuduj obiekt kopii (nagłówek + mapa klucz→wartość).
  buildBackupObject() {
    const data = {};
    this._allKeys().forEach(k => { data[k] = localStorage.getItem(k); });
    return {
      app: 'WaterAI Energy Control',
      kind: 'waterai-backup',
      schema: 1,
      appVersion: this.APP_VERSION,
      exportedAt: new Date().toISOString(),
      keyCount: Object.keys(data).length,
      data
    };
  },

  _stamp() {
    const d = new Date(), p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
  },

  _download(filename, text) {
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  },

  // ── Eksport ──
  exportAll() {
    const obj = this.buildBackupObject();
    if (obj.keyCount === 0) { alert('Brak danych WaterAI do zapisania w tej przeglądarce.'); return; }
    this._download(`waterai-backup_${this._stamp()}.json`, JSON.stringify(obj, null, 2));
  },

  // Awaryjna kopia bieżącego stanu — pobierana automatycznie przed importem.
  _safetyExport() {
    const obj = this.buildBackupObject();
    if (obj.keyCount === 0) return;
    this._download(`waterai-AUTOZAPIS-przed-importem_${this._stamp()}.json`, JSON.stringify(obj, null, 2));
  },

  // Parsuj plik → bezpieczna mapa tylko kluczy waterai_* (wartości string).
  _parse(text) {
    let parsed;
    try { parsed = JSON.parse(text); } catch (e) { throw new Error('To nie jest poprawny plik JSON.'); }
    let map = null;
    if (parsed && typeof parsed === 'object' && parsed.data && typeof parsed.data === 'object') map = parsed.data;
    else if (parsed && typeof parsed === 'object') map = parsed;            // dopuść też płaską mapę kluczy
    if (!map) throw new Error('Nierozpoznany format pliku.');
    const clean = {};
    let skipped = 0;
    Object.keys(map).forEach(k => {
      if (k.indexOf(this.PREFIX) === 0 && typeof map[k] === 'string') clean[k] = map[k];
      else skipped++;                                                       // obce klucze pomijamy (bezpieczeństwo)
    });
    if (!Object.keys(clean).length) throw new Error('Plik nie zawiera danych WaterAI (kluczy „waterai_…").');
    return { clean, skipped, meta: (parsed && parsed.exportedAt) ? parsed : null };
  },

  // ── Import / przywracanie ──
  importFromFile(file, mode) {
    if (!file) return;
    const self = this;
    const reader = new FileReader();
    reader.onload = function () {
      let res;
      try { res = self._parse(String(reader.result || '')); }
      catch (e) { alert('Import nieudany: ' + e.message); return; }

      const n = Object.keys(res.clean).length;
      const when = res.meta && res.meta.exportedAt ? new Date(res.meta.exportedAt).toLocaleString(_waLocale()) : 'nieznana data';
      const modeTxt = mode === 'merge'
        ? 'DOŁĄCZ — wspólne klucze nadpisane, pozostałe Twoje dane zostają.'
        : 'ZASTĄP — wszystkie obecne dane WaterAI zostaną usunięte i zastąpione z pliku.';
      const ok = confirm(
        'Przywrócić dane z kopii?\n\n' +
        '• Plik z dnia: ' + when + '\n' +
        '• Zestawów danych w pliku: ' + n + '\n' +
        '• Tryb: ' + modeTxt + '\n\n' +
        'Najpierw pobierze się AUTOZAPIS obecnego stanu (na wszelki wypadek). Kontynuować?'
      );
      if (!ok) return;

      try { self._safetyExport(); } catch (e) { /* brak danych do auto-kopii — ok */ }

      if (mode !== 'merge') self._allKeys().forEach(k => localStorage.removeItem(k));
      Object.keys(res.clean).forEach(k => localStorage.setItem(k, res.clean[k]));

      alert('Przywrócono ' + n + ' zestawów danych. Aplikacja zostanie przeładowana.');
      location.reload();
    };
    reader.onerror = function () { alert('Nie udało się odczytać pliku.'); };
    reader.readAsText(file);
  },

  // ── Widok strony „Ustawienia" ──
  renderSettings() {
    const keys = this._allKeys();
    const count = keys.length;
    let bytes = 0; keys.forEach(k => { bytes += (localStorage.getItem(k) || '').length + k.length; });
    const sizeTxt = bytes > 1048576 ? (bytes / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(bytes / 1024)) + ' KB';

    return `
    <div style="max-width:760px;">
      <div style="background:var(--color-background-secondary);border:1px solid var(--color-border-tertiary);border-radius:12px;padding:18px 20px;margin-bottom:16px;">
        <div style="font-size:15px;font-weight:600;color:#0C447C;margin-bottom:4px;">💾 Kopia zapasowa danych</div>
        <div style="font-size:13px;color:var(--color-text-secondary);line-height:1.55;">
          Dane (klienci, obiekty, pomiary, analizy, regresja, faktury, raporty ESCO…) są zapisywane we
          <strong>wspólnej bazie w chmurze (Supabase)</strong> — po zalogowaniu widać je na każdym komputerze.
          Ta przeglądarka trzyma dodatkowo <strong>lokalną kopię (lustro)</strong>, dzięki której aplikacja działa też przy słabym połączeniu.
          Ten eksport zapisuje tę <strong>lokalną kopię</strong> do pliku JSON — jako dodatkowe zabezpieczenie i do szybkiego przeniesienia stanu.
          Uwaga: udostępnienia (widoczność) oraz pliki (dokumenty, załączniki) żyją tylko w bazie/Storage i <strong>nie wchodzą</strong> do tego pliku.
        </div>
        <div style="font-size:12px;color:var(--color-text-tertiary);margin-top:8px;">Lokalna kopia w tej przeglądarce: <strong>${count}</strong> zestawów danych · ok. <strong>${sizeTxt}</strong></div>
      </div>

      <div style="border:1px solid var(--color-border-tertiary);border-radius:12px;padding:18px 20px;margin-bottom:16px;">
        <div style="font-size:14px;font-weight:600;margin-bottom:6px;">⬇️ Zapisz kopię (eksport)</div>
        <div style="font-size:13px;color:var(--color-text-secondary);margin-bottom:12px;">Pobiera plik <code>waterai-backup_RRRR-MM-DD_GGMM.json</code> z całością danych z tej przeglądarki.</div>
        <button class="primary-button" onclick="BackupModule.exportAll()" style="font-size:14px;padding:10px 22px;">⬇️ Pobierz kopię zapasową</button>
      </div>

      <div style="border:1px solid #F0C36D;background:#FFF8EC;border-radius:12px;padding:18px 20px;">
        <div style="font-size:14px;font-weight:600;margin-bottom:6px;">⬆️ Przywróć z kopii (import)</div>
        <div style="font-size:13px;color:var(--color-text-secondary);margin-bottom:6px;">
          Wczytaj plik <code>.json</code> zapisany powyżej — np. na nowym komputerze albo aby cofnąć się do wcześniejszego stanu.
        </div>
        <div style="font-size:12px;color:#8a5a00;background:#FFEFD0;border-radius:8px;padding:8px 10px;margin-bottom:12px;">
          ⚠️ <strong>Uwaga:</strong> w trybie „Zastąp" obecne dane w tej przeglądarce zostaną nadpisane. Przed importem program
          automatycznie pobierze AUTOZAPIS bieżącego stanu, więc nic nie przepadnie bezpowrotnie.
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <label style="font-size:12px;color:var(--color-text-secondary);">Tryb przywracania:
            <select id="backup-import-mode" style="font-size:13px;margin-left:6px;">
              <option value="replace">Zastąp (wyczyść i wgraj z pliku) — zalecane na nowym komputerze</option>
              <option value="merge">Dołącz (nadpisz wspólne klucze, resztę zostaw)</option>
            </select>
          </label>
          <div>
            <input type="file" id="backup-import-file" accept="application/json,.json" style="font-size:13px;"
              onchange="BackupModule.importFromFile(this.files[0], (document.getElementById('backup-import-mode')||{}).value)">
          </div>
        </div>
      </div>
    </div>`;
  }
};
window.BackupModule = BackupModule;

// ── Wpięcie strony „Ustawienia" (kafelek ⚙️, admin) do routingu modułów ──
// Ładowane PO app-v2.js → łańcuch: backup → app-v2 → oryginał. settings obsługuje backup,
// pozostałe moduły schodzą w dół łańcucha bez zmian.
(function () {
  const _prev = window.openModule;
  window.openModule = function (moduleName) {
    if (moduleName === 'settings') {
      const labels = (typeof getModuleLabels === 'function') ? getModuleLabels() : {};
      const item = labels['settings'];
      const titleEl = document.getElementById('module-title');
      if (titleEl && item) titleEl.textContent = item[1];
      const modView = document.getElementById('module-view');
      if (modView) modView.classList.add('active');
      const descEl = document.getElementById('module-description');
      if (descEl) descEl.textContent = '';
      const content = document.getElementById('module-content');
      if (content) content.innerHTML = BackupModule.renderSettings();
      return;
    }
    if (_prev) return _prev(moduleName);
  };
})();
