// ─────────────────────────────────────────────────────────────────────────
// i18n-oferta.js — brakujące etykiety LISTY OFERT (simulations.js).
//
// Skąd luka: audyt (narzedzia/audyt-i18n.js) odsiewał napisy jednowyrazowe
// regułą /^[#.]?[\w-]+$/ (miała odrzucać selektory CSS i gołe identyfikatory).
// Wpadały pod nią prawdziwe etykiety interfejsu — „Kwoty", „Wszystkie",
// „Robocze", „Odrzucona" — więc audyt raportował 100% pokrycia modułu Oferta,
// a na ekranie chipy filtrów i nagłówek kolumny zostawały po polsku.
//
// Statusy w liczbie POJEDYNCZEJ („Robocza", „Zaprezentowana", „Zaakceptowana")
// są już w i18n-domain.js — to plakietka przy wierszu. Tutaj domykamy formę
// MNOGĄ z chipów filtrów oraz brakującą „Odrzuconą".
//
// Ładowany PO i18n-domain.js; nie nadpisuje kluczy, które słowniki już znają.
// Klucz = dokładny tekst polski widoczny w interfejsie.
// ─────────────────────────────────────────────────────────────────────────
(function () {
  'use strict';

  // pl → [en, de, es, cs, sk]; austriacki (at) dzieli obiekt słownika z de.
  const T = {
    // ── plakietka statusu przy wierszu (brakujące uzupełnienie do domain) ──
    "Odrzucona": [
      "Rejected", "Abgelehnt", "Rechazada",
      "Zamítnutá", "Zamietnutá"],

    // ── chipy filtrów nad tabelą ──
    "Wszystkie": [
      "All", "Alle", "Todas",
      "Všechny", "Všetky"],
    "Robocze": [
      "Drafts", "Entwürfe", "Borradores",
      "Pracovní", "Pracovné"],
    "Zaprezentowane": [
      "Presented", "Präsentiert", "Presentadas",
      "Prezentované", "Prezentované"],
    "Zaakceptowane": [
      "Accepted", "Angenommen", "Aceptadas",
      "Přijaté", "Prijaté"],
    "Odrzucone": [
      "Rejected", "Abgelehnt", "Rechazadas",
      "Zamítnuté", "Zamietnuté"],

    // ── nagłówek kolumny z kwotami ──
    "Kwoty": [
      "Amounts", "Beträge", "Importes",
      "Částky", "Sumy"]
  };

  const D = window.DomainI18n;
  if (!D || !D.dict) { console.warn('[i18n-oferta] Brak DomainI18n — słownik oferty pominięty.'); return; }

  const KOLEJNOSC = ['en', 'de', 'es', 'cs', 'sk'];
  let dodane = 0;
  KOLEJNOSC.forEach(function (lang, i) {
    const slownik = D.dict[lang];
    if (!slownik) return;
    Object.keys(T).forEach(function (pl) {
      // Źródłem prawdy pozostają wcześniejsze słowniki — nie nadpisujemy.
      if (Object.prototype.hasOwnProperty.call(slownik, pl)) return;
      slownik[pl] = T[pl][i];
      dodane++;
    });
  });
  // at = de (ten sam obiekt), więc niemieckie wpisy działają też dla Austrii.
  console.log('[i18n-oferta] Uzupełniono ' + dodane + ' wpisów w słownikach listy ofert.');
})();
