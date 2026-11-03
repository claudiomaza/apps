# Setup y límites de despliegue

## GitHub Pages público

Sitio: https://claudiomaza.github.io/apps/

- La portada está en `index.html`; Calendario en `/calendario/` y Registro de notas en `/notas/`.
- Para una app adicional, crear una carpeta con `index.html`, sus recursos y su `config.js`; se servirá bajo `/<carpeta>/` tras publicar en `main`.
- Pages está configurado para desplegar desde la raíz de la rama `main`. Los cambios a esa rama actualizan el sitio.
- Todo lo que se ponga en el repo o en esos frontends es público. No guardar claves, tokens privados ni datos personales allí.

---


## Drive

Carpeta de proyectos: https://drive.google.com/drive/folders/14KsA8scXgN2wDL-HDtFQHS_95LCf1U8s

- Calendario: https://docs.google.com/spreadsheets/d/1OypDck9kNKtTPHOdNWPLCqU9Sjr591a9bL6S3YhjFH0/edit
- Registro de notas: https://docs.google.com/spreadsheets/d/1eH_SMJcaPoA6tEkKakETRKS1TsvGXxHSXHlFB5m02yE/edit
- Spec de optimizaciones comunes: [Drive](https://drive.google.com/file/d/12aVV2PZQNBvxp9YWgy3iQZs5mPAi9oFw/view)
- Código Apps Script Calendario (Markdown autocontenido): [Drive](https://drive.google.com/file/d/15Gy7lV9RJw4AT3kPoOcBK7rwMLjccF5o/view)
- Código Apps Script Registro de notas (Markdown autocontenido): [Drive](https://drive.google.com/file/d/1KPpT-NgigILhG5K5GNfyYgg86wcn85KQ/view)
- Endpoint Web App Notas: `https://script.google.com/macros/s/AKfycbwU11LlONKIliay7ogGZDVrXQLWSV589BhTzhe2Kq2UML3zVBlOi13FryEAnYCynKYv3g/exec`
- Endpoint Web App Calendario: `https://script.google.com/macros/s/AKfycbzxT-VeFBlD-MJ9n2acttT2VYtmbB3cS5YsUkCQstlarMuqGYZi0pi5JppSll0lmM47/exec`

Las pestañas y encabezados iniciales están creados. Hojas `Inbox` y `Config` se reservan para iteraciones posteriores; este primer backend CRUD escribe directamente en la hoja principal, mientras que las importaciones usan `setValues()`.

## Apps Script vinculado

Cada hoja debe tener su propio proyecto vinculado. Los manuales completos y autocontenidos (código `Code.gs`, manifiesto, pasos de instalación y espacio para la URL `/exec`) están en la carpeta Drive:

- [Calendario - Código Apps Script.md](https://drive.google.com/file/d/15Gy7lV9RJw4AT3kPoOcBK7rwMLjccF5o/view)
- [Registro de notas - Código Apps Script.md](https://drive.google.com/file/d/1KPpT-NgigILhG5K5GNfyYgg86wcn85KQ/view)

Cada planilla tiene una pestaña `Usuarios` con encabezados `mail` y `pass`, ya creada y vacía. Agregá una fila por cuenta; el correo debe ser único y la contraseña tener 12 caracteres o más. Una vez instalado el código nuevo y desplegado una nueva versión, los cambios de filas se reflejan en hasta 15 segundos, sin volver a desplegar. La contraseña queda en texto plano.

**Bloqueo de seguridad:** ambos Sheets y su carpeta tienen permiso de lector heredado para todo `mendoza.edu.ar`; Google no permitió quitarlo directamente de cada Sheet. Cualquier lector del dominio podría ver los valores, así que no cargues credenciales hasta resolver el permiso en la carpeta/estructura de Drive. No voy a cambiar los permisos de la carpeta porque afectaría a los otros archivos que contiene. En Registro de notas, además, no hay autorización por curso/rol: no usar datos reales de estudiantes todavía.

Para aplicar el cambio falta copiar el `Code.gs` actualizado del manual a cada proyecto Apps Script y desplegar una nueva versión una vez. Después de eso, administrar filas en `Usuarios` no requiere redeploy.

Las optimizaciones transversales acordadas están documentadas en [SPEC-PERFORMANCE.md](./SPEC-PERFORMANCE.md) y en la carpeta Drive como [SPEC - Optimizaciones comunes Apps.md](https://drive.google.com/file/d/12aVV2PZQNBvxp9YWgy3iQZs5mPAi9oFw/view). Notas ya pagina con lectura por bloques desde el final; Calendario mantiene escaneo del mes para no perder eventos si la hoja no está ordenada por fecha. Apps Script API no está disponible en esta sesión: los manuales están listos para copiar, pero los proyectos aún no quedaron creados/vinculados automáticamente.

## Frontend y publicación

Los archivos `config.js` guardan las URLs públicas de las Web Apps; son configuración pública, no secretos. Para cambiar un endpoint, se edita su `API_URL`; una variable `.env` no llega al navegador en este frontend estático sin agregar un paso de build. El repo GitHub sigue privado; no volverlo público sin consentimiento explícito.

No desplegar `Acceso: cualquiera` ejecutando como propietario para la app de notas: su contenido es información educativa. El backend de este prototipo no incluye autenticación/autorización por docente, curso u organización, por lo que no debe desplegarse con datos reales.

## Funcionalidad pendiente de esta primera entrega

- El frontend muestra CRUD básico de eventos/notas, pero los endpoints aún requieren pruebas en Apps Script real.
- No incluye sincronización con Google Calendar, importación CSV/XLSX, gestión de roles ni auditoría escolar completa.
- No incluye cola durable ni buffer PropertiesService; CacheService se usa solo para lecturas. Las escrituras interactivas van a Sheets; hay un endpoint de creación por lote con `setValues()`.
- El frontend offline sirve recursos estáticos; no guarda ni sincroniza escrituras offline en esta versión.
- Las respuestas de Apps Script usan JSON vía ContentService; probar CORS/redirecciones desde el hosting elegido antes de habilitar usuarios.

Los manuales `.md` de Drive son la copia de trabajo lista para pegar. Para que repo y Drive queden sincronizados, volveré a subir a Drive el manual actualizado al cambiar una pieza importante del backend; las URLs de endpoints no se guardan en el repo hasta que me las pases.
