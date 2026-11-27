# Registro Único — Implementación integrada

**Estado:** incorporada a `claudiomaza/apps` en `main`; Pages publica la landing en `/apps/registro-unico/`. El código del web app y del menú vinculado aún requiere instalación/despliegue manual; el runtime Google no está verificado.

**Arquitectura vigente:** la aplicación vive bajo `registro-unico/` en el repo canónico `claudiomaza/apps`: `appscript/` contiene `appsscript.json`, un `Code.gs` y `Registro.html` como vista HtmlService integrada, al estilo de Agenda. `doGet` y el menú usan la misma interfaz; sus acciones van por `google.script.run` y un dispatcher allowlisted. `index.html` es la landing Pages independiente. Apps Script corre como quien accede; ACL vive en Script Properties y el servidor revalida cada operación. Administración requiere dueño + admin; el flujo no crea `Acceso`. No se administra ni despliega el Apps Script activo desde el agente.

**Pruebas:** `python3 -m unittest discover -s registro-unico/tests -v` (14 PASS); análisis de sintaxis Apps Script/HTML y parseo de ambos manifiestos PASS. Estas verificaciones no prueban OAuth ni runtime Google real.

**Despliegue:** Apps Script lo publica manualmente Claudio; no usar clasp ni publicar desde el agente. GitHub Pages sirve desde la raíz y publica `registro-unico/index.html` como `/apps/registro-unico/`. Mantener `main` integrado y una única rama local `dev`; evitar ramas feature adicionales.

**Pendiente:** Claudio debe copiar `appsscript.json`, `Code.gs` y `Registro.html` al proyecto abierto desde la hoja, aceptar scopes y publicar el web app; luego recargar Sheet para usar el menú y validar OAuth/ACL/UI con una hoja sintética. No se modificaron deployment ni hojas reales.
