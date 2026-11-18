# Agenda — archivos de Apps Script

- `Code.gs`: backend Apps Script actual (doPost y APIs). El `doGet` actual conserva el chequeo JSON; la guía describe cómo servir el frontend desde HtmlService sin reemplazar doPost.
- `appsscript.json`: manifiesto y permisos/servicios del proyecto.
- `Agenda.html.md`: HTML completo, de un solo archivo, para copiar y pegar en un archivo HTML `Agenda` de Apps Script. El bloque integra la interfaz, CSS, JavaScript, IndexedDB y la librería Excel. GitHub Pages no ejecuta el Markdown.
- `PUBLICAR-SOLO-APPS-SCRIPT.md`: pasos para pegar el HTML, cambiar doGet y desplegar/testear separadamente. No se debe cambiar el despliegue activo sin hacer antes E2E con datos de QA.
- `standalone-html.test.js`: contrato estático del HTML integrado y la guía.

La copia se genera desde el frontend versionado. El HTML autocontenido está preparado, pero la publicación efectiva desde HtmlService aún requiere verificación autenticada en un proyecto de prueba, incluyendo CORS hacia doPost.
