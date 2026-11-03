# Especificación transversal de rendimiento para Apps internas (GAS + Sheets)

## Objetivo y alcance

Aplicar estas pautas a cada proyecto nuevo o al optimizar uno existente. Mantener Sheets como fuente de verdad; ninguna mejora de rendimiento debe convertir CacheService o PropertiesService en almacenamiento durable, ni cambiar la semántica CRUD sin documentarlo y probarlo.

## Reglas de implementación

1. **Leer lo mínimo necesario.** Preferir `getRange(fila, columna, cantidadFilas, cantidadColumnas).getValues()` sobre `getDataRange()` cuando se conozca un rango acotado. No traer columnas irrelevantes ni la hoja completa para una respuesta paginada.
2. **Filas y claves válidas.** Excluir filas vacías con la clave primaria de la primera columna definida por el esquema; validar además estado y encabezados. No asumir que tener cualquier texto en la fila basta.
3. **Paginación real en el servidor.** Limitar `limit` y usar cursor estable (p. ej. `recordId`/posición versionada o clave ordenable). Evitar implementar paginación trayendo todas las filas primero y aplicando `slice()` después. Si se escanea desde el final en bloques, documentar el orden de salida y asegurar que las páginas no omitan ni dupliquen registros.
4. **Rangos por bloques.** Para hojas grandes, recorrer bloques contiguos con lecturas por lote y detenerse al tener suficientes filas válidas. Elegir el tamaño mediante pruebas: bloques grandes reducen llamadas pero usan más memoria; bloques chicos aumentan llamadas. No hacer una llamada por fila.
5. **Una lectura para una respuesta.** Leer una matriz de valores y transformar en memoria. Preparar el mapa encabezado→índice una vez por petición, no reconstruir nombres de propiedades ni hacer `getValue()` dentro de bucles.
6. **Escrituras agrupadas.** Para imports/lotes, validar todo antes de escribir y usar un `setValues()` rectangular por bloque; no `appendRow()` repetido. Limitar el tamaño de lote y devolver exactamente IDs aceptados/repetidos/rechazados. Para CRUD individual, `setValues()` de una fila también evita escrituras celda-a-celda.
7. **Caché efímera y versionada.** Usar CacheService solo para lecturas repetidas, de respuesta pequeña y regenerable. Clave por recurso/filtro/página/versión; invalidar lógicamente incrementando una versión al escribir. Tratar cache hit como aceleración, nunca como estado durable; el runtime puede desalojarlo.
8. **Locks cortos y selectivos.** `LockService` solo alrededor de comprobar versión/duplicado y confirmar cambios concurrentes. No mantener locks durante esperas externas o trabajo independiente. Si una operación externa (p. ej. Calendar) debe coordinarse con Sheets, documentar la ventana de inconsistencia y diseñar recuperación antes de acortar el lock.
9. **Menos trabajo por llamada.** Enviar solo los campos solicitados; limitar respuesta y payload; normalizar una vez. No recalcular informes/meses completos si el cliente solo pide una página o rango.
10. **Seguridad no se sacrifica.** Validar parámetros y allowlists; nunca exponer hojas arbitrarias; no devolver datos sin la validación de acceso acordada. La clave o token no se incluye en respuestas, logs, URLs ni cache. Una clave compartida en `.gs` puede servir como prototipo de acceso simple, pero se considera secreto expuesto a quienes puedan leer el código; usar secreto de usuario/configuración segura en producción, rotación, autorización individual y mitigación de intentos de fuerza bruta.

## QA visual, minimalismo y recursos frontend locales

- Antes de publicar cambios visuales, probar con Moli en layout real: viewport móvil `390x844` y escritorio; capturar screenshots, verificar overflow horizontal, controles legibles/alcanzables, foco y estados de carga/error. Revisar el DOM accesible y requests de red. En Moli, usar `--layout`, y descargar screenshot a archivo. Probar páginas públicas ya desplegadas o el servidor local autorizado; no declarar QA visual PASS por inspección estática/HTTP.
- Si Moli u otro navegador visual no inicia por cuota o limitación del entorno, reportar la evidencia como BLOCKED, indicar el error exacto y completar únicamente checks HTTP/estáticos que sí sean posibles; no inventar screenshots ni Core Web Vitals.
- Mantener UI minimalista y mobile-first: reutilizar HTML/CSS y APIs de plataforma; sumar componentes/dependencias solo si resuelven una necesidad comprobada. Estados de espera, éxito, error y guardado deben ser visibles.
- Las apps estáticas publicadas en GitHub Pages sirven desde su propio directorio HTML, CSS, JavaScript, manifest, imágenes y librerías. No cargar bibliotecas, fuentes, scripts ni estilos desde CDNs de terceros; preferir APIs nativas del navegador, fuentes del sistema y pocas dependencias.
- La URL del backend/API externo es la única excepción de origen externo necesaria. No confundir esa API con una dependencia visual/frontend.
- Al agregar una dependencia inevitable, versionarla en el repo y servirla desde Pages; registrar origen, licencia, versión y por qué no alcanza una API nativa.
- Validar en QA la pestaña Network o el inventario de recursos: cero solicitudes a CDNs; solo Pages y el endpoint backend autorizado.

## Configuración operativa desde Sheets y código agnóstico

- **Toda app interna debe tener una pestaña `Config` en su Sheet**, desde la primera versión, incluso si inicialmente necesita pocos parámetros. Es la vía normal para cambiar valores operativos sin editar ni volver a desplegar el código.
- Esquema compartido: encabezados `key` y `value`, una clave única por fila. Leer por nombre de encabezado y clave; nunca depender de posiciones fijas de fila/columna aparte del esquema, ni codificar en el backend valores que deban administrar usuarios. Las hojas/configuraciones iniciales deben crearse y documentarse junto con la app.
- Al iniciar, cargar la configuración en un mapa genérico y validar claves conocidas, tipos, límites y valores permitidos. Definir defaults seguros para claves opcionales; distinguir explícitamente valor ausente, vacío y valor inválido. Un error de configuración debe fallar claro y cerrado, no ignorarse ni activar un destino alternativo inadvertido.
- Mantener una caché efímera breve (máximo 30 s para valores operativos) e invalidación administrativa explícita cuando haga falta aplicación inmediata. CacheService nunca es fuente de verdad. Las operaciones deben leer una configuración consistente por petición.
- Reservar código/deploy para cambiar comportamiento, esquema o reglas de validación; valores de operación (IDs de destino, límites configurables, etiquetas, opciones habilitadas, etc.) deben poder cambiarse desde Config siempre que sea seguro. Documentar expresamente qué ajustes requieren redeploy y cuáles no.
- Procurar que el código sea lo más **agnóstico y reutilizable** posible: una capa común de lectura, validación, defaults y caché de Config; nombres y valores configurables, no esparcidos como literales por las funciones. Separar reglas genéricas de infraestructura/contrato de los adaptadores o reglas inevitables del dominio. Evitar ramas duplicadas por app, dependencias de nombres/filas concretas, hardcodes de IDs y lógica que suponga un único entorno. No abstraer en exceso: el código de dominio sigue siendo explícito y testeable.
- No almacenar contraseñas, tokens ni secretos en `Config` en texto plano. Config no sustituye autorización; restringir la edición del Sheet a administradores confiables. Validar entradas como datos no confiables y no permitir que una celda elija funciones, nombres de hojas arbitrarias, URLs ejecutables o acciones sin allowlist.
- Cada ajuste debe documentar: clave, tipo/formato, default, si admite vacío, validación, efecto, tiempo de propagación y si requiere autorización o redeploy. Probar valores ausentes, válidos, inválidos, vacíos y cambios dentro del TTL.

## Configuración de destino Google Calendar

- Cada app debe tener una pestaña `Config` con encabezados `key` y `value`. En Calendario, agregar la fila `calendarId` / valor en `Config!B5`. La búsqueda backend se hace por clave y no debe depender del número de fila; B5 es la ubicación inicial documentada. Un valor vacío conserva el calendario principal.
- Para encontrar el ID: Google Calendar en la web → ⚙️ Configuración → elegir el calendario en la columna izquierda → **Integrar el calendario** → copiar **ID del calendario**. Pegar el valor completo en `Config!B5`, no en GitHub, HTML, JavaScript, URLs ni logs. El ID no es una contraseña, pero mantenerlo en Sheets evita fijarlo a una implementación y permite cambiar destino sin publicar código.
- La cuenta efectiva que ejecuta Apps Script debe poder acceder al calendario con permiso **Realizar cambios en los eventos**. Si la web app se ejecuta como propietario, ese es el propietario; si se cambia el modo de ejecución, revisar permisos y reautorizar los scopes necesarios.
- El backend debe llamar `CalendarApp.getCalendarById(id)` cuando `calendarId` no está vacío; si no encuentra el calendario o no tiene acceso, fallar claramente (`CALENDAR_NOT_FOUND`) y no desviar silenciosamente escrituras al calendario principal. Si está vacío, usar el calendario principal.
- Guardar el `calendarId` junto a cada evento en Sheets y usar ese ID guardado para editar/eliminar. Así, cambiar la configuración solo afecta eventos nuevos y no rompe operaciones sobre eventos anteriores. Compatibilidad de filas viejas sin ID debe conservar su destino previo (calendario principal).
- Cachear la lectura de Config solo de forma efímera (30 s máximo); cambios se aplican dentro de ese plazo. Ofrecer una función administrativa para invalidar cache de inmediato (en Calendario, `limpiarCacheConfig()`). Nunca cachear Config como almacenamiento durable.
- Al integrar o ampliar Google Calendar, mantener los scopes de calendario mínimos requeridos en `appsscript.json`; guardar, autorizar/revisar los permisos y desplegar una nueva versión del Apps Script. Cambiar el valor de `Config!B5` no requiere redeploy una vez publicado ese backend.

## Aplicación actual

### Registro de notas

- La pestaña `Config` (`key`/`value`) es obligatoria. El backend lee `maxPageSize` (default 300, permitido 1–300) y `maxBatchSize` (default 100, permitido 1–100); vacíos/ausentes usan defaults. Cambiar esos valores no requiere redeploy; la caché dura hasta 30 s y `limpiarCacheConfig()` la invalida inmediatamente.
- La operación de autenticación admite `includeInitialList:true`; valida credenciales y devuelve la primera página dentro de la misma respuesta autenticada. El cliente aplica esos registros directamente sin una segunda llamada `list`; si la lectura inicial falla, conserva el login y cae al listado normal. La respuesta de `auth` sin esa opción conserva su contrato previo.
- El listado lee bloques de hasta 500 filas desde el final y se detiene cuando obtiene el límite de registros activos, en vez de leer y materializar toda la hoja antes de `slice(-limit)`.
- `list` continúa devolviendo las notas más recientes primero. El contrato no expone cursor todavía; si el producto necesita recorrer más de `MAX_PAGE_SIZE`, agregar cursor estable y prueba de no duplicación/omisión.
- Con muchas filas eliminadas, el recorrido puede leer múltiples bloques. Medir llamadas/latencia con datos de carga antes de ajustar `500`.

### Calendario

- La operación `auth` admite `includeInitialList:true` junto con `from` y `limit`; retorna la primera lista mensual en la misma respuesta, ahorrando un viaje de red. Un fallo solo en esa lista no revierte el login: el cliente hace fallback al endpoint `list` habitual.
- Lecturas mensuales repetidas se sirven desde CacheService con clave versionada; crear, actualizar o eliminar incrementa `DATA_VERSION`.
- En cache miss, la lectura escanea bloques de hasta 500 filas desde el principio y se detiene al reunir el límite de eventos activos del mes; no usa `getDataRange()` ni materializa toda la hoja. Conserva el orden original de filas, igual que la implementación anterior.
- No interrumpir el recorrido por una fecha aparentemente antigua: las filas pueden cargarse fuera de orden cronológico. Con meses antiguos, pocos eventos recientes o muchos eliminados puede leer varios bloques; medir con hojas representativas antes de cambiar tamaño o semántica.
- La grilla agrupa los eventos una vez por día en un `Map`, evitando filtrar la lista completa 42 veces por cada render. Mantener equivalencia visual y pruebas para eventos sin fecha válida, eliminados y días con más de tres eventos.
- Si mediciones futuras justifican más mejora, incorporar un índice mensual en Sheets o particionado, con pruebas de consistencia tras ediciones/eliminaciones y reconstrucción.

### Ambos proyectos

- Las apps pueden solicitar `includeInitialList:true` al autenticar, con los parámetros del primer listado. El backend solo agrega registros a la respuesta después de validar las credenciales; el cliente pinta esa lista y evita una segunda llamada. Mantener el fallback a `list` si la lista opcional falla, sin invalidar un login válido. Las operaciones auth antiguas sin la bandera conservan el contrato original.
- El cliente conserva caché local en memoria durante 30 s para navegación/listas; botones de actualizar y reconexión fuerzan lectura fresca. CRUD actualiza memoria/cache con la respuesta confirmada del servidor, sin hacer un refetch adicional. No persistir datos educativos sensibles en localStorage/cache duradera.
- Los endpoints de lote aceptan como máximo 100 filas y escriben con `setValues()`.
- CRUD usa rangos y una escritura por fila, lock breve, control optimista de versión y caché solo de lecturas.
- Cada Sheet mantiene una pestaña `Usuarios` con dos columnas: identificador de usuario y `pass`. El primer encabezado puede ser `usuario` (recomendado) o `mail` por compatibilidad con hojas existentes; su valor no tiene que ser un correo. El backend autentica contra esas filas.

## Contrato común de acceso para todas las apps

Este contrato es obligatorio para Calendario, Registro de notas y cualquier app interna nueva del repositorio, aunque cambie su propósito o sus datos. No volver a introducir validación de correo ni un mínimo de longitud de contraseña en una app individual.

- Cada app usa el mismo esquema de usuarios: pestaña `Usuarios`, encabezados canónicos exactos `usuario` y `pass`, una cuenta por fila. Los encabezados no dependen del producto. Solo por migración, el backend de las apps existentes puede aceptar temporalmente `mail` como alias de la primera columna; toda app nueva debe crear `usuario`.
- El campo visible se llama **Usuario** y es texto, no tipo email. Se acepta cualquier carácter imprimible; no puede quedar vacío, contener caracteres de control ni superar 254 caracteres. Se recortan espacios al principio/final y la comparación/unicidad no distingue mayúsculas. Los nombres de usuario deben ser únicos dentro de la app.
- La contraseña admite cualquier carácter y tiene entre 1 y 200 caracteres. Se verifica exactamente como se escribió: no recortar espacios ni cambiar mayúsculas, minúsculas o símbolos. El formulario debe permitir un solo carácter.
- Máximo 200 cuentas por app. Las filas completamente vacías se ignoran; no dejar filas parcialmente completadas. Una fila inválida debe rechazarse como configuración (`USERS_SHEET_INVALID`), sin permitir el acceso.
- El mensaje de autenticación del frontend y el contrato de API deben ser iguales entre apps (`user` y `pass`). La sesión firmada se valida en cada operación protegida; nunca devolver ni registrar contraseñas.

## Gestión de usuarios

- Agregar, actualizar o quitar una fila de `Usuarios` cambia las credenciales de acceso sin modificar ni volver a desplegar el código. El backend usa una caché de 15 segundos; los cambios se reflejan en ese plazo.
- Mantener consistentes interfaz, validación del backend, hojas y documentación con el contrato común anterior. Una divergencia vuelve a producir errores de configuración o experiencias distintas entre apps.
- `pass` queda en texto plano en la planilla. Toda persona con acceso de lectura al Sheet puede verlo; restringir el acceso del documento a administradores confiables. No compartir el Sheet de Registro de notas con docentes/alumnos como método de acceso a la app sin separar la administración de cuentas; las hojas no son un almacén de secretos.
- El token firmado incluye el usuario, expiración y una huella de credencial; se valida en cada solicitud. Eliminar la fila o cambiar la contraseña invalida la sesión tras refrescarse la caché.
- La pestaña no agrega roles ni autorización por curso. Un login no reemplaza autorización: definir qué puede leer/escribir cada persona antes de exponer datos educativos.
- El cliente conserva solo el token temporal en `sessionStorage`, no la contraseña. Nunca devolver ni registrar `pass` desde el backend.
- Para datos sensibles o acceso multirol, preferir autenticación institucional y almacenamiento adecuado de credenciales; no habilitar datos reales de estudiantes con este prototipo hasta implementar permisos institucionales.

## Criterios de prueba para futuras optimizaciones

Medir antes/después con hojas pequeñas, típicas y grandes, incluyendo filas vacías y eliminadas:

- número de llamadas a Spreadsheet service y filas/columnas leídas;
- latencia p50/p95 y memoria/tiempo de ejecución cuando sea observable;
- corrección de orden, límites, caché tras CRUD y respuestas ante versión en conflicto;
- integridad de escritura por lote, duplicados y fallo parcial;
- volumen devuelto y que no aparezcan filas vacías/inactivas;
- no comparar solo una caché caliente: medir también primera lectura y expiración.

No declarar mejora de capacidad por una microprueba aislada. Registrar datos, concurrencia, tamaño de lote, tiempo de ejecución, errores y versión del código. Las cuotas de GAS cambian: verificarlas al preparar el despliegue.
