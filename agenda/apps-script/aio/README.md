# Agenda AIO (HtmlService)

Frontend autónomo servido desde un **segundo proyecto Apps Script**. El backend canónico sigue siendo `../Code.gs`, el Apps Script vinculado a la planilla. El proyecto AIO no lo duplica.

- `Agenda.html.md`: HTML autocontenido para crear el archivo HTML `Agenda` del proyecto UI.
- `Render.gs`: renderer servidor AIO y proxy allowlist de mantenimiento. Copiarlo como `Render.gs` en el proyecto UI; no es backend y no define `doPost`.
- `appsscript.json.md`: manifiesto mínimo del proyecto UI (`script.external_request` solamente).
- `PUBLICAR-SOLO-APPS-SCRIPT.md`: pasos de creación y publicación del proyecto UI y límites.
- `standalone-html.test.js`: valida bundle/assets, `Render.gs`, separación respecto del backend y sintaxis.

El backend único y canónico vive en `agenda/apps-script/Code.gs`; sus scopes/API/permisos se administran ahí. Pages y AIO llaman al backend común. Publicar archivos no despliega Apps Script ni cambia la planilla. El proyecto AIO, el backend vinculado y Pages se despliegan independientemente.

El renderer AIO no accede directamente a Sheets ni Calendar. Reenvía las acciones de mantenimiento autorizadas al backend; la autorización efectiva permanece en el backend. No copiar los scopes de Calendar/Sheets al manifiesto AIO.


El backend versionado espera el esquema normalizado `Config`/`Registros`/`Usuarios`. Su acción de reparación falla cerrado al encontrar pestañas operativas antiguas; el RESET crea el esquema nuevo, pero lo ejecuta el propietario en la planilla solo después del despliegue manual correspondiente.


El RESET normalizado deja las hojas operativas `Config`, `Registros`, `Usuarios` y las vistas legibles derivadas.
