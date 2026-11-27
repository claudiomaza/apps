# Registro Único

CRUD web para mantener registros de personas en una planilla central de Google Sheets. Las columnas de negocio son **Nombre, Apellido, DNI y Escolaridad**; cada registro se agrega al final y se identifica con un ID interno estable. La interfaz autenticada y el backend viven en un proyecto Apps Script vinculado a la planilla/HtmlService. GitHub Pages es solo una página de entrada estática.

## Arquitectura y acceso

- `appscript/`: exactamente `appsscript.json`, `Code.gs`, `Index.html` y `Admin.html`. Toda la lógica y validación están en el único `.gs`; cada HTML lleva sus propios estilos. No hay includes ni archivos auxiliares requeridos.
- `index.html`: página estática sin login, secretos ni acceso a Sheets; solo enlaza al deployment estable de Apps Script. Ruta en Pages: `/apps/registro-unico/`.
- `appscript/` se copia a un proyecto abierto desde la propia planilla: así el mismo proyecto queda vinculado y puede publicar el web app y registrar el menú de Sheets.
- Apps Script está configurado para ejecutarse como quien accede (`USER_DEPLOYING`) y requiere una cuenta Google (`ANYONE`, no acceso anónimo). Cada persona autoriza scopes de Sheets e identidad de email en su propia sesión. El backend usa `spreadsheets` para leer/escribir la hoja y gestionar permisos; el scope es amplio: Google lo asocia al acceso a hojas de cálculo del usuario, no únicamente a la hoja central. Revisar este consentimiento antes de publicar.
- La lista interna de correos y roles vive en Script Properties. En una hoja nueva, el dueño autenticado queda como admin al tocar explícitamente **Vincular esta planilla**; su correo solo se guarda en Script Properties, nunca en el código público. Roles: `admin`, `user1`, `user2`. Los dos últimos tienen los mismos permisos CRUD; solo el dueño de la planilla, autenticado como admin, puede entrar al panel y gestionar usuarios/permisos.
- Solo el dueño de la planilla ve **Vincular** y **Administración**. Cada acción de administración vuelve a validar en servidor que la persona sea dueña y tenga rol `admin`; conocer el URL del panel no concede acceso. El panel da o quita permiso individual de Editor en Sheets bajo esa identidad. La cuenta admin debe poder compartir la planilla; permisos heredados de grupos/dominio pueden permanecer luego de quitar un permiso individual.

**Límite importante:** usuarios autorizados como editores pueden modificar datos directamente en Google Sheets. El backend valida las operaciones hechas desde la app, pero no puede imponer esas validaciones en los cambios directos. No cargar datos reales hasta decidir quién puede acceder a la hoja y comprobar su configuración de uso compartido.

## Configuración inicial

1. Abrí la planilla autorizada desde la que querés usar Registro Único.
2. En esa planilla, abrí **Extensiones → Apps Script**. Ese proyecto queda vinculado a esa hoja. Copiá exactamente estos cuatro archivos de `appscript/`: `appsscript.json`, `Code.gs`, `Index.html` y `Admin.html`. No hay que crear archivos `Domain.gs` o `Styles.html`: los validadores ya están dentro de `Code.gs` y el CSS en cada HTML. Esto evita el error `No se encontró el archivo HTML llamado Styles`. No autorices ni publiques desde este repositorio/agente.
3. Guardá el proyecto y publicalo manualmente como Web app: ejecución como usuario que accede y acceso para usuarios con cuenta Google (no anónimo). Verificá esos ajustes en el diálogo del deployment; el manifest no demuestra cómo quedó la implementación activa.
4. Recargá la planilla. El menú **Registro Único** muestra **Abrir Registro Único** y, solo para el dueño/admin, **Administración** como opciones separadas. Al elegir una opción aparece un cuadro con un botón para abrir la app en otra pestaña (Apps Script requiere un clic de usuario para navegar desde su interfaz). Solo el dueño ve **Vincular esta planilla**; en una configuración nueva, al tocarlo queda como admin y se crean `Registros` y sus encabezados si faltan. `Hoja 1` se conserva. Una hoja incompatible o una ya vinculada distinta no se modifica.
5. Para habilitar usuarios, el dueño/admin abre Administración, agrega correo y rol, y la app otorga permiso de Editor en Sheets. Para revocar se desactiva el acceso en la app y se quita el permiso individual; permisos heredados por grupo/dominio pueden permanecer.
6. La carpeta mantiene su propio `index.html` para GitHub Pages en `/apps/registro-unico/`. El enlace al `/exec` se actualiza cuando Claudio entrega el URL del nuevo deployment vinculado.

## Desarrollo y pruebas

Las pruebas offline de contrato usan la biblioteca estándar de Python:

```sh
python3 -m unittest discover -s tests -v
```

No se conectan a Google, no usan credenciales ni escriben en una planilla. Para verificar Apps Script, autenticación, permisos reales y la UI hay que usar una planilla sintética aislada y un deployment de prueba creado manualmente por Claudio; no se considera PASS hasta probar con navegador y cuentas autorizadas.

## Pages

En el repo canónico `claudiomaza/apps`, Pages publica la landing en `/apps/registro-unico/`; el Apps Script se copia desde GitHub al proyecto vinculado y se despliega manualmente. La landing conserva el `/exec` actual hasta que Claudio proporcione el URL del nuevo deployment vinculado; no contiene login propio ni datos personales. Pages y Apps Script son despliegues separados.

## Versiones, permisos y rollback

- Pages y Apps Script se despliegan por separado. El proyecto Apps Script es el vinculado a la planilla; el menú y el web app viven en ese mismo proyecto. El repo no demuestra qué backend está activo.
- Antes de llevar `appscript/` al editor, comparar SHA/archivos con la versión que Claudio decida actualizar. La publicación es manual y no se hace con `clasp`.
- Para revertir Pages, volver a publicar el frontend del commit anterior. Para Apps Script, restaurar manualmente el código anterior y publicar una nueva versión desde Apps Script; no borrar el deployment existente.
- DNI es dato personal: limitar usuarios a necesidad real, proteger cuentas Google, evitar copias públicas/exportaciones y establecer retención fuera del alcance de esta primera versión.
