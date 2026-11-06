# Registro de notas

Frontend en [GitHub Pages](https://claudiomaza.github.io/apps/notas/); la base de datos y usuarios viven en la planilla de Drive [notas](https://docs.google.com/spreadsheets/d/1d9yL3ZhjdQIxRQEFVXltRA_QtjIZc6UrcO_1NyT1oA4/edit).

- Frontend: archivos de esta carpeta; la configuración pública del backend está en [`config.js`](./config.js).
- Backend: [`apps-script/Code.gs`](./apps-script/Code.gs), manifiesto [`apps-script/appsscript.json`](./apps-script/appsscript.json) e instalación/contrato en [`apps-script/README.md`](./apps-script/README.md).
- Reglas comunes para futuras apps: [`../SPEC-PERFORMANCE.md`](../SPEC-PERFORMANCE.md).

GitHub es la única fuente de verdad del código y la documentación. Drive se usa para la planilla operativa; no editar manuales separados allí. Una modificación del frontend no despliega Apps Script y viceversa; validar ambos por separado. No guardar secretos ni datos personales en el repositorio público.
