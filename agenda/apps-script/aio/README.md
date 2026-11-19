# Agenda HtmlService integrado

La interfaz HtmlService vive en el mismo proyecto Apps Script vinculado al Sheet que el backend:

- `../Code.gs`: backend único; `doGet(e)` sirve el AIO y `doPost(e)` conserva el API JSON de Pages.
- `../Agenda.html`: interfaz AIO servida por `HtmlService` desde el menú del Sheet.
- `../appsscript.json`: único manifiesto del proyecto, con scopes de Calendar, Sheets y `script.container.ui`.

El AIO llama `runAgendaApi` y `runAgendaMaintenance` mediante `google.script.run`; no hay segundo renderer, URL proxy ni deployment independiente. GitHub Pages sigue llamando al `POST /exec` del mismo backend. El menú ofrece primero «Abrir Agenda» y luego verificar esquema, actualizar vistas y RESET.

La publicación del repo no despliega Apps Script ni modifica la planilla. Claudio despliega manualmente este proyecto vinculado y decide cuándo ejecutar el RESET, siempre tras backup y doble confirmación. Ver `PUBLICAR-SOLO-APPS-SCRIPT.md`.
