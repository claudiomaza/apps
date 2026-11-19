# Guía maestra del agente: mantener y reconstruir Agenda

## 1. Propósito y autoridad

Esta guía permite continuar Agenda sin depender del historial de chat. No autoriza por sí sola publicar, desplegar Apps Script, cambiar permisos, invitar cuentas, migrar datos ni operar el Sheet real. Prevalecen las decisiones explícitas más recientes de Claudio, luego `../SPEC-PERFORMANCE.md` y el código versionado; si se contradicen, registrar el conflicto y no inferir una acción destructiva.

- Repo fuente: `https://github.com/claudiomaza/apps`; `main` alimenta Pages.
- Frontend Pages: `agenda/`; ruta pública `https://claudiomaza.github.io/apps/agenda/`.
- Base operativa: Google Sheet Calendario existente. No renombrar su ID ni modificarla durante desarrollo/QA sin permiso específico.
- Proyecto Apps Script único vinculado al Sheet: `agenda/apps-script/Code.gs` (backend/API), `agenda/apps-script/Agenda.html` (AIO integrado) y un solo `agenda/apps-script/appsscript.json`. `GET /exec` sirve AIO, `POST /exec` es la API que usa Pages; HtmlService entra al mismo dispatcher mediante `google.script.run`.
- El menú muestra primero «Abrir Agenda» y luego verificar esquema, actualizar vistas y RESET. La UI se abre sin disparar mantenimiento.
- GitHub Pages y Apps Script se publican por separado. Pages usa `agenda/config.js`; Claudio despliega manualmente el proyecto vinculado y ejecuta RESET personalmente tras backup/confirmación.
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

- `agenda/apps-script/Code.gs`: backend/API único vinculado al Sheet. Autenticación, sesiones, roles, API `doPost`, mantenimiento, y `doGet` que sirve el HTML integrado. `runAgendaApi` y `runAgendaMaintenance` son RPC para `google.script.run`; validan la misma sesión/rol y delegan a las funciones existentes.
- `agenda/apps-script/Agenda.html`: AIO HtmlService integrado, servido por menú y por `GET /exec`; todas las operaciones van por `google.script.run`, no llama un renderer externo.
- `agenda/apps-script/appsscript.json`: único manifiesto, con scopes existentes de Sheets/Calendar y `script.container.ui`. No usar el manifiesto runtime mínimo histórico de `aio/appsscript.json.md` ni requerir un deployment/proxy AIO.
- `agenda/`: GitHub Pages mantiene `config.js` apuntando a `POST /exec`; no necesita copiar el backend ni cambiar URL mientras se conserve el deployment Apps Script.
- `agenda/apps-script/aio/`: README, guía y tests de contrato para la arquitectura integrada; los archivos antiguos de renderer son material histórico y no se copian/despliegan.
- `agenda/apps-script/sheet-launcher.test.js`, `unified-appsscript.test.js`, `agenda-database-maintenance.test.js` y `aio/standalone-html.test.js`: cubren menú, routing, `google.script.run`, manifiesto, HTML, RESET y esquema tipado.
- `agenda/agente/agent.md`: guía de reconstrucción/operación. `../SPEC-PERFORMANCE.md` es el spec común.

El menú ofrece primero «Abrir Agenda», luego verificar esquema y actualizar vistas, y al final RESET. Abrir solo muestra la UI; RESET conserva las confirmaciones y nunca borra objetos externos de Calendar. Apps Script se modifica/despliega manualmente; publicar GitHub/Pages no altera el proyecto vinculado ni la planilla.

## 4. Modelo de datos y decisión de transición

La base objetivo tiene tres hojas operativas: `Config`, `Registros`, `Usuarios`; el backend conserva solo una capa de compatibilidad en memoria con el shape de las tablas anteriores, nunca hojas persistentes con esos nombres. El reset lo ejecuta Claudio en la hoja real solo después de desplegar el backend publicado.

Contrato vigente confirmado por Claudio: Agenda opera sobre el esquema normalizado, basado en el patrón de MGD. Núcleo:

- `Config`: `key`, `value`, `description`.
- `Registros`: `recordId`, `type`, `entityId`, `dataJson`, `version`, `status`, `updatedAt`, `createdAt`.
- `Usuarios`: `usuario`, `pass`, `rol`, `alcances`, `mail`, `nombre`, `docenteId`.
- Eventos, calendarios, membresías/colaboradores, grupos y operaciones de sincronización se guardan como tipos de registro en `Registros`; hojas legibles son vistas derivadas, no fuentes.
- RESET crea solo la nueva estructura vacía y la cuenta admin indicada por Claudio (`cmaza`, `cmaza@mendoza.edu.ar`, nombre Claudio Maza, rol `admin`, scopes vacíos); contraseña temporal aleatoria se devuelve/muestra una sola vez y nunca se registra en vista/log.
- La reparación común no migra automáticamente datos antiguos ni debe recrear tabs legacy. Tiene que fallar cerrado y dirigir a RESET.
- No borrar ni modificar objetos externos de Google Calendar durante RESET. Perder referencias Sheet puede dejar objetos huérfanos.
- RESET conserva la palabra exacta `RESET` en un solo campo y segundo consentimiento explícito de backup/pérdida; no ejecutarlo durante QA.
- Rotar `AGENDA_DATABASE_EPOCH` solo tras reset completo e invalidar sesiones antiguas.

**Estado del contrato:** el backend normalizado está implementado en una rama aislada; verificar el SHA publicado antes de desplegar. Los adaptadores preservan shape interno de la API y persisten en `Registros`; no crean pestañas legacy. Reparación verifica esquema y admin y falla cerrado si detecta hojas antiguas. RESET crea Config/Registros/Usuarios vacíos, vistas derivadas y admin; no migra datos ni borra objetos de Google Calendar. Tras publicar y verificar SHA, Claudio despliega Apps Script y ejecuta el RESET por separado. E2E autenticado con el Apps Script desplegado seguirá pendiente hasta entonces.

## 5. Comportamiento y contratos de Agenda

- Agenda soporta varias agendas y roles `owner`, `editor`, `reader`. Mantener enforcement en backend; ocultar botones en frontend no autoriza operaciones.
- Sincronización de eventos es explícita; borradores locales se guardan en IndexedDB y no se publican sin acción del usuario.
- `sessionStorage.calendarSession` y namespace IndexedDB `calendario` son compatibilidad estable. AIO/Page tienen orígenes separados y no comparten automáticamente sesión ni borradores.
- Google Calendar ACL/invitaciones son efectos externos: solo acciones explícitas autorizadas; no enviar notificaciones reales en tests. Mantener compensaciones/estados parciales e idempotencia.
- El wrapper `runAgendaMaintenance` exige token de sesión y allowlist; el backend valida usuario, owner y confirmaciones. `runAgendaApi` pasa requests por el mismo `doPost` que usa Pages. No crear un proxy externo ni otra fuente de permisos.
- RESET: antes backup; segundo aviso; no manipular calendarios de Google; clave temporal solo una exhibición hasta recarga explícita.
- Pages usa `POST /exec` del backend único. El AIO se sirve con `GET /exec` en el mismo deployment y usa `google.script.run`; no hay endpoint renderer separado.

## 6. Pruebas y verificación

Usar Node.js disponible en runner confiable (en caso de no estar disponible en sandbox, usar VM1 por ruta autorizada con transferencia sin secretos); no convertir falta de Node local en éxito ni saltarse test.

Pruebas mínimas relevantes:

- `node agenda/apps-script/unified-appsscript.test.js` y `node agenda/apps-script/aio/standalone-html.test.js`: HTML/script syntax, byte parity de XLSX, RPC integrado, doPost Pages, routing GET, manifiesto único con scopes backend, ausencia de URL/proxy/deployment AIO.
- `node agenda/apps-script/sheet-launcher.test.js`: menú vinculado y URL AIO.
- `node agenda/apps-script/agenda-database-maintenance.test.js`: RESET/reparación y vistas con fixtures; cuando la transición normalizada se implemente, actualizar a contrato nuevo.
- Suites multi-calendar, invitaciones, admin tabs y frontend que alcancen las rutas tocadas.
- Sintaxis Node para JavaScript embebido, `Code.gs` y `git diff --check`.
- Para cambio visual, QA visual en móvil y desktop; para API, QA autenticado solo en entorno sintético/autorizado. Apps Script real no forma parte de test local.

Evidencia parcial se etiqueta como parcial. No publicar hasta pruebas pertinentes PASS; las limitaciones de browser/backend real deben quedar explícitas.

## 7. Deploy y publicación

- Claudio autorizó la conversión completa y que realizará el RESET al recibir backend listo. Zapia puede publicar el repo tras pasar pruebas y revisar el diff; Claudio despliega Apps Script y ejecuta RESET. Eso no autoriza a Zapia a tocar Sheet/deployment.
- GitHub `main` publica Pages; revisar cada diff y el efecto. Publicar el backend y los documentos en `main` solo después de las suites y revisión; Pages, Apps Script y RESET son estados separados.
- Apps Script se copia/reautoriza/despliega manualmente en un único proyecto vinculado: `Code.gs`, `Agenda.html`, un manifiesto. Mantener el mismo `/exec` que consume Pages; no desplegar un renderer AIO separado.
- Nunca decir que AIO o backend está desplegado por solo renombrar/versionar archivos.
- En el reporte final indicar archivos/rutas, pruebas exactas, si hubo commit/push, estado real de Pages/Apps Script y gates restantes.
