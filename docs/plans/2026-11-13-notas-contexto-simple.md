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

## Spinner explícito en «Verificando» (2026-11-13)

El indicador deja de ser un pseudo-elemento CSS junto al texto: pasa a un círculo de carga en un `span` dedicado, separado del texto por flex-gap. El mensaje vive en otra columna flexible que envuelve sin colapsar. Cache key `20261113-toastlayout3`; test focal `toast-loading.test.js`.

## Diagnóstico de caché Pages / service worker (2026-11-13)

- Evidencia de publicación: Pages sirve el commit `6e5215d7b4fa08e6eaabeb449a66581beb1ea752`; HTML, CSS y JS con query nueva retornan HTTP 200 y contienen el spinner DOM separado. HTML de Pages reporta `Cache-Control: max-age=600`, por lo que la meta no-store no controla la caché CDN/navegador de entrada.
- La inicialización de la app volvía a registrar `sw.js` tras el intento de limpieza en el HTML. Se elimina ese registro; arranque solo intenta desregistrar workers existentes del scope Notas. Las pruebas de contrato cubren ambas rutas.
- Nueva cache key de CSS/JS/context y suites actualizadas para asegurar relectura de recursos tras Pages. QA visual requiere Moli/navegador; el navegador integrado está bloqueado por cuota y Moli cae al iniciar en `partition_address_space.cc(81)`.

## Menú de clase y cohortes (2026-11-13)

Mostrar cohortes bajo el selector combinado como chips con años únicos; reemplazar `unassigned` por «Pendiente». No concatenar de nuevo escuela/materia/curso/división ni fechas por estudiante. El selector de subgrupo conserva rótulo independiente debajo.

## Legibilidad global y ritmo visual (2026-11-13)

- Tipografía base 16px, interlineado cómodo y wrapping para el contenido principal; jerarquía de títulos y texto auxiliar sin microtexto.
- Formularios, filtros y botones conservan ancho mínimo cero y altura táctil; en móvil las ayudas/filtros/acciones se apilan para no compartir espacio insuficiente.
- Bloques, tarjetas y diálogos permiten texto largo sin desbordar; tablas y matrices permanecen en scroll local horizontal. Se conserva el comportamiento y los datos.
- Cache key CSS `20261113-reference8`; contrato en `notas/tests/layout-readability.test.js`.
- La captura visual responsive queda pendiente por indisponibilidad confirmada de navegador/Moli en el entorno.

## Estilo de referencia de navegación (2026-11-13)

Claudio indicó como referencia visual `https://zapia-notas-nav-claudio-20261113.netlify.app/`: fondo salvia pálido, tarjetas blancas redondeadas con sombra leve, verde bosque como acento, títulos con escala editorial y acciones compactas en tarjetas. Aplicar a la app real sin adoptar los datos ficticios ni reemplazar su flujo/navigation. Validar desktop y móvil con screenshots, no inferir aceptación visual del CSS. Cache key CSS `20261113-reference8`. La referencia inspeccionada usa fondo salvia/verde gris, tarjetas blancas, radio ~18px, sombra suave, verde bosque y acciones compactas; no son solo cambios de tamaño de fuente. La app real hereda ese tratamiento en paneles, tarjetas, botones, formularios y estados oscuros, conservando el DOM y flujos existentes.
