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

## Aplicación actual

### Registro de notas

- El listado lee bloques de hasta 500 filas desde el final y se detiene cuando obtiene el límite de registros activos, en vez de leer y materializar toda la hoja antes de `slice(-limit)`.
- `list` continúa devolviendo las notas más recientes primero. El contrato no expone cursor todavía; si el producto necesita recorrer más de `MAX_PAGE_SIZE`, agregar cursor estable y prueba de no duplicación/omisión.
- Con muchas filas eliminadas, el recorrido puede leer múltiples bloques. Medir llamadas/latencia con datos de carga antes de ajustar `500`.

### Calendario

- Lecturas mensuales repetidas se sirven desde CacheService con clave versionada; crear, actualizar o eliminar incrementa `DATA_VERSION`.
- La primera lectura de un mes todavía escanea los datos almacenados para filtrar eventos, porque los eventos pueden cargarse fuera de orden cronológico. No detener el escaneo suponiendo que la fecha de una fila es anterior a la del evento buscado.
- Como siguiente optimización, si las mediciones lo justifican, incorporar un índice mensual mantenido dentro de Sheets, o una estrategia de particionado por mes; validar consistencia tras ediciones/eliminaciones y reconstrucción.

### Ambos proyectos

- Los endpoints de lote aceptan como máximo 100 filas y escriben con `setValues()`.
- CRUD usa rangos y una escritura por fila, lock breve, control optimista de versión y caché solo de lecturas.
- Las apps con login multiusuario leen credenciales desde `usuarios.json.html` dentro del proyecto Apps Script; no guardan claves en el `.gs`. El repo incluye plantillas vacías sin usuarios activos ni credenciales reales.

## Usuarios y contraseñas gestionados fuera del código

- Para login local, mantener usuarios en un archivo HTML del proyecto Apps Script creado con **Agregar archivo → HTML**, nombre `usuarios.json`; el editor lo mostrará como `usuarios.json.html`. Contenido JSON puro, sin tags HTML/JS. El `.gs` lo lee con `HtmlService.createHtmlOutputFromFile('usuarios.json').getContent()`.
- Esquema: `{ "users": [{ "usuario": "...", "clave": "...", "activo": true }] }`. Nombres únicos sin distinguir mayúsculas; `activo:false` revoca. Claves activas mínimas de 12 caracteres; máximo 200 usuarios.
- No guardar credenciales reales en GitHub, Markdown, frontend o chat. Los ejemplos versionados solo contienen `users: []`. Completar credenciales en el editor Apps Script; cualquier editor del proyecto puede leerlas.
- El `.gs` valida el JSON en servidor y cachea 15 s. Tras editar, ejecutar `limpiarCacheUsuarios()` para vaciar la caché, guardar y actualizar el deployment versionado si corresponde. CacheService no es durable.
- El token firmado incluye usuario, vencimiento y huella de credenciales activas; validarlo en cada endpoint. Quitar/desactivar usuario o cambiar su clave invalida la sesión tras actualizar fuente/cache.
- Esto separa claves del `.gs` principal pero no las oculta a editores ni provee roles. Para datos sensibles: login institucional y permisos por curso/rol.

- Un login no reemplaza autorización: definir qué puede leer/escribir cada usuario antes de exponer datos de estudiantes.

## Cuentas multiusuario en proyectos que las requieran

- No repetir bloques de login. Agregar/revocar cuentas editando `usuarios.json`, validando identidad y clave en servidor.
- El cliente conserva solo el token temporal en `sessionStorage`, no la contraseña.
- Cambiar clave, desactivar o retirar cuenta invalida sesiones después del TTL de caché o de borrarla.
- No afirmar aislamiento por curso/rol hasta implementarlo y probarlo.

## Criterios de prueba para futuras optimizaciones

Medir antes/después con hojas pequeñas, típicas y grandes, incluyendo filas vacías y eliminadas:

- número de llamadas a Spreadsheet service y filas/columnas leídas;
- latencia p50/p95 y memoria/tiempo de ejecución cuando sea observable;
- corrección de orden, límites, caché tras CRUD y respuestas ante versión en conflicto;
- integridad de escritura por lote, duplicados y fallo parcial;
- volumen devuelto y que no aparezcan filas vacías/inactivas;
- no comparar solo una caché caliente: medir también primera lectura y expiración.

No declarar mejora de capacidad por una microprueba aislada. Registrar datos, concurrencia, tamaño de lote, tiempo de ejecución, errores y versión del código. Las cuotas de GAS cambian: verificarlas al preparar el despliegue.
