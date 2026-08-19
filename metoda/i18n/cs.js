window.I18N = window.I18N || {};
window.I18N["cs"] = {
label: "CZ", htmlLang: "cs",
title: "WaterAI Energy Control — měření a vyúčtování úspor energie",
desc: "Jak měříme a vyúčtováváme úspory energie: korekce na Typický meteorologický rok a kontrolní lineární regrese. Přihlášení do panelu Energy Control.",
eyebrow: "Energy Control · metoda měření a vyúčtování",
h1: "Úspora energie bez vlastní investice",
lede: "Platíte výhradně za energii, kterou se skutečně podaří ušetřit — odměřenou z měřidla, očištěnou o vliv počasí a potvrzenou druhou, nezávislou metodou. Před startem připravíme simulaci na základě vašich skutečných nákladů.",
switchIntro: "<strong>Chcete vědět přesně, jak počítáme?</strong> Zapnutím podrobností se na této stránce rozvine úplný popis metody: vzorce, zdroje dat, pořadí kroků vyúčtování a regresní model.",
toggleOff: "Podrobné informace",
toggleOn: "Skrýt podrobnosti",
cards: [
["Nulové vstupní náklady", "Žádná investice na vaší straně a žádný zásah do stávající regulace."],
["Platba z úspory", "Naší odměnou je dohodnutý podíl na hodnotě odměřené úspory."],
["Výsledek odolný vůči počasí", "Každé období se přepočítává na tytéž normové podmínky (TMR)."]
],
login: {
title: "Energy Control", sub: "Systém měření a vyúčtování úspor energie",
email: "Login / e-mail", emailPh: "např. admin@waterai.pl",
pass: "Heslo", passPh: "Zadejte heslo", submit: "Přihlásit se",
errEmpty: "Zadejte login a heslo.",
mock: "Maketa — připojte toto tlačítko k přihlašovací logice aplikace.",
powered: "Powered by WaterAI"
},
langLabel: "Jazyk",
aside: [
["Nemáte ještě účet?", "Účty zakládá administrátor. V panelu vidíte výsledky pro vaše objekty a vedle popisujeme metodu, ze které tyto výsledky vznikají."],
["Chcete vědět, kolik to může přinést u vás?", "Připravíme simulaci úspor na základě vašich skutečných nákladů — stačí faktury za energii nebo odečty měřidla z posledních sezon. Simulace je prognóza; vyúčtováváme výhradně to, co po skončení období ukáže měření."]
],
footer: ["Water AI · waterai.sk · info@waterai.sk", "Popis má informativní charakter; závazné podmínky určuje smlouva a měřicí protokol."],
closing: "Po skončení smluvního období zůstává celý efekt technologie vám.",
sections: [
{h: "Co nabízíme", b: [
["p", "Nasazujeme prediktivní řízení vytápění na stávající instalaci. Systém se učí chování budovy a její reakci na počasí a poté potřebu předjímá, místo aby reagoval se zpožděním. Neměníme zdroj tepla ani nezasahujeme do stávající automatiky."],
["p", "Vyúčtování vedeme v modelu ESCO: náklady na nasazení a provoz neseme my a naší odměnou je podíl na hodnotě úspory potvrzené měřením. Není-li úspora, není faktura."],
["d", "Podrobnosti", [
["p", "Hranici měření stanovíme před startem a zapíšeme do měřicího protokolu: vyúčtování podléhá výhradně energie, kterou zachycuje určené měřidlo. Média měřená samostatně — například teplá užitková voda — nevstupují ani do bázového období, ani do vyúčtování."],
["p", "Pokud se souběžně zvažuje jiná technologie (například fyzikální úprava vody), hodnotíme ji jako samostatný krok s vlastní bází. Efekty se nesčítají do jednoho ukazatele, aby se každý z nich dal obhájit zvlášť."]
]]
]},
{h: "Simulace před startem — a proč výsledek uvádíme až po skončení období", b: [
["p", "Než se cokoli podepíše, připravíme <strong>simulaci úspor založenou na vašich skutečných nákladech</strong> — na fakturách za energii a odečtech měřidla z posledních sezon. Simulace ukazuje očekávaný řád veličiny: kolik energie může v budově zůstat, co to znamená v penězích při vaší ceně a jak se tento efekt dělí mezi strany."],
["cw", ["<strong>Simulace je prognóza, nikoli slib.</strong> Neuvádíme předem garantované procento, protože úspora závisí na faktorech, které nikdo plně neovládá: na průběhu počasí v konkrétní sezoně, způsobu užívání objektu, změnách obsazenosti a provozních hodin, stavu instalace i na rozhodnutích činěných na místě. Tvrdé číslo uvádíme až za uzavřené období — odměřené z měřidla a očištěné o vliv počasí.", "Riziko, že se prognóza a výsledek rozejdou, neseme my, nikoli vy: fakturujeme výhradně to, co bylo změřeno. Není-li úspora, není faktura."]],
["d", "Podrobnosti · rozsah simulace", [
["h3", "Co do simulace vstupuje"],
["ul", ["spotřeba a náklady z posledních sezon — z faktur nebo z odečtů měřidla,", "charakteristika objektu vyplývající z těchto dat, převedená na normové podmínky (TMR),", "cena energie, kterou platíte dnes, a způsob její aktualizace předvídaný ve smlouvě,", "dohodnuté rozdělení efektu mezi strany."]],
["h3", "Co simulace nezahrnuje"],
["ul", ["průběh počasí v nadcházející sezoně — z definice neznámý,", "změny na vaší straně: obsazenost, provozní hodiny, nové nájemce, stavební práce,", "změny ceny energie nad rámec toho, co je zapsáno ve smlouvě,", "poruchy a odstávky instalace."]],
["p", "Proto simulaci uvádíme jako rozpětí, nikoli jako jediné číslo, a uvádíme, za jakých předpokladů vznikla. Není podkladem pro vyúčtování — slouží k rozhodnutí."],
["c", ["<strong>Prognózu ověřujeme zpětně.</strong> Po prvním uzavřeném období postavíme simulaci vedle výsledku měření a ukážeme odchylku i s její příčinou. Na témž podkladu korigujeme prognózu na další sezonu — a je z něj vidět, zda byly naše předpoklady poctivé."]]
]]
]},
{h: "Odkud se bere číslo, za které platíte", b: [
["p", "Neporovnáváme spotřeby rok od roku, protože takový výsledek vypovídá především o tom, která zima byla mírnější. Každé období — bázové i zúčtovací — přepočítáváme na tytéž normové povětrnostní podmínky, tedy na <strong>Typický meteorologický rok (TMR)</strong>. Teprve takto převedené na společného jmenovatele jsou veličiny srovnatelné."],
["ps", "Důsledek je jednoznačný: mírnější zima nemůže být vykázána jako úspora a zima ostřejší než norma nezatěžuje výsledek technologie."],
["d", "Podrobnosti · označení a vzorce", [
["t", [["Symbol", "Význam"],
["z", "počet dní s aktivním vytápěním v daném měsíci"],
["T<sub>i</sub>", "vnitřní teplota přijatá do výpočtu — smluvní parametr, tentýž pro bázi i pro každé zúčtovací období"],
["t", "průměrná venkovní teplota během vytápěcích dní daného měsíce (skutečná data)"],
["t<sub>TMR</sub>", "normová teplota téhož měsíce podle Typického meteorologického roku"],
["DS", "dennostupně — míra potřeby tepla vyplývající z počasí [°C·dny]"],
["Q · Q<sub>s</sub>", "změřená spotřeba a spotřeba korigovaná na normové podmínky, vyjádřená v <strong>zúčtovací jednotce [z.j.]</strong> — té, ve které měří měřidlo a fakturuje dodavatel: kWh, MWh nebo GJ u dálkového tepla, m<sup>3</sup> u plynu"],
["φ", "korekční koeficient období"],
["E", "jednotkový ukazatel — spotřeba na jeden normový dennostupeň [z.j./DS]"],
["ΔQ", "odměřená úspora, ve stejné zúčtovací jednotce jako Q"]]],
["f", [["Dennostupně", "DS = z × (T<sub>i</sub> − t)&nbsp;&nbsp;[°C·dny]"],
["Korekční koeficient", "φ = ΣDS<sub>normové</sub> / ΣDS<sub>skutečné</sub>"],
["Korigovaná spotřeba", "Q<sub>s</sub> = Q × φ"],
["Jednotkový ukazatel", "E = Q<sub>s</sub> / ΣDS<sub>normové</sub>&nbsp;&nbsp;[z.j./DS]"],
["Projekce báze", "Q<sub>báze→zúčt.</sub> = E<sub>báze</sub> × ΣDS<sub>normové, zúčtovací období</sub>"],
["Úspora", "ΔQ = Q<sub>báze→zúčt.</sub> − Q<sub>s, zúčt.</sub>"]]],
["fine", "Normové dennostupně počítáme přesně stejně jako skutečné — se stejným počtem vytápěcích dní <em>z</em> a stejnou teplotou T<sub>i</sub> — a dosazujeme výhradně teploty Typického meteorologického roku místo skutečných. Rozdíl mezi nimi je tedy čistý efekt počasí, nic víc."]
]]
]},
{h: "Odkud pochází každá veličina", b: [
["p", "Každé číslo vstupující do vyúčtování má pojmenovaný zdroj a okamžik stanovení. To je podmínka reprodukovatelnosti — report musí být možné přepočítat nezávisle, bez dotazu na nás."],
["d", "Podrobnosti · zdroje dat", [
["t3", [["Veličina", "Zdroj", "Kdy se stanovuje"],
["Skutečné teploty <span class=\"sym\">t</span>", "meteorologická stanice v lokalitě objektu; v reportu uvádíme název stanice a datum stažení dat", "pro každé období zvlášť"],
["Normály <span class=\"sym\">t<sub>TMR</sub></span>", "dlouholetá měřicí řada pro lokalitu; v reportu uvádíme rozsah let, ze kterých byly normály spočteny", "jednou — fixováno v protokolu TMR"],
["Vytápěcí dny <span class=\"sym\">z</span>", "kalendář topné sezony objektu; tatáž hodnota vstupuje do skutečných i normových dennostupňů", "pro každý měsíc období"],
["Teplota <span class=\"sym\">T<sub>i</sub></span>", "smluvní parametr zapsaný v měřicím protokolu", "jednou — shodná pro bázi i všechna období"],
["Spotřeba <span class=\"sym\">Q</span>", "fakturační měřidlo energie nebo faktury od dodavatele, vždy s uvedením hranice měření", "pro každé období"],
["Cena energie", "měřicí protokol; uvádíme, zda jde o cenu pevnou, nebo skutečnou fakturační", "jednou, se způsobem aktualizace zapsaným ve smlouvě"],
["Podíl stran", "smlouva", "jednou"]]]
]],
["psfine", "Po zapnutí podrobností uvidíte úplný přehled: co pochází z meteorologické stanice, co z měřidla a co z měřicího protokolu."]
]},
{h: "Bázové období — vztažný bod", b: [
["p", "Bázi určujeme ze tří úplných topných sezon předcházejících nasazení. Bází však není spotřeba vyjádřená v zúčtovacích jednotkách, nýbrž <strong>jednotkový ukazatel E</strong> — spotřeba připadající na jeden normový dennostupeň. Tato veličina nezávisí ani na počasí, ani na délce období."],
["d", "Podrobnosti · jak báze vzniká", [
["ul", ["Každou ze tří sezon přepočítáme samostatně na TMR a určíme pro ni ukazatel E.", "Bází je aritmetický průměr ukazatelů z těchto sezon.", "Kontrolujeme rozptyl ukazatelů kolem průměru — to je test kvality báze."]],
["p", "Malý rozptyl znamená, že se objekt v těch letech provozně neměnil a báze je konzistentní. Výrazně větší je signálem, že v řadě nastala změna — nájemce, plocha, provozní hodiny — a pak bázi korigujeme nebo řadu zkracujeme. Bázi nepřijímáme naslepo."]
]]
]},
{h: "Průběh vyúčtování období", b: [
["steps", [["Dennostupně období", "Určíme skutečné a normové dennostupně. Otázka: jaké počasí opravdu bylo a jaké by bylo při normě?"],
["Korekce spotřeby", "Spočítáme koeficient φ a převedeme změřenou spotřebu na normové podmínky."],
["Projekce báze", "Promítneme bázi do téhož období: kolik by objekt spotřeboval nyní, kdyby si zachoval charakteristiku z doby před nasazením?"],
["Úspora", "Rozdíl obou veličin je skutečně ušetřená energie."],
["Kontrola druhou cestou", "Tentýž výsledek musí vyjít i přes pokles ukazatele E."]]],
["d", "Podrobnosti · proč právě takto", [
["p", "<strong>Krok 3</strong> zároveň řeší problém rozdílné délky období. Báze se promítá přesně do období, které vyúčtováváme, a neporovnává se s celým rokem — díky tomu lze vyúčtovat i sezonu zkrácenou, posunutou nebo přerušenou bez zkreslení výsledku."],
["p", "<strong>Krok 5</strong> je bezpodmínečný. Pokud obě cesty nedají tentýž výsledek, je v reportu chyba a report se nevydá. Je to vnitřní kontrola na naší straně, ne formalita."],
["c", ["<strong>Korekce na TMR působí ve váš prospěch.</strong> Porovnání samotných změřených spotřeb bez ohledu na počasí ukáže v sezoně mírnější než norma vyšší úsporu, než je skutečná — přisuzuje technologii to, co udělalo počasí. My tento efekt z výsledku odstraňujeme, a fakturujeme tak nižší číslo, než jaké by dalo prosté porovnání."]]
]]
]},
{h: "Druhá, nezávislá kontrolní metoda — lineární regrese", b: [
["p", "Korekce na TMR porovnává <strong>období</strong> převedená na společné počasí. Regrese dělá totéž na úrovni <strong>jednotlivých odečtů</strong>: popisuje objekt rovnicí, v níž je venkovní teplota vysvětlující proměnnou. Jsou to dva na sobě nezávislé důkazy téhož efektu — a očekáváme, že řeknou totéž."],
["ps", "Metoda navíc ukazuje, jak se změnil způsob řízení: o kolik níže pracuje teplota přívodu při stejném počasí."],
["d", "Podrobnosti · model a data", [
["h3", "Vstupní data"],
["p", "Záznam z měřidla a regulátoru v konstantním časovém kroku. Do modelu vstupují: časová značka odečtu, venkovní teplota, teplota přívodu a zpátečky, průtok a výkon i spotřeba energie. Neagregujeme je do měsíců — pracujeme se surovými odečty, protože teprve ty ukazují, jak se objekt chová za konkrétních podmínek."],
["h3", "Model"],
["f", [["Regresní přímka", "y = a · x + b"],
["Rozdíl režimů", "Δ(x) = y<sub>ekvitermní</sub>(x) − y<sub>WaterAI</sub>(x)"],
["Redukce", "R(x) = Δ(x) / y<sub>ekvitermní</sub>(x) × 100&nbsp;&nbsp;[%]"]]],
["t", [["Symbol", "Význam"],
["x", "venkovní teplota v okamžiku odečtu [°C]"],
["y", "sledovaná veličina: teplota přívodu [°C] nebo výkon / spotřeba energie"],
["a", "sklon přímky — citlivost objektu na počasí, tedy o kolik roste <em>y</em> na každý stupeň poklesu venkovní teploty"],
["b", "absolutní člen — úroveň při 0 °C, tedy složka nezávislá na počasí: nastavení, setrvačnost, ztráty okruhu"]]],
["p", "Koeficienty <em>a</em> a <em>b</em> určujeme metodou nejmenších čtverců, zvlášť pro dvě množiny odečtů: provoz v <strong>ekvitermním režimu</strong> (dosavadní topná křivka) a provoz v <strong>prediktivním režimu WaterAI</strong>. Vzniknou dvě přímky, které porovnáváme při téže venkovní teplotě."],
["chart", {alt: "Schematický graf: dvě regresní přímky — ekvitermní režim nahoře, režim WaterAI dole, rozdíl mezi nimi je efekt řízení", base: "ekvitermní režim", ai: "režim WaterAI", delta: "Δ(x) — efekt řízení", xl: "nižší venkovní teplota", xr: "vyšší →", cap: "Schematický graf. Odstup mezi přímkami není konstantní — proto výsledek uvádíme jako funkci venkovní teploty, nikoli jako jedno číslo."}],
["h3", "Co sledujeme souběžně"],
["ul", ["<strong>Teplota přívodu</strong> — důkaz, že se změnil způsob řízení: při stejném počasí jede objekt na nižším parametru.", "<strong>Výkon a spotřeba energie</strong> — důkaz, že se změna řízení promítla do energie."]],
["p", "Obě veličiny musí být konzistentní. Pokles teploty přívodu bez odpovídajícího poklesu odběru energie je varovný signál — znamená obvykle delší dobu provozu nebo posunutý odběr, nikoli úsporu."],
["h3", "Podmínky správnosti porovnání"],
["ul", ["tentýž rozsah venkovních teplot pro obě množiny — přímky porovnáváme jen tam, kde mají data obě,", "vyloučení odečtů mimo topnou sezonu a období odstávek a servisních prací,", "vyloučení přechodových stavů po najetí, které vztah zkreslují,", "srovnatelný počet bodů v obou množinách,", "kontrola těsnosti proložení (koeficient determinace) a rozptylu reziduí — slabé proložení znamená, že na objekt působí faktor mimo model a výsledek vyžaduje vysvětlení,", "shodná hranice měření a tentýž časový krok pro oba režimy."]],
["c", ["<strong>Regrese není podkladem pro fakturaci.</strong> Fakturujeme výhradně metodou TMR, z jednotek odečtených z fakturačního měřidla. Regrese slouží k ověření tohoto výsledku, k diagnostice objektu a ke kontrole, zda efekt v čase vydrží. Pokud se obě metody rozcházejí, hledáme příčinu ještě před vydáním reportu — a nevybíráme si příznivější číslo."]]
]]
]},
{h: "Vyúčtování a faktura", b: [
["ul", ["Hodnota úspory je odměřené množství zúčtovacích jednotek vynásobené dohodnutou cenou energie.", "Naše odměna je smluvně stanovený podíl na této hodnotě — a je jedinou položkou faktury.", "Faktura se odvolává na číslo reportu a na zúčtovací období, kterého se týká.", "Vyúčtováváme výhradně uzavřená období; roční prognózy slouží plánování rozpočtu a nikdy nejsou podkladem pro fakturaci."]],
["d", "Podrobnosti · dohledatelnost reportu", [
["p", "V každém zúčtovacím reportu jsou výslovně uvedeny:"],
["ul", ["meteorologická stanice a zdroj teplot spolu s datem stažení dat,", "rozsah let, ze kterých byly spočteny normály TMR,", "číslo protokolu TMR a číslo analýzy — každý report lze spojit s jeho zdrojovým podkladem,", "zdroj údajů o spotřebě, tedy konkrétní měřidlo nebo faktury, včetně hranice měření,", "teplota T<sub>i</sub> přijatá pro bázi i pro zúčtovací období,", "cena energie a dohodnutý podíl, s uvedením, zda jde o cenu pevnou, nebo fakturační."]],
["fine", "Všechny částky v reportu jsou bez DPH; DPH se počítá podle sazby platné v den vystavení faktury."]
]]
]},
{h: "Kdy se báze upravuje", b: [
["cw", ["<strong>Bázi nepřepisujeme dosaženou úsporou.</strong> Dosažený výsledek se nestává novým vztažným bodem — jinak by efekt technologie rok co rok z vyúčtování mizel."]],
["p", "Bázi upravujeme výhradně při změnách, které s technologií nesouvisejí, ale ovlivňují spotřebu."],
["d", "Podrobnosti · katalog změn", [
["ul", ["změna způsobu využívání objektu nebo provozních hodin,", "podstatná změna obsazenosti nebo změna nájemců,", "změna vytápěné plochy,", "zásah do obálky budovy,", "výměna nebo doplnění zdroje energie,", "nová technologie s vlastním odběrem energie,", "změna dohodnuté vnitřní teploty T<sub>i</sub>."]],
["fine", "Úprava je obousměrná — tedy i v náš neprospěch. Pokud změna na objektu sama o sobě snižuje spotřebu, báze se o tento efekt zmenší a ten se nevyúčtuje jako úspora technologie."]
]]
]},
{h: "Jak začínáme", b: [
["steps", [["Vstupní data", "Faktury za energii nebo odečty měřidla z posledních sezon — víc v této fázi není potřeba."],
["Simulace úspor", "Na vašich skutečných nákladech ukážeme očekávaný efekt a rozdělení přínosu. Je to prognóza, ne závazek."],
["Analýza a měřicí protokol", "Určíme bázi, stanovíme hranici měření, T<sub>i</sub>, cenu energie a podíl stran."],
["Montáž a přepnutí", "Instalace bez přerušení provozu objektu, období provozu v dosavadním režimu, poté přechod do prediktivního režimu. Od tohoto data běží zúčtovací období."],
["Report a vyúčtování", "Po uzavření období vydáme report s úplným výpočtem; faktura se odvolává na jeho číslo."]]]
]}
]
};
