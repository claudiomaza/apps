# Agenda en /agenda

Restaurada como subapp, separada de la app de Notas en la raíz. En la toolbar, Acciones está junto a Nuevo evento; el listado de tarjetas «Agenda del mes» se eliminó. La vista Tabla ahora tiene filtros de texto independientes encima de Fecha, Hora, Evento, Grupo y Lugar; filtran sin hacer consultas nuevas y conservan lectura/escritura por rol.

Administrar agendas abre el diálogo inmediatamente con los datos ya presentes y refresca calendario/miembros en segundo plano, indicando estado de carga. Sigue habilitado owner/editor según el rol backend.

Los assets Excel se reutilizan desde `../vendor`, sin duplicar el fichero grande. No se tocaron eventos reales. QA autenticado puede usar el endpoint ya desplegado; todavía no se ejecutó ningún cambio/mutación de agenda real.


## Apps Script y guía de mantenimiento

El backend único y canónico está en [`apps-script/Code.gs`](./apps-script/Code.gs). El UI HtmlService independiente está documentado bajo [`apps-script/aio/`](./apps-script/aio/README.md), cuyo renderer se llama `Render.gs` para no confundirlo con el backend. La guía maestra de reconstrucción, contratos y límites es [`agente/agent.md`](./agente/agent.md).

El backend en preparación usa el esquema normalizado `Config`/`Registros`/`Usuarios`; RESET crea la base nueva vacía y la reparación falla cerrado si detecta hojas legacy. No migra datos ni borra objetos externos de Google Calendar. El despliegue de Apps Script y el RESET son pasos separados que realiza Claudio.
