# Agenda en /agenda

Restaurada como subapp, separada de la app de Notas en la raíz. En la toolbar, Acciones está junto a Nuevo evento; el listado de tarjetas «Agenda del mes» se eliminó. La vista Tabla ahora tiene filtros de texto independientes encima de Fecha, Hora, Evento, Grupo y Lugar; filtran sin hacer consultas nuevas y conservan lectura/escritura por rol.

Administrar agendas abre el diálogo inmediatamente con los datos ya presentes y refresca calendario/miembros en segundo plano, indicando estado de carga. Sigue habilitado owner/editor según el rol backend.

Los assets Excel se reutilizan desde `../vendor`, sin duplicar el fichero grande. No se tocaron eventos reales. QA autenticado puede usar el endpoint ya desplegado; todavía no se ejecutó ningún cambio/mutación de agenda real.
