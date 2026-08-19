window.I18N = window.I18N || {};
window.I18N["de"] = {
label: "DE", htmlLang: "de",
title: "WaterAI Energy Control — Messung und Abrechnung von Energieeinsparungen",
desc: "Wie wir Energieeinsparungen messen und abrechnen: Korrektur auf das Typische Meteorologische Jahr und eine lineare Regression als Gegenprobe. Anmeldung zum Energy-Control-Panel.",
eyebrow: "Energy Control · Mess- und Abrechnungsmethode",
h1: "Energie sparen ohne eigene Investition",
lede: "Sie zahlen ausschließlich für Energie, die tatsächlich eingespart wird — am Zähler gemessen, um den Wettereinfluss bereinigt und durch eine zweite, unabhängige Methode bestätigt. Vor dem Start erstellen wir eine Simulation auf Basis Ihrer tatsächlichen Kosten.",
switchIntro: "<strong>Sie möchten genau wissen, wie wir rechnen?</strong> Mit den Details öffnet sich auf dieser Seite die vollständige Beschreibung der Methode: Formeln, Datenquellen, die Reihenfolge der Abrechnungsschritte und das Regressionsmodell.",
toggleOff: "Ausführliche Informationen",
toggleOn: "Details ausblenden",
cards: [
["Kein Kapitaleinsatz", "Keine Investition auf Ihrer Seite und kein Eingriff in die bestehende Regelung."],
["Vergütung aus der Einsparung", "Unser Honorar ist ein vereinbarter Anteil am Wert der gemessenen Einsparung."],
["Wetterfestes Ergebnis", "Jeder Zeitraum wird auf dieselben Normbedingungen (TMJ) umgerechnet."]
],
login: {
title: "Energy Control", sub: "System zur Messung und Abrechnung von Energieeinsparungen",
email: "Login / E-Mail", emailPh: "z. B. admin@waterai.pl",
pass: "Passwort", passPh: "Passwort eingeben", submit: "Anmelden",
errEmpty: "Bitte Login und Passwort eingeben.",
mock: "Mockup — diese Schaltfläche an die Anmeldelogik der Anwendung anbinden.",
powered: "Powered by WaterAI"
},
langLabel: "Sprache",
aside: [
["Noch kein Konto?", "Konten legt der Administrator an. Im Panel sehen Sie die Ergebnisse für Ihre Objekte — daneben beschreiben wir die Methode, aus der diese Ergebnisse entstehen."],
["Sie möchten wissen, was das bei Ihnen bringt?", "Wir erstellen eine Einsparsimulation auf Basis Ihrer tatsächlichen Kosten — Energierechnungen oder Zählerstände der letzten Saisons genügen. Die Simulation ist eine Prognose; abgerechnet wird ausschließlich, was die Messung nach Ablauf des Zeitraums zeigt."]
],
footer: ["Water AI · waterai.sk · info@waterai.sk", "Die Darstellung dient der Information; verbindlich sind der Vertrag und das Messprotokoll."],
closing: "Nach Ablauf der Vertragslaufzeit verbleibt der gesamte Effekt der Technologie bei Ihnen.",
sections: [
{h: "Was wir anbieten", b: [
["p", "Wir setzen eine prädiktive Heizungsregelung auf der bestehenden Anlage ein. Das System lernt das Verhalten des Gebäudes und seine Reaktion auf das Wetter und kommt dem Bedarf zuvor, statt verzögert zu reagieren. Wir tauschen die Wärmequelle nicht aus und greifen nicht in die vorhandene Automatisierung ein."],
["p", "Abgerechnet wird im ESCO-Modell: Die Kosten für Einbau und Betrieb tragen wir, unser Honorar ist ein Anteil am Wert der messtechnisch bestätigten Einsparung. Gibt es keine Einsparung, gibt es keine Rechnung."],
["d", "Details", [
["p", "Die Messgrenze legen wir vor dem Start fest und halten sie im Messprotokoll fest: Abgerechnet wird ausschließlich Energie, die der bezeichnete Zähler erfasst. Getrennt gemessene Medien — etwa Warmwasser — gehen weder in den Basiszeitraum noch in die Abrechnung ein."],
["p", "Wird parallel eine weitere Technologie erwogen (etwa physikalische Wasseraufbereitung), bewerten wir sie als eigenen Schritt mit eigener Basis. Die Effekte werden nicht in einer Kennzahl zusammengefasst, damit jeder für sich belegbar bleibt."]
]]
]},
{h: "Simulation vor dem Start — und warum das Ergebnis erst nach dem Zeitraum feststeht", b: [
["p", "Bevor etwas unterschrieben wird, erstellen wir eine <strong>Einsparsimulation auf Basis Ihrer tatsächlichen Kosten</strong> — aus Energierechnungen und Zählerständen der letzten Saisons. Die Simulation zeigt die zu erwartende Größenordnung: wie viel Energie im Gebäude bleiben kann, was das bei Ihrem Preis in Geld bedeutet und wie sich dieser Effekt auf die Parteien verteilt."],
["cw", ["<strong>Eine Simulation ist eine Prognose, kein Versprechen.</strong> Wir nennen vorab keinen garantierten Prozentsatz, denn die Einsparung hängt von Faktoren ab, die niemand vollständig beherrscht: vom Witterungsverlauf der jeweiligen Saison, von der Nutzung des Objekts, von Änderungen der Belegung und der Betriebszeiten, vom Zustand der Anlage sowie von Entscheidungen vor Ort. Die belastbare Zahl nennen wir erst für einen abgeschlossenen Zeitraum — am Zähler gemessen und um den Wettereinfluss bereinigt.", "Das Risiko, dass Prognose und Ergebnis auseinanderlaufen, tragen wir, nicht Sie: Wir stellen ausschließlich das in Rechnung, was gemessen wurde. Gibt es keine Einsparung, gibt es keine Rechnung."]],
["d", "Details · Umfang der Simulation", [
["h3", "Was in die Simulation eingeht"],
["ul", ["Verbrauch und Kosten der letzten Saisons — aus Rechnungen oder Zählerständen,", "die daraus abgeleitete Gebäudecharakteristik, umgerechnet auf Normbedingungen (TMJ),", "der Energiepreis, den Sie heute zahlen, sowie der im Vertrag vorgesehene Anpassungsmechanismus,", "die vereinbarte Aufteilung des Effekts zwischen den Parteien."]],
["h3", "Was die Simulation nicht abdeckt"],
["ul", ["den Witterungsverlauf der kommenden Saison — definitionsgemäß unbekannt,", "Änderungen auf Ihrer Seite: Belegung, Betriebszeiten, neue Mieter, Bauarbeiten,", "Änderungen des Energiepreises über das im Vertrag Geregelte hinaus,", "Störungen und Stillstände der Anlage."]],
["p", "Deshalb geben wir die Simulation als Bandbreite an, nicht als eine einzelne Zahl, und nennen die Annahmen, unter denen sie entstanden ist. Sie ist keine Abrechnungsgrundlage — sie dient der Entscheidung."],
["c", ["<strong>Die Prognose prüfen wir im Nachhinein.</strong> Nach dem ersten abgeschlossenen Zeitraum stellen wir die Simulation dem Messergebnis gegenüber und zeigen die Abweichung samt ihrer Ursache. Auf derselben Grundlage korrigieren wir die Prognose für die nächste Saison — und daran zeigt sich, ob unsere Annahmen belastbar waren."]]
]]
]},
{h: "Woher die Zahl kommt, für die Sie zahlen", b: [
["p", "Wir vergleichen Verbräuche nicht Jahr für Jahr, denn ein solches Ergebnis sagt vor allem aus, welcher Winter milder war. Jeden Zeitraum — Basis wie Abrechnung — rechnen wir auf dieselben Normwetterbedingungen um, also auf das <strong>Typische Meteorologische Jahr (TMJ)</strong>. Erst auf diesen gemeinsamen Nenner gebracht sind die Größen vergleichbar."],
["ps", "Die Folge ist eindeutig: Ein milderer Winter kann nicht als Einsparung ausgewiesen werden, und ein Winter über der Norm belastet das Ergebnis der Technologie nicht."],
["d", "Details · Bezeichnungen und Formeln", [
["t", [["Symbol", "Bedeutung"],
["z", "Anzahl der Tage mit aktiver Beheizung im jeweiligen Monat"],
["T<sub>i</sub>", "für die Berechnung angesetzte Innentemperatur — vertraglicher Parameter, identisch für die Basis und jeden Abrechnungszeitraum"],
["t", "mittlere Außentemperatur während der Heiztage des jeweiligen Monats (Ist-Daten)"],
["t<sub>TMJ</sub>", "Normtemperatur desselben Monats nach dem Typischen Meteorologischen Jahr"],
["GT", "Gradtage — Maß für den wetterbedingten Wärmebedarf [°C·Tage]"],
["Q · Q<sub>s</sub>", "gemessener und auf Normbedingungen bereinigter Verbrauch, angegeben in der <strong>Abrechnungseinheit [AE]</strong> — jener, in der der Zähler misst und der Lieferant abrechnet: kWh, MWh oder GJ bei Fernwärme, m<sup>3</sup> bei Gas"],
["φ", "Korrekturkoeffizient des Zeitraums"],
["E", "Einheitskennzahl — Verbrauch je einem Normgradtag [AE/GT]"],
["ΔQ", "gemessene Einsparung, in derselben Abrechnungseinheit wie Q"]]],
["f", [["Gradtage", "GT = z × (T<sub>i</sub> − t)&nbsp;&nbsp;[°C·Tage]"],
["Korrekturkoeffizient", "φ = ΣGT<sub>Norm</sub> / ΣGT<sub>Ist</sub>"],
["Bereinigter Verbrauch", "Q<sub>s</sub> = Q × φ"],
["Einheitskennzahl", "E = Q<sub>s</sub> / ΣGT<sub>Norm</sub>&nbsp;&nbsp;[AE/GT]"],
["Projektion der Basis", "Q<sub>Basis→Abr.</sub> = E<sub>Basis</sub> × ΣGT<sub>Norm, Abrechnungszeitraum</sub>"],
["Einsparung", "ΔQ = Q<sub>Basis→Abr.</sub> − Q<sub>s, Abr.</sub>"]]],
["fine", "Die Normgradtage berechnen wir genau wie die tatsächlichen — mit derselben Zahl an Heiztagen <em>z</em> und derselben Temperatur T<sub>i</sub> — und setzen ausschließlich die Temperaturen des Typischen Meteorologischen Jahres anstelle der tatsächlichen ein. Der Unterschied zwischen beiden ist damit der reine Wettereffekt, nichts sonst."]
]]
]},
{h: "Woher jede Größe stammt", b: [
["p", "Jede Zahl, die in die Abrechnung eingeht, hat eine benannte Quelle und einen festgelegten Zeitpunkt der Festlegung. Das ist die Voraussetzung für Nachvollziehbarkeit — der Bericht muss sich unabhängig nachrechnen lassen, ohne bei uns nachzufragen."],
["d", "Details · Datenquellen", [
["t3", [["Größe", "Quelle", "Wann festgelegt"],
["Ist-Temperaturen <span class=\"sym\">t</span>", "Wetterstation am Standort des Objekts; der Bericht nennt die Station und das Datum des Datenabrufs", "für jeden Zeitraum gesondert"],
["Normalwerte <span class=\"sym\">t<sub>TMJ</sub></span>", "langjährige Messreihe für den Standort; der Bericht nennt den Zeitraum der Jahre, aus denen die Normalwerte berechnet wurden", "einmalig — im TMJ-Protokoll fixiert"],
["Heiztage <span class=\"sym\">z</span>", "Heizsaisonkalender des Objekts; derselbe Wert geht in Ist- und Normgradtage ein", "für jeden Monat des Zeitraums"],
["Temperatur <span class=\"sym\">T<sub>i</sub></span>", "vertraglicher Parameter, im Messprotokoll festgehalten", "einmalig — identisch für Basis und alle Zeiträume"],
["Verbrauch <span class=\"sym\">Q</span>", "Abrechnungszähler oder Rechnungen des Lieferanten, stets unter Angabe der Messgrenze", "für jeden Zeitraum"],
["Energiepreis", "Messprotokoll; wir geben an, ob es sich um einen Festpreis oder den tatsächlichen Rechnungspreis handelt", "einmalig, mit dem im Vertrag geregelten Anpassungsmechanismus"],
["Anteile der Parteien", "Vertrag", "einmalig"]]]
]],
["psfine", "Mit eingeschalteten Details sehen Sie die vollständige Übersicht: was von der Wetterstation stammt, was vom Zähler und was aus dem Messprotokoll."]
]},
{h: "Der Basiszeitraum — der Bezugspunkt", b: [
["p", "Die Basis ermitteln wir aus drei vollständigen Heizsaisons vor dem Einbau. Basis ist dabei nicht der in Abrechnungseinheiten ausgedrückte Verbrauch, sondern die <strong>Einheitskennzahl E</strong> — der Verbrauch je einem Normgradtag. Diese Größe hängt weder vom Wetter noch von der Länge des Zeitraums ab."],
["d", "Details · wie die Basis entsteht", [
["ul", ["Jede der drei Saisons wird gesondert auf das TMJ umgerechnet, daraus ergibt sich ihre Kennzahl E.", "Basis ist das arithmetische Mittel der Kennzahlen dieser Saisons.", "Wir prüfen die Streuung der Kennzahlen um den Mittelwert — das ist der Qualitätstest der Basis."]],
["p", "Eine geringe Streuung bedeutet, dass sich das Objekt in diesen Jahren betrieblich nicht verändert hat und die Basis konsistent ist. Eine deutlich größere ist ein Hinweis darauf, dass sich in der Reihe etwas geändert hat — Mieter, Fläche, Betriebszeiten — dann korrigieren wir die Basis oder verkürzen die Reihe. Eine Basis übernehmen wir nicht ungeprüft."]
]]
]},
{h: "Ablauf der Abrechnung eines Zeitraums", b: [
["steps", [["Gradtage des Zeitraums", "Wir ermitteln Ist- und Normgradtage. Die Frage: Wie war das Wetter tatsächlich, und wie wäre es bei der Norm gewesen?"],
["Verbrauchskorrektur", "Wir berechnen den Koeffizienten φ und führen den gemessenen Verbrauch auf Normbedingungen zurück."],
["Projektion der Basis", "Wir projizieren die Basis auf denselben Zeitraum: Wie viel hätte das Objekt jetzt verbraucht, wenn es seine Charakteristik von vor dem Einbau behalten hätte?"],
["Einsparung", "Die Differenz beider Größen ist die tatsächlich eingesparte Energie."],
["Gegenprobe", "Dasselbe Ergebnis muss sich über den Rückgang der Kennzahl E ergeben."]]],
["d", "Details · warum genau so", [
["p", "<strong>Schritt 3</strong> löst zugleich das Problem unterschiedlich langer Zeiträume. Die Basis wird genau auf den abgerechneten Zeitraum projiziert und nicht mit einem ganzen Jahr verglichen — dadurch lässt sich auch eine verkürzte, verschobene oder unterbrochene Saison ohne Verzerrung abrechnen."],
["p", "<strong>Schritt 5</strong> ist unbedingt. Ergeben beide Wege nicht dasselbe Ergebnis, enthält der Bericht einen Fehler und wird nicht ausgegeben. Das ist eine interne Kontrolle auf unserer Seite, keine Formalie."],
["c", ["<strong>Die TMJ-Korrektur wirkt zu Ihren Gunsten.</strong> Ein Vergleich der reinen Messwerte ohne Berücksichtigung des Wetters weist in einer Saison unter der Norm eine höhere Einsparung aus als die tatsächliche — er schreibt der Technologie zu, was das Wetter bewirkt hat. Wir rechnen diesen Effekt heraus und stellen damit eine niedrigere Zahl in Rechnung, als der einfache Vergleich ergäbe."]]
]]
]},
{h: "Zweite, unabhängige Gegenprobe — lineare Regression", b: [
["p", "Die TMJ-Korrektur vergleicht <strong>Zeiträume</strong>, die auf gemeinsames Wetter zurückgeführt wurden. Die Regression tut dasselbe auf der Ebene <strong>einzelner Messwerte</strong>: Sie beschreibt das Objekt durch eine Gleichung, in der die Außentemperatur die erklärende Variable ist. Das sind zwei voneinander unabhängige Belege für denselben Effekt — und wir erwarten, dass sie dasselbe aussagen."],
["ps", "Die Methode zeigt außerdem, wie sich die Regelung verändert hat: um wie viel niedriger die Vorlauftemperatur bei gleichem Wetter läuft."],
["d", "Details · Modell und Daten", [
["h3", "Eingangsdaten"],
["p", "Aufzeichnungen von Zähler und Regler in konstantem Zeitraster. In das Modell gehen ein: Zeitstempel des Messwerts, Außentemperatur, Vorlauf- und Rücklauftemperatur, Durchfluss sowie Leistung und Energieverbrauch. Wir aggregieren sie nicht auf Monate — wir arbeiten mit Rohwerten, denn erst diese zeigen, wie sich das Objekt unter konkreten Bedingungen verhält."],
["h3", "Modell"],
["f", [["Regressionsgerade", "y = a · x + b"],
["Differenz der Betriebsarten", "Δ(x) = y<sub>witterungsgef.</sub>(x) − y<sub>WaterAI</sub>(x)"],
["Reduktion", "R(x) = Δ(x) / y<sub>witterungsgef.</sub>(x) × 100&nbsp;&nbsp;[%]"]]],
["t", [["Symbol", "Bedeutung"],
["x", "Außentemperatur zum Zeitpunkt des Messwerts [°C]"],
["y", "untersuchte Größe: Vorlauftemperatur [°C] oder Leistung / Energieverbrauch"],
["a", "Steigung der Geraden — die Wetterempfindlichkeit des Objekts, also um wie viel <em>y</em> je Grad Rückgang der Außentemperatur steigt"],
["b", "Achsenabschnitt — das Niveau bei 0 °C, also der wetterunabhängige Anteil: Einstellungen, Trägheit, Kreislaufverluste"]]],
["p", "Die Koeffizienten <em>a</em> und <em>b</em> bestimmen wir nach der Methode der kleinsten Quadrate, getrennt für zwei Messwertmengen: Betrieb in der <strong>witterungsgeführten Betriebsart</strong> (bisherige Heizkurve) und Betrieb in der <strong>prädiktiven Betriebsart WaterAI</strong>. Es entstehen zwei Geraden, die wir bei derselben Außentemperatur vergleichen."],
["chart", {alt: "Schematische Darstellung: zwei Regressionsgeraden — witterungsgeführte Betriebsart oben, WaterAI-Betriebsart unten, der Abstand dazwischen ist der Regelungseffekt", base: "witterungsgeführt", ai: "WaterAI-Betrieb", delta: "Δ(x) — Regelungseffekt", xl: "niedrigere Außentemperatur", xr: "höhere →", cap: "Schematische Darstellung. Der Abstand zwischen den Geraden ist nicht konstant — deshalb geben wir das Ergebnis als Funktion der Außentemperatur an und nicht als eine einzelne Zahl."}],
["h3", "Was wir parallel auswerten"],
["ul", ["<strong>Vorlauftemperatur</strong> — der Beleg, dass sich die Regelung geändert hat: Bei gleichem Wetter fährt das Objekt auf einem niedrigeren Parameter.", "<strong>Leistung und Energieverbrauch</strong> — der Beleg, dass sich die geänderte Regelung in Energie niedergeschlagen hat."]],
["p", "Beide Größen müssen zusammenpassen. Ein Rückgang der Vorlauftemperatur ohne entsprechenden Rückgang des Energiebezugs ist ein Warnsignal — er bedeutet meist längere Laufzeiten oder verschobenen Bezug, keine Einsparung."],
["h3", "Bedingungen für einen gültigen Vergleich"],
["ul", ["derselbe Außentemperaturbereich für beide Mengen — die Geraden vergleichen wir nur dort, wo beide Daten haben,", "Ausschluss von Messwerten außerhalb der Heizsaison sowie von Stillstands- und Servicezeiten,", "Ausschluss von Übergangszuständen nach dem Anfahren, die den Zusammenhang verzerren,", "eine vergleichbare Anzahl von Punkten in beiden Mengen,", "Prüfung der Anpassungsgüte (Bestimmtheitsmaß) und der Streuung der Residuen — eine schwache Anpassung bedeutet, dass ein Faktor außerhalb des Modells wirkt und das Ergebnis erklärungsbedürftig ist,", "identische Messgrenze und dasselbe Zeitraster für beide Betriebsarten."]],
["c", ["<strong>Die Regression ist keine Abrechnungsgrundlage.</strong> Abgerechnet wird ausschließlich nach der TMJ-Methode, aus den am Abrechnungszähler abgelesenen Einheiten. Die Regression dient der Überprüfung dieses Ergebnisses, der Diagnose des Objekts und der Frage, ob der Effekt über die Zeit Bestand hat. Laufen beide Methoden auseinander, suchen wir die Ursache, bevor der Bericht erstellt wird — und wählen nicht die günstigere Zahl."]]
]]
]},
{h: "Abrechnung und Rechnung", b: [
["ul", ["Der Wert der Einsparung ist die gemessene Menge an Abrechnungseinheiten multipliziert mit dem vereinbarten Energiepreis.", "Unser Honorar ist der im Vertrag festgelegte Anteil an diesem Wert — und die einzige Position der Rechnung.", "Die Rechnung verweist auf die Berichtsnummer und den betreffenden Abrechnungszeitraum.", "Wir rechnen ausschließlich abgeschlossene Zeiträume ab; Jahresprognosen dienen der Budgetplanung und sind niemals Grundlage einer Rechnung."]],
["d", "Details · Nachvollziehbarkeit des Berichts", [
["p", "In jedem Abrechnungsbericht sind ausdrücklich genannt:"],
["ul", ["die Wetterstation und die Temperaturquelle samt Datum des Datenabrufs,", "der Zeitraum der Jahre, aus denen die TMJ-Normalwerte berechnet wurden,", "die Nummer des TMJ-Protokolls und die Nummer der Analyse — jeder Bericht lässt sich seiner Quelle zuordnen,", "die Quelle der Verbrauchsdaten, also der konkrete Zähler oder die Rechnungen, samt Messgrenze,", "die für Basis und Abrechnungszeitraum angesetzte Temperatur T<sub>i</sub>,", "der Energiepreis und der vereinbarte Anteil, mit Angabe, ob es sich um einen Fest- oder Rechnungspreis handelt."]],
["fine", "Alle Beträge im Bericht sind Nettobeträge; die Umsatzsteuer wird nach dem am Tag der Rechnungsstellung geltenden Satz berechnet."]
]]
]},
{h: "Wann die Basis angepasst wird", b: [
["cw", ["<strong>Die Basis wird nicht durch die erzielte Einsparung überschrieben.</strong> Das erreichte Ergebnis wird nicht zum neuen Bezugspunkt — sonst verschwände der Effekt der Technologie Jahr für Jahr aus der Abrechnung."]],
["p", "Wir passen die Basis ausschließlich bei Änderungen an, die nichts mit der Technologie zu tun haben, den Verbrauch aber beeinflussen."],
["d", "Details · Katalog der Änderungen", [
["ul", ["Änderung der Nutzungsart des Objekts oder der Betriebszeiten,", "wesentliche Änderung der Belegung oder Mieterwechsel,", "Änderung der beheizten Fläche,", "Eingriff in die Gebäudehülle,", "Austausch oder Ergänzung der Energiequelle,", "neue Technologie mit eigenem Energiebezug,", "Änderung der vereinbarten Innentemperatur T<sub>i</sub>."]],
["fine", "Die Anpassung wirkt in beide Richtungen — auch zu unseren Ungunsten. Senkt eine Änderung am Objekt den Verbrauch von sich aus, wird die Basis um diesen Effekt vermindert und er wird nicht als Einsparung der Technologie abgerechnet."]
]]
]},
{h: "Wie wir beginnen", b: [
["steps", [["Eingangsdaten", "Energierechnungen oder Zählerstände der letzten Saisons — mehr ist in diesem Stadium nicht nötig."],
["Einsparsimulation", "Auf Basis Ihrer tatsächlichen Kosten zeigen wir den zu erwartenden Effekt und die Aufteilung des Nutzens. Eine Prognose, keine Zusage."],
["Analyse und Messprotokoll", "Wir ermitteln die Basis und legen Messgrenze, T<sub>i</sub>, Energiepreis und Anteile der Parteien fest."],
["Einbau und Umschaltung", "Installation ohne Betriebsunterbrechung, eine Phase im bisherigen Betrieb, danach Umschaltung in die prädiktive Betriebsart. Ab diesem Datum läuft der Abrechnungszeitraum."],
["Bericht und Abrechnung", "Nach Abschluss des Zeitraums erstellen wir einen Bericht mit der vollständigen Berechnung; die Rechnung verweist auf dessen Nummer."]]]
]}
]
};
