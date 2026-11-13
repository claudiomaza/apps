# Apps Script — MGD

El código, el manifiesto y este manual viven en GitHub junto al frontend. La base operativa es el Sheet [notas](https://docs.google.com/spreadsheets/d/1d9yL3ZhjdQIxRQEFVXltRA_QtjIZc6UrcO_1NyT1oA4/edit).


## Configuración

La aplicación usa el libro **notas**, con las pestañas `Registros`, `Config`, `Usuarios` e `Instrucciones`. El backend incluido apunta explícitamente a este ID y no al Sheet anterior `MGD`.

`Config` usa `key` / `value`; `maxPageSize` admite 1–300 (default 300) y `maxBatchSize` 1–100 (default 100). `Usuarios` acepta los encabezados históricos `usuario`, `pass`, `rol`, `alcances`, `mail`, `nombre`; al guardar el primer docente, la app migra todas las filas preservadas y agrega `docenteId` como séptima columna. Una fila por cuenta, máximo 200. `mail` y `nombre` son obligatorios (máximo 254 y 200 caracteres, respectivamente). Solo `usuario` y `pass` se escriben en el formulario para entrar; `rol`, `alcances`, `mail` y `nombre` forman el perfil y autorizaciones de la cuenta. Ejemplo de perfil: Claudio Maza · cmaza@mendoza.edu.ar · Docente. `rol` es `admin` o `docente`. `alcances` es un JSON array (docente: 0–20 contextos exactos `{ "schoolId":"...", "subjectId":"...", "courseId":"...", "divisionId":"..." }`; admin: `[]`). Los identificadores deben ser IDs internos existentes, no nombres. Para cada docente, el perfil puede verse como nombre + mail + rol; `alcances` define los cursos/grupos asignados. Esos alcances se construyen con los IDs internos de los registros ya existentes, pero en la pantalla se muestran sus nombres, no hace falta que el usuario conozca ni escriba IDs. El único usuario que se configura manualmente en la hoja es el admin inicial. Las cuentas docentes y sus datos se crean desde «Usuarios y permisos», sin necesidad de asignarles grupos al crearlas; las asignaciones se guardan después desde el panel separado. Apps Script permite esas acciones solo a sesiones admin y valida que los cuatro IDs existan. Los usuarios se vuelven a leer en cada solicitud protegida, por lo que quitar alcances invalida el acceso al curso en la próxima solicitud. `pass` sigue en texto plano; limitar Drive a administradores confiables y no compartir la hoja con docentes.

El acceso anónimo de la Web App permite que la página pública llame al endpoint, pero no habilita lectura/escritura sin autenticar: `auth` comprueba las credenciales de `Usuarios` y las demás acciones requieren una sesión firmada. La API filtra las lecturas por alcance y valida escrituras en backend; docentes pueden cargar notas, asistencia, observaciones y libro de tema solo en cursos asignados. Altas/configuración global, matrículas, edición de estudiantes, papelera y bajas/restauraciones requieren admin. No cargar datos reales hasta migrar Usuarios, actualizar Apps Script y probar dos cuentas docentes independientes.

La nueva pestaña `Disponibilidad docente` se crea automáticamente al registrar bloqueos de horario; conserva ID, día, franja horaria, estado y fecha de actualización. Los bloqueos se consultan por Apps Script, solo por admin, y se contrastan al construir horarios.

### ID del docente y disponibilidad

La pestaña `Usuarios` usa `docenteId` como séptima columna; el primer guardado migra las filas históricas agregando la columna y conservando cada registro. La ficha se crea sin asignaciones; el panel separado de asignaciones actualiza el campo `alcances` solo después de validar los grupos activos. `Disponibilidad docente` se crea al primer bloqueo; las operaciones de alta/listado/baja son exclusivas de admin. Un horario con docente asignado se rechaza en servidor si choca con otro horario activo de esa persona o con un bloqueo de disponibilidad. En Configuración → Registros, «Proponer docentes» distribuye entre horarios existentes solo docentes asignados al mismo grupo exacto; excluye choques y bloqueos, muestra la propuesta completa en una tabla con acciones separadas para cancelar o preparar. Al prepararla, valida que el horario no haya cambiado y la guarda localmente sin sincronizar automáticamente. No crea días ni franjas nuevos: deben cargarse horarios primero.

## Manifiesto `appsscript.json`

En la configuración del proyecto Apps Script, activá **Mostrar el archivo de manifiesto `appsscript.json`** y reemplazá su contenido por:

```json
{
  "timeZone": "America/Argentina/Buenos_Aires",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets"
  ],
  "webapp": {
    "executeAs": "USER_DEPLOYING",
    "access": "ANYONE_ANONYMOUS"
  }
}
```

## Instalación y despliegue

1. Abrí el Sheet enlazado arriba → **Extensiones → Apps Script**.
2. Copiá el contenido de [`Code.gs`](./Code.gs) en el archivo `Code.gs` del proyecto Apps Script vinculado. Reemplazá el código anterior por completo; Apps Script comparte el espacio global y no deben quedar definiciones duplicadas.
3. Pegá el manifiesto anterior, guardá y autorizá el scope de Sheets cuando Google lo solicite.
4. Desplegá como aplicación web: **Ejecutar como: yo** y **Quién tiene acceso: cualquiera**. Esto corresponde a `USER_DEPLOYING` y `ANYONE_ANONYMOUS` del manifiesto.
5. Confirmá el endpoint con `/exec`; la respuesta esperada es `service: gradebook-normalized`. Después autenticá el admin y verificá que `auth` incluya `access.role`, `access.scopes` y `profile` antes de crear docentes.
6. Dejá en `Usuarios` únicamente la cuenta admin inicial, con `rol=admin` y `alcances=[]`; completá `mail` y `nombre`. El admin crea docentes y después asigna cursos desde el panel separado de la app, sin editar directamente esas filas. Antes de actualizar encabezados, respaldá la pestaña y migrá la fila inicial; el backend migra el esquema histórico de seis columnas agregando `docenteId`, preservando las filas existentes; respaldá la pestaña antes de la primera alta de docente. No compartas el Sheet con docentes porque `pass` permanece en texto plano.

El frontend está en [MGD](https://claudiomaza.github.io/apps/mgd/) (ruta canónica) y usa la URL `/exec` configurada en [`../config.js`](../config.js). Si cambia el deployment, actualizá ese archivo y publicá Pages por separado. El acceso a la app requiere sesión válida en el Sheet. No hay cuenta local; los cambios sincronizados se guardan en Sheets y los preparados se conservan como borrador local en el navegador hasta que se sincronicen o se descarten explícitamente.

## Modelo y uso

### Gestión de docentes desde la app
La pestaña admin «Usuarios y permisos» lista docentes sin devolver ni mostrar sus contraseñas. Permite crear docentes, editar nombre/correo/alcances y restablecer contraseña; un campo de contraseña vacío durante la edición conserva la actual. El alta exige contraseña temporal de al menos 12 caracteres y confirmación en la interfaz; las asignaciones de grupos son opcionales y se guardan por separado. Los alcances se eligen visualmente como escuela, materia, curso y división existentes (máximo 20). Cada combinación debe existir como contexto activo en un horario, matrícula, instancia, asistencia, observación o tema; el backend rechaza combinaciones cruzadas o inexistentes. El endpoint `listUsers` y la operación `saveTeacher` exigen sesión con rol admin en el servidor; nunca se acepta crear o editar administradores desde la app. La contraseña temporal se muestra solo al escribirla en el formulario: entregala por un canal seguro y pedí cambiarla por un flujo de reset futuro; no se envía por email automáticamente.

### Multiusuario y asignaciones
Cada solicitud vuelve a cargar y validar el rol/alcances desde `Usuarios`, de modo que quitar una asignación bloquea el acceso en la siguiente solicitud. Los administradores pueden gestionar todo. Docentes leen solo sus escuelas/materias/cursos/divisiones; pueden preparar/sincronizar notas, asistencia, observaciones y temas allí. Los vínculos de estudiantes solo se leen dentro de esos contextos; el docente no puede asignar o cambiar matrículas ni la ficha global del estudiante. Papelera y cambios de estado son exclusivos de admin. Un alumno presente en más de un curso puede mostrarse en cada alcance asignado, sin revelar otras pertenencias.

`Registros` usa ocho columnas estables (`recordId`, `type`, `entityId`, `dataJson`, `version`, `status`, `updatedAt`, `createdAt`) y una fila por escuela, materia, curso/año, división, subgrupo, estudiante, pertenencia, horario semanal, asistencia por sesión, corte, escala, instancia o calificación. La ficha del estudiante puede incluir fecha de nacimiento, domicilio, correo, teléfono, referente, documentos y notas socioeducativas; compartir esos campos solo con personas autorizadas. No se agregan columnas por evaluación. La libreta ancha se genera dinámicamente en frontend.

- Escalas numéricas y cualitativas configurables con equivalencias por intervalo; las categorías cualitativas se convierten usando el punto medio.
- Los horarios semanales se registran por escuela, materia, curso y división, con día y horas de inicio/fin. No se permiten horarios superpuestos para el mismo grupo y materia. La asistencia se marca en una sesión fechada de ese horario, con una casilla por estudiante; al guardar la lista, casillas marcadas quedan `Presente` y desmarcadas `Ausente`. Una sesión de otra materia nunca se comparte.
- Una nota por estudiante e instancia; observaciones y asistencia vinculada por calificación. La fecha se elige entre asistencias `Presente` del mismo estudiante y contexto, y se deriva de esa sesión. Si faltó en la fecha de la evaluación, registrar `Ausente`; tras asistir otro día, cargar la nota en la misma instancia asociándola a esa asistencia. La fecha original permanece en la instancia.
- Pesos por materia/corte totalizan 100%; el remanente se redistribuye entre instancias no fijadas y existe la acción `Repartir por igual`.
- Ausente/No entregó cuentan cero; Pendiente/Eximido se excluyen y se renormaliza el promedio ponderado.
- La app requiere sesión para leer y sincronizar con Sheets. Los cambios preparados se persisten localmente en el navegador, por cuenta y hasta 100 registros; se recuperan al iniciar sesión y no se envían solos. Antes de sincronizar se vuelve a leer Sheets y se comparan las versiones; conflictos requieren elección explícita. El token de sesión se conserva temporalmente en `sessionStorage`; los datos ya sincronizados se vuelven a leer de Sheets.
- El panel Administrar registros implementa alta, consulta, edición, baja lógica recuperable y restauración. Las bajas se confirman, versionan y guardan como `DELETED` sin borrar la fila física; los registros relacionados bloquean la baja de sus padres hasta resolver primero las dependencias. La asistencia queda ligada a un horario/sesión semanal por materia y grupo, identificada por estudiante, fecha y sesión; no se presume Presente por defecto. Una calificación con estado Calificada debe apuntar a una asistencia Presente del mismo estudiante y contexto (materia, grupo y sesión); el backend impide convertir esa asistencia a Ausente mientras haya calificaciones asociadas. La papelera muestra lo eliminado y permite restaurar respetando la versión y los padres activos. La asistencia diaria no se preselecciona como Presente; primero debe registrarse explícitamente.
- Excel usa filas normalizadas en `Registros`; `Libreta` es una vista generada. La importación previsualiza y resuelve conflictos antes de escribirlos directamente a Sheets; no borra datos por ausencia.

## Frontend y QA

Servir HTML, CSS, JS y librerías desde el propio GitHub Pages; sin CDNs externos. El service worker cachea assets solamente. Probar con fixtures locales: admin, docente asignado a curso A, docente asignado a B; verificar que A no obtiene registros, estudiantes, notas, asistencia, observaciones, temas, escalas ni cortes de B, y que también se rechazan escrituras forjadas al backend. Probar 390×844 y desktop. No usar la hoja real ni datos reales en QA.



## Archivo fuente

El único fuente del backend es [`Code.gs`](./Code.gs); copiá ese archivo entero al proyecto Apps Script. No mantengas otra copia del código dentro de un Markdown.

## Fuente de verdad

Mantené y revisá código, instrucciones y decisiones en [`claudiomaza/apps`](https://github.com/claudiomaza/apps). Drive queda para la planilla operativa; no editar ni guardar manuales allí. El frontend y Apps Script se publican por separado. No probar escrituras con datos reales sin autorización.
