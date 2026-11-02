# Setup y límites de despliegue

## Drive

Carpeta de proyectos: https://drive.google.com/drive/folders/14KsA8scXgN2wDL-HDtFQHS_95LCf1U8s

- Calendario: https://docs.google.com/spreadsheets/d/1OypDck9kNKtTPHOdNWPLCqU9Sjr591a9bL6S3YhjFH0/edit
- Registro de notas: https://docs.google.com/spreadsheets/d/1eH_SMJcaPoA6tEkKakETRKS1TsvGXxHSXHlFB5m02yE/edit
- Código Apps Script Calendario (Markdown autocontenido): [Drive](https://drive.google.com/file/d/15Gy7lV9RJw4AT3kPoOcBK7rwMLjccF5o/view)
- Código Apps Script Registro de notas (Markdown autocontenido): [Drive](https://drive.google.com/file/d/1KPpT-NgigILhG5K5GNfyYgg86wcn85KQ/view)

Las pestañas y encabezados iniciales están creados. Hojas `Inbox` y `Config` se reservan para iteraciones posteriores; este primer backend CRUD escribe directamente en la hoja principal, mientras que las importaciones usan `setValues()`.

## Apps Script vinculado

Cada hoja debe tener su propio proyecto vinculado (abrir Sheet → Extensiones → Apps Script). Copiar `gas/calendario/Code.gs` y `appsscript.json` al proyecto Calendario; para Notas, copiar los archivos homónimos de `gas/notas/`. Los proyectos deben ejecutarse en V8 y apuntar a los IDs de spreadsheet declarados en el código. Autorizar el acceso a Sheets y revisar logs/testear con datos ficticios.

Apps Script API no está habilitada en el conector disponible en esta sesión; por eso el código queda versionado y también se copiaron manuales `.md` autocontenidos dentro de la carpeta Drive para que puedas crear los proyectos vinculados. Los proyectos todavía NO quedaron creados ni vinculados automáticamente.

## Frontend y publicación

Los archivos de frontend no contienen URLs de backend ni secretos (`config.js` mantiene `API_URL` vacío). La cuenta GitHub es Free y el repo se creó privado. Antes de publicar Pages hay que escoger hosting/visibilidad; no volver público el repo sin consentimiento explícito.

Una vez configurado un backend seguro, asignar la URL de la Web App en cada `config.js`. No desplegar `Acceso: cualquiera` ejecutando como propietario para la app de notas: su contenido es información educativa. El backend de este prototipo no incluye autenticación/autorización por docente, curso u organización, por lo que no debe desplegarse con datos reales.

## Funcionalidad pendiente de esta primera entrega

- El frontend muestra CRUD básico de eventos/notas, pero los endpoints aún requieren pruebas en Apps Script real.
- No incluye sincronización con Google Calendar, importación CSV/XLSX, gestión de roles ni auditoría escolar completa.
- No incluye cola durable ni buffer PropertiesService; CacheService se usa solo para lecturas. Las escrituras interactivas van a Sheets; hay un endpoint de creación por lote con `setValues()`.
- El frontend offline sirve recursos estáticos; no guarda ni sincroniza escrituras offline en esta versión.
- Las respuestas de Apps Script usan JSON vía ContentService; probar CORS/redirecciones desde el hosting elegido antes de habilitar usuarios.

Los manuales `.md` de Drive son la copia de trabajo lista para pegar. Para que repo y Drive queden sincronizados, volveré a subir a Drive el manual actualizado al cambiar una pieza importante del backend; las URLs de endpoints no se guardan en el repo hasta que me las pases.
