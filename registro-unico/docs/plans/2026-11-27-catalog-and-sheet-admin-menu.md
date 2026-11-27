# Registro Único en Apps y acceso a Administración desde Sheets — Plan

**Objetivo:** incorporar Registro Único a `claudiomaza/apps` y dar acceso a su panel desde la interfaz de la planilla sin crear una pestaña auxiliar.

**Diseño:** mantener el web app independiente como fuente de autenticación, autorización y CRUD. Google reserva menús/sidebars de Sheets para scripts vinculados; por eso un script compañero mínimo, instalado una vez desde la planilla, agrega el menú y la barra lateral con botón. Pages publica la landing bajo `/apps/registro-unico/`.

**Stack:** Apps Script/HtmlService, Google Sheets UI, GitHub Pages, pruebas offline de contrato Python.

---

## Tareas y aceptación

1. **Contrato primero:** cambiar pruebas para exigir que linkear la hoja no cree `Acceso` y que el menú vinculado exista con el endpoint Admin correcto. Correr suite para comprobar fallo antes del cambio.
2. **Backend/UI mínima:** quitar el código/acción que crea `Acceso`; conservar `Registros` y sus validaciones. Agregar el menú companion con scopes `spreadsheets.currentonly` y `script.container.ui`.
3. **Documentación:** describir el límite de scripts independientes, instalación manual en la planilla y URL a actualizar. Conservar propiedades privadas y límites de despliegue manual.
4. **Catálogo:** copiar fuente y pruebas a `registro-unico/`, usar `index.html` en la raíz de esa carpeta, sumar tarjeta a `/apps/`, y actualizar README/SETUP/SPEC comunes.
5. **Validar:** ejecutar 12 pruebas offline, parsear JavaScript/HTML/manifest, inspeccionar diff/secretos y comprobar ambos Pages y el enlace activo. No modificar Apps Script desplegado ni Sheets reales.

## Límites

- El web app y el menú vinculado son proyectos/despliegues distintos.
- Una pestaña `Acceso` vieja no se borra automáticamente; el código nuevo deja de crearla.
- La instalación/consentimiento del script vinculado y el deployment de Apps Script quedan en manos de Claudio.
- QA real de Google UI/OAuth sigue pendiente hasta probarlo en una planilla autorizada/sintética.
