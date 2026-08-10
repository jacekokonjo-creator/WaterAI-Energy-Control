// ─────────────────────────────────────────────────────────────────────────
// i18n-ui-core-4.js — fragmenty napisów przerwanych w kodzie przez ${…}.
//
// Skąd się wzięły: w kodzie zdanie bywa poprzecinane wstawkami, np.
//   `Data raportu: ${fmtDate(rep.reportDate)}`
//   `Prognoza zakłada dodatkowo: ${prcTxt}, niezmieniony sposób ... oraz`
// W DOM każdy kawałek jest osobnym (albo sklejonym z wartością) węzłem
// tekstowym, więc dopasowanie po pełnym kluczu nigdy nie trafia — podmiany
// dokonuje pass podłańcuchowy, a ten potrzebuje fragmentu jako klucza.
//
// Audyt do 2026-08-10 takie fragmenty POMIJAŁ (traktował je jako „urwany kod"),
// więc nigdy nie zgłosił braku. To dlatego słowacki raport ESCO pokazywał
// „Data raportu", „Prognoza zakłada dodatkowo:" i „Korekta TYM · Restauracja"
// po polsku, mimo raportowanego 100% pokrycia. Audyt rozbija je teraz na części
// i sprawdza każdą osobno.
//
// Format jak w pozostałych plikach: krotki [PL, SK, CS, EN, DE, ES], AT po DE.
// Interpunkcja i spacje są częścią klucza — „Opracował:" i „Opracował" to
// dwa różne klucze.
// ─────────────────────────────────────────────────────────────────────────
(function () {
  'use strict';

  // [ PL, SK, CS, EN, DE, ES ]
  const T = [
    // ── Raport ESCO: nagłówki i stopka ──
    ['Data raportu:', 'Dátum správy:', 'Datum zprávy:', 'Report date:', 'Berichtsdatum:', 'Fecha del informe:'],
    ['Data utworzenia:', 'Dátum vytvorenia:', 'Datum vytvoření:', 'Created on:', 'Erstellt am:', 'Fecha de creación:'],
    ['Opracował:', 'Vypracoval:', 'Zpracoval:', 'Prepared by:', 'Erstellt von:', 'Elaborado por:'],
    ['dane pobrano:', 'údaje stiahnuté:', 'data stažena:', 'data retrieved:', 'Daten abgerufen:', 'datos obtenidos:'],
    ['źródło:', 'zdroj:', 'zdroj:', 'source:', 'Quelle:', 'fuente:'],
    ['Na podstawie', 'Na základe', 'Na základě', 'Based on', 'Auf Grundlage von', 'Con base en'],
    ['Metoda główna —', 'Hlavná metóda —', 'Hlavní metoda —', 'Main method —', 'Hauptmethode —', 'Método principal —'],
    ['Tryb pogodowy —', 'Ekvitermný režim —', 'Ekvitermní režim —', 'Weather-compensated mode —', 'Witterungsgeführter Betrieb —', 'Modo compensado por clima —'],
    ['Temperatury rzeczywiste i normy standardowe (TYM) —', 'Skutočné teploty a štandardné normy (TMR) —', 'Skutečné teploty a standardní normy (TMR) —', 'Actual temperatures and standard norms (TMY) —', 'Tatsächliche Temperaturen und Standardnormen (TRJ) —', 'Temperaturas reales y normas estándar (TMY) —'],
    ['📋 Okres bazowy:', '📋 Základné obdobie:', '📋 Základní období:', '📋 Baseline period:', '📋 Basiszeitraum:', '📋 Período base:'],
    ['📋 Okres bazowy —', '📋 Základné obdobie —', '📋 Základní období —', '📋 Baseline period —', '📋 Basiszeitraum —', '📋 Período base —'],
    ['Szczegółowe wyprowadzenia i dane źródłowe zawierają załączniki dowodowe.', 'Podrobné odvodenia a zdrojové údaje obsahujú dôkazové prílohy.', 'Podrobná odvození a zdrojová data obsahují důkazní přílohy.', 'Detailed derivations and source data are provided in the evidence annexes.', 'Ausführliche Herleitungen und Quelldaten enthalten die Nachweisanhänge.', 'Las derivaciones detalladas y los datos de origen figuran en los anexos probatorios.'],
    ['Wynik można odtworzyć z danych wymienionych w punkcie', 'Výsledok možno zreprodukovať z údajov uvedených v bode', 'Výsledek lze zreprodukovat z dat uvedených v bodě', 'The result can be reproduced from the data listed in point', 'Das Ergebnis lässt sich aus den in Punkt genannten Daten reproduzieren', 'El resultado puede reproducirse a partir de los datos indicados en el punto'],
    ['przechowywany w systemie w wersji z dnia zamrożenia raportu ESCO i udostępniany Zamawiającemu na żądanie.', 'uchovávaný v systéme vo verzii ku dňu zmrazenia správy ESCO a sprístupňovaný objednávateľovi na požiadanie.', 'uchovávaný v systému ve verzi ke dni zmrazení zprávy ESCO a zpřístupňovaný objednateli na požádání.', 'stored in the system in the version as at the ESCO report freeze date and made available to the client on request.', 'im System in der Fassung zum Zeitpunkt des Einfrierens des ESCO-Berichts gespeichert und dem Auftraggeber auf Anfrage zugänglich gemacht.', 'conservado en el sistema en la versión de la fecha de congelación del informe ESCO y puesto a disposición del cliente cuando lo solicite.'],
    ['Zgodność dwóch niezależnych metod, opartych na różnych źródłach danych (licznik główny vs czujniki), wzajemnie potwierdza wiarygodność wyniku.', 'Zhoda dvoch nezávislých metód, opretých o rôzne zdroje údajov (hlavný merač vs snímače), vzájomne potvrdzuje vierohodnosť výsledku.', 'Shoda dvou nezávislých metod, opřených o různé zdroje dat (hlavní měřidlo vs čidla), vzájemně potvrzuje věrohodnost výsledku.', 'The agreement of two independent methods based on different data sources (main meter vs sensors) mutually confirms the reliability of the result.', 'Die Übereinstimmung zweier unabhängiger Methoden auf Basis verschiedener Datenquellen (Hauptzähler vs. Sensoren) bestätigt wechselseitig die Verlässlichkeit des Ergebnisses.', 'La concordancia de dos métodos independientes basados en fuentes de datos distintas (contador principal frente a sensores) confirma mutuamente la fiabilidad del resultado.'],
    ['Model ESCO oznacza, że wynagrodzenie WaterAI pochodzi wyłącznie z realnie osiągniętych i udowodnionych oszczędności — bez oszczędności nie ma opłat.', 'Model ESCO znamená, že odmena WaterAI pochádza výlučne z reálne dosiahnutých a preukázaných úspor — bez úspor niet poplatkov.', 'Model ESCO znamená, že odměna WaterAI pochází výhradně z reálně dosažených a prokázaných úspor — bez úspor nejsou poplatky.', 'The ESCO model means that WaterAI is paid solely out of savings actually achieved and proven — no savings, no fees.', 'Das ESCO-Modell bedeutet, dass die Vergütung von WaterAI ausschließlich aus tatsächlich erzielten und nachgewiesenen Einsparungen stammt — ohne Einsparungen keine Gebühren.', 'El modelo ESCO significa que la remuneración de WaterAI procede únicamente de ahorros realmente logrados y demostrados: sin ahorro no hay honorarios.'],

    // ── Prognoza i założenia ──
    ['Prognoza zakłada dodatkowo:', 'Prognóza navyše predpokladá:', 'Prognóza navíc předpokládá:', 'The forecast additionally assumes:', 'Die Prognose setzt zusätzlich voraus:', 'La previsión supone además:'],
    ['W horyzoncie', 'V horizonte', 'V horizontu', 'Over a horizon of', 'Im Horizont von', 'En un horizonte de'],
    ['lat, przy założeniu oszczędności', 'rokov, pri predpoklade úspory', 'let, za předpokladu úspory', 'years, assuming savings of', 'Jahren, bei angenommener Einsparung von', 'años, suponiendo un ahorro de'],
    ['oszczędności o łącznej wartości około', 'úspory v celkovej hodnote približne', 'úspory v celkové hodnotě přibližně', 'savings worth approximately', 'Einsparungen im Gesamtwert von rund', 'ahorros por un valor total aproximado de'],
    ['Z tej kwoty wpływy klienta wyniosą', 'Z tejto sumy budú príjmy klienta', 'Z této částky budou příjmy klienta', 'Of that amount, the client receives', 'Davon entfallen auf den Kunden', 'De ese importe, los ingresos del cliente ascenderán a'],
    ['Różnica ok.', 'Rozdiel cca', 'Rozdíl cca', 'Difference approx.', 'Differenz ca.', 'Diferencia aprox.'],
    ['mieści się w przedziale od', 'sa nachádza v rozmedzí od', 'se nachází v rozmezí od', 'falls within the range from', 'liegt im Bereich von', 'se sitúa en el intervalo de'],
    ['w zakresie temperatur zewnętrznych', 'v rozsahu vonkajších teplôt', 'v rozsahu venkovních teplot', 'over the outdoor temperature range', 'im Bereich der Außentemperaturen', 'en el rango de temperaturas exteriores'],
    ['Redukcja wykazana regresją zmienia się z temperaturą zewnętrzną — od ok.', 'Redukcia preukázaná regresiou sa mení s vonkajšou teplotou — od cca', 'Redukce prokázaná regresí se mění s venkovní teplotou — od cca', 'The reduction shown by the regression varies with outdoor temperature — from approx.', 'Die durch die Regression gezeigte Reduktion ändert sich mit der Außentemperatur — ab ca.', 'La reducción mostrada por la regresión varía con la temperatura exterior: desde aprox.'],
    ['≈ 1 — warunki rzeczywiste odpowiadały standardowym.', '≈ 1 — skutočné podmienky zodpovedali štandardným.', '≈ 1 — skutečné podmínky odpovídaly standardním.', '≈ 1 — the actual conditions matched the standard ones.', '≈ 1 — die tatsächlichen Bedingungen entsprachen den Standardbedingungen.', '≈ 1 — las condiciones reales coincidieron con las estándar.'],
    ['Baza regresji obejmuje okres od montażu urządzenia do aktywacji optymalizacji', 'Báza regresie zahŕňa obdobie od montáže zariadenia po aktiváciu optimalizácie', 'Báze regrese zahrnuje období od montáže zařízení po aktivaci optimalizace', 'The regression baseline covers the period from device installation to optimisation activation', 'Die Regressionsbasis umfasst den Zeitraum von der Gerätemontage bis zur Aktivierung der Optimierung', 'La base de la regresión abarca desde el montaje del equipo hasta la activación de la optimización'],

    // ── Modele rozliczenia ──
    ['W wariancie „bez opłat” klient nie ponosi żadnej opłaty wstępnej i od pierwszego roku otrzymuje ustalony udział', 'Vo variante „bez poplatkov" klient neplatí žiadny vstupný poplatok a od prvého roka dostáva dohodnutý podiel', 'Ve variantě „bez poplatků" klient neplatí žádný vstupní poplatek a od prvního roku dostává sjednaný podíl', 'Under the "no fees" option the client pays no upfront fee and receives the agreed share from the first year', 'In der Variante „ohne Gebühren" zahlt der Kunde keine Anfangsgebühr und erhält ab dem ersten Jahr den vereinbarten Anteil', 'En la modalidad «sin cargos», el cliente no paga ninguna cuota inicial y recibe la participación acordada desde el primer año'],
    ['W wariancie „kaucja zwrotna” klient wpłaca zwrotną kaucję', 'Vo variante „vratná záloha" klient skladá vratnú zálohu', 'Ve variantě „vratná záloha" klient skládá vratnou zálohu', 'Under the "refundable deposit" option the client pays a refundable deposit', 'In der Variante „rückzahlbare Kaution" zahlt der Kunde eine rückzahlbare Kaution', 'En la modalidad «depósito reembolsable», el cliente abona un depósito reembolsable'],
    ['W wariancie „kaucja zwrotna” klient otrzymuje stały udział', 'Vo variante „vratná záloha" klient dostáva stály podiel', 'Ve variantě „vratná záloha" klient dostává stálý podíl', 'Under the "refundable deposit" option the client receives a fixed share', 'In der Variante „rückzahlbare Kaution" erhält der Kunde einen festen Anteil', 'En la modalidad «depósito reembolsable», el cliente recibe una participación fija'],
    ['W wariancie „opłata wdrożeniowa” klient wnosi jednorazową, bezzwrotną opłatę za wdrożenie', 'Vo variante „poplatok za nasadenie" klient uhrádza jednorazový, nevratný poplatok za nasadenie', 'Ve variantě „poplatek za nasazení" klient hradí jednorázový, nevratný poplatek za nasazení', 'Under the "implementation fee" option the client pays a one-off, non-refundable implementation fee', 'In der Variante „Einführungsgebühr" entrichtet der Kunde eine einmalige, nicht erstattungsfähige Einführungsgebühr', 'En la modalidad «tarifa de implantación», el cliente abona una tarifa única no reembolsable por la implantación'],
    ['i od pierwszego roku otrzymuje stały udział', 'a od prvého roka dostáva stály podiel', 'a od prvního roku dostává stálý podíl', 'and receives a fixed share from the first year', 'und erhält ab dem ersten Jahr einen festen Anteil', 'y recibe una participación fija desde el primer año'],
    ['i od pierwszego roku otrzymuje ustalony udział', 'a od prvého roka dostáva dohodnutý podiel', 'a od prvního roku dostává sjednaný podíl', 'and receives the agreed share from the first year', 'und erhält ab dem ersten Jahr den vereinbarten Anteil', 'y recibe la participación acordada desde el primer año'],
    ['% generowanych oszczędności, później', '% generovaných úspor, neskôr', '% generovaných úspor, později', '% of the savings generated, then', '% der erzielten Einsparungen, danach', '% del ahorro generado y, después,'],
    ['% oszczędności powiększony o ratę zwrotu', '% úspor zvýšený o splátku vrátenia', '% úspor zvýšený o splátku vrácení', '% of savings increased by the refund instalment', '% der Einsparungen zuzüglich der Rückzahlungsrate', '% del ahorro incrementado con la cuota de devolución'],
    ['%), aż kaucja zostanie zwrócona w całości. Po zwrocie obowiązuje docelowy podział', '%), kým sa záloha nevráti v celej výške. Po vrátení platí cieľové rozdelenie', '%), dokud nebude záloha vrácena v plné výši. Po vrácení platí cílové rozdělení', '%) until the deposit is refunded in full. After the refund, the target split applies', '%), bis die Kaution vollständig zurückgezahlt ist. Danach gilt die Zielaufteilung', '%) hasta que el depósito se devuelva íntegramente. Tras la devolución rige el reparto objetivo'],
    ['% w oszczędnościach i nie ponosi opłaty. Po wykazaniu realnych oszczędności, w drugim roku eksploatacji następuje spłata opłaty za usługę', '% na úsporách a neplatí poplatok. Po preukázaní reálnych úspor sa v druhom roku prevádzky uhrádza poplatok za službu', '% na úsporách a neplatí poplatek. Po prokázání reálných úspor se ve druhém roce provozu hradí poplatek za službu', '% of the savings and pays no fee. Once real savings are demonstrated, the service fee is paid in the second year of operation', '% der Einsparungen und zahlt keine Gebühr. Nach dem Nachweis realer Einsparungen wird die Servicegebühr im zweiten Betriebsjahr beglichen', '% del ahorro y no paga cuota. Una vez demostrado el ahorro real, la tarifa del servicio se abona en el segundo año de explotación'],
    ['opłata zwróci się', 'poplatok sa vráti', 'poplatek se vrátí', 'the fee pays for itself', 'die Gebühr amortisiert sich', 'la tarifa se amortiza'],
    ['zostanie zwrócona', 'bude vrátená', 'bude vrácena', 'will be refunded', 'wird zurückerstattet', 'será devuelto'],
    ['% (scenariusz bazowy', '% (základný scenár', '% (základní scénář', '% (base scenario', '% (Basisszenario', '% (escenario base'],
    ['% (łącznie efektywnie', '% (spolu efektívne', '% (celkem efektivně', '% (effectively in total', '% (insgesamt effektiv', '% (en total, efectivamente'],
    ['% oszczędności)', '% úspor)', '% úspor)', '% of savings)', '% Einsparung)', '% de ahorro)'],
    ['%/rok · horyzont', '%/rok · horizont', '%/rok · horizont', '%/year · horizon', '%/Jahr · Horizont', '%/año · horizonte'],
    ['koszt ogrzewania · wzrost cen', 'náklady na kúrenie · rast cien', 'náklady na vytápění · růst cen', 'heating cost · price growth', 'Heizkosten · Preissteigerung', 'coste de calefacción · subida de precios'],
    ['Koszt zmienny całościowy (koszt bazowy:', 'Celkové variabilné náklady (základné náklady:', 'Celkové variabilní náklady (základní náklady:', 'Total variable cost (baseline cost:', 'Gesamte variable Kosten (Basiskosten:', 'Coste variable total (coste base:'],
    ['Cena stała:', 'Pevná cena:', 'Pevná cena:', 'Fixed price:', 'Festpreis:', 'Precio fijo:'],
    ['Kwoty w', 'Sumy v', 'Částky v', 'Amounts in', 'Beträge in', 'Importes en'],
    ['netto.', 'netto.', 'netto.', 'net.', 'netto.', 'netos.'],
    ['/rok', '/rok', '/rok', '/year', '/Jahr', '/año'],

    // ── Pomiary, odczyty, tabele ──
    ['Pomiarów:', 'Meraní:', 'Měření:', 'Measurements:', 'Messungen:', 'Mediciones:'],
    ['odczytów (okres analizowany:', 'odpočtov (analyzované obdobie:', 'odečtů (analyzované období:', 'readings (analysed period:', 'Ablesungen (Analysezeitraum:', 'lecturas (período analizado:'],
    ['Odchyłka', 'Odchýlka', 'Odchylka', 'Deviation', 'Abweichung', 'Desviación'],
    ['Na liście', 'V zozname', 'V seznamu', 'In the list', 'In der Liste', 'En la lista'],
    ['na stronę', 'na stranu', 'na stránku', 'per page', 'pro Seite', 'por página'],
    ['wierszy ·', 'riadkov ·', 'řádků ·', 'rows ·', 'Zeilen ·', 'filas ·'],
    ['°C (krok', '°C (krok', '°C (krok', '°C (step', '°C (Schritt', '°C (paso'],
    ['°C do ok.', '°C do cca', '°C do cca', '°C to approx.', '°C bis ca.', '°C hasta aprox.'],
    ['% przy', '% pri', '% při', '% at', '% bei', '% a'],
    ['/SD ×', '/SD ×', '/SD ×', '/DD ×', '/Gt ×', '/GD ×'],
    ['/SD', '/SD', '/SD', '/DD', '/Gt', '/GD'],
    ['std.', 'štand.', 'stand.', 'std.', 'Std.', 'est.'],
    ['rzecz.', 'skut.', 'skut.', 'act.', 'tats.', 'real'],
    ['pkt).', 'b.).', 'b.).', 'pts).', 'Pkt.).', 'ptos).'],
    ['dok.)', 'dok.)', 'dok.)', 'doc.)', 'Dok.)', 'doc.)'],
    ['Scen.', 'Scen.', 'Scén.', 'Scen.', 'Szen.', 'Esc.'],
    ['był', 'bol', 'byl', 'was', 'war', 'fue'],
    ['°C)', '°C)', '°C)', '°C)', '°C)', '°C)'],
    ['°C.', '°C.', '°C.', '°C.', '°C.', '°C.'],
    ['w każdej metryce (Zużycie / Temperatura zasilania) — nie wpływa to na drugą tabelę ani jej wykresy. Kliknij „Odczyt" lub „Odchyłka", aby sortować ↑/↓.', 'v každej metrike (Spotreba / Teplota prívodu) — neovplyvňuje to druhú tabuľku ani jej grafy. Kliknite na „Odpočet" alebo „Odchýlka" pre zoradenie ↑/↓.', 'v každé metrice (Spotřeba / Teplota přívodu) — neovlivňuje to druhou tabulku ani její grafy. Klikněte na „Odečet" nebo „Odchylka" pro seřazení ↑/↓.', 'in each metric (Consumption / Supply temperature) — this affects neither the other table nor its charts. Click "Reading" or "Deviation" to sort ↑/↓.', 'in jeder Kennzahl (Verbrauch / Vorlauftemperatur) — dies betrifft weder die andere Tabelle noch deren Diagramme. Klicken Sie auf „Ablesung" oder „Abweichung", um ↑/↓ zu sortieren.', 'en cada métrica (Consumo / Temperatura de impulsión): no afecta a la otra tabla ni a sus gráficos. Pulse «Lectura» o «Desviación» para ordenar ↑/↓.'],

    // ── Dokumenty, foldery, pliki ──
    ['Dokument wymagany:', 'Povinný dokument:', 'Povinný dokument:', 'Required document:', 'Erforderliches Dokument:', 'Documento obligatorio:'],
    ['Usunąć folder i przenieść', 'Odstrániť priečinok a presunúť', 'Odstranit složku a přesunout', 'Delete the folder and move', 'Ordner löschen und verschieben', 'Eliminar la carpeta y mover'],
    ['dokumentów do folderu głównego?', 'dokumentov do hlavného priečinka?', 'dokumentů do hlavní složky?', 'documents to the main folder?', 'Dokumente in den Hauptordner?', 'documentos a la carpeta principal?'],
    ['Plik jest za duży (max', 'Súbor je príliš veľký (max', 'Soubor je příliš velký (max', 'The file is too large (max', 'Die Datei ist zu groß (max.', 'El archivo es demasiado grande (máx.'],
    ['MB). Wybierz mniejszy plik.', 'MB). Vyberte menší súbor.', 'MB). Vyberte menší soubor.', 'MB). Choose a smaller file.', 'MB). Wählen Sie eine kleinere Datei.', 'MB). Elija un archivo más pequeño.'],

    // ── Kalendarz, podmioty, integracje ──
    ['Pierwsze przypomnienie:', 'Prvá pripomienka:', 'První připomínka:', 'First reminder:', 'Erste Erinnerung:', 'Primer recordatorio:'],
    ['Termin analizy —', 'Termín analýzy —', 'Termín analýzy —', 'Analysis due date —', 'Termin der Analyse —', 'Fecha del análisis —'],
    ['Termin rozliczenia —', 'Termín vyúčtovania —', 'Termín vyúčtování —', 'Settlement due date —', 'Abrechnungstermin —', 'Fecha de liquidación —'],
    ['Automatycznie po dodaniu protokołu TYM z dn.', 'Automaticky po pridaní protokolu TMR zo dňa', 'Automaticky po přidání protokolu TMR ze dne', 'Automatically after adding the TMY protocol dated', 'Automatisch nach Hinzufügen des TRJ-Protokolls vom', 'Automáticamente tras añadir el protocolo TMY del'],
    ['spółek grupy — brakuje:', 'spoločností skupiny — chýba:', 'společností skupiny — chybí:', 'group companies — missing:', 'Konzerngesellschaften — es fehlen:', 'sociedades del grupo: faltan'],
    ['EspoCRM sync:', 'EspoCRM sync:', 'EspoCRM sync:', 'EspoCRM sync:', 'EspoCRM-Sync:', 'Sincronización EspoCRM:'],
    ['WaterAI —', 'WaterAI —', 'WaterAI —', 'WaterAI —', 'WaterAI —', 'WaterAI —'],
    ['OK ·', 'OK ·', 'OK ·', 'OK ·', 'OK ·', 'OK ·'],
    ['ESCO/', 'ESCO/', 'ESCO/', 'ESCO/', 'ESCO/', 'ESCO/'],
    // ── Dalsze ciągi zdań przerwanych przez ${…} (zaczynają się od , . — ·) ──
    [', niezmieniony sposób użytkowania obiektu oraz', ', nezmenený spôsob užívania objektu a', ', nezměněný způsob užívání objektu a', ', an unchanged way of using the building and', ', eine unveränderte Nutzung des Gebäudes sowie', ', un uso sin cambios del edificio y'],
    [', a reszta strony', ', a zvyšok stránky', ', a zbytek stránky', ', and the rest of the page', ', und der Rest der Seite', ', y el resto de la página'],
    [', przez co', ', čím', ', čímž', ', which means that', ', wodurch', ', por lo que'],
    [', a wpłacona kaucja', ', a zložená záloha', ', a složená záloha', ', and the deposit paid', ', und die eingezahlte Kaution', ', y el depósito abonado'],
    [', dzięki której aplikacja działa też przy słabym połączeniu.', ', vďaka ktorej aplikácia funguje aj pri slabom pripojení.', ', díky které aplikace funguje i při slabém připojení.', ', which lets the application work even on a weak connection.', ', dank derer die Anwendung auch bei schwacher Verbindung funktioniert.', ', gracias a la cual la aplicación funciona incluso con conexión débil.'],
    ['. Operacji nie można cofnąć.', '. Operáciu nemožno vrátiť späť.', '. Operaci nelze vrátit zpět.', '. This action cannot be undone.', '. Der Vorgang kann nicht rückgängig gemacht werden.', '. La operación no se puede deshacer.'],
    ['. Kliknij „+ Nowa analiza', '. Kliknite na „+ Nová analýza', '. Klikněte na „+ Nová analýza', '. Click "+ New analysis', '. Klicken Sie auf „+ Neue Analyse', '. Pulse «+ Nuevo análisis'],
    ['. Do czasu jej zwrotu otrzymuje podwyższony udział: swój stały', '. Do jej vrátenia dostáva zvýšený podiel: svoj stály', '. Do jejího vrácení dostává zvýšený podíl: svůj stálý', '. Until it is refunded, they receive an increased share: their fixed', '. Bis zur Rückzahlung erhält er einen erhöhten Anteil: seinen festen', '. Hasta su devolución recibe una participación mayor: su parte fija'],
    ['. Klient wnosi jednorazową, bezzwrotną opłatę za wdrożenie', '. Klient uhrádza jednorazový, nevratný poplatok za nasadenie', '. Klient hradí jednorázový, nevratný poplatek za nasazení', '. The client pays a one-off, non-refundable implementation fee', '. Der Kunde entrichtet eine einmalige, nicht erstattungsfähige Einführungsgebühr', '. El cliente abona una tarifa única no reembolsable por la implantación'],
    ['— dowolne daty (miesięczne lub dobowe), zużycie liczone jako różnica wskazań.', '— ľubovoľné dátumy (mesačné alebo denné), spotreba počítaná ako rozdiel stavov.', '— libovolná data (měsíční nebo denní), spotřeba počítaná jako rozdíl stavů.', '— any dates (monthly or daily); consumption is computed as the difference between meter indexes.', '— beliebige Daten (monatlich oder täglich), Verbrauch als Differenz der Zählerstände.', '— cualquier fecha (mensual o diaria); el consumo se calcula como diferencia de índices.'],
    ['— klient nie ponosi żadnej opłaty wstępnej i od pierwszego roku otrzymuje stały udział', '— klient neplatí žiadny vstupný poplatok a od prvého roka dostáva stály podiel', '— klient neplatí žádný vstupní poplatek a od prvního roku dostává stálý podíl', '— the client pays no upfront fee and receives a fixed share from the first year', '— der Kunde zahlt keine Anfangsgebühr und erhält ab dem ersten Jahr einen festen Anteil', '— el cliente no paga cuota inicial y recibe una participación fija desde el primer año'],
    ['— koszt zmienny całościowy', '— celkové variabilné náklady', '— celkové variabilní náklady', '— total variable cost', '— gesamte variable Kosten', '— coste variable total'],
    ['— oszczędność', '— úspora', '— úspora', '— savings', '— Einsparung', '— ahorro'],
    ['— po zalogowaniu widać je na każdym komputerze.', '— po prihlásení sú viditeľné na každom počítači.', '— po přihlášení jsou viditelné na každém počítači.', '— once logged in, they are visible on every computer.', '— nach der Anmeldung auf jedem Rechner sichtbar.', '— tras iniciar sesión, son visibles en cualquier ordenador.'],
    ['— re-tworzymy je, by wykresy (Canvas) się narysowały.', '— vytvárame ich nanovo, aby sa grafy (Canvas) vykreslili.', '— vytváříme je znovu, aby se grafy (Canvas) vykreslily.', '— we re-create them so that the charts (Canvas) get drawn.', '— wir erzeugen sie neu, damit die Diagramme (Canvas) gezeichnet werden.', '— los recreamos para que los gráficos (Canvas) se dibujen.'],
    ['— reszta istnieje wyłącznie w tej przeglądarce', '— zvyšok existuje výlučne v tomto prehliadači', '— zbytek existuje výhradně v tomto prohlížeči', '— the rest exists only in this browser', '— der Rest existiert nur in diesem Browser', '— el resto existe únicamente en este navegador'],
    ['— stacja', '— stanica', '— stanice', '— station', '— Station', '— estación'],
    ['· bazowy', '· bázový', '· bázový', '· baseline', '· Basis', '· base'],
    ['· cena zmienna:', '· variabilná cena:', '· variabilní cena:', '· variable price:', '· variabler Preis:', '· precio variable:'],
    ['· stałe:', '· fixné:', '· fixní:', '· fixed:', '· fix:', '· fijos:'],
    ['· Utworzono:', '· Vytvorené:', '· Vytvořeno:', '· Created:', '· Erstellt:', '· Creado:'],
    ['· we wspólnej bazie tylko', '· v spoločnej databáze len', '· ve společné databázi jen', '· in the shared database only', '· in der gemeinsamen Datenbank nur', '· en la base compartida solo'],
    ['· wszystkie zapisane we wspólnej bazie', '· všetky uložené v spoločnej databáze', '· všechny uložené ve společné databázi', '· all saved in the shared database', '· alle in der gemeinsamen Datenbank gespeichert', '· todos guardados en la base compartida'],
    ['· faktury udostępnione przez zespół WaterAI', '· faktúry sprístupnené tímom WaterAI', '· faktury zpřístupněné týmem WaterAI', '· invoices shared by the WaterAI team', '· vom WaterAI-Team freigegebene Rechnungen', '· facturas compartidas por el equipo de WaterAI'],
    ['" → komplet danych do podpowiedzi.', '" → kompletné údaje pre návrh.', '" → kompletní údaje pro návrh.', '" → the complete data for the suggestion.', '" → die vollständigen Daten für den Vorschlag.', '" → los datos completos para la sugerencia.'],
    ['" albo "ESCO:', '" alebo "ESCO:', '" nebo "ESCO:', '" or "ESCO:', '" oder „ESCO:', '" o «ESCO:'],

    // ── Frazy, które miały już SK/CS ze starszych backfilli, ale nie EN/DE/ES ──
    ['— wybierz —', '— vyberte —', '— vyberte —', '— select —', '— auswählen —', '— seleccionar —'],
    ['— wybierz klienta —', '— vyberte klienta —', '— vyberte klienta —', '— select a client —', '— Kunde auswählen —', '— seleccione un cliente —'],
    ['— najpierw wybierz klienta —', '— najprv vyberte klienta —', '— nejprve vyberte klienta —', '— select a client first —', '— zuerst Kunde auswählen —', '— seleccione primero un cliente —'],
    ['— wybierz obiekt —', '— vyberte objekt —', '— vyberte objekt —', '— select a building —', '— Gebäude auswählen —', '— seleccione un edificio —'],
    ['— wybierz analityka —', '— vyberte analytika —', '— vyberte analytika —', '— select an analyst —', '— Analysten auswählen —', '— seleccione un analista —'],
    ['— Obiekty', '— Objekty', '— Objekty', '— Buildings', '— Gebäude', '— Edificios'],
    ['— Okresy bazowe', '— Bázové obdobia', '— Základní období', '— Baseline periods', '— Basiszeiträume', '— Períodos base'],
    ['— Dokument klienta —', '— Dokument klienta —', '— Dokument klienta —', '— Client document —', '— Kundendokument —', '— Documento del cliente —'],
    ['— (niezapisana)', '— (neuložená)', '— (neuložená)', '— (unsaved)', '— (nicht gespeichert)', '— (sin guardar)'],
    ['+ Dodaj osobę kontaktową', '+ Pridať kontaktnú osobu', '+ Přidat kontaktní osobu', '+ Add contact person', '+ Ansprechpartner hinzufügen', '+ Añadir persona de contacto'],
    ['+ Dodaj obiekt dla tego klienta', '+ Pridať objekt pre tohto klienta', '+ Přidat objekt pro tohoto klienta', '+ Add a building for this client', '+ Gebäude für diesen Kunden hinzufügen', '+ Añadir edificio para este cliente'],
    ['+ Dodaj okres bazowy', '+ Pridať bázové obdobie', '+ Přidat základní období', '+ Add baseline period', '+ Basiszeitraum hinzufügen', '+ Añadir período base'],
    ['+ Dodaj nowy okres bazowy', '+ Pridať nové bázové obdobie', '+ Přidat nové základní období', '+ Add a new baseline period', '+ Neuen Basiszeitraum hinzufügen', '+ Añadir nuevo período base'],
    ['+ Nowy okres bazowy', '+ Nové bázové obdobie', '+ Nové základní období', '+ New baseline period', '+ Neuer Basiszeitraum', '+ Nuevo período base'],
    ['· usunięte:', '· odstránené:', '· odstraněno:', '· deleted:', '· gelöscht:', '· eliminados:'],
    ['. Usuwasz', '. Odstraňujete', '. Odstraňujete', '. You are deleting', '. Sie löschen', '. Está eliminando'],
    ['" już istnieje. Wybierz inny numer.', '" už existuje. Zvoľte iné číslo.', '" už existuje. Zvolte jiné číslo.', '" already exists. Choose a different number.', '" existiert bereits. Wählen Sie eine andere Nummer.', '" ya existe. Elija otro número.'],
    [', wykonaj 4 wykresy i na dole „💾 Zapisz regresję', ', vykonajte 4 grafy a dole „💾 Uložiť regresiu', ', proveďte 4 grafy a dole „💾 Uložit regresi', ', produce 4 charts and, at the bottom, "💾 Save regression', ', erstellen Sie 4 Diagramme und unten „💾 Regression speichern', ', genere 4 gráficos y, abajo, «💾 Guardar regresión'],
    [', regresja:', ', regresia:', ', regrese:', ', regression:', ', Regression:', ', regresión:'],
    [', przypada WaterAI/ESCO', ', pripadá WaterAI/ESCO', ', připadá WaterAI/ESCO', ', goes to WaterAI/ESCO', ', entfällt auf WaterAI/ESCO', ', corresponde a WaterAI/ESCO'],
    ['— wyraz wolny: teoretyczna wartość y przy temperaturze zewnętrznej 0 °C.', '— absolútny člen: teoretická hodnota y pri vonkajšej teplote 0 °C.', '— absolutní člen: teoretická hodnota y při venkovní teplotě 0 °C.', '— intercept: the theoretical value of y at an outdoor temperature of 0 °C.', '— Achsenabschnitt: theoretischer y-Wert bei einer Außentemperatur von 0 °C.', '— término independiente: valor teórico de y a una temperatura exterior de 0 °C.'],
    ['. Weryfikacja regresją obejmuje część okna rozliczeniowego, według danych pomiarowych dostępnych na dzień sporządzenia analizy technicznej.', '. Overenie regresiou pokrýva časť zúčtovacieho okna, podľa meraných údajov dostupných ku dňu vypracovania technickej analýzy.', '. Ověření regresí pokrývá část zúčtovacího okna, podle naměřených dat dostupných ke dni vypracování technické analýzy.', '. The regression check covers part of the settlement window, based on measurement data available on the date the technical analysis was prepared.', '. Die Regressionsprüfung deckt einen Teil des Abrechnungsfensters ab, gemäß den am Tag der Erstellung der technischen Analyse verfügbaren Messdaten.', '. La verificación por regresión cubre parte de la ventana de liquidación, según los datos de medición disponibles en la fecha de elaboración del análisis técnico.'],
    ['. Data raportu:', '. Dátum reportu:', '. Datum zprávy:', '. Report date:', '. Berichtsdatum:', '. Fecha del informe:'],
    ['· Data raportu:', '· Dátum reportu:', '· Datum zprávy:', '· Report date:', '· Berichtsdatum:', '· Fecha del informe:'],
    ['· Wydruk z dnia:', '· Vytlačené dňa:', '· Vytištěno dne:', '· Printed on:', '· Gedruckt am:', '· Impreso el:'],
    ['· wydruk z dnia:', '· vytlačené dňa:', '· vytištěno dne:', '· printed on:', '· gedruckt am:', '· impreso el:']
  ];

  const LANGS = ['sk', 'cs', 'en', 'de', 'es'];

  function install() {
    const api = window.DomainI18n;
    if (!api || !api.dict) {
      console.warn('[i18n-ui-core-4] Brak window.DomainI18n — plik musi być ładowany PO i18n-domain.js.');
      return false;
    }
    const stats = {};
    LANGS.forEach((lang, idx) => {
      const d = api.dict[lang] || (api.dict[lang] = {});
      let added = 0;
      for (const row of T) {
        const pl = row[0], tr = row[idx + 1];
        if (tr && !(pl in d)) { d[pl] = tr; added++; }
      }
      stats[lang] = added;
    });
    const at = api.dict.at || (api.dict.at = {});
    let addedAt = 0;
    for (const row of T) if (row[4] && !(row[0] in at)) { at[row[0]] = row[4]; addedAt++; }
    stats.at = addedAt;

    console.info('[i18n-ui-core-4] Dopisano kluczy:', stats);
    if (typeof api.apply === 'function') api.apply();
    return true;
  }

  if (!install()) document.addEventListener('DOMContentLoaded', install);
})();
