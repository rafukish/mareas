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
