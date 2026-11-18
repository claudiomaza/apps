# Servir Agenda desde un Apps Script separado

Este método crea un **segundo proyecto Apps Script** que solo aloja la interfaz. El proyecto backend actual `agenda/apps-script/` y su despliegue quedan intactos: el nuevo frontend manda sus peticiones al URL del backend ya existente.

`Agenda.html.md` contiene el HTML completo (interfaz, estilos, JavaScript, IndexedDB y Excel) para pegar en el archivo HTML `Agenda` del proyecto nuevo. `Code.gs.md` contiene el `Code.gs` corto completo para ese proyecto. Ambos `.md` son documentación para copiar: Pages no los ejecuta.

## Crear el proyecto frontend independiente

1. En `script.google.com`, crea un **proyecto nuevo** (por ejemplo, `Agenda - Interfaz`). No abras para editar el proyecto de `agenda/apps-script/`.
2. En el proyecto nuevo, crea un archivo HTML llamado `Agenda`. Desde [`Agenda.html.md`](./Agenda.html.md), copia el bloque `html` completo (sin las marcas de tres backticks) y pégalo en ese archivo.
3. En el `Code.gs` que viene con el proyecto nuevo, pega el bloque completo de [`Code.gs.md`](./Code.gs.md). Su `doGet` solo sirve el HTML y configura explícitamente la URL del backend existente.
4. No copies el `Code.gs` backend ni el `appsscript.json` de `agenda/apps-script/` al proyecto frontend. No hace falta habilitar Calendar/Sheets APIs ni otorgar al frontend los scopes del backend; esa integración permanece únicamente en el proyecto backend vigente.
5. Despliega el proyecto nuevo como Web App. Define quién puede abrir la interfaz según las cuentas previstas y las opciones que permita tu dominio. La interfaz tiene su propio login, pero abrirla no reemplaza la autorización de acceso del backend. No compartas permisos de editor del proyecto para dar acceso a usuarios. Copia la URL `/exec` de ese deployment.
6. Para habilitar el acceso desde la planilla, el `Code.gs` vinculado al Sheet agrega el menú **Agenda → Iniciar app**. Despliega en el proyecto backend vinculado la revisión versionada de [`../Code.gs`](../Code.gs) y, en Project Settings → Script Properties, agrega `AGENDA_AIO_WEB_APP_URL` con la URL `/exec` del frontend AIO recién desplegado. No pongas esa URL en el `Code.gs` público ni en los datos de la planilla. El menú muestra un diálogo con el botón **Iniciar app**, que abre el HTML en otra pestaña. El `doGet` de salud y el `doPost` de API se conservan sin cambios.
7. Abre la planilla, recargala y usa **Agenda → Iniciar app**. Verifica que el botón abra el deployment esperado; en QA confirma login, carga, consultas y una escritura controlada. No apuntes la prueba a eventos, agendas ni Sheets reales.

## La separación de proyectos

- **Proyecto backend vigente:** `agenda/apps-script/Code.gs`, con `doPost(e)`, sesiones, permisos y operaciones sobre Calendar/Sheets. Su URL se conserva en el `Code.gs.md` del proyecto frontend.
- **Proyecto frontend nuevo:** solo un `Code.gs` con `doGet()` y el HTML `Agenda`. El URL de despliegue de este proyecto es el que se abre en el navegador; **no** se usa como API.
- No reemplaces `doGet`, `doPost`, manifiesto ni despliegue del backend. Este procedimiento agrega una segunda interfaz alojada en Apps Script, no mueve ni duplica el backend.
- El frontend nuevo y GitHub Pages comparten el mismo backend, pero los orígenes del navegador son distintos. El almacenamiento `sessionStorage` e IndexedDB es por origen: la sesión y los borradores de Pages no aparecen automáticamente en el Web App nuevo. No renombres la clave/namespaces internos `calendarSession` ni `calendario`.
- El HTML desactiva su registro del Service Worker de Pages y trae sus dependencias visuales/Excel integradas. Sus operaciones conservan el flujo actual: cambios primero quedan como borrador y requieren «Sincronizar»; invitaciones requieren selección y envío explícitos.

## Validación antes de usar

El bundle y el `Code.gs` frontend se verificaron estáticamente; eso no prueba que HtmlService, las restricciones del navegador y el `fetch` entre el nuevo origen y el Web App backend funcionen juntos. En un proyecto y datos de QA, confirma carga del HTML, acceso a `doPost`, autenticación backend y una operación de prueba con consentimiento. Si el navegador bloquea la comunicación entre orígenes, no cambies el backend activo ni copies `doPost` al proyecto nuevo como atajo: hay que diseñar y validar esa integración separadamente. El backend y el deploy actual no se modifican con estos archivos.


## Lanzador desde la planilla

El lanzador es un menú personalizado del spreadsheet (no una celda ni un dibujo): `onOpen` agrega **Agenda → Iniciar app** y el diálogo ofrece el botón para abrir el Web App AIO. La URL se lee de Script Properties como `AGENDA_AIO_WEB_APP_URL` y se valida como deployment `script.google.com/macros/s/.../(exec|dev)`. Sin propiedad válida, el menú informa que falta configurar el frontend y no abre enlaces arbitrarios. Desplegar este código fuente no actualiza automáticamente el Apps Script activo ni la planilla.
