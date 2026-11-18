# appsscript.json del proyecto AIO standalone

Este manifiesto es para el **proyecto HtmlService separado**, no para el Apps Script vinculado al Sheet. Habilita solo llamadas HTTP salientes para el proxy limitado de mantenimiento; no copiar el manifiesto del backend ni sus scopes de Calendar/Sheets.

```json
{
  "timeZone": "America/Argentina/Buenos_Aires",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "oauthScopes": [
    "https://www.googleapis.com/auth/script.external_request"
  ]
}
```
