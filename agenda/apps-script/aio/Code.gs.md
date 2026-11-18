# Code.gs del proyecto Apps Script frontend separado

Pegá el bloque `javascript` en `Code.gs` de un **proyecto Apps Script nuevo**, por ejemplo `Agenda - Interfaz`. El proyecto tiene el archivo HTML `Agenda` copiado desde [`Agenda.html.md`](./Agenda.html.md), y su `doGet` sirve la UI.

No reemplaces `agenda/apps-script/Code.gs`: ese archivo sigue siendo el backend vinculado al Sheet, con su `doGet` de estado y `doPost` de API.

El proyecto AIO añade un proxy server-side mínimo para el panel de mantenimiento. Solo permite tres acciones y las envía al backend existente con la sesión; el backend es el único que autoriza al propietario y realiza cambios en el Sheet. No contiene llamadas directas a Sheets, Calendar ni borrado de hojas.

```javascript
const AGENDA_BACKEND_URL = 'https://script.google.com/macros/s/AKfycbwtfGNjudJ_TljvRZt5J5Q6rT86p3SaQ3j2gDSAd6VxiduMps2deyShYxoXxxmkFye1/exec';

function doGet() {
  const template = HtmlService.createTemplateFromFile('Agenda');
  template.apiUrl = AGENDA_BACKEND_URL;
  return template.evaluate().setTitle('Agenda');
}

function runAgendaMaintenance(action, payload) {
  if (!['repairSchema', 'refreshReadableViews', 'resetDatabase'].includes(action)) throw new Error('INVALID_ACTION');
  const request = payload || {};
  if (typeof request.sessionToken !== 'string' || !request.sessionToken) throw new Error('UNAUTHORIZED');
  if (action === 'resetDatabase' && (request.confirmation !== 'RESETEAR' || request.backupConfirmed !== true)) throw new Error('RESET_CONFIRMATION_REQUIRED');
  const response = UrlFetchApp.fetch(AGENDA_BACKEND_URL, {
    method: 'post',
    contentType: 'text/plain;charset=utf-8',
    payload: JSON.stringify({...request, action}),
    followRedirects: true,
    muteHttpExceptions: true
  });
  const status = response.getResponseCode();
  if (status < 200 || status >= 300) throw new Error('BACKEND_HTTP_' + status);
  const result = JSON.parse(response.getContentText());
  if (!result || result.ok !== true) throw new Error(result && result.error || 'BACKEND_ERROR');
  return result;
}
```

El proxy necesita el scope mínimo `https://www.googleapis.com/auth/script.external_request`. El `doGet` de UI y el `doPost` de backend no se sustituyen en ninguno de los proyectos: el frontend llama al proxy con `google.script.run`, y el proxy reenvía la acción allowlisted a `AGENDA_BACKEND_URL`. Usá [`appsscript.json.md`](./appsscript.json.md) como manifiesto de este proyecto nuevo; no le agregues los scopes Calendar/Sheets del backend.
