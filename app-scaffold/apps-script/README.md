# Apps Script — estructura, login y reset de la plantilla

Este backend se entrega como código para revisión y despliegue manual. **No se ejecutó contra una planilla real ni se desplegó desde este trabajo.** El frontend sigue usando su login demo local y no llama a este backend.

## Esquema operativo exacto

La base tiene únicamente estas cuatro pestañas, en este orden sugerido al crearlas:

- `Registros`: `recordId`, `type`, `entityId`, `dataJson`, `version`, `status`, `updatedAt`, `createdAt`. Una entidad por fila; `dataJson` contiene los datos JSON. No hay columnas por campo, hojas duplicadas ni vistas materializadas.
- `Config`: `key`, `value`, `description`. Inicializa `maxPageSize | 300 | Máximo de registros por página.` y `maxBatchSize | 100 | Máximo de cambios por sincronización.`
- `Usuarios`: `usuario`, `pass`, `rol`, `alcances`, `mail`, `nombre`, `docenteId`.
- `Disponibilidad docente`: `availabilityId`, `teacherId`, `dayOfWeek`, `startTime`, `endTime`, `updatedAt`, `status`.

`Code.gs` es la única fuente del backend; este README documenta el contrato y no replica el código.

## Crear / reparar, sin borrar datos

La opción de menú **Crear / reparar estructura (conservar datos)** agrega solo las pestañas y encabezados faltantes y claves de configuración ausentes; conserva filas y valores existentes. Si hay pestañas inesperadas, encabezados fuera de orden/incompatibles, datos en columnas que no se pueden migrar de forma segura o claves de configuración duplicadas, se detiene antes de escribir y requiere resolución manual. No renombra ni borra datos para forzar una migración.

## RESET total, destructivo e irreversible

El menú **RESET total… (elimina hojas y filas)** abre el diálogo que pide únicamente el correo del administrador y la confirmación exacta `RESETEAR`. El servidor valida ambos valores antes de borrar; si pasan, elimina las demás hojas y borra/reutiliza una hoja para recrear el esquema, configura los dos valores iniciales y crea un único administrador. El reset también elimina `DATA_VERSION` de `ScriptCache`; el token temporal de diálogo vence a los 10 minutos y se consume una sola vez. El lock de documento serializa resets y se libera con `finally`.

La fila admin queda así: `usuario` y `mail` son el correo, `pass` es una clave aleatoria temporal generada en el servidor, `rol=admin`, `alcances=[]`, `nombre=Administrador`, `docenteId` vacío. La contraseña se muestra una sola vez en el diálogo al terminar; copiala y guardala en un lugar seguro. **No se envía por correo ni se registra en logs.** Si se cierra el diálogo antes de copiarla, no se puede recuperar; habrá que realizar un nuevo reset autorizado. El correo usado como login no demuestra que el usuario controle esa dirección; es un identificador inicial, no un flujo de verificación de email.

**Antes de confirmar, hacé un respaldo manual completo de la planilla. El reset destruye todas las hojas y filas, incluso las que no pertenezcan a la app; no se puede deshacer.** No lo pruebes en una planilla operativa.

El login lee `usuario`, `pass` y `rol` del esquema nuevo. `pass` queda en texto plano por compatibilidad con el login actual. Es un riesgo: restringí el acceso de la planilla a personas confiables. No se cambió solo el esquema sin adaptar el lector del login. El login del frontend sigue siendo una demo independiente, no usa esta cuenta ni es autenticación de producción.

El reset no tiene una acción en `doPost` ni endpoint anónimo de borrado. El diálogo se abre desde el menú y lleva un token aleatorio corto, almacenado en `UserCache` bajo la clave temporal del usuario; el servidor verifica y consume ese token antes de tomar el lock o modificar hojas. `google.script.run` es solo el transporte del diálogo: sin un token válido emitido al abrir el menú la función falla cerrada. `doPost` conserva únicamente login/sesión. Las validaciones de correo y confirmación también se repiten en servidor.

## Scopes y preparación manual

El manifiesto mantiene runtime V8 y los scopes existentes, con `https://www.googleapis.com/auth/script.container.ui` para el menú y el diálogo, además de `https://www.googleapis.com/auth/spreadsheets` para la planilla. No se agrega un scope de permisos: `Session.getTemporaryActiveUserKey()` y `UserCache` sirven para ligar el token de diálogo a la sesión de usuario actual. No agregues otros permisos sin una función que los requiera.

1. Creá una **planilla nueva de prueba** y abrí **Extensiones → Apps Script**.
2. Copiá `Code.gs` y creá un archivo HTML llamado exactamente `ResetDialog`, copiando `ResetDialog.html`. Reemplazá `appsscript.json` con el manifiesto del repo.
3. Guardá. Ejecutá `setupTemplate` desde el editor, revisá los scopes solicitados y autorizalos. Esta operación crea/repara estructura sin borrar filas; al abrir o recargar la planilla aparece el menú.
4. Probá el diálogo y el reset únicamente en esa planilla sintética, después de hacer un respaldo manual. La clave temporal se muestra una sola vez.
5. Para publicar manualmente la Web App de login, revisá el código y elegí la identidad de ejecución y audiencia apropiadas. El manifiesto conservado configura `USER_DEPLOYING` y `ANYONE_ANONYMOUS` como el endpoint de autenticación existente; esto no habilita el reset vía endpoint. Guardá la implementación y usá su URL solo cuando el frontend integre explícitamente el backend.

No se ejecutó `setupTemplate` sobre datos reales, no se ejecutó ningún reset real y no se desplegó Apps Script. Esas acciones quedan pendientes de revisión y acción humana.
