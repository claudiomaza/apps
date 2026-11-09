# Setup operativo

## Repositorio y publicación

- Repo canónico: [`claudiomaza/apps`](https://github.com/claudiomaza/apps). Código, specs, manuales y decisiones viven acá.
- GitHub Pages conserva las rutas: portada `/apps/`, Calendario `/apps/calendario/`, Registro de notas `/apps/notas/`.
- Los cambios del frontend y los archivos que quedan debajo de las carpetas publicadas pueden actualizar Pages al integrarse a `main`. Mantener secretos, datos y configuración privada fuera del repo público.
- Para iniciar una app nueva, crear su carpeta de frontend en la raíz y su subcarpeta `apps-script/` para `Code.gs`, `appsscript.json` e instrucciones. Aplicar [`SPEC-PERFORMANCE.md`](./SPEC-PERFORMANCE.md).

## Bases de datos en Google Drive

Drive se usa para las hojas operativas de base de datos, no para guardar specs o manuales del proyecto:

- [notas](https://docs.google.com/spreadsheets/d/1d9yL3ZhjdQIxRQEFVXltRA_QtjIZc6UrcO_1NyT1oA4/edit)
- [Calendario](https://docs.google.com/spreadsheets/d/1OypDck9kNKtTPHOdNWPLCqU9Sjr591a9bL6S3YhjFH0/edit)

Los datos y la configuración operativa (`Config`, usuarios, calendario de destino, etc.) se mantienen en las hojas según el contrato de cada app. No pegar valores privados en código o documentación pública.

## Apps Script y Pages son despliegues distintos

Cada Sheet tiene un Apps Script vinculado propio. El código fuente de backend y el manifiesto se versionan junto a la app:

- [Registro de notas: instalación](./notas/apps-script/README.md), [`Code.gs`](./notas/apps-script/Code.gs), [`appsscript.json`](./notas/apps-script/appsscript.json).
- [Calendario: instalación](./calendario/apps-script/README.md), [`Code.gs`](./calendario/apps-script/Code.gs), [`appsscript.json`](./calendario/apps-script/appsscript.json).

Para cambiar el backend, comparar/copiar el archivo de GitHub al proyecto Apps Script vinculado, revisar scopes, autorizar lo que solicite Google, crear una nueva implementación y probarla. Pages requiere su propia publicación para cambios frontend/config. Un merge, una publicación de Pages y un deployment de Apps Script son estados separados; no declarar E2E hasta probar el backend y el frontend juntos.

Antes de QA funcional, confirmar que el endpoint `API_URL` de la app corresponde al deployment activo y que pasa las pruebas de lectura/autorización descritas en el manual específico. No probar escrituras contra datos reales sin autorización expresa.
