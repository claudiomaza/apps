# Registro de notas

Interfaz estática publicada en GitHub Pages: [Registro de notas](https://claudiomaza.github.io/apps/notas/). El nuevo libro académico es una Google Sheet vacía con pestañas `Registros`, `Config`, `Usuarios` e `Instrucciones`:

- [Abrir la nueva planilla Registro de notas — Libro académico](https://docs.google.com/spreadsheets/d/1d9yL3ZhjdQIxRQEFVXltRA_QtjIZc6UrcO_1NyT1oA4/edit)
- El backend normalizado para pegar en Apps Script está en [`../gas/notas/Registro-de-notas-Backend.md`](../gas/notas/Registro-de-notas-Backend.md). El `Code.gs` copiable también está en [`../gas/notas/GradebookBackend.gs`](../gas/notas/GradebookBackend.gs).
- **Pendiente antes de sincronizar:** crear/desplegar la Web App de Apps Script y pegar su URL `/exec` en `apps/notas/config.js`. Este archivo se deja intencionalmente vacío para no seguir usando el endpoint legado que escribe al Sheet anterior.

## Modelo de datos

`Registros` usa ocho columnas estables (`recordId`, `type`, `entityId`, `dataJson`, `version`, `status`, `updatedAt`, `createdAt`) y una fila por escuela, materia, curso/año, división, subgrupo, estudiante, pertenencia, corte, escala, instancia o calificación. No se agregan columnas por evaluación. Un ID identifica una ficha de estudiante; las pertenencias a varios grupos/materias son registros distintos. La libreta ancha se genera dinámicamente en frontend.

- Escalas numéricas y cualitativas configurables con equivalencias por intervalo; las categorías cualitativas se convierten usando el punto medio.
- Una nota por estudiante e instancia; fechas particulares y observaciones por calificación.
- Pesos por materia/corte totalizan 100%; el remanente se redistribuye entre instancias no fijadas y existe la acción `Repartir por igual`.
- Ausente/No entregó cuentan cero; Pendiente/Eximido se excluyen y se renormaliza el promedio ponderado.

## Edición offline y sincronización

La interfaz mantiene borradores en IndexedDB. Crear, editar roster, instancia o calificación persiste localmente; la pestaña puede cerrarse y el mismo navegador conserva el borrador. **Solo el botón `Guardar en Sheets` envía los registros pendientes en lotes de hasta 100.** El backend valida ID/tipo/contenido y control optimista de versión; devuelve conflictos para resolver entre el valor del Sheet y el borrador local. Si hay timeout, no se reintenta a ciegas: actualizar primero para comprobar la versión. IndexedDB es almacenamiento de este dispositivo, no un respaldo ni una copia compartida hasta que Sheets confirme el guardado.

La importación lee el formato normalizado en la pestaña `Registros`, valida y previsualiza altas/cambios/conflictos, permite corregir DatosJSON por fila y aplicar cambios al borrador; no escribe en Sheet hasta pulsar Guardar. La pestaña `Libreta` del XLSX es solo una vista generada y no se importa como esquema canónico. La exportación incluye también una pestaña `Instrucciones`.

## Seguridad

**No cargar datos reales de estudiantes todavía.** La aplicación no implementa autorización por docente, materia, escuela o curso. La sesión actual es de acceso global al libro. Se creó un Sheet nuevo vacío; no se migraron estudiantes. Restringí sus permisos a usuarios autorizados. `Usuarios!pass` queda en texto plano y la hoja debe permanecer limitada al administrador.

## Despliegue manual Apps Script

1. Abrí el Sheet y elegí Extensiones → Apps Script.
2. Pegá `GradebookBackend.gs` completo en `Code.gs` (o copiá el bloque entero del manual Markdown).
3. Guardá, revisá el permiso de Sheets y probá `/exec` respondiendo `service: gradebook-normalized`.
4. Desplegar → Nueva implementación → Aplicación web. Elegí ejecutar como propietario; restringí acceso a tu cuenta/equipo. No publicar como “cualquiera”.
5. Pegá la URL `/exec` en `config.js`, commit/push y espera despliegue Pages. La URL Apps Script es configuración pública del frontend, nunca poner credenciales ahí.

La hoja ya está creada/preparada, pero el backend **no está desplegado**: requiere ejecución desde tu proyecto de Apps Script con autorización del propietario. Hasta eso, la interfaz opera solo como borrador IndexedDB.

## QA

Los tests funcionales deben usar datos sintéticos y un backend/fixture aislado. No se deben crear registros en el Sheet compartido de notas durante QA. Revisar Pages en 390×844 y desktop con el navegador visual disponible; no declarar QA visual PASS por checks estáticos o HTTP solamente.
