# Agenda — Apps Script

- [`Code.gs`](./Code.gs): backend canónico único, vinculado al Sheet. Conserva `doGet` de estado y `doPost` API; contiene autenticación, permisos, operaciones Calendar/Sheets, mantenimiento y el menú **Agenda → Iniciar app**.
- [`appsscript.json`](./appsscript.json): manifiesto/scopes del backend vigente; los scopes Calendar/Sheets y `script.container.ui` pertenecen a este proyecto.
- [`aio/`](./aio/): fuentes complementarias para un **segundo proyecto Apps Script renderer**: HTML, `Render.gs`, manifiesto mínimo, guía e integridad/tests. `Render.gs` no sustituye ni duplica el backend `Code.gs`.
- Tests del backend: `sheet-launcher.test.js`, `agenda-database-maintenance.test.js`, `multi-calendar.test.js`, `calendar-invitation.test.js` y `multi-calendar-ui.test.js`.

Para abrir el renderer desde el Sheet, el launcher del backend lee `AGENDA_AIO_WEB_APP_URL` desde Script Properties. Configurar con el `/exec` del proyecto AIO que se despliega por separado. Publicar GitHub no cambia Apps Script ni activa el menú en la planilla.

**Estado del esquema:** `main` aún contiene el backend legacy con pestañas operativas separadas. La decisión nueva de normalizar sobre `Registros/dataJson` y RESET sin DB legacy está acordada pero sigue pendiente de implementación completa, pruebas y publicación. Consultar `../agente/agent.md` y `../../SPEC-PERFORMANCE.md`; no inferir que este README significa que el backend activo esté actualizado.
