# Agenda en /agenda

Restaurada como subapp, separada de la app de Notas en la raíz. En la toolbar, Acciones está junto a Nuevo evento; el listado de tarjetas «Agenda del mes» se eliminó. La vista Tabla ahora tiene filtros de texto independientes encima de Fecha, Hora, Evento, Grupo y Lugar; filtran sin hacer consultas nuevas y conservan lectura/escritura por rol.

Administrar agendas abre el diálogo inmediatamente con los datos ya presentes y refresca calendario/miembros en segundo plano, indicando estado de carga. Sigue habilitado owner/editor según el rol backend.

Los assets Excel se reutilizan desde `../vendor`, sin duplicar el fichero grande. No se tocaron eventos reales. QA autenticado puede usar el endpoint ya desplegado; todavía no se ejecutó ningún cambio/mutación de agenda real.


## Apps Script y guía de mantenimiento

El proyecto Apps Script único y vinculado contiene [`apps-script/Code.gs`](./apps-script/Code.gs), el AIO HtmlService [`apps-script/Agenda.html`](./apps-script/Agenda.html) y un solo manifiesto. GET sirve la UI, POST conserva el API de Pages y `google.script.run` conecta ambos con el mismo backend. Ver la guía completa de despliegue en [`apps-script/README.md`](./apps-script/README.md) y la guía operativa [`agente/agent.md`](./agente/agent.md).

El backend en preparación usa el esquema normalizado `Config`/`Registros`/`Usuarios`; RESET crea la base nueva vacía y la reparación falla cerrado si detecta hojas legacy. No migra datos ni borra objetos externos de Google Calendar. El despliegue de Apps Script y el RESET son pasos separados que realiza Claudio.
