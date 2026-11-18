# Guía maestra del agente: mantener y reconstruir Agenda

## 1. Propósito y autoridad

Esta guía permite continuar Agenda sin depender del historial de chat. No autoriza por sí sola publicar, desplegar Apps Script, cambiar permisos, invitar cuentas, migrar datos ni operar el Sheet real. Prevalecen las decisiones explícitas más recientes de Claudio, luego `../SPEC-PERFORMANCE.md` y el código versionado; si se contradicen, registrar el conflicto y no inferir una acción destructiva.

- Repo fuente: `https://github.com/claudiomaza/apps`; `main` alimenta Pages.
- Frontend Pages: `agenda/`; ruta pública `https://claudiomaza.github.io/apps/agenda/`.
- Base operativa: Google Sheet Calendario existente. No renombrar su ID ni modificarla durante desarrollo/QA sin permiso específico.
- Backend canónico: `agenda/apps-script/Code.gs`, script vinculado al Sheet, API común para Pages y el frontend AIO. Conserva `doGet()` de estado y `doPost(e)` de API.
- Interfaz AIO: proyecto Apps Script independiente descrito por `agenda/apps-script/aio/`; su archivo de entrada servidor es `Render.gs`, renderer solamente, no backend ni fuente de permisos.
- Apps Script y Pages se publican por separado. Claudio despliega Apps Script manualmente; Zapia puede preparar y publicar solo el repo cuando el usuario lo pide y los gates pasan.
- `mgd/agente/agent.md` es referencia de forma y profundidad, no de modelo de datos ni reglas de Agenda.

## 2. Reglas de trabajo

1. Antes de editar: verificar SHA/branch/estado de `main`, contenido, tests y decisiones recientes. Mantener cambios aislados; preservar trabajo ajeno y no asumir un checkout local como fuente si no se verifica.
2. Para cambios de comportamiento usar TDD (prueba roja → implementación → verde), además de regresión. Para cambios de estructura/docs, crear o actualizar un test que fije los nombres/rutas y la separación de responsabilidades.
3. Revisar diff completo, búsquedas de referencias a nombres movidos y pruebas específicas antes de reportar.
4. Distinguir implementación local, tests, QA UI, QA autenticado, backend/Apps Script, commit, push/merge, Pages y deploy de Apps Script. No llamar E2E a checks estáticos.
5. No tocar Sheet operativo, datos reales, permisos, Calendar, usuarios ni invitaciones durante pruebas estructurales. Usar fixtures sintéticos y mocks aislados.
6. No desplegar Apps Script ni modificar el deployment activo. Al usuario le corresponde ese paso.
7. No incluir contraseñas, tokens, IDs secretos ni credenciales en repo/documentación. El ID de backend que ya esté versionado se trata con la política existente; no copiar secretos de runtime.
8. No hacer RESET, reparación ni migración real como parte de cambios de código.
9. No eliminar, fusionar o reemplazar código fuera del alcance. Mantener compatibilidad de Pages/AIO y estado local salvo decisión explícita.
10. Registrar decisiones duraderas en `../SPEC-PERFORMANCE.md`; registrar detalle de reconstrucción/operación aquí.

## 3. Estructura y límites entre artefactos

- `agenda/apps-script/Code.gs`: único backend canónico en repo. Autenticación, sesiones, roles, validación, API, acceso a Sheets/Calendar, mantenimiento del Sheet y menú/launcher del Sheet.
- `agenda/apps-script/appsscript.json`: manifiesto del backend vinculado; puede incluir scopes Calendar/Sheets y `script.container.ui` según el backend. No copiar al proyecto renderer.
- `agenda/apps-script/aio/Render.gs`: pequeño archivo servidor del proyecto UI aislado. `doGet()` sirve `Agenda` y el proxy estrecho de mantenimiento reenvía al backend; no define `doPost`, no accede directamente a Sheet/Calendar y no decide permisos.
- `aio/Agenda.html.md`: fuente copiabile del HTML autónomo (UI, CSS, JS, IndexedDB y bundle Excel). No es `Code.gs` backend. No duplicar su contenido en Pages ni mantener una segunda copia del backend.
- `aio/appsscript.json.md`: manifiesto mínimo del proyecto AIO, solo `script.external_request` para su proxy. No sumar scopes del backend.
- `aio/PUBLICAR-SOLO-APPS-SCRIPT.md`: guía de creación/publicación del proyecto AIO y límites de despliegue.
- `aio/README.md`: índice breve de los artefactos.
- `aio/standalone-html.test.js`: contrato del bundle autónomo, sincronía de assets/sources, ausencia del backend en AIO y sintaxis.
- `agenda/apps-script/*test.js`: tests de contrato/backend con doubles Node; `agenda/*test.js`: UI/frontend.
- `agenda/agente/agent.md`: esta guía.
- `../SPEC-PERFORMANCE.md`, `../SETUP.md`, `../README.md`: arquitectura/decisiones compartidas.

El nombre `Render.gs` distingue explícitamente el renderer AIO del backend canónico. En el proyecto Apps Script AIO se copia ese archivo como `Render.gs` y el HTML markdown como archivo HTML `Agenda`. El archivo servidor AIO no sustituye ni se copia encima de `agenda/apps-script/Code.gs`.

## 4. Modelo de datos y decisión de transición

La revisión de GitHub `main` de 2026-11-18 todavía contiene la base legacy separada: `Eventos`, `Config`, `Usuarios`, `Agendas`, `CalendarMembers`, `Grupos`, `SyncOperations`; RESET y docs publicados reflejan esa versión previa. No afirmar que el backend ya está normalizado.

Decisión futura confirmada por Claudio: cambiar Agenda a un esquema nuevo real basado en el patrón normalizado de MGD. Núcleo previsto:

- `Config`: `key`, `value`, `description`.
- `Registros`: `recordId`, `type`, `entityId`, `dataJson`, `version`, `status`, `updatedAt`, `createdAt`.
- `Usuarios`: `usuario`, `pass`, `rol`, `alcances`, `mail`, `nombre`, `docenteId`.
- Eventos, calendarios, membresías/colaboradores, grupos y operaciones de sincronización se guardan como tipos de registro en `Registros`; hojas legibles son vistas derivadas, no fuentes.
- RESET crea solo la nueva estructura vacía y la cuenta admin indicada por Claudio (`cmaza`, `cmaza@mendoza.edu.ar`, nombre Claudio Maza, rol `admin`, scopes vacíos); contraseña temporal aleatoria se devuelve/muestra una sola vez y nunca se registra en vista/log.
- La reparación común no migra automáticamente datos antiguos ni debe recrear tabs legacy. Tiene que fallar cerrado y dirigir a RESET.
- No borrar ni modificar objetos externos de Google Calendar durante RESET. Perder referencias Sheet puede dejar objetos huérfanos.
- RESET conserva la palabra exacta `RESET` en un solo campo y segundo consentimiento explícito de backup/pérdida; no ejecutarlo durante QA.
- Rotar `AGENDA_DATABASE_EPOCH` solo tras reset completo e invalidar sesiones antiguas.

**Estado:** esta decisión aún no está implementada ni verificada en el backend de `main`. Antes de llamar completa la migración, adaptar todos los callers/lectores/escritores/operaciones de idempotencia y Calendar al almacenamiento tipado, conservar autorización y contrato para Pages/AIO, actualizar pruebas/documents, ejecutar suites. No alcanza con cambiar lista de tabs del RESET. El destino de filas legacy durante un rollout sin RESET (migrar/archivar/descartar) no quedó autorizado ni especificado: no inferir ni borrar por otro camino.

## 5. Comportamiento y contratos de Agenda

- Agenda soporta varias agendas y roles `owner`, `editor`, `reader`. Mantener enforcement en backend; ocultar botones en frontend no autoriza operaciones.
- Sincronización de eventos es explícita; borradores locales se guardan en IndexedDB y no se publican sin acción del usuario.
- `sessionStorage.calendarSession` y namespace IndexedDB `calendario` son compatibilidad estable. AIO/Page tienen orígenes separados y no comparten automáticamente sesión ni borradores.
- Google Calendar ACL/invitaciones son efectos externos: solo acciones explícitas autorizadas; no enviar notificaciones reales en tests. Mantener compensaciones/estados parciales e idempotencia.
- El proxy `runAgendaMaintenance` del `Render.gs` debe mantener allowlist cerrada, exigir token de sesión y reenviar al backend; el backend valida usuario, owner, confirmaciones y realiza operaciones. No confiar el permiso al proxy AIO.
- RESET: antes backup; segundo aviso; no manipular calendarios de Google; clave temporal solo una exhibición hasta recarga explícita.
- Pages usa API del backend canónico. No apuntar fetch normal a la URL del AIO ni duplicar el API dentro de AIO.

## 6. Pruebas y verificación

Usar Node.js disponible en runner confiable (en caso de no estar disponible en sandbox, usar VM1 por ruta autorizada con transferencia sin secretos); no convertir falta de Node local en éxito ni saltarse test.

Pruebas mínimas relevantes:

- `node agenda/apps-script/aio/standalone-html.test.js`: extracción/sintaxis del HTML y `Render.gs`, bytes Excel embebidos coinciden con `agenda/vendor/xlsx.full.min.js`, no hay referencias a `Code.gs.md`, no aparece backend duplicado/`doPost`/acceso directo Sheets/Calendar, y el manifiesto sigue mínimo.
- `node agenda/apps-script/sheet-launcher.test.js`: menú vinculado y URL AIO.
- `node agenda/apps-script/agenda-database-maintenance.test.js`: RESET/reparación y vistas con fixtures; cuando la transición normalizada se implemente, actualizar a contrato nuevo.
- Suites multi-calendar, invitaciones, admin tabs y frontend que alcancen las rutas tocadas.
- Sintaxis Node para JavaScript embebido y `Render.gs`; `git diff --check`.
- Para cambio visual, QA visual en móvil y desktop; para API, QA autenticado solo en entorno sintético/autorizado. Apps Script real no forma parte de test local.

Evidencia parcial se etiqueta como parcial. No publicar hasta pruebas pertinentes PASS; las limitaciones de browser/backend real deben quedar explícitas.

## 7. Deploy y publicación

- La autorización para publicar se interpreta según el pedido explícito del turno. Esta solicitud de estructura de repo no autoriza Apps Script, Sheet, reset o invitaciones.
- GitHub `main` publica Pages; revisar cada diff y el efecto. No hacer push en esta tarea si no se pidió publicar explícitamente.
- Apps Script se copia/reautoriza/despliega manualmente en el proyecto correcto: backend vinculado y proyecto renderer AIO son dos proyectos separados. Dejar claro qué archivos corresponden a cada uno.
- Nunca decir que AIO o backend está desplegado por solo renombrar/versionar archivos.
- En el reporte final indicar archivos/rutas, pruebas exactas, si hubo commit/push, estado real de Pages/Apps Script y gates restantes.
