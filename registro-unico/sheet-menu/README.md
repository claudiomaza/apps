# Menú de Registro Único para Google Sheets

Este proyecto complementario tiene que estar **vinculado a la planilla**, porque Google permite que solo scripts vinculados agreguen menús, sidebars o botones a la interfaz de Sheets. No es el backend del web app y no contiene permisos, usuarios ni datos.

1. Abrí la planilla y entrá en **Extensiones → Apps Script** para crear/abrir su proyecto vinculado.
2. Copiá `Code.gs` y `appsscript.json` de esta carpeta. En el editor, habilitá la vista del manifiesto si aún no aparece.
3. Guardá, revisá el scope de UI del contenedor y aceptá el consentimiento de Google que corresponde.
4. Volvé a abrir la planilla. Usá **Registro Único → Abrir administración**; en la barra lateral, tocá **Abrir administración**.

Si cambia el deployment de Apps Script, actualizá `REGISTRO_UNICO_ADMIN_URL` en `Code.gs`. El acceso directo `/exec?page=admin` sigue funcionando aunque no se instale este menú.
