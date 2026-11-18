# Code.gs del proyecto Apps Script separado (solo frontend)

Copiá el contenido completo del bloque `javascript` y pegalo en `Code.gs` de un **nuevo proyecto** Apps Script llamado, por ejemplo, `Agenda - Interfaz`. Este proyecto no es el backend: sirve el HTML y reenvía la URL del backend ya existente a la plantilla.

No pegues este código encima de `agenda/apps-script/Code.gs`, ni reemplaces su `doGet`/`doPost`. Conservá el backend y su despliegue actual sin cambios.

El HTML correspondiente está en [`Agenda.html.md`](./Agenda.html.md). La guía está en [`PUBLICAR-SOLO-APPS-SCRIPT.md`](./PUBLICAR-SOLO-APPS-SCRIPT.md).

```javascript
const AGENDA_BACKEND_URL = 'https://script.google.com/macros/s/AKfycbwtfGNjudJ_TljvRZt5J5Q6rT86p3SaQ3j2gDSAd6VxiduMps2deyShYxoXxxmkFye1/exec';

function doGet() {
  const template = HtmlService.createTemplateFromFile('Agenda');
  template.apiUrl = AGENDA_BACKEND_URL;
  return template.evaluate().setTitle('Agenda');
}
```
