# Apps Script — Calendario multiagenda

`Code.gs` agrega persistencia de agendas en `Agendas` y permisos por agenda en `CalendarMembers`. Mantiene `Eventos` compartida pero cada fila queda aislada por el `calendarId` de Google Calendar. La agenda operativa previa se migra perezosamente como ID lógico `legacy`; los grupos sin columna nueva se asignan solo a esa agenda durante la compatibilidad. `SyncOperations` agrega `calendarId` y conserva las operaciones anteriores bajo `legacy`.

## Acciones

- `auth`: emite sesión y devuelve `calendars`, `calendarId`, nombre, grupos y (opcionalmente) eventos de la agenda inicial.
- `listCalendars`: agendas a las que accede la sesión.
- `createCalendar`: crea agenda de Google Calendar y registro lógico; solo propietarios.
- `listCalendarMembers`, `addCalendarMember`, `removeCalendarMember`: acciones con `calendarId` y rol `editor` o `reader`. Se exige que la cuenta ya exista en `Usuarios`. En Google Calendar todos los colaboradores reciben solo acceso de lector.
- `renameCalendar`: propietario de la agenda.
- `list`, `getEvent`, `getOperation`, `listGroups`, `exportEvents`, `create`, `update`, `delete`, `saveGroup`, `deleteGroup`: requieren `calendarId` (se puede omitir solo si la sesión tiene una única agenda) y el servidor vuelve a verificar pertenencia y rol en cada solicitud.

`reader` solo consulta/exporta; `editor` consulta y edita eventos/grupos; el propietario además administra miembros y nombre. No se implementa rol `admin`: estaba propuesto pero no confirmado. No hay borrado de agendas en esta versión.

## Migración y despliegue

El primer inicio válido del dueño histórico crea el registro lógico de `legacy` y las pestañas requeridas; no crea agendas ni eventos adicionales. `Grupos` agrega `calendarId` a la derecha y deja filas heredadas asociadas únicamente a `legacy`. Revisar primero en una copia de la Sheet si se quiere validar la migración. El despliegue sigue manual por parte del propietario: reemplazar `Code.gs` del proyecto vinculado, autorizar `calendar` + `calendar.events` + `calendar.readonly` + `spreadsheets`, crear nueva implementación Web App y actualizar el URL en Pages solo si cambia.

## Checks locales

```sh
node --check Code.gs   # copiar temporalmente a .js
node multi-calendar.test.js
```

Los tests comprueban permisos, validación y aislamiento por agenda; no sustituyen un smoke autenticado del Apps Script desplegado.
