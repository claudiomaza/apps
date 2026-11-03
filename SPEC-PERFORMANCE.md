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
- Cada Sheet mantiene una pestaña `Usuarios` con dos columnas: identificador de usuario y `pass`. El primer encabezado puede ser `usuario` (recomendado) o `mail` por compatibilidad con hojas existentes; su valor no tiene que ser un correo. El backend autentica contra esas filas.

## Gestión de usuarios

- Agregar, actualizar o quitar una fila de `Usuarios` cambia las credenciales de acceso sin modificar ni volver a desplegar el código. El backend usa una caché de 15 segundos; los cambios se reflejan en ese plazo.
- El identificador (bajo el encabezado `usuario` o el heredado `mail`) puede ser cualquier texto no vacío de hasta 254 caracteres, sin caracteres de control; se compara sin distinguir mayúsculas y debe ser único. `pass` puede contener cualquier carácter y debe tener entre 1 y 200 caracteres; se compara exactamente (mayúsculas, símbolos y espacios cuentan). Máximo 200 cuentas. No dejar filas con un solo campo completado. La interfaz solicita “Usuario”, no “Correo electrónico”. Una fila incompleta o que infrinja los límites hace que el backend rechace la configuración con `USERS_SHEET_INVALID`.
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
