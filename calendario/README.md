# Calendario

Frontend estático publicado en [GitHub Pages](https://claudiomaza.github.io/apps/calendario/) con Apps Script + Google Sheets como backend y fuente de verdad.

La pestaña `Config` (`key`/`value`) forma parte del contrato común de todas las apps y se lee por claves, no por números de fila. Colocar allí los valores operativos cambiables sin redeploy. Ver las reglas de configuración agnóstica, defaults, validación y caché en el [spec común](../SPEC-PERFORMANCE.md).

## Recursos y estilo

- Servir HTML, CSS, JavaScript, manifest, imágenes y cualquier dependencia desde GitHub Pages; no usar CDNs para fuentes, librerías o scripts.
- Preferir APIs nativas del navegador y fuentes del sistema. Mantener la interfaz minimalista, responsive/mobile-first y con estados visibles de carga, guardado, error y éxito.
- La única solicitud de origen externo necesaria es a la API de Apps Script configurada en `config.js`. Ese endpoint es público; no poner secretos en el frontend.

## Elegir el calendario de Google

El destino se configura en la pestaña `Config` de la planilla, con columnas `key` y `value`. `calendarId` (`Config!A5:B5`) identifica el calendario y `calendarName` (`Config!A6:B6`) sincroniza el nombre real del calendario al acceder desde la app. Cambiar el nombre no cambia el destino; para eso se cambia `calendarId`. Si `calendarName` queda vacío, se conserva el nombre actual. El ID no se publica aquí ni en GitHub.

Para cambiarlo:

1. Abrí Google Calendar en la web y elegí el calendario que querés usar.
2. Entrá en ⚙️ **Configuración** → seleccioná ese calendario en la columna izquierda → **Integrar el calendario**.
3. Copiá **ID del calendario** y pegalo completo en `Config!B5` del Sheet de Calendario.
4. Si Apps Script se ejecuta con otra cuenta, compartí el calendario con esa cuenta y dale permiso **Realizar cambios en los eventos**.

El valor vacío usa el calendario principal. El backend actualizado vuelve a leer `Config` en hasta 30 segundos; `limpiarCacheConfig()` aplica el cambio inmediatamente. Cambiar el valor no requiere redeploy una vez que el backend descrito abajo esté instalado. Los eventos nuevos guardan el ID de destino para que editar/eliminar sigan apuntando al mismo calendario aunque luego se cambie Config.

**Activación pendiente:** instalar en el proyecto Apps Script el `Code.gs` y `appsscript.json` actualizados desde [`../gas/calendario/`](../gas/calendario/), revisar/autorizar los scopes pedidos y desplegar una nueva versión. Hasta ese redeploy, el endpoint publicado todavía usa el comportamiento anterior. Manual completo e instrucciones: [Drive](https://drive.google.com/file/d/15Gy7lV9RJw4AT3kPoOcBK7rwMLjccF5o/view).

## Rendimiento

El login puede incluir la lista inicial del mes en la misma respuesta (`includeInitialList`) para evitar una segunda llamada; el backend de Apps Script debe estar actualizado y redeplegado para que se aplique. En lecturas mensuales sin caché, el backend recorre la hoja por bloques de hasta 500 filas y para al alcanzar el límite; cambios CRUD invalidan la caché versionada.

**Importar y exportar Excel:** `Exportar a Excel` descarga todos los eventos activos, no solo el mes visible, mediante `exportEvents` en páginas de hasta 300 registros con cursor y versión de datos. La planilla para editar a mano usa `Título`, `Fecha inicio`, `Hora inicio`, `Fecha fin`, `Hora fin`, `Todo el día`, `Lugar`, `Descripción`, `Recurrencia` y `Recordatorio`: formato simple para editar a mano, con fechas `DD/MM/AAAA`, horas `HH:mm`, `Sí/No`, recurrencia en español legible y recordatorios en unidades entendibles. No muestra JSON ni IDs técnicos. `Importar Excel` acepta `.xlsx`, `.xls` o `.csv`, lee la primera hoja y exige Título, Inicio y Fin. Reconoce los campos opcionales amigables y mantiene compatibilidad con antiguas planillas (`Recurrence JSON`, `Recordatorio (min)`, IDs y fechas ISO). Antes de validar, muestra una tabla HTML con todas las filas del archivo tal como vienen en la planilla. Si una celda no cumple el formato, pide sustituir ese dato y vuelve a validarlo; cancelar abandona toda la importación. Al terminar, muestra una segunda vista previa marcando qué filas se agregan o se omiten por duplicadas; confirmar es un paso separado y nunca modifica ni elimina eventos existentes. Es aditiva: siempre crea IDs nuevos y nunca actualiza ni elimina eventos existentes, aunque el archivo tenga un ID ya conocido. Omite fingerprints existentes (título, inicio, fin y lugar) y filas repetidas dentro del Excel; el resto crea eventos/series nuevas. La sincronización nunca elimina eventos que no están en el archivo ni incorpora estados marcados como eliminados. Reimportar el mismo archivo omite los eventos ya existentes y no duplica. Errores de fila/fecha se rechazan antes de escribir. La lectura de XLSX/CSV es local con SheetJS versionado y sin CDN. Las filas de todo el día no se importan (la app gestiona por ahora eventos con hora). La recurrencia editable admite `No se repite`, `Diaria`, `Semanal: jueves`, `Mensual`, `Anual`, y formas `Cada N días/semanas/meses/años`, con fin `; N veces` o `; hasta DD/MM/AAAA`. Los recordatorios aceptan `Predeterminado`, `N minutos antes`, `N horas antes` o `N días antes`. Si la agenda cambia durante el recorrido, la exportación se cancela para evitar generar un archivo inconsistente. Se limita el archivo a 1.048.575 eventos (límite de filas de Excel, además del encabezado). La app genera `calendario-eventos-AAAA-MM-DD.xlsx` en el navegador cargando SheetJS CE versión 0.20.3 desde el bundle local (`vendor/xlsx.full.min.js`); la biblioteca se sirve como recurso estático de la misma app y se incluye en su caché offline. La licencia Apache 2.0 está incluida y no se usa CDN. Los eventos eliminados no se incluyen; recurrencia y recordatorio salen en texto legible. El backend de Apps Script y el endpoint actual ya soportan estas funciones; este cambio de formato corresponde solo al frontend y requiere publicar la nueva versión de Pages. `calendarName` renombra el calendario real asociado al `calendarId` al usarse desde la app; el ID continúa seleccionando el destino. La recurrencia se guarda como serie de Calendar y queda registrada en las columnas `recurrence` y `reminderMinutes` de `Eventos` (se agregan si faltan); la UI edita o elimina toda la serie y expande las ocurrencias del mes visible. El recordatorio emergente puede usar el predeterminado del calendario, fijarse en minutos o programarse para un día y hora concretos; el día/hora se traduce a la anticipación que admite CalendarApp (entre 5 minutos y 4 semanas antes del evento). Al editar una serie se aplica la misma anticipación a toda ella. El cambio de `calendarName` también renombra el calendario asociado al `calendarId`. Personalizada admite cada N días/semanas/meses/años, días de semana y fin nunca/fecha/cantidad. Ejemplo de fila manual: `Reunión semanal | 06/11/2026 | 09:00 | 06/11/2026 | 10:00 | No | Sala | | Semanal: jueves; 8 veces | 15 minutos antes`.

## QA antes de publicar

- Revisar con Moli usando `--layout` en `390x844` y escritorio; comprobar overflow, accesibilidad básica, estados del formulario y captura de pantalla.
- Verificar Network: no debe haber requests a CDNs; solo recursos GitHub Pages y el endpoint Apps Script.
- Si el navegador no inicia, reportar QA visual como BLOCKED y separar esa limitación de las comprobaciones HTTP/estáticas.

Ver también el [spec común](../SPEC-PERFORMANCE.md) y [setup del repo](../SETUP.md).
