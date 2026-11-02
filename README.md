# Apps

Monorepo privado para herramientas internas con frontend estático y Google Apps Script como API sobre Google Sheets.

## Apps

- `calendario/`: gestión de eventos.
- `notas/`: registro de calificaciones.
- `gas/`: backend Apps Script de referencia (un proyecto vinculado por hoja; el ID se configura en Script Properties o `appsscript.json` al crear el proyecto).

## Arquitectura inicial

- Frontend separado y estático; las páginas pueden publicarse en Pages cuando se decida hacer público el repositorio o se configure otro hosting.
- GAS ejecutado como propietario; no desplegar con acceso público hasta definir autenticación/controles de acceso.
- Google Sheets es la fuente de verdad.
- CacheService solo para lecturas regenerables. PropertiesService no se usa como cola de datos.
- CRUD interactivo directo, control optimista por `version` y lock breve alrededor de la comprobación/escritura.
- `setValues()` para lotes/importaciones.

## Estado

Las interfaces son prototipos funcionales en modo local. No contienen URLs de web apps desplegadas ni credenciales. Las hojas de Drive se prepararon por separado. Apps Script debe cargarse como proyecto vinculado a cada hoja, autorizarse, probarse y desplegarse con controles de acceso antes de usar datos reales.

## Desarrollo local

Abrir cada `index.html` mediante un servidor estático local (no `file://`) para que PWA/fetch se comporten como en hosting. Configurar `API_URL` en `config.js` solo después de desplegar y proteger el backend.
