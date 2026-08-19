window.I18N = window.I18N || {};
window.I18N["pl"] = {
label: "PL", htmlLang: "pl",
title: "WaterAI Energy Control — system pomiaru i rozliczania oszczędności energii",
desc: "Jak mierzymy i rozliczamy oszczędności energii: korekta na Typowy Rok Meteorologiczny i kontrolna regresja liniowa. Logowanie do panelu Energy Control.",
eyebrow: "Energy Control · metoda pomiaru i rozliczania",
h1: "Oszczędność energii bez inwestycji własnej",
lede: "Płacą Państwo wyłącznie za energię, którą uda się realnie zaoszczędzić — odmierzoną z licznika, skorygowaną o wpływ pogody i potwierdzoną drugą, niezależną metodą. Przed startem przygotujemy symulację opartą na Państwa rzeczywistych kosztach.",
switchIntro: "<strong>Chcą Państwo wiedzieć dokładnie, jak liczymy?</strong> Włączenie szczegółów rozwija na tej stronie pełny opis metody: wzory, źródła danych, kolejność kroków rozliczenia i model regresji.",
toggleOff: "Szczegółowe informacje",
toggleOn: "Ukryj szczegóły",
cards: [
["Zero nakładów", "Bez inwestycji po Państwa stronie i bez ingerencji w istniejącą regulację."],
["Płatność z oszczędności", "Wynagrodzenie to uzgodniony udział w wartości odmierzonej oszczędności."],
["Wynik odporny na pogodę", "Każdy okres przeliczany na te same, normowe warunki (TYM)."]
],
login: {
title: "Energy Control", sub: "System pomiaru i rozliczania oszczędności energii",
email: "Login / e-mail", emailPh: "np. admin@waterai.pl",
pass: "Hasło", passPh: "Wpisz hasło", submit: "Zaloguj",
errEmpty: "Podaj login i hasło.",
mock: "Makieta — podłącz przycisk do logiki logowania aplikacji.",
powered: "Powered by WaterAI"
},
langLabel: "Język",
aside: [
["Nie mają Państwo jeszcze konta?", "Konta zakłada administrator. W panelu widać wyniki dla Państwa obiektów, a obok opisujemy metodę, według której te wyniki powstają."],
["Chcą Państwo wiedzieć, ile to może dać u Państwa?", "Przygotujemy symulację oszczędności na podstawie Państwa rzeczywistych kosztów — wystarczą faktury za nośnik energii lub odczyty licznika z ostatnich sezonów. Symulacja jest prognozą; rozliczamy wyłącznie to, co po okresie pokaże pomiar."]
],
footer: ["Water AI · waterai.sk · info@waterai.sk", "Opis ma charakter informacyjny; wiążące warunki określa umowa i protokół pomiarowy."],
closing: "Po zakończeniu okresu umownego cały efekt technologii pozostaje po Państwa stronie.",
sections: [
{h: "Co proponujemy", b: [
["p", "Wdrażamy prediktywne sterowanie ogrzewaniem na istniejącej instalacji. Układ uczy się zachowania budynku i reakcji na pogodę, a następnie wyprzedza zapotrzebowanie zamiast reagować z opóźnieniem. Nie wymieniamy źródła ciepła ani nie ingerujemy w obecną automatykę."],
["p", "Rozliczenie prowadzimy w modelu ESCO: koszt wdrożenia i eksploatacji pokrywamy my, a naszym wynagrodzeniem jest udział w wartości oszczędności potwierdzonej pomiarem. Jeżeli oszczędności nie ma — nie ma faktury."],
["d", "Szczegóły", [
["p", "Granicę pomiaru ustalamy przed startem i zapisujemy w protokole pomiarowym: rozliczeniu podlega wyłącznie energia objęta wskazanym licznikiem. Media mierzone osobno — na przykład ciepła woda użytkowa — nie wchodzą ani do okresu bazowego, ani do rozliczenia."],
["p", "Jeżeli równolegle rozważana jest inna technologia (np. fizyczne uzdatnianie wody), oceniamy ją jako odrębny krok z własną bazą. Efekty nie są sumowane w jednym wskaźniku, żeby każdy z nich dało się obronić osobno."]
]]
]},
{h: "Symulacja przed startem — i dlaczego wynik podajemy dopiero po okresie", b: [
["p", "Zanim cokolwiek podpiszemy, przygotowujemy <strong>symulację oszczędności opartą na Państwa rzeczywistych kosztach</strong> — na fakturach za nośnik energii i odczytach licznika z ostatnich sezonów. Symulacja pokazuje spodziewany rząd wielkości: ile energii może zostać w budynku, ile to znaczy w pieniądzu przy Państwa cenie i jak dzieli się ten efekt między strony."],
["cw", ["<strong>Symulacja jest prognozą, nie obietnicą.</strong> Nie podajemy z góry gwarantowanego procentu, bo oszczędność zależy od czynników, nad którymi nikt nie panuje w całości: przebiegu pogody w konkretnym sezonie, sposobu użytkowania obiektu, zmian obłożenia i godzin pracy, stanu instalacji, a także decyzji podejmowanych na miejscu. Twardą liczbę podajemy dopiero za zamknięty okres — odmierzoną z licznika i skorygowaną o wpływ pogody.", "Ryzyko rozjazdu prognozy z wynikiem obciąża nas, nie Państwa: fakturujemy wyłącznie to, co zostało zmierzone. Jeżeli oszczędności nie ma, nie ma faktury."]],
["d", "Szczegóły · zakres symulacji", [
["h3", "Co wchodzi do symulacji"],
["ul", ["zużycie i koszty z ostatnich sezonów — z faktur albo z odczytów licznika,", "charakterystyka obiektu wynikająca z tych danych, sprowadzona do warunków normowych (TYM),", "cena nośnika energii, którą płacą Państwo dziś, oraz przewidziany w umowie tryb jej aktualizacji,", "uzgodniony podział efektu między strony."]],
["h3", "Czego symulacja nie obejmuje"],
["ul", ["przebiegu pogody w nadchodzącym sezonie — z definicji nieznanego,", "zmian po Państwa stronie: obłożenia, godzin pracy, nowych najemców, prac budowlanych,", "zmian ceny nośnika energii poza tym, co zapisano w umowie,", "awarii i przestojów instalacji."]],
["p", "Dlatego symulację podajemy jako przedział, a nie jako pojedynczą liczbę, i wskazujemy, przy jakich założeniach powstała. Nie jest ona podstawą rozliczenia — służy podjęciu decyzji."],
["c", ["<strong>Prognozę weryfikujemy po fakcie.</strong> Po pierwszym zamkniętym okresie zestawiamy symulację z wynikiem pomiaru i pokazujemy odchylenie razem z jego przyczyną. To ten sam materiał, na którym korygujemy prognozę na kolejny sezon — i po którym widać, czy nasze założenia były rzetelne."]]
]]
]},
{h: "Skąd bierze się liczba, za którą płacą Państwo", b: [
["p", "Nie porównujemy zużyć rok do roku, bo taki wynik mówi przede wszystkim o tym, która zima była łagodniejsza. Każdy okres — bazowy i rozliczeniowy — przeliczamy na te same, normowe warunki pogodowe, czyli na <strong>Typowy Rok Meteorologiczny (TYM)</strong>. Dopiero tak sprowadzone do wspólnego mianownika wielkości są porównywalne."],
["ps", "Skutek jest jednoznaczny: łagodniejsza zima nie może zostać wykazana jako oszczędność, a zima ostrzejsza od normy nie obciąża wyniku technologii."],
["d", "Szczegóły · oznaczenia i wzory", [
["t", [["Symbol", "Znaczenie"],
["z", "liczba dni z aktywnym ogrzewaniem w danym miesiącu"],
["T<sub>i</sub>", "temperatura wewnętrzna przyjęta do wyliczeń — parametr umowny, ten sam dla bazy i dla każdego okresu rozliczeniowego"],
["t", "średnia temperatura zewnętrzna w dniach grzewczych danego miesiąca (dane rzeczywiste)"],
["t<sub>TYM</sub>", "temperatura normowa tego samego miesiąca według Typowego Roku Meteorologicznego"],
["SD", "stopniodni — miara zapotrzebowania na ciepło wynikającego z pogody [°C·dni]"],
["Q · Q<sub>s</sub>", "zużycie zmierzone i zużycie skorygowane do warunków normowych, wyrażone w <strong>jednostce rozliczeniowej [j.r.]</strong> — tej, w której mierzy licznik i wystawia fakturę dostawca: kWh, MWh lub GJ dla ciepła sieciowego, m<sup>3</sup> dla gazu"],
["φ", "współczynnik korekcyjny okresu"],
["E", "wskaźnik jednostkowy — zużycie na jeden standardowy stopniodzień [j.r./SD]"],
["ΔQ", "odmierzona oszczędność, w tej samej jednostce rozliczeniowej co Q"]]],
["f", [["Stopniodni", "SD = z × (T<sub>i</sub> − t)&nbsp;&nbsp;[°C·dni]"],
["Współczynnik korekcyjny", "φ = ΣSD<sub>standardowe</sub> / ΣSD<sub>rzeczywiste</sub>"],
["Zużycie skorygowane", "Q<sub>s</sub> = Q × φ"],
["Wskaźnik jednostkowy", "E = Q<sub>s</sub> / ΣSD<sub>standardowe</sub>&nbsp;&nbsp;[j.r./SD]"],
["Projekcja bazy", "Q<sub>baza→rozl.</sub> = E<sub>bazy</sub> × ΣSD<sub>standardowe okresu rozliczeniowego</sub>"],
["Oszczędność", "ΔQ = Q<sub>baza→rozl.</sub> − Q<sub>s, rozl.</sub>"]]],
["fine", "Stopniodni standardowe liczymy dokładnie tak samo jak rzeczywiste — z tą samą liczbą dni grzewczych <em>z</em> i tą samą temperaturą T<sub>i</sub> — podstawiając wyłącznie temperatury Typowego Roku Meteorologicznego w miejsce rzeczywistych. Różnica między jednymi a drugimi to więc czysty efekt pogody, nic poza tym."]
]]
]},
{h: "Skąd pochodzi każda wielkość", b: [
["p", "Każda liczba wchodząca do rozliczenia ma nazwane źródło i moment ustalenia. To warunek odtwarzalności — raport musi dać się przeliczyć niezależnie, bez pytania nas o cokolwiek."],
["d", "Szczegóły · źródła danych", [
["t3", [["Wielkość", "Źródło", "Kiedy jest ustalana"],
["Temperatury rzeczywiste <span class=\"sym\">t</span>", "stacja meteorologiczna w lokalizacji obiektu; w raporcie podajemy nazwę stacji i datę pobrania danych", "dla każdego okresu osobno"],
["Normały <span class=\"sym\">t<sub>TYM</sub></span>", "wieloletni szereg pomiarowy dla lokalizacji; w raporcie podajemy zakres lat, z których policzono normały", "raz — utrwalone w protokole TYM"],
["Dni grzewcze <span class=\"sym\">z</span>", "kalendarz sezonu grzewczego obiektu; ta sama wartość wchodzi do stopniodni rzeczywistych i standardowych", "dla każdego miesiąca okresu"],
["Temperatura <span class=\"sym\">T<sub>i</sub></span>", "parametr umowny zapisany w protokole pomiarowym", "raz — identyczna dla bazy i wszystkich okresów"],
["Zużycie <span class=\"sym\">Q</span>", "fakturacyjny licznik energii albo faktury od dostawcy, zawsze z podaniem granicy pomiaru", "dla każdego okresu"],
["Cena nośnika energii", "protokół pomiarowy; wskazujemy, czy jest to cena stała, czy rzeczywista cena fakturowa", "raz, z trybem aktualizacji zapisanym w umowie"],
["Udział stron", "umowa", "raz"]]]
]],
["psfine", "Po włączeniu szczegółów zobaczą Państwo pełne zestawienie: co pochodzi ze stacji meteorologicznej, co z licznika, a co z protokołu pomiarowego."]
]},
{h: "Okres bazowy — punkt odniesienia", b: [
["p", "Bazę wyznaczamy z trzech pełnych sezonów grzewczych poprzedzających wdrożenie. Bazą nie jest jednak zużycie wyrażone w jednostkach rozliczeniowych, lecz <strong>wskaźnik jednostkowy E</strong> — zużycie przypadające na jeden standardowy stopniodzień. Wielkość ta nie zależy ani od pogody, ani od długości okresu."],
["d", "Szczegóły · jak powstaje baza", [
["ul", ["Każdy z trzech sezonów przeliczamy osobno na TYM i wyznaczamy dla niego wskaźnik E.", "Bazą jest średnia arytmetyczna wskaźników z tych sezonów.", "Sprawdzamy rozrzut wskaźników wokół średniej — to test jakości bazy."]],
["p", "Mały rozrzut oznacza, że obiekt w tych latach nie zmieniał się eksploatacyjnie i baza jest spójna. Wyraźnie większy jest sygnałem, że w szeregu zaszła zmiana — najemca, powierzchnia, godziny pracy — i wtedy bazę korygujemy albo skracamy szereg. Bazy nie przyjmujemy w ciemno."]
]]
]},
{h: "Przebieg rozliczenia okresu", b: [
["steps", [["Stopniodni okresu", "Wyznaczamy stopniodni rzeczywiste i standardowe. Pytanie: jaka naprawdę była pogoda, a jaka byłaby przy normie?"],
["Korekta zużycia", "Obliczamy współczynnik φ i sprowadzamy zmierzone zużycie do warunków normowych."],
["Projekcja bazy", "Rzutujemy bazę na ten sam okres: ile obiekt zużyłby teraz, gdyby zachował charakterystykę sprzed wdrożenia?"],
["Oszczędność", "Różnica obu wielkości to energia faktycznie zaoszczędzona."],
["Kontrola drugą drogą", "Ten sam wynik musi wyjść przez spadek wskaźnika E."]]],
["d", "Szczegóły · dlaczego akurat tak", [
["p", "<strong>Krok 3</strong> rozwiązuje przy okazji problem różnej długości okresów. Baza jest rzutowana dokładnie na ten okres, który rozliczamy, a nie porównywana z całym rokiem — dzięki temu można rozliczyć sezon skrócony, przesunięty albo przerwany bez zniekształcenia wyniku."],
["p", "<strong>Krok 5</strong> jest bezwarunkowy. Jeżeli obie drogi nie dają tego samego wyniku, w raporcie jest błąd i raport nie zostaje wydany. To wewnętrzna kontrola po naszej stronie, nie formalność."],
["c", ["<strong>Korekta na TYM działa na Państwa korzyść.</strong> Porównanie samych zmierzonych zużyć, bez uwzględnienia pogody, w sezonie łagodniejszym od normy pokazuje oszczędność wyższą niż rzeczywista — przypisuje technologii to, co zrobiła pogoda. My ten efekt z wyniku usuwamy, więc fakturujemy liczbę niższą od tej, którą dałoby proste porównanie."]]
]]
]},
{h: "Druga, niezależna metoda kontrolna — regresja liniowa", b: [
["p", "Korekta na TYM porównuje <strong>okresy</strong> sprowadzone do wspólnej pogody. Regresja robi to samo na poziomie <strong>pojedynczych odczytów</strong>: opisuje obiekt równaniem, w którym temperatura zewnętrzna jest zmienną objaśniającą. To dwa niezależne od siebie dowody na ten sam efekt — i oczekujemy, że powiedzą to samo."],
["ps", "Metoda pokazuje też, jak zmienia się sposób sterowania: o ile niżej pracuje temperatura zasilania przy tej samej pogodzie."],
["d", "Szczegóły · model i dane", [
["h3", "Dane wejściowe"],
["p", "Rejestr z licznika i sterownika w stałym kroku czasowym. Do modelu wchodzą: znacznik czasu odczytu, temperatura zewnętrzna, temperatura zasilania i powrotu, przepływ oraz moc i zużycie energii. Nie agregujemy ich do miesięcy — pracujemy na surowych odczytach, bo dopiero one pokazują, jak obiekt zachowuje się w konkretnych warunkach."],
["h3", "Model"],
["f", [["Prosta regresji", "y = a · x + b"],
["Różnica trybów", "Δ(x) = y<sub>pogodowy</sub>(x) − y<sub>WaterAI</sub>(x)"],
["Redukcja", "R(x) = Δ(x) / y<sub>pogodowy</sub>(x) × 100&nbsp;&nbsp;[%]"]]],
["t", [["Symbol", "Znaczenie"],
["x", "temperatura zewnętrzna w chwili odczytu [°C]"],
["y", "wielkość badana: temperatura zasilania [°C] albo moc / zużycie energii"],
["a", "nachylenie prostej — wrażliwość obiektu na pogodę, czyli o ile rośnie <em>y</em> na każdy stopień spadku temperatury zewnętrznej"],
["b", "wyraz wolny — poziom przy 0 °C, czyli składowa niezależna od pogody: nastawy, bezwładność, straty obiegu"]]],
["p", "Współczynniki <em>a</em> i <em>b</em> wyznaczamy metodą najmniejszych kwadratów, osobno dla dwóch zbiorów odczytów: pracy w <strong>trybie pogodowym</strong> (dotychczasowa krzywa grzewcza) i pracy w <strong>trybie prediktywnym WaterAI</strong>. Powstają dwie proste, które porównujemy przy tej samej temperaturze zewnętrznej."],
["chart", {alt: "Wykres schematyczny: dwie proste regresji — tryb pogodowy powyżej, tryb WaterAI poniżej, różnica między nimi to efekt sterowania", base: "tryb pogodowy", ai: "tryb WaterAI", delta: "Δ(x) — efekt sterowania", xl: "niższa temperatura zewnętrzna", xr: "wyższa →", cap: "Wykres schematyczny. Odstęp między prostymi nie jest stały — dlatego wynik podajemy jako funkcję temperatury zewnętrznej, a nie jedną liczbę."}],
["h3", "Co liczymy równolegle"],
["ul", ["<strong>Temperatura zasilania</strong> — dowód, że zmienił się sposób sterowania: przy tej samej pogodzie obiekt pracuje na niższym parametrze.", "<strong>Moc i zużycie energii</strong> — dowód, że zmiana sterowania przełożyła się na energię."]],
["p", "Obie wielkości muszą być spójne. Spadek temperatury zasilania bez odpowiadającego mu spadku poboru energii jest sygnałem ostrzegawczym — oznacza zwykle wydłużony czas pracy albo przesunięcie poboru, a nie oszczędność."],
["h3", "Warunki poprawności porównania"],
["ul", ["ten sam zakres temperatur zewnętrznych dla obu zbiorów — proste porównujemy wyłącznie tam, gdzie oba mają dane,", "wykluczenie odczytów spoza sezonu grzewczego oraz okresów postoju i prac serwisowych,", "wykluczenie stanów przejściowych po rozruchu, które zaburzają zależność,", "porównywalna liczba punktów w obu zbiorach,", "kontrola dopasowania (współczynnik determinacji) i rozrzutu reszt — słabe dopasowanie oznacza, że na obiekt działa czynnik spoza modelu i wynik wymaga wyjaśnienia,", "identyczna granica pomiaru i ten sam krok czasowy dla obu trybów."]],
["c", ["<strong>Regresja nie jest podstawą fakturowania.</strong> Fakturujemy wyłącznie metodą TYM, z jednostek odczytanych z licznika rozliczeniowego. Regresja służy do weryfikacji tego wyniku, do diagnostyki obiektu i do sprawdzania, czy efekt utrzymuje się w czasie. Jeżeli obie metody się rozchodzą, szukamy przyczyny przed wydaniem raportu — a nie wybieramy korzystniejszej liczby."]]
]]
]},
{h: "Rozliczenie i faktura", b: [
["ul", ["Wartość oszczędności to odmierzona ilość jednostek rozliczeniowych pomnożona przez uzgodnioną cenę nośnika energii.", "Nasze wynagrodzenie to ustalony w umowie udział w tej wartości — i jest jedyną pozycją faktury.", "Faktura powołuje się na numer raportu i na okres rozliczeniowy, którego dotyczy.", "Rozliczamy wyłącznie zamknięte okresy; prognozy roczne służą planowaniu budżetu i nigdy nie są podstawą fakturowania."]],
["d", "Szczegóły · identyfikowalność raportu", [
["p", "W każdym raporcie rozliczeniowym nazwane są wprost:"],
["ul", ["stacja meteorologiczna i źródło temperatur wraz z datą pobrania danych,", "zakres lat, z których policzono normały TYM,", "numer protokołu TYM i numer analizy — każdy raport da się powiązać ze swoim materiałem źródłowym,", "źródło danych o zużyciu, czyli konkretny licznik lub faktury, wraz z granicą pomiaru,", "temperatura T<sub>i</sub> przyjęta dla bazy i dla okresu rozliczeniowego,", "cena nośnika energii i uzgodniony udział, ze wskazaniem, czy cena jest stała, czy fakturowa."]],
["fine", "Wszystkie kwoty w raporcie są netto; VAT nalicza się według stawki obowiązującej w dniu wystawienia faktury."]
]]
]},
{h: "Kiedy koryguje się bazę", b: [
["cw", ["<strong>Bazy nie przepisujemy osiągniętą oszczędnością.</strong> Osiągnięty wynik nie staje się nowym punktem odniesienia — inaczej efekt technologii z każdym rokiem znikałby z rozliczenia."]],
["p", "Bazę korygujemy wyłącznie przy zmianach, które nie mają związku z technologią, a wpływają na zużycie."],
["d", "Szczegóły · katalog zmian", [
["ul", ["zmiana sposobu użytkowania obiektu lub godzin pracy,", "istotna zmiana obłożenia albo zmiana najemców,", "zmiana powierzchni ogrzewanej,", "ingerencja w przegrody budynku,", "wymiana lub dołożenie źródła energii,", "nowa technologia z własnym poborem energii,", "zmiana uzgodnionej temperatury wewnętrznej T<sub>i</sub>."]],
["fine", "Korekta jest dwukierunkowa — także na naszą niekorzyść. Jeżeli zmiana w obiekcie sama z siebie obniża zużycie, baza zostaje o ten efekt pomniejszona i nie jest rozliczana jako oszczędność technologii."]
]]
]},
{h: "Jak zaczynamy", b: [
["steps", [["Dane wejściowe", "Faktury za nośnik energii lub odczyty licznika z ostatnich sezonów — na tym etapie nic więcej nie jest potrzebne."],
["Symulacja oszczędności", "Na Państwa rzeczywistych kosztach pokazujemy spodziewany efekt i podział korzyści. To prognoza, nie zobowiązanie."],
["Analiza i protokół pomiarowy", "Wyznaczamy bazę, ustalamy granicę pomiaru, T<sub>i</sub>, cenę nośnika energii i udział stron."],
["Montaż i przełączenie", "Instalacja bez przerywania pracy obiektu, okres pracy w trybie dotychczasowym, następnie przejście w tryb prediktywny. Od tej daty biegnie okres rozliczeniowy."],
["Raport i rozliczenie", "Po zamknięciu okresu wydajemy raport z pełnym wyliczeniem; faktura odwołuje się do jego numeru."]]]
]}
]
};
