# Publicar Agenda — un solo proyecto Apps Script

## Composición

Agenda usa **una planilla y un proyecto Apps Script vinculado**. El mismo proyecto contiene el backend `Code.gs`, la interfaz `Agenda.html` y el único `appsscript.json`.

- El menú del Sheet muestra primero **Agenda → Abrir Agenda** y abre el AIO en una ventana HtmlService.
- `doGet(e)` sirve esa interfaz. El GET opcional `?status=1` devuelve el estado/schemaVersion.
- `doPost(e)` sigue siendo el API JSON que usa GitHub Pages.
- La interfaz HtmlService usa `google.script.run` para llamar `runAgendaApi` y `runAgendaMaintenance` en el mismo backend, sin llamadas HTTP a otro deployment.
- Verificar esquema, actualizar vistas y RESET quedan como acciones de menú separadas, debajo de Abrir Agenda.
- GitHub Pages sigue desplegándose desde `main` y usa el URL del Web App backend que está en `agenda/config.js`.

## Archivos del proyecto vinculado

1. En el Apps Script **vinculado al Sheet existente**, reemplazá `Code.gs` por [`../Code.gs`](../Code.gs).
2. Creá/reemplazá el archivo HTML llamado exactamente `Agenda` con [`../Agenda.html`](../Agenda.html).
3. Conservá `appsscript.json` de [`../appsscript.json`](../appsscript.json): es el único manifiesto; contiene los scopes de Sheets, Calendar y `script.container.ui`. No uses el manifiesto mínimo histórico del AIO.
4. Guardá, reautorizá scopes si Apps Script los pide y actualizá el deployment Web App **existente** para mantener su URL `/exec`, que también usa Pages.
5. Recargá la planilla y comprobá que el menú muestre Abrir Agenda primero, seguido por Verificar esquema, Actualizar tablas legibles y RESET.

## RESET y alcance

Antes del RESET, hacé backup de la planilla. El RESET requiere escribir `RESET` y aceptar el segundo diálogo; reemplaza los datos y credenciales de la planilla por el esquema vacío y el usuario admin inicial. No elimina calendarios ni eventos externos de Google Calendar. La contraseña temporal se muestra una sola vez. El usuario ejecuta el RESET manualmente después de desplegar y verificar el backend.

## GitHub Pages y validación

Pages comparte el mismo backend por `POST /exec`; no copies el backend al frontend ni cambies la URL sin actualizar `agenda/config.js`. Publicar GitHub no despliega Apps Script. Los tests sintéticos cubren contratos, pero no sustituyen QA real del deployment, login, origen, permisos y funcionamiento desde ambos frontends. No ejecutar RESET durante QA.
