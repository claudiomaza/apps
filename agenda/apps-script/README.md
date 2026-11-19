# Agenda — backend y despliegue

Esta carpeta es la guía operativa para publicar **los dos frontends de Agenda contra un único backend y un único proyecto Apps Script vinculado a la planilla**. No existe un proyecto/renderer AIO separado.

## Arquitectura

| Parte | Archivo o URL | Función |
|---|---|---|
| Proyecto Apps Script vinculado al Sheet | `Code.gs`, `Agenda.html`, `appsscript.json` | Backend y AIO HtmlService integrados; un solo proyecto y manifiesto |
| AIO del Sheet | Menú **Agenda → Abrir Agenda** y `GET /exec` | Interfaz HtmlService; usa `google.script.run` con `runAgendaApi` y `runAgendaMaintenance` |
| GitHub Pages | `../index.html`, `../app.js`, `../styles.css`; `/apps/agenda/` | Frontend web; llama al backend por `POST /exec` |
| Configuración de Pages | `../config.js` | `API_URL` debe ser el deployment `/exec` del backend Apps Script |

`GET /exec` sirve el AIO integrado; `GET /exec?status=1` devuelve estado/schema. `POST /exec` sigue siendo el API JSON de Pages. El menú ofrece primero **Abrir Agenda**, seguido de verificar esquema, actualizar vistas y RESET. El AIO y Pages son dos clientes distintos del mismo backend y de la misma planilla.

## Archivos del proyecto vinculado

- `Code.gs`: autenticación, autorización, API `doPost`, `doGet`, RPC para HtmlService y mantenimiento.
- `Agenda.html`: interfaz HtmlService completa. Debe llamarse exactamente `Agenda` en Apps Script (sin escribir la extensión `.html` al crear el archivo desde el editor).
- `appsscript.json`: único manifiesto; incluye los scopes de Sheets, Calendar, `script.container.ui` y `userinfo.email` (requerido por `Session.getActiveUser().getEmail()` al proteger el RESET).

No copiar `Code.gs` a Pages; no crear un segundo proyecto o manifiesto; no agregar URL proxy AIO ni `script.external_request` para el frontend integrado.

## Desplegar el backend y el AIO

1. Abrí el **proyecto Apps Script vinculado a la planilla existente de Agenda**. No crees un proyecto standalone ni una planilla nueva.
2. En ese mismo proyecto reemplazá el fuente `Code.gs` por este `Code.gs`, creá o reemplazá el archivo HTML llamado `Agenda` con `Agenda.html` y reemplazá el manifiesto por `appsscript.json`.
3. Guardá el proyecto. Revisá las solicitudes de autorización y concedé únicamente los scopes declarados por el manifiesto, incluido el acceso al correo del usuario activo. Es necesario volver a autorizar para incorporar el nuevo scope. No cambies el ID de la planilla ni la identidad/permisos del deployment como parte de esta actualización.
4. En **Implementar → Administrar implementaciones**, editá la Web App existente y seleccioná una nueva versión del código. Conservá URL `/exec`, usuario de ejecución y configuración de acceso actuales; Pages ya depende de esa URL. No crees un segundo deployment de AIO. Si el editor exige una configuración distinta o cambia el URL, frená y resolvé esa decisión antes de publicar; `../config.js` y sus clientes deben seguir apuntando al URL vigente.
5. Recargá la planilla. Verificá que el menú **Agenda** muestre en este orden: **Abrir Agenda**, **Verificar esquema normalizado**, **Actualizar tablas legibles**, **RESET total…**. Abrir Agenda solo muestra la interfaz; no ejecuta mantenimiento.
6. Probá el AIO desde **Agenda → Abrir Agenda** y desde la URL `/exec` del mismo deployment. `?status=1` es solo una comprobación de estado y no prueba login ni autorización. Hacé un smoke test autenticado con una cuenta autorizada; no confirmes operaciones de escritura contra datos reales durante una verificación técnica.

## Publicar/verificar GitHub Pages

Pages es el segundo frontend, no otro backend. Se publica desde `main` en GitHub Pages con los archivos `../index.html`, `../app.js`, `../styles.css` y `../config.js`.

1. Confirmá que `../config.js` contiene en `API_URL` el mismo Web App `/exec` que acabás de actualizar. No lo cambies si el deployment conservó su URL.
2. Integrá/publicá los cambios del repo en `main`; esperá que el workflow **pages build and deployment** termine en `success` para el SHA publicado.
3. Abrí `https://claudiomaza.github.io/apps/agenda/`, verificá carga y realizá un smoke test autenticado de lectura. Confirmá desde el navegador que Pages usa `POST /exec`; el AIO usa `google.script.run` y no debe depender de fetch/proxy al renderer.
4. Apps Script y Pages tienen publicaciones independientes: un push a GitHub no actualiza el proyecto Apps Script. Un deploy de Apps Script tampoco publica GitHub Pages.

## QA automatizado

Desde la raíz del repo, con Node.js:

```sh
node agenda/apps-script/sheet-launcher.test.js
node agenda/apps-script/unified-appsscript.test.js
node agenda/apps-script/integrated-html.test.js
node agenda/apps-script/agenda-database-maintenance.test.js
```

Son pruebas sintéticas/estáticas; no acreditan deployment activo, login real, permisos, origen/CORS, Sheet ni Calendar. No uses el Sheet operativo para fixtures ni QA destructivo.

## RESET y protección de datos

**RESET no forma parte del despliegue ni del smoke test.** Solo Claudio lo ejecuta manualmente, después de crear y verificar un backup y aceptar expresamente la pérdida del esquema/datos de Agenda. La UI exige escribir `RESET` y confirmar en un segundo diálogo. Recrea el esquema normalizado y la cuenta admin inicial; no migra datos legacy ni elimina calendarios/eventos de Google Calendar. La contraseña temporal se muestra una sola vez. No ejecutes RESET para probar el menú, el login ni la publicación.

La guía de operación y decisiones está en [`../agente/agent.md`](../agente/agent.md); el spec común es [`../../SPEC-PERFORMANCE.md`](../../SPEC-PERFORMANCE.md).
