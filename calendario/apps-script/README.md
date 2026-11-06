# Apps Script — Calendario

Este directorio contiene el backend y el manifiesto versionados junto al frontend de Calendario. La planilla de datos permanece en Google Drive: [Calendario](https://docs.google.com/spreadsheets/d/1OypDck9kNKtTPHOdNWPLCqU9Sjr591a9bL6S3YhjFH0/edit).

## Instalar o actualizar el backend

1. Abrí la planilla → **Extensiones → Apps Script**.
2. Reemplazá el contenido del archivo `Code.gs` del proyecto vinculado por [`Code.gs`](./Code.gs). Debe quedar una sola implementación de las funciones globales.
3. Activá «Mostrar el archivo de manifiesto `appsscript.json`» y comparalo/actualizalo con [`appsscript.json`](./appsscript.json); revisá y autorizá los scopes requeridos.
4. Creá una nueva implementación de Web App, ejecutando como propietario y con el acceso configurado para que Pages pueda llamar al endpoint. Copiá el URL `/exec` a `calendario/config.js` solo si el deployment cambió.
5. Probá GET y login/lecturas antes de usar datos reales. Desplegar Apps Script y publicar GitHub Pages son pasos independientes.

No pegues secretos, tokens, contraseñas ni valores operativos de Sheets en GitHub. El `calendarId` vive en la pestaña `Config` de Sheets; las reglas comunes están en [`../../SPEC-PERFORMANCE.md`](../../SPEC-PERFORMANCE.md).

## Nota de fuente

GitHub, en [`claudiomaza/apps`](https://github.com/claudiomaza/apps), es la fuente de verdad para código y documentación. La carpeta de Drive conserva la planilla operativa, no copias de este manual.
