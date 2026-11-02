# Setup y límites de despliegue

## Drive

Carpeta de proyectos: https://drive.google.com/drive/folders/14KsA8scXgN2wDL-HDtFQHS_95LCf1U8s

- Calendario: https://docs.google.com/spreadsheets/d/1OypDck9kNKtTPHOdNWPLCqU9Sjr591a9bL6S3YhjFH0/edit
- Registro de notas: https://docs.google.com/spreadsheets/d/1eH_SMJcaPoA6tEkKakETRKS1TsvGXxHSXHlFB5m02yE/edit
- Código Apps Script Calendario (Markdown autocontenido): [Drive](https://drive.google.com/file/d/15Gy7lV9RJw4AT3kPoOcBK7rwMLjccF5o/view)
- Código Apps Script Registro de notas (Markdown autocontenido): [Drive](https://drive.google.com/file/d/1KPpT-NgigILhG5K5GNfyYgg86wcn85KQ/view)

Las pestañas y encabezados iniciales están creados. Hojas `Inbox` y `Config` se reservan para iteraciones posteriores; este primer backend CRUD escribe directamente en la hoja principal, mientras que las importaciones usan `setValues()`.

## Apps Script vinculado

Cada hoja debe tener su propio proyecto vinculado. Los manuales completos y autocontenidos (código `Code.gs`, manifiesto, pasos de instalación y espacio para la URL `/exec`) están en la carpeta Drive:

- [Calendario - Código Apps Script.md](https://drive.google.com/file/d/15Gy7lV9RJw4AT3kPoOcBK7rwMLjccF5o/view)
- [Registro de notas - Código Apps Script.md](https://drive.google.com/file/d/1KPpT-NgigILhG5K5GNfyYgg86wcn85KQ/view)

El backend usa un arreglo `USUARIOS` dentro de cada `.gs`, con usuarios de ejemplo y claves placeholder. Agregar o quitar cuentas se hace editando ese arreglo. Reemplazá las credenciales directamente en el editor de Apps Script; nunca subas contraseñas reales al repo ni al Markdown de Drive porque son visibles para quien pueda leerlo. Ambos frontends piden usuario y clave y usan sesiones temporales firmadas ligadas a las credenciales; Calendario además sincroniza CRUD con Calendar predeterminado.

Las optimizaciones transversales acordadas están documentadas en [SPEC-PERFORMANCE.md](./SPEC-PERFORMANCE.md) y en la carpeta Drive como [SPEC - Optimizaciones comunes Apps.md](https://drive.google.com/file/d/12aVV2PZQNBvxp9YWgy3iQZs5mPAi9oFw/view). Notas ya pagina con lectura por bloques desde el final; Calendario mantiene escaneo del mes para no perder eventos si la hoja no está ordenada por fecha. Apps Script API no está disponible en esta sesión: los manuales están listos para copiar, pero los proyectos aún no quedaron creados/vinculados automáticamente.

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
