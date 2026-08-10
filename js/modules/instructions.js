// js/modules/instructions.js
// ─────────────────────────────────────────────────────────────────────────────
// Zakładka „Instrukcja korzystania z WaterAI Energy Control".
//
// Wersja 2 (2026-08-10): treść jest teraz OSOBNA dla każdej z pięciu ról i opisuje
// każdy moduł widoczny dla tej roli — po co jest, co w nim znajdziesz i jak dodać
// nową pozycję. Wcześniej role wewnętrzne dostawały jeden wspólny tekst, a Klient
// i Sales Rep po cztery zdania, więc instrukcja odpowiadała na pytanie „co to za
// system", a nie „co mam zrobić".
//
// Kalendarz jest świadomie pominięty — moduł czeka na przebudowę.
//
// Budowa: katalog MODULY trzyma opis każdego modułu (po co / co znajdziesz /
// jak dodać), a ROLE składa z nich instrukcję dla konkretnej roli. Opis modułu
// istnieje więc w JEDNYM miejscu, a nie w pięciu kopiach — i tłumaczy się raz.
// Kolejność modułów odpowiada kolejności kafelków z roleModules w index.html.
//
// Tłumaczenie: cały tekst jest po polsku i idzie przez silnik i18n (DomainI18n),
// tak jak reszta aplikacji. Klucze siedzą w js/modules/i18n-instrukcja.js.
// Moduł jest wyłącznie prezentacyjny (żadnych danych, żadnego localStorage).
// ─────────────────────────────────────────────────────────────────────────────
const InstructionsModule = {

  // ── Katalog modułów: ikona, nazwa, po co, co znajdziesz, jak dodać ─────────
  // „jakDodac" puste = moduł tylko do odczytu albo dodawanie odbywa się gdzie indziej.
  MODULY: {
    clients: {
      icon: '👥', name: 'Klienci',
      poCo: 'Kartoteka firm, dla których prowadzimy rozliczenia. To korzeń całej struktury — bez klienta nie da się dodać obiektu ani wystawić faktury.',
      coZnajdziesz: 'Dane rejestrowe i adresowe, NIP/VAT ID, osoby kontaktowe, model rozliczenia i udział ESCO, termin płatności w dniach, e-mail do faktur oraz listę obiektów klienta.',
      jakDodac: 'Przycisk „+ Nowy klient" nad listą. Wymagana jest nazwa, resztę można uzupełnić później. Termin płatności ustawiony w kartotece podpowiada się potem przy każdej fakturze tego klienta.'
    },
    objects: {
      icon: '🏢', name: 'Obiekty',
      poCo: 'Budynki klienta — hotel, szkoła, biurowiec. Każdy pomiar, analiza i raport dotyczy konkretnego obiektu, więc tutaj opisujemy, z czym pracujemy.',
      coZnajdziesz: 'Adres i typ obiektu, powierzchnię ogrzewaną, źródła ciepła dla CO i CWU, cykl rozliczeniowy, daty umowy i uruchomienia, stację meteorologiczną oraz parametry energetyczne potrzebne do analiz.',
      jakDodac: 'W kartotece klienta „+ Dodaj obiekt dla tego klienta" albo w module Obiekty. Uzupełnij przynajmniej nazwę, powierzchnię ogrzewaną i źródło ciepła — bez tego analizy nie policzą wskaźników jednostkowych.'
    },
    readings: {
      icon: '📟', name: 'Pomiary',
      poCo: 'Surowe odczyty liczników i czujników. To podstawa wszystkiego, co system później liczy — bez pomiarów nie ma ani analizy, ani raportu, ani faktury.',
      coZnajdziesz: 'Odczyty z datą, wskazania licznika, zużycie w okresie, temperaturę zewnętrzną i temperaturę zasilania. System sam wykrywa duplikaty oraz wskazania niższe od poprzedniego.',
      jakDodac: 'Trzy drogi: „+ Dodaj pomiar" dla pojedynczego odczytu, „+ Pomiar seryjny" do wklejenia listy miesięcy naraz, albo import pliku CSV z czujników. Przy imporcie wymagane kolumny to data, temperatura zewnętrzna, temperatura zasilania i zużycie.'
    },
    measurements: {
      icon: '📊', name: 'Okresy bazowe',
      poCo: 'Protokół TYM — zamrożony stan sprzed wdrożenia, do którego porównujemy wszystko, co dzieje się później. Bez okresu bazowego nie da się wykazać oszczędności.',
      coZnajdziesz: 'Numer protokołu, zakres dat, dane klimatyczne Typowego Roku Meteorologicznego, stopniodni rzeczywiste i standardowe oraz zużycie sprowadzone do warunków standardowych.',
      jakDodac: '„+ Nowy okres bazowy" — wybierz obiekt, podaj numer protokołu i zakres dat, a potem wprowadź średnie temperatury miesięczne albo skopiuj dane klimatyczne z poprzedniego protokołu. Numer protokołu jest wymagany.'
    },
    analyses: {
      icon: '📐', name: 'Analizy',
      poCo: 'Przeliczenie oszczędności wybraną metodą. Analiza odpowiada na pytanie, ile energii realnie zaoszczędzono po sprowadzeniu obu okresów do wspólnych warunków.',
      coZnajdziesz: 'Metody: korekta TYM (stopniodni), regresja liniowa, korekta obłożenia, powierzchni, harmonogramu i intensywności. Do każdej równania, wykresy, wskaźnik jednostkowy i część dowodową.',
      jakDodac: '„+ Nowa analiza" → wybierz typ, klienta, obiekt i okres bazowy, wprowadź dane okresu analizowanego, a na dole kliknij „Wykonaj analizę". Analizę może wykonać wyłącznie użytkownik z rolą Energy Analyst.'
    },
    reports: {
      icon: '📈', name: 'Raporty ESCO',
      poCo: 'Dokument dla klienta, który zbiera analizy w jedną całość i jest podstawą do wystawienia faktury za oszczędności.',
      coZnajdziesz: 'Podsumowanie oszczędności, metodykę rozliczenia, część dowodową z wykresami, prognozę roczną i podział korzyści między klienta a WaterAI. Raport można zamrozić — od tej chwili jego treść już się nie zmienia.',
      jakDodac: '„+ Nowy raport ESCO" → wybierz klienta i obiekt, zaznacz analizy, które mają wejść do raportu, uzupełnij dane formalne i zapisz. Raport idzie w języku spółki wystawiającej.'
    },
    invoicing: {
      icon: '🧾', name: 'Faktury',
      poCo: 'Wystawianie faktur, w tym rozliczeń ESCO liczonych wprost z raportu. Tu zamyka się cykl: pomiar → analiza → raport → pieniądze.',
      coZnajdziesz: 'Listę faktur z numerem, klientem, obiektem, podmiotem wystawiającym, datami i statusem — każda kolumna jest sortowalna. Do tego kafelki z kwotami wystawionymi, opłaconymi i zaległymi oraz wydruk faktury w języku spółki.',
      jakDodac: '„+ Nowa faktura" → wskaż podmiot wystawiający i klienta, a jako podstawę wybierz raport ESCO albo analizę. Kwota netto, okres i uwagi podpowiedzą się same; pola na żółtym tle to podpowiedzi, które możesz nadpisać. Termin płatności liczy się z kartoteki klienta.'
    },
    simulation: {
      icon: '💡', name: 'Symulacje oszczędności',
      poCo: 'Prognoza przed wdrożeniem — ile klient może zaoszczędzić i jak rozłoży się to między niego a WaterAI. Narzędzie ofertowe, nie rozliczeniowe.',
      coZnajdziesz: 'Scenariusze wieloletnie, warianty rozliczenia (bez opłat, kaucja zwrotna, opłata wdrożeniowa), założenia cenowe i wykresy przepływów.',
      jakDodac: '„+ Nowa symulacja" → wybierz klienta i obiekt, podaj koszt energii oraz zakładany procent oszczędności, wybierz wariant rozliczenia i horyzont w latach.'
    },
    visibility: {
      icon: '👁️', name: 'Widoczność',
      poCo: 'Sterowanie tym, kto widzi konkretny dokument. Klient i Sales Representative nie widzą niczego z samej roli — dostają dostęp wyłącznie tutaj, dokument po dokumencie.',
      coZnajdziesz: 'Macierz: dokumenty w wierszach, użytkownicy w kolumnach. Kolumny są ułożone alfabetycznie, można je zawęzić do jednego typu konta albo wyszukać po nazwisku. Zakładki u góry przełączają typ dokumentu.',
      jakDodac: 'Zaznacz „W" (widzi) albo „E" (edytuje) na przecięciu dokumentu i użytkownika. „E" automatycznie włącza „W", odznaczenie odbiera dostęp. Zmiana zapisuje się od razu.'
    },
    users: {
      icon: '🔑', name: 'Użytkownicy i role',
      poCo: 'Konta w systemie i ich uprawnienia. Rola decyduje o tym, co dana osoba może zrobić — i jest egzekwowana przez bazę, nie tylko przez wygląd ekranu.',
      coZnajdziesz: 'Listę kont z rolami, przypisanie konta klienckiego do konkretnego klienta oraz możliwość zablokowania konta.',
      jakDodac: '„+ Nowy użytkownik" → podaj e-mail, imię i nazwisko oraz rolę. Konto z rolą Client trzeba dodatkowo przypisać do klienta, inaczej nie zobaczy żadnych danych. Konta zakłada wyłącznie Administrator.'
    },
    settings: {
      icon: '⚙️', name: 'Ustawienia i kopia zapasowa',
      poCo: 'Konfiguracja systemu i zabezpieczenie danych.',
      coZnajdziesz: 'Wybór języka, podmioty wystawiające faktury oraz eksport i import kopii zapasowej. Dane pracują we wspólnej bazie, a plik JSON to dodatkowa kopia lokalna.',
      jakDodac: '„Zapisz kopię (eksport)" pobiera plik JSON. Przy imporcie wybierz tryb: „Zastąp" nadpisuje wszystko, „Dołącz" scala. Przed importem system sam pobiera autozapis bieżącego stanu.'
    },
    rolePreview: {
      icon: '🎭', name: 'Podgląd ról',
      poCo: 'Sprawdzenie, jak aplikację widzi osoba z inną rolą — zanim wyśle się jej link.',
      coZnajdziesz: 'Widok modelowy: kafelki i zakres danych danej roli. To podgląd wyglądu, a nie test uprawnień — te egzekwuje baza.',
      jakDodac: ''
    },
    instructions: {
      icon: '📖', name: 'Instrukcja',
      poCo: 'Ten ekran. Treść dopasowuje się do Twojej roli, więc opisuje wyłącznie moduły, do których masz dostęp.',
      coZnajdziesz: 'Opis każdego modułu i zasady widoczności dokumentów.',
      jakDodac: ''
    },

    // ── Warianty klienckie: te same dane, ale zawężone do własnych obiektów ──
    myObjects: {
      icon: '🏢', name: 'Moje obiekty',
      poCo: 'Budynki objęte umową z WaterAI.',
      coZnajdziesz: 'Dane każdego obiektu: adres, powierzchnię, źródło ciepła i cykl rozliczeniowy.',
      jakDodac: 'Obiekty zakłada zespół WaterAI. Jeśli czegoś brakuje albo dane się zmieniły, zgłoś to swojemu opiekunowi.'
    },
    myReadings: {
      icon: '📟', name: 'Moje pomiary',
      poCo: 'Odczyty liczników dla Twoich obiektów.',
      coZnajdziesz: 'Historię odczytów z datami i zużyciem w każdym okresie.',
      jakDodac: '„+ Dodaj pomiar" — wybierz obiekt, podaj datę i wskazanie licznika. Możesz dołączyć zdjęcie licznika jako potwierdzenie.'
    },
    myMeasurements: {
      icon: '📊', name: 'Moje okresy bazowe',
      poCo: 'Protokoły TYM opisujące stan sprzed wdrożenia — punkt odniesienia dla wszystkich rozliczeń.',
      coZnajdziesz: 'Numer protokołu, zakres dat i zużycie bazowe sprowadzone do warunków standardowych.',
      jakDodac: 'Okresy bazowe przygotowuje analityk WaterAI.'
    },
    myReports: {
      icon: '📈', name: 'Moje raporty ESCO',
      poCo: 'Rozliczenia oszczędności udostępnione Ci przez zespół WaterAI.',
      coZnajdziesz: 'Wykazane oszczędności, metodykę wyliczenia, część dowodową z wykresami i podział korzyści.',
      jakDodac: 'Raporty tworzy WaterAI. Pojawiają się tutaj po udostępnieniu.'
    },
    myInvoices: {
      icon: '🧾', name: 'Moje faktury',
      poCo: 'Faktury wystawione na podstawie wykazanych oszczędności.',
      coZnajdziesz: 'Numer, kwotę, termin płatności i status każdej faktury oraz wydruk do pobrania.',
      jakDodac: 'Faktury wystawia WaterAI. Pojawiają się tutaj po udostępnieniu.'
    }
  },

  // ── Instrukcja per rola ────────────────────────────────────────────────────
  ROLE: {
    admin: {
      nazwa: 'Administrator',
      wstep: 'Masz pełną kontrolę nad systemem. Widzisz i edytujesz wszystkie dane każdego klienta, zakładasz konta i decydujesz, kto co widzi. Jesteś jedyną rolą, która może usunąć dowolny rekord.',
      moduly: ['clients', 'objects', 'simulation', 'readings', 'measurements', 'analyses', 'reports', 'invoicing', 'visibility', 'users', 'settings', 'rolePreview', 'instructions'],
      widocznosc: [
        'Widzisz wszystko: wszystkich klientów, wszystkie obiekty, pomiary, okresy bazowe, analizy, raporty ESCO, faktury i symulacje.',
        'Możesz usunąć dowolny rekord, także cudzy. Żadna inna rola tego nie potrafi.',
        'Zakładasz, edytujesz i blokujesz konta użytkowników.',
        'Zarządzasz udostępnianiem w module Widoczność — to Ty decydujesz, które dokumenty zobaczy Klient i Sales Representative.',
        'Konfigurujesz system: język, podmioty wystawiające faktury, kopie zapasowe.'
      ]
    },
    backOffice: {
      nazwa: 'Back Office',
      wstep: 'Prowadzisz obsługę operacyjno-rozliczeniową: kartoteki klientów, obiekty, faktury i symulacje. Masz dostęp do wszystkich danych, ale nie zakładasz kont użytkowników.',
      moduly: ['clients', 'objects', 'simulation', 'readings', 'invoicing', 'reports', 'visibility', 'users', 'instructions'],
      widocznosc: [
        'Widzisz wszystkich klientów i wszystkie ich dane, bez potrzeby udostępniania.',
        'Wystawiasz faktury i tworzysz symulacje oszczędności.',
        'Możesz usuwać rekordy.',
        'Zarządzasz udostępnianiem w module Widoczność — nadajesz prawo „widzi" i „edytuje" na dokumentach.',
        'Nie zakładasz kont użytkowników, robi to Administrator.'
      ]
    },
    energyAnalyst: {
      nazwa: 'Energy Analyst',
      wstep: 'Odpowiadasz za stronę merytoryczną: pomiary, okresy bazowe, analizy i raporty ESCO. To Twoje wyliczenia są podstawą faktur, dlatego analizę może wykonać wyłącznie konto z tą rolą.',
      moduly: ['objects', 'simulation', 'readings', 'measurements', 'analyses', 'reports', 'visibility', 'instructions'],
      widocznosc: [
        'Widzisz wszystkie dane energetyczne: obiekty, pomiary, okresy bazowe, analizy i raporty ESCO.',
        'Tworzysz analizy, raporty ESCO i symulacje.',
        'Usuwasz wyłącznie własne rekordy, cudzych nie ruszasz.',
        'Zarządzasz udostępnianiem w module Widoczność.',
        'Nie zakładasz kont użytkowników.'
      ]
    },
    salesRepresentative: {
      nazwa: 'Sales Representative',
      wstep: 'Jesteś opiekunem handlowym klienta. Dodajesz klientów i obiekty, wprowadzasz pomiary i przygotowujesz symulacje ofertowe. Dokumenty rozliczeniowe widzisz tylko wtedy, gdy zespół WaterAI wprost Ci je udostępni.',
      moduly: ['clients', 'objects', 'simulation', 'readings', 'reports', 'instructions'],
      widocznosc: [
        'Operacyjnie prowadzisz obiekty, przy których jesteś przypisany jako opiekun.',
        'Dokumenty — okresy bazowe, analizy, raporty ESCO, faktury i symulacje — widzisz WYŁĄCZNIE po udostępnieniu przez Administratora, Back Office albo Energy Analyst.',
        'Udostępnienie daje albo samo „widzi", albo „widzi i edytuje". Jeśli dokumentu nie ma na Twojej liście, nie został jeszcze udostępniony — poproś opiekuna.',
        'Widzisz swoją prowizję, naliczaną zgodnie z zawartą umową.',
        'Nie wystawiasz faktur, nie usuwasz cudzych rekordów, nie zakładasz kont i sam nie udostępniasz dokumentów.'
      ]
    },
    client: {
      nazwa: 'Klient',
      wstep: 'Widzisz zużycie energii swoich obiektów i oszczędności rozliczane w modelu ESCO. Możesz sam wprowadzać odczyty liczników — im częściej, tym dokładniejsze rozliczenie.',
      moduly: ['myObjects', 'myReadings', 'myMeasurements', 'myReports', 'myInvoices', 'instructions'],
      widocznosc: [
        'Widzisz wyłącznie swoje obiekty i swoje pomiary. Dane innych klientów są dla Ciebie niedostępne.',
        'Dokumenty — raporty ESCO, analizy i faktury — widzisz wtedy, gdy sam je dodałeś albo gdy zespół WaterAI Ci je udostępnił.',
        'Jeśli spodziewasz się dokumentu, którego nie ma na liście, skontaktuj się ze swoim opiekunem.',
        'Możesz dodawać odczyty dla swoich obiektów.',
        'Niczego nie usuwasz i nie udostępniasz dalej.'
      ]
    }
  },

  _role() {
    if (typeof currentRole !== 'undefined' && currentRole) return currentRole;
    if (typeof realRole !== 'undefined' && realRole) return realRole;
    return 'admin';
  },

  _esc(t) {
    return String(t == null ? '' : t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  },

  _card(inner) {
    return '<div style="border:1px solid var(--color-border-tertiary);border-radius:12px;' +
      'padding:18px 20px;margin-bottom:16px;">' + inner + '</div>';
  },

  _h(txt) {
    return '<div style="font-size:15px;font-weight:600;color:#0C447C;margin-bottom:10px;">' + txt + '</div>';
  },

  _p(txt) {
    return '<div style="font-size:13px;color:var(--color-text-secondary);line-height:1.6;margin-bottom:8px;">' + txt + '</div>';
  },

  _list(items) {
    return '<ul style="margin:6px 0 0;padding-left:18px;font-size:13px;color:var(--color-text-secondary);line-height:1.6;">' +
      items.map(function (i) { return '<li style="margin-bottom:6px;">' + i + '</li>'; }).join('') + '</ul>';
  },

  // Blok jednego modułu: nazwa + trzy pytania, na które instrukcja ma odpowiadać.
  _modul(klucz) {
    var m = this.MODULY[klucz];
    if (!m) return '';
    var self = this;
    var wiersz = function (etykieta, tresc) {
      if (!tresc) return '';
      return '<div style="display:flex;gap:10px;margin-bottom:6px;">' +
        '<div style="flex:0 0 116px;font-size:12px;font-weight:600;color:var(--color-text-primary);">' + etykieta + '</div>' +
        '<div style="flex:1;font-size:13px;color:var(--color-text-secondary);line-height:1.6;">' + self._esc(tresc) + '</div></div>';
    };
    return '<div style="padding:14px 0;border-top:1px solid var(--color-border-tertiary);">' +
      '<div style="font-size:14px;font-weight:600;color:var(--color-text-primary);margin-bottom:8px;">' +
        m.icon + ' ' + this._esc(m.name) + '</div>' +
      wiersz('Po co jest', m.poCo) +
      wiersz('Co znajdziesz', m.coZnajdziesz) +
      wiersz('Jak dodać', m.jakDodac) +
      '</div>';
  },

  render() {
    var rola = this._role();
    var def = this.ROLE[rola] || this.ROLE.admin;
    var self = this;

    var naglowek = this._card(
      '<div style="font-size:16px;font-weight:600;color:#0C447C;margin-bottom:6px;">' +
        '📖 Instrukcja korzystania z WaterAI Energy Control</div>' +
      this._p('Twoja rola: <strong>' + this._esc(def.nazwa) + '</strong>. Ta instrukcja opisuje wyłącznie moduły, ' +
        'do których masz dostęp — u osoby z inną rolą wygląda inaczej.') +
      this._p(this._esc(def.wstep))
    );

    var struktura = this._card(
      this._h('Jak zbudowany jest system') +
      this._p('WaterAI Energy Control służy do pomiaru i rozliczania oszczędności energii w modelu ESCO. ' +
        'Wszystko wisi na jednej strukturze:') +
      this._p('<strong>Klient → jego Obiekty (budynki) → dla obiektu: Pomiary → Okres bazowy → Analiza → ' +
        'Raport ESCO → Faktura</strong>') +
      this._p('Kolejność ma znaczenie: nie da się wykonać analizy bez okresu bazowego ani wystawić rozliczenia ESCO ' +
        'bez raportu. Symulacje stoją obok tego łańcucha — służą do ofertowania przed wdrożeniem.')
    );

    var moduly = this._card(
      this._h('Twoje moduły') +
      def.moduly.map(function (k) { return self._modul(k); }).join('')
    );

    var widocznosc = this._card(
      this._h('Co widzisz') +
      this._p('Dostęp do danych wynika z dwóch niezależnych rzeczy. Pierwsza to <strong>rola</strong> — stała, ' +
        'przypisana do konta, określa co w ogóle możesz robić. Druga to <strong>udostępnienie</strong> — nadawane ' +
        'osobno dla pojedynczego dokumentu, daje prawo „widzi" albo „edytuje" na czymś, czego z samej roli ' +
        'byś nie zobaczył.') +
      this._list(def.widocznosc.map(function (w) { return self._esc(w); })) +
      this._p('<strong>Uwaga:</strong> uprawnienia egzekwuje baza danych, a nie wygląd ekranu. Ukrycie kafelka ' +
        'nie jest zabezpieczeniem — zabezpieczeniem są reguły po stronie bazy, działające niezależnie od tego, ' +
        'co widać w przeglądarce.')
    );

    return '<div style="max-width:860px;">' + naglowek + struktura + moduly + widocznosc + '</div>';
  }
};
window.InstructionsModule = InstructionsModule;

// ── Wpięcie strony „Instrukcja" do routingu modułów (wzorzec z backup.js) ──
(function () {
  const _prev = window.openModule;
  window.openModule = function (moduleName) {
    if (moduleName === 'instructions') {
      const labels = (typeof getModuleLabels === 'function') ? getModuleLabels() : {};
      const item = labels['instructions'];
      const titleEl = document.getElementById('module-title');
      if (titleEl && item) titleEl.textContent = item[1];
      const modView = document.getElementById('module-view');
      if (modView) modView.classList.add('active');
      const descEl = document.getElementById('module-description');
      if (descEl) descEl.textContent = '';
      const content = document.getElementById('module-content');
      if (content) content.innerHTML = InstructionsModule.render();
      window._i18nRerender = function () { window.openModule('instructions'); };   // patrz setLanguage()
      return;
    }
    if (_prev) return _prev(moduleName);
  };
})();
