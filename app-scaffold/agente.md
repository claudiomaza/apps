# Guía de agente — plantilla inicial

## Propósito y límites

Esta carpeta contiene una plantilla inicial ejecutable, no una app de negocio. Mantener sin nombre, dominio, entidades, roles reales o flujos hasta definición de Claudio. La demo frontend es mock inseguro, solo local; jamás incorporarla a producción ni usarla para proteger datos.

## Decisiones acordadas

- Referencia MGD adaptada con UI propia, responsive mobile-first y sin dependencias de runtime/CDN.
- La primera implementación de negocio será offline con adapter mock y fixtures sintéticas.
- Los borradores no se envían automáticamente; más adelante habrá un único botón «Sync todo» por lote, con resultado por registro y reintento solo de fallidos.
- Sheets guarda filas canónicas; IDs estables, versión optimista y relaciones validadas en Apps Script.
- Apps Script incluye menú para crear/reparar esquema sin borrar datos.
- El usuario acepta texto plano para credenciales; documentar el riesgo, limitar acceso al Sheet y no usar datos reales en ejemplos, tests o Git.
- No desplegar Apps Script ni escribir/borrar/modificar planillas reales. El propietario realizará el despliegue.

## Plantilla actual

- `index.html` + `styles.css`: login de demostración y estado interno vacío, accesibles y responsive.
- `config.js`: credenciales demo ficticias `demo` / `demo123`; solo mock local, no producción.
- `app.js`: validación de vacíos, feedback de error/cargando/éxito, toggle de contraseña, sesión de demo en `sessionStorage` y logout.
- `apps-script/Code.gs`: login compatible con `Usuarios(usuario,pass,rol,...)`, token de CacheService, `whoami`/`logout`, menú, reparación conservadora y reset manual vía diálogo (no endpoint). El reset es destructivo y requiere respaldo manual.
- `apps-script/ResetDialog.html`: diálogo de reset pide solo correo y `RESETEAR`, muestra la clave temporal una vez.
- `apps-script/appsscript.json`: runtime V8 y scopes de Sheets y UI del contenedor.
- `apps-script/README.md`: instrucciones solo para instalación del propietario en una planilla nueva.
- `package.json`: comando único `bun test`.
- `tests/scaffold.test.js` y `tests/database.test.js`: suites Bun para UI demo, esquema, reparación/reset y contrato de Apps Script con mocks sintéticos.

## Restricciones para continuar

- El frontend no se comunica con Apps Script todavía. No crear datos o tareas internas genéricas como si fueran el producto solicitado.
- La plantilla Apps Script no implementa alta/cambio de contraseña, permisos de negocio, sync ni entidades. Diseñar esos comportamientos con la definición del dominio.
- `setupTemplate` conserva datos y se detiene ante incompatibilidades; no crea usuarios. El reset es destructivo, requiere respaldo y validación server-side, y crea una cuenta inicial temporal. Nunca ejecutarlo en una planilla operativa durante desarrollo.
- Publicar en Pages solo luego de acordar producto, completar flujos, verificar tests y QA responsive real. Apps Script se despliega por separado.

## Verificación

Desde `app-scaffold/`: `bun test`. Es una prueba mock/contrato; no reemplaza browser UI real, despliegue Apps Script ni acceso a producción.
