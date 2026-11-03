# Registro de notas

Frontend estático publicado en [GitHub Pages](https://claudiomaza.github.io/apps/notas/) con Apps Script + Google Sheets como backend y fuente de verdad.

## Recursos y estilo

- Servir HTML, CSS, JavaScript, manifest, imágenes y cualquier dependencia desde GitHub Pages; no usar CDNs para fuentes, librerías o scripts.
- Preferir APIs nativas del navegador y fuentes del sistema. Mantener la interfaz minimalista, responsive/mobile-first y con estados visibles de carga, guardado, error y éxito.
- La única solicitud de origen externo necesaria es a la API de Apps Script configurada en `config.js`. Ese endpoint es público; no poner secretos ni datos personales en el frontend.

## Datos y seguridad

La aplicación usa su propio Sheet y su pestaña `Usuarios`; no copiar la configuración de Google Calendar de la app Calendario. El login actual no implementa autorización por rol, docente o curso. No cargar datos reales de estudiantes hasta que esa autorización institucional esté definida e implementada. Las claves de `Usuarios` quedan en texto plano y el acceso al Sheet debe restringirse a administradores confiables.

## Apps Script

Para activar cambios en el backend, copiar `Code.gs` y `appsscript.json` desde [`../gas/notas/`](../gas/notas/) al proyecto vinculado, revisar/autorizar permisos y desplegar una nueva versión. Manual completo: [Drive](https://drive.google.com/file/d/1KPpT-NgigILhG5K5GNfyYgg86wcn85KQ/view).

## QA antes de publicar

- Revisar con Moli usando `--layout` en viewport `390x844` y escritorio; comprobar overflow horizontal, tabla/formularios, foco y estados de carga/guardado/error.
- Verificar Network: cero requests a CDNs; solo recursos GitHub Pages y el endpoint Apps Script.
- Si el navegador visual no inicia, reportar QA visual como BLOCKED y separar esa limitación de las comprobaciones HTTP/estáticas.

Ver también el [spec común](../SPEC-PERFORMANCE.md) y [setup del repo](../SETUP.md).
