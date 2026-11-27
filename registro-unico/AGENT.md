# AGENT.md — Registro Único

## Fuente de verdad y límites

- Repositorio: `https://github.com/claudiomaza/apps`.
- Carpeta canónica: `registro-unico/` dentro de `claudiomaza/apps`.
- `main` es la rama integrada. Mantener una sola rama de desarrollo local, `dev`; no crear ramas feature adicionales ni publicar Apps Script desde el agente.
- `appscript/` contiene solo `appsscript.json`, `Code.gs` y `Registro.html`, siguiendo Agenda: una interfaz HtmlService integrada sirve tanto al web app como a los diálogos del menú. No crear includes, companions ni desplegar Apps Script como agente.
- `index.html` es fuente de la página de entrada estática en `/apps/registro-unico/`. Pages publica desde la raíz de `claudiomaza/apps`. No agregar datos reales, IDs de hojas ni credenciales. Landing enlaza al deployment de Apps Script informado por Claudio.
- No leer ni escribir datos reales, no ejecutar migraciones y no cambiar permisos de planillas reales en desarrollo. Usar fixtures/sheets sintéticas aisladas.

## Diseño vigente

- Producto: CRUD de registros en filas, atributos en columnas: Nombre, Apellido, DNI, Escolaridad. Las filas nuevas van al final; ID estable y timestamps/actor son metadatos adicionales del sistema.
- Una única Google Sheet central. Apps Script corre como la persona que accede (`USER_ACCESSING`); Google la autentica al abrir HtmlService y pide consentimiento OAuth de Apps Script. El mismo proyecto Apps Script debe ser vinculado a la planilla. Su menú abre CRUD y Administración como opciones separadas. `onOpen` no debe depender de identidad para construir el menú: Apps Script puede ocultar el correo en disparadores simples; los handlers exigen dueño/admin antes de operar. No mantener sidebar ni companion separado.
- `Session.getActiveUser().getEmail()` debe resolver identidad; si está vacío, fail closed. `bootstrap` diferencia perfil activo, invitación pendiente, revocado y correo no creado; cada acción verifica estado/rol en backend. No usar email enviado desde navegador como identidad.
- ACL de app en `PropertiesService.getScriptProperties()`, no en una hoja editable por usuarios. En configuración virgen, el botón explícito de vínculo valida que quien lo pulse sea el dueño de la hoja y guarda su email privado como admin inicial. No publicar el correo en código ni en el repo. En caso de Drive compartido sin dueño individual, se permite configurar la propiedad privada manualmente.
- Roles nuevos: `admin` y `user`; `user1`/`user2` históricos se normalizan como `user` (mismos permisos CRUD). El dueño/admin asigna un rol y crea invitación pending con email y permiso Editor; la administración sigue restringida a dueño + `admin`. Bootstrap identifica la cuenta Google; la persona confirma su propio acceso desde UI y el servidor activa el perfil sin aceptar email/rol del cliente. Solo el dueño autenticado que sea `admin` gestiona perfiles y ACL.
- La vista Admin y el CRUD conviven en `appscript/Registro.html`; `doGet?page=admin` y el menú seleccionan la vista, pero el servidor revalida el rol. HtmlService no sustituye autorización.
- `onOpen` agrega opciones separadas **Abrir Registro Único** y **Administración** al menú de Sheets; ambas abren el HtmlService integrado con `showModalDialog`, y el handler de Administración exige dueño/admin. El item **Vincular esta planilla** puede mostrarse a otros usuarios por la limitación de identidad del disparador simple; su handler, el RPC y los endpoints verifican identidad y rol server-side. El HTML usa un único `runRegistroUnicoApi` allowlisted que delega en operaciones autenticadas. La primera vinculación valida al dueño y lo registra como admin si Script Properties está virgen; luego guarda el ID de la hoja activa y crea `Registros` + encabezados cuando falta. No sobrescribe encabezados/datos incompatibles, nunca retargetea una hoja ya configurada ni crea pestaña `Acceso`.
- Crear/actualizar/borrar pasa por `LockService.getScriptLock()`. Edición de Sheets por fuera de la app no adquiere ese lock.
- `Spreadsheet.addEditor/removeEditor` otorga/quita permiso individual bajo la identidad del admin, con scopes de Sheets. La baja desactiva la app y quita el permiso individual; avisar que accesos por grupo/dominio pueden subsistir aunque la operación individual haya sido exitosa. Si Google deniega la revocación, reportar permiso directo pendiente.
- La elección de ejecución implica que los editores pueden modificar directamente los datos en Sheets. La validación del CRUD no controla esos cambios.
- Pages es una landing estática que enlaza al `/exec` estable de Apps Script. Sin OAuth Client ID en Pages, sin recopilación de credenciales. No es un cliente API.

## Contrato y seguridad

RPC principal del cliente: `runRegistroUnicoApi({action,payload})`, con acciones allowlisted `bootstrap`, `listRecords`, `saveRecord`, `deleteRecord`, `listUsers`, `saveUser`, `confirmAccess`. `confirmAccess` deriva identidad de `Session.getActiveUser()` y solo activa el perfil pending de ese mismo correo; no acepta identidad ni rol del navegador. Las operaciones delegadas y `registroUnicoBindActiveSpreadsheet` validan en servidor.

- Nunca confiar en campos `email`, `role`, `isAdmin` del navegador.
- Validar longitudes/formato en servidor; guardar entradas como texto para conservar ceros y evitar fórmulas; construir DOM con `textContent`, no insertar datos del Sheet como HTML.
- Impedir que el último admin activo o el admin de bootstrap se desactive/demote; evitar que un admin se quite a sí mismo.
- Invitación: guardar `pending=true, active=false` y dar permiso Sheets; si falla `addEditor`, restaurar ACL previa. Confirmación deriva el correo de sesión y activa solo esa invitación bajo lock, preservando rol. Baja desactiva antes de retirar permiso directo. Guardar/loguear solo metadatos seguros, nunca DNI.
- `appsscript.json` declara scopes mínimos necesarios para Sheets e identidad. El uso de openById y add/remove editor requiere scope `spreadsheets`, amplio para las hojas de cálculo accesibles por cada usuario, no limitado automáticamente al ID configurado. Explicar y revisar esto antes de consentimiento. No usar DriveApp ni pedir `drive` scope amplio.
- DNI son datos sensibles. Pruebas solo sintéticas. No habilitar acceso general, publicar un Sheet, cambiar permisos heredados o exportar datos.

## Pruebas y criterios

- Offline: `python3 -m unittest discover -s tests -v`; valida contrato estático y no equivale a ejecutar Apps Script.
- TDD: antes de cambiar comportamiento, agregar prueba que falla, confirmar RED, implementar, confirmar GREEN y ejecutar suite.
- Para integración real, Claudio debe crear planilla sintética y deployment de prueba manual; usar cuentas de prueba. QA navegador móvil/escritorio y roles: usuario/admin, invitación pendiente y aceptada, correo no creado, email distinto, revocación, correo no disponible, sesión revocada, CRUD, duplicado DNI, concurrencia y red.
- Apps Script runtime, OAuth, edición real, ACL Google, integración Pages→HtmlService y QA visual: `BLOCKED/NO VERIFICADO` hasta evidencia del deployment. Nunca inferir PASS desde source tests.
- Integración: revisar diff y verificar SHA; los cambios aprobados se integran en `main` desde la única rama local `dev`. No publicar Apps Script. Pages se publica desde la raíz de `main` del repo `claudiomaza/apps`; Claudio despliega manualmente como web app el proyecto Apps Script vinculado a la hoja.

## Configuración/rollback manual

- Deployment activo: verificar en Apps Script editor que ejecuta como quien accede y que el acceso requiere cuenta Google. El manifest no prueba estado activo.
- La carpeta conserva su propio `index.html` en `/apps/registro-unico/`, enlazado al deployment vinculado que informó Claudio el 2026-11-27: `https://script.google.com/macros/s/AKfycbx4nw7eK72BhHiTyTs0HP_uX5D-nVqXudQXcURRum6CQjKbKTlLnToWUq7QxGZodV5F/exec`. Pages se despliega aparte de Apps Script; el menú usa `ScriptApp.getService().getUrl()`.
- Spreadsheet ID vive en Script Properties. Reconfiguración/cambio de hoja se hace con procedimiento manual y respaldo/confirmación; no resetear ni migrar datos.
- Rollback de HtmlService: restaurar fuentes previas y publicar nueva versión manualmente. Rollback Pages: restaurar el SHA anterior del repo `claudiomaza/apps`.
