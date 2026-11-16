# Apps internas

Repositorio público con las apps internas y sus contratos comunes. **GitHub es la fuente de verdad** del código, los specs, las decisiones y la documentación; Drive queda solo para las planillas que funcionan como bases de datos; los specs, manuales e instrucciones se mantienen únicamente en GitHub.

## Estructura

- [`SPEC-PERFORMANCE.md`](./SPEC-PERFORMANCE.md): contratos comunes y reglas para futuras apps.
- [`SETUP.md`](./SETUP.md): mapa operativo del repositorio, Sheets y despliegues separados.
- [`mgd/`](./mgd/): frontend publicado de **MGD** y [`apps-script/`](./mgd/apps-script/) con backend, manifiesto e instalación. `/apps/mgd/` es la única ruta pública de MGD.
- [`agenda/`](./agenda/): frontend publicado de Agenda y [`apps-script/`](./agenda/apps-script/) con backend, manifiesto e instalación.

GitHub Pages conserva las rutas públicas `/apps/`, `/apps/mgd/` y `/apps/agenda/`. Los cambios de HTML/JS/CSS modifican el sitio al publicarse desde `main`; Apps Script se copia/despliega aparte desde el `Code.gs` versionado en cada app.

## Fuentes de datos y seguridad

Los dos Google Sheets en Drive son las bases de datos operativas: [notas](https://docs.google.com/spreadsheets/d/1d9yL3ZhjdQIxRQEFVXltRA_QtjIZc6UrcO_1NyT1oA4/edit) y [Calendario](https://docs.google.com/spreadsheets/d/1OypDck9kNKtTPHOdNWPLCqU9Sjr591a9bL6S3YhjFH0/edit). Sus pestañas guardan datos/configuración; no guardan documentación del proyecto.

El repositorio y GitHub Pages son públicos. No incluir claves, contraseñas, tokens, datos personales ni IDs/valores operativos que deban mantenerse privados. La autenticación/autorización siempre se valida del lado del backend.

## Trayectoria académica

La sección de Administración «Trayectoria académica» configura planes, materias obligatorias, correlaciones curso-div y equivalencias; ofrece inicio, permanencia, promoción individual/grupal y pases con informe imprimible/PDF. Cada tramo registra su cohorte como año cursado en ese curso-div, con fechas efectivas. El promedio final se calcula por materia con las instancias ponderadas del régimen (admin); aprueba con ≥7. La decisión es explícita, y el admin puede promover aunque queden pendientes. Los cambios son borradores locales y requieren sincronización explícita. Los tipos nuevos están en la hoja histórica `Registros`; no se migra ningún dato antiguo ni se despliega Apps Script automáticamente. Ver `agente/agent.md` para reconstrucción y operación desde cero.
