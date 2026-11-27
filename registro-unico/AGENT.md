# AGENT.md — Registro Único

## Fuente de verdad y límites

- Repositorio: `https://github.com/claudiomaza/apps`.
- Carpeta canónica: `registro-unico/` dentro de `claudiomaza/apps`.
- `main` es la rama integrada. Mantener una sola rama de desarrollo local, `dev`; no crear ramas feature adicionales ni publicar Apps Script desde el agente.
- `appscript/` contiene solo `appsscript.json`, `Code.gs`, `Index.html` y `Admin.html`; validadores residen en Code.gs y estilos se embeben en cada HTML. Ningún include de archivo local. No crear, actualizar ni desplegar Apps Script como agente.
- `index.html` es fuente de la página de entrada estática en `/apps/registro-unico/`. Pages publica desde la raíz de `claudiomaza/apps`. No agregar datos reales, IDs de hojas ni credenciales. Landing enlaza al deployment de Apps Script informado por Claudio.
- No leer ni escribir datos reales, no ejecutar migraciones y no cambiar permisos de planillas reales en desarrollo. Usar fixtures/sheets sintéticas aisladas.

## Diseño vigente

- Producto: CRUD de registros en filas, atributos en columnas: Nombre, Apellido, DNI, Escolaridad. Las filas nuevas van al final; ID estable y timestamps/actor son metadatos adicionales del sistema.
- Una única Google Sheet central. Apps Script corre como la persona que accede (`USER_DEPLOYING`); Google la autentica al abrir HtmlService y pide consentimiento OAuth de Apps Script. El mismo proyecto Apps Script debe ser vinculado a la planilla. Su menú/sidebar abre CRUD/Admin y una acción autenticada vincula únicamente la hoja activa. No mantener un companion separado.
- `Session.getActiveUser().getEmail()` debe resolver una identidad; si está vacío, fail closed. Cada operación pública vuelve a comprobar usuario activo y rol en backend. No usar email enviado desde navegador como identidad.
- ACL de app en `PropertiesService.getScriptProperties()`, no en una hoja editable por usuarios. Primer admin lo configura Claudio fuera del repo mediante la Script Property `REGISTRO_UNICO_INITIAL_ADMIN_EMAIL=<correo del administrador bootstrap>`; si falta o es inválida, mostrar diagnóstico explícito. Nunca incluir el correo en archivos públicos.
- Roles literales: `admin`, `user1`, `user2`. `user1` y `user2` comparten permisos CRUD; solo admin administra usuarios y ACL de Sheets. Confirmar diferencias funcionales antes de crear permisos diferenciados.
- Panel: `appscript/Admin.html`, accesible por `?page=admin`; HTML por sí solo no autoriza nada.
- El botón `Vincular esta planilla` de la barra lateral guarda el ID de la hoja activa en Script Properties y crea solo `Registros` + encabezados cuando la pestaña no existe/vacía. No crea una pestaña auxiliar `Acceso` ni sobrescribe encabezados/datos existentes; si difieren, aborta. El `onOpen` del proyecto vinculado agrega el menú de Registro Único; su barra lateral tiene botones para CRUD/Admin y vincular la hoja activa. `registroUnicoBindActiveSpreadsheet` exige admin, no retargetea una hoja configurada distinta, y solo prepara `Registros`; no hay proyecto companion ni pestaña `Acceso`.
- Crear/actualizar/borrar pasa por `LockService.getScriptLock()`. Edición de Sheets por fuera de la app no adquiere ese lock.
- `Spreadsheet.addEditor/removeEditor` otorga/quita permiso individual bajo la identidad del admin, con scopes de Sheets. La baja desactiva la app y quita el permiso individual; avisar que accesos por grupo/dominio pueden subsistir aunque la operación individual haya sido exitosa. Si Google deniega la revocación, reportar permiso directo pendiente.
- La elección de ejecución implica que los editores pueden modificar directamente los datos en Sheets. La validación del CRUD no controla esos cambios.
- Pages es una landing estática que enlaza al `/exec` estable de Apps Script. Sin OAuth Client ID en Pages, sin recopilación de credenciales. No es un cliente API.

## Contrato y seguridad

Funciones cliente/servidor públicas: `apiBootstrap`, `apiListRecords`, `apiSaveRecord`, `apiDeleteRecord`, `apiAdminListUsers`, `apiAdminSaveUser`, `registroUnicoBindActiveSpreadsheet`. Todas deben autorizar en servidor. Helpers internos terminan en `_` y no son invocables desde `google.script.run`.

- Nunca confiar en campos `email`, `role`, `isAdmin` del navegador.
- Validar longitudes/formato en servidor; guardar entradas como texto para conservar ceros y evitar fórmulas; construir DOM con `textContent`, no insertar datos del Sheet como HTML.
- Impedir que el último admin activo o el admin de bootstrap se desactive/demote; evitar que un admin se quite a sí mismo.
- En alta, dar permiso Sheets y persistir usuario; en baja, marcar inactivo antes de retirar ACL. Registrar/loguear solo metadatos seguros, nunca DNI.
- `appsscript.json` declara scopes mínimos necesarios para Sheets e identidad. El uso de openById y add/remove editor requiere scope `spreadsheets`, amplio para las hojas de cálculo accesibles por cada usuario, no limitado automáticamente al ID configurado. Explicar y revisar esto antes de consentimiento. No usar DriveApp ni pedir `drive` scope amplio.
- DNI son datos sensibles. Pruebas solo sintéticas. No habilitar acceso general, publicar un Sheet, cambiar permisos heredados o exportar datos.

## Pruebas y criterios

- Offline: `python3 -m unittest discover -s tests -v`; valida contrato estático y no equivale a ejecutar Apps Script.
- TDD: antes de cambiar comportamiento, agregar prueba que falla, confirmar RED, implementar, confirmar GREEN y ejecutar suite.
- Para integración real, Claudio debe crear planilla sintética y deployment de prueba manual; usar cuentas de prueba. QA navegador móvil/escritorio y roles: no admin, admin, desconocido, correo no disponible, sesión revocada; alta, revocación directa, permisos heredados, CRUD, duplicado DNI, concurrencia y red.
- Apps Script runtime, OAuth, edición real, ACL Google, integración Pages→HtmlService y QA visual: `BLOCKED/NO VERIFICADO` hasta evidencia del deployment. Nunca inferir PASS desde source tests.
- Integración: revisar diff y verificar SHA; los cambios aprobados se integran en `main` desde la única rama local `dev`. No publicar Apps Script. Pages se publica desde la raíz de `main` del repo `claudiomaza/apps`; Claudio despliega manualmente como web app el proyecto Apps Script vinculado a la hoja.

## Configuración/rollback manual

- Deployment activo: verificar en Apps Script editor que ejecuta como quien accede y que el acceso requiere cuenta Google. El manifest no prueba estado activo.
- La carpeta conserva su propio `index.html` en `/apps/registro-unico/`. Mantener su URL `/exec` actual hasta que Claudio entregue el endpoint del proyecto vinculado; actualizar entonces landing y volver a publicar Pages. El menú usa dinámicamente `ScriptApp.getService().getUrl()`.
- Spreadsheet ID vive en Script Properties. Reconfiguración/cambio de hoja se hace con procedimiento manual y respaldo/confirmación; no resetear ni migrar datos.
- Rollback de HtmlService: restaurar fuentes previas y publicar nueva versión manualmente. Rollback Pages: restaurar el SHA anterior del repo `claudiomaza/apps`.
