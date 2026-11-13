
## Notas — matriz de QA por frontend, ejecución parcial (2026-11-09)

- Se inspeccionó con Moli el frontend publicado de Notas (`/apps/notas/`), sesión limpia, sin credenciales y sin datos en `localStorage`/`sessionStorage`. El árbol accesible lista áreas de Panorama (Libro de tema, Estadística, Estudiantes, Materias, Asistencia, Calificaciones y Observaciones), Registrar (Libro de tema, Libreta, Asistencia, Notas, Observaciones) y Configuración (Registros, Papelera, Estudiantes, Docentes y permisos, Instancias y pesos). La presencia de formularios/botones no acredita que sus funciones operen.
- Interacción de solo UI mediante Moli: click del toggle `Registrar` cambió `aria-expanded=false → true → false`. Formulario de login: submit con ambos campos vacíos, solo usuario y solo contraseña resultó inválido en los tres casos; cero solicitudes de red a Apps Script en esos intentos. Sin credenciales ni sesión se preservó el formulario; no se intentó contraseña inválida ni sesión válida para evitar intentos de autenticación no controlados.
- Bloqueado por requerir sesión autenticada de frontend: carga de registros reales, filtros dependientes, vistas con datos, tablas/paginación, CRUD, estados en borradores, recuperación y conflictos, carga/exportación Excel desde UI, asistencia/notas/libro de tema, disponibilidad/asignaciones, papelera/restauración, sincronización y permisos por rol. No se activó ninguna operación que escriba o muta Sheets.
- Bloqueado por backend visual del navegador: la herramienta browser integrada está en cuota agotada. Moli CLI puede inspeccionar/capturar HTML/DOM y desktop, pero no proporciona escritura segura de las credenciales en su formulario; no pegar secretos en eval/script/cookie/CLI. QA móvil sigue BLOCKED: CDP no aplicó emulación 390×844 y quedó en 1920×1080. Desktop sin autenticar quedó probado por screenshot anterior; no extrapolarlo a pantallas internas.
- Próximo gate para completar la matriz solicitado el 2026-11-09 00:11 -03: restaurar browser interactivo autorizado y escribir en su formulario la credencial `notas-admin` mediante la referencia segura; comprobar que es el usuario admin esperado. Después recorrer lectura y navegación primero, usar solo fixtures ya existentes dentro de `ZAPIA QA`, y abstenerse de guardar, sincronizar, borrar o restaurar si no hay previsualización/consentimiento del usuario. Probar los roles docent/admin únicamente con identidades permitidas. Registrar cada caso por separado como UI, E2E autenticado o BLOCKED.

## Calendario — menú Acciones móvil y prueba visual (2026-11-09)

- Hallazgo reproducido con Moli en el frontend publicado autenticado: en viewport estrecho, el menú «Acciones» quedaba dentro de una columna de la barra y su panel desplegable abría fuera del borde izquierdo.
- Corrección en `calendario/styles.css`: el menú pasa a una fila propia; el panel se ancla a la izquierda y se limita a `min(260px, 100vw - 28px)`. `calendario/index.html` versiona la URL del CSS para invalidar caché. Regresión en `calendario/mobile-actions-layout.test.js`.
- Suite frontend local: 10/10 scripts `calendario/*.test.js` PASS, con el `Code.gs` rastreado resuelto temporalmente mediante la ruta versionada `calendario/apps-script/Code.gs`; no se modificó ese backend. `git diff --check` PASS.
- La sesión Moli/CDP de VM1 no logró conservar conexión autenticada al alternar viewports, así que no afirmar validación Moli móvil estable. Una medición aislada de layout mostró panel dentro de 320 px (left 14, right 274, ancho 260); sin estado conectado no cuenta como E2E visual aceptado. Repetir captura con Moli después de restablecer la conexión/viewport.
- Cambio en rama aislada `fix/calendario-mobile-actions`; no integrado en `main` ni publicado en Pages. Sin escrituras en eventos, agendas o colaboradores.

## Calendario — onboarding, menú de acciones y resumen (2026-11-10)

- «Nuevo evento» está dentro del menú «Acciones», sin duplicar el control. En pantallas estrechas el propio menú ocupa una fila completa y el panel mantiene el límite de ancho del viewport (regresión móvil previa).
- El primer fetch autenticado usa `bootstrap` para cargar en un roundtrip agenda, eventos del mes y grupos. Durante la transición de Apps Script, si el backend devuelve `INVALID_ACTION`, el frontend usa el flujo previo de listas en paralelo; esto no activa `createAppUser` ni oculta errores distintos. La latencia real depende de Apps Script/Sheets/Calendar y debe medirse en E2E autenticado, no inferirse de tests estáticos.
- «Grupos de eventos» muestra inmediatamente el estado en caché y abre el diálogo antes de refrescar la lista; el backend sigue siendo la fuente final. E2E de tiempo de respuesta de grupo queda pendiente.
- Resumen muestra cantidad de eventos activos del mes visible, cuántos tienen/sin grupo y conteo por grupo; distingue mes vacío de falta de datos y no duplica las tarjetas de Estadísticas.
- Colaboradores: explicar que la selección corresponde a cuentas registradas. `createAppUser` se autoriza en Apps Script solo para rol owner, valida username/password y duplicados bajo lock, invalida cache de usuarios y no devuelve la contraseña. El cliente oculta la acción en roles no owner. La hoja `Usuarios` sigue almacenando contraseñas conforme al backend existente; nunca registrar ni mostrar la contraseña en logs/mensajes. El usuario despliega manualmente `calendario/apps-script/Code.gs`; Pages por sí solo no habilita el endpoint nuevo.
- Verificación local: pruebas de Calendario y contrato de usuario pasan antes de integrar; no se crearon cuentas ni se mutaron eventos, grupos, agendas o permisos durante QA. Clasificar revisión visual/autenticada de Pages como pendiente si no se obtiene sesión Moli estable.

## Calendario — onboarding, menú de acciones y resumen (2026-11-10)

- «Nuevo evento» está dentro del menú «Acciones», sin duplicar el control. En pantallas estrechas el propio menú ocupa una fila completa y el panel mantiene el límite de ancho del viewport (regresión móvil previa).
- El primer fetch autenticado usa `bootstrap` para cargar en un roundtrip agenda, eventos del mes y grupos. Durante la transición de Apps Script, si el backend devuelve `INVALID_ACTION`, el frontend usa el flujo previo de listas en paralelo; esto no activa `createAppUser` ni oculta errores distintos. La latencia real depende de Apps Script/Sheets/Calendar y debe medirse en E2E autenticado, no inferirse de tests estáticos.
- «Grupos de eventos» muestra inmediatamente el estado en caché y abre el diálogo antes de refrescar la lista; el backend sigue siendo la fuente final. E2E de tiempo de respuesta de grupo queda pendiente.
- Resumen muestra cantidad de eventos activos del mes visible, cuántos tienen/sin grupo y conteo por grupo; distingue mes vacío de falta de datos y no duplica las tarjetas de Estadísticas.
- Colaboradores: explicar que la selección corresponde a cuentas registradas. `createAppUser` se autoriza en Apps Script solo para rol owner, valida username/password y duplicados bajo lock, invalida cache de usuarios y no devuelve la contraseña. El cliente oculta la acción en roles no owner. La hoja `Usuarios` sigue almacenando contraseñas conforme al backend existente; nunca registrar ni mostrar la contraseña en logs/mensajes. El usuario despliega manualmente `calendario/apps-script/Code.gs`; Pages por sí solo no habilita el endpoint nuevo.
- Verificación local: pruebas de Calendario y contrato de usuario pasan antes de integrar; no se crearon cuentas ni se mutaron eventos, grupos, agendas o permisos durante QA. Clasificar revisión visual/autenticada de Pages como pendiente si no se obtiene sesión Moli estable.

## Calendario — invitaciones por correo a Google Calendar (2026-11-10)

- En Administración → Colaboradores, separar cuentas internas de invitaciones a una dirección de correo. Una invitación no crea ni exige usuario en `Usuarios`.
- Compartir como lector mediante Calendar API ACL `role=reader`, `scope.type=user`, `scope.value=email`, con `sendNotifications=true`; el servicio avanzado Calendar debe estar habilitado en `appsscript.json`. En el registro `CalendarMembers`, marcar el correo como activo para poder enumerar/revocar.
- Rechazar correos que ya sean cuentas registradas para evitar dos flujos de acceso para una identidad. El lock serializa el chequeo contra usuarios y otros cambios de ACL; duplicados activos son idempotentes, no vuelven a enviar el correo. Solo owner invita/revoca; revocar quita ACL y marca el registro como REMOVED. Si falla el guardado del registro, se intenta compensar la ACL; si falla también el rollback se expone `INVITATION_STATE_PARTIAL` para reconciliación manual.
- Google envía la invitación para abrir/agregar la agenda; avisos posteriores de eventos siguen las preferencias de Google Calendar de cada invitado, no son una garantía de notificación por correo. Debe comprobarse con una invitación de prueba autorizada tras el despliegue manual de Apps Script; no invitar contactos reales durante QA.


## Calendario — cola de invitaciones y tablas adaptativas (2026-11-10)

- En Colaboradores se preparan invitaciones en una cola local por agenda. Agregar un correo no produce efectos externos; cada fila empieza desmarcada. La selección es explícita, se puede filtrar por correo y confirmación y ordenar A–Z/Z–A. El botón envía en serie solo las filas marcadas.
- Cada fila distingue Pendiente, Enviando, Google confirmó el envío, ya tenía acceso y resultado no confirmado. Un timeout o rollback/estado parcial no puede reenviarse automáticamente: requiere comprobar el acceso antes de un intento manual. El resultado positivo de ACL indica que Google aceptó la operación, no garantiza entrega o aceptación humana del email.
- Las invitaciones activas son ACL reader; se separan de la cola y se siguen revocando desde accesos compartidos. La cola desaparece si cambia de agenda; los borradores pertenecen a su calendarId y no persisten tras recargar/cerrar la sesión.
- Las tablas de eventos, invitados y previsualización de importación ofrecen búsqueda por columna y orden A–Z/Z–A. En móvil conservan estructura tabular con scroll horizontal contenido, cabeceras visibles y objetivos táctiles amplios; probar 390×844 y escritorio con fixtures sintéticos, sin enviar invitaciones ni mutar datos reales.


### Diagnóstico de invitaciones y selección masiva (2026-11-11)
- La API `inviteCalendarEmail` debe inspeccionar las ACL existentes antes de insertar. Si la dirección ya tiene acceso a la agenda en Google (aunque no figure en CalendarMembers), devolver estado `alreadyInvited` sin mandar un segundo correo y reconciliar visualmente como acceso existente. Si una ACL `none` existe, elevarla a `reader` con notificación y rollback a su estado anterior ante fallo de Sheet.
- Errores del servicio avanzado se convierten en códigos públicos sanitizados: API deshabilitada, permisos insuficientes, fallo al consultar ACL, acceso preexistente concurrente e invitación fallida. No exponer mensajes internos de Google; mantener el texto útil y pedir revisión de Apps Script Executions cuando corresponda.
- La cola ofrece “Seleccionar todos” para invitaciones elegibles que están visibles bajo los filtros actuales (pending/error). Es un toggle local; no marca sent/existing/unknown/sending ni produce envío.


## Notas — panel inicial, pertenencia y libreta grupal (2026-11-11)

- El panel inicial abre directamente en indicadores de asistencia y calificaciones, sin exigir otra pestaña «Estadística». Los KPIs se limitan a la solicitud (asistencia %, sesiones, calificaciones por estado y promedio); los gráficos muestran asistencia agregada por día y resumen separado por cada instancia (fecha, promedio, calificada, pendiente, no entregada, ausente, eximido). Se conservan los filtros globales y el panel de actividad reciente/otros datos separado. Ningún total/fecha/nota de fixtures se codifica en el producto.
- QA del cálculo del resumen: fixture sintético produjo 12 sesiones, 312 marcas, 284 presentes, 28 ausentes, 91%, lunes 94/10, martes 95/9, miércoles 95/9; nueve instancias y conteos/medias que coinciden con los valores del pedido, promedio global 7.26.
- Asignar estudiante conserva el esquema de pertenencia existente pero pone escuela, año/curso y división antes de materia/subgrupo, con explicación explícita del contexto. En roster se ven año escolar y división de cada pertenencia, deduplicados por escuela/año/división.
- Libreta grupal: filtra por escuela/materia/año/división y subgrupo, no mezcla otras divisiones, y muestra las instancias de todos los cortes del grupo aunque el selector global de corte apunte a uno. Estudiante e ID son filas identificatorias; cada instancia tiene su propia columna con nombre y fecha (y peso), y cada celda separa fecha de calificación y valor/estado. Búsqueda incluye nombre e ID con lowercase español. Exportación ancha usa la misma lista de instancias y conserva las columnas de identificadores; el Excel presenta una fila de cabecera con nombres de instancia y otra con fechas, dejando las calificaciones/estados en las filas de estudiantes.
- Al abrir la libreta no se inicia carga de docentes ni se consulta Apps Script; el detalle de docentes/horarios toma los datos disponibles. La carga remota de docentes permanece en sus acciones/exportaciones que la requieren.
- Verificación en worktree aislado `/home/ubuntu/worktrees/notas-dashboard-matricula-libreta-20261111`, base canónica `origin/main` SHA `0489ca8568301c9dfe7c559732164c61ffa5d7a1`. Los 27 scripts `notas/tests/*.test.js` pasan; `git diff --check` pasa. Moli local con solo fixtures sintéticos verificó `innerWidth/innerHeight` 390×844, 320×740 y 1440×1000, ancho documento ≤ viewport, dashboard y libreta con 104 filas y 9 instancias; no hubo errores runtime. En viewport estrecho la libreta mantiene scroll horizontal de tabla contenido, no de la página.
- No se autentificó ni usó Apps Script/Sheets. El fixture existió solo en memoria del navegador de QA; no se escribió a localStorage, IndexedDB o backend. Sin sincronizaciones ni mutaciones reales. Capturas conservadas en el workspace local `scratch/notas-feature/{dashboard,gradebook}-{390x844,320x740,1440x1000}.png`.
- Implementación aún no integrada/publicada: falta revisión independiente en un worktree diferente; no se ejecutó un build de Pages ni QA autenticado.


## Notas — asistencia por evaluación en el panel inicial (2026-11-11)

- Debajo del gráfico de asistencia por día se agrega el apartado «Promedio por evaluación», en paralelo semántico a «Promedio por evaluación». Cada instancia muestra fecha, porcentaje presente, presentes, ausentes y total marcado. Solo cuenta marcas Presente/Ausente de la fecha exacta y del mismo contexto (escuela, materia, año/curso, división) que la instancia; no mezcla otras divisiones/materias ni sesiones sin marcas. Las evaluaciones sin marcas no se muestran.
- La tasa es presentes / (presentes + ausentes), redondeada al entero. Continúa respetando el conjunto de asistencia y evaluaciones ya filtrado por ciclo/fechas y filtros globales del resumen.


## Notas — navegación lateral móvil y panel de administración (2026-11-13)

- Tras iniciar sesión, usar una navegación lateral permanente en escritorio, plegable con acceso de reapertura como popup; en celular abrirla como panel modal con fondo, cierre explícito y Escape. No duplicar los selectores existentes: reubicar Escuela, Materia, Año/curso, División, Corte y Subgrupo en el perfil inferior del lateral para conservar el contexto filtrado por permisos.
- Separar accesos «Trabajo docente» y «Administración». Libro de tema, Libreta, Asistencia, Notas, Observaciones y Estudiantes siguen accesibles para el rol docente; Registros, Papelera, Docentes y permisos, e Instancias y pesos se muestran solo al admin conforme al rol existente. No reemplazar ni debilitar la autorización del backend.
- Ubicar en el extremo inferior del lateral el perfil autenticado, detalles de alcance, Cerrar sesión, selector de tema claro/oscuro y contexto de curso. El tema se conserva localmente; no afecta sesión ni borradores. Ocultar el resumen duplicado del topbar luego de autenticar; mantenerlo para la pantalla de login.
- En el panel inicial, indicadores de resumen se muestran en cajas apiladas verticalmente. Conservar filtros globales, operaciones explícitas y borradores IndexedDB. Los filtros por tabla ya existentes (búsqueda por tabla/columna y orden) deben seguir disponibles.
- Verificación frontend: suite completa `notas/tests/*.test.js` 28/28 PASS con fixtures; el nuevo test de contrato comprueba IDs reutilizados, navegación/roles, drawer/popup, tema persistido, cajas verticales y mantenimiento de filtros. No autenticó a Sheets ni escribió/sincronizó datos. No afirmar QA visual o autenticado sin ejecutarlo.

## Notas — clase combinada y portada simplificada (2026-11-13)

- La clase elegida se representa como una asignación de escuela + espacio curricular + curso/año + división. En la UI se elige con un selector combinado, no con cuatro desplegables competidores. El subgrupo queda como filtro secundario y opcional, dependiente de división.
- Cohorte no es una propiedad de la asignación: deriva de estudiantes matriculados en esa combinación exacta, mediante `cohortYear` y `cohortStartDate` de sus fichas. Mostrar la lista de cohortes reales de los estudiantes de esa clase (puede haber más de una o estar pendiente); no escribir ni inferir cohorte en otros registros.
- Los IDs/controles existentes de escuela, materia, curso y división siguen siendo la fuente de verdad de los flujos docentes; el selector combinado actualiza esos controles existentes y re-renderiza. No cambia payload, esquema, permisos backend, borradores, ni sincronización.
- En Inicio, priorizar tres accesos: asistencia, carga de notas y libro de tema. Mostrar clase actual y su contexto; los reportes y filtros globales quedan dentro de un `details` cerrado inicialmente. En el menú lateral cerrar inicialmente los grupos secundarios; mantener funciones existentes accesibles.
- El botón de cambiar clase debe abrir el drawer en móvil o enfocar/abrir el selector en escritorio incluso con el lateral plegado. Una cuenta sin contexto asignado obtiene el estado vacío, no una combinación inventada.
- Tests: prueba de unidad del helper asegura identidad de contexto y cohortes múltiples exactas; suite frontend completa y pruebas de selección contextual y cache versionado. QA visual/autenticado requiere navegador disponible y datos sintéticos; nunca Sheets real.

## Notas — legibilidad de toast y accesos de Inicio (2026-11-13)

- El toast debe ocupar un ancho legible responsivo en lugar de ajustarse solo al texto; permitir ajuste de palabras largas, límite de altura con scroll y safe area en móvil. Mensajes multilinea conservan separación y alineación izquierda.
- En las tarjetas de acceso de Inicio, la columna de texto debe poder encogerse sin empujar icono ni flecha; aplicar `min-width:0`, `minmax(0,1fr)`, `overflow-wrap:anywhere` y line-height cómodo. No ocultar mensajes ni truncar acciones.
- Validar la política con `notas/tests/toast-layout.test.js`, `notas/tests/toast-loading.test.js` y suite completa. Prueba visual responsive sigue requerida cuando el browser esté disponible.

## Toast de carga y bloque de texto (2026-11-13)

- «Verificando» usa un spinner circular como elemento DOM separado; el texto vive en un span flexible que envuelve frases y errores extensos. No reconstruir el spinner con pseudo-elementos de texto.
- Cache key de `index.html` y tests alineados a `20261113-toastlayout3`.
