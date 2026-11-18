# Manifiesto `appsscript.json` del proyecto AIO

Este manifiesto es solo para el proyecto renderer HtmlService que contiene `Render.gs` y `Agenda`. El único scope requerido por el proxy allowlist es `script.external_request`. No copiar los scopes de Calendar/Sheets del backend canónico `agenda/apps-script/Code.gs`.

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
