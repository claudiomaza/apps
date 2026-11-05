# Apps

Monorepo público para frontends de herramientas internas con Google Apps Script como API sobre Google Sheets. El código y las URLs de los endpoints son públicos; los datos y las operaciones deben protegerse y autorizarse en el backend.

## Apps

- `calendario/`: gestión de eventos; ver [`calendario/README.md`](./calendario/README.md) para configurar el ID de Google Calendar.
- `notas/`: registro de calificaciones; ver [`notas/README.md`](./notas/README.md) para setup, límites y seguridad.
- `gas/`: backend Apps Script de referencia (un proyecto vinculado por hoja; el ID se configura en Script Properties o `appsscript.json` al crear el proyecto).

## Contrato común para apps nuevas

Toda app nueva debe reutilizar el esquema de acceso descrito en [SPEC-PERFORMANCE.md](./SPEC-PERFORMANCE.md): pestaña `Usuarios`, encabezados `usuario` y `pass`, campo de usuario de texto (no email), contraseña de 1–200 caracteres y autenticación consistente en frontend/backend. No crear formularios ni validaciones de login distintos por producto. Además, cada app debe incluir una pestaña `Config` (`key`/`value`) desde su primera versión y leer de ahí los ajustes operativos para no necesitar un redeploy por cambiar valores; seguir el spec para defaults, validación, TTL y límites de seguridad. El código debe favorecer lectura genérica y agnóstica de esas claves, evitando IDs y valores operativos hardcodeados.

## Configuración de Google Calendar

En Calendario, la pestaña `Config` usa `key` / `value`; `calendarId` está en `Config!A5:B5`. Vacía `value`, usa el calendario principal. Para pasos detallados, ver [`calendario/README.md`](./calendario/README.md) y [SETUP.md](./SETUP.md). El backend guarda el ID por evento y no requiere redeploy para cambios posteriores de la celda, una vez que el código actualizado está instalado y desplegado.

## Rendimiento

Las apps combinan autenticación y primera lista en una llamada cuando el backend soporta `includeInitialList`, conservan caché de lecturas efímera y actualizan la UI desde la respuesta del CRUD. El detalle de recorridos por bloques, caché versionada, límites y fallbacks está en [SPEC-PERFORMANCE.md](./SPEC-PERFORMANCE.md). Backend modificado requiere desplegar una nueva versión de Apps Script.

## Caché y persistencia del cliente

Durante desarrollo/cambios en curso, los service workers usan red sin caché local y eliminan las cachés anteriores de la app; una vez estable se activa la política de caché versionada de producción. Los recursos grandes opcionales se cargan bajo demanda. Las dos estrategias de persistencia especificadas son API/backend (hoy Sheets, con sincronización por lotes) y Git/GitHub (commit versionado detrás de un backend seguro); ambas requieren stage explícito en IndexedDB y las mismas operaciones/reglas de Sync. Estado actual, límites y migración pendiente están detallados en [SPEC-PERFORMANCE.md](./SPEC-PERFORMANCE.md).

## Recursos frontend

HTML, CSS, JavaScript, manifest, fuentes e imágenes deben servirse desde GitHub Pages, sin CDNs externos. Preferir APIs nativas del navegador y fuentes del sistema; si una dependencia externa es imprescindible, versionarla dentro del repo y documentar versión, origen, licencia y motivo. La única URL externa de runtime prevista es la API de Apps Script.

## Arquitectura inicial

- Frontend estático publicado en GitHub Pages: portada en `/apps/`, Calendario en `/apps/calendario/` y Registro de notas en `/apps/notas/`.
- GAS se ejecuta como propietario. El backend valida un usuario no vacío (no necesariamente correo) y una contraseña de 1 a 200 caracteres para cada sesión. Los permisos de las planillas y de su carpeta se verificaron restringidos al propietario; Registro de notas aún requiere autorización por rol/curso antes de usar datos reales.
- Google Sheets es la fuente de verdad.
- CacheService solo para lecturas regenerables. PropertiesService no se usa como cola de datos.
- CRUD interactivo directo, control optimista por `version` y lock breve alrededor de la comprobación/escritura.
- `setValues()` para lotes/importaciones.

## Estado

Las interfaces se publican en GitHub Pages y usan URLs de Web Apps configuradas en `config.js` (públicas, no secretas). Los proyectos Apps Script vinculados a cada hoja deben tener el código backend actualizado, autorizarse y desplegar una nueva versión. Las credenciales de acceso se validan en `Usuarios`. En Registro de notas, solo el admin inicial se configura en la hoja; los docentes se crean desde la app con permisos validados por Apps Script. No usar datos reales hasta completar QA de autorizaciones.

## Desarrollo local

Abrir cada `index.html` mediante un servidor estático local (no `file://`) para que PWA/fetch se comporten como en hosting. `API_URL` en `config.js` es visible para cualquiera; la autenticación y autorización deben aplicarse en el backend.
