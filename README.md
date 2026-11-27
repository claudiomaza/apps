# Apps internas

Repositorio público con las apps internas y sus contratos comunes. **GitHub es la fuente de verdad** del código, los specs, las decisiones y la documentación; Drive queda solo para las planillas que funcionan como bases de datos; los specs, manuales e instrucciones se mantienen únicamente en GitHub.

## Estructura

- [`SPEC-PERFORMANCE.md`](./SPEC-PERFORMANCE.md): contratos comunes y reglas para futuras apps.
- [`SETUP.md`](./SETUP.md): mapa operativo del repositorio, Sheets y despliegues separados.
- [`mgd/`](./mgd/): frontend publicado de **MGD** y [`apps-script/`](./mgd/apps-script/) con backend, manifiesto e instalación. Su planilla vinculada se llama **MGD**; la ruta pública es `/apps/mgd/`.
- [`registro-unico/`](./registro-unico/): landing publicada en `/apps/registro-unico/` y fuentes del web app de **Registro Único**, con backend standalone en `appscript/` y un script vinculado complementario en `sheet-menu/` para abrir Administración desde Sheets sin crear otra pestaña.
- [`agenda/`](./agenda/): frontend publicado de **AGENDA** y [`apps-script/`](./agenda/apps-script/) con backend, manifiesto e instalación. Su planilla vinculada se llama **AGENDA**; la ruta pública es `/apps/agenda/`. El único proyecto Apps Script vinculado contiene el backend [`Code.gs`](./agenda/apps-script/Code.gs), la interfaz [`Agenda.html`](./agenda/apps-script/Agenda.html) y un único manifiesto. `GET /exec` sirve el AIO; `POST /exec` conserva el API que consume Pages. Las instrucciones para desplegar ambos frontends están en [`agenda/apps-script/README.md`](./agenda/apps-script/README.md); la guía operativa está en [`agenda/agente/agent.md`](./agenda/agente/agent.md).

GitHub Pages publica las interfaces en `/apps/`, `/apps/mgd/`, `/apps/agenda/` y `/apps/registro-unico/`. `/apps/notas/` queda retirada junto con su redirect obsoleto: usá `/apps/mgd/`. Los cambios web se publican desde `main`; cada proyecto Apps Script se despliega por separado según su guía.

## Hojas operativas

Las bases de datos de los proyectos son las hojas vinculadas **MGD**, **AGENDA** y, cuando queda vinculada desde el panel, **Registro Único**. Sus pestañas guardan datos y configuración operativa; specs, manuales e instrucciones viven únicamente en este repositorio, no en las hojas.

- [Planilla MGD](https://docs.google.com/spreadsheets/d/1d9yL3ZhjdQIxRQEFVXltRA_QtjIZc6UrcO_1NyT1oA4/edit)
- [Planilla AGENDA](https://docs.google.com/spreadsheets/d/1OypDck9kNKtTPHOdNWPLCqU9Sjr591a9bL6S3YhjFH0/edit)

El repositorio y GitHub Pages son públicos. No incluir claves, contraseñas, tokens, datos personales ni IDs/valores operativos que deban mantenerse privados. La autenticación/autorización siempre se valida del lado del backend.
