# Motor de Candidatos y Empleos

Este documento describe la arquitectura y funcionalidad del nuevo Motor de Candidatos implementado en la Fase 3 del proyecto.

## 1. Visión General
El sistema permite la gestión completa del ciclo de vida de una vacante, desde su publicación hasta la contratación del candidato. Incluye:
- **Portal Público**: Listado de vacantes y detalle de oferta.
- **Portal del Candidato**: Registro, login y seguimiento de postulaciones.
- **Dashboard Administrativo**: Gestión de vacantes y candidatos.

## 2. Flujo del Candidato
### Registro y Autenticación
- **Ruta**: `/candidato/registro`
- **Requisitos**: Se exigen campos de contacto directo (**Celular** y **WhatsApp**) para garantizar la comunicación ágil con el equipo de reclutamiento.
- **Seguridad**: Autenticación basada en JWT almacenados en Cookies HTTP-Only.
- **Guard**: `LoginCandidatoGuard` protege las rutas y redirige a `/login-candidato` si no hay sesión activa.

### Postulación
1. El candidato ve una vacante en `/vacantes/:slug`.
2. Hace clic en "Postularme Ahora".
3. Si no está logueado, se le pide registro o inicio de sesión.
4. Al completarlo, es redirigido a la vacante para confirmar la postulación (endpoint `/vacantes/:id/aplicar`).
5. La postulación queda en estado `PENDIENTE`.

### Dashboard del Candidato
- **Ruta**: `/candidato`
- **Funcionalidad**: Muestra todas las postulaciones activas y una barra de progreso visual del estado (`Pendiente` -> `En Proceso` -> `Finalista` -> `No Seleccionado`).
- **Autogestión**:
    - **Edición**: Actualización de datos personales y de contacto.
    - **Eliminación**: Opción "Eliminar mi cuenta" disponible en el perfil. Ejecuta un borrado seguro y cascada de datos (elimina usuario y postulaciones).

## 3. Gestión Administrativa (Dashboard)
Desde el panel de administración en React:
1. **Vacantes**: CRUD completo de ofertas laborales.
2. **Candidatos**: Al hacer clic en el ícono de "Usuario" en la tabla de vacantes, se abre un modal.
3. **Gestión de Estado**: El administrador puede cambiar el estado de un candidato (ej. mover a `EN_PROCESO` o `RECHAZADA`).

## 4. Base de Datos
### Entidad `Postulacion`
- Relación `ManyToOne` con `Usuario` (Candidato).
- Relación `ManyToOne` con `Vacante`.
- Campo `estado`: Enum (`PENDIENTE`, `EN_PROCESO`, `FINALISTA`, `RECHAZADA`).
- Campo `pasoActual`: Entero (1-4) para la barra de progreso.

## 5. Endpoints Clave
- `GET /public/vacantes`: Listado público.
- `POST /public/candidato/registro`: Creación de usuario candidato.
- `POST /postulaciones/aplicar/:id`: Crear postulación.
- `GET /postulaciones/vacante/:id`: (Admin) Listar candidatos por vacante.
- `PATCH /postulaciones/:id/estado`: (Admin) Actualizar estado.
