# Registro Único

CRUD web para mantener registros de personas en una planilla central de Google Sheets. Las columnas de negocio son **Nombre, Apellido, DNI y Escolaridad**; cada registro se agrega al final y se identifica con un ID interno estable. La interfaz autenticada y el backend viven en un proyecto Apps Script vinculado a la planilla/HtmlService. GitHub Pages es solo una página de entrada estática.

## Arquitectura y acceso

- `appscript/`: exactamente `appsscript.json`, `Code.gs` y `Registro.html`. Como en Agenda, el mismo HTML integrado sirve el web app y las ventanas del menú; el frontend llama al backend mediante un RPC `google.script.run` allowlisted. No hay includes ni archivos auxiliares requeridos.
- `index.html`: página estática sin login, secretos ni acceso a Sheets; solo enlaza al deployment estable de Apps Script. Ruta en Pages: `/apps/registro-unico/`.
- `appscript/` se copia a un proyecto abierto desde la propia planilla: así el mismo proyecto queda vinculado y puede publicar el web app y registrar el menú de Sheets.
- Apps Script debe configurarse para ejecutarse como quien accede (`USER_ACCESSING`) y requiere una cuenta Google (`ANYONE`, no acceso anónimo). `USER_DEPLOYING` es otra identidad (quien publicó) y no sirve para este diseño de permisos por usuario. Cada persona autoriza scopes de Sheets e identidad de email en su propia sesión. El backend usa `spreadsheets` para leer/escribir la hoja y gestionar permisos; el scope es amplio: Google lo asocia al acceso a hojas de cálculo del usuario, no únicamente a la hoja central. Revisar este consentimiento antes de publicar.
- La lista privada de perfiles vive en Script Properties. En una hoja nueva, el dueño autenticado queda como admin al tocar explícitamente **Vincular esta planilla**. Roles: `user` y `admin`; los perfiles históricos `user1`/`user2` se reconocen como `user`. El dueño/admin crea un perfil asociado al correo Google, asigna el rol, y la app otorga permiso Editor a esa cuenta mientras el perfil queda pendiente. La gestión de perfiles sigue requiriendo que la cuenta sea dueña de la planilla además de tener rol `admin`. Cuando la persona abre la app con ese mismo correo ve una confirmación; el botón activa el rol que ya le asignó el admin. Una cuenta no invitada no puede registrarse ni elegir su rol. Solo dueño + admin gestiona perfiles.
- Las opciones de menú aparecen para poder ejecutarse desde el disparador simple `onOpen`, que puede no recibir el correo del usuario. Eso no concede permisos: **Administración** y **Vincular** vuelven a validar en servidor que la persona sea dueña (y admin para administración); cualquier otra cuenta recibe acceso denegado. El panel da o quita permiso individual de Editor en Sheets bajo esa identidad. La cuenta admin debe poder compartir la planilla; permisos heredados de grupos/dominio pueden permanecer luego de quitar un permiso individual.

**Límite importante:** usuarios autorizados como editores pueden modificar datos directamente en Google Sheets. El backend valida las operaciones hechas desde la app, pero no puede imponer esas validaciones en los cambios directos. No cargar datos reales hasta decidir quién puede acceder a la hoja y comprobar su configuración de uso compartido.

## Configuración inicial

1. Abrí la planilla autorizada desde la que querés usar Registro Único.
2. En esa planilla, abrí **Extensiones → Apps Script**. Ese proyecto queda vinculado a esa hoja. Copiá exactamente los tres archivos de `appscript/`: `appsscript.json`, `Code.gs` y `Registro.html` (en Apps Script el archivo HTML debe llamarse `Registro`, sin escribir `.html`). Reemplazá el código anterior de `Code.gs` y eliminá los HTML viejos `Index` y `Admin` para que no queden dos versiones de la interfaz. No hay que crear `Domain.gs`, `Styles.html` ni un proyecto companion. No autorices ni publiques desde este repositorio/agente.
3. Guardá el proyecto y publicalo manualmente como Web app: ejecución como usuario que accede y acceso para usuarios con cuenta Google (no anónimo). Verificá esos ajustes en el diálogo del deployment; el manifest no demuestra cómo quedó la implementación activa.
4. Recargá la planilla. El menú **Registro Único** abre el mismo HtmlService integrado que `GET /exec`: **Abrir Registro Único** muestra el CRUD en un diálogo y **Administración** abre la vista de administración en otro diálogo. Las opciones administrativas pueden aparecer a otros usuarios por una limitación de identidad de `onOpen`, pero el servidor las bloquea. En una configuración nueva, solo el dueño puede completar **Vincular esta planilla**; se lo registra como admin y se crean `Registros` y sus encabezados si faltan. `Hoja 1` se conserva. Una hoja incompatible o una ya vinculada distinta no se modifica.
5. Para crear un perfil, el dueño/admin abre Administración, indica el correo Google y elige el rol (`user` o `admin`; `user` es el predeterminado). La app guarda la invitación pendiente y otorga Editor a ese correo. Compartile a la persona el enlace de la landing; debe abrirlo con el mismo Google, revisar el correo y rol mostrados y pulsar **Confirmar acceso y entrar**. La app no manda un correo propio con el enlace. La confirmación habilita el CRUD de la app, pero no es una barrera para la planilla: al crear el perfil se concede Editor, así que la persona también puede abrir y modificar los datos directamente antes de confirmar. Invitá solo al correo correcto. El admin puede cambiar el rol sin activar el perfil, reiniciar una invitación o revocar acceso. La revocación desactiva la app y quita el permiso individual; permisos heredados por grupo/dominio pueden permanecer.
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
