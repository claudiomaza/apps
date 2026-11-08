# Apps Script — Calendario

Backend fuente para la app en `../`. La actualización de grupos agrega `groupId` como columna final de `Eventos`, crea `Grupos` y requiere el scope de Calendar para asignar colores. La migración es aditiva y no asigna grupos ni altera eventos existentes.

**Despliegue:** no desplegar desde este cambio. El propietario de la planilla debe actualizar el proyecto Apps Script y confirmar ese despliegue antes de publicar el frontend de GitHub Pages.

La cuenta que ejecuta el script debe autorizar Sheets y Calendar. Verificar la pestaña `Eventos` con `groupId` al final, la pestaña `Grupos`, grupos con/sin eventos, series y eventos antiguos sin grupo antes del uso. No se verificó aún el color real end-to-end en Google Calendar.
