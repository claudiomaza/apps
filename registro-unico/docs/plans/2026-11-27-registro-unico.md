# Registro Único — Implementación integrada

**Estado:** incorporada a `claudiomaza/apps` en `main`; Pages publica la landing en `/apps/registro-unico/`. El código del web app y del menú vinculado aún requiere instalación/despliegue manual; el runtime Google no está verificado.

**Arquitectura:** la aplicación vive bajo `registro-unico/` en el repo canónico `claudiomaza/apps`: `appscript/` contiene exactamente `appsscript.json`, un `Code.gs`, `Index.html` y `Admin.html`. Los validadores se definen en `Code.gs`; estilos embebidos en cada vista HTML; no hay includes ni archivos auxiliares. `index.html` contiene la landing Pages; README, AGENT y SPEC documentan el proyecto. Apps Script corre como el usuario Google que accede. Roles viven en Script Properties; endpoints revalidan ACL. Admin concede/revoca permiso individual de editor en Sheets. Linkear no crea pestaña `Acceso`; El mismo proyecto vinculado aporta el menú/side panel de Sheets. Pages solo enlaza al `/exec`.

**Pruebas:** `python3 -m unittest discover -s registro-unico/tests -v` (14 PASS); análisis de sintaxis Apps Script/HTML y parseo de ambos manifiestos PASS. Estas verificaciones no prueban OAuth ni runtime Google real.

**Despliegue:** Apps Script lo publica manualmente Claudio; no usar clasp ni publicar desde el agente. GitHub Pages sirve desde la raíz y publica `registro-unico/index.html` como `/apps/registro-unico/`. Mantener `main` integrado y una única rama local `dev`; evitar ramas feature adicionales.

**Pendiente:** Claudio debe copiar los cuatro archivos al proyecto abierto desde la hoja, aceptar scopes y publicar el web app, luego recargar Sheet para usar el menú y validar OAuth/ACL/UI con una hoja sintética. No se modificaron deployment ni hojas reales.
