
## Notas — matriz de QA por frontend, ejecución parcial (2026-11-09)

- Se inspeccionó con Moli el frontend publicado de Notas (`/apps/notas/`), sesión limpia, sin credenciales y sin datos en `localStorage`/`sessionStorage`. El árbol accesible lista áreas de Panorama (Libro de tema, Estadística, Estudiantes, Materias, Asistencia, Calificaciones y Observaciones), Registrar (Libro de tema, Libreta, Asistencia, Notas, Observaciones) y Configuración (Registros, Papelera, Estudiantes, Docentes y permisos, Instancias y pesos). La presencia de formularios/botones no acredita que sus funciones operen.
- Interacción de solo UI mediante Moli: click del toggle `Registrar` cambió `aria-expanded=false → true → false`. Formulario de login: submit con ambos campos vacíos, solo usuario y solo contraseña resultó inválido en los tres casos; cero solicitudes de red a Apps Script en esos intentos. Sin credenciales ni sesión se preservó el formulario; no se intentó contraseña inválida ni sesión válida para evitar intentos de autenticación no controlados.
- Bloqueado por requerir sesión autenticada de frontend: carga de registros reales, filtros dependientes, vistas con datos, tablas/paginación, CRUD, estados en borradores, recuperación y conflictos, carga/exportación Excel desde UI, asistencia/notas/libro de tema, disponibilidad/asignaciones, papelera/restauración, sincronización y permisos por rol. No se activó ninguna operación que escriba o muta Sheets.
- Bloqueado por backend visual del navegador: la herramienta browser integrada está en cuota agotada. Moli CLI puede inspeccionar/capturar HTML/DOM y desktop, pero no proporciona escritura segura de las credenciales en su formulario; no pegar secretos en eval/script/cookie/CLI. QA móvil sigue BLOCKED: CDP no aplicó emulación 390×844 y quedó en 1920×1080. Desktop sin autenticar quedó probado por screenshot anterior; no extrapolarlo a pantallas internas.
- Próximo gate para completar la matriz solicitado el 2026-11-09 00:11 -03: restaurar browser interactivo autorizado y escribir en su formulario la credencial `notas-admin` mediante la referencia segura; comprobar que es el usuario admin esperado. Después recorrer lectura y navegación primero, usar solo fixtures ya existentes dentro de `ZAPIA QA`, y abstenerse de guardar, sincronizar, borrar o restaurar si no hay previsualización/consentimiento del usuario. Probar los roles docent/admin únicamente con identidades permitidas. Registrar cada caso por separado como UI, E2E autenticado o BLOCKED.

## Agenda — menú Acciones móvil y prueba visual (2026-11-09)

- Hallazgo reproducido con Moli en el frontend publicado autenticado: en viewport estrecho, el menú «Acciones» quedaba dentro de una columna de la barra y su panel desplegable abría fuera del borde izquierdo.
- Corrección en `agenda/styles.css`: el menú pasa a una fila propia; el panel se ancla a la izquierda y se limita a `min(260px, 100vw - 28px)`. `agenda/index.html` versiona la URL del CSS para invalidar caché. Regresión en `agenda/mobile-actions-layout.test.js`.
- Suite frontend local: 10/10 scripts `agenda/*.test.js` PASS, con el `Code.gs` rastreado resuelto temporalmente mediante la ruta versionada `agenda/apps-script/Code.gs`; no se modificó ese backend. `git diff --check` PASS.
- La sesión Moli/CDP de VM1 no logró conservar conexión autenticada al alternar viewports, así que no afirmar validación Moli móvil estable. Una medición aislada de layout mostró panel dentro de 320 px (left 14, right 274, ancho 260); sin estado conectado no cuenta como E2E visual aceptado. Repetir captura con Moli después de restablecer la conexión/viewport.
- Cambio en rama aislada `fix/calendario-mobile-actions`; no integrado en `main` ni publicado en Pages. Sin escrituras en eventos, agendas o colaboradores.

## Agenda — onboarding, menú de acciones y resumen (2026-11-10)

- «Nuevo evento» está dentro del menú «Acciones», sin duplicar el control. En pantallas estrechas el propio menú ocupa una fila completa y el panel mantiene el límite de ancho del viewport (regresión móvil previa).
- El primer fetch autenticado usa `bootstrap` para cargar en un roundtrip agenda, eventos del mes y grupos. Durante la transición de Apps Script, si el backend devuelve `INVALID_ACTION`, el frontend usa el flujo previo de listas en paralelo; esto no activa `createAppUser` ni oculta errores distintos. La latencia real depende de Apps Script/Sheets/Calendar y debe medirse en E2E autenticado, no inferirse de tests estáticos.
- «Grupos de eventos» muestra inmediatamente el estado en caché y abre el diálogo antes de refrescar la lista; el backend sigue siendo la fuente final. E2E de tiempo de respuesta de grupo queda pendiente.
- Resumen muestra cantidad de eventos activos del mes visible, cuántos tienen/sin grupo y conteo por grupo; distingue mes vacío de falta de datos y no duplica las tarjetas de Estadísticas.
- Colaboradores: explicar que la selección corresponde a cuentas registradas. `createAppUser` se autoriza en Apps Script solo para rol owner, valida username/password y duplicados bajo lock, invalida cache de usuarios y no devuelve la contraseña. El cliente oculta la acción en roles no owner. La hoja `Usuarios` sigue almacenando contraseñas conforme al backend existente; nunca registrar ni mostrar la contraseña en logs/mensajes. El usuario despliega manualmente `agenda/apps-script/Code.gs`; Pages por sí solo no habilita el endpoint nuevo.
- Verificación local: pruebas de Calendario y contrato de usuario pasan antes de integrar; no se crearon cuentas ni se mutaron eventos, grupos, agendas o permisos durante QA. Clasificar revisión visual/autenticada de Pages como pendiente si no se obtiene sesión Moli estable.

## Agenda — onboarding, menú de acciones y resumen (2026-11-10)

- «Nuevo evento» está dentro del menú «Acciones», sin duplicar el control. En pantallas estrechas el propio menú ocupa una fila completa y el panel mantiene el límite de ancho del viewport (regresión móvil previa).
- El primer fetch autenticado usa `bootstrap` para cargar en un roundtrip agenda, eventos del mes y grupos. Durante la transición de Apps Script, si el backend devuelve `INVALID_ACTION`, el frontend usa el flujo previo de listas en paralelo; esto no activa `createAppUser` ni oculta errores distintos. La latencia real depende de Apps Script/Sheets/Calendar y debe medirse en E2E autenticado, no inferirse de tests estáticos.
- «Grupos de eventos» muestra inmediatamente el estado en caché y abre el diálogo antes de refrescar la lista; el backend sigue siendo la fuente final. E2E de tiempo de respuesta de grupo queda pendiente.
- Resumen muestra cantidad de eventos activos del mes visible, cuántos tienen/sin grupo y conteo por grupo; distingue mes vacío de falta de datos y no duplica las tarjetas de Estadísticas.
- Colaboradores: explicar que la selección corresponde a cuentas registradas. `createAppUser` se autoriza en Apps Script solo para rol owner, valida username/password y duplicados bajo lock, invalida cache de usuarios y no devuelve la contraseña. El cliente oculta la acción en roles no owner. La hoja `Usuarios` sigue almacenando contraseñas conforme al backend existente; nunca registrar ni mostrar la contraseña en logs/mensajes. El usuario despliega manualmente `agenda/apps-script/Code.gs`; Pages por sí solo no habilita el endpoint nuevo.
- Verificación local: pruebas de Calendario y contrato de usuario pasan antes de integrar; no se crearon cuentas ni se mutaron eventos, grupos, agendas o permisos durante QA. Clasificar revisión visual/autenticada de Pages como pendiente si no se obtiene sesión Moli estable.

## Agenda — invitaciones por correo a Google Calendar (2026-11-10)

- En Administración → Colaboradores, separar cuentas internas de invitaciones a una dirección de correo. Una invitación no crea ni exige usuario en `Usuarios`.
- Compartir como lector mediante Calendar API ACL `role=reader`, `scope.type=user`, `scope.value=email`, con `sendNotifications=true`; el servicio avanzado Calendar debe estar habilitado en `appsscript.json`. En el registro `CalendarMembers`, marcar el correo como activo para poder enumerar/revocar.
- Rechazar correos que ya sean cuentas registradas para evitar dos flujos de acceso para una identidad. El lock serializa el chequeo contra usuarios y otros cambios de ACL; duplicados activos son idempotentes, no vuelven a enviar el correo. Solo owner invita/revoca; revocar quita ACL y marca el registro como REMOVED. Si falla el guardado del registro, se intenta compensar la ACL; si falla también el rollback se expone `INVITATION_STATE_PARTIAL` para reconciliación manual.
- Google envía la invitación para abrir/agregar la agenda; avisos posteriores de eventos siguen las preferencias de Google Calendar de cada invitado, no son una garantía de notificación por correo. Debe comprobarse con una invitación de prueba autorizada tras el despliegue manual de Apps Script; no invitar contactos reales durante QA.


## Agenda — cola de invitaciones y tablas adaptativas (2026-11-10)

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

## Diagnóstico de caché Pages / service worker (2026-11-13)

- Evidencia de publicación: Pages sirve el commit `6e5215d7b4fa08e6eaabeb449a66581beb1ea752`; HTML, CSS y JS con query nueva retornan HTTP 200 y contienen el spinner DOM separado. HTML de Pages reporta `Cache-Control: max-age=600`, por lo que la meta no-store no controla la caché CDN/navegador de entrada.
- La inicialización de la app volvía a registrar `sw.js` tras el intento de limpieza en el HTML. Se elimina ese registro; arranque solo intenta desregistrar workers existentes del scope Notas. Las pruebas de contrato cubren ambas rutas.
- Nueva cache key de CSS/JS/context y suites actualizadas para asegurar relectura de recursos tras Pages. QA visual requiere Moli/navegador; el navegador integrado está bloqueado por cuota y Moli cae al iniciar en `partition_address_space.cc(81)`.

## Menú de clase: cohortes legibles (2026-11-13)

El selector combinado ya identifica la escuela, materia, curso y división. El resumen inmediatamente debajo no repite ese contexto: muestra una etiqueta «Cohortes» y chips compactos por año único derivado de estudiantes de esa clase, más «Pendiente» cuando corresponda. No incluir fechas día/mes en la lista del menú, para no repetir el año por cada estudiante. «Subgrupo · opcional» conserva su propia etiqueta y selector en una fila separada.

## Legibilidad global y ritmo visual (2026-11-13)

- Tipografía base 16px, interlineado cómodo y wrapping para el contenido principal; jerarquía de títulos y texto auxiliar sin microtexto.
- Formularios, filtros y botones conservan ancho mínimo cero y altura táctil; en móvil las ayudas/filtros/acciones se apilan para no compartir espacio insuficiente.
- Bloques, tarjetas y diálogos permiten texto largo sin desbordar; tablas y matrices permanecen en scroll local horizontal. Se conserva el comportamiento y los datos.
- Cache key CSS `20261113-reference8`; contrato en `notas/tests/layout-readability.test.js`.
- La captura visual responsive queda pendiente por indisponibilidad confirmada de navegador/Moli en el entorno.

## Debugging visual y caché opt-in (2026-11-13)

- Durante debugging, `ASSET_CACHE_ENABLED` y `SERVICE_WORKER_ENABLED` en `notas/config.js` quedan ambos en `false`. El loader de `index.html` desregistra workers de Notas y borra solo cachés `notas-static-*` en ese modo; el app.js ya no hace una limpieza paralela.
- Activación deliberada preproducción: cambiar los flags en config y desplegar; SW se registra con `?cache=1` solo si se habilita explícitamente asset cache. Por ahora no activarlos: Claudio avisará cuando termine debugging.
- Regression fix: login heading usa escala compacta clamp para no ocupar la vista; toast fija fondo oscuro explícito y spinner independiente, con overrides también en dark mode. Cache-buster `20261113-debugfix10`.

## Estilo de referencia de navegación (2026-11-13)

Claudio indicó como referencia visual `https://zapia-notas-nav-claudio-20261113.netlify.app/`: fondo salvia pálido, tarjetas blancas redondeadas con sombra leve, verde bosque como acento, títulos con escala editorial y acciones compactas en tarjetas. Aplicar a la app real sin adoptar los datos ficticios ni reemplazar su flujo/navigation. Validar desktop y móvil con screenshots, no inferir aceptación visual del CSS. Cache key CSS `20261113-reference8`. La referencia inspeccionada usa fondo salvia/verde gris, tarjetas blancas, radio ~18px, sombra suave, verde bosque y acciones compactas; no son solo cambios de tamaño de fuente. La app real hereda ese tratamiento en paneles, tarjetas, botones, formularios y estados oscuros, conservando el DOM y flujos existentes.

## Etiquetas limpias siguiendo la app de referencia (2026-11-13)

- Navegación docente agrupada en «Trabajo diario» y «Mi grupo», manteniendo «Administración» aparte. El orden de trabajo refleja la referencia: Asistencia, Notas, Libro de tema, Libreta, Observaciones.
- Inicio tiene cuatro acciones con títulos breves: Tomar asistencia, Cargar notas, Registrar clase y Ver estudiantes, con iconos y un apoyo contextual breve.
- Recortadas ayudas repetidas en login, asistencia, clases, estudiantes, administración y datos; iconos solo complementan los rótulos, no reemplazan acciones esenciales. La diferencia entre Actualizar/Leer y Sincronizar/Enviar borradores sigue explícita, igual que la protección de datos.
- Contratos en `notas/tests/clean-labels.test.js`; assets de CSS versionados con `20261113-cleanlabels12`.

## Trama: revisión selectiva de sincronización y entrada inicial (2026-11-13)

- Rebranding frontend: `Trama — Tu aula, en un solo lugar.` en title/login/topbar/sidebar y manifest. Apps Script/Sheets y datos no se modifican.
- Login pide `includeInitialList:true` al endpoint de Apps Script existente y reutiliza la primera página autenticada; solo solicita páginas adicionales si el backend devuelve cursor. La vista de carga se muestra durante el proceso y el merge de IndexedDB conserva los borradores sin enviarlos.
- «Sincronizar» abre revisión de borradores con selección individual y «seleccionar todos». La escritura conserva la ruta existente de `syncStagedChanges`; únicamente los IDs seleccionados se escriben, y los no seleccionados permanecen en IndexedDB. Conflictos aún pasan por su resolución específica.
- Menú vertical expone clase, escuela, materia, año/curso, división y cohorte. Cohorte filtra estudiantes de sus pertenencias de la clase actual; la división y demás alcance siguen regidos por los scopes del backend. Cerrar sesión está estilizado.
- Observaciones y actividad del Libro de tema muestran texto extenso contraído con `<details>`; tabla mantiene columna de acciones sticky y etiquetas por encabezado en filas para escaneo.
- Contratos ejecutables: `notas/tests/trama-workflow.test.js`, `login-performance.test.js`, `class-context.test.js`, `clean-labels.test.js`; suites existentes conservan cobertura.



## Agenda — cambio de nombre y ruta pública (2026-11-13)

- La subapp y carpeta canónicas son `agenda/` y `/apps/agenda/`, con marca «Agenda» en portada, README, SETUP, título y manifiesto. No se conserva una carpeta ni redirección `/apps/calendario/`; la ruta vieja devuelve 404.
- Se conserva el namespace IndexedDB `calendario`, `sessionStorage.calendarSession`, URLs/IDs del backend y manifiesto Apps Script para preservar sesiones, borradores locales, permisos y despliegue. No hay migración de Sheets ni despliegue de Apps Script.

## Agenda — mejoras incluidas y contratos vigentes (2026-11-13)

- La marca y ruta canónicas son Agenda en `/apps/agenda/`; no se conserva `/apps/calendario/`. La vista mensual, vista Tabla, creación y edición de eventos, grupos, Excel, recordatorios y recurrencia conservan el comportamiento existente. En portada y accesos de sesión se identifica como Agenda.
- La barra superior presenta «Configurar» y «Cerrar sesión» juntos. «Seleccionar agenda» precede a «Cambiar nombre de la agenda»; actualizar actúa sobre la agenda seleccionada. No cambiar nombres internos de sesión, IDs/URLs del backend, namespace IndexedDB `calendario` ni manifiesto de Apps Script al cambiar la ruta.
- La vista Tabla ofrece filtros de texto independientes para fecha, hora, evento, grupo y lugar, además de orden por columna. Filtrar/ordenar los eventos ya cargados no dispara consultas al backend ni amplía permisos. Mantener el scroll horizontal dentro de las tablas en móvil.
- «Administrar agendas» abre el diálogo con los datos disponibles sin esperar las consultas; en segundo plano refresca agendas y colaboradores, muestra el estado de carga y evita solicitudes repetidas para la misma agenda. El rol efectivo del backend sigue gobernando las acciones owner/editor; ocultar controles en el frontend no reemplaza autorización.
- La librería Excel se carga desde el asset de la propia subapp (`./vendor/xlsx.full.min.js` en `/agenda/`), sin depender de rutas relativas a la antigua carpeta. La importación mantiene previsualización/validación y no modifica ni elimina eventos existentes; exportación/importación autenticada requiere prueba separada.
- La cola de invitaciones a Google Calendar conserva el consentimiento explícito descrito arriba: preparar no envía, filas inicialmente desmarcadas, seleccionar destinatarios y pulsar «Enviar seleccionados». ACL reader y `sendNotifications=true`; nunca reenviar automáticamente resultados inciertos. El resultado positivo confirma que Google aceptó la operación, no la entrega ni aceptación humana.
- Revocar una invitación elimina optimísticamente la fila de acceso al confirmar la solicitud; si Apps Script falla, se restaura la fila y se muestra el error. El backend debe buscar la regla ACL correspondiente y eliminarla usando `rule.id` (no el correo como ID); solo confirmar la revocación cuando la operación y la persistencia terminen correctamente. No revocar, invitar ni cambiar permisos en QA sin autorización concreta.
- Los despliegues son independientes: el cambio de frontend/ruta y Pages no publica Apps Script. Los cambios del backend ACL o nuevas acciones requieren que Claudio despliegue manualmente `agenda/apps-script/Code.gs`; un HTTP 200 genérico del endpoint no acredita qué revisión está activa ni el scope/autorización ACL.
- Evidencia histórica de publicación: los tests de contrato de ruta/branding y borradores, asset Excel y suite frontend de Agenda pasaron en el worktree usado para la publicación; la ruta pública nueva, su JS y el asset Excel respondieron HTTP 200 después del workflow Pages exitoso. La antigua ruta compatible se elimina en un cambio posterior. Esto no equivale a QA autenticado de permisos, eventos, Excel o revocación real; esos flujos siguen requiriendo verificación autorizada sin mutar datos reales.
- Los encabezados históricos de esta app con el nombre «Calendario» describen iteraciones anteriores de la misma app; no representan otra aplicación ni una ruta pública. Se elimina `calendario/` del repositorio y Pages; solo se conserva el namespace IndexedDB `calendario`, `sessionStorage.calendarSession` y la hoja/backend con sus identificadores existentes para no perder compatibilidad de datos y sesiones.


## MGD — portadas diferenciadas por rol y contexto docente (2026-11-14)

- Inicio docente pone en primer plano Escuela, Curso/Año, División y Materia, reutilizando los filtros y la asignación de clase existentes; «Clase actual» resume el contexto activo. Cohorte y subgrupo siguen como filtros opcionales, y el selector combinado de clase permanece accesible. La marca autenticada muestra «Módulo de gestión docente» / «Tu aula en un solo lugar» y el avatar de Perfil usa «C».
- Inicio administrador ofrece accesos a Docentes y permisos, Registros, Instancias y pesos, y Papelera. Los destinos reutilizan las vistas actuales y conservan su visibilidad/validación por rol. El backend y el esquema de datos no cambian.
- La vista inicial se selecciona tras establecer el rol de sesión; antes de autenticar, login y contenido permanecen intactos. El perfil y la salida continúan en el lateral compartido.
- Verificación automatizada: `role-home-context.test.js`, contexto combinado y auto-selección con datos sintéticos, navegación móvil, y pruebas de rutas/autorización Apps Script. La navegación móvil aprobada utiliza barra inferior fija con seis destinos de igual ancho: Inicio, Asistencia, Notas, Libro de tema, Mi grupo y «Más»; este último abre el menú lateral de accesos secundarios. Etiquetas centradas en dos líneas cuando hace falta, targets del mismo alto, safe-area y estado activo visible. No implica QA visual autenticado ni despliegue de Apps Script; Pages frontend y `apps-script/Code.gs` son artefactos separados.

## MGD — instancias por materia/grupo y pesos del docente (2026-11-16)

- Administración puede generar, por cada materia y grupo configurado, el conjunto base: Nota de Proceso 1, Nota de Proceso 2, Nota de Proceso 3, Autoevaluación y Evaluación Final. Generar una segunda vez no duplica instancias existentes; faltantes de período/escala quedan señalados. La fecha puede permanecer vacía al crear la plantilla para que el docente asigne su fecha concreta.
- Cada contexto (escuela, materia, curso, división y período) mantiene su propia suma de pesos de 100%. El conjunto inicial reparte 20% por instancia. Cuando el docente modifica una ponderación, ese valor se fija y el remanente se redistribuye entre las demás instancias no fijadas del mismo contexto; si la suma no puede cerrar en 100%, el cambio se rechaza. No hay acción separada «Repartir por igual».
- Docentes pueden editar título, fecha y pesos de instancias existentes solo dentro de sus scopes vigentes; el servidor rechaza altas de instancias, cambios de materia/grupo/período/escala y escrituras forjadas fuera del alcance. Guardar sigue siendo borrador hasta sincronización explícita.
- «Instancias y pesos» está en Trabajo diario para admin y docentes. «Información» va después de «Mi grupo», antes de «Administración»; agrupa la consulta de estadísticas y agrupamientos. «Administración institucional» queda dentro de Administración. Los complementos subgrupo, período y escala se crean en el contexto exacto de materia/grupo autorizado para docentes; estructura institucional, alta de escuelas/cursos/divisiones/materias y docentes siguen reservadas al admin.
- La disponibilidad docente mantiene una única numeración por pasos; no duplica contadores externos e internos.
- Suite sintética: tests de jerarquía, roles/rutas, management docente, disponibilidad, workflows, navegación, trayectorias, plantillas/edición de pesos por contexto y reparto 100% PASS. No se modificó el Sheet ni se desplegó Apps Script. La cuota del navegador bloqueó QA visual auténtico; la vista real requiere verificación cuando el navegador vuelva a estar disponible.

## MGD — orden A–Z/Z–A en tablas y ubicación de Libreta (2026-11-16)

- Todas las tablas, incluidas las matrices que se crean al renderizar Estadísticas, reciben controles ↑ A–Z y ↓ Z–A en cada encabezado con nombre. El orden es estable, respeta la columna elegida y mantiene filtros/filas vacías. Las tablas generadas reciben IDs de herramienta en runtime si no traen uno, sin cambiar IDs de datos.
- Libreta se ubica en Información, junto a Estadísticas y agrupamientos, no en Trabajo diario. Su vista, exportación y permisos permanecen iguales.
- Contrato de orden por encabezado, matriz generada y navegación cubierto por `teacher-workflows.test.js`; suite `mgd/tests/*.test.js` ejecutada.


### Agenda — Pages + HtmlService en un solo proyecto Apps Script (decisión 2026-11-18)

- Una planilla y un único proyecto Apps Script vinculado contienen el backend `agenda/apps-script/Code.gs`, el HTML canónico `agenda/apps-script/Agenda.html` y un solo `appsscript.json` con scopes de Sheets, Calendar y `script.container.ui`.
- `GET /exec` sirve la UI HtmlService Agenda (opcional `?status=1` da health/schema); `POST /exec` conserva la API JSON usada por GitHub Pages. La UI del Sheet usa `google.script.run.runAgendaApi` y `runAgendaMaintenance`, llamando la misma autorización y lógica de backend; no hay proxy por URL de renderer ni segundo proyecto AIO.
- Menú del Sheet: primero «Abrir Agenda», seguido por «Verificar esquema normalizado», «Actualizar tablas legibles» y «RESET». Abrir no ejecuta mantenimiento ni RESET.
- Pages y HtmlService comparten backend/Sheet; Pages permanece frontend independiente y usa `agenda/config.js`. Mantener el mismo deployment `/exec` al actualizar; si cambia, actualizar Pages. No usar un manifiesto mínimo distinto para AIO.
- GitHub Pages, código Apps Script y RESET son estados independientes. Claudio actualiza manualmente el proyecto vinculado; el RESET requiere backup, palabra exacta y segundo consentimiento; no borrar objetos externos de Calendar. QA autenticado con Apps Script real queda pendiente hasta desplegar.

### Agenda — estructura previa del Sheet (decisión supersedida, 2026-11-18)

- Esta decisión intermedia preservaba pestañas operativas legacy (`Eventos`, `Agendas`, `CalendarMembers`, `Grupos`, `SyncOperations`) con vistas legibles. Claudio la reemplazó expresamente por el esquema normalizado descrito más abajo. No usar esta sección como contrato destino.
- Siguen vigentes: backup/confirmación antes de RESET; campo literal `RESET` y segundo consentimiento; gate de owner; no borrar objetos externos de Google Calendar; menú/operaciones de mantenimiento en el Apps Script vinculado. Pages y el proyecto Apps Script vinculado se publican por separado; backend y AIO HtmlService comparten el mismo deployment Apps Script. Código versionado no demuestra despliegue activo.

### RESET de Agenda: restitución de acceso (2026-11-18)

- Solo RESET reinicia la sesión del cliente y muestra temporalmente la clave aleatoria generada; reparación y refresh no deben cerrar la sesión. No recargar automáticamente ni ocultar el resultado; mantenerlo visible hasta una acción explícita «Recargar app» para que Claudio pueda guardarla en un gestor de contraseñas. No escribir la clave en logs o en la hoja salvo la fila de credenciales operativa existente.


### Agenda — RESET total y sesión/borradores locales (2026-11-18)

- `AGENDA_DATABASE_EPOCH` es una propiedad privada rotada solo tras un RESET completo; se incluye en el token firmado y `requireSession_` lo compara con el valor actual. El reset invalida tokens antiguos en todos los navegadores aunque el nombre de usuario/contraseña pudiera repetirse.
- El cliente deriva la partición de IndexedDB de Agenda con usuario+epoch. RESET limpia los borradores de la sesión actual; borradores locales que queden en otros navegadores/orígenes con epoch previo ya no se reponen en la cuenta nueva. No confundirlos con filas del Sheet: no se borran remotamente mediante el reset del backend.
- La contraseña temporal se conserva visible tras una respuesta de reset hasta «Recargar app»; no automatizar el refresh. Registrar esta diferencia local/servidor en la guía de operación.


### Manifiesto de scopes para mantenimiento Agenda (2026-11-18)

- Apps Script vinculado al Sheet: añadir `https://www.googleapis.com/auth/script.container.ui` al manifiesto para custom menu/dialogs; preservar scopes avanzados Calendar y demás existentes.
- Un único manifiesto en `agenda/apps-script/appsscript.json` reúne los scopes de Sheets, Calendar, ACL y `script.container.ui`. No mantener el manifiesto mínimo histórico de renderer ni pedir `script.external_request` si ya no hay proxy HTTP desde AIO.


### Agenda — organización del backend y paquete AIO (2026-11-18)

- Existe un solo proyecto Apps Script vinculado que contiene el backend `agenda/apps-script/Code.gs`, el HTML AIO `agenda/apps-script/Agenda.html` y un único manifiesto. `doGet` sirve HtmlService, `doPost` sigue siendo API Pages y `google.script.run` llama al backend común. La carpeta `aio/` conserva documentación/pruebas de la arquitectura integrada, no otro deployment ni otro manifiesto runtime.
- `agenda/agente/agent.md` es la guía maestra de reconstrucción/operación de Agenda, siguiendo el patrón `mgd/agente/agent.md`, adaptado a las reglas, modelos, verificaciones y límites propios de Agenda.
- La arquitectura de carpetas no demuestra despliegue. Pages y el proyecto Apps Script único se publican de forma independiente; GET HtmlService y POST API son entradas del mismo deployment. Claudio despliega Apps Script manualmente.

### Agenda — transición al esquema normalizado

- Decisión confirmada por Claudio: el esquema destino de Agenda será `Config`, `Registros` (`recordId,type,entityId,dataJson,version,status,updatedAt,createdAt`) y `Usuarios` (`usuario,pass,rol,alcances,mail,nombre,docenteId`); eventos, calendarios, miembros, grupos y operaciones pasan a ser registros tipados, con vistas legibles derivadas. RESET crea solo la nueva base vacía y el admin `cmaza` / `cmaza@mendoza.edu.ar` / Claudio Maza / admin; reparación no migra ni recrea pestañas legacy. RESET no elimina objetos externos de Google Calendar.
- Implementación verificada en rama aislada: adaptadores mantienen contrato HTTP; persistencia de eventos/agendas/miembros/grupos/operaciones es tipada en `Registros`, sin pestañas legacy. Reparación verifica esquema y admin y falla cerrado ante DB previa; RESET crea tres hojas operativas vacías, vistas derivadas, siembra admin y rota `AGENDA_DATABASE_EPOCH`, sin borrar Calendar externo ni migrar datos. Suite Agenda 26/26 en VM1, `node --check`, `git diff --check` PASS. La revisión independiente no estuvo disponible por cuota; esta limitación queda registrada, no equivale a aprobación. Apps Script deploy y RESET son gates separados de Claudio.
