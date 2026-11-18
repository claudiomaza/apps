# Servir Agenda desde un Apps Script separado

Este método crea un **segundo proyecto Apps Script** que solo aloja la interfaz. El proyecto backend actual `agenda/apps-script/` y su despliegue quedan intactos: el nuevo frontend manda sus peticiones al URL del backend ya existente.

`Agenda.html.md` contiene el HTML completo (interfaz, estilos, JavaScript, IndexedDB y Excel) para pegar en el archivo HTML `Agenda` del proyecto nuevo. `Code.gs.md` contiene el `Code.gs` corto completo para ese proyecto. Ambos `.md` son documentación para copiar: Pages no los ejecuta.

## Crear el proyecto frontend independiente

1. En `script.google.com`, crea un **proyecto nuevo** (por ejemplo, `Agenda - Interfaz`). No abras para editar el proyecto de `agenda/apps-script/`.
2. En el proyecto nuevo, crea un archivo HTML llamado `Agenda`. Desde [`Agenda.html.md`](./Agenda.html.md), copia el bloque `html` completo (sin las marcas de tres backticks) y pégalo en ese archivo.
3. En el `Code.gs` que viene con el proyecto nuevo, pega el bloque completo de [`Code.gs.md`](./Code.gs.md). Su `doGet` solo sirve el HTML y configura explícitamente la URL del backend existente.
4. No copies el `Code.gs` backend ni el manifiesto avanzado de `agenda/apps-script/` al proyecto frontend. Para el proxy acotado de mantenimiento, crea el manifiesto desde [`appsscript.json.md`](./appsscript.json.md) (solo `script.external_request`; no Calendar/Sheets). Apps Script solicita autorización para ese scope al guardar/ejecutar el proyecto.
5. Despliega el proyecto nuevo como Web App. Define quién puede abrir la interfaz según las cuentas previstas y las opciones que permita tu dominio. La interfaz tiene su propio login, pero abrirla no reemplaza la autorización de acceso del backend. No compartas permisos de editor del proyecto para dar acceso a usuarios. Copia la URL `/exec` de ese deployment.
6. Para habilitar el acceso desde la planilla, el `Code.gs` vinculado al Sheet agrega el menú **Agenda → Iniciar app**. Despliega en el proyecto backend vinculado la revisión versionada de [`../Code.gs`](../Code.gs) y el manifiesto `../appsscript.json` (incluye `script.container.ui` para el menú), luego reautoriza; en Project Settings → Script Properties, agrega `AGENDA_AIO_WEB_APP_URL` con la URL `/exec` del frontend AIO recién desplegado. No pongas esa URL en el `Code.gs` público ni en los datos de la planilla. El menú muestra un diálogo con el botón **Iniciar app**, que abre el HTML en otra pestaña. El `doGet` de salud y el `doPost` de API se conservan sin cambios.
7. Abre la planilla, recargala y usa **Agenda → Iniciar app**. Verifica que el botón abra el deployment esperado; en QA confirma login, carga, consultas y una escritura controlada. No apuntes la prueba a eventos, agendas ni Sheets reales.

## La separación de proyectos

- **Proyecto backend vigente:** `agenda/apps-script/Code.gs`, con `doPost(e)`, sesiones, permisos y operaciones sobre Calendar/Sheets. Su URL se conserva en el `Code.gs.md` del proyecto frontend.
- **Proyecto frontend nuevo:** `doGet()` sirve el HTML `Agenda`; su proxy `runAgendaMaintenance` acepta solo las tres acciones de mantenimiento, envía la sesión al backend y no muta el Sheet por sí mismo. El manifiesto mínimo requiere `script.external_request`, no scopes de Calendar/Sheets. El URL de despliegue de este proyecto es el que se abre en el navegador; **no** se usa como API.
- No reemplaces `doGet`, `doPost`, manifiesto ni despliegue del backend. Este procedimiento agrega una segunda interfaz alojada en Apps Script, no mueve ni duplica el backend.
- El frontend nuevo y GitHub Pages comparten el mismo backend, pero los orígenes del navegador son distintos. El almacenamiento `sessionStorage` e IndexedDB es por origen: la sesión y los borradores de Pages no aparecen automáticamente en el Web App nuevo. No renombres la clave/namespaces internos `calendarSession` ni `calendario`.
- El HTML desactiva su registro del Service Worker de Pages y trae sus dependencias visuales/Excel integradas. Sus operaciones conservan el flujo actual: cambios primero quedan como borrador y requieren «Sincronizar»; invitaciones requieren selección y envío explícitos.

## Validación antes de usar

El bundle y el `Code.gs` frontend se verificaron estáticamente; eso no prueba que HtmlService, las restricciones del navegador y el `fetch` entre el nuevo origen y el Web App backend funcionen juntos. En un proyecto y datos de QA, confirma carga del HTML, acceso a `doPost`, autenticación backend y una operación de prueba con consentimiento. Si el navegador bloquea la comunicación entre orígenes, no cambies el backend activo ni copies `doPost` al proyecto nuevo como atajo: hay que diseñar y validar esa integración separadamente. El backend y el deploy actual no se modifican con estos archivos. La UI usa `google.script.run` para llamar al proxy solo para el panel administrativo; el flujo normal de Agenda sigue con la API configurada.


## Lanzador desde la planilla

El segundo `Code.gs` AIO incluye `runAgendaMaintenance`, proxy server-side allowlist a las tres acciones de mantenimiento; reenvía `sessionToken` y nunca concede acceso por sí mismo. El Apps Script vinculado al Sheet tiene el menú personalizado **Agenda** con `Iniciar app`, `Crear / reparar estructura (conservar datos)`, `Actualizar tablas legibles` y `RESET total… (elimina hojas y filas)`. Dentro de la UI AIO, el usuario inicial propietario también tiene «Configurar → Mantenimiento del Sheet» con las mismas tres operaciones. La URL AIO se lee de Script Properties como `AGENDA_AIO_WEB_APP_URL` y se valida como deployment `script.google.com/macros/s/.../(exec|dev)`. Esas acciones de mantenimiento son del `Code.gs` vinculado; el segundo proyecto AIO solo sirve HtmlService. El botón `Iniciar app` abre ese HTML.

El menú requiere el `Code.gs` del backend vinculado desplegado/autorizado como script del Sheet; el `.gs` standalone de AIO no puede crear un menú para ese Sheet y se mantiene deliberadamente como servidor de UI. No duplicar ahí las operaciones privilegiadas de administración. Subir código al repo no actualiza el Apps Script activo ni la planilla.

## Esquema y tablas legibles

La reparación conserva la estructura operativa de Agenda, no migra el modelo a MGD `Registros/dataJson`: `Eventos` (19 columnas, incluyendo IDs/versiones/estado y vínculo de Calendar), `Config` (`key`,`value`), `Usuarios` (`usuario`,`pass`), `Agendas`, `CalendarMembers`, `Grupos` y `SyncOperations` siguen como fuentes operativas existentes. Se agregan seis vistas derivadas y regenerables: `Eventos legibles`, `Grupos legibles`, `Agendas legibles`, `Colaboradores legibles`, `Usuarios legibles` y `Operaciones legibles`. Conservan claves/contexto y estado/versiones donde aplican, con encabezados legibles. No editar esas vistas como fuente de datos. `Usuarios legibles` muestra solo el identificador de cuenta; nunca incluye `pass` ni la contraseña temporal. Las vistas se actualizan al reparar, manualmente y tras operaciones API exitosas que cambian datos.

`Crear / reparar estructura (conservar datos)` prevalidará nombres/encabezados existentes antes de cambiar nada, creará hojas/encabezados faltantes y rellenará la última columna histórica `calendarId` faltante de `SyncOperations` con `legacy`; no elimina filas ni reemplaza esquemas incompatibles. `Actualizar tablas legibles` reconstruye solo las vistas, desde las hojas operativas.

`RESET total…` borra todas las hojas y filas del spreadsheet y las vuelve a crear vacías con el esquema y vistas derivados; requiere ser el propietario activo, escribir `RESET` en un único campo (no pide correo ni checkbox) y confirmar el backup y la pérdida en un segundo diálogo. Genera usuario inicial `cmaza` y contraseña temporal aleatoria que se muestra una sola vez. La UI AIO conserva el panel y la contraseña visible hasta que pulses «Recargar app»; copiala/guardala antes de recargar. Hacé antes un backup. **No borra ni modifica calendarios/eventos/permisos de Google Calendar**: al perderse las referencias de la planilla, esos objetos externos pueden quedar sin gestionar desde la app. Este cambio solo versiona el menú y código; no ejecuta reset, no actualiza la planilla y no despliega Apps Script.
