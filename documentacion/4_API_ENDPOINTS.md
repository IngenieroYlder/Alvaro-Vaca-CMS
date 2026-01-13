# Documentación de API y Primeros Pasos

## 1. Usuario Inicial (Modo Dios)

El sistema incluye un script de **Seeding Automático** que se ejecuta al iniciar la aplicación (`onModuleInit` en `UsuariosService`).

Si es la primera vez que se inicia la base de datos, el sistema crea automáticamente un usuario con permisos totales:

- **Email**: `admin@admin.com`
- **Contraseña**: `admin123`
- **Roles**: `['admin', 'god']` (Acceso total y Modo Dios)

> **Nota**: Se recomienda cambiar esta contraseña inmediatamente después del primer inicio de sesión.
> Si necesitas regenerarlo manualmente, revisa `backend/src/usuarios/usuarios.service.ts` método `onModuleInit`.

---

## 2. Endpoints Disponibles (API)

La API Base URL es: `/api/v1` (o la configurada en tu entorno).

### 🔐 Autenticación (`/auth`)

- `POST /auth/login`: Iniciar sesión. Requiere `{ email, contrasena }`. Retorna `{ token, usuario }`.
- `GET /auth/perfil`: Obtiene datos del usuario actual (Requiere Token).

### 👥 Usuarios (`/usuarios`)

- `GET /usuarios`: Listar todos los usuarios.
- `GET /usuarios/exportar/excel`: Descargar lista de usuarios en Excel (.xlsx).
- `GET /usuarios/exportar/pdf`: Descargar reporte de usuarios en PDF.
- `GET /usuarios/:id`: Obtener detalles de un usuario.
- `POST /usuarios`: Crear nuevo usuario.
- `PATCH /usuarios/:id`: Actualizar usuario.
- `DELETE /usuarios/:id`: Eliminar usuario.

### 🛡️ Roles y Permisos (`/roles`)

- `GET /roles`: Listar roles y sus iconos.
- `POST /roles`: Crear un rol.
- `PATCH /roles/:id`: Editar rol (nombre, icono, permisos).
- `POST /roles/matriz`: Guardar asignación masiva de permisos.

**Módulos Gestionables**:
El sistema permite configurar el acceso por rol para los siguientes módulos:

- `dashboard` (Tablero)
- `catalogo` (Productos, Categorías, Atributos)
- `medios` (Galería de imágenes y carga de archivos)
- `usuarios` (Gestión de cuentas)
- `roles` (Control de accesos)
- `temas` (Personalización visual)
- `negocio` (Configuración de empresa y webhooks)
- `paginas` (Constructor de contenido dinámico)
- `contactos` (Mensajes recibidos y exportaciones)
- `menus` (Gestión de navegación)

### 🎨 Temas (`/temas`)

- `GET /temas`: Obtener configuración visual actual.
- `POST /temas`: Guardar configuración de colores, tipografía y formas.
- `POST /temas/logo`: Subir logos.

### 🏢 Negocio (`/negocio`)

- `GET /negocio`: Obtener información de contacto y redes sociales.
- `POST /negocio`: Actualizar información del negocio.

### 🛍️ Catálogo (`/catalogo`)

**Productos y Servicios**

- `GET /catalogo/items`: Listar productos y servicios (filtros disponibles).
- `POST /catalogo/item`: Crear producto/servicio.
- `GET /catalogo/item/:id`: Obtener detalle.
- `PATCH /catalogo/item/:id`: Actualizar.
- `DELETE /catalogo/item/:id`: Eliminar.

**Categorías**

- `GET /catalogo/categorias-producto` y `-servicio`: Listar categorías.
- `POST /catalogo/categorias-producto`: Crear categoría.

**Globales**

- `GET /catalogo/atributos`: Listar atributos globales.
- `POST /catalogo/atributos`: Crear atributo global.
- `PATCH /catalogo/atributos/:id`: Renombrar atributo.
- `POST /catalogo/atributos/:id/valores`: Agregar valor a un atributo (ej: "Rojo" a "Color").
- `DELETE /catalogo/valores-atributos/:id`: Eliminar un valor.
- `GET /catalogo/badges`: Listar badges globales.
- `POST /catalogo/badges`: Crear badge.
- `PATCH /catalogo/badges/:id`: Editar badge (color/texto).

- `POST /menus`: Guardar estructura de menús.

### 📰 Noticias (`/api/noticias`)

- `GET /api/noticias`: Listar todas las noticias (público).
- `GET /api/noticias/:id`: Obtener detalle de una noticia.
- `POST /api/noticias`: Crear noticia (Requiere Auth).
- `PUT /api/noticias/:id`: Actualizar noticia (Requiere Auth).
- `DELETE /api/noticias/:id`: Eliminar noticia (Requiere Auth).
- `POST /noticias/comentar/:id`: Comentar en una noticia.

### 💼 Vacantes (`/api/vacantes`)

- `GET /api/vacantes`: Listar todas las vacantes.
- `GET /api/vacantes/:id`: Obtener vacante por ID.
- `POST /api/vacantes`: Crear vacante (Admin).
- `PUT /api/vacantes/:id`: Actualizar vacante (Admin).
- `DELETE /api/vacantes/:id`: Eliminar vacante (Admin).

### Contactos

Módulo para la gestión de mensajes de clientes desde el sitio web.

- **GET `/contactos`**: Lista todos los mensajes recibidos.
  - **Query params**: `tipo` (peticion, queja...), `estado` (sin_responder, abierto, resuelto...), `desde` (YYYY-MM-DD), `hasta` (YYYY-MM-DD).
- **POST `/contactos`**: Crea un nuevo mensaje desde el formulario web.
  - **Cuerpo (JSON)**: `{ "nombre": string, "email": string, "telefono": string, "ciudad": string, "mensaje": string, "tieneWhatsapp": boolean, "otroWhatsapp"?: string }`
  - **Seguridad**: Incluye un campo honeypot `_gotcha` que debe estar vacío.
- **POST `/contactos/:id/estado`**: Actualiza el estado de un PQR.
  - **Cuerpo**: `{ "estado": "sin_responder" | "abierto" | "resuelto" | "no_resuelto" }`
- **GET `/contactos/export/excel`**: Descarga Excel filtrado. Soporta mismos params que GET `/contactos`.
- **GET `/contactos/export/pdf`**: Descarga PDF filtrado. Soporta mismos params que GET `/contactos`.

#### Webhook de Contacto

El sistema permite configurar un Webhook en la sección de Negocio. Cuando se crea un nuevo contacto, se enviará una petición POST a la URL configurada:

- **Header**: `X-Webhook-Token`: El token configurado en el panel.
- **Body**: El objeto JSON del contacto recién creado.

### 🔗 Webhooks Admin (`/webhooks`)

- `POST /webhooks/configurar`: Guardar configuración de webhook (Admin/God).
- `GET /webhooks/configuraciones`: Ver configuración actual (Admin/God).
- `POST /webhooks/test/:evento`: Probar disparo de webhook (Admin/God).

### 🖼️ Medios (`/medios`)

- `POST /medios/upload`: Subir archivos (imágenes).
- `GET /medios/:filename`: Servir archivos estáticos.

### 🎓 Candidatos (`/candidato` y `/postulaciones`)

- `POST /candidato/registro`: Registrar nuevo candidato. **Campos obligatorios**: `nombre`, `email`, `password`, `telefono`, `whatsapp`.
- `POST /candidato/perfil`: Actualizar perfil del candidato actual.
- `POST /candidato/eliminar-cuenta`: **Endpoint Destructivo**. Elimina la cuenta del usuario logueado. Requiere confirmación frontend.

### 📝 Postulaciones

- `POST /postulaciones/aplicar/:vacanteId`: (Auth) Aplicar a una vacante específica.
- `GET /postulaciones/mis-postulaciones`: (Auth) Ver historial de aplicaciones del usuario actual.
- `POST /postulaciones/:id/hoja-de-vida`: (Auth) Subir archivo ZIP de CV. (Redirecciona).
- `GET /postulaciones/:id/descargar-cv`: (Admin) Descargar CV de un candidato.
- `PATCH /postulaciones/:id/estado`: (Admin) Cambiar estado de la postulación (ej. Entrevista).

### 🤝 Reuniones y Asistencias (`/reuniones`)

Módulo para la gestión de actas de asistencia y reuniones de líderes.

- `POST /reuniones`: (Auth: Lider/Admin) Crear una nueva reunión.
  - **Body**: `{ nombre, fecha, liderNombre, liderDocumento, liderTelefono, barrio, municipio?, comuna?, corregimiento? }`
- `POST /reuniones/register`: (Público) Registrar un asistente a una reunión.
  - **Body**: `{ codigoReunion, nombre, documento, telefono, email?, habeasData: true }`
- `GET /reuniones`: (Auth) Listar reuniones.
  - **Query Params**: `leader`, `dateStart` (YYYY-MM-DD), `dateEnd`, `location`.
- `GET /reuniones/unique`: (Auth: Admin/God) Listar asistentes únicos por cédula.
  - **Query Params**: `dateStart`, `dateEnd`.
- `GET /reuniones/:code`: Obtener información básica de una reunión por su código público.
- `GET /reuniones/export/excel`: (Auth: Admin/God) Exportar reporte en Excel.
  - **Query Params**: Mismos filtros que listado + `unique=true` para reporte de únicos.
- `GET /reuniones/export/pdf`: (Auth: Admin/God) Exportar reporte en PDF.
- `DELETE /reuniones/:id`: (Auth: Admin/God) Eliminar una reunión.
- `DELETE /reuniones/bulk`: (Auth: God) Eliminar múltiples reuniones.
  - **Body**: `{ ids: ["uuid1", "uuid2"] }`
