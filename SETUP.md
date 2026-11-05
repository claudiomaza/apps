# Setup y límites de despliegue

## GitHub Pages público

Sitio: https://claudiomaza.github.io/apps/

- La portada está en `index.html`; Calendario en `/calendario/` y Registro de notas en `/notas/`.
- Para una app adicional, crear una carpeta con `index.html`, sus recursos y su `config.js`; se servirá bajo `/<carpeta>/` tras publicar en `main`.
- Pages está configurado para desplegar desde la raíz de la rama `main`. Los cambios a esa rama actualizan el sitio.
- El repositorio y todo lo que se publique en Pages es público. No guardar claves, tokens privados ni datos personales allí.

---


## Drive

Carpeta de proyectos: https://drive.google.com/drive/folders/14KsA8scXgN2wDL-HDtFQHS_95LCf1U8s

- Calendario: https://docs.google.com/spreadsheets/d/1OypDck9kNKtTPHOdNWPLCqU9Sjr591a9bL6S3YhjFH0/edit
- Registro de notas: https://docs.google.com/spreadsheets/d/1eH_SMJcaPoA6tEkKakETRKS1TsvGXxHSXHlFB5m02yE/edit
- Spec de optimizaciones comunes: [Drive](https://drive.google.com/file/d/12aVV2PZQNBvxp9YWgy3iQZs5mPAi9oFw/view)
- Código Apps Script Calendario (Markdown autocontenido): [Drive](https://drive.google.com/file/d/15Gy7lV9RJw4AT3kPoOcBK7rwMLjccF5o/view)
- Código Apps Script Registro de notas (Markdown autocontenido): [Drive](https://drive.google.com/file/d/1KPpT-NgigILhG5K5GNfyYgg86wcn85KQ/view)
- Endpoint Web App Notas: `https://script.google.com/macros/s/AKfycbwU11LlONKIliay7ogGZDVrXQLWSV589BhTzhe2Kq2UML3zVBlOi13FryEAnYCynKYv3g/exec`
- Endpoint Web App Calendario: `https://script.google.com/macros/s/AKfycbzYPWb7ud4mTepnlUUdmpxg0x9bQF3AwaCe-D6WMnRSwwKoQm58m5gbiUmTUpNJIhS8/exec`

Las pestañas y encabezados iniciales están creados. **Regla para todas las apps:** crear desde el inicio una pestaña `Config` con encabezados `key` / `value` para valores operativos cambiables sin redeploy; el backend los lee por clave usando la capa genérica descrita en [SPEC-PERFORMANCE.md](./SPEC-PERFORMANCE.md), con defaults, validación y caché breve. `Config` no debe contener secretos. En Calendario, `calendarId` está en `Config!A5:B5` y apunta al calendario dedicado “Agenda de la app”. Para elegir otro: Google Calendar web → ⚙️ Configuración → seleccioná el calendario en la columna izquierda → Integrar el calendario → copiá “ID del calendario” y pegalo en `Config!B5`. No pegues el ID en GitHub. Vaciar B5 vuelve al calendario principal. El backend lee la clave por nombre, así que podés mover la fila. Los cambios se aplican en hasta 30 segundos o inmediatamente al ejecutar `limpiarCacheConfig()` en Apps Script.

## Apps Script vinculado

Cada hoja debe tener su propio proyecto vinculado. Los manuales completos y autocontenidos (código `Code.gs`, manifiesto, pasos de instalación y espacio para la URL `/exec`) están en la carpeta Drive:

- [Calendario - Código Apps Script.md](https://drive.google.com/file/d/15Gy7lV9RJw4AT3kPoOcBK7rwMLjccF5o/view)
- [Registro de notas - Código Apps Script.md](https://drive.google.com/file/d/1KPpT-NgigILhG5K5GNfyYgg86wcn85KQ/view)

Calendario usa `Usuarios` con dos columnas (`usuario` y `pass`). Registro de notas usa seis columnas exactas (`usuario`, `pass`, `rol`, `alcances`, `mail`, `nombre`): solo el admin inicial se carga manualmente; docentes, datos de perfil y alcances se crean desde la app y Apps Script valida que esas operaciones las ejecute una sesión admin. El contrato común obligatorio para apps nuevas está en [SPEC-PERFORMANCE.md](./SPEC-PERFORMANCE.md). El usuario no puede estar vacío, debe ser único sin distinguir mayúsculas y no superar 254 caracteres; máximo 200 cuentas. La contraseña puede tener cualquier carácter y una longitud de 1 a 200 caracteres; se conserva exactamente como se escribe (incluidos espacios y mayúsculas). No dejes filas parcialmente completadas. Un intento de login devuelve `USERS_SHEET_INVALID` y no entra si una fila no respeta las reglas del esquema de esa app. Una vez instalado el código actualizado en cada proyecto y desplegada una nueva versión de la Web App, los cambios de filas se reflejan según el TTL de caché de cada backend. La contraseña queda en texto plano; no compartas el Sheet con docentes.

**Permisos verificados:** los dos Sheets y la carpeta `apps` muestran actualmente solo tu cuenta como propietaria; no aparece el permiso de lector para todo `mendoza.edu.ar`. Si cambiás la ubicación o los permisos de la carpeta, volvé a revisar los permisos efectivos de cada planilla antes de guardar contraseñas. Las claves están en texto plano y deben quedar visibles solo para administradores confiables. Registro de notas implementa autorización por rol y alcance en el backend incluido; habilitar datos reales requiere copiar ese código al proyecto vinculado, desplegar una nueva versión y completar QA con dos docentes aislados.

El `Code.gs` del repo ya lee `Config!calendarId`; la fila `Config!A5:B5` está creada y B5 apunta al calendario dedicado “Agenda de la app”. Para activar esta función hay que copiar el `Code.gs` actualizado al proyecto Apps Script de Calendario, revisar/autorizarlos permisos solicitados y desplegar una nueva versión. Si se cambia el ID en B5, el backend lo toma en hasta 30 segundos o al ejecutar `limpiarCacheConfig()`. El ID vive en el Sheet, no en GitHub.

Las optimizaciones transversales acordadas están documentadas en [SPEC-PERFORMANCE.md](./SPEC-PERFORMANCE.md) y en la carpeta Drive como [SPEC - Optimizaciones comunes Apps.md](https://drive.google.com/file/d/12aVV2PZQNBvxp9YWgy3iQZs5mPAi9oFw/view). Notas pagina con lectura por bloques desde el final y obtiene `maxPageSize`/`maxBatchSize` de `Config`; Calendario mantiene escaneo del mes para no perder eventos si la hoja no está ordenada por fecha y obtiene `calendarId` de `Config`. Los proyectos Apps Script deben mantenerse sincronizados con los manuales: copiar `Code.gs` y desplegar una nueva versión cuando cambie el backend.

## Frontend y publicación

Los archivos `config.js` guardan las URLs públicas de las Web Apps; son configuración pública, no secretos. HTML, CSS, JavaScript, manifest, librerías, fuentes e imágenes deben servirse desde GitHub Pages; no cargar dependencias de CDNs externos. Preferir APIs nativas y fuentes del sistema. Si una librería fuera imprescindible, versionarla en el repo y documentar versión, origen, licencia y necesidad. La única solicitud cross-origin prevista es el endpoint de Apps Script. En QA, revisar Network y confirmar que no haya requests a CDNs. Para cambiar `API_URL`, editar `config.js`; `.env` no llega al navegador sin build. El repo y Pages son públicos, así que no poner allí datos personales, credenciales ni IDs de configuración que el usuario quiera mantener fuera del código.

## Elegir el calendario de destino

1. Abrí la hoja [Calendario](https://docs.google.com/spreadsheets/d/1OypDck9kNKtTPHOdNWPLCqU9Sjr591a9bL6S3YhjFH0/edit), pestaña `Config`.
2. Buscá la fila `calendarId` en la columna A; el valor se escribe en B (actualmente `Config!B5`).
3. En Google Calendar web, abrí ⚙️ **Configuración**, elegí el calendario en la columna izquierda, entrá a **Integrar el calendario** y copiá **ID del calendario**. Pegá el ID completo en `Config!B5`. Actualmente está seleccionado “Agenda de la app”.
4. Si Apps Script corre como otra cuenta, compartí el calendario con esa cuenta con permiso **Realizar cambios en los eventos**. No alcanza con pegar el ID si el script no puede acceder.
5. No publiques el ID en GitHub ni lo pegues en `config.js`. El backend busca el valor de Config y lo cachea hasta 30 segundos; `limpiarCacheConfig()` lo invalida inmediatamente. Dejar B5 vacío vuelve al calendario principal.
6. El backend actualizado debe estar copiado, autorizado y desplegado al menos una vez. Cambiar B5 después no requiere redeploy. Cambiar `Code.gs` o scopes sí requiere nueva versión de Apps Script y puede pedir autorización.
7. Cada evento nuevo guarda su `calendarId` en la hoja `Eventos`; editar/eliminar utiliza ese destino almacenado. Cambiar la configuración no mueve eventos ya existentes.

La configuración de Google Calendar es específica de Calendario; Registro de notas no integra Calendar.

La Web App de Registro de notas puede tener acceso anónimo como transporte, pero toda API requiere sesión firmada; las operaciones de administración exigen rol admin y las lecturas/escrituras académicas se limitan por alcance. El proyecto Apps Script publicado debe actualizarse con `gas/notas/GradebookBackend.gs`, y la autenticación con `cmaza` debe devolver `access` y `profile`, antes de habilitar datos reales.

## Funcionalidad pendiente de esta primera entrega

- El frontend muestra CRUD básico de eventos/notas. Para que el login nuevo funcione, copiá el código actualizado a cada proyecto Apps Script y desplegá una nueva versión.
- Calendario sincroniza eventos en Google Calendar. El destino se configura en la pestaña `Config` con la clave `calendarId`; vacío conserva el calendario principal.
- No incluye cola durable ni buffer PropertiesService; CacheService se usa solo para lecturas. Las escrituras interactivas van a Sheets; hay un endpoint de creación por lote con `setValues()`.
- El frontend offline sirve recursos estáticos; no guarda ni sincroniza escrituras offline en esta versión.
- Las respuestas de Apps Script usan JSON vía ContentService; probar CORS/redirecciones desde GitHub Pages antes de habilitar usuarios.

Los manuales `.md` de Drive son la copia de trabajo lista para pegar. Para que repo y Drive queden sincronizados, volveré a subir a Drive el manual actualizado al cambiar una pieza importante del backend; las URLs de endpoints no se guardan en el repo hasta que me las pases.
