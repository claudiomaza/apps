# Calendario

Frontend estático publicado por GitHub Pages en `/apps/calendario/`; backend Apps Script + Sheets, incluido el soporte de grupos y colores, en [`apps-script/`](./apps-script/). El backend se desplegó manualmente antes de publicar este frontend.

Los eventos históricos quedan sin grupo y conservan su color hasta que se les asigne uno. La app puede asignar colores a eventos y series de Google Calendar, pero no se validó el color real en producción.

Tests locales: `node day-grid.test.js`, `node stage-sync.test.js`, `node groups-color.test.js`.
