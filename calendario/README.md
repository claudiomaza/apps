# Calendario

Frontend estático publicado en [GitHub Pages](https://claudiomaza.github.io/apps/calendario/) con Apps Script + Google Sheets como backend y fuente de verdad.

La pestaña `Config` (`key`/`value`) forma parte del contrato común de todas las apps y se lee por claves, no por números de fila. Colocar allí los valores operativos cambiables sin redeploy. Ver las reglas de configuración agnóstica, defaults, validación y caché en el [spec común](../SPEC-PERFORMANCE.md).

## Recursos y estilo

- Servir HTML, CSS, JavaScript, manifest, imágenes y cualquier dependencia desde GitHub Pages; no usar CDNs para fuentes, librerías o scripts.
- Preferir APIs nativas del navegador y fuentes del sistema. Mantener la interfaz minimalista, responsive/mobile-first y con estados visibles de carga, guardado, error y éxito.
- La única solicitud de origen externo necesaria es a la API de Apps Script configurada en `config.js`. Ese endpoint es público; no poner secretos en el frontend.

## Elegir el calendario de Google

El ID se configura en la pestaña `Config` de la planilla, con columnas `key` y `value`. La fila `calendarId` está actualmente en `Config!A5:B5`; B5 contiene el ID del calendario dedicado “Agenda de la app”. El ID no se publica aquí ni en GitHub.

Para cambiarlo:

1. Abrí Google Calendar en la web y elegí el calendario que querés usar.
2. Entrá en ⚙️ **Configuración** → seleccioná ese calendario en la columna izquierda → **Integrar el calendario**.
3. Copiá **ID del calendario** y pegalo completo en `Config!B5` del Sheet de Calendario.
4. Si Apps Script se ejecuta con otra cuenta, compartí el calendario con esa cuenta y dale permiso **Realizar cambios en los eventos**.

El valor vacío usa el calendario principal. El backend actualizado vuelve a leer `Config` en hasta 30 segundos; `limpiarCacheConfig()` aplica el cambio inmediatamente. Cambiar el valor no requiere redeploy una vez que el backend descrito abajo esté instalado. Los eventos nuevos guardan el ID de destino para que editar/eliminar sigan apuntando al mismo calendario aunque luego se cambie Config.

**Activación pendiente:** instalar en el proyecto Apps Script el `Code.gs` y `appsscript.json` actualizados desde [`../gas/calendario/`](../gas/calendario/), revisar/autorizar los scopes pedidos y desplegar una nueva versión. Hasta ese redeploy, el endpoint publicado todavía usa el comportamiento anterior. Manual completo e instrucciones: [Drive](https://drive.google.com/file/d/15Gy7lV9RJw4AT3kPoOcBK7rwMLjccF5o/view).

## Rendimiento

El login puede incluir la lista inicial del mes en la misma respuesta (`includeInitialList`) para evitar una segunda llamada; el backend de Apps Script debe estar actualizado y redeplegado para que se aplique. En lecturas mensuales sin caché, el backend recorre la hoja por bloques de hasta 500 filas y para al alcanzar el límite; cambios CRUD invalidan la caché versionada. La grilla agrupa eventos por fecha para minimizar trabajo al renderizar.

## QA antes de publicar

- Revisar con Moli usando `--layout` en `390x844` y escritorio; comprobar overflow, accesibilidad básica, estados del formulario y captura de pantalla.
- Verificar Network: no debe haber requests a CDNs; solo recursos GitHub Pages y el endpoint Apps Script.
- Si el navegador no inicia, reportar QA visual como BLOCKED y separar esa limitación de las comprobaciones HTTP/estáticas.

Ver también el [spec común](../SPEC-PERFORMANCE.md) y [setup del repo](../SETUP.md).
