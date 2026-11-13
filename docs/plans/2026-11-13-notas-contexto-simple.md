# Simplificar contexto y pantalla inicial — Plan

**Meta:** hacer que el docente vea una clase seleccionable como una sola combinación de escuela, espacio curricular, curso y división, con cohorte derivada de sus estudiantes y subgrupo como filtro secundario; reducir ruido en Inicio sin quitar herramientas existentes.

**Límites:** frontend `notas/`, sin cambios de Apps Script, contratos de datos, permisos ni sincronización. La cohorte vive en la ficha del estudiante; se presenta como información derivada, no se escribe en la asignación.

**Archivos:** `notas/index.html`, `notas/app.js`, `notas/styles.css`, pruebas de navegación y regresión existentes, prueba nueva de contexto.

1. Añadir una prueba de contrato fallida para selector de clase único, identidad combinada y filtros existentes preservados.
2. Derivar lista de clases de los alcances y datos autorizados; al cambiarla, actualizar los cuatro filtros existentes y recalcular UI; presentar cohorte(s) desde estudiantes miembros.
3. Reorganizar la portada en tareas frecuentes; agrupar resumen y filtros globales bajo un bloque colapsado; conservar accesos actuales, administración y flujos de captura.
4. Ejecutar suite completa y revisar diff/riesgos; publicar solo el frontend aprobado si toda la evidencia pasa.

## Corrección de legibilidad (2026-11-13)

- Ajuste de ancho, altura, scroll, saltos de línea y safe area de toast en móvil/escritorio.
- Columnas de texto de acciones y resumen con tamaño mínimo cero y wrapping explícito para que no se amontonen.
- Versión de cache incrementada para CSS y JS.
