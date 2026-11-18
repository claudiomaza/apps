# Agenda — archivos de Apps Script

- `Code.gs`: backend Apps Script vigente (`doPost` y APIs). No modificarlo para alojar el frontend.
- `appsscript.json`: manifiesto y scopes/servicios requeridos solo por el proyecto backend.
- `Agenda.html.md`: HTML completo de la interfaz para copiar a `Agenda.html` en un **proyecto Apps Script frontend separado**.
- `Code.gs.md`: código mínimo completo del proyecto frontend nuevo; contiene solo `doGet` y sirve el HTML hacia el backend vigente.
- `PUBLICAR-SOLO-APPS-SCRIPT.md`: pasos de creación/despliegue del segundo proyecto sin reemplazar el backend ni su despliegue.
- `standalone-html.test.js`: contrato estático del bundle, Excel embebido, separación del backend y guía.

El material estático está preparado; aún falta probar HtmlService y `fetch` cross-origin al backend en un entorno QA antes de usarlo.
