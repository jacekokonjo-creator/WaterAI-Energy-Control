/* ═══════════════════════════════════════════════════════════════════════════
   KOREKTA OBŁOŻENIA — okres bazowy (Załącznik nr 3)
   ───────────────────────────────────────────────────────────────────────────
   Metoda stopniodni z efektywną temperaturą wewnętrzną zależną od obłożenia.

     ti,eff = f_wsp·ti + (1 − f_wsp)·[ O·ti + (1 − O)·ti,red ]        (2a)
     SDeff  = z₀ · (ti,eff − tme)                                      (2)
     φ      = ΣSDeff,stand / ΣSDeff,rzecz                              (3)
     Qs     = Qc.o. · φ                                                (1)

   Wzór 2a rozszerzony o udział powierzchni wspólnych (f_wsp) — korytarze,
   kuchnie, pralnie i sale nauki są ogrzewane niezależnie od obłożenia,
   więc w akademiku/PBSA pominięcie tego zawyża efekt obłożenia.
   Przy f_wsp = 0 wzór redukuje się dokładnie do brzmienia z Załącznika nr 3.

   Plik ROZSZERZA app-v2.js (wzorzec jak backup.js) — nie modyfikuje TYM
   ani intensywności. Wszystkie funkcje delegują do oryginałów dla typów ≠ occupancy.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var OCC_DEFAULTS = { ti: 20, tiRed: 17, fCommon: 0, oRef: 100 };

  function _occN(v) { return (v === '' || v == null || isNaN(Number(v))) ? null : Number(v); }
  function _occFmt(v, d) { return (typeof _fmtA === 'function') ? _fmtA(v, d) : Number(v).toFixed(d); }
  function _occEsc(s) { return (typeof escapeHtml === 'function') ? escapeHtml(s) : String(s == null ? '' : s); }

  function _occParams(d) {
    var p = (d && d.occParams) || {};
    return {
      ti: p.ti != null && p.ti !== '' ? Number(p.ti) : OCC_DEFAULTS.ti,
      tiRed: p.tiRed != null && p.tiRed !== '' ? Number(p.tiRed) : OCC_DEFAULTS.tiRed,
      fCommon: p.fCommon != null && p.fCommon !== '' ? Number(p.fCommon) : OCC_DEFAULTS.fCommon,
      oRef: p.oRef != null && p.oRef !== '' ? Number(p.oRef) : OCC_DEFAULTS.oRef
    };
  }

  /* ti,eff — równanie 2a (rozszerzone o powierzchnie wspólne) */
  function _occTiEff(occPct, P) {
    var O = Math.min(1, Math.max(0, Number(occPct || 0) / 100));
    var fc = Math.min(1, Math.max(0, Number(P.fCommon || 0) / 100));
    var pokoje = O * P.ti + (1 - O) * P.tiRed;
    return fc * P.ti + (1 - fc) * pokoje;
  }
  window._occTiEff = _occTiEff;

  /* Pełny rachunek okresu bazowego — jedno źródło prawdy dla formularza, podglądu i analizy */
  function _occCalc(d) {
    var P = _occParams(d), rows = [], sumR = 0, sumS = 0, days = 0;
    (d.months || []).forEach(function (m) {
      var z0 = Number(m.days || 0);
      var tme = _occN(m.tme), tmeStd = _occN(m.tmeStd), occ = _occN(m.occ);
      var tiEff = _occTiEff(occ == null ? P.oRef : occ, P);
      var tiEffRef = _occTiEff(P.oRef, P);
      var grzR = (z0 > 0 && tme != null);
      var sdR = grzR ? Math.max(0, tiEff - tme) * z0 : 0;
      var sdS = (z0 > 0 && tmeStd != null) ? Math.max(0, tiEffRef - tmeStd) * z0 : 0;
      sumR += sdR; sumS += sdS; if (grzR) days += z0;
      rows.push({ name: m.name, z0: z0, tme: tme, occ: occ, tmeStd: tmeStd,
        tiEff: tiEff, tiEffRef: tiEffRef, sdR: sdR, sdS: sdS, grzR: grzR });
    });
    var phi = sumR > 0 ? sumS / sumR : null;
    var q = _occN(d.consumption);
    return { P: P, rows: rows, sumR: sumR, sumS: sumS, days: days, phi: phi,
      q: q, qs: (phi != null && q != null) ? q * phi : null };
  }
  window._occCalc = _occCalc;

  /* ── φ ─────────────────────────────────────────────────────────────────── */
  var _phiOrig = window._bpPhi;
  window._bpPhi = function (it) {
    if (it && it.type === 'occupancy') return _occCalc(it).phi;
    return _phiOrig ? _phiOrig(it) : null;
  };

  /* ── generowanie miesięcy z zakresu dat ────────────────────────────────── */
  var _setDateOrig = window.bpSetDate;
  window.bpSetDate = function (which, val) {
    if (_bpDraft && _bpDraft.type === 'occupancy') {
      _bpDraft[which] = val;
      var ms = (typeof _analMonthsBetween === 'function') ? _analMonthsBetween(_bpDraft.periodFrom, _bpDraft.periodTo) : [];
      var old = _bpDraft.months || [];
      var STD = (typeof ANAL_STD_DEFAULT !== 'undefined') ? ANAL_STD_DEFAULT : {};
      _bpDraft.months = ms.map(function (m, i) {
        var std = STD[m.month];
        return { month: m.month, name: m.name, days: m.days,
          tme: old[i] ? old[i].tme : '',
          occ: old[i] ? old[i].occ : '',
          tmeStd: (old[i] && old[i].tmeStd !== '' && old[i].tmeStd != null) ? old[i].tmeStd : (std ? std[0] : '') };
      });
      renderMeasurementsModule();
      return;
    }
    return _setDateOrig.apply(this, arguments);
  };

  /* ── nowy protokół: wstrzyknięcie domyślnych parametrów ────────────────── */
  var _newOrig = window.bpNew;
  window.bpNew = function (type) {
    _newOrig.apply(this, arguments);
    if (type === 'occupancy' && _bpDraft) {
      _bpDraft.occParams = JSON.parse(JSON.stringify(OCC_DEFAULTS));
      renderMeasurementsModule();
    }
  };

  /* ── przeliczenie na żywo ──────────────────────────────────────────────── */
  var _recalcOrig = window._bpRecalc;
  window._bpRecalc = function () {
    if (!(_bpDraft && _bpDraft.type === 'occupancy')) return _recalcOrig.apply(this, arguments);
    var c = _occCalc(_bpDraft);
    var set = function (id, v) { var e = document.getElementById(id); if (e) e.textContent = v; };
    c.rows.forEach(function (r, i) {
      set('occ-tieff-' + i, _occFmt(r.tiEff, 2));
      set('occ-sdr-' + i, r.grzR ? _occFmt(r.sdR, 1) : '—');
      set('occ-sds-' + i, _occFmt(r.sdS, 1));
    });
    set('occ-days', c.days || '—');
    set('occ-sumr', _occFmt(c.sumR, 1));
    set('occ-sums', _occFmt(c.sumS, 1));
    set('occ-phi', c.phi != null ? _occFmt(c.phi, 4) : '—');
    set('occ-qs', c.qs != null ? _occFmt(c.qs, 2) : '—');
  };

  /* ── tabela miesięczna ─────────────────────────────────────────────────── */
  function _occTable(d) {
    var c = _occCalc(d), P = c.P;
    var inS = 'width:100%;padding:5px 7px;border:1px solid var(--color-border-tertiary);border-radius:6px;font-size:13px;';
    var inN = 'width:64px;padding:5px 7px;border:1px solid var(--color-border-tertiary);border-radius:6px;font-size:13px;';
    var pl = 'display:block;font-size:12px;color:var(--color-text-secondary);margin-bottom:4px;';
    var pi = 'width:100%;padding:7px 9px;border:1px solid var(--color-border-tertiary);border-radius:8px;font-size:13px;';

    var param = function (key, label, hint, step) {
      return '<div style="flex:1;min-width:135px;"><label style="' + pl + '">' + label + '</label>' +
        '<input type="number" step="' + (step || '0.1') + '" value="' + P[key] + '" ' +
        'oninput="_bpDraft.occParams=_bpDraft.occParams||{};_bpDraft.occParams.' + key + '=this.value;_bpRecalc()" style="' + pi + '">' +
        '<span style="font-size:10.5px;color:var(--color-text-tertiary);">' + hint + '</span></div>';
    };

    var rows = c.rows.length ? c.rows.map(function (r, i) {
      var dim = r.grzR ? '' : 'opacity:0.45;';
      return '<tr style="' + dim + '">' +
        '<td style="padding:4px 8px;font-size:13px;white-space:nowrap;">' + _occEsc(r.name) + '</td>' +
        '<td style="padding:4px;"><input type="number" min="0" max="31" value="' + (d.months[i].days == null ? '' : d.months[i].days) + '" oninput="_bpDraft.months[' + i + '].days=this.value;_bpRecalc()" style="' + inN + '"></td>' +
        '<td style="padding:4px;"><input type="number" step="0.1" value="' + (d.months[i].tme == null ? '' : d.months[i].tme) + '" oninput="_bpDraft.months[' + i + '].tme=this.value;_bpRecalc()" style="' + inS + '"></td>' +
        '<td style="padding:4px;"><input type="number" step="1" min="0" max="100" value="' + (d.months[i].occ == null ? '' : d.months[i].occ) + '" oninput="_bpDraft.months[' + i + '].occ=this.value;_bpRecalc()" style="' + inS + '"></td>' +
        '<td style="padding:4px 8px;text-align:right;font-size:13px;color:var(--color-text-secondary);" id="occ-tieff-' + i + '">' + _occFmt(r.tiEff, 2) + '</td>' +
        '<td style="padding:4px 8px;text-align:right;font-size:13px;font-weight:500;" id="occ-sdr-' + i + '">' + (r.grzR ? _occFmt(r.sdR, 1) : '—') + '</td>' +
        '<td style="padding:4px;border-left:2px solid #B5D4F4;"><input type="number" step="0.1" value="' + (d.months[i].tmeStd == null ? '' : d.months[i].tmeStd) + '" oninput="_bpDraft.months[' + i + '].tmeStd=this.value;_bpRecalc()" style="' + inS + '"></td>' +
        '<td style="padding:4px 8px;text-align:right;font-size:13px;font-weight:500;" id="occ-sds-' + i + '">' + _occFmt(r.sdS, 1) + '</td>' +
        '</tr>';
    }).join('') : '<tr><td colspan="8" style="padding:14px;text-align:center;color:var(--color-text-secondary);font-size:13px;">Ustaw daty okresu, aby wygenerować miesiące.</td></tr>';

    var th = 'padding:4px 8px;text-align:left;font-size:11px;color:var(--color-text-secondary);';
    var thR = 'padding:4px 8px;text-align:right;font-size:11px;color:var(--color-text-secondary);';

    return '' +
    '<div style="border:1px solid #B5D4F4;border-radius:10px;background:#F7FAFE;padding:12px 14px;margin-bottom:14px;">' +
      '<div style="font-weight:600;color:#0C447C;font-size:12.5px;margin-bottom:9px;">Parametry metody (Załącznik nr 3, równanie 2a)</div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
        param('ti', 'tᵢ — pokoje użytkowane [°C]', 'projektowa, zwykle 20') +
        param('tiRed', 'tᵢ,red — pokoje puste [°C]', 'obniżona, zwykle 17') +
        param('fCommon', 'f_wsp — powierzchnie wspólne [%]', 'grzane niezależnie od obłożenia', '1') +
        param('oRef', 'O_ref — obłożenie referencyjne [%]', 'dla sezonu standardowego', '1') +
      '</div>' +
      '<div style="font-size:11px;color:#33475B;margin-top:9px;line-height:1.5;">' +
        'Przy <b>f_wsp = 0</b> wzór jest dokładnie taki jak w Załączniku nr 3. Wartość &gt; 0 uwzględnia części wspólne budynku (korytarze, klatki, kuchnie, recepcja) ogrzewane niezależnie od obłożenia. Liczbę dni grzewczych w miesiącu ustalasz kolumną z₀ — wpisz 0, aby wyłączyć miesiąc.' +
      '</div>' +
    '</div>' +

    '<table style="width:100%;border-collapse:collapse;margin-top:6px;">' +
      '<thead>' +
        '<tr style="background:var(--color-background-secondary);">' +
          '<th rowspan="2" style="' + th + '">Miesiąc</th>' +
          '<th colspan="5" style="padding:6px 8px;text-align:center;font-size:11px;color:#0C447C;">Okres rzeczywisty</th>' +
          '<th colspan="2" style="padding:6px 8px;text-align:center;font-size:11px;color:#0C447C;border-left:2px solid #B5D4F4;">Sezon standardowy (TYM)</th>' +
        '</tr>' +
        '<tr style="background:var(--color-background-secondary);">' +
          '<th style="' + th + '">dni z₀</th>' +
          '<th style="' + th + '">tme [°C]</th>' +
          '<th style="' + th + '">O [%]</th>' +
          '<th style="' + thR + '">tᵢ,eff [°C]</th>' +
          '<th style="' + thR + '">SDeff,rzecz</th>' +
          '<th style="' + th + 'border-left:2px solid #B5D4F4;">tme,std [°C]</th>' +
          '<th style="' + thR + '">SDeff,stand</th>' +
        '</tr>' +
      '</thead>' +
      '<tbody>' + rows + '</tbody>' +
      '<tfoot><tr style="border-top:1px solid var(--color-border-tertiary);font-weight:600;font-size:13px;">' +
        '<td style="padding:6px 8px;">Suma</td>' +
        '<td style="padding:6px 8px;" id="occ-days">' + (c.days || '—') + '</td>' +
        '<td colspan="3"></td>' +
        '<td style="padding:6px 8px;text-align:right;" id="occ-sumr">' + _occFmt(c.sumR, 1) + '</td>' +
        '<td style="padding:6px 8px;border-left:2px solid #B5D4F4;"></td>' +
        '<td style="padding:6px 8px;text-align:right;" id="occ-sums">' + _occFmt(c.sumS, 1) + '</td>' +
      '</tr></tfoot>' +
    '</table>' +

    '<div style="margin-top:12px;padding:12px 14px;border-radius:10px;background:#E6F1FB;border:1px solid #B5D4F4;font-size:13px;color:#0C447C;">' +
      'φ = ΣSDeff,stand / ΣSDeff,rzecz = <b id="occ-phi">' + (c.phi != null ? _occFmt(c.phi, 4) : '—') + '</b>' +
      ' · Qs = Qc.o.·φ = <b id="occ-qs">' + (c.qs != null ? _occFmt(c.qs, 2) : '—') + '</b> ' + _occEsc(d.energyUnit || 'GJ') +
      '<div style="font-size:11px;opacity:0.8;margin-top:5px;">Miesiące z z₀ = 0 lub bez temperatury są wyszarzone i nie wchodzą do sum.</div>' +
    '</div>';
  }

  /* ── formularz ─────────────────────────────────────────────────────────── */
  var _formOrig = window._bpFormHtml;
  window._bpFormHtml = function () {
    var html = _formOrig.apply(this, arguments);
    if (!(_bpDraft && _bpDraft.type === 'occupancy')) return html;
    var marker = '<div style="margin-bottom:6px;"><label style="display:block;font-size:12px;color:var(--color-text-secondary);margin-bottom:4px;">Notatki / dane źródłowe</label>';
    var i = html.indexOf(marker);
    if (i < 0) return html;           // struktura się zmieniła — nie psuj, zostaw oryginał
    var j = html.indexOf('</textarea></div>', i);
    if (j < 0) return html;
    var notes = html.slice(i, j + '</textarea></div>'.length);
    return html.slice(0, i) + _occTable(_bpDraft) + '<div style="margin-top:14px;">' + notes + '</div>' + html.slice(j + '</textarea></div>'.length);
  };

  /* ── podgląd: obliczenia krok po kroku ze wzorami ──────────────────────── */
  var _viewOrig = window._bpViewHtml;
  window._bpViewHtml = function (it) {
    if (!(it && it.type === 'occupancy')) return _viewOrig.apply(this, arguments);
    var c = _occCalc(it), P = c.P;
    var cl = (typeof ClientsModule !== 'undefined') ? ClientsModule.find(it.clientId) : null;
    var ob = (typeof ObjectsModule !== 'undefined') ? ObjectsModule.find(it.objectId) : null;
    var u = _occEsc(it.energyUnit || 'GJ');
    var row = function (k, v) { return '<tr><td style="padding:6px 10px;color:var(--color-text-secondary);font-size:12px;width:180px;">' + k + '</td><td style="padding:6px 10px;font-size:13px;font-weight:500;">' + v + '</td></tr>'; };
    var td = 'padding:5px 8px;font-size:12.5px;';
    var tdR = td + 'text-align:right;';

    var body = c.rows.map(function (r) {
      return '<tr style="border-bottom:1px solid var(--color-border-tertiary);' + (r.grzR ? '' : 'opacity:0.45;') + '">' +
        '<td style="' + td + '">' + _occEsc(r.name) + '</td>' +
        '<td style="' + tdR + '">' + r.z0 + '</td>' +
        '<td style="' + tdR + '">' + (r.tme != null ? _occFmt(r.tme, 1) : '—') + '</td>' +
        '<td style="' + tdR + '">' + (r.occ != null ? _occFmt(r.occ, 0) + '%' : '—') + '</td>' +
        '<td style="' + tdR + '">' + _occFmt(r.tiEff, 2) + '</td>' +
        '<td style="' + tdR + 'font-weight:600;">' + (r.grzR ? _occFmt(r.sdR, 1) : '—') + '</td>' +
        '<td style="' + tdR + 'border-left:2px solid #B5D4F4;">' + (r.tmeStd != null ? _occFmt(r.tmeStd, 1) : '—') + '</td>' +
        '<td style="' + tdR + 'font-weight:600;">' + _occFmt(r.sdS, 1) + '</td>' +
      '</tr>';
    }).join('');

    var step = function (n, title, inner) {
      return '<div style="margin-top:14px;"><div style="font-size:12px;font-weight:600;color:#0C447C;margin-bottom:6px;">Krok ' + n + ' — ' + title + '</div>' + inner + '</div>';
    };
    var box = function (s) { return '<div style="background:#F7FAFE;border:1px solid #B5D4F4;border-radius:8px;padding:10px 12px;font-size:12.5px;color:#33475B;line-height:1.6;">' + s + '</div>'; };

    return '<div style="padding:16px;background:var(--color-background-primary);">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
        '<strong style="font-size:14px;">Podgląd okresu bazowego — 🏨 Korekta obłożenia</strong>' +
        '<div><button class="small-button" onclick="bpEdit(' + it.id + ')">✏️ Edytuj</button> <button class="small-button" onclick="bpBack()">← Lista</button></div>' +
      '</div>' +
      '<table style="width:100%;border-collapse:collapse;border:1px solid var(--color-border-tertiary);border-radius:8px;overflow:hidden;">' +
        row('Numer protokołu', _occEsc(it.protocolNumber || '—')) +
        row('Data protokołu', _occEsc(it.protocolDate || '—')) +
        row('Klient', _occEsc((cl && cl.name) || '—')) +
        row('Obiekt', _occEsc((ob && ob.name) || '—')) +
        row('Okres bazowy', _occEsc(it.periodFrom || '') + ' → ' + _occEsc(it.periodTo || '')) +
        row('Zużycie Qc.o.', (c.q != null ? _occFmt(c.q, 3) : '—') + ' ' + u) +
      '</table>' +

      step(1, 'Efektywna temperatura wewnętrzna (równanie 2a)',
        box('tᵢ,eff = f_wsp·tᵢ + (1 − f_wsp)·[ O·tᵢ + (1 − O)·tᵢ,red ]<br>' +
            'tᵢ = <b>' + _occFmt(P.ti, 1) + ' °C</b> · tᵢ,red = <b>' + _occFmt(P.tiRed, 1) + ' °C</b> · ' +
            'f_wsp = <b>' + _occFmt(P.fCommon, 0) + '%</b> · O_ref = <b>' + _occFmt(P.oRef, 0) + '%</b>')) +

      step(2, 'Stopniodni z uwzględnieniem obłożenia (równanie 2)',
        '<div style="overflow-x:auto;border:1px solid var(--color-border-tertiary);border-radius:8px;">' +
        '<table style="width:100%;border-collapse:collapse;">' +
          '<thead><tr style="background:var(--color-background-secondary);">' +
            '<th style="' + td + 'text-align:left;">Miesiąc</th><th style="' + tdR + '">z₀</th><th style="' + tdR + '">tme</th>' +
            '<th style="' + tdR + '">O</th><th style="' + tdR + '">tᵢ,eff</th><th style="' + tdR + '">SDeff,rzecz</th>' +
            '<th style="' + tdR + 'border-left:2px solid #B5D4F4;">tme,std</th><th style="' + tdR + '">SDeff,stand</th>' +
          '</tr></thead><tbody>' + body + '</tbody>' +
          '<tfoot><tr style="font-weight:700;font-size:13px;background:var(--color-background-secondary);">' +
            '<td style="' + td + '">Σ</td><td style="' + tdR + '">' + c.days + '</td><td colspan="3"></td>' +
            '<td style="' + tdR + '">' + _occFmt(c.sumR, 1) + '</td><td style="border-left:2px solid #B5D4F4;"></td>' +
            '<td style="' + tdR + '">' + _occFmt(c.sumS, 1) + '</td>' +
          '</tr></tfoot></table></div>') +

      step(3, 'Współczynnik korekcyjny (równanie 3)',
        box('φ = ΣSDeff,stand / ΣSDeff,rzecz = ' + _occFmt(c.sumS, 1) + ' / ' + _occFmt(c.sumR, 1) +
            ' = <b style="font-size:15px;">' + (c.phi != null ? _occFmt(c.phi, 4) : '—') + '</b>')) +

      step(4, 'Zużycie skorygowane (równanie 1)',
        box('Qs c.o. = Qc.o. · φ = ' + (c.q != null ? _occFmt(c.q, 3) : '—') + ' · ' + (c.phi != null ? _occFmt(c.phi, 4) : '—') +
            ' = <b style="font-size:15px;">' + (c.qs != null ? _occFmt(c.qs, 2) : '—') + ' ' + u + '</b>')) +

      (it.notes ? '<div style="margin-top:14px;font-size:12.5px;color:var(--color-text-secondary);"><b>Notatki:</b> ' + _occEsc(it.notes) + '</div>' : '') +
    '</div>';
  };

  /* ── walidacja przy zapisie ────────────────────────────────────────────── */
  var _saveOrig = window.bpSave;
  window.bpSave = function () {
    if (_bpDraft && _bpDraft.type === 'occupancy') {
      var miss = (_bpDraft.months || []).filter(function (m) { return _occN(m.tme) == null || _occN(m.occ) == null; });
      if ((_bpDraft.months || []).length && miss.length &&
          !confirm('W ' + miss.length + ' miesiącach brakuje tme lub obłożenia — te miesiące nie wejdą do φ. Zapisać mimo to?')) return;
    }
    return _saveOrig.apply(this, arguments);
  };

  console.log('[occupancy] Korekta obłożenia — okres bazowy wpięty (Załącznik nr 3)');
})();

/* ═══════════════════════════════════════════════════════════════════════════
   KOREKTA OBŁOŻENIA — ANALIZA (kreator)
   ───────────────────────────────────────────────────────────────────────────
   Model ogólny, niezależny od klienta. Arkusz jak w TYM, z dwiema różnicami:
     • kolumna O [%] — obłożenie miesięczne, z którego liczone jest tᵢ,eff
     • kolumna „odlicz." — dowolne odliczenie od Qc.o. (np. c.w.u., technologia,
       najemca na podliczniku). Wpisywane ręcznie; skąd wzięta liczba, decyduje
       analityk. Puste = 0, czyli metoda redukuje się do czystych stopniodni.

   O_ref jest JEDNO dla całej analizy (z okresu bazowego) i obowiązuje tak samo
   dla PRZED i PO — inaczej oszczędność byłaby artefaktem zmiany bazy odniesienia.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function N(v) { return (v === '' || v == null || isNaN(Number(v))) ? null : Number(v); }
  function F(v, d) { return (typeof _fmtA === 'function') ? _fmtA(v, d) : Number(v).toFixed(d); }

  function _occAnalP() {
    var p = (window.ANAL && ANAL.occParams) || {};
    return { ti: N(p.ti) != null ? N(p.ti) : 20, tiRed: N(p.tiRed) != null ? N(p.tiRed) : 17,
      fCommon: N(p.fCommon) != null ? N(p.fCommon) : 0, oRef: N(p.oRef) != null ? N(p.oRef) : 100 };
  }

  /* Qc.o. netto = zużycie okresu − suma odliczeń miesięcznych */
  function _occNetQ(P) {
    var q = N(P.consumption); if (q == null) return null;
    var ded = 0;
    (P.months || []).forEach(function (m) { ded += N(m.ded) || 0; });
    return q - ded;
  }
  window._occNetQ = _occNetQ;

  /* ── silnik: nadpisanie _analComputePeriod tylko dla OCCUPANCY ──────────── */
  var _cpOrig = window._analComputePeriod;
  window._analComputePeriod = function (key) {
    if (!(window.ANAL && ANAL.type === 'OCCUPANCY')) return _cpOrig.apply(this, arguments);
    var P = ANAL[key], p = _occAnalP(), sumR = 0, sumS = 0, days = 0;
    var tiEffRef = _occTiEff(p.oRef, p);
    (P.months || []).forEach(function (mo, idx) {
      var z0 = Number(mo.days || 0);
      var tme = N(mo.tme), occ = N(mo.occ);
      var stdM = ANAL.std[mo.month] || [0, 0];
      var tmeStd = N(stdM[0]);
      var tiEff = _occTiEff(occ == null ? p.oRef : occ, p);
      var grzR = (z0 > 0 && tme != null);
      var sdR = grzR ? Math.max(0, tiEff - tme) * z0 : 0;
      var sdS = (z0 > 0 && tmeStd != null) ? Math.max(0, tiEffRef - tmeStd) * z0 : 0;
      sumR += sdR; sumS += sdS; days += z0;
      var e1 = document.getElementById('anw-' + key + '-sdr-' + idx); if (e1) e1.textContent = grzR ? F(sdR, 1) : '—';
      var e2 = document.getElementById('anw-' + key + '-sds-' + idx); if (e2) e2.textContent = F(sdS, 1);
      var e3 = document.getElementById('anw-' + key + '-tieff-' + idx); if (e3) e3.textContent = F(tiEff, 2);
    });
    var phi = sumR > 0 ? sumS / sumR : null;
    var q = _occNetQ(P);
    var eq = document.getElementById('anw-' + key + '-netq'); if (eq) eq.textContent = q != null ? F(q, 3) : '—';
    return { sumR: sumR, sumS: sumS, days: days, phi: phi, q: q || 0, qs: (phi != null && q != null) ? q * phi : null };
  };

  /* ── wczytanie okresu bazowego obłożenia do kreatora ────────────────────── */
  window._analApplyOccupancyBase = function (it) {
    ANAL.occParams = JSON.parse(JSON.stringify(it.occParams || { ti: 20, tiRed: 17, fCommon: 0, oRef: 100 }));
    ANAL.before.from = it.periodFrom || '';
    ANAL.before.to = it.periodTo || '';
    ANAL.before.months = (it.months || []).map(function (m) {
      return { month: Number(m.month), name: m.name, days: m.days, tme: m.tme, occ: m.occ, ded: m.ded || '' };
    });
    var std = {};
    for (var mo = 1; mo <= 12; mo++) std[mo] = [ANAL_STD_DEFAULT[mo] ? ANAL_STD_DEFAULT[mo][0] : 0, new Date(2025, mo, 0).getDate()];
    (it.months || []).forEach(function (m) {
      var k = Number(m.month);
      if (k >= 1 && k <= 12) std[k] = [(m.tmeStd != null && m.tmeStd !== '') ? m.tmeStd : std[k][0], (m.days != null ? m.days : std[k][1])];
    });
    ANAL.std = std;
    ANAL.before.consumption = (it.consumption != null) ? it.consumption : '';
    if (it.energyUnit) ANAL.energy.unit = it.energyUnit;
  };

  /* przechwycenie wyboru „occ:<id>" w selektorze okresu bazowego */
  var _obpOrig = window.analOnBasePeriod;
  window.analOnBasePeriod = function (v) {
    if (typeof v === 'string' && v.indexOf('occ:') === 0 && window.BasePeriodModule) {
      var it = BasePeriodModule.find(Number(v.slice(4)));
      ANAL.basePeriod = v;
      if (it) _analApplyOccupancyBase(it);
      renderAnalysesModule();
      return;
    }
    return _obpOrig.apply(this, arguments);
  };

  /* ── arkusz okresu (PRZED / PO) ─────────────────────────────────────────── */
  function _occPeriodSheet(key, title, headCls, ico, qLabel) {
    var P = ANAL[key], p = _occAnalP();
    var tiEffRef = _occTiEff(p.oRef, p);
    var months = Array.isArray(P.months) ? P.months : [];
    var rows = months.length ? months.map(function (mo, idx) {
      var z0 = Number(mo.days || 0), tme = N(mo.tme), occ = N(mo.occ);
      var stdM = ANAL.std[mo.month] || [0, 0], tmeStd = N(stdM[0]);
      var tiEff = _occTiEff(occ == null ? p.oRef : occ, p);
      var grzR = (z0 > 0 && tme != null);
      var sdR = grzR ? Math.max(0, tiEff - tme) * z0 : 0;
      var sdS = (z0 > 0 && tmeStd != null) ? Math.max(0, tiEffRef - tmeStd) * z0 : 0;
      return '<tr' + (grzR ? '' : ' style="opacity:.45;"') + '>' +
        '<td>' + mo.name + '</td>' +
        '<td><input type="number" min="0" max="31" value="' + (mo.days == null ? '' : mo.days) + '" oninput="ANAL.' + key + '.months[' + idx + '].days=this.value;_analRecalcLive()"></td>' +
        '<td><input type="number" step="0.1" value="' + (mo.tme == null ? '' : mo.tme) + '" placeholder="tme" oninput="ANAL.' + key + '.months[' + idx + '].tme=this.value;_analRecalcLive()"></td>' +
        '<td><input type="number" step="1" min="0" max="100" value="' + (mo.occ == null ? '' : mo.occ) + '" placeholder="O %" oninput="ANAL.' + key + '.months[' + idx + '].occ=this.value;_analRecalcLive()"></td>' +
        '<td class="calc" id="anw-' + key + '-tieff-' + idx + '">' + F(tiEff, 2) + '</td>' +
        '<td class="calc" id="anw-' + key + '-sdr-' + idx + '">' + (grzR ? F(sdR, 1) : '—') + '</td>' +
        '<td><input type="number" step="0.001" value="' + (mo.ded == null ? '' : mo.ded) + '" placeholder="0" oninput="ANAL.' + key + '.months[' + idx + '].ded=this.value;_analRecalcLive()"></td>' +
        '<td class="anw-sep"><input type="number" step="0.1" value="' + stdM[0] + '" placeholder="tme,std" oninput="ANAL.std[' + mo.month + '][0]=this.value;_analRecalcLive()"></td>' +
        '<td class="calc" id="anw-' + key + '-sds-' + idx + '">' + F(sdS, 1) + '</td>' +
      '</tr>';
    }).join('') : '<tr><td colspan="9" style="text-align:center;padding:14px;">Ustaw zakres dat okresu.</td></tr>';

    return '<div class="anw-sec"><div class="anw-head ' + headCls + '"><span class="ico">' + ico + '</span><h3>' + title + '</h3></div><div class="anw-body">' +
      '<div class="anw-row">' +
        '<div class="anw-f"><label>Data od</label><input type="date" value="' + (P.from || '') + '" onchange="analOnDates(\'' + key + '\',\'from\',this.value)"></div>' +
        '<div class="anw-f"><label>Data do</label><input type="date" value="' + (P.to || '') + '" onchange="analOnDates(\'' + key + '\',\'to\',this.value)"></div>' +
        '<div class="anw-f"><label>' + qLabel + ' [' + (ANAL.energy.unit || 'GJ') + ']</label><input type="number" step="0.001" value="' + (P.consumption == null ? '' : P.consumption) + '" oninput="ANAL.' + key + '.consumption=this.value;_analRecalcLive()"></div>' +
        '<div class="anw-f"><label>po odliczeniach</label><div class="calc" id="anw-' + key + '-netq" style="padding:8px 0;font-weight:600;">' + (function () { var q = _occNetQ(P); return q != null ? F(q, 3) : '—'; })() + '</div></div>' +
      '</div>' +
      '<table class="anw-t"><thead><tr>' +
        '<th>Miesiąc</th><th>dni z₀</th><th>tme [°C]</th><th>O [%]</th><th>tᵢ,eff</th><th>SDeff,rzecz</th><th>odlicz.</th>' +
        '<th class="anw-sep">tme,std</th><th>SDeff,stand</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table>' +
      '<div class="anw-muted" style="margin-top:8px;">Kolumna <b>odlicz.</b> — ilość energii odejmowana od Qc.o. tego okresu (c.w.u., technologia, podlicznik najemcy). Wpisywana ręcznie, w jednostce zużycia. Puste = brak odliczenia.</div>' +
    '</div></div>';
  }

  /* ── nagłówek parametrów metody ─────────────────────────────────────────── */
  function _occParamBar() {
    var p = _occAnalP();
    var f = function (k, lab) {
      return '<div class="anw-f" style="min-width:120px;"><label>' + lab + '</label>' +
        '<input type="number" step="0.1" value="' + p[k] + '" oninput="ANAL.occParams=ANAL.occParams||{};ANAL.occParams.' + k + '=this.value;_analRecalcLive()"></div>';
    };
    return '<div class="anw-sec"><div class="anw-head anw-gold"><span class="ico">🏨</span><h3>Parametry metody — wspólne dla PRZED i PO</h3></div><div class="anw-body">' +
      '<div class="anw-row">' + f('ti', 'tᵢ [°C]') + f('tiRed', 'tᵢ,red [°C]') + f('fCommon', 'f_wsp [%]') + f('oRef', 'O_ref [%]') + '</div>' +
      '<div class="anw-muted" style="margin-top:8px;">tᵢ,eff = f_wsp·tᵢ + (1−f_wsp)·[O·tᵢ + (1−O)·tᵢ,red] · SDeff = z₀·(tᵢ,eff − tme), gdzie z₀ = dni grzewcze wpisane ręcznie · φ = ΣSDeff,stand / ΣSDeff,rzecz · Qs = Qc.o.netto·φ<br>' +
      'O_ref obowiązuje identycznie w obu okresach — zmiana bazy odniesienia między PRZED a PO dałaby pozorną oszczędność.</div>' +
    '</div></div>';
  }

  window._analOCCSheet = function () {
    return _occParamBar() +
      _occPeriodSheet('before', 'Okres bazowy — PRZED instalacją', 'anw-before', '📉', 'Qc.o. przed') +
      _occPeriodSheet('after', 'Okres analizowany — PO instalacji', 'anw-after', '📈', 'Qc.o. po') +
      _analEnergyBlock();
  };

  console.log('[occupancy] Analiza — Korekta obłożenia wpięta w kreator');
})();
