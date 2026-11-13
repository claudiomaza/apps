# Apps internas

Repositorio público con las apps internas y sus contratos comunes. **GitHub es la fuente de verdad** del código, los specs, las decisiones y la documentación; Drive queda solo para las planillas que funcionan como bases de datos; los specs, manuales e instrucciones se mantienen únicamente en GitHub.

## Estructura

- [`SPEC-PERFORMANCE.md`](./SPEC-PERFORMANCE.md): contratos comunes y reglas para futuras apps.
- [`SETUP.md`](./SETUP.md): mapa operativo del repositorio, Sheets y despliegues separados.
- [`mgd/`](./mgd/): frontend publicado de **MGD** y [`apps-script/`](./mgd/apps-script/) con backend, manifiesto e instalación. `/apps/mgd/` es la ruta pública actual; `/apps/notas/` redirige por compatibilidad.
- [`agenda/`](./agenda/): frontend publicado de Agenda y [`apps-script/`](./agenda/apps-script/) con backend, manifiesto e instalación.

GitHub Pages conserva las rutas públicas `/apps/`, `/apps/mgd/` y `/apps/agenda/`. Los cambios de HTML/JS/CSS modifican el sitio al publicarse desde `main`; Apps Script se copia/despliega aparte desde el `Code.gs` versionado en cada app.

## Fuentes de datos y seguridad

Los dos Google Sheets en Drive son las bases de datos operativas: [notas](https://docs.google.com/spreadsheets/d/1d9yL3ZhjdQIxRQEFVXltRA_QtjIZc6UrcO_1NyT1oA4/edit) y [Calendario](https://docs.google.com/spreadsheets/d/1OypDck9kNKtTPHOdNWPLCqU9Sjr591a9bL6S3YhjFH0/edit). Sus pestañas guardan datos/configuración; no guardan documentación del proyecto.

El repositorio y GitHub Pages son públicos. No incluir claves, contraseñas, tokens, datos personales ni IDs/valores operativos que deban mantenerse privados. La autenticación/autorización siempre se valida del lado del backend.
