# Publicar la interfaz AIO de Agenda (Apps Script independiente)

El repositorio tiene un solo backend canónico de Agenda: `agenda/apps-script/Code.gs`, vinculado al Sheet. El AIO vive en un proyecto Apps Script separado y solo sirve la interfaz mediante HtmlService. Su archivo servidor se llama `Render.gs` para distinguirlo del backend; no reemplaza `Code.gs`, no implementa la API ni opera directamente en Sheets/Calendar.

## Crear el proyecto AIO

1. Crea un proyecto nuevo en Apps Script, por ejemplo `Agenda - Interfaz`; no abras el proyecto vinculado para convertirlo en renderer.
2. Agrega un archivo de script `Render.gs` y copia el contenido de [`Render.gs`](./Render.gs).
3. Agrega un archivo HTML llamado `Agenda`. Copia el bloque `html` íntegro de [`Agenda.html.md`](./Agenda.html.md), sin las marcas Markdown del bloque.
4. Activa el archivo de manifiesto y copia el JSON de [`appsscript.json.md`](./appsscript.json.md). El scope mínimo es `script.external_request`; no añadas scopes Calendar/Sheets del backend.
5. Guarda, autoriza el scope cuando Apps Script lo solicite y despliega este proyecto como Web App con el acceso que corresponda a las cuentas usuarias. Copia su URL `/exec`.
6. En el **Apps Script vinculado al Sheet**, el `Code.gs` canónico contiene el menú `Agenda → Iniciar app`. Configura su Script Property `AGENDA_AIO_WEB_APP_URL` con la URL `/exec` del renderer; respeta el formato validado en el backend. No publiques esa URL como secreto en un frontend, ni confundas la URL AIO con la API.
7. Recarga el Sheet y usa el menú para abrir el AIO. Verifica la carga de la UI. Login y operaciones dependen de la API del backend común; probar cambios solo en un entorno sintético autorizado.

## Qué archivo se copia en cada proyecto

- **Backend vinculado al Sheet:** `agenda/apps-script/Code.gs` y su manifiesto `agenda/apps-script/appsscript.json`. Ahí viven `doGet()` de estado, `doPost(e)` API, sesiones/permisos, operaciones de Calendar/Sheets, mantenimiento y launcher.
- **Proyecto AIO:** `Render.gs`, archivo HTML `Agenda`, y su manifiesto mínimo de `appsscript.json.md`. `Render.gs` define el `doGet()` que presenta la UI y el proxy de mantenimiento allowlist que reenvía peticiones autenticadas al backend.
- **Pages:** `agenda/` se sirve desde GitHub Pages y llama al mismo backend. Pages y HtmlService son orígenes distintos; sessionStorage/IndexedDB no se comparten automáticamente. Preservar `sessionStorage.calendarSession` y namespace IndexedDB `calendario`.

No copiar el backend en el proyecto AIO, no mantener una segunda versión del API, no usar el endpoint renderer como API, y no conceder autoridad a la UI/proxy. El backend canónico valida el actor, sesión, rol, scope y confirmaciones antes de ejecutar acciones. El proxy del renderer solo permite las acciones configuradas y utiliza `UrlFetchApp` dentro de su scope mínimo.

## Pruebas y estado operativo

`node agenda/apps-script/aio/standalone-html.test.js` valida el bundle HTML, assets autocontenidos, JavaScript, `Render.gs` y el límite entre UI/backend. `node agenda/apps-script/sheet-launcher.test.js` cubre el launcher del backend. Las pruebas estáticas no verifican despliegues ni comunicación real entre orígenes. La compatibilidad autenticada de HtmlService, CORS, permisos y operación real requiere QA aparte y aprobación, sin usar el Sheet real durante pruebas.

Los archivos de este paquete son fuente versionada para copiar. Subir a GitHub no actualiza ningún proyecto Apps Script. Claudio realiza el despliegue manual; esta guía no autoriza cambios en la planilla, reset ni despliegue.

## Esquema de Agenda: decisión y estado

El `main` inspeccionado el 2026-11-18 todavía tiene el backend y las instrucciones previas con pestañas operativas legacy. La decisión nueva de Claudio es normalizar el backend sobre `Config`, `Registros` (`recordId,type,entityId,dataJson,version,status,updatedAt,createdAt`) y `Usuarios` (`usuario,pass,rol,alcances,mail,nombre,docenteId`), con eventos/calendarios/colaboradores/grupos/operaciones como tipos en `Registros`. RESET debe crear solo la nueva base, sin tablas legacy, y sembrar el admin indicado; reparación debe fallar cerrado sin migrar datos antiguos. Esa transición **todavía no está implementada ni publicada**; estos archivos AIO no la ejecutan ni actualizan Apps Script. No ejecutar RESET durante QA. RESET no debe borrar objetos de Google Calendar.
