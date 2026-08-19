window.I18N = window.I18N || {};
window.I18N["sk"] = {
label: "SK", htmlLang: "sk",
title: "WaterAI Energy Control — meranie a zúčtovanie energetických úspor",
desc: "Ako meriame a zúčtovávame energetické úspory: korekcia na Typický meteorologický rok a kontrolná lineárna regresia. Prihlásenie do panela Energy Control.",
eyebrow: "Energy Control · metóda merania a zúčtovania",
h1: "Úspora energie bez vlastnej investície",
lede: "Platíte výhradne za energiu, ktorú sa reálne podarí ušetriť — odmeranú z meradla, očistenú o vplyv počasia a potvrdenú druhou, nezávislou metódou. Pred štartom pripravíme simuláciu na základe vašich skutočných nákladov.",
switchIntro: "<strong>Chcete vedieť presne, ako počítame?</strong> Zapnutím podrobností sa na tejto stránke rozvinie úplný opis metódy: vzorce, zdroje údajov, poradie krokov zúčtovania a regresný model.",
toggleOff: "Podrobné informácie",
toggleOn: "Skryť podrobnosti",
cards: [
["Nulové vstupné náklady", "Žiadna investícia na vašej strane a žiadny zásah do existujúcej regulácie."],
["Platba z úspory", "Našou odmenou je dohodnutý podiel na hodnote odmeranej úspory."],
["Výsledok odolný voči počasiu", "Každé obdobie sa prepočítava na tie isté normové podmienky (TMR)."]
],
login: {
title: "Energy Control", sub: "Systém merania a zúčtovania energetických úspor",
email: "Login / e-mail", emailPh: "napr. admin@waterai.pl",
pass: "Heslo", passPh: "Zadajte heslo", submit: "Prihlásiť sa",
errEmpty: "Zadajte login a heslo.",
mock: "Maketa — pripojte toto tlačidlo k prihlasovacej logike aplikácie.",
powered: "Powered by WaterAI"
},
langLabel: "Jazyk",
aside: [
["Nemáte ešte účet?", "Účty zakladá administrátor. V paneli vidíte výsledky pre vaše objekty a vedľa opisujeme metódu, z ktorej tieto výsledky vznikajú."],
["Chcete vedieť, koľko to môže priniesť u vás?", "Pripravíme simuláciu úspor na základe vašich skutočných nákladov — stačia faktúry za energiu alebo odpočty meradla z posledných sezón. Simulácia je prognóza; zúčtovávame výhradne to, čo po skončení obdobia ukáže meranie."]
],
footer: ["Water AI · waterai.sk · info@waterai.sk", "Opis má informatívny charakter; záväzné podmienky určuje zmluva a merací protokol."],
closing: "Po skončení zmluvného obdobia zostáva celý efekt technológie vám.",
sections: [
{h: "Čo ponúkame", b: [
["p", "Nasadzujeme prediktívne riadenie vykurovania na existujúcej inštalácii. Systém sa učí správanie budovy a jej reakciu na počasie a potom potrebu predbieha namiesto oneskorenej reakcie. Nemeníme zdroj tepla ani nezasahujeme do existujúcej automatiky."],
["p", "Zúčtovanie vedieme v modeli ESCO: náklady na nasadenie a prevádzku znášame my a našou odmenou je podiel na hodnote úspory potvrdenej meraním. Ak úspora nie je, faktúra nie je."],
["d", "Podrobnosti", [
["p", "Hranicu merania určíme pred štartom a zapíšeme do meracieho protokolu: zúčtovaniu podlieha výhradne energia, ktorú zachytáva určené meradlo. Médiá merané samostatne — napríklad teplá úžitková voda — nevstupujú ani do bázového obdobia, ani do zúčtovania."],
["p", "Ak sa súbežne zvažuje iná technológia (napríklad fyzikálna úprava vody), hodnotíme ju ako samostatný krok s vlastnou bázou. Efekty sa nesčítavajú do jedného ukazovateľa, aby sa každý z nich dal obhájiť osobitne."]
]]
]},
{h: "Simulácia pred štartom — a prečo výsledok uvádzame až po skončení obdobia", b: [
["p", "Skôr než sa čokoľvek podpíše, pripravíme <strong>simuláciu úspor založenú na vašich skutočných nákladoch</strong> — na faktúrach za energiu a odpočtoch meradla z posledných sezón. Simulácia ukazuje očakávaný rád veličiny: koľko energie môže v budove zostať, čo to znamená v peniazoch pri vašej cene a ako sa tento efekt delí medzi strany."],
["cw", ["<strong>Simulácia je prognóza, nie sľub.</strong> Neuvádzame vopred garantované percento, pretože úspora závisí od faktorov, ktoré nikto úplne neovláda: od priebehu počasia v konkrétnej sezóne, spôsobu užívania objektu, zmien obsadenosti a prevádzkových hodín, stavu inštalácie aj od rozhodnutí prijímaných na mieste. Tvrdé číslo uvádzame až za uzavreté obdobie — odmerané z meradla a očistené o vplyv počasia.", "Riziko, že sa prognóza a výsledok rozídu, znášame my, nie vy: fakturujeme výhradne to, čo bolo odmerané. Ak úspora nie je, faktúra nie je."]],
["d", "Podrobnosti · rozsah simulácie", [
["h3", "Čo do simulácie vstupuje"],
["ul", ["spotreba a náklady z posledných sezón — z faktúr alebo z odpočtov meradla,", "charakteristika objektu vyplývajúca z týchto údajov, prevedená na normové podmienky (TMR),", "cena energie, ktorú platíte dnes, a spôsob jej aktualizácie predpokladaný v zmluve,", "dohodnuté rozdelenie efektu medzi strany."]],
["h3", "Čo simulácia nezahŕňa"],
["ul", ["priebeh počasia v nadchádzajúcej sezóne — z definície neznámy,", "zmeny na vašej strane: obsadenosť, prevádzkové hodiny, nových nájomcov, stavebné práce,", "zmeny ceny energie nad rámec toho, čo je zapísané v zmluve,", "poruchy a odstávky inštalácie."]],
["p", "Preto simuláciu uvádzame ako rozpätie, nie ako jediné číslo, a uvádzame, za akých predpokladov vznikla. Nie je podkladom pre zúčtovanie — slúži na rozhodnutie."],
["c", ["<strong>Prognózu overujeme spätne.</strong> Po prvom uzavretom období postavíme simuláciu vedľa výsledku merania a ukážeme odchýlku aj s jej príčinou. Na tom istom podklade korigujeme prognózu na ďalšiu sezónu — a je z neho vidieť, či boli naše predpoklady poctivé."]]
]]
]},
{h: "Odkiaľ sa berie číslo, za ktoré platíte", b: [
["p", "Neporovnávame spotreby rok od roku, pretože taký výsledok hovorí predovšetkým o tom, ktorá zima bola miernejšia. Každé obdobie — bázové aj zúčtovacie — prepočítavame na tie isté normové poveternostné podmienky, teda na <strong>Typický meteorologický rok (TMR)</strong>. Až takto prevedené na spoločného menovateľa sú veličiny porovnateľné."],
["ps", "Dôsledok je jednoznačný: miernejšia zima sa nemôže vykázať ako úspora a zima ostrejšia než norma nezaťažuje výsledok technológie."],
["d", "Podrobnosti · označenia a vzorce", [
["t", [["Symbol", "Význam"],
["z", "počet dní s aktívnym vykurovaním v danom mesiaci"],
["T<sub>i</sub>", "vnútorná teplota prijatá do výpočtu — zmluvný parameter, ten istý pre bázu aj pre každé zúčtovacie obdobie"],
["t", "priemerná vonkajšia teplota počas vykurovacích dní daného mesiaca (skutočné údaje)"],
["t<sub>TMR</sub>", "normová teplota toho istého mesiaca podľa Typického meteorologického roka"],
["SD", "dennostupne — miera potreby tepla vyplývajúcej z počasia [°C·dni]"],
["Q · Q<sub>s</sub>", "odmeraná spotreba a spotreba korigovaná na normové podmienky, vyjadrená v <strong>zúčtovacej jednotke [z.j.]</strong> — tej, v ktorej meria meradlo a fakturuje dodávateľ: kWh, MWh alebo GJ pri centrálnom teple, m<sup>3</sup> pri plyne"],
["φ", "korekčný koeficient obdobia"],
["E", "jednotkový ukazovateľ — spotreba na jeden normový dennostupeň [z.j./SD]"],
["ΔQ", "odmeraná úspora, v tej istej zúčtovacej jednotke ako Q"]]],
["f", [["Dennostupne", "SD = z × (T<sub>i</sub> − t)&nbsp;&nbsp;[°C·dni]"],
["Korekčný koeficient", "φ = ΣSD<sub>štandardné</sub> / ΣSD<sub>skutočné</sub>"],
["Korigovaná spotreba", "Q<sub>s</sub> = Q × φ"],
["Jednotkový ukazovateľ", "E = Q<sub>s</sub> / ΣSD<sub>štandardné</sub>&nbsp;&nbsp;[z.j./SD]"],
["Projekcia bázy", "Q<sub>báza→zúčt.</sub> = E<sub>báza</sub> × ΣSD<sub>štandardné, zúčtovacie obdobie</sub>"],
["Úspora", "ΔQ = Q<sub>báza→zúčt.</sub> − Q<sub>s, zúčt.</sub>"]]],
["fine", "Štandardné dennostupne počítame presne tak isto ako skutočné — s rovnakým počtom vykurovacích dní <em>z</em> a rovnakou teplotou T<sub>i</sub> — a dosadzujeme výhradne teploty Typického meteorologického roka namiesto skutočných. Rozdiel medzi nimi je teda čistý efekt počasia, nič viac."]
]]
]},
{h: "Odkiaľ pochádza každá veličina", b: [
["p", "Každé číslo vstupujúce do zúčtovania má pomenovaný zdroj a okamih určenia. To je podmienka reprodukovateľnosti — report sa musí dať prepočítať nezávisle, bez otázky na nás."],
["d", "Podrobnosti · zdroje údajov", [
["t3", [["Veličina", "Zdroj", "Kedy sa určuje"],
["Skutočné teploty <span class=\"sym\">t</span>", "meteorologická stanica v lokalite objektu; v reporte uvádzame názov stanice a dátum stiahnutia údajov", "pre každé obdobie osobitne"],
["Normály <span class=\"sym\">t<sub>TMR</sub></span>", "dlhoročný merací rad pre lokalitu; v reporte uvádzame rozsah rokov, z ktorých boli normály vypočítané", "raz — fixované v protokole TMR"],
["Vykurovacie dni <span class=\"sym\">z</span>", "kalendár vykurovacej sezóny objektu; tá istá hodnota vstupuje do skutočných aj štandardných dennostupňov", "pre každý mesiac obdobia"],
["Teplota <span class=\"sym\">T<sub>i</sub></span>", "zmluvný parameter zapísaný v meracom protokole", "raz — zhodná pre bázu aj všetky obdobia"],
["Spotreba <span class=\"sym\">Q</span>", "fakturačné meradlo energie alebo faktúry od dodávateľa, vždy s uvedením hranice merania", "pre každé obdobie"],
["Cena energie", "merací protokol; uvádzame, či ide o cenu fixnú, alebo skutočnú fakturačnú", "raz, so spôsobom aktualizácie zapísaným v zmluve"],
["Podiel strán", "zmluva", "raz"]]]
]],
["psfine", "Po zapnutí podrobností uvidíte úplný prehľad: čo pochádza z meteorologickej stanice, čo z meradla a čo z meracieho protokolu."]
]},
{h: "Bázové obdobie — vzťažný bod", b: [
["p", "Bázu určujeme z troch úplných vykurovacích sezón predchádzajúcich nasadeniu. Bázou však nie je spotreba vyjadrená v zúčtovacích jednotkách, ale <strong>jednotkový ukazovateľ E</strong> — spotreba pripadajúca na jeden štandardný dennostupeň. Táto veličina nezávisí ani od počasia, ani od dĺžky obdobia."],
["d", "Podrobnosti · ako vzniká báza", [
["ul", ["Každú z troch sezón prepočítame samostatne na TMR a určíme pre ňu ukazovateľ E.", "Bázou je aritmetický priemer ukazovateľov z týchto sezón.", "Kontrolujeme rozptyl ukazovateľov okolo priemeru — to je test kvality bázy."]],
["p", "Malý rozptyl znamená, že sa objekt v tých rokoch prevádzkovo nemenil a báza je konzistentná. Výrazne väčší je signálom, že v rade nastala zmena — nájomca, plocha, prevádzkové hodiny — a vtedy bázu korigujeme alebo rad skracujeme. Bázu nepreberáme naslepo."]
]]
]},
{h: "Priebeh zúčtovania obdobia", b: [
["steps", [["Dennostupne obdobia", "Určíme skutočné a štandardné dennostupne. Otázka: aké počasie naozaj bolo a aké by bolo pri norme?"],
["Korekcia spotreby", "Vypočítame koeficient φ a prevedieme odmeranú spotrebu na normové podmienky."],
["Projekcia bázy", "Premietneme bázu do toho istého obdobia: koľko by objekt spotreboval teraz, keby si zachoval charakteristiku spred nasadenia?"],
["Úspora", "Rozdiel oboch veličín je skutočne ušetrená energia."],
["Kontrola druhou cestou", "Ten istý výsledok musí vyjsť aj cez pokles ukazovateľa E."]]],
["d", "Podrobnosti · prečo práve takto", [
["p", "<strong>Krok 3</strong> zároveň rieši problém rozdielnej dĺžky období. Báza sa premieta presne do obdobia, ktoré zúčtovávame, a neporovnáva sa s celým rokom — vďaka tomu možno zúčtovať aj sezónu skrátenú, posunutú alebo prerušenú bez skreslenia výsledku."],
["p", "<strong>Krok 5</strong> je bezpodmienečný. Ak obe cesty nedajú ten istý výsledok, v reporte je chyba a report sa nevydá. Je to vnútorná kontrola na našej strane, nie formalita."],
["c", ["<strong>Korekcia na TMR pôsobí vo váš prospech.</strong> Porovnanie samotných odmeraných spotrieb bez ohľadu na počasie ukáže v sezóne miernejšej než norma vyššiu úsporu, než je skutočná — pripisuje technológii to, čo urobilo počasie. My tento efekt z výsledku odstraňujeme, a fakturujeme tak nižšie číslo, než aké by dalo jednoduché porovnanie."]]
]]
]},
{h: "Druhá, nezávislá kontrolná metóda — lineárna regresia", b: [
["p", "Korekcia na TMR porovnáva <strong>obdobia</strong> prevedené na spoločné počasie. Regresia robí to isté na úrovni <strong>jednotlivých odpočtov</strong>: opisuje objekt rovnicou, v ktorej je vonkajšia teplota vysvetľujúcou premennou. Sú to dva na sebe nezávislé dôkazy toho istého efektu — a očakávame, že povedia to isté."],
["ps", "Metóda navyše ukazuje, ako sa zmenil spôsob riadenia: o koľko nižšie pracuje teplota prívodu pri rovnakom počasí."],
["d", "Podrobnosti · model a údaje", [
["h3", "Vstupné údaje"],
["p", "Záznam z meradla a regulátora v konštantnom časovom kroku. Do modelu vstupujú: časová značka odpočtu, vonkajšia teplota, teplota prívodu a spiatočky, prietok a výkon aj spotreba energie. Neagregujeme ich na mesiace — pracujeme so surovými odpočtami, pretože až tie ukazujú, ako sa objekt správa za konkrétnych podmienok."],
["h3", "Model"],
["f", [["Regresná priamka", "y = a · x + b"],
["Rozdiel režimov", "Δ(x) = y<sub>ekvitermný</sub>(x) − y<sub>WaterAI</sub>(x)"],
["Redukcia", "R(x) = Δ(x) / y<sub>ekvitermný</sub>(x) × 100&nbsp;&nbsp;[%]"]]],
["t", [["Symbol", "Význam"],
["x", "vonkajšia teplota v okamihu odpočtu [°C]"],
["y", "sledovaná veličina: teplota prívodu [°C] alebo výkon / spotreba energie"],
["a", "sklon priamky — citlivosť objektu na počasie, teda o koľko rastie <em>y</em> na každý stupeň poklesu vonkajšej teploty"],
["b", "absolútny člen — úroveň pri 0 °C, teda zložka nezávislá od počasia: nastavenia, zotrvačnosť, straty okruhu"]]],
["p", "Koeficienty <em>a</em> a <em>b</em> určujeme metódou najmenších štvorcov, osobitne pre dve množiny odpočtov: prevádzku v <strong>ekvitermnom režime</strong> (doterajšia vykurovacia krivka) a prevádzku v <strong>prediktívnom režime WaterAI</strong>. Vzniknú dve priamky, ktoré porovnávame pri tej istej vonkajšej teplote."],
["chart", {alt: "Schematický graf: dve regresné priamky — ekvitermný režim hore, režim WaterAI dole, rozdiel medzi nimi je efekt riadenia", base: "ekvitermný režim", ai: "režim WaterAI", delta: "Δ(x) — efekt riadenia", xl: "nižšia vonkajšia teplota", xr: "vyššia →", cap: "Schematický graf. Odstup medzi priamkami nie je konštantný — preto výsledok uvádzame ako funkciu vonkajšej teploty, nie ako jedno číslo."}],
["h3", "Čo sledujeme súbežne"],
["ul", ["<strong>Teplota prívodu</strong> — dôkaz, že sa zmenil spôsob riadenia: pri rovnakom počasí ide objekt na nižšom parametri.", "<strong>Výkon a spotreba energie</strong> — dôkaz, že sa zmena riadenia premietla do energie."]],
["p", "Obe veličiny musia byť konzistentné. Pokles teploty prívodu bez zodpovedajúceho poklesu odberu energie je varovný signál — znamená zvyčajne dlhší čas prevádzky alebo posunutý odber, nie úsporu."],
["h3", "Podmienky správnosti porovnania"],
["ul", ["ten istý rozsah vonkajších teplôt pre obe množiny — priamky porovnávame len tam, kde majú údaje obe,", "vylúčenie odpočtov mimo vykurovacej sezóny a období odstávok a servisných prác,", "vylúčenie prechodových stavov po nábehu, ktoré vzťah skresľujú,", "porovnateľný počet bodov v oboch množinách,", "kontrola tesnosti preloženia (koeficient determinácie) a rozptylu rezíduí — slabé preloženie znamená, že na objekt pôsobí faktor mimo modelu a výsledok si vyžaduje vysvetlenie,", "zhodná hranica merania a ten istý časový krok pre oba režimy."]],
["c", ["<strong>Regresia nie je podkladom pre fakturáciu.</strong> Fakturujeme výhradne metódou TMR, z jednotiek odčítaných z fakturačného meradla. Regresia slúži na overenie tohto výsledku, na diagnostiku objektu a na kontrolu, či efekt v čase vydrží. Ak sa obe metódy rozchádzajú, hľadáme príčinu ešte pred vydaním reportu — a nevyberáme si priaznivejšie číslo."]]
]]
]},
{h: "Zúčtovanie a faktúra", b: [
["ul", ["Hodnota úspory je odmerané množstvo zúčtovacích jednotiek vynásobené dohodnutou cenou energie.", "Naša odmena je zmluvne stanovený podiel na tejto hodnote — a je jedinou položkou faktúry.", "Faktúra sa odvoláva na číslo reportu a na zúčtovacie obdobie, ktorého sa týka.", "Zúčtovávame výhradne uzavreté obdobia; ročné prognózy slúžia na plánovanie rozpočtu a nikdy nie sú podkladom pre fakturáciu."]],
["d", "Podrobnosti · dohľadateľnosť reportu", [
["p", "V každom zúčtovacom reporte sú výslovne uvedené:"],
["ul", ["meteorologická stanica a zdroj teplôt spolu s dátumom stiahnutia údajov,", "rozsah rokov, z ktorých boli vypočítané normály TMR,", "číslo protokolu TMR a číslo analýzy — každý report sa dá spojiť so svojím zdrojovým podkladom,", "zdroj údajov o spotrebe, teda konkrétne meradlo alebo faktúry, vrátane hranice merania,", "teplota T<sub>i</sub> prijatá pre bázu aj pre zúčtovacie obdobie,", "cena energie a dohodnutý podiel s uvedením, či ide o cenu fixnú, alebo fakturačnú."]],
["fine", "Všetky sumy v reporte sú netto; DPH sa počíta podľa sadzby platnej v deň vystavenia faktúry."]
]]
]},
{h: "Kedy sa báza upravuje", b: [
["cw", ["<strong>Bázu neprepisujeme dosiahnutou úsporou.</strong> Dosiahnutý výsledok sa nestáva novým vzťažným bodom — inak by efekt technológie rok čo rok zo zúčtovania mizol."]],
["p", "Bázu upravujeme výhradne pri zmenách, ktoré s technológiou nesúvisia, ale ovplyvňujú spotrebu."],
["d", "Podrobnosti · katalóg zmien", [
["ul", ["zmena spôsobu využívania objektu alebo prevádzkových hodín,", "podstatná zmena obsadenosti alebo zmena nájomcov,", "zmena vykurovanej plochy,", "zásah do obálky budovy,", "výmena alebo doplnenie zdroja energie,", "nová technológia s vlastným odberom energie,", "zmena dohodnutej vnútornej teploty T<sub>i</sub>."]],
["fine", "Úprava je obojsmerná — teda aj v náš neprospech. Ak zmena na objekte sama osebe znižuje spotrebu, báza sa o tento efekt zmenší a ten sa nezúčtuje ako úspora technológie."]
]]
]},
{h: "Ako začíname", b: [
["steps", [["Vstupné údaje", "Faktúry za energiu alebo odpočty meradla z posledných sezón — viac v tejto fáze netreba."],
["Simulácia úspor", "Na vašich skutočných nákladoch ukážeme očakávaný efekt a rozdelenie prínosu. Je to prognóza, nie záväzok."],
["Analýza a merací protokol", "Určíme bázu, stanovíme hranicu merania, T<sub>i</sub>, cenu energie a podiel strán."],
["Montáž a prepnutie", "Inštalácia bez prerušenia prevádzky objektu, obdobie prevádzky v doterajšom režime, potom prechod do prediktívneho režimu. Od tohto dátumu beží zúčtovacie obdobie."],
["Report a zúčtovanie", "Po uzavretí obdobia vydáme report s úplným výpočtom; faktúra sa odvoláva na jeho číslo."]]]
]}
]
};
