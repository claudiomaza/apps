## Evaluación: simplificar la gestión de Notas

### Situación observada
- Los datos base (escuela, materia, curso, división, subgrupo, horarios, cortes y escalas) se crean desde acciones rápidas en «Registros» y se editan individualmente en una tabla técnica.
- Docentes: se crea la cuenta en «Docentes y permisos»; luego se preparan alcances materia/grupo; luego se asigna a cada horario. Disponibilidad vive en otra tarjeta.
- Estudiantes: «Agregar estudiante» crea ficha; la pertenencia (escuela/materia/curso/división/subgrupo) es otra entidad y otro formulario. La ficha puede tener varias pertenencias.
- Las operaciones de la interfaz quedan en borrador local y se escriben en Sheets al sincronizar.

### Propuesta simple (sin cambiar modelo ni datos)
1. **Inicio de configuración con 3 tareas guiadas:** «Crear curso», «Agregar estudiantes», «Configurar docentes». Mostrar prerequisitos y progreso; son accesos/contexto, no wizard que persiste nada automáticamente.
2. **Crear curso** agrupa escuela, materia, año/división, horarios e instancias en una secuencia que prepara todas las entidades como borradores; validación de duplicados/contexto y resumen antes de sincronizar.
3. **Agregar estudiantes** permite pegar/importar una lista de nombre + ID, revisar duplicados y luego asignar una o más pertenencias a un curso seleccionado. No escribir hasta aprobación de sincronización existente.
4. **Configurar docente** crear/editar ficha una vez, elegir uno o varios cursos y luego asignar clases desde la lista de horarios. Disponibilidad se mantiene opcional y contextual al docente.
5. **Vista de pendientes de configuración:** avisar de clases sin docente, cursos sin estudiantes, estudiantes sin pertenencia e instancias sin calificaciones, con acciones de navegación.

### Límites y riesgos
- No fusionar Ficha estudiante con Pertenencia: un alumno puede estar en varios grupos; conservar IDs y formato backend actual.
- No unir cuenta docente, alcance, disponibilidad y horario como un único registro; son relaciones diferentes aunque la UI las guíe juntas.
- No enviar a Sheets automáticamente. Mantener preparación, revisión de lote, conflictos y botón explícito de sincronización.
- Próximo paso recomendado: validar el orden y alcance del wizard de «Crear curso» y de importación/asignación de estudiantes con Claudio antes de implementarlos. Probar solo con fixtures; QA autenticado y sincronización requieren autorización específica.
