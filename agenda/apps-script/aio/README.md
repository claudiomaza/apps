# Agenda AIO (All-in-One)

Frontend autónomo de Agenda servido desde un **proyecto Apps Script frontend separado**. La interfaz está integrada en `Agenda.html.md`; el `Code.gs` de este proyecto solo entrega la página y la dirige al backend Apps Script vigente.

- `Agenda.html.md`: HTML completo para pegar en el archivo `Agenda` del proyecto frontend nuevo.
- `Code.gs.md`: `doGet` mínimo del proyecto frontend; el endpoint se abre para mostrar la UI, no es API.
- `PUBLICAR-SOLO-APPS-SCRIPT.md`: instrucciones para crear y desplegar esa UI independiente.
- `appsscript.json.md`: manifiesto mínima del proyecto UI (solo `script.external_request`).
- `standalone-html.test.js`: verifica HTML, assets, integridad de Excel, separación del backend y sintaxis JS.

**No** copiar ni modificar desde aquí el backend, su `doGet`/`doPost`, manifiesto, scopes ni deploy vigente. La comprobación en HtmlService y la comunicación desde el origen nuevo hacia el backend (CORS, permisos, login y una operación QA) siguen pendientes: este paquete no implica migración ni despliegue.


El Sheet vinculado puede abrir esta UI desde el menú «Agenda → Iniciar app». El launcher está en el `Code.gs` del backend versionado y lee `AGENDA_AIO_WEB_APP_URL` desde Script Properties; requiere desplegar el backend vinculado y configurar el `/exec` AIO. No se activa por subir archivos a GitHub.


Cuando el usuario inicial autenticado `cmaza` está en una sesión, la UI ofrece «Mantenimiento del Sheet»: reparación sin borrar datos, actualización de vistas legibles o RESET con doble confirmación. Esas acciones se hacen por el backend vinculado; el `Code.gs` de esta carpeta sigue siendo solo el renderer HtmlService.


El proxy de mantenimiento en `Code.gs.md` necesita solo `script.external_request`; `appsscript.json.md` da el manifiesto mínimo del frontend. No incorporar en este segundo proyecto los scopes Calendar/Sheets del backend.
