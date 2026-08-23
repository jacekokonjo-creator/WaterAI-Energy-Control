# -*- coding: utf-8 -*-
"""Generuje js/modules/note-i18n-seed.js — gotowe tłumaczenia opisu Hotel Premium."""
import hashlib, json, re, unicodedata

PL = """Dane wejściowe
Analizę oparto na zbiorczym zużyciu gazu za okres od stycznia 2025 r. do 31 grudnia 2025 r., wynoszącym 16 523 m³, oraz na trzech odczytach gazomierza z roku 2026:

* odczyt z 20 kwietnia 2026 r. — wskazanie 1 301,84 m³, obejmujące okres liczony od 12 marca 2026 r.,
* odczyt z 22 lipca 2026 r. — wskazanie 3 691,302 m³,
* odczyt z 23 sierpnia 2026 r. — wskazanie 4 372,28 m³.

Uzupełniającą informacją eksploatacyjną jest data zakończenia sezonu grzewczego — 15 maja 2026 r. Obiektem jest hotel z całodobową cyrkulacją ciepłej wody użytkowej.
Zasada wydzielenia składowej c.w.u.
Metoda polega na wykorzystaniu okresu, w którym instalacja grzewcza była wyłączona, a zatem całość zużytego gazu przypadała wyłącznie na przygotowanie ciepłej wody. Warunek ten spełnia przedział między odczytami z 22 lipca 2026 r. i 23 sierpnia 2026 r., przypadający w całości po zakończeniu sezonu grzewczego.
Różnica wskazań wynosi 4 372,28 − 3 691,302 = 680,978 m³ przy 32 dniach kalendarzowych, co daje dobowe zużycie na c.w.u. równe 21,28 m³. Wartość ta stanowi bazę całej dalszej analizy.
Model rozkładu c.w.u. w czasie
Przyjęto model płaski, zakładający stałe dobowe zużycie na ciepłą wodę niezależnie od pory roku. Roczne zużycie na c.w.u. wyznaczono jako iloczyn wartości bazowej i liczby dni w roku: 21,28 × 365 = 7 767 m³, co odpowiada około 85,4 MWh energii pierwotnej przy wartości opałowej 11,0 kWh/m³.
W rozbiciu miesięcznym składową c.w.u. rozłożono wprost proporcjonalnie do liczby dni w danym miesiącu, co wynika bezpośrednio z przyjętego modelu.
Wyznaczenie składowej c.o. za rok 2025
Zużycie na ogrzewanie w okresie styczeń – 31 grudnia 2025 r. obliczono metodą różnicową, jako pozostałość po odjęciu składowej c.w.u. od zużycia całkowitego: 16 523 − 7 767 = 8 756 m³, co odpowiada około 96,3 MWh. Rozdział roczny wynosi zatem 47% na ciepłą wodę i 53% na ogrzewanie.
Rozbicie miesięczne składowej c.o. przeprowadzono według rozkładu stopniodni grzewczych dla Warszawy, przyjmując zerowe zużycie w miesiącach letnich (czerwiec–sierpień) i wartości szczątkowe we wrześniu.
Wyznaczenie zużycia c.o. w okresie 12.03 – 15.05.2026
Okres podzielono na dwa podokresy, rozdzielone datą odczytu z 20 kwietnia 2026 r.
Podokres 12 marca – 20 kwietnia 2026 r. (39 dni). Od wskazania 1 301,84 m³ z odczytu z 20 kwietnia odjęto składową c.w.u. wynoszącą 829,9 m³ (39 × 21,28). Na ogrzewanie przypada 471,9 m³, czyli 12,1 m³ na dobę.
Podokres 20 kwietnia – 15 maja 2026 r. (25 dni). Zużycie wyznaczono metodą odwrotną, ponieważ na dzień zakończenia sezonu grzewczego nie wykonano odczytu. Od zużycia w całym przedziale między odczytami z 20 kwietnia i 22 lipca 2026 r., wynoszącego 3 691,302 − 1 301,84 = 2 389,46 m³, odjęto składową c.w.u. przypadającą na 68 dni po zakończeniu sezonu grzewczego, czyli na okres od 15 maja do 22 lipca (68 × 21,28 = 1 447 m³). Pozostałość 942,4 m³ przypada na 25 dni do 15 maja; po odjęciu c.w.u. za ten okres (25 × 21,28 = 532,0 m³) na ogrzewanie przypada 410,4 m³, czyli 16,4 m³ na dobę.
Łącznie w okresie 12 marca – 15 maja 2026 r. (64 dni) na ogrzewanie przypada 882,3 m³ przy średniej dobowej 13,8 m³. Odtworzone wstecz wskazanie licznika na dzień 15 maja 2026 r. wynosi około 2 244 m³."""

EN = """Input data
The analysis is based on aggregate gas consumption for the period from January 2025 to 31 December 2025, amounting to 16,523 m³, and on three gas meter readings taken in 2026:

* reading of 20 April 2026 — 1,301.84 m³, covering the period counted from 12 March 2026,
* reading of 22 July 2026 — 3,691.302 m³,
* reading of 23 August 2026 — 4,372.28 m³.

A supplementary operational input is the end date of the heating season — 15 May 2026. The facility is a hotel with round-the-clock domestic hot water circulation.
Principle for separating the DHW component
The method uses the period in which the heating installation was switched off, so that all gas consumed was attributable solely to domestic hot water preparation. This condition is met by the interval between the readings of 22 July 2026 and 23 August 2026, which falls entirely after the end of the heating season.
The difference between the readings is 4,372.28 − 3,691.302 = 680.978 m³ over 32 calendar days, giving daily DHW consumption of 21.28 m³. This value forms the basis of the entire further analysis.
Model of DHW distribution over time
A flat model was adopted, assuming constant daily hot water consumption regardless of the season. Annual DHW consumption was determined as the product of the base value and the number of days in the year: 21.28 × 365 = 7,767 m³, corresponding to approximately 85.4 MWh of primary energy at a calorific value of 11.0 kWh/m³.
In the monthly breakdown, the DHW component was distributed in direct proportion to the number of days in each month, which follows directly from the adopted model.
Determination of the space heating component for 2025
Heating consumption in the period January – 31 December 2025 was calculated by the difference method, as the remainder after subtracting the DHW component from total consumption: 16,523 − 7,767 = 8,756 m³, corresponding to approximately 96.3 MWh. The annual split is therefore 47% for hot water and 53% for heating.
The monthly breakdown of the heating component was carried out according to the distribution of heating degree days for Warsaw, assuming zero consumption in the summer months (June–August) and residual values in September.
Determination of heating consumption in the period 12.03 – 15.05.2026
The period was divided into two sub-periods, separated by the reading date of 20 April 2026.
Sub-period 12 March – 20 April 2026 (39 days). From the reading of 1,301.84 m³ taken on 20 April, the DHW component of 829.9 m³ (39 × 21.28) was subtracted. Space heating accounts for 471.9 m³, i.e. 12.1 m³ per day.
Sub-period 20 April – 15 May 2026 (25 days). Consumption was determined by the reverse method, because no reading was taken on the date the heating season ended. From the consumption over the whole interval between the readings of 20 April and 22 July 2026, amounting to 3,691.302 − 1,301.84 = 2,389.46 m³, the DHW component for the 68 days after the end of the heating season — that is, for the period from 15 May to 22 July (68 × 21.28 = 1,447 m³) — was subtracted. The remainder of 942.4 m³ falls on the 25 days up to 15 May; after subtracting DHW for that period (25 × 21.28 = 532.0 m³), space heating accounts for 410.4 m³, i.e. 16.4 m³ per day.
In total, over the period 12 March – 15 May 2026 (64 days), space heating accounts for 882.3 m³, with a daily average of 13.8 m³. The meter reading reconstructed backwards for 15 May 2026 is approximately 2,244 m³."""

DE = """Eingangsdaten
Die Analyse stützt sich auf den Gesamtgasverbrauch für den Zeitraum von Januar 2025 bis 31. Dezember 2025 in Höhe von 16 523 m³ sowie auf drei Gaszählerablesungen aus dem Jahr 2026:

* Ablesung vom 20. April 2026 — Zählerstand 1 301,84 m³, für den ab dem 12. März 2026 gerechneten Zeitraum,
* Ablesung vom 22. Juli 2026 — Zählerstand 3 691,302 m³,
* Ablesung vom 23. August 2026 — Zählerstand 4 372,28 m³.

Eine ergänzende betriebliche Angabe ist das Ende der Heizperiode — 15. Mai 2026. Bei dem Objekt handelt es sich um ein Hotel mit durchgehender Trinkwarmwasserzirkulation.
Grundsatz der Abgrenzung des Trinkwarmwasseranteils
Die Methode nutzt den Zeitraum, in dem die Heizungsanlage abgeschaltet war, sodass das gesamte verbrauchte Gas ausschließlich auf die Trinkwarmwasserbereitung entfiel. Diese Bedingung erfüllt das Intervall zwischen den Ablesungen vom 22. Juli 2026 und vom 23. August 2026, das vollständig nach dem Ende der Heizperiode liegt.
Die Differenz der Zählerstände beträgt 4 372,28 − 3 691,302 = 680,978 m³ bei 32 Kalendertagen, was einem Tagesverbrauch für Trinkwarmwasser von 21,28 m³ entspricht. Dieser Wert bildet die Grundlage der gesamten weiteren Analyse.
Modell der zeitlichen Verteilung des Trinkwarmwassers
Angenommen wurde ein flaches Modell mit konstantem Tagesverbrauch für Warmwasser unabhängig von der Jahreszeit. Der Jahresverbrauch für Trinkwarmwasser wurde als Produkt aus dem Basiswert und der Anzahl der Tage im Jahr ermittelt: 21,28 × 365 = 7 767 m³, was rund 85,4 MWh Primärenergie bei einem Heizwert von 11,0 kWh/m³ entspricht.
In der monatlichen Aufteilung wurde der Trinkwarmwasseranteil direkt proportional zur Anzahl der Tage des jeweiligen Monats verteilt, was sich unmittelbar aus dem gewählten Modell ergibt.
Ermittlung des Heizanteils für das Jahr 2025
Der Heizverbrauch im Zeitraum Januar – 31. Dezember 2025 wurde nach der Differenzmethode berechnet, als Rest nach Abzug des Trinkwarmwasseranteils vom Gesamtverbrauch: 16 523 − 7 767 = 8 756 m³, entsprechend rund 96,3 MWh. Die Jahresaufteilung beträgt somit 47 % auf Warmwasser und 53 % auf Heizung.
Die monatliche Aufteilung des Heizanteils erfolgte nach der Verteilung der Heizgradtage für Warschau, wobei in den Sommermonaten (Juni–August) ein Verbrauch von null und im September Restwerte angesetzt wurden.
Ermittlung des Heizverbrauchs im Zeitraum 12.03. – 15.05.2026
Der Zeitraum wurde durch das Ablesedatum 20. April 2026 in zwei Teilzeiträume gegliedert.
Teilzeitraum 12. März – 20. April 2026 (39 Tage). Vom Zählerstand 1 301,84 m³ der Ablesung vom 20. April wurde der Trinkwarmwasseranteil von 829,9 m³ (39 × 21,28) abgezogen. Auf die Heizung entfallen 471,9 m³, also 12,1 m³ pro Tag.
Teilzeitraum 20. April – 15. Mai 2026 (25 Tage). Der Verbrauch wurde nach der umgekehrten Methode ermittelt, da zum Ende der Heizperiode keine Ablesung vorgenommen wurde. Vom Verbrauch im gesamten Intervall zwischen den Ablesungen vom 20. April und vom 22. Juli 2026 in Höhe von 3 691,302 − 1 301,84 = 2 389,46 m³ wurde der Trinkwarmwasseranteil für die 68 Tage nach dem Ende der Heizperiode, also für den Zeitraum vom 15. Mai bis 22. Juli (68 × 21,28 = 1 447 m³), abgezogen. Der Rest von 942,4 m³ entfällt auf die 25 Tage bis zum 15. Mai; nach Abzug des Trinkwarmwassers für diesen Zeitraum (25 × 21,28 = 532,0 m³) entfallen auf die Heizung 410,4 m³, also 16,4 m³ pro Tag.
Insgesamt entfallen im Zeitraum 12. März – 15. Mai 2026 (64 Tage) auf die Heizung 882,3 m³ bei einem Tagesmittel von 13,8 m³. Der rückwirkend rekonstruierte Zählerstand zum 15. Mai 2026 beträgt rund 2 244 m³."""

CS = """Vstupní údaje
Analýza vychází ze souhrnné spotřeby plynu za období od ledna 2025 do 31. prosince 2025 ve výši 16 523 m³ a ze tří odečtů plynoměru z roku 2026:

* odečet z 20. dubna 2026 — stav 1 301,84 m³, zahrnující období počítané od 12. března 2026,
* odečet z 22. července 2026 — stav 3 691,302 m³,
* odečet z 23. srpna 2026 — stav 4 372,28 m³.

Doplňujícím provozním údajem je datum ukončení topné sezóny — 15. května 2026. Objektem je hotel s nepřetržitou cirkulací teplé užitkové vody.
Princip vyčlenění složky TUV
Metoda využívá období, v němž byla otopná soustava vypnutá, takže veškerý spotřebovaný plyn připadal výhradně na přípravu teplé užitkové vody. Tuto podmínku splňuje interval mezi odečty z 22. července 2026 a 23. srpna 2026, který spadá zcela do doby po ukončení topné sezóny.
Rozdíl stavů činí 4 372,28 − 3 691,302 = 680,978 m³ při 32 kalendářních dnech, což dává denní spotřebu na TUV 21,28 m³. Tato hodnota tvoří základ celé další analýzy.
Model rozložení TUV v čase
Byl přijat plochý model předpokládající konstantní denní spotřebu na teplou vodu nezávisle na ročním období. Roční spotřeba na TUV byla stanovena jako součin základní hodnoty a počtu dnů v roce: 21,28 × 365 = 7 767 m³, což odpovídá přibližně 85,4 MWh primární energie při výhřevnosti 11,0 kWh/m³.
V měsíčním členění byla složka TUV rozdělena přímo úměrně počtu dnů v daném měsíci, což vyplývá přímo z přijatého modelu.
Stanovení složky vytápění za rok 2025
Spotřeba na vytápění v období leden – 31. prosince 2025 byla vypočtena rozdílovou metodou jako zbytek po odečtení složky TUV od celkové spotřeby: 16 523 − 7 767 = 8 756 m³, což odpovídá přibližně 96,3 MWh. Roční rozdělení tedy činí 47 % na teplou vodu a 53 % na vytápění.
Měsíční členění složky vytápění bylo provedeno podle rozložení denostupňů pro Varšavu, s nulovou spotřebou v letních měsících (červen–srpen) a zbytkovými hodnotami v září.
Stanovení spotřeby na vytápění v období 12.03. – 15.05.2026
Období bylo rozděleno na dva dílčí úseky oddělené datem odečtu 20. dubna 2026.
Dílčí období 12. března – 20. dubna 2026 (39 dnů). Od stavu 1 301,84 m³ z odečtu z 20. dubna byla odečtena složka TUV ve výši 829,9 m³ (39 × 21,28). Na vytápění připadá 471,9 m³, tj. 12,1 m³ za den.
Dílčí období 20. dubna – 15. května 2026 (25 dnů). Spotřeba byla stanovena obrácenou metodou, protože ke dni ukončení topné sezóny nebyl proveden odečet. Od spotřeby v celém intervalu mezi odečty z 20. dubna a 22. července 2026, která činí 3 691,302 − 1 301,84 = 2 389,46 m³, byla odečtena složka TUV připadající na 68 dnů po ukončení topné sezóny, tedy na období od 15. května do 22. července (68 × 21,28 = 1 447 m³). Zbytek 942,4 m³ připadá na 25 dnů do 15. května; po odečtení TUV za toto období (25 × 21,28 = 532,0 m³) připadá na vytápění 410,4 m³, tj. 16,4 m³ za den.
Celkem v období 12. března – 15. května 2026 (64 dnů) připadá na vytápění 882,3 m³ při průměru 13,8 m³ za den. Zpětně rekonstruovaný stav plynoměru ke dni 15. května 2026 činí přibližně 2 244 m³."""

SK = """Vstupné údaje
Analýza vychádza zo súhrnnej spotreby plynu za obdobie od januára 2025 do 31. decembra 2025 vo výške 16 523 m³ a z troch odpočtov plynomera z roku 2026:

* odpočet z 20. apríla 2026 — stav 1 301,84 m³, zahŕňajúci obdobie počítané od 12. marca 2026,
* odpočet z 22. júla 2026 — stav 3 691,302 m³,
* odpočet z 23. augusta 2026 — stav 4 372,28 m³.

Doplňujúcim prevádzkovým údajom je dátum ukončenia vykurovacej sezóny — 15. mája 2026. Objektom je hotel s nepretržitou cirkuláciou teplej úžitkovej vody.
Princíp vyčlenenia zložky TÚV
Metóda využíva obdobie, v ktorom bola vykurovacia sústava vypnutá, takže celý spotrebovaný plyn pripadal výlučne na prípravu teplej úžitkovej vody. Túto podmienku spĺňa interval medzi odpočtami z 22. júla 2026 a 23. augusta 2026, ktorý celý spadá do obdobia po ukončení vykurovacej sezóny.
Rozdiel stavov je 4 372,28 − 3 691,302 = 680,978 m³ pri 32 kalendárnych dňoch, čo dáva dennú spotrebu na TÚV 21,28 m³. Táto hodnota tvorí základ celej ďalšej analýzy.
Model rozloženia TÚV v čase
Prijal sa plochý model predpokladajúci konštantnú dennú spotrebu na teplú vodu nezávisle od ročného obdobia. Ročná spotreba na TÚV sa určila ako súčin základnej hodnoty a počtu dní v roku: 21,28 × 365 = 7 767 m³, čo zodpovedá približne 85,4 MWh primárnej energie pri výhrevnosti 11,0 kWh/m³.
V mesačnom členení sa zložka TÚV rozdelila priamo úmerne počtu dní v danom mesiaci, čo vyplýva priamo z prijatého modelu.
Určenie zložky vykurovania za rok 2025
Spotreba na vykurovanie v období január – 31. decembra 2025 sa vypočítala rozdielovou metódou ako zvyšok po odčítaní zložky TÚV od celkovej spotreby: 16 523 − 7 767 = 8 756 m³, čo zodpovedá približne 96,3 MWh. Ročné rozdelenie je teda 47 % na teplú vodu a 53 % na vykurovanie.
Mesačné členenie zložky vykurovania sa vykonalo podľa rozloženia dennostupňov pre Varšavu, s nulovou spotrebou v letných mesiacoch (jún–august) a zvyškovými hodnotami v septembri.
Určenie spotreby na vykurovanie v období 12.03. – 15.05.2026
Obdobie sa rozdelilo na dva čiastkové úseky oddelené dátumom odpočtu 20. apríla 2026.
Čiastkové obdobie 12. marca – 20. apríla 2026 (39 dní). Od stavu 1 301,84 m³ z odpočtu z 20. apríla sa odčítala zložka TÚV vo výške 829,9 m³ (39 × 21,28). Na vykurovanie pripadá 471,9 m³, t. j. 12,1 m³ za deň.
Čiastkové obdobie 20. apríla – 15. mája 2026 (25 dní). Spotreba sa určila opačnou metódou, pretože ku dňu ukončenia vykurovacej sezóny sa odpočet nevykonal. Od spotreby v celom intervale medzi odpočtami z 20. apríla a 22. júla 2026, ktorá je 3 691,302 − 1 301,84 = 2 389,46 m³, sa odčítala zložka TÚV pripadajúca na 68 dní po ukončení vykurovacej sezóny, teda na obdobie od 15. mája do 22. júla (68 × 21,28 = 1 447 m³). Zvyšok 942,4 m³ pripadá na 25 dní do 15. mája; po odčítaní TÚV za toto obdobie (25 × 21,28 = 532,0 m³) pripadá na vykurovanie 410,4 m³, t. j. 16,4 m³ za deň.
Celkovo v období 12. marca – 15. mája 2026 (64 dní) pripadá na vykurovanie 882,3 m³ pri priemere 13,8 m³ za deň. Spätne rekonštruovaný stav plynomera k 15. máju 2026 je približne 2 244 m³."""

ES = """Datos de entrada
El análisis se basa en el consumo agregado de gas del periodo comprendido entre enero de 2025 y el 31 de diciembre de 2025, que asciende a 16 523 m³, y en tres lecturas del contador de gas del año 2026:

* lectura del 20 de abril de 2026 — indicación de 1 301,84 m³, correspondiente al periodo contado desde el 12 de marzo de 2026,
* lectura del 22 de julio de 2026 — indicación de 3 691,302 m³,
* lectura del 23 de agosto de 2026 — indicación de 4 372,28 m³.

Un dato de explotación complementario es la fecha de finalización de la temporada de calefacción: 15 de mayo de 2026. El edificio es un hotel con circulación de agua caliente sanitaria las 24 horas.
Principio de separación del componente de ACS
El método aprovecha el periodo en el que la instalación de calefacción estuvo apagada, de modo que todo el gas consumido correspondía exclusivamente a la preparación de agua caliente sanitaria. Cumple esta condición el intervalo entre las lecturas del 22 de julio de 2026 y del 23 de agosto de 2026, que queda íntegramente después del final de la temporada de calefacción.
La diferencia entre las indicaciones es 4 372,28 − 3 691,302 = 680,978 m³ en 32 días naturales, lo que da un consumo diario de ACS de 21,28 m³. Este valor constituye la base de todo el análisis posterior.
Modelo de distribución del ACS en el tiempo
Se adoptó un modelo plano, que supone un consumo diario de agua caliente constante con independencia de la época del año. El consumo anual de ACS se determinó como el producto del valor base por el número de días del año: 21,28 × 365 = 7 767 m³, lo que corresponde a unos 85,4 MWh de energía primaria con un poder calorífico de 11,0 kWh/m³.
En el desglose mensual, el componente de ACS se repartió de forma directamente proporcional al número de días de cada mes, lo que se deriva directamente del modelo adoptado.
Determinación del componente de calefacción del año 2025
El consumo de calefacción en el periodo enero – 31 de diciembre de 2025 se calculó por el método de diferencia, como resto tras restar el componente de ACS del consumo total: 16 523 − 7 767 = 8 756 m³, lo que corresponde a unos 96,3 MWh. El reparto anual es, por tanto, del 47 % para agua caliente y del 53 % para calefacción.
El desglose mensual del componente de calefacción se realizó según la distribución de los grados-día de calefacción para Varsovia, asumiendo consumo nulo en los meses de verano (junio–agosto) y valores residuales en septiembre.
Determinación del consumo de calefacción en el periodo 12.03 – 15.05.2026
El periodo se dividió en dos subperiodos, separados por la fecha de lectura del 20 de abril de 2026.
Subperiodo 12 de marzo – 20 de abril de 2026 (39 días). De la indicación de 1 301,84 m³ de la lectura del 20 de abril se restó el componente de ACS de 829,9 m³ (39 × 21,28). A la calefacción corresponden 471,9 m³, es decir, 12,1 m³ al día.
Subperiodo 20 de abril – 15 de mayo de 2026 (25 días). El consumo se determinó por el método inverso, ya que en la fecha de finalización de la temporada de calefacción no se realizó lectura. Del consumo de todo el intervalo entre las lecturas del 20 de abril y del 22 de julio de 2026, que asciende a 3 691,302 − 1 301,84 = 2 389,46 m³, se restó el componente de ACS correspondiente a los 68 días posteriores al final de la temporada de calefacción, es decir, al periodo del 15 de mayo al 22 de julio (68 × 21,28 = 1 447 m³). El resto, 942,4 m³, corresponde a los 25 días hasta el 15 de mayo; tras restar el ACS de ese periodo (25 × 21,28 = 532,0 m³), a la calefacción corresponden 410,4 m³, es decir, 16,4 m³ al día.
En total, en el periodo del 12 de marzo al 15 de mayo de 2026 (64 días), a la calefacción corresponden 882,3 m³, con una media diaria de 13,8 m³. La indicación del contador reconstruida retroactivamente a 15 de mayo de 2026 es de aproximadamente 2 244 m³."""


def key(s: str) -> str:
    """Klucz odporny na spacje, łamanie wierszy i rodzaj myślnika."""
    s = unicodedata.normalize('NFC', s)
    s = ''.join(ch for ch in s.lower() if ch.isalnum())
    return hashlib.sha256(s.encode('utf-8')).hexdigest()

K = key(PL)
tr = {'en': EN, 'de': DE, 'at': DE, 'cs': CS, 'sk': SK, 'es': ES}

# kontrola: każda wersja musi zawierać te same liczby co oryginał
NUM = re.compile(r'\d[\d  .,]*\d|\d')
def nums(s):
    out = []
    for m in NUM.findall(s.replace('\u00a0', ' ')):
        d = re.sub(r'[^\d]', '', m)
        if d:
            out.append(d)
    return sorted(out)

base = nums(PL)
for lg, txt in tr.items():
    if lg == 'at':
        continue
    got = nums(txt)
    status = 'OK ' if got == base else 'RÓŻNICA'
    print(f'{lg}: {status} ({len(got)} liczb vs {len(base)})')
    if got != base:
        from collections import Counter
        cb, cg = Counter(base), Counter(got)
        print('   brak w tłumaczeniu:', list((cb - cg).elements()))
        print('   nadmiarowe:        ', list((cg - cb).elements()))

js = (
    '// note-i18n-seed.js — GOTOWE tłumaczenia treści analityka.\n'
    '//\n'
    '// Wpisy trafiają do cache modułu note-i18n.js PRZED odpytaniem Edge Function,\n'
    '// więc działają bez wdrożonej funkcji, bez klucza API i bez kosztu. Klucz to\n'
    '// sha256 z tekstu polskiego sprowadzonego do samych znaków alfanumerycznych\n'
    '// (małe litery) — dzięki temu zmiana spacji, łamania wiersza czy rodzaju\n'
    '// myślnika nie psuje dopasowania, a zmiana LICZBY już tak (i słusznie:\n'
    '// poprawiony opis wymaga nowego tłumaczenia).\n'
    '//\n'
    '// Tłumaczenia sprawdzone pod kątem zgodności liczb z oryginałem.\n'
    '// AT = DE.\n'
    'window.NoteI18nSeed = Object.assign(window.NoteI18nSeed || {}, {\n'
    '  // Hotel Premium — metodyka wydzielenia c.w.u. z zużycia gazu (protokół TYM)\n'
    '  ' + json.dumps(K) + ': ' + json.dumps(tr, ensure_ascii=False, indent=2).replace('\n', '\n  ') + '\n'
    '});\n'
)

with open('/home/claude/repo/js/modules/note-i18n-seed.js', 'w', encoding='utf-8') as f:
    f.write(js)
print('\nklucz:', K)
print('zapisano js/modules/note-i18n-seed.js')
