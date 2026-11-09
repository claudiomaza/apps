# Diagnóstico de acceso a Notas — 2026-11-08

## Síntoma
Al enviar el formulario de inicio de sesión, la página recarga en `https://claudiomaza.github.io/apps/notas/?` y vuelve a mostrar los campos vacíos. No se pudo completar una sesión administrativa; no se cargaron ni modificaron registros de Sheets durante la prueba.

## Evidencia reproducible
- Moli 1.1.7 solicitó el documento de `/apps/notas/` y recibió HTTP 200, con título `Registro de notas — Apps`.
- El CSS `/apps/notas/styles.css?v=20261108-mobile-dropdowns1` respondió HTTP 200.
- La traza de red de Moli observó HTTP 404 para los seis scripts referenciados por el HTML: `config.js`, `gradebook.js`, `summary.js`, `stage-store.js`, `xlsx-lazy.js` y `app.js`, todos solicitados en `/apps/notas/<archivo>`.
- Los mismos archivos existen en el nivel raíz de Pages `/apps/<archivo>` y responden HTTP 200. La estructura del repositorio confirma `notas/index.html` junto a `notas/app.js`, mientras que Pages se publica desde la raíz con un nivel más alto.
- El index tiene además un cargador diferido de Excel que referencia `./vendor/xlsx.full.min.js`, pero el vendor vive en la raíz `/apps/vendor/`.
- Consecuencia: `app.js` no se ejecuta, no se instala el listener de `#login-form` ni el request `auth`; el navegador hace submit HTML nativo y recarga, explicando los campos vacíos. Esto coincide con la traza: no hubo request de autenticación del formulario.

## Corrección preparada
Se actualizarán las referencias de scripts del HTML a `../<archivo>.js`, y el cargador de Excel a `../vendor/xlsx.full.min.js`. Añadir pruebas de regresión que exijan esas rutas y volver a ejecutar la suite, además de Moli comprobando status HTTP de assets y el inicio de sesión.

## Límites de la prueba
No se reintentará añadir docentes/estudiantes ni sincronizar Sheets hasta verificar que `app.js` cargó y que el formulario recibe respuesta de autenticación. Mantener datos ficticios y no alterar registros preexistentes.
