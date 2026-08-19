// js/modules/instructions.js
// ─────────────────────────────────────────────────────────────────────────────
// Zakładka „Instrukcja korzystania z WaterAI Energy Control".
//
// Wersja 3 (2026-08-19): dodane INSTRUKCJE KROK PO KROKU (klient, obiekt, oferta)
// oraz sprostowane opisy, które rozjechały się z kodem: „Symulacje" to dziś „Oferta",
// metod analizy są cztery (nie siedem), kartoteka klienta NIE ma pól rozliczeniowych,
// a formularz obiektu nie ma pola powierzchni ogrzewanej.
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
      coZnajdziesz: 'Nazwę, VAT ID / NIP, kraj i język korespondencji, adres, link do Google Maps, osoby kontaktowe oraz listę obiektów klienta. Warunki rozliczenia (model, udział ESCO, termin płatności, e-mail do faktur) ustawia się NIE tutaj, tylko na obiekcie.',
      jakDodac: 'Przycisk „+ Nowy klient" nad listą. Wymagana jest wyłącznie nazwa — resztę można uzupełnić później. Język klienta decyduje o języku jego dokumentów, więc warto ustawić go od razu.'
    },
    objects: {
      icon: '🏢', name: 'Obiekty',
      poCo: 'Budynki klienta — hotel, szkoła, biurowiec. Każdy pomiar, analiza i raport dotyczy konkretnego obiektu, więc tutaj opisujemy, z czym pracujemy.',
      coZnajdziesz: 'Typ i status obiektu, adres, źródła ciepła dla CO i CWU, sposób odczytu zużycia, cykl rozliczeniowy, opiekunów (Back Office, Energy Analyst, Sales Rep), daty umowy i uruchomienia, warunki rozliczenia z udziałem ESCO, stację meteorologiczną oraz jednostkę energii, walutę i cenę.',
      jakDodac: 'W module Obiekty „+ Nowy obiekt" albo z kartoteki klienta. Wymagane są klient i nazwa. To na obiekcie, a nie na kliencie, ustawia się model rozliczenia, udział ESCO, termin płatności i e-mail do faktur — te dane trafiają potem na fakturę.'
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
      coZnajdziesz: 'Cztery metody: korekta TYM (stopniodni), korekta obłożenia, korekta intensywności oraz regresja liniowa. Trzy pierwsze są rozliczeniowe — to one są podstawą faktury. Regresja jest metodą pomocniczą: stanowi dowód techniczny, ale nie zastępuje metody rozliczeniowej.',
      jakDodac: '„+ Nowa analiza" → wybierz typ, klienta, obiekt i okres bazowy, wprowadź dane okresu analizowanego i kliknij „Wykonaj analizę". Analiza wymaga wcześniej przygotowanego okresu bazowego tego samego typu.'
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
      icon: '📋', name: 'Oferta',
      poCo: 'Dokument handlowy dla klienta przed wdrożeniem: ile może zaoszczędzić, jak rozłoży się to między niego a WaterAI i kiedy zwróci się opłata. Prognoza, nie rozliczenie — podstawą faktur są dopiero raporty ESCO.',
      coZnajdziesz: 'Scenariusze wieloletnie z podziałem oszczędności, cztery warianty rozliczenia (opłata wdrożeniowa w 2. roku — domyślny, kaucja zwrotna, opłata wdrożeniowa z góry, bez opłat), wykresy przepływów, opis metod pomiaru oszczędności oraz gotowy dokument do druku ze zdjęciami obiektu na okładce.',
      jakDodac: '„＋ Nowa oferta" → klient, obiekt, wariant rozliczenia, roczny koszt ogrzewania i scenariusze oszczędności. Szczegóły w instrukcji „Jak przygotować ofertę" niżej.'
    },
    visibility: {
      icon: '👁️', name: 'Widoczność',
      poCo: 'Sterowanie tym, kto widzi konkretny dokument. Klient i Sales Representative nie widzą niczego z samej roli — dostają dostęp wyłącznie tutaj, dokument po dokumencie.',
      coZnajdziesz: 'Macierz: dokumenty w wierszach, użytkownicy w kolumnach. Kolumny są ułożone alfabetycznie, można je zawęzić do jednego typu konta albo wyszukać po nazwisku. Zakładki u góry przełączają typ dokumentu: okresy bazowe, analizy, raporty ESCO, faktury i oferty.',
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

  // ── Instrukcje krok po kroku ───────────────────────────────────────────────
  // Klucz `modul` decyduje, komu przepis się pokaże: widzi go rola, która ma ten
  // moduł na liście kafelków. Dzięki temu nie trzeba pilnować dwóch list naraz.
  PRZEPISY: {
    klient: {
      modul: 'clients',
      icon: '👥', tytul: 'Jak dodać klienta',
      wstep: 'Klient to korzeń całej struktury — bez niego nie da się dodać obiektu, oferty ani faktury. Zajmuje minutę, bo wymagana jest tylko nazwa.',
      kroki: [
        ['Otwórz moduł Klienci i kliknij „+ Nowy klient"',
         'Formularz rozwija się nad listą. Jeśli klient już istnieje, użyj wyszukiwarki zamiast zakładać drugi raz — duplikaty rozjeżdżają numerację i raporty.'],
        ['Wypełnij dane podstawowe',
         'Nazwa jest jedynym polem wymaganym; wpisz ją tak, jak ma widnieć na fakturze. VAT ID / NIP, kraj i język są opcjonalne, ale język ustaw od razu — decyduje o języku dokumentów wysyłanych do tego klienta.'],
        ['Uzupełnij adres',
         'Kod pocztowy, miasto, ulica, numer budynku i lokalu. Adres z kartoteki idzie na faktury, więc podaj adres rejestrowy firmy, a nie adres budynku — ten wpiszesz osobno przy obiekcie.'],
        ['Dodaj osoby kontaktowe',
         'Przycisk „+ Dodaj osobę kontaktową" dokłada wiersz: imię i nazwisko, rola, e-mail, telefon. Możesz dodać kilka osób. Pusty wiersz jest pomijany przy zapisie, więc nic się nie stanie, jeśli go zostawisz.'],
        ['Zapisz',
         'Klient pojawia się na liście, a system zakłada mu automatycznie folder na dokumenty. Kolejny krok to dodanie obiektu — bez niego kartoteka jest pusta.']
      ],
      uwagi: [
        'Warunków rozliczenia (model, udział ESCO, termin płatności, e-mail do faktur) NIE ustawia się na kliencie, tylko na jego obiekcie — jeden klient może mieć obiekty na różnych warunkach.',
        'Zmiana nazwy klienta zmienia też nazwę jego folderu dokumentów. Numer klienta (K-001, K-002…) wynika z kolejności dodania i nie zmienia się.'
      ]
    },

    obiekt: {
      modul: 'objects',
      icon: '🏢', tytul: 'Jak dodać obiekt',
      wstep: 'Obiekt to budynek, którego dotyczą pomiary, analizy i rozliczenia. Formularz jest długi, ale wymagane są tylko dwa pola — reszta to dane, które będą potrzebne później, na kolejnych etapach.',
      kroki: [
        ['Otwórz moduł Obiekty i kliknij „+ Nowy obiekt"',
         'Możesz też wejść z kartoteki klienta — wtedy klient podpowie się sam. Klienta trzeba mieć wcześniej; obiektu nie da się dodać „w powietrzu".'],
        ['Dane podstawowe obiektu',
         'Wymagane: klient i nazwa obiektu. Do tego typ (hotel, szkoła, biurowiec, szpital, spółdzielnia, zakład…) i status: Oferta, Wdrożenie, Aktywny, Wstrzymany, Zakończony. Status Oferta oznacza obiekt, dla którego jeszcze nie ruszyło rozliczanie.'],
        ['Dane umowne i rozliczeniowe',
         'Tutaj — a nie w kartotece klienta — ustawiasz model rozliczenia, udział ESCO w procentach (domyślnie 50), termin płatności w dniach (domyślnie 14) i e-mail do faktur. Wpisz też opiekunów: Back Office, Energy Analyst i Sales Representative. Opiekun handlowy z tego pola pokazuje się potem w kolumnie „Sales Rep" na liście ofert.'],
        ['Adres obiektu',
         'Adres fizyczny budynku, niezależny od adresu rejestrowego klienta. Możesz dokleić link do Google Maps.'],
        ['System grzewczy i rozliczeniowy',
         'Źródło ciepła osobno dla CO i dla CWU, sposób odczytu zużycia (faktura albo licznik) i cykl rozliczeniowy z datą startu. Ustaw też, na ile dni przed terminem system ma przypominać o rozliczeniu (domyślnie 14).'],
        ['Dane klimatyczne (TYM)',
         'Stacja meteorologiczna, źródło danych i data ich pobrania oraz temperatura bazowa (domyślnie 21 °C). Z tych ustawień korzysta korekta TYM przy liczeniu stopniodni — bez nich analiza nie będzie miała do czego porównać sezonu.'],
        ['Dane energetyczne i zapis',
         'Jednostka energii (domyślnie GJ), waluta i cena jednostkowa energii. Zapisz — obiekt pojawi się na liście klienta, a jego terminy rozliczeń trafią do kalendarza.']
      ],
      uwagi: [
        'Formularz nie ma pola powierzchni ogrzewanej — wskaźniki na m² nie są dziś liczone, więc nie szukaj tego pola.',
        'Jednostka energii i waluta ustawione na obiekcie są dziedziczone przez analizy, raporty i faktury. Zmiana po fakcie nie przelicza dokumentów już wystawionych.'
      ]
    },

    oferta: {
      modul: 'simulation',
      icon: '📋', tytul: 'Jak przygotować ofertę',
      wstep: 'Oferta pokazuje klientowi, ile zaoszczędzi i kiedy zwróci mu się opłata. Powstaje w kilka minut, a wychodzi z niej gotowy dokument do druku lub PDF.',
      kroki: [
        ['Otwórz kafelek Oferta i kliknij „＋ Nowa oferta"',
         'Klient i obiekt muszą już istnieć w systemie. Ofertę może przygotować personel wewnętrzny oraz Sales Representative.'],
        ['Nagłówek: nazwa, numer, autor',
         'Nazwę i numer możesz zostawić puste — przy zapisie system wstawi „Oferta — nazwa klienta" oraz numer w formacie OF/rok/nr klienta/nr obiektu/kolejny. W polu „Sporządził" wybierz siebie z listy.'],
        ['Wybierz klienta i obiekt',
         'Klient jest wymagany — bez niego zapis nie przejdzie. Obiekt jest opcjonalny, ale bez niego numer oferty będzie uboższy, a na okładce zabraknie nazwy budynku.'],
        ['Ustaw wariant rozliczenia',
         'Domyślny to „Opłata wdrożeniowa w 2. roku": rok 1 jest okresem weryfikacji bez opłat, a w 2. roku opłata spłaca się z wypracowanych oszczędności. Kwota podpowiada się według waluty i można ją nadpisać. Pozostałe warianty: kaucja zwrotna, opłata wdrożeniowa z góry, bez opłat.'],
        ['Podaj założenia finansowe',
         'Roczny koszt ogrzewania jest wymagany i musi być większy od zera — to od niego liczy się wszystko. Dalej: roczny wzrost cen energii (domyślnie 6,48%), horyzont w latach (domyślnie 10) i udział klienta w oszczędnościach (domyślnie 50%).'],
        ['Dodaj scenariusze oszczędności',
         'Domyślnie jest jeden wariant z oszczędnością 18%. Przyciskiem „＋ Dodaj wariant" dołóż kolejne — np. ostrożny, realny i optymistyczny — i zaznacz, który jest bazowy. Scenariusz bazowy trafia na okładkę i do podsumowania.'],
        ['Dodaj zdjęcia obiektu (opcjonalnie)',
         'Zdjęcia z sekcji „Zdjęcia obiektu (na okładkę)" pojawią się na pierwszej stronie dokumentu. Warto — oferta ze zdjęciem budynku wygląda jak dokument przygotowany pod konkretnego klienta.'],
        ['Zapisz i otwórz podgląd',
         'Przycisk „💾 Zapisz" odkłada ofertę na listę i podświetla świeżo zapisany wiersz. Ikoną 👁 otworzysz gotowy dokument — z okładką, podsumowaniem, metodami pomiaru oszczędności, tabelami lat i wykresami — do wydruku albo zapisania jako PDF.']
      ],
      uwagi: [
        'Status oferty (Robocza → Zaprezentowana → Zaakceptowana / Odrzucona) prowadź na bieżąco: chipy nad listą filtrują po nim, a podsumowanie u góry liczy z niego przychód roczny w toku i zaakceptowany.',
        'Kwoty w różnych walutach nigdy nie są sumowane razem — system nie zna kursów i pokazuje je osobno.',
        'Oferta to prognoza. Rzeczywiste oszczędności liczy się później metodą zapisaną w umowie, a dokumentuje raportem ESCO.'
      ]
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

  // Blok jednej instrukcji krok po kroku: numerowane kroki + uwagi na końcu.
  _przepis(klucz) {
    var pz = this.PRZEPISY[klucz];
    if (!pz) return '';
    var self = this;
    var kroki = pz.kroki.map(function (k, i) {
      return '<div style="display:flex;gap:12px;margin-bottom:12px;">' +
        '<div style="flex:0 0 24px;height:24px;border-radius:50%;background:#0C447C;color:#fff;' +
          'font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;">' + (i + 1) + '</div>' +
        '<div style="flex:1;">' +
          '<div style="font-size:13px;font-weight:600;color:var(--color-text-primary);margin-bottom:3px;">' +
            self._esc(k[0]) + '</div>' +
          '<div style="font-size:13px;color:var(--color-text-secondary);line-height:1.6;">' +
            self._esc(k[1]) + '</div>' +
        '</div></div>';
    }).join('');
    var uwagi = (pz.uwagi && pz.uwagi.length)
      ? '<div style="margin-top:12px;padding:12px 14px;background:#FEF3DC;border-left:3px solid #E0A800;border-radius:6px;">' +
          '<div style="font-size:12px;font-weight:600;color:#7A4A00;margin-bottom:6px;">Warto wiedzieć</div>' +
          this._list(pz.uwagi.map(function (u) { return self._esc(u); })) + '</div>'
      : '';
    return '<div style="padding:16px 0;border-top:1px solid var(--color-border-tertiary);">' +
      '<div style="font-size:14px;font-weight:600;color:var(--color-text-primary);margin-bottom:4px;">' +
        pz.icon + ' ' + this._esc(pz.tytul) + '</div>' +
      this._p(this._esc(pz.wstep)) + kroki + uwagi + '</div>';
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

    // Instrukcje krok po kroku — tylko te, których moduł rola faktycznie ma.
    var dostepne = Object.keys(this.PRZEPISY)
      .filter(function (k) { return def.moduly.indexOf(self.PRZEPISY[k].modul) !== -1; });
    var przepisy = dostepne.length ? this._card(
      this._h('Instrukcje krok po kroku') +
      this._p('Najczęstsze zadania rozpisane po kolei. Kolejność ma znaczenie: klient musi istnieć przed obiektem, ' +
        'a obiekt przed ofertą i rozliczeniem.') +
      dostepne.map(function (k) { return self._przepis(k); }).join('')
    ) : '';

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

    return '<div style="max-width:860px;">' + naglowek + struktura + przepisy + moduly + widocznosc + '</div>';
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
      // Instrukcja opisuje konfigurację ról i modułów, która zmienia się rzadko —
      // stąd tydzień. Cykl przerysowuje stronę i sprawdza, czy nie wyszła nowsza
      // wersja aplikacji (szczegóły w js/modules/auto-odswiezanie.js).
      if (window.WaterAIAutoOdswiezanie) {
        WaterAIAutoOdswiezanie.pilnuj('instructions', WaterAIAutoOdswiezanie.TYDZIEN, function () {
          window.openModule('instructions');
        });
      }
      return;
    }
    if (_prev) return _prev(moduleName);
  };
})();
