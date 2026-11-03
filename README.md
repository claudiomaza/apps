# Apps

Monorepo público para frontends de herramientas internas con Google Apps Script como API sobre Google Sheets. El código y las URLs de los endpoints son públicos; los datos y las operaciones deben protegerse y autorizarse en el backend.

## Apps

- `calendario/`: gestión de eventos.
- `notas/`: registro de calificaciones.
- `gas/`: backend Apps Script de referencia (un proyecto vinculado por hoja; el ID se configura en Script Properties o `appsscript.json` al crear el proyecto).

## Arquitectura inicial

- Frontend estático publicado en GitHub Pages: portada en `/apps/`, Calendario en `/apps/calendario/` y Registro de notas en `/apps/notas/`.
- GAS se ejecuta como propietario. El backend valida usuario y contraseña para cada sesión; antes de habilitar datos reales hay que restringir permisos de las planillas y definir autorización por rol/curso.
- Google Sheets es la fuente de verdad.
- CacheService solo para lecturas regenerables. PropertiesService no se usa como cola de datos.
- CRUD interactivo directo, control optimista por `version` y lock breve alrededor de la comprobación/escritura.
- `setValues()` para lotes/importaciones.

## Estado

Las interfaces se publican en GitHub Pages y usan URLs de Web Apps configuradas en `config.js` (públicas, no secretas). Los proyectos Apps Script vinculados a cada hoja deben tener el código backend actualizado, autorizarse y desplegar una nueva versión. Las credenciales se gestionan en la pestaña `Usuarios` de cada Sheet; no usar datos reales hasta completar las medidas de acceso y autorización.

## Desarrollo local

Abrir cada `index.html` mediante un servidor estático local (no `file://`) para que PWA/fetch se comporten como en hosting. `API_URL` en `config.js` es visible para cualquiera; la autenticación y autorización deben aplicarse en el backend.
