# SPEC.md — Registro Único

## Estructura canónica del repositorio

La aplicación se mantiene dentro de `registro-unico/` en el repo canónico `claudiomaza/apps`: `appscript/` contiene exactamente `appsscript.json`, un único `Code.gs`, `Admin.html` y `Index.html`; toda la lógica de backend/validación está en Code.gs y los estilos son internos a cada HTML, sin `include()` ni archivos locales auxiliares. `index.html` contiene la landing en `/apps/registro-unico/`; `README.md`, `AGENT.md` y `SPEC.md` al nivel de la carpeta de la app. No mover archivos del proyecto a la raíz del repositorio.

## Objetivo y usuarios

CRUD web para incorporar y mantener registros de personas en una planilla centralizada. Los registros se almacenan en filas y sus atributos en columnas. Usuarios Google autorizados; admin inicial se configura privadamente por Claudio en la Script Property `REGISTRO_UNICO_INITIAL_ADMIN_EMAIL`; el repo público no incluye su correo.

## Arquitectura y decisión de identidad

Tres superficies/despliegues separados:

1. Backend Apps Script: única capa de la aplicación que accede a Sheets. Reglas y validación en servidor.
2. HtmlService: superficie autenticada del CRUD (`Index.html`) y panel admin independiente (`Admin.html`).
3. GitHub Pages: página estática de entrada que enlaza a la URL `/exec`; no autentica, no accede a Sheets, no contiene datos/secretos ni funciona como frontend CRUD.

Decisión explícita: Apps Script se ejecuta como el usuario que accede (`USER_DEPLOYING`). Se accede con cuenta Google; al primer uso Google pide autorizar scopes de Sheets e identidad. No se usa OAuth Client ID propio en Pages. La experiencia de Google está integrada en HtmlService, no en el sitio estático.

Cada usuario activo necesita permiso de edición en la planilla porque el web app corre con su identidad. El admin panel concede/revoca permiso individual de editor mediante Spreadsheet service si quien opera tiene autoridad para compartir. ACL heredadas de grupos/dominio pueden impedir revocación completa. Los usuarios pueden editar la hoja directamente; la app no controla validaciones en cambios directos. No ocultar este límite.

## Pantallas y flujos

### Entrada Pages

Título Registro Único, breve explicación y botón al deployment de HtmlService entregado por Claudio. No hay formulario de credenciales ni integración GIS; la autenticación ocurre en Google Apps Script.

### CRUD HtmlService (`/exec`)

- Google autentica al abrir e impone autorización de Apps Script.
- `apiBootstrap` devuelve contexto únicamente de la sesión real. Sin email disponible, sin rol activo o fallo de verificación: negar acceso.
- Formulario: Nombre, Apellido, DNI, Escolaridad; todos obligatorios; espacios externos recortados, texto máximo 80 caracteres para los tres primeros, 160 para escolaridad. DNI se trata como texto para preservar ceros iniciales.
- Crear agrega fila al final. Listar muestra todos los registros autorizados. Editar actualiza por ID estable. Eliminar pide confirmación y borra la fila de forma permanente.
- Datos se crean/modifican bajo lock de Apps Script. `DNI` debe ser único en las operaciones hechas por la aplicación.
- Estados: verificando sesión, cargando lista, sin registros, error de red/servidor, acceso denegado y guardado/eliminado. No exponer stack trace.
- Logout: cerrar sesión de Google es controlado por Google; la app no revoca OAuth. Un admin puede desactivar el acceso de app y retirar ACL de la planilla.

### Panel Admin (`/exec?page=admin`)

- Mismo bootstrap Google; solo rol `admin` puede invocar endpoints admin.
- Vincular la hoja desde la que se abre el script, sin pedir su ID, resetear ni sobrescribir. Si no existe `Registros`, crear pestaña y encabezados; si existe vacía, agregar encabezados; si difieren, abortar sin modificar. No crear pestaña auxiliar `Acceso`. Para acceso desde Sheets, el mismo proyecto Apps Script vinculado agrega el menú **Registro Único** y una barra lateral con botones para CRUD, Administración y vincular la hoja activa; el menú usa el endpoint del propio despliegue.
- Alta de correo + rol `admin`, `user1` o `user2`; para habilitar se concede permiso de editor en la planilla y se activa en ACL privada de Script Properties.
- Cambio de rol actualiza lista. `user1`/`user2` comparten todos los permisos CRUD; admin agrega administración de usuarios/permisos.
- Baja primero desactiva usuario en backend y luego intenta retirar permiso directo de editor. Informar que se quitó solo el permiso individual y que accesos heredados por grupo/dominio pueden subsistir; si Google deniega la revocación, informar el permiso individual pendiente. El usuario queda bloqueado en la app.
- Prohibido desactivar/demotear el último admin y el admin de bootstrap; un administrador no se puede desactivar a sí mismo.

## Datos

Pestaña `Registros`, encabezados exactos:

`ID | Nombre | Apellido | DNI | Escolaridad | CreadoEn | ActualizadoEn | CreadoPor | ActualizadoPor`

Las primeras cuatro columnas de negocio son requisitos del producto; las restantes soportan identidad estable y auditoría mínima. ID UUID inmutable. Timestamps como fecha de Sheets. DNI string para preservar ceros iniciales; sin validación geográfica hasta definir regla. Las celdas de texto se guardan en formato texto y se escapan prefijos de fórmula. No se registran valores DNI en logs.

ACL de usuarios en Script Properties: clave/versionado JSON con email normalizado, rol, estado activo y timestamp. `REGISTRO_UNICO_INITIAL_ADMIN_EMAIL` se configura por fuera del repo; si falta o no es una dirección válida, bootstrap falla con un mensaje que identifica la propiedad. No almacenar roles en la misma hoja que editores puedan alterar.

## Contratos

- `apiBootstrap() -> {ok,email,role,isAdmin,spreadsheetConfigured}` o mensaje seguro de denegación.
- `apiListRecords() -> Record[]` (requiere usuario activo).
- `apiSaveRecord({id?,nombre,apellido,dni,escolaridad}) -> {ok,id}` (create/update; valida, unicidad DNI y autorización).
- `apiDeleteRecord(id) -> {ok}` (delete permanente, usuario activo).
- `apiAdminListUsers() -> User[]`, `apiAdminSaveUser({email,role,active})`, `registroUnicoBindActiveSpreadsheet()`; requieren admin efectivo en servidor. El último solo toma la hoja activa del script vinculado; no admite IDs arbitrarios ni cambia una vinculación distinta.

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
