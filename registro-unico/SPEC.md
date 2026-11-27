# SPEC.md — Registro Único

## Estructura canónica del repositorio

La aplicación se mantiene dentro de `registro-unico/` en el repo canónico `claudiomaza/apps`: `appscript/` contiene exactamente `appsscript.json`, un `Code.gs` y una interfaz integrada `Registro.html`. `doGet` y el menú de Sheets usan el mismo HtmlService; el HTML se comunica con el backend por `google.script.run` a través de un dispatcher allowlisted. `index.html` separado contiene la landing Pages. No mover fuentes del proyecto a la raíz del repositorio.

## Objetivo y usuarios

CRUD web para incorporar y mantener registros de personas en una planilla centralizada. Los registros se almacenan en filas y sus atributos en columnas. Usuarios Google autorizados; en primera vinculación el dueño autenticado de la planilla queda como admin inicial (guardado en Script Properties privada, nunca en el repo público). Drive compartido sin dueño individual permite bootstrap manual privado.

## Arquitectura y decisión de identidad

Dos superficies/despliegues separados:

1. Proyecto Apps Script vinculado: backend y vista integrada HtmlService (`Registro.html`), servida tanto por `GET /exec` como por el menú. El frontend usa `google.script.run`; el único RPC del cliente es `runRegistroUnicoApi({action,payload})`, con acciones permitidas explícitamente. Toda lectura/escritura y autorización ocurre en servidor.
2. GitHub Pages: landing estática que enlaza a `/exec`; no autentica, no accede a Sheets, no contiene datos/secretos ni funciona como frontend CRUD.

Decisión explícita: Apps Script se ejecuta como el usuario que accede (`USER_ACCESSING`), no como quien lo desplegó. Así `Session.getActiveUser()`, Sheets y la ACL reflejan la cuenta que está usando la aplicación. Se requiere cuenta Google; al primer uso se autorizan scopes de Sheets e identidad. No se usa OAuth Client ID propio en Pages; la experiencia de Google está integrada en HtmlService.

Cada usuario activo necesita permiso de edición en la planilla porque el web app corre con su identidad. El admin panel concede/revoca permiso individual de editor mediante Spreadsheet service si quien opera tiene autoridad para compartir. ACL heredadas de grupos/dominio pueden impedir revocación completa. Los usuarios pueden editar la hoja directamente; la app no controla validaciones en cambios directos. No ocultar este límite.

## Pantallas y flujos

### Entrada Pages

Título Registro Único, breve explicación y botón al deployment de HtmlService entregado por Claudio. No hay formulario de credenciales ni integración GIS; la autenticación ocurre en Google Apps Script.

### CRUD HtmlService (`/exec`)

- Google autentica al abrir e impone autorización de Apps Script.
- La acción RPC `bootstrap` devuelve contexto solo para la sesión real. Sin email o sin usuario activo, deniega acceso; si el proyecto aún no está vinculado, devuelve estado sin configuración sin exponer datos y guía a usar el menú **Vincular esta planilla**.
- Formulario: Nombre, Apellido, DNI, Escolaridad; todos obligatorios; espacios externos recortados, texto máximo 80 caracteres para los tres primeros, 160 para escolaridad. DNI se trata como texto para preservar ceros iniciales.
- Crear agrega fila al final. Listar muestra todos los registros autorizados. Editar actualiza por ID estable. Eliminar pide confirmación y borra la fila de forma permanente.
- Datos se crean/modifican bajo lock de Apps Script. `DNI` debe ser único en las operaciones hechas por la aplicación.
- Estados: verificando sesión, cargando lista, sin registros, error de red/servidor, acceso denegado y guardado/eliminado. No exponer stack trace.
- Logout: cerrar sesión de Google es controlado por Google; la app no revoca OAuth. Un admin puede desactivar el acceso de app y retirar ACL de la planilla.

### Panel Admin (`/exec?page=admin`)

- Mismo bootstrap Google; el panel y sus endpoints requieren tanto rol `admin` como ser el dueño de la planilla. La UI oculta los botones a no-dueños; servidor valida de nuevo en cada endpoint.
- Vincular la hoja desde la que se abre el script, sin pedir su ID, resetear ni sobrescribir. Si no existe `Registros`, crear pestaña y encabezados; si existe vacía, agregar encabezados; si difieren, abortar sin modificar. No crear pestaña auxiliar `Acceso`. El menú de Sheets abre directamente el mismo HtmlService integrado en un diálogo; **Abrir Registro Único** y **Administración** son items separados. El menú de Sheets muestra ambas opciones porque `onOpen` puede no recibir el correo; solo el dueño/admin puede ejecutarlas, validado server-side.
- Alta de correo + rol `admin`, `user1` o `user2`; para habilitar se concede permiso de editor en la planilla y se activa en ACL privada de Script Properties.
- Cambio de rol actualiza lista. `user1`/`user2` comparten todos los permisos CRUD; admin agrega administración de usuarios/permisos.
- Baja primero desactiva usuario en backend y luego intenta retirar permiso directo de editor. Informar que se quitó solo el permiso individual y que accesos heredados por grupo/dominio pueden subsistir; si Google deniega la revocación, informar el permiso individual pendiente. El usuario queda bloqueado en la app.
- Prohibido desactivar/demotear el último admin y el admin de bootstrap; un administrador no se puede desactivar a sí mismo.

## Datos

Pestaña `Registros`, encabezados exactos:

`ID | Nombre | Apellido | DNI | Escolaridad | CreadoEn | ActualizadoEn | CreadoPor | ActualizadoPor`

Las primeras cuatro columnas de negocio son requisitos del producto; las restantes soportan identidad estable y auditoría mínima. ID UUID inmutable. Timestamps como fecha de Sheets. DNI string para preservar ceros iniciales; sin validación geográfica hasta definir regla. Las celdas de texto se guardan en formato texto y se escapan prefijos de fórmula. No se registran valores DNI en logs.

ACL de usuarios en Script Properties: clave/versionado JSON con email normalizado, rol, estado activo y timestamp. En una configuración nueva, el dueño de la planilla que confirma el botón de vinculación queda como admin inicial; el correo se guarda solo en Script Properties, nunca en el repo. Drive compartido sin dueño individual requiere bootstrap privado manual. No almacenar roles en la misma hoja que editores puedan alterar.

## Contratos

- `runRegistroUnicoApi({action,payload})` solo admite `bootstrap`, `listRecords`, `saveRecord`, `deleteRecord`, `listUsers` y `saveUser`; rechaza cualquier acción no allowlisted.
- `bootstrap -> {ok,email,role,isAdmin,canAdmin,spreadsheetConfigured}` o mensaje seguro de denegación; acciones de datos requieren usuario activo; acciones de usuarios requieren dueño + admin.
- `saveRecord({id?,nombre,apellido,dni,escolaridad}) -> {ok,id}` (create/update; valida, unicidad DNI y autorización); `deleteRecord({id}) -> {ok}`.
- `registroUnicoBindActiveSpreadsheet()` solo toma la hoja activa del script vinculado, valida dueño y no admite IDs arbitrarios ni cambia una vinculación distinta. El menú muestra opciones administrativas porque `onOpen` puede carecer de identidad; el servidor las bloquea a no-dueños.

El navegador no puede establecer identidad ni rol enviando campos. AppScript obtiene identidad de `Session.getActiveUser()` en modo ejecutar como usuario; si correo vacío, fail closed. Errores devueltos sin información interna sensible.

## Concurrencia, límites y permisos

- LockService serializa operaciones de aplicación; edición directa en Sheets no respeta el lock y puede tener carreras.
- Google Sheets y Apps Script mantienen sus propias cuotas y límites por usuario/servicio; medir con pruebas, usar lecturas/escrituras agrupadas donde aplique; no prometer capacidad o performance.
- Google consentimiento requiere scopes declarados (Sheets e identidad). Al ejecutarse desde el proyecto vinculado y abrir la planilla por ID almacenado en Script Properties, `spreadsheets` es un scope amplio sobre hojas accesibles por el usuario, no queda limitado automáticamente a la hoja configurada; explicar antes de que autorice. Cada cuenta usuaria aprueba Apps Script; revocar en Google Account no equivale a baja de rol.
- Configuración de acceso/identidad del deployment debe verificarse manualmente; manifest no modifica deployment ya activo.

## Seguridad y privacidad

- DNI es dato personal: mínimo privilegio, cuentas protegidas, no fixtures reales, no publicación de planilla ni link abierto.
- Solo Admin otorga/quita usuarios desde la app; la cuenta efectiva necesita autoridad Google para compartir.
- Los roles controlan la app, pero no bloquean a editores del acceso directo a la hoja ni sus cambios externos. Configuración de compartir y accesos heredados deben revisarse manualmente.
- Escape de datos en DOM, validación server-side, bloqueo de último admin, lock de escrituras.
- Ningún backend/DB externo aprobado. No OAuth Client ID de Pages.

## Despliegue y aceptación

GitHub Pages publica desde la raíz de `claudiomaza/apps`; la ruta de la app es `/apps/registro-unico/`. El proyecto Apps Script vinculado se despliega/configura manualmente por Claudio, no se usa clasp por agente. No publicar datos reales, IDs de hojas ni secretos; landing y menú enlazan al deployment `/exec` que Claudio proporcionó. Compatibilidad depende de URL `/exec` y contrato v1.

PASS completo requiere fuente sincronizada, tests, aprobación de scopes, prueba con sheet sintética y cuentas reales de prueba, navegador móvil/escritorio, verificación de revocación y SHA publicado. Hasta despliegue/prueba manual, runtime Apps Script, OAuth, CORS/redirecciones, ACL Google y QA visual son `BLOCKED/NO VERIFICADO`. Sin datos reales ni despliegues como parte del desarrollo inicial.
