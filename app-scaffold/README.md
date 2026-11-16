# App nueva — plantilla inicial

Plantilla funcional del circuito inicial de acceso, sin definir el producto de negocio. Parte de la referencia visual de MGD con tratamiento propio, mobile-first, y mantiene el login de desarrollo completamente local/mock.

## Qué funciona

- Ingresar a la demo con usuario `demo` y contraseña `demo123` (ficticios, únicamente para pruebas locales).
- Validación de campos vacíos, error de credenciales, estado de carga, mostrar/ocultar contraseña, sesión de demo en `sessionStorage` y cierre de sesión.
- Pantalla interna vacía que deja claro que no hay tareas, datos ni sincronización configurados.
- Backend Apps Script separado: login sobre `Usuarios(usuario,pass,rol,...)`, token temporal y `whoami`/`logout`; el frontend no se conecta al endpoint.
- Menú Apps Script con reparación no destructiva y reset total separado, destructivo e irreversible, con confirmación y contraseña admin temporal de un solo mostrado.
- Esquema limitado a `Registros`, `Config`, `Usuarios` y `Disponibilidad docente`; ver `apps-script/README.md` para el contrato y el procedimiento manual.

La demo frontend no es autenticación segura ni debe usarse en producción: la cuenta está en el código cliente. El login Apps Script también usa texto plano por decisión aceptada para el producto, y exige limitar la edición del Sheet a personas de confianza. Apps Script y Pages se despliegan por separado; el despliegue de Apps Script lo hará el propietario.

## Límites pendientes de producto

No se agregaron nombre de producto, entidades, roles reales, permisos, flujos de negocio, datos sintéticos de dominio ni sincronización. El login mock prueba solo el circuito básico; la integración entre el frontend y Apps Script y el botón futuro “Sync todo” se harán después de acordar esos contratos.

## Verificación local

Con Bun instalado, desde esta carpeta:

```sh
bun test
```

Las suites Bun cubren contratos de HTML/CSS/config, login demo, esquema, reparación/reset y login/sesión/logout GAS con servicios simulados. No sustituyen QA en navegador ni ejecutan reset o despliegan GAS contra Sheets reales.
