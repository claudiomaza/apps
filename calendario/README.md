# Calendario

Frontend estático servido por GitHub Pages en `/apps/calendario/`, con Apps Script y Google Sheets como backend. El backend con grupos y colores está versionado en [`apps-script/`](./apps-script/).

El frontend de grupos **no debe publicarse** hasta que se confirme el despliegue de Apps Script que agrega `groupId`, `Grupos` y las acciones `listGroups`, `saveGroup`, `deleteGroup`. Los eventos históricos no reciben grupo por migración.

Tests locales: `node day-grid.test.js`, `node stage-sync.test.js`, `node groups-color.test.js`. El color real de Calendar requiere validación posterior al despliegue, no acreditada por estas pruebas simuladas.
