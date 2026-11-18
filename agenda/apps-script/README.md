# Agenda — Apps Script

- `Code.gs`: backend vinculado al Sheet. Conserva `doGet` de estado y `doPost` API; incluye el menú **Agenda → Iniciar app** que abre el AIO en otra pestaña.
- `appsscript.json`: scopes y servicio avanzado del backend vigente; `script.container.ui` habilita el menú/diálogos del Sheet.
- [`aio/`](./aio/): frontend autónomo para desplegar como **segundo proyecto Apps Script**; no sustituye al backend.
- `sheet-launcher.test.js`: contrato del menú, URL validada y preservación de endpoints. `agenda-database-maintenance.test.js`: vistas derivadas, redacción de credenciales y gates de reset.

Para operar el launcher, desplegar el código vinculado y configurar la propiedad de script `AGENDA_AIO_WEB_APP_URL` con el URL `/exec` del AIO. Esto todavía requiere probarse en QA; publicar el repositorio no activa el menú en la planilla.


La estructura de Agenda conserva pestañas operativas normalizadas separadas (no migra a `Registros/dataJson`): Eventos, Config, Usuarios, Agendas, CalendarMembers, Grupos y SyncOperations. El mantenimiento añade seis hojas `* legibles` derivadas; Usuarios legibles nunca copia contraseñas. RESET elimina las hojas y filas, no elimina calendarios/eventos de Google Calendar, y está bloqueado por confirmación de backup/owner. Ver `agenda-database-maintenance.test.js` y la sección de Agenda en el spec común.
