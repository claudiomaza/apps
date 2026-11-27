# Registro Único

CRUD web para mantener registros de personas en una planilla central de Google Sheets. Las columnas de negocio son **Nombre, Apellido, DNI y Escolaridad**; cada registro se agrega al final y se identifica con un ID interno estable. La interfaz autenticada y el backend viven en Google Apps Script/HtmlService. GitHub Pages es solo una página de entrada estática.

## Arquitectura y acceso

- `appscript/`: exactamente `appsscript.json`, `Code.gs`, `Index.html` y `Admin.html`. Toda la lógica y validación están en el único `.gs`; cada HTML lleva sus propios estilos. No hay includes ni archivos auxiliares requeridos.
- `index.html`: página estática sin login, secretos ni acceso a Sheets; solo enlaza al deployment estable de Apps Script. Ruta en Pages: `/apps/registro-unico/`.
- `sheet-menu/`: pequeño proyecto vinculado a la planilla para agregar el menú de acceso y una barra lateral con botón. Solo navega a la web app; no gestiona usuarios, datos ni permisos.
- Apps Script está configurado para ejecutarse como quien accede (`USER_DEPLOYING`) y requiere una cuenta Google (`ANYONE`, no acceso anónimo). Cada persona autoriza scopes de Sheets e identidad de email en su propia sesión. Como esta app standalone abre una planilla por ID, el scope declarado `spreadsheets` es amplio: Google lo asocia al acceso a hojas de cálculo del usuario, no únicamente a la hoja central. Revisar este consentimiento antes de publicar.
- La lista interna de correos y roles vive en Script Properties. El primer administrador se elige mediante una Script Property privada y se inicializa al primer acceso. Roles: `admin`, `user1`, `user2`. Los dos últimos tienen los mismos permisos CRUD; solo `admin` gestiona usuarios y permisos de la planilla.
- El panel da o quita permiso individual de Editor en Sheets usando `Spreadsheet.addEditor/removeEditor`, bajo la identidad del administrador autenticado. La cuenta admin debe poder compartir la planilla. Permisos heredados de grupos/dominio pueden permanecer luego de quitar un permiso individual.

**Límite importante:** usuarios autorizados como editores pueden modificar datos directamente en Google Sheets. El backend valida las operaciones hechas desde la app, pero no puede imponer esas validaciones en los cambios directos. No cargar datos reales hasta decidir quién puede acceder a la hoja y comprobar su configuración de uso compartido.

## Configuración inicial

1. Claudio crea una planilla sintética o autorizada y conserva su ID.
2. En Apps Script, crea un proyecto independiente y copia exactamente estos cuatro archivos de `appscript/`: `appsscript.json`, `Code.gs`, `Index.html` y `Admin.html`. No hay que crear archivos `Domain.gs` o `Styles.html`: los validadores ya están dentro de `Code.gs` y el CSS en cada HTML. Esto evita el error `No se encontró el archivo HTML llamado Styles`. No autorices ni publiques desde este repositorio/agente.
3. Antes del deployment, en Apps Script > Configuración del proyecto > Propiedades del script, establecer `REGISTRO_UNICO_INITIAL_ADMIN_EMAIL` con el correo Google completo de la cuenta administradora inicial (por ejemplo, `nombre@dominio.com`, sin espacios ni comillas). Esa configuración no se versiona. Luego iniciar sesión con esa misma cuenta, autorizar los scopes de Sheets e identidad y abrir `?page=admin`. Si falta la propiedad o el valor no parece un correo, la app informa específicamente cuál propiedad revisar.
4. En el panel, vinculá el ID de la planilla. Solo se crea `Registros` y su encabezado si la pestaña no existe o está vacía; si ya tiene encabezados distintos, la app se detiene sin sobrescribirla. No se crea una pestaña auxiliar `Acceso`.
5. Publicá manualmente como Web app: ejecución como usuario que accede y acceso para usuarios con cuenta Google (no anónimo). Verificá estos ajustes en el diálogo del deployment; el manifest no demuestra que el deployment activo haya quedado configurado.
6. Para abrir Admin desde Sheets, abrí `Extensiones > Apps Script` en la planilla y copiá `sheet-menu/Code.gs` y `sheet-menu/appsscript.json` en ese proyecto vinculado (habilitá la vista del manifiesto si hace falta). Guardá, autorizá únicamente los scopes de planilla actual e interfaz del contenedor y volvé a abrir la planilla: aparece el menú **Registro Único > Abrir administración** y una barra lateral con el botón **Abrir administración**. Esta instalación complementaria es necesaria porque solo un script vinculado a la planilla puede agregar menús a Sheets. No pegues esos archivos en el proyecto independiente del web app. Si no instalás el menú, Admin sigue disponible en el enlace `/exec?page=admin`.
7. La landing ya apunta al deployment `/exec` informado por Claudio. Si cambia, actualizá el enlace del botón en `index.html`.
8. Para habilitar usuarios, desde Admin agregá correo/rol. El botón les concede Editor de Sheets. Para revocar se desactiva primero en la app y luego se quita el permiso individual de Sheets. El panel avisa que el acceso heredado por grupo/dominio debe revisarse aparte.

## Desarrollo y pruebas

Las pruebas offline de contrato usan la biblioteca estándar de Python:

```sh
python3 -m unittest discover -s tests -v
```

No se conectan a Google, no usan credenciales ni escriben en una planilla. Para verificar Apps Script, autenticación, permisos reales y la UI hay que usar una planilla sintética aislada y un deployment de prueba creado manualmente por Claudio; no se considera PASS hasta probar con navegador y cuentas autorizadas.

## Pages

En el repo canónico `claudiomaza/apps`, Pages publica la landing en `/apps/registro-unico/`; el Apps Script queda solo como fuente para copiar/desplegar manualmente. La landing enlaza al deployment informado por Claudio; no contiene login propio ni datos personales. Pages y Apps Script son despliegues separados.

## Versiones, permisos y rollback

- Pages y Apps Script se despliegan por separado. El repo no demuestra qué backend está activo.
- Antes de llevar `appscript/` al editor, comparar SHA/archivos con la versión que Claudio decida actualizar. La publicación es manual y no se hace con `clasp`.
- Para revertir Pages, volver a publicar el frontend del commit anterior. Para Apps Script, restaurar manualmente el código anterior y publicar una nueva versión desde Apps Script; no borrar el deployment existente.
- DNI es dato personal: limitar usuarios a necesidad real, proteger cuentas Google, evitar copias públicas/exportaciones y establecer retención fuera del alcance de esta primera versión.
