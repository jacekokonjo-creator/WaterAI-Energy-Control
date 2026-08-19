window.I18N = window.I18N || {};
/* Österreichische Variante.
   Erbt alle Texte von "de" und überschreibt nur, was sich in Österreich unterscheidet.
   Hier ist der Ort für AT-spezifische Terminologie und Rechtsformulierungen
   (USt. statt MwSt., lokale Firmendaten, Heizkostenabrechnungsgesetz usw.). */
window.I18N["at"] = {
extends: "de",
label: "AT", htmlLang: "de-AT",
title: "WaterAI Energy Control — Messung und Abrechnung von Energieeinsparungen (AT)",
aside: [
["Sie haben noch kein Konto?", "Konten legt der Administrator an. Im Panel sehen Sie die Ergebnisse für Ihre Objekte — daneben beschreiben wir die Methode, aus der diese Ergebnisse entstehen."],
["Sie möchten wissen, was das bei Ihnen bringt?", "Wir erstellen eine Einsparsimulation auf Basis Ihrer tatsächlichen Kosten — Energierechnungen oder Zählerstände der letzten Heizperioden genügen. Die Simulation ist eine Prognose; abgerechnet wird ausschließlich, was die Messung nach Ablauf der Periode zeigt."]
],
footer: ["Water AI · waterai.sk · info@waterai.sk", "Die Darstellung dient der Information; verbindlich sind der Vertrag und das Messprotokoll."]
};
