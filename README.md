# Las Mareas de Jone 🌊

App de mareas para Bilbao (PWA instalable), con datos oficiales del Instituto
Hidrográfico de la Marina (IHM) y reserva automática a Open-Meteo si esa
fuente falla.

## Estructura del proyecto

```
mareas-bilbao/
├── index.html                     ← la app entera (HTML+CSS+JS en un solo archivo)
├── manifest.json                  ← manifest de la PWA (icono, nombre, colores)
├── sw.js                          ← service worker (cache offline)
├── icon-192.png / icon-512.png    ← iconos de la PWA
├── netlify.toml                   ← config de Netlify (indica dónde están las funciones)
└── netlify/
    └── functions/
        └── mareas.js              ← función serverless: descarga y limpia los
                                      datos del IHM (server-side, sin problema de CORS)
```

## Desplegar

1. Sube esta carpeta completa (tal cual, con la subcarpeta `netlify/` incluida)
   a un repositorio de GitHub.
2. En Netlify: **Add new site → Import an existing project** → conecta el
   repositorio. No hace falta configurar build command ni publish directory
   manualmente — `netlify.toml` ya lo indica todo.
3. Netlify detectará automáticamente `netlify/functions/mareas.js` y la
   desplegará como función. No necesita ninguna variable de entorno ni API key.

## Cómo saber si está usando los datos oficiales

Si todo funciona bien, no debería aparecer ningún aviso en el panel inferior
izquierdo. Si ves la etiqueta **"datos estimados (IHM)"** o **"datos
aproximados (Open-Meteo)"**, quiere decir que está cayendo en la reserva —
revisa que la función de Netlify se haya desplegado correctamente.

## Probar en local antes de desplegar

La función serverless SOLO funciona dentro del entorno de Netlify (o
simulándolo). Abrir `index.html` con doble clic (`file://`) no la activa, y
la app caerá a Open-Meteo. Para probarla en local con la función real:

```bash
npm install -g netlify-cli
cd mareas-bilbao
netlify dev
```

## Changelog

A partir de ahora, cada entrega del proyecto añade aquí una entrada nueva
con lo que ha cambiado respecto a la anterior. Las versiones v0.x recogen
todo el historial hasta que empezamos a llevar este changelog; v1.0 en
adelante ya queda documentado entrega a entrega.

### v1.7 — Vivas/muertas por amplitud real, y empates en mareas extremas
El indicador de vivas/medias/muertas usaba la fase lunar como aproximación;
ahora usa la amplitud real de la marea (la misma que ya se mostraba debajo)
con los umbrales exactos: <2.05m muertas, 2.05–2.90m medias, 2.90–3.75m
vivas, >3.75m vivas +. En el panel de mareas extremas, si dos fechas
distintas empatan en la misma cifra máxima o mínima dentro de los próximos
3 meses, ahora se destacan las dos (antes solo se marcaba una, por
comparar por fecha en vez de por valor).

### v1.6 — Regresión de la caché del IHM corregida
El motivo de la respuesta a tu pregunta: la caché del IHM por mes que
arreglamos en la v1.3 se había perdido sin querer en una edición
posterior (se sobrescribió esa función entera al añadir otra cosa, y
volvió a quedar con la validación antigua por horas). Eso hacía que, pasadas
esas horas, la app tuviera que volver a llamar de verdad a la función de
Netlify (y esta al IHM) cada vez que se abría, con el retraso de unos
segundos que se notaba tras el splash. Restaurada la validación por mes;
confirmado con una prueba que la caché ya aguanta semanas sin refrescarse
dentro del mismo mes.

### v1.5 — Retoques de la lista, luna, iPhone y arrastre
En el panel de mareas extremas: título y subtítulo centrados; el día
actual, si aparece en la lista, se marca con un contorno fino; el orden
pasa de "más extrema primero" a cronológico (la más extrema se sigue
destacando, solo cambia el orden de la lista). El indicador de fase lunar
ahora muestra la próxima luna llena y la próxima luna nueva (antes
anterior/próxima), la que llegue primero arriba. Corregido un hueco en
blanco en la parte inferior en iPhone (Safari en modo PWA instalada no
siempre calcula bien `100dvh`; ahora la app se ancla directamente a los
bordes reales de la pantalla). El punto negro ahora se puede arrastrar
tocando cualquier punto de su línea vertical, no solo el punto en sí.

### v1.4 — Pastilla de fuente con color dinámico, y panel de mareas extremas
La pastilla de fuente de datos ahora cambia de color según de dónde vienen
los datos: verde pastel para el IHM (nuevos o de caché), gris para
Open-Meteo, rojo si no se puede obtener ninguno. Antes solo se mostraba en
gris, y encima solo en los casos de reserva/error. Añadido un botón de
información (ⓘ) junto al indicador de vivas/muertas: al pulsarlo, sustituye
todo el cuadrante inferior por un panel con la lista de las pleamares y
bajamares más extremas de los próximos 3 meses (la más extrema de cada
lista, destacada), con un botón X para volver a los cuadrantes normales.
La función de Netlify amplía su rango de meses pedidos al IHM (de 3 a 4:
uno atrás + los 3 próximos) para poder alimentar esta lista con los mismos
datos que ya usa el resto de la app.

### v1.3 — Caché del IHM por mes, no por horas
Detectado que la caché de mareas oficiales (IHM) caducaba cada 3h, aunque
las predicciones no cambian mientras siga cubierto el mes anterior/actual/
siguiente que ya se pidió — eso provocaba esperas de red evitables al
reabrir la app pasadas esas 3h. Ahora la caché del IHM es válida hasta que
cambia el mes de verdad (puede durar semanas sin refrescarse). La caché de
Open-Meteo (solo temperatura, y reserva si el IHM falla) pasa de 3h a 6h.

### v1.2 — Ajustes del tanque: flechas, título y espacio reservado
Las flechitas de tendencia ahora se anclan justo debajo de la etiqueta del
nivel actual (no de la línea de agua real), así nunca se superponen aunque
el tanque esté lleno o vacío del todo. Ahora son 4 en vez de 3, y quedan
bien pegadas a la etiqueta. Añadido un título al cuadrante ("Subiendo" en
rojo / "Bajando" en verde, mismo código de color que el resto de la app),
colocado igual que el título de fecha del cuadrante atmosférico (fijo
arriba, mismo tamaño de fuente). El aviso de cuánto falta para la próxima
marea extrema pasa a ser un único texto fijo debajo del título (antes se
movía arriba/abajo del tanque según pleamar o bajamar), con el mismo
tamaño de fuente que el subtítulo de horas del cuadrante atmosférico.
Tanque ligeramente achatado para que quepa todo bien. Quitadas las
flechitas parpadeantes de dentro del tanque (redundantes con el título en
mayúsculas). Añadida la amplitud de la marea bajo el indicador de
vivas/muertas (el coeficiente se probó y se quitó: no aportaba, con la
amplitud basta). Acortado el texto de la etiqueta "datos aprox.
(Open-Meteo)" para que no desborde a dos líneas en pantallas estrechas.

### v1.1 — Tanque: llenado real, tendencia y aviso de próxima marea
Corregido el bug por el que el tanque nunca llegaba a llenarse ni a
vaciarse del todo (usaba por error el margen de encuadre de la curva en vez
del rango real de pleamar/bajamar). La etiqueta del nivel actual ya no
choca con el contorno del tanque ni con la cifra de fuera. Añadidas
flechitas de tendencia parpadeantes justo bajo la línea de agua, y un aviso
de cuánto falta para la próxima marea extrema (arriba del todo si es
pleamar, abajo del todo si es bajamar).

### v1.0 — Changelog completo añadido al README

### v0.26 — Línea guía del marcador, de verdad hasta abajo
La línea guía pasa a ser un elemento aparte (fuera del SVG de la curva),
para poder atravesar también la fila de bajamares y llegar hasta la escala
de horas — dentro del SVG no podía pasar de su propio borde.

### v0.25 — Fecha fija y reorden del tanque
La fecha del panel queda fija como título (antes podía moverse según cuánto
contenido hubiera debajo). Cuadrante reordenado: máximo/mínimo pegados al
tanque, flechas en los extremos. Línea guía del marcador alargada casi
hasta la escala de horas (primer intento, limitado por estar dentro del SVG).

### v0.24 — Carga más rápida y textos más cortos
La app tardaba en pintar la curva porque esperaba también a la temperatura
del agua aunque las mareas ya estuvieran en caché; ahora la curva se pinta
en cuanto las mareas están listas. Textos acortados para móviles estrechos:
día de la semana abreviado, "mareas medias" en vez de "intermedias", sin la
palabra "Luna" en anterior/próxima.

### v0.23 — Arranque offline corregido
El service worker daba prioridad a la red incluso para la propia app, lo
que la dejaba congelada en la pantalla de carga sin conexión. Ahora usa
caché-primero para la app (carga instantánea) y red-primero solo para los
datos de marea/temperatura.

### v0.22 — Icono propio
Icono de la PWA adaptado a partir de una imagen generada por el usuario;
nombre de la app actualizado en el manifest a "Las Mareas de Jone".

### v0.21 — Arreglado el salto del marcador en el tanque
Al cruzar los bordes de la ventana arrastrando el tanque, el marcador caía
en un punto sin relación con el anterior; ahora continúa exactamente donde
se dejó. Flechas del indicador agrandadas.

### v0.20 — Arreglado el parpadeo al arrastrar la curva
La ventana de la curva cambiaba en cuanto el marcador cruzaba el extremo
central (no solo al llegar al borde real), dando saltos en pleno arrastre.
Vuelve a depender solo de la navegación. Eliminado el swipe horizontal de
la curva (redundante con los botones). Flechas del tanque más grandes y en
cascada.

### v0.19 — Arranque roto corregido y fecha sincronizada
El gráfico se medía antes de que el navegador terminara su primer cálculo
de diseño, dando un tamaño diminuto y un arrastre que no coincidía con lo
que se veía, hasta la primera interacción. La fecha del panel ahora sigue
al marcador arrastrado (antes se quedaba congelada).

### v0.18 — Pleamares y bajamares reordenadas
La fila superior/inferior de información ahora depende de si el extremo es
pleamar o bajamar (antes siempre iba arriba). La marea intermedia deja de
flotar sobre la curva y pasa a la fila que le corresponde.

### v0.17 — Etiqueta de fuente y reordenación del panel
Añadida la etiqueta "datos estimados (IHM)" (mismo formato que la de
Open-Meteo). Panel reordenado: vivas/muertas, temperatura, sol, luna. Más
espacio bajo el título de fecha; tanque más alto.

### v0.16 — Confirmaciones y arreglo del tanque atascado
Confirmado que el huso horario (UTC con conversión automática) y las
alturas oficiales ya estaban bien resueltos. Arreglado el gesto del tanque,
que se quedaba atascado en los extremos de la marea en vez de seguir
avanzando.

### v0.15 — Fuente de datos oficial: IHM
Cambiada la fuente oficial de bilbaoport.eus (raspado de HTML) a la API del
Instituto Hidrográfico de la Marina (ideihm.covam.es), primero en texto
plano y después en JSON con el esquema real confirmado.

### v0.14 — Ajuste de color persistente
Corregido que el color de bajamar seguía saliendo en rojo en las etiquetas
de extremo. Curva afinada un poco más.

### v0.13 — Botones invisibles corregidos
Encontrado y arreglado un bug de CSS (orden de `100dvh`/`100vh`) que dejaba
los botones de navegación fuera de la pantalla visible en algunos móviles.
Título de nuevo en una sola línea, cuadrante ampliado, vivas/muertas
reordenadas bajo la fase lunar.

### v0.12 — Cuadrante de nivel (tanque) y mareas vivas/muertas
Añadido el tanque SVG que se llena y vacía según la marea, e indicador de
mareas vivas/muertas a partir de la fase lunar. Cabecera reducida (emoji y
título más pequeños), fecha bajo el emoji.

### v0.11 — Primera fuente de datos oficial
Detectada la imprecisión de Open-Meteo para Bilbao (mareas cada 6h exactas,
poco realista). Primera función serverless de Netlify: descarga y parsea la
tabla de mareas de bilbaoport.eus (Autoridad Portuaria de Bilbao), con
reserva automática a Open-Meteo si falla.

### v0.10 — Rango horario y reordenación en 3 grupos
El rango horario visible se muestra entre paréntesis junto a la fecha.
Datos del panel reordenados en 3 grupos: temperatura, sol, luna.

### v0.9 — Temperatura del agua
Añadida la temperatura del agua (Open-Meteo), manteniendo las coordenadas
de la bocana del puerto.

### v0.8 — Colores y suavizado
Corregido el color de las bajamares (salían en rojo). Añadido un filtro de
media ponderada para suavizar el ruido de los datos de Open-Meteo.

### v0.7 — Navegación y arrastre
Navegación ±12h con botones y gesto de swipe. El punto "ahora" se puede
arrastrar sobre la curva. Números más grandes. Sistema anti-solapamiento
entre etiquetas.

### v0.6 — Curva más fina y cabecera más grande
Corregido el efecto "escalonado" de la curva (medición exacta del
contenedor + curva Bézier). Cabecera más grande. Más espacio para los
paneles inferiores, menos para la curva.

### v0.5 — Marcador "ahora" y fase lunar
Añadido el punto "ahora" con hora exacta, tendencia y altura. Alturas
también en las etiquetas de pleamar/bajamar. Panel con fase lunar
(anterior/próxima) y duración de la noche.

### v0.4 — Solo 3 mareas visibles
La curva muestra solo 3 mareas consecutivas en vez de un rango fijo más
amplio. Modo día por defecto. Eliminado el coeficiente de marea.

### v0.3 — Modo día/noche y rediseño
Switch de modo día/modo noche. Título "🌊 Las Mareas de Jone". Diseño para
que quepa todo en una pantalla sin scroll.

### v0.2 — Datos reales
Sustituidos los datos de ejemplo por la API Marine de Open-Meteo (gratuita,
sin key): altura del mar real hora a hora, con pleamares/bajamares
detectadas como máximos/mínimos locales.

### v0.1 — Primera versión
Herramienta de mareas en HTML con curva basada en interpolación coseno y
datos de ejemplo, pensada para desplegar en Netlify e instalar como PWA.
Incluye manifest.json, service worker básico e iconos.

