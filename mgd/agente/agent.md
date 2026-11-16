# Guía maestra de agentes: reconstruir y mantener MGD

## 1. Propósito y autoridad del documento

Este archivo permite que un agente sin contexto de conversaciones reconstruya la estructura, comportamiento, reglas, verificaciones y límites operativos del proyecto MGD. Es guía de trabajo, no autorización para publicar, modificar datos reales, desplegar Apps Script, integrar a `main` o cambiar permisos. Ante contradicción, prevalecen las reglas del repositorio y las decisiones explícitas más recientes de Claudio; documentar discrepancias y no inferir.

**Producto:** MGD significa «Módulo de Gestión Docente» y su bajada de marca es «Tu aula en un solo lugar».

**Repositorio de código fuente:** `https://github.com/claudiomaza/apps`, aplicación en `mgd/`. GitHub es la fuente de verdad del código/documentación. La hoja operativa conserva el nombre histórico `notas`; no renombrar hojas ni IDs/backend.

**URL pública existente:** `https://claudiomaza.github.io/apps/mgd/`. La rama `main` sirve Pages. Apps Script se despliega por separado.

## 2. Reglas de trabajo obligatorias

1. Inspeccionar rama, SHA, estado, diff y documentación antes de tocar archivos; no asumir que un checkout o worktree es limpio.
2. Usar worktree/branch aislados para cambios; conservar cambios ajenos y archivos untracked.
3. Mobile-first, HTML/CSS/JS vanilla salvo decisión explícita; no sumar dependencias por comodidad.
4. Implementar cambios de comportamiento con TDD: prueba roja, implementación mínima, prueba verde, refactor y regresión.
5. Datos reales: lectura solo para tareas autorizadas. Nunca alterar Sheets reales, enviar cambios, migrar datos, ejecutar Sync, modificar usuarios/permisos, ni tocar Apps Script activo sin permiso específico.
6. Los cambios del frontend se preparan en IndexedDB y solo se envían cuando la persona elige **Sincronizar** y selecciona registros. No programar sync automático.
7. Separar inequívocamente implementación, tests, QA visual, sesión autenticada, pruebas de backend, integración, revisión, commit, push, merge y deploy. Tests no prueban sesión real ni servicio desplegado.
8. No publicar ni mergear esta tarea: el alcance autorizado es desarrollo aislado y verificación local/sintética.
9. No fabricar datos personales. Usar fixtures sintéticos para tests/QA.
10. No cambiar control de acceso por conveniencia; enforcement servidor en Apps Script es autoridad. Frontend solo mejora UX.
11. Confirmar decisiones irreversibles y acciones externas; conservar rollback.
12. Registrar las decisiones y contratos comunes en `../SPEC-PERFORMANCE.md` cuando haya autorización para actualizar la fuente de verdad; no ocultar cambios grandes en notas efímeras.

## 3. Topología del proyecto

- `mgd/index.html`: estructura UI, navegación, diálogos, carga ordenada de scripts.
- `mgd/app.js`: orquestación, vistas, formularios, estado, eventos, staging/sync, Excel.
- `mgd/gradebook.js`: tipos y validaciones comunes, notas, escalas, promedio ponderado, fechas y claves.
- `mgd/summary.js`: cálculos/filtros de estadísticas y cohortes.
- `mgd/context.js`: contextos exactos escuela/materia/curso/división y cohorts visibles.
- `mgd/trajectory.js`: lógica pura de trayectoria y resultados por materia.
- `mgd/stage-store.js`: IndexedDB para borradores locales por usuario; no reemplazar.
- `mgd/config.js`: configuración pública del frontend. No copiar secretos.
- `mgd/xlsx-lazy.js`: carga diferida de Excel.
- `mgd/styles.css`: UI responsiva, accesibilidad, tema.
- `mgd/sw.js`, `manifest.json`: PWA/cache; respetar política cache/no-store y no duplicar service workers.
- `mgd/apps-script/Code.gs`: API de Sheets, autenticación, autorizaciones, validación, consistencia, batch versionado.
- `mgd/apps-script/appsscript.json`: scopes/manifiesto; cambios requieren autorización/redeploy manual independiente.
- `mgd/tests/*.test.js`: pruebas Node integradas, en general `node:assert/strict`; aislar cálculos del DOM donde sea posible.
- `mgd/agente/agent.md`: esta guía.
- Root `SPEC-PERFORMANCE.md`, `SETUP.md`, `README.md`: convenciones comunes, instalación y arquitectura multiapp.

Orden de scripts en `index.html`: configuración → `gradebook.js` → módulos puros que dependen de Gradebook (incluido `trajectory.js`) → `summary.js`/context/stage/Excel → `app.js` defer. Mantener dependencia antes del consumidor y actualizar cache/version query si corresponde.

## 4. Contrato de datos vigente

### Tipos legados principales

`school`, `course`, `division`, `subject`, `subgroup`, `student`, `membership`, `cutoff`, `scale`, `assessment`, `schedule`, `attendance`, `grade`, `observation`, `topic`.

Clave del registro: `recordId = type + '::' + id`; payload en `data`. Apps Script almacena filas en `Registros` con versionado optimistic (`expectedVersion`), status y timestamps. Batch limitado por la configuración actual del servidor (hasta 100 registros por lote). IDs no deben contener separadores/caracteres prohibidos.

### Tipos de trayectoria

- `studyPlan`: plan institucional ligado a una escuela (identidad/versionado y estado).
- `planSubject`: asociación plan + escuela + curso + división (curso-div) + materia; `required` especifica si es obligatoria.
- `courseProgression`: correlación configurada de un curso-div origen a uno destino dentro del plan. Si más de una correlación coincide, no adivinar; requerir selección humana.
- `subjectEquivalence`: equivalencia de materia definida explícitamente por la escuela destino entre planes; no inferir por nombres iguales.
- `studentJourney`: un tramo temporal de estudiante en escuela/plan/curso/división con `cohortYear`, `startedAt`, `endedAt`, `status` y motivo. Puede haber muchos tramos históricos pero como máximo uno activo por estudiante globalmente. Cohorte es año en que cursó ese curso-div; no año de ingreso.
- `trajectoryTransfer`: evento/documento de pase e historial; conserva el ID de tramo origen, destino, planes, fecha y snapshot/versionado del informe cuando corresponda. No sustituye ni borra notas.

Cohortes de datos antiguos no deben autoconvertirse a tramos ni inferirse de fecha de inicio, ingreso, notas o etiqueta de curso. Compatibilidad legada puede mostrar “sin cohorte/tramo registrado” hasta corrección administrativa explícita.

## 5. Reglas pedagógicas y de negocio

- Clase efectiva = **escuela + plan + curso/año + división (curso-div)**; materia compone el plan por curso-div. Subgrupo es secundario.
- Trayectoria flexible, no graduada: iniciar, avanzar, permanecer y finalizar son movimientos explícitos con fecha; se puede operar en cualquier momento del año.
- Para cada materia obligatoria, calcular el promedio final ponderado **por materia** a partir de sus instancias configuradas por administración. Una materia aprueba con promedio final >= 7. Si no hay nota final calculable, es pendiente/no evaluada, no aprobada.
- Admin configura instancias del régimen y ponderaciones; el docente registra el tema evaluado y el tipo de evaluación, pero no crea instancias nuevas.
- Promoción individual: admin puede elegir cualquier curso-div de destino y promover aun con pendientes. Primero informar materias y promedios/pendientes; confirmar explícitamente.
- Promoción grupal: acción por lote con previsualización de resultados e individualización/exclusiones/cambios por estudiante. Nunca asumir que un solo destino aplica sin confirmarlo. Default cuando no se promueve es permanecer. Si aprobó todas, sugerir el siguiente curso-div solo si existe exactamente una correlación activa; de otro modo dejar elección manual.
- Cada nuevo tramo exige que el admin indique año-cohorte y fecha efectiva. No copiar automáticamente cohorte previa.
- Al promover, crear un tramo nuevo y mantener registro completo del anterior con fecha/hora de cierre. No sobrescribirlo ni eliminar calificaciones/membresías históricas.
- Estudiante promovido puede tomar materias del curso-div destino y todavía cursar/rendir pendientes de tramos anteriores. Deben poder coexistir inscripciones; las evaluaciones se vinculan a materia/plan y pertenencia adecuadas, no a DNI global sin contexto.
- Finalización académica: solo cuando todos los componentes obligatorios aplicables están aprobados (>=7), incluyendo equivalencias aceptadas por la institución. Cerrar tramo con estado `completed` y fecha efectiva; no confundir con pase/baja.
- Pase de escuela/plan: cerrar pertenencia/tramo de origen, conservar libreta e historial, generar informe descargable/imprimible. La institución de destino determina equivalencias; materias no equivalentes/aprobadas quedan pendientes para rendir según su plan. No marcar equivalencia por heurística ni borrar pendientes.
- “Baja” en sentido administrativo es pase con informe, no destrucción del expediente del estudiante.
- Si el registro de materias/instancias no permite calcular la aprobación final oficial, dejarlo UNKNOWN y no sugerir promoción como aprobó todo.

## 6. Seguridad y autorización

- Solo admin configura planes, jerarquía, correlaciones, equivalencias, tramos, promociones, finalizaciones y pases.
- Roles docentes no pueden leer datos administrativos/privados de planes, decisiones de trayectoria, equivalencias o informes de pase salvo una política futura explícita; no pueden mutar tramos.
- Apps Script valida tipos, IDs, relaciones, campos, tamaños, permisos y unicidad de estudiante. Rechaza más de un tramo activo por persona; cada batch de cierre/apertura debe ser atómico y versionado.
- No confiar en ocultar botones en frontend: probar acceso directo/forjado en Apps Script con pruebas aisladas o mocks adecuados.
- La conexión real puede incluir datos personales. Sanitizar logs/capturas y usar cuentas sintéticas en QA.
- Nunca implementar escritura de producción en pruebas; Sync actual exige selección/confirmación y es un gate externo.

## 7. Flujo reconstruible de desarrollo

1. Leer esta guía, `../README.md`, `../SETUP.md`, `../SPEC-PERFORMANCE.md`, `README.md` de MGD y `apps-script/README.md`.
2. Verificar `git status --short --branch`, `git rev-parse HEAD`, remote/rama, worktree; determinar baseline exacto y preservar cambios preexistentes.
3. Crear/usar branch y worktree aislados. Anotar los requisitos y archivos impactados antes de editar.
4. Buscar contratos análogos y todas las funciones/callers relacionados; no editar con base solo en etiquetas.
5. Escribir tests rojos para reglas puras, validación Apps Script/permisos, registro import/export si aplica y UI.
6. Implementar en módulos puros reutilizables; actualizar el registro de tipos del cliente, export/import, generación de IDs, validadores y backend sin duplicar lógica de promedio.
7. Conectar UI administrativa a `saveRecord/saveRecords` o rutas de staging existentes; el lote debe respetar límite, versionado y rollback local si IndexedDB falla.
8. Añadir resumen de movimientos por persona, cohort/date obligatorio, advertencia de pendientes, correlación sugerida inequívoca, opción manual y confirmación grupal.
9. Probar cierre/apertura del tramo conjuntamente en el mismo batch; tratar conflictos como no completados. Validar exactamente un tramo activo.
10. Añadir informe de pase imprimible con nombre/ID, planes, tramos, materias, promedios, estado aprobación, equivalencias confirmadas y pendientes. Usar `window.print()` y diálogo del navegador Guardar como PDF; evitar incluir datos no autorizados.
11. Ejecutar tests focales, sintaxis, suite íntegra, `git diff --check`; inspeccionar diff y estado. Preservar stdout/logs de fallos.
12. QA visual en Moli con viewport móvil real configurado y escritorio. Para flujos autenticados, solo usar datos/cuenta sintéticos y no declarar autenticado si solo se ve login.
13. Revisar procesos Moli/servidores temporales; no iniciar un server indefinido sin autorización de duración ni PID rastreable.
14. Informar qué está implementado y qué está pendiente por separado; no crear commit/push/merge/deploy sin autorización.

## 8. Pruebas reproducibles

Desde carpeta `mgd/`:

```sh
node --check app.js
node --check gradebook.js
node --check trajectory.js
node tests/trajectory.test.js
node tests/trajectory-integration.test.js
node tests/gradebook.test.js
node tests/cohort-validation.test.js
node tests/summary-dashboard.test.js
```

Suite completa típica:

```sh
find tests -maxdepth 1 -name '*.test.js' -print0 | xargs -0 -n1 node
```

Si hay tests largos o paralelismo, observar procesos tras timeout; no repetir suite a ciegas.

Casos mínimos obligatorios para trayectoria:
- promedios ponderados separados por materia; 6.99 pendiente y 7.00 aprobada; evaluaciones no aplicables/eximidas bajo regla explícita;
- plan vacío o materias obligatorias faltantes no se consideran “aprobó todo”;
- promoción con pendientes permitida solo tras acción admin/confirmación; no auto-promover;
- sugerencia de siguiente solo con una correlación, sin inferencia ante ninguna/múltiples;
- inicio flexible en cualquier fecha válida y cohorte requerida; fecha calendario inválida rechazada;
- permanecer debe cerrar/reabrir el tramo con nuevo año-cohorte, conservar historial;
- grupos de estudiantes con excepción/exclusión individual; atomicidad/batch max/conflictos;
- no más de un tramo activo por estudiante, incluyendo concurrente/conflicto de versión;
- pase de escuela conserva historial, equivalencias solo manuales y destinos diferentes; informe identifica pendientes;
- cierre completado solo con todas materias obligatorias aprobadas;
- docente no lee ni modifica configuración/decisiones privadas; admin sí;
- datos legados sin tramo permanecen legados, no se inventan fechas/cohortes;
- no automatic sync, Sheets prod untouched, no backend deployment.

## 9. Inicialización y operación externa (solo con permiso)

- Revisar `apps-script/README.md`; el frontend Pages y Apps Script son artefactos separados.
- Un nuevo tipo de registro requiere que el `Code.gs` del deployment lo acepte. La modificación en repo NO despliega el backend.
- Apps Script puede requerir scope nuevo, guardado, reautorización y despliegue manual. No ejecutar ni prometer estos pasos sin permiso específico.
- Pages se publica desde `main`; cualquier merge a `main` puede publicar frontend. No hacer sin gate explícito de Claudio.
- Cambios de Apps Script/Sheets no deben probarse en hoja real sin autorización, copia de prueba y rollback.
- Verificar commit SHA y resultado Pages/Apps Script independientemente. HTTP 200 no acredita QA funcional ni autenticada.

## 10. Criterio de aceptación y estado honesto

Una tarea solo se reporta completa en el alcance acordado cuando:
- el modelo y contrato de datos están documentados;
- UI de configuración, movimientos individual/grupal, informe de pase y finalización funciona con datos sintéticos;
- validación backend, límites y permisos están cubiertos por pruebas;
- todas las pruebas pasan; diff y archivos revisados;
- QA visual móvil/escritorio comprobada con evidencia;
- límites de integración/backend no desplegado y datos reales intactos declarados.

Si falta cualquiera, marcar parcial/UNKNOWN, explicar el gate y no integrar/publicar. Un test que lea código mediante regex no sustituye una prueba funcional; una captura emulada no representa un teléfono físico.
