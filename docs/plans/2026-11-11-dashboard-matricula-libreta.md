# Panel inicial, pertenencias y libreta matricial — Plan de implementación

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Hacer que el panel inicial presente estadísticas útiles de asistencia/calificaciones, resaltar asignación por año/división y mostrar la libreta grupal con todas las instancias en columnas y nombre/fecha/nota claramente separados.

**Architecture:** Reutilizar `Summary.stats`, `attendanceByDay`, `gradesByAssessment` y el filtro exacto de pertenencias; el resumen estadístico será el contenido del panel inicial. La libreta grupal consultará instancias del mismo contexto escolar/materia/año/división, independientemente del corte, manteniendo agrupación por subgrupos y celdas existentes.

**Tech Stack:** HTML, CSS, JavaScript vanilla, Node.js `assert` tests, Moli/CDP para QA visual.

---

### Task 1: Contrato y regresiones

**Files:**
- Modify: `notas/tests/summary-dashboard.test.js`
- Modify: `notas/tests/ui-regression.test.js`

1. Añadir assertions para que el panel de estadísticas sea el panel inicial y muestre asistencia por día, conteos por estado y promedio/conteos por instancia; el tab no debe quedar oculto tras otro selector.
2. Añadir fixtures de dos cortes del mismo grupo y otro grupo distinto; assert que la libreta usa todas las instancias del grupo seleccionado (y no mezcla curso/división), con fecha en cabecera y valor/estado en la celda.
3. Ejecutar ambas pruebas antes de implementar y confirmar fallo esperado por layout/contract.

### Task 2: Panel inicial y asignación del estudiante

**Files:**
- Modify: `notas/index.html`
- Modify: `notas/app.js`

1. Cambiar el selector para que «Panel inicial» muestre primero los indicadores de asistencia/calificaciones ya calculados y mantenga actividad reciente debajo, sin duplicar un tab de estadísticas.
2. Reordenar y rotular la pertenencia con escuela, año/curso y división antes de materia/subgrupo; explicitar el grupo elegido en la UI y no cambiar el esquema de datos.
3. Verificar counts por grupo exacto, cohortes, cursos/divisiones y estados.

### Task 3: Libreta con todas las instancias del grupo

**Files:**
- Modify: `notas/app.js`
- Modify: `notas/index.html` only if accessible headings need change.

1. En la libreta del grupo, filtrar instancias por escuela/materia/año/división seleccionados, sin restringir al corte seleccionado; respetar subgrupos y pertenencia.
2. Cada instancia ocupa una columna con nombre y fecha separados; el peso queda como metadato, y cada celda conserva la calificación/estado.
3. Filtrar filas por datos identificatorios (nombre e ID) y exportar la misma selección ancha a Excel; no alterar notas ni Sheets.
4. Actualizar las regresiones y ejecutar la suite completa de `notas/tests/*.test.js`.

### Task 4: Revisión, QA visual y evidencia

1. Revisar diff, scope, escaping, cruces de grupo/división y exportación.
2. Ejecutar Moli en 390×844, 320×740 y 1440×1000 con datos sintéticos: dashboard inicial, selector año/división y libreta ancha con varias instancias. No sincronizar ni modificar Sheets reales.
3. Registrar la decisión y evidence/status en `SPEC-PERFORMANCE.md`.
4. No publicar/integrar hasta satisfacer las revisiones y gates del repositorio.

**Acceptance:** tests de regresión y suite aprobados; panel inicial tiene las estadísticas provistas como forma de datos (no valores hardcodeados); matrícula visibiliza curso/división sin ampliar scope; libreta contiene todas las instancias del contexto y todas las filas identifican estudiante; Moli observa layouts reales; ninguna escritura a Sheets.
