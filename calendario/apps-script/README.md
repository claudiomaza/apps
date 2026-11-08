# Fix multiagenda UI + cuentas de la app

Actualiza el menú `Configurar` con `Seleccionar agenda` arriba de `Cambiar nombre`, habilita cambio de agenda por el selector y desde el modal, muestra administración en un panel responsive con scroll, permite crear agendas y asignar permisos a cuentas registradas en `Usuarios`.

Las solicitudes existentes envían automáticamente `calendarId`; cambios staged lo conservan al sincronizar. El backend añade `listAppUsers`, permite resolver miembros por nombre de usuario (el campo de email se conserva internamente por compatibilidad) y les aplica permisos editor/reader dentro de la app. No se concede edición de Google Calendar; las cuentas con email pueden recibir permiso viewer. Listado de miembros visible también para colaboradores, pero solo owner puede listar cuentas y administrar.

No agrega gestión de cuentas ni contraseña; se eligen usuarios ya existentes en `Usuarios`. El contexto seleccionado solo se guarda en memoria de la sesión; los cambios pendientes se asocian al ID de agenda para impedir sincronizarlos en otra agenda.

Verificación local: `node --check app.js`, `node --check Code.gs` (con copia .js), `node multi-calendar-ui.test.js`, `node multi-calendar.test.js`, más regresiones `day-grid.test.js`, `groups-color.test.js`, `stage-sync.test.js`. El endpoint activo ya responde schemaVersion 2, pero el código de estos archivos no se despliega automáticamente desde GitHub; Claudio debe publicar Apps Script manualmente después de integrar los cambios.
