window.I18N = window.I18N || {};
window.I18N["es"] = {
label: "ES", htmlLang: "es",
title: "WaterAI Energy Control — medición y liquidación de ahorros energéticos",
desc: "Cómo medimos y liquidamos los ahorros de energía: corrección al Año Meteorológico Típico y regresión lineal como comprobación. Acceso al panel Energy Control.",
eyebrow: "Energy Control · método de medición y liquidación",
h1: "Ahorro de energía sin inversión propia",
lede: "Usted paga únicamente por la energía que realmente se ahorra — medida en el contador, corregida por el efecto del clima y confirmada por un segundo método independiente. Antes de empezar preparamos una simulación basada en sus costes reales.",
switchIntro: "<strong>¿Quiere saber exactamente cómo calculamos?</strong> Al activar los detalles se despliega en esta página la descripción completa del método: fórmulas, fuentes de datos, orden de los pasos de liquidación y el modelo de regresión.",
toggleOff: "Información detallada",
toggleOn: "Ocultar detalles",
cards: [
["Sin desembolso inicial", "Ninguna inversión por su parte y ninguna intervención en la regulación existente."],
["Pago con el ahorro", "Nuestra retribución es una participación acordada en el valor del ahorro medido."],
["Resultado inmune al clima", "Cada periodo se convierte a las mismas condiciones normalizadas (AMT)."]
],
login: {
title: "Energy Control", sub: "Sistema de medición y liquidación de ahorros energéticos",
email: "Usuario / correo", emailPh: "p. ej. admin@waterai.pl",
pass: "Contraseña", passPh: "Introduzca la contraseña", submit: "Iniciar sesión",
errEmpty: "Introduzca usuario y contraseña.",
mock: "Maqueta — conecte este botón a la lógica de acceso de la aplicación.",
powered: "Powered by WaterAI"
},
langLabel: "Idioma",
aside: [
["¿Todavía no tiene cuenta?", "Las cuentas las crea el administrador. En el panel se ven los resultados de sus instalaciones y, al lado, describimos el método del que salen esos resultados."],
["¿Quiere saber cuánto podría suponer en su caso?", "Prepararemos una simulación de ahorro basada en sus costes reales — bastan las facturas de energía o las lecturas del contador de las últimas temporadas. La simulación es una previsión; liquidamos únicamente lo que muestre la medición al cerrar el periodo."]
],
footer: ["Water AI · waterai.sk · info@waterai.sk", "Esta descripción es informativa; las condiciones vinculantes las fijan el contrato y el protocolo de medición."],
closing: "Al terminar el periodo contractual, todo el efecto de la tecnología queda para usted.",
sections: [
{h: "Qué proponemos", b: [
["p", "Implantamos un control predictivo de la calefacción sobre la instalación existente. El sistema aprende el comportamiento del edificio y su respuesta al clima y se adelanta a la demanda en lugar de reaccionar con retraso. No sustituimos la fuente de calor ni intervenimos en la automatización actual."],
["p", "La liquidación se realiza en modelo ESCO: nosotros asumimos el coste de la implantación y la explotación, y nuestra retribución es una participación en el valor del ahorro confirmado por la medición. Si no hay ahorro, no hay factura."],
["d", "Detalles", [
["p", "El límite de medición se fija antes de empezar y se recoge en el protocolo de medición: solo se liquida la energía que registra el contador designado. Los suministros medidos por separado — el agua caliente sanitaria, por ejemplo — no entran ni en el periodo base ni en la liquidación."],
["p", "Si en paralelo se valora otra tecnología (por ejemplo, tratamiento físico del agua), la evaluamos como un paso independiente con su propia base. Los efectos no se suman en un único indicador, de modo que cada uno pueda defenderse por separado."]
]]
]},
{h: "Simulación antes de empezar — y por qué la cifra llega solo al cerrar el periodo", b: [
["p", "Antes de firmar nada, preparamos una <strong>simulación de ahorro basada en sus costes reales</strong> — a partir de las facturas de energía y de las lecturas del contador de las últimas temporadas. La simulación muestra el orden de magnitud esperable: cuánta energía puede quedarse en el edificio, qué significa eso en dinero a su precio y cómo se reparte ese efecto entre las partes."],
["cw", ["<strong>Una simulación es una previsión, no una promesa.</strong> No indicamos de antemano un porcentaje garantizado, porque el ahorro depende de factores que nadie controla del todo: cómo transcurra el clima en cada temporada, el uso que se dé al edificio, los cambios de ocupación y de horario, el estado de la instalación y las decisiones que se toman sobre el terreno. La cifra firme la damos solo por un periodo cerrado — medida en el contador y corregida por el efecto del clima.", "El riesgo de que la previsión y el resultado se separen lo asumimos nosotros, no usted: facturamos únicamente lo que se ha medido. Si no hay ahorro, no hay factura."]],
["d", "Detalles · alcance de la simulación", [
["h3", "Qué entra en la simulación"],
["ul", ["consumos y costes de las últimas temporadas — de facturas o de lecturas del contador,", "la característica del edificio derivada de esos datos, llevada a condiciones normalizadas (AMT),", "el precio de la energía que paga hoy y el mecanismo de actualización previsto en el contrato,", "el reparto acordado del efecto entre las partes."]],
["h3", "Qué no cubre la simulación"],
["ul", ["cómo transcurrirá el clima en la temporada que viene — desconocido por definición,", "los cambios en su lado: ocupación, horarios, nuevos inquilinos, obras,", "las variaciones del precio de la energía más allá de lo previsto en el contrato,", "las averías y paradas de la instalación."]],
["p", "Por eso presentamos la simulación como un rango y no como una cifra única, e indicamos con qué supuestos se ha elaborado. No es base de liquidación — sirve para tomar la decisión."],
["c", ["<strong>La previsión se verifica después.</strong> Tras el primer periodo cerrado contrastamos la simulación con el resultado medido y mostramos la desviación junto con su causa. Ese mismo material es el que usamos para ajustar la previsión de la temporada siguiente — y con el que se ve si nuestros supuestos eran sólidos."]]
]]
]},
{h: "De dónde sale la cifra que usted paga", b: [
["p", "No comparamos consumos año contra año, porque ese resultado dice sobre todo qué invierno fue más suave. Cada periodo — el base y el de liquidación — se convierte a las mismas condiciones climáticas normalizadas, es decir, al <strong>Año Meteorológico Típico (AMT)</strong>. Solo así, reducidas a un denominador común, las magnitudes son comparables."],
["ps", "La consecuencia es inequívoca: un invierno más suave no puede declararse como ahorro, y un invierno más duro que la norma no penaliza el resultado de la tecnología."],
["d", "Detalles · símbolos y fórmulas", [
["t", [["Símbolo", "Significado"],
["z", "número de días con calefacción activa en el mes"],
["T<sub>i</sub>", "temperatura interior adoptada en el cálculo — parámetro contractual, idéntico para la base y para cada periodo de liquidación"],
["t", "temperatura exterior media durante los días de calefacción del mes (datos reales)"],
["t<sub>AMT</sub>", "temperatura normalizada del mismo mes según el Año Meteorológico Típico"],
["GD", "grados-día — medida de la demanda de calor derivada del clima [°C·días]"],
["Q · Q<sub>s</sub>", "consumo medido y consumo corregido a condiciones normalizadas, expresado en la <strong>unidad de liquidación [u.l.]</strong> — aquella en la que mide el contador y factura el suministrador: kWh, MWh o GJ para calor de red, m<sup>3</sup> para gas"],
["φ", "coeficiente de corrección del periodo"],
["E", "indicador unitario — consumo por cada grado-día normalizado [u.l./GD]"],
["ΔQ", "ahorro medido, en la misma unidad de liquidación que Q"]]],
["f", [["Grados-día", "GD = z × (T<sub>i</sub> − t)&nbsp;&nbsp;[°C·días]"],
["Coeficiente de corrección", "φ = ΣGD<sub>normalizados</sub> / ΣGD<sub>reales</sub>"],
["Consumo corregido", "Q<sub>s</sub> = Q × φ"],
["Indicador unitario", "E = Q<sub>s</sub> / ΣGD<sub>normalizados</sub>&nbsp;&nbsp;[u.l./GD]"],
["Proyección de la base", "Q<sub>base→liq.</sub> = E<sub>base</sub> × ΣGD<sub>normalizados, periodo de liquidación</sub>"],
["Ahorro", "ΔQ = Q<sub>base→liq.</sub> − Q<sub>s, liq.</sub>"]]],
["fine", "Los grados-día normalizados se calculan exactamente igual que los reales — con el mismo número de días de calefacción <em>z</em> y la misma temperatura T<sub>i</sub> — sustituyendo únicamente las temperaturas reales por las del Año Meteorológico Típico. La diferencia entre unos y otros es, por tanto, el efecto puro del clima, nada más."]
]]
]},
{h: "De dónde procede cada magnitud", b: [
["p", "Cada cifra que entra en la liquidación tiene una fuente nombrada y un momento de fijación definido. Es la condición de la reproducibilidad — el informe debe poder recalcularse de forma independiente, sin preguntarnos nada."],
["d", "Detalles · fuentes de datos", [
["t3", [["Magnitud", "Fuente", "Cuándo se fija"],
["Temperaturas reales <span class=\"sym\">t</span>", "estación meteorológica en la ubicación del edificio; el informe indica el nombre de la estación y la fecha de descarga de los datos", "para cada periodo por separado"],
["Normales <span class=\"sym\">t<sub>AMT</sub></span>", "serie de medición plurianual de la ubicación; el informe indica el rango de años con el que se calcularon las normales", "una vez — fijado en el protocolo AMT"],
["Días de calefacción <span class=\"sym\">z</span>", "calendario de la temporada de calefacción del edificio; el mismo valor entra en los grados-día reales y normalizados", "para cada mes del periodo"],
["Temperatura <span class=\"sym\">T<sub>i</sub></span>", "parámetro contractual recogido en el protocolo de medición", "una vez — idéntico para la base y todos los periodos"],
["Consumo <span class=\"sym\">Q</span>", "contador de facturación o facturas del suministrador, siempre indicando el límite de medición", "para cada periodo"],
["Precio de la energía", "protocolo de medición; indicamos si es un precio fijo o el precio real facturado", "una vez, con el mecanismo de actualización fijado en el contrato"],
["Participación de las partes", "el contrato", "una vez"]]]
]],
["psfine", "Al activar los detalles verá el desglose completo: qué procede de la estación meteorológica, qué del contador y qué del protocolo de medición."]
]},
{h: "El periodo base — el punto de referencia", b: [
["p", "La base se determina a partir de tres temporadas de calefacción completas anteriores a la implantación. Ahora bien, la base no es el consumo expresado en unidades de liquidación, sino el <strong>indicador unitario E</strong> — el consumo por cada grado-día normalizado. Esa magnitud no depende ni del clima ni de la duración del periodo."],
["d", "Detalles · cómo se construye la base", [
["ul", ["Cada una de las tres temporadas se convierte por separado al AMT y se determina su indicador E.", "La base es la media aritmética de los indicadores de esas temporadas.", "Comprobamos la dispersión de los indicadores en torno a la media — es la prueba de calidad de la base."]],
["p", "Una dispersión pequeña significa que el edificio no cambió en su explotación durante esos años y que la base es consistente. Una claramente mayor indica que algo cambió en la serie — inquilino, superficie, horarios — y entonces corregimos la base o acortamos la serie. No aceptamos una base a ciegas."]
]]
]},
{h: "Cómo se liquida un periodo", b: [
["steps", [["Grados-día del periodo", "Determinamos los grados-día reales y los normalizados. La pregunta: ¿qué clima hubo realmente y cuál habría habido en la norma?"],
["Corrección del consumo", "Calculamos el coeficiente φ y llevamos el consumo medido a condiciones normalizadas."],
["Proyección de la base", "Proyectamos la base sobre el mismo periodo: ¿cuánto habría consumido el edificio ahora si hubiera mantenido su característica anterior a la implantación?"],
["Ahorro", "La diferencia entre ambas magnitudes es la energía realmente ahorrada."],
["Comprobación por otra vía", "El mismo resultado debe salir a través de la caída del indicador E."]]],
["d", "Detalles · por qué exactamente así", [
["p", "El <strong>paso 3</strong> resuelve además el problema de los periodos de distinta duración. La base se proyecta exactamente sobre el periodo que se liquida y no se compara con un año completo — lo que permite liquidar una temporada acortada, desplazada o interrumpida sin distorsionar el resultado."],
["p", "El <strong>paso 5</strong> es incondicional. Si ambas vías no dan el mismo resultado, el informe contiene un error y no se emite. Es un control interno por nuestra parte, no una formalidad."],
["c", ["<strong>La corrección al AMT actúa a su favor.</strong> Comparar los consumos medidos sin tener en cuenta el clima muestra, en una temporada más suave que la norma, un ahorro mayor que el real — atribuye a la tecnología lo que hizo el clima. Nosotros retiramos ese efecto del resultado, así que facturamos una cifra menor de la que daría la comparación simple."]]
]]
]},
{h: "Segundo método de control independiente — regresión lineal", b: [
["p", "La corrección al AMT compara <strong>periodos</strong> reducidos a un clima común. La regresión hace lo mismo a nivel de <strong>lecturas individuales</strong>: describe el edificio mediante una ecuación en la que la temperatura exterior es la variable explicativa. Son dos pruebas independientes entre sí del mismo efecto — y esperamos que digan lo mismo."],
["ps", "El método muestra además cómo ha cambiado la forma de regular: cuánto más baja trabaja la temperatura de impulsión con el mismo clima."],
["d", "Detalles · modelo y datos", [
["h3", "Datos de entrada"],
["p", "Registro del contador y del controlador con paso de tiempo constante. Al modelo entran: marca de tiempo de la lectura, temperatura exterior, temperaturas de impulsión y retorno, caudal, y potencia y consumo de energía. No los agregamos por meses — trabajamos con lecturas en bruto, porque solo ellas muestran cómo se comporta el edificio en condiciones concretas."],
["h3", "Modelo"],
["f", [["Recta de regresión", "y = a · x + b"],
["Diferencia entre modos", "Δ(x) = y<sub>compensación</sub>(x) − y<sub>WaterAI</sub>(x)"],
["Reducción", "R(x) = Δ(x) / y<sub>compensación</sub>(x) × 100&nbsp;&nbsp;[%]"]]],
["t", [["Símbolo", "Significado"],
["x", "temperatura exterior en el momento de la lectura [°C]"],
["y", "magnitud estudiada: temperatura de impulsión [°C] o potencia / consumo de energía"],
["a", "pendiente de la recta — sensibilidad del edificio al clima, es decir, cuánto sube <em>y</em> por cada grado de caída de la temperatura exterior"],
["b", "término independiente — el nivel a 0 °C, es decir, la componente ajena al clima: consignas, inercia, pérdidas del circuito"]]],
["p", "Los coeficientes <em>a</em> y <em>b</em> se ajustan por mínimos cuadrados, por separado para dos conjuntos de lecturas: el funcionamiento en <strong>modo de compensación climática</strong> (la curva de calefacción existente) y el funcionamiento en <strong>modo predictivo WaterAI</strong>. Resultan dos rectas que comparamos a la misma temperatura exterior."],
["chart", {alt: "Gráfico esquemático: dos rectas de regresión — modo de compensación climática arriba, modo WaterAI abajo, y la separación entre ambas es el efecto de la regulación", base: "modo compensación", ai: "modo WaterAI", delta: "Δ(x) — efecto de la regulación", xl: "temperatura exterior más baja", xr: "más alta →", cap: "Gráfico esquemático. La separación entre las rectas no es constante — por eso presentamos el resultado como función de la temperatura exterior y no como una única cifra."}],
["h3", "Qué seguimos en paralelo"],
["ul", ["<strong>Temperatura de impulsión</strong> — prueba de que ha cambiado la regulación: con el mismo clima el edificio trabaja con un parámetro más bajo.", "<strong>Potencia y consumo de energía</strong> — prueba de que el cambio de regulación se tradujo en energía."]],
["p", "Ambas magnitudes deben ser coherentes. Una caída de la temperatura de impulsión sin la correspondiente caída del consumo es una señal de alarma — suele significar tiempos de funcionamiento más largos o demanda desplazada, no ahorro."],
["h3", "Condiciones para una comparación válida"],
["ul", ["el mismo rango de temperaturas exteriores en ambos conjuntos — las rectas se comparan solo donde ambos tienen datos,", "exclusión de lecturas fuera de la temporada de calefacción y de los periodos de parada y mantenimiento,", "exclusión de los estados transitorios tras el arranque, que distorsionan la relación,", "un número comparable de puntos en ambos conjuntos,", "control del ajuste (coeficiente de determinación) y de la dispersión de los residuos — un ajuste débil significa que actúa un factor ajeno al modelo y que el resultado exige explicación,", "un límite de medición idéntico y el mismo paso de tiempo para ambos modos."]],
["c", ["<strong>La regresión no es base de facturación.</strong> Facturamos exclusivamente por el método AMT, con las unidades leídas en el contador de facturación. La regresión sirve para verificar ese resultado, para diagnosticar el edificio y para comprobar si el efecto se mantiene en el tiempo. Si ambos métodos divergen, buscamos la causa antes de emitir el informe — y no elegimos la cifra más favorable."]]
]]
]},
{h: "Liquidación y factura", b: [
["ul", ["El valor del ahorro es la cantidad medida de unidades de liquidación multiplicada por el precio acordado de la energía.", "Nuestra retribución es la participación en ese valor fijada en el contrato — y es la única línea de la factura.", "La factura remite al número del informe y al periodo de liquidación al que corresponde.", "Solo liquidamos periodos cerrados; las previsiones anuales sirven para planificar el presupuesto y nunca son base de facturación."]],
["d", "Detalles · trazabilidad del informe", [
["p", "En cada informe de liquidación se nombran expresamente:"],
["ul", ["la estación meteorológica y la fuente de temperaturas junto con la fecha de descarga de los datos,", "el rango de años con el que se calcularon las normales AMT,", "el número del protocolo AMT y el número del análisis — cada informe puede vincularse a su material de origen,", "la fuente de los datos de consumo, es decir, el contador concreto o las facturas, junto con el límite de medición,", "la temperatura T<sub>i</sub> adoptada para la base y para el periodo de liquidación,", "el precio de la energía y la participación acordada, indicando si el precio es fijo o el facturado."]],
["fine", "Todos los importes del informe son netos; el IVA se aplica al tipo vigente el día de emisión de la factura."]
]]
]},
{h: "Cuándo se ajusta la base", b: [
["cw", ["<strong>La base nunca se reescribe con el ahorro conseguido.</strong> El resultado alcanzado no pasa a ser el nuevo punto de referencia — de lo contrario, el efecto de la tecnología desaparecería de la liquidación año tras año."]],
["p", "Ajustamos la base únicamente ante cambios ajenos a la tecnología que, sin embargo, afectan al consumo."],
["d", "Detalles · catálogo de cambios", [
["ul", ["cambio en el uso del edificio o en los horarios de funcionamiento,", "cambio significativo de ocupación o cambio de inquilinos,", "cambio de la superficie calefactada,", "intervención en la envolvente del edificio,", "sustitución o ampliación de la fuente de energía,", "nueva tecnología con consumo propio de energía,", "cambio de la temperatura interior acordada T<sub>i</sub>."]],
["fine", "El ajuste opera en ambos sentidos — también en nuestra contra. Si un cambio en el edificio reduce el consumo por sí mismo, la base se minora en ese efecto y este no se liquida como ahorro de la tecnología."]
]]
]},
{h: "Cómo empezamos", b: [
["steps", [["Datos de entrada", "Facturas de energía o lecturas del contador de las últimas temporadas — en esta fase no hace falta nada más."],
["Simulación de ahorro", "Sobre sus costes reales mostramos el efecto esperable y el reparto del beneficio. Es una previsión, no un compromiso."],
["Análisis y protocolo de medición", "Determinamos la base y fijamos el límite de medición, T<sub>i</sub>, el precio de la energía y la participación de las partes."],
["Instalación y conmutación", "Montaje sin interrumpir la actividad del edificio, un periodo de funcionamiento en el modo actual y después el paso al modo predictivo. Desde esa fecha corre el periodo de liquidación."],
["Informe y liquidación", "Al cerrarse el periodo emitimos un informe con el cálculo completo; la factura remite a su número."]]]
]}
]
};
