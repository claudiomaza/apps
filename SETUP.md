# Setup operativo

## Repositorio y publicación

- Repo canónico: [`claudiomaza/apps`](https://github.com/claudiomaza/apps). Código, specs, manuales y decisiones viven acá.
- GitHub Pages conserva las rutas canónicas: portada `/apps/`, AGENDA `/apps/agenda/` y MGD `/apps/mgd/`. `/apps/notas/` está retirada; usá `/apps/mgd/`. No existe ruta pública `/apps/calendario/`.
- Los cambios del frontend y los archivos que quedan debajo de las carpetas publicadas pueden actualizar Pages al integrarse a `main`. Mantener secretos, datos y configuración privada fuera del repo público.
- Para iniciar una app nueva, crear su carpeta de frontend en la raíz y su subcarpeta `apps-script/` para `Code.gs`, `appsscript.json` e instrucciones. Aplicar [`SPEC-PERFORMANCE.md`](./SPEC-PERFORMANCE.md).

## Bases de datos en Google Drive

Drive se usa para las hojas operativas de base de datos, no para guardar specs o manuales del proyecto. Cada hoja se identifica con el nombre de su proyecto:

- [Planilla MGD](https://docs.google.com/spreadsheets/d/1d9yL3ZhjdQIxRQEFVXltRA_QtjIZc6UrcO_1NyT1oA4/edit)
- [Planilla AGENDA](https://docs.google.com/spreadsheets/d/1OypDck9kNKtTPHOdNWPLCqU9Sjr591a9bL6S3YhjFH0/edit)

Los datos y la configuración operativa (`Config`, usuarios, calendario de destino, etc.) se mantienen en las hojas según el contrato de cada app. No pegar valores privados en código o documentación pública.

## Apps Script y Pages son despliegues distintos

Cada planilla/proyecto tiene su Apps Script vinculado; el código y el manifiesto se versionan junto al proyecto:

- **MGD**: [guía de Apps Script](./mgd/apps-script/README.md), [`Code.gs`](./mgd/apps-script/Code.gs) y [`appsscript.json`](./mgd/apps-script/appsscript.json). Planilla vinculada: **MGD**.
- **AGENDA**: [guía completa de despliegue](./agenda/apps-script/README.md), [`Code.gs`](./agenda/apps-script/Code.gs), [`Agenda.html`](./agenda/apps-script/Agenda.html) y [`appsscript.json`](./agenda/apps-script/appsscript.json). La misma planilla/proyecto contiene backend y AIO HtmlService; Pages es el segundo frontend. Planilla vinculada: **AGENDA**.

Para cambiar el backend, comparar/copiar el archivo de GitHub al proyecto Apps Script vinculado, revisar scopes, autorizar lo que solicite Google, crear una nueva implementación y probarla. Pages requiere su propia publicación para cambios frontend/config. Un merge, una publicación de Pages y un deployment de Apps Script son estados separados; no declarar E2E hasta probar el backend y el frontend juntos.

Antes de QA funcional, confirmar que el endpoint `API_URL` de cada app corresponde al deployment activo y pasa las pruebas de lectura/autorización del manual específico. No probar escrituras contra datos reales sin autorización expresa. Publicar en GitHub Pages no despliega Apps Script; publicarlo requiere la acción manual descrita por cada proyecto.
