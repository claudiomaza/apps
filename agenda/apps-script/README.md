# Agenda Apps Script

- `Code.gs`: backend canónico vinculado al Sheet. `GET` sirve el AIO, `POST` conserva la API JSON para Pages, y el menú abre la UI seguido de acciones de mantenimiento.
- `Agenda.html`: interfaz HtmlService integrada; usa `google.script.run` contra el mismo backend.
- `appsscript.json`: único manifiesto de este proyecto, con scopes de Sheets/Calendar y UI del contenedor.
- `aio/`: documentación histórica de despliegue unificado y pruebas/contratos; ya no representa un proyecto independiente ni usa renderer separado.
- `sheet-launcher.test.js`, `unified-appsscript.test.js`, `agenda-database-maintenance.test.js`: contratos del menú, routing y esquema.

GitHub Pages llama al `POST /exec` de este mismo backend. Desplegar Apps Script y ejecutar RESET son pasos manuales del propietario y no ocurren al publicar GitHub.
