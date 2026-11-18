# Agenda — Apps Script

- `Code.gs`: backend vinculado al Sheet. Conserva `doGet` de estado y `doPost` API; incluye el menú **Agenda → Iniciar app** que abre el AIO en otra pestaña.
- `appsscript.json`: scopes y servicio avanzado del backend vigente.
- [`aio/`](./aio/): frontend autónomo para desplegar como **segundo proyecto Apps Script**; no sustituye al backend.
- `sheet-launcher.test.js`: contrato estático del menú, configuración de URL validada, diálogo con botón y preservación de los endpoints.

Para operar el launcher, desplegar el código vinculado y configurar la propiedad de script `AGENDA_AIO_WEB_APP_URL` con el URL `/exec` del AIO. Esto todavía requiere probarse en QA; publicar el repositorio no activa el menú en la planilla.
