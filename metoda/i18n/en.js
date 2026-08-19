window.I18N = window.I18N || {};
window.I18N["en"] = {
label: "EN", htmlLang: "en",
title: "WaterAI Energy Control — measuring and settling energy savings",
desc: "How we measure and settle energy savings: correction to a Typical Meteorological Year plus a linear-regression cross-check. Sign in to the Energy Control panel.",
eyebrow: "Energy Control · measurement and settlement method",
h1: "Energy savings with no capital outlay",
lede: "You pay only for energy that is actually saved — metered, corrected for weather and confirmed by a second, independent method. Before we start, we prepare a simulation based on your real costs.",
switchIntro: "<strong>Want to know exactly how we calculate?</strong> Turning on the details expands the full method on this page: formulas, data sources, the order of settlement steps and the regression model.",
toggleOff: "Detailed information",
toggleOn: "Hide details",
cards: [
["No capital outlay", "No investment on your side and no interference with the existing control system."],
["Paid from savings", "Our fee is an agreed share of the value of the measured saving."],
["Weather-proof result", "Every period is converted to the same standard conditions (TMY)."]
],
login: {
title: "Energy Control", sub: "Energy savings measurement and settlement system",
email: "Login / e-mail", emailPh: "e.g. admin@waterai.pl",
pass: "Password", passPh: "Enter password", submit: "Sign in",
errEmpty: "Enter your login and password.",
mock: "Mock-up — connect this button to the application's sign-in logic.",
powered: "Powered by WaterAI"
},
langLabel: "Language",
aside: [
["Don't have an account yet?", "Accounts are created by the administrator. The panel shows results for your sites; alongside it we describe the method those results come from."],
["Want to know what it could deliver for you?", "We will prepare a savings simulation based on your real costs — energy invoices or meter readings from recent seasons are enough. The simulation is a forecast; we settle only what the measurement shows once the period closes."]
],
footer: ["Water AI · waterai.sk · info@waterai.sk", "This description is informational; binding terms are set by the contract and the measurement protocol."],
closing: "Once the contract period ends, the full effect of the technology stays with you.",
sections: [
{h: "What we offer", b: [
["p", "We deploy predictive heating control on your existing installation. The system learns how the building behaves and how it responds to weather, then anticipates demand instead of reacting late. We do not replace the heat source and we do not interfere with the existing automation."],
["p", "Settlement follows the ESCO model: we cover the cost of deployment and operation, and our fee is a share of the value of savings confirmed by measurement. No saving means no invoice."],
["d", "Details", [
["p", "The measurement boundary is agreed before the start and recorded in the measurement protocol: only energy covered by the designated meter is settled. Utilities metered separately — domestic hot water, for example — enter neither the baseline nor the settlement."],
["p", "If another technology is under consideration in parallel (physical water treatment, for instance), we assess it as a separate step with its own baseline. Effects are not merged into a single indicator, so that each one can be defended on its own."]
]]
]},
{h: "A simulation before the start — and why the result comes only after the period", b: [
["p", "Before anything is signed, we prepare a <strong>savings simulation based on your real costs</strong> — on energy invoices and meter readings from recent seasons. The simulation shows the expected order of magnitude: how much energy could stay in the building, what that means in money at your price, and how the effect is shared between the parties."],
["cw", ["<strong>A simulation is a forecast, not a promise.</strong> We do not state a guaranteed percentage up front, because savings depend on factors nobody fully controls: how the weather turns out in a given season, how the building is used, changes in occupancy and operating hours, the condition of the installation, and decisions made on site. The firm number comes only for a closed period — metered and corrected for weather.", "The risk that the forecast and the result diverge sits with us, not with you: we invoice only what has been measured. No saving, no invoice."]],
["d", "Details · scope of the simulation", [
["h3", "What goes into the simulation"],
["ul", ["consumption and costs from recent seasons — from invoices or meter readings,", "the building's characteristic derived from that data, converted to standard conditions (TMY),", "the energy price you pay today and the update mechanism set out in the contract,", "the agreed split of the effect between the parties."]],
["h3", "What the simulation does not cover"],
["ul", ["how the weather will turn out in the coming season — unknowable by definition,", "changes on your side: occupancy, operating hours, new tenants, construction work,", "energy price changes beyond what the contract provides for,", "faults and installation downtime."]],
["p", "That is why we present the simulation as a range rather than a single figure, and state the assumptions behind it. It is not a basis for settlement — it is there to support a decision."],
["c", ["<strong>We check the forecast against reality.</strong> After the first closed period we set the simulation against the measured result and show the deviation together with its cause. That same material is what we use to adjust the forecast for the next season — and what shows whether our assumptions were sound."]]
]]
]},
{h: "Where the number you pay for comes from", b: [
["p", "We do not compare consumption year against year, because such a result mostly tells you which winter was milder. Every period — baseline and settlement alike — is converted to the same standard weather conditions, the <strong>Typical Meteorological Year (TMY)</strong>. Only once reduced to that common denominator are the quantities comparable."],
["ps", "The consequence is clear-cut: a milder winter cannot be reported as a saving, and a winter harsher than normal does not count against the technology."],
["d", "Details · symbols and formulas", [
["t", [["Symbol", "Meaning"],
["z", "number of days with active heating in a given month"],
["T<sub>i</sub>", "indoor temperature adopted for the calculation — a contractual parameter, identical for the baseline and for every settlement period"],
["t", "mean outdoor temperature during the heating days of a given month (actual data)"],
["t<sub>TMY</sub>", "standard temperature for the same month according to the Typical Meteorological Year"],
["SD", "degree days — a measure of weather-driven heat demand [°C·days]"],
["Q · Q<sub>s</sub>", "measured consumption and consumption corrected to standard conditions, expressed in the <strong>settlement unit [s.u.]</strong> — the one the meter records and the supplier invoices in: kWh, MWh or GJ for district heat, m<sup>3</sup> for gas"],
["φ", "correction coefficient for the period"],
["E", "unit indicator — consumption per one standard degree day [s.u./SD]"],
["ΔQ", "the measured saving, in the same settlement unit as Q"]]],
["f", [["Degree days", "SD = z × (T<sub>i</sub> − t)&nbsp;&nbsp;[°C·days]"],
["Correction coefficient", "φ = ΣSD<sub>standard</sub> / ΣSD<sub>actual</sub>"],
["Corrected consumption", "Q<sub>s</sub> = Q × φ"],
["Unit indicator", "E = Q<sub>s</sub> / ΣSD<sub>standard</sub>&nbsp;&nbsp;[s.u./SD]"],
["Baseline projection", "Q<sub>base→sett.</sub> = E<sub>base</sub> × ΣSD<sub>standard, settlement period</sub>"],
["Saving", "ΔQ = Q<sub>base→sett.</sub> − Q<sub>s, sett.</sub>"]]],
["fine", "Standard degree days are calculated exactly like the actual ones — same number of heating days <em>z</em>, same temperature T<sub>i</sub> — substituting only Typical Meteorological Year temperatures for the actual ones. The difference between the two is therefore the pure weather effect, nothing else."]
]]
]},
{h: "Where each quantity comes from", b: [
["p", "Every figure entering the settlement has a named source and a defined moment of determination. That is the condition for reproducibility — the report must be recalculable independently, without asking us anything."],
["d", "Details · data sources", [
["t3", [["Quantity", "Source", "When it is set"],
["Actual temperatures <span class=\"sym\">t</span>", "weather station at the site's location; the report names the station and the date the data was retrieved", "for each period separately"],
["Normals <span class=\"sym\">t<sub>TMY</sub></span>", "long-term measurement series for the location; the report states the range of years the normals were calculated from", "once — fixed in the TMY protocol"],
["Heating days <span class=\"sym\">z</span>", "the site's heating season calendar; the same value enters both actual and standard degree days", "for each month of the period"],
["Temperature <span class=\"sym\">T<sub>i</sub></span>", "contractual parameter recorded in the measurement protocol", "once — identical for the baseline and all periods"],
["Consumption <span class=\"sym\">Q</span>", "the billing energy meter or supplier invoices, always with the measurement boundary stated", "for each period"],
["Energy price", "measurement protocol; we state whether it is a fixed price or the actual invoiced price", "once, with the update mechanism set in the contract"],
["Party shares", "the contract", "once"]]]
]],
["psfine", "Turn on the details to see the full breakdown: what comes from the weather station, what from the meter, and what from the measurement protocol."]
]},
{h: "The baseline period — the reference point", b: [
["p", "The baseline is derived from three full heating seasons preceding deployment. The baseline is not consumption expressed in settlement units, however, but the <strong>unit indicator E</strong> — consumption per one standard degree day. That quantity depends neither on the weather nor on the length of the period."],
["d", "Details · how the baseline is built", [
["ul", ["Each of the three seasons is converted to TMY separately and its indicator E is determined.", "The baseline is the arithmetic mean of the indicators from those seasons.", "We check the spread of the indicators around the mean — that is the baseline quality test."]],
["p", "A small spread means the building did not change operationally over those years and the baseline is consistent. A markedly larger one signals that something shifted in the series — a tenant, floor area, operating hours — in which case we adjust the baseline or shorten the series. We do not accept a baseline sight unseen."]
]]
]},
{h: "How a period is settled", b: [
["steps", [["Degree days for the period", "We determine actual and standard degree days. The question: what was the weather really like, and what would it have been at the norm?"],
["Consumption correction", "We calculate the coefficient φ and bring measured consumption to standard conditions."],
["Baseline projection", "We project the baseline onto the same period: how much would the building have used now had it kept its pre-deployment characteristic?"],
["Saving", "The difference between the two is the energy actually saved."],
["Cross-check", "The same result must come out via the drop in indicator E."]]],
["d", "Details · why exactly this way", [
["p", "<strong>Step 3</strong> also resolves the problem of periods of different length. The baseline is projected onto precisely the period being settled rather than compared against a full year — which makes it possible to settle a shortened, shifted or interrupted season without distorting the result."],
["p", "<strong>Step 5</strong> is unconditional. If the two routes do not give the same result, the report contains an error and is not issued. That is an internal control on our side, not a formality."],
["c", ["<strong>The TMY correction works in your favour.</strong> Comparing raw measured consumption, ignoring the weather, shows a higher saving than the real one in a season milder than normal — it credits the technology with what the weather did. We strip that effect out, so we invoice a lower figure than a simple comparison would give."]]
]]
]},
{h: "A second, independent cross-check — linear regression", b: [
["p", "The TMY correction compares <strong>periods</strong> reduced to shared weather. Regression does the same at the level of <strong>individual readings</strong>: it describes the building with an equation in which outdoor temperature is the explanatory variable. These are two mutually independent pieces of evidence for the same effect — and we expect them to agree."],
["ps", "The method also shows how the control strategy changed: how much lower the flow temperature runs in the same weather."],
["d", "Details · model and data", [
["h3", "Input data"],
["p", "A log from the meter and the controller at a fixed time step. The model takes: reading timestamp, outdoor temperature, flow and return temperature, flow rate, and power and energy consumption. We do not aggregate them into months — we work on raw readings, because only those show how the building behaves under specific conditions."],
["h3", "Model"],
["f", [["Regression line", "y = a · x + b"],
["Difference between modes", "Δ(x) = y<sub>weather-comp.</sub>(x) − y<sub>WaterAI</sub>(x)"],
["Reduction", "R(x) = Δ(x) / y<sub>weather-comp.</sub>(x) × 100&nbsp;&nbsp;[%]"]]],
["t", [["Symbol", "Meaning"],
["x", "outdoor temperature at the moment of the reading [°C]"],
["y", "the quantity studied: flow temperature [°C] or power / energy consumption"],
["a", "slope of the line — the building's sensitivity to weather, i.e. how much <em>y</em> rises per degree of drop in outdoor temperature"],
["b", "intercept — the level at 0 °C, i.e. the weather-independent component: settings, thermal inertia, circuit losses"]]],
["p", "Coefficients <em>a</em> and <em>b</em> are fitted by least squares, separately for two sets of readings: operation in <strong>weather-compensation mode</strong> (the existing heating curve) and operation in <strong>WaterAI predictive mode</strong>. Two lines emerge, which we compare at the same outdoor temperature."],
["chart", {alt: "Schematic chart: two regression lines — weather-compensation mode above, WaterAI mode below, the gap between them being the control effect", base: "weather-comp. mode", ai: "WaterAI mode", delta: "Δ(x) — control effect", xl: "lower outdoor temperature", xr: "higher →", cap: "Schematic chart. The gap between the lines is not constant — which is why we present the result as a function of outdoor temperature rather than a single number."}],
["h3", "What we track in parallel"],
["ul", ["<strong>Flow temperature</strong> — evidence that the control strategy changed: in the same weather the building runs at a lower parameter.", "<strong>Power and energy consumption</strong> — evidence that the change in control translated into energy."]],
["p", "The two must be consistent. A drop in flow temperature without a matching drop in energy draw is a warning sign — it usually means longer run times or shifted demand, not a saving."],
["h3", "Conditions for a valid comparison"],
["ul", ["the same outdoor temperature range for both sets — we compare the lines only where both have data,", "exclusion of readings outside the heating season and of shutdown or servicing periods,", "exclusion of transient states after start-up, which distort the relationship,", "a comparable number of points in both sets,", "a check on goodness of fit (coefficient of determination) and residual spread — a poor fit means a factor outside the model is acting on the building and the result needs explaining,", "an identical measurement boundary and the same time step for both modes."]],
["c", ["<strong>Regression is not a basis for invoicing.</strong> We invoice solely by the TMY method, from units read off the billing meter. Regression serves to verify that result, to diagnose the building and to check whether the effect holds over time. If the two methods diverge, we look for the cause before issuing the report — we do not pick the more favourable figure."]]
]]
]},
{h: "Settlement and invoicing", b: [
["ul", ["The value of the saving is the measured quantity of settlement units multiplied by the agreed energy price.", "Our fee is the share of that value set in the contract — and it is the sole line on the invoice.", "The invoice references the report number and the settlement period it covers.", "We settle closed periods only; annual forecasts serve budget planning and are never a basis for invoicing."]],
["d", "Details · report traceability", [
["p", "Every settlement report names explicitly:"],
["ul", ["the weather station and the temperature source together with the data retrieval date,", "the range of years the TMY normals were calculated from,", "the TMY protocol number and the analysis number — every report can be tied to its source material,", "the source of consumption data, i.e. the specific meter or invoices, together with the measurement boundary,", "the temperature T<sub>i</sub> adopted for the baseline and for the settlement period,", "the energy price and the agreed share, stating whether the price is fixed or as invoiced."]],
["fine", "All amounts in the report are net; VAT is added at the rate in force on the date the invoice is issued."]
]]
]},
{h: "When the baseline is adjusted", b: [
["cw", ["<strong>The baseline is never rewritten by the saving achieved.</strong> The result achieved does not become the new reference point — otherwise the effect of the technology would disappear from the settlement year by year."]],
["p", "We adjust the baseline only for changes unrelated to the technology that nevertheless affect consumption."],
["d", "Details · catalogue of changes", [
["ul", ["a change in how the building is used or in operating hours,", "a material change in occupancy or a change of tenants,", "a change in heated floor area,", "work on the building envelope,", "replacement of or addition to the energy source,", "new technology with its own energy draw,", "a change in the agreed indoor temperature T<sub>i</sub>."]],
["fine", "The adjustment runs both ways — including against us. If a change in the building lowers consumption by itself, the baseline is reduced by that effect and it is not settled as a saving from the technology."]
]]
]},
{h: "How we begin", b: [
["steps", [["Input data", "Energy invoices or meter readings from recent seasons — nothing more is needed at this stage."],
["Savings simulation", "Working from your real costs, we show the expected effect and how the benefit is split. A forecast, not a commitment."],
["Analysis and measurement protocol", "We determine the baseline and agree the measurement boundary, T<sub>i</sub>, the energy price and the party shares."],
["Installation and switch-over", "Installation without interrupting the building's operation, a period of running in the existing mode, then the switch to predictive mode. The settlement period runs from that date."],
["Report and settlement", "Once the period closes we issue a report with the full calculation; the invoice references its number."]]]
]}
]
};
