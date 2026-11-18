# Servir Agenda desde un Apps Script separado

Este método crea un **segundo proyecto Apps Script** que solo aloja la interfaz. El proyecto backend actual `agenda/apps-script/` y su despliegue quedan intactos: el nuevo frontend manda sus peticiones al URL del backend ya existente.

`Agenda.html.md` contiene el HTML completo (interfaz, estilos, JavaScript, IndexedDB y Excel) para pegar en el archivo HTML `Agenda` del proyecto nuevo. `Code.gs.md` contiene el `Code.gs` corto completo para ese proyecto. Ambos `.md` son documentación para copiar: Pages no los ejecuta.

## Crear el proyecto frontend independiente

1. En `script.google.com`, crea un **proyecto nuevo** (por ejemplo, `Agenda - Interfaz`). No abras para editar el proyecto de `agenda/apps-script/`.
2. En el proyecto nuevo, crea un archivo HTML llamado `Agenda`. Desde [`Agenda.html.md`](./Agenda.html.md), copia el bloque `html` completo (sin las marcas de tres backticks) y pégalo en ese archivo.
3. En el `Code.gs` que viene con el proyecto nuevo, pega el bloque completo de [`Code.gs.md`](./Code.gs.md). Su `doGet` solo sirve el HTML y configura explícitamente la URL del backend existente.
4. No copies el `Code.gs` backend ni el `appsscript.json` de `agenda/apps-script/` al proyecto frontend. No hace falta habilitar Calendar/Sheets APIs ni otorgar al frontend los scopes del backend; esa integración permanece únicamente en el proyecto backend vigente.
5. Despliega el proyecto nuevo como Web App. Define quién puede abrir la interfaz según las cuentas previstas y las opciones que permita tu dominio. La interfaz tiene su propio login, pero abrirla no reemplaza la autorización de acceso del backend. No compartas permisos de editor del proyecto para dar acceso a usuarios.
6. Abre la URL del **nuevo** Web App de interfaz y verifica que aparece el login; luego prueba la autenticación, carga, consultas y una escritura controlada en un entorno de QA. No apuntes una prueba a eventos, agendas ni Sheets reales.

## La separación de proyectos

- **Proyecto backend vigente:** `agenda/apps-script/Code.gs`, con `doPost(e)`, sesiones, permisos y operaciones sobre Calendar/Sheets. Su URL se conserva en el `Code.gs.md` del proyecto frontend.
- **Proyecto frontend nuevo:** solo un `Code.gs` con `doGet()` y el HTML `Agenda`. El URL de despliegue de este proyecto es el que se abre en el navegador; **no** se usa como API.
- No reemplaces `doGet`, `doPost`, manifiesto ni despliegue del backend. Este procedimiento agrega una segunda interfaz alojada en Apps Script, no mueve ni duplica el backend.
- El frontend nuevo y GitHub Pages comparten el mismo backend, pero los orígenes del navegador son distintos. El almacenamiento `sessionStorage` e IndexedDB es por origen: la sesión y los borradores de Pages no aparecen automáticamente en el Web App nuevo. No renombres la clave/namespaces internos `calendarSession` ni `calendario`.
- El HTML desactiva su registro del Service Worker de Pages y trae sus dependencias visuales/Excel integradas. Sus operaciones conservan el flujo actual: cambios primero quedan como borrador y requieren «Sincronizar»; invitaciones requieren selección y envío explícitos.

## Validación antes de usar

El bundle y el `Code.gs` frontend se verificaron estáticamente; eso no prueba que HtmlService, las restricciones del navegador y el `fetch` entre el nuevo origen y el Web App backend funcionen juntos. En un proyecto y datos de QA, confirma carga del HTML, acceso a `doPost`, autenticación backend y una operación de prueba con consentimiento. Si el navegador bloquea la comunicación entre orígenes, no cambies el backend activo ni copies `doPost` al proyecto nuevo como atajo: hay que diseñar y validar esa integración separadamente. El backend y el deploy actual no se modifican con estos archivos.
