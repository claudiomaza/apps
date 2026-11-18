# Publicar Agenda solo desde Google Apps Script

Este paquete permite servir el frontend de Agenda desde HtmlService, en lugar de Pages. `Agenda.html.md` contiene el HTML completo para copiar a un archivo HTML de Apps Script llamado `Agenda`. El Markdown es solo documentación y no lo ejecuta GitHub Pages.

## Qué hay que copiar

1. En un proyecto Apps Script de prueba, conserva `Code.gs` y `appsscript.json` de esta carpeta. Crea un archivo HTML llamado `Agenda`.
2. Abre [`Agenda.html.md`](./Agenda.html.md), copia completo el contenido del bloque `html` y pégalo en `Agenda.html`. No pegues las marcas de los tres backticks.
3. En `Code.gs`, reemplaza la función actual `doGet()` (la que hoy responde el chequeo JSON) por:

```javascript
function doGet(e) {
  if (e && e.parameter && e.parameter.health === '1') {
    return json_({ok:true,service:'apps-calendar',schemaVersion:2});
  }
  const template = HtmlService.createTemplateFromFile('Agenda');
  template.apiUrl = ScriptApp.getService().getUrl();
  return template.evaluate().setTitle('Agenda');
}
```

El resto de `Code.gs`, incluido `doPost(e)`, se mantiene. La pantalla usa `doPost` del mismo Web App como backend. El parámetro `?health=1` conserva el chequeo JSON.

4. Conserva `appsscript.json` y habilita/autoriza los servicios y scopes declarados allí, incluido el servicio avanzado Calendar API. Revisa la configuración de despliegue y quién puede acceder al Web App antes de publicar.
5. Despliega una **nueva versión** como Web App y prueba primero con una copia de la planilla/calendario de QA; no apuntes una prueba a datos reales.

## Qué incluye y qué cambia

- HTML autocontenido con CSS, JavaScript, el almacén IndexedDB y la librería Excel embebidos. No depende de archivos frontend servidos por Pages ni de `config.js`, `stage-store.js`, `styles.css` o `vendor/xlsx.full.min.js` externos.
- La URL del backend se inyecta al evaluar la plantilla, así la interfaz usa el mismo despliegue de Apps Script. El `doPost(e)` existente, las validaciones, permisos, invitaciones, planilla, IDs y eventos no se reemplazan por HTML.
- Se evita registrar el Service Worker de Pages en esta modalidad. La sesión sigue en `sessionStorage` y los borradores en IndexedDB del origen de HtmlService; al cambiar de origen, el navegador puede no mostrar automáticamente datos locales guardados bajo GitHub Pages. No borrar ni renombrar el namespace `calendario`.
- El documento conserva el flujo actual: cambios de eventos se preparan primero en IndexedDB y requieren «Sincronizar» para escribir en Sheets/Calendar. Las invitaciones requieren seleccionar y enviar de manera explícita.
- GitHub Pages no cambia al copiar estos archivos; para migrar a Apps Script hay que probar y publicar el Web App por separado. No se modificó ni desplegó Apps Script en esta tarea.

## Verificación y límites

El HTML se construyó desde el frontend versionado de Agenda e integra los assets disponibles en el repositorio. La verificación estática confirma un único bloque HTML, scripts y estilos inline, URL de API inyectada y ausencia de referencias relativas a assets de Pages. Esto aún no prueba la ejecución dentro de HtmlService, el OAuth/scopes, CORS de las solicitudes al Web App ni los permisos de datos. Haz esa prueba autenticada en un proyecto y datos de QA antes de considerar la migración aceptada o cambiar el despliegue activo.
