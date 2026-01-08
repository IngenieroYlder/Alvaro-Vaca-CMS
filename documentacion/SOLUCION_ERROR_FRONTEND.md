# Guia de Solución de Problemas: "Frontend folder not found" en Easypanel

Si Easypanel reporta que "no existe la carpeta frontend" (o similar) a pesar de que el repositorio es público, sigue esta lista de verificación.

## 1. Verificar Nombre del Repositorio
Asegúrate de que estás usando EXACTAMENTE el nombre correcto del repositorio, respetando mayúsculas y minúsculas:
*   **Correcto:** `IngenieroYlder/Patios`
*   **Incorrecto:** `IngenieroyIder/Patios` (La 'y' minúscula es un error común)

## 2. Verificar Ruta (Sin Barra Inicial) - ¡CRÍTICO!
Docker y Easypanel son muy sensibles a cómo escribes la ruta de la carpeta.
*   ❌ **Mal:** `/frontend` (La barra al inicio hace que busque en la raíz del sistema linux, no del repo).
*   ✅ **Bien:** `frontend` (Sin barra, busca dentro del repositorio descargado).

**Acción:** Ve a la configuración de tu servicio, pestaña **Build / Source**, y borra la barra `/` del inicio en el campo "Root Directory".

## 3. Limpiar Caché o Re-crear Servicio
A veces Easypanel guarda una configuración "rota" intentando clonar una ruta que falló antes.
1.  Elimina el servicio de frontend actual que da error.
2.  Crea uno nuevo desde cero ("App").
3.  Configúralo directamente con:
    *   Repo: `IngenieroYlder/Patios`
    *   Root Directory: `frontend`
    *   Dockerfile Path: `Dockerfile`

## 4. Verificar Contenido del Repo
Entra a tu GitHub (`https://github.com/IngenieroYlder/Patios`) y asegúrate de ver la carpeta `frontend` allí.

Si al entrar a `frontend` ves el archivo `Dockerfile`, todo está correcto en el código. El error es 100% de configuración en Easypanel (Puntos 1 o 2).

---

# 📘 Manual de Usuario: Panel de Control (Dashboard)

Este manual detalla las funciones, rutas y permisos del panel administrativo.

## 🔑 Acceso y Autenticación
*   **URL de Acceso**: `/dashboard/login`
*   **Proceso**: Ingresa tu correo corporativo y contraseña asignada por el administrador central.

---

## 🗺️ Mapa de Navegación (Rutas)

Todas las rutas operan bajo el prefijo `/dashboard`.

| Módulo | Ruta | Función Principal |
| :--- | :--- | :--- |
| **Tablero** | `/` | Vista de bienvenida y resumen de actividad. |
| **Contactos (PQRs)** | `/contactos` | Gestión de Peticiones, Quejas, Reclamos y Consultas. |
| **Vacantes** | `/vacantes` | Publicación de empleo y gestión de candidatos/postulaciones. |
| **Noticias** | `/noticias` | Blog corporativo y publicación de novedades. |
| **Páginas** | `/paginas` | Edición de contenidos estáticos (Nosotros, etc.). |
| **Medios** | `/medios` | Galería de imágenes y archivos del sitio. |
| **Usuarios** | `/usuarios` | Gestión de acceso del equipo de trabajo. |
| **Roles** | `/roles` | Definición de permisos por nivel de usuario. |
| **Temas** | `/temas` | Personalización visual (Logo, colores primarios). |
| **Negocio** | `/negocio` | Datos corporativos (Dirección, NIT, Redes Sociales). |
| **Menús** | `/menus` | Organización de la barra de navegación pública. |

---

## 👥 Manual por Roles Requeridos

### 1. Rol: Administrador (Gestión Total)
Es el encargado de la integridad del sistema. Tiene acceso a **todos** los módulos mencionados anteriormente.
*   **Responsabilidades**:
    *   Crear y dar de baja usuarios del sistema.
    *   Configurar los permisos de los demás roles.
    *   Actualizar el diseño visual (Colores/Logo) en el móludo **Temas**.
    *   Gestionar la estructura del menú principal.

### 2. Rol: Reclutador (Gestión de Talento)
Enfocado exclusivamente en la captación de personal.
*   **Módulos clave**: `Vacantes`, `Catálogo`.
*   **Funciones**:
    *   Publicar ofertas de empleo con requisitos y salarios.
    *   Ver la lista de candidatos que aplicaron a cada vacante.
    *   **Descargar Hoja de Vida**: Acceder al archivo comprimido del candidato.
    *   **Cambiar Estados**: Mover candidatos por el flujo (Pendiente -> Entrevista -> Seleccionado).

### 3. Rol: Editor de Noticias (Comunicación)
Encargado de mantener el sitio actualizado con contenido relevante.
*   **Módulos clave**: `Noticias`, `Medios`.
*   **Funciones**:
    *   Redactar y publicar artículos de noticias.
    *   Categorizar el contenido (Ej: Comunicados, Eventos).
    *   Subir imágenes a la biblioteca de **Medios** para ilustrar las notas.

### 4. Rol: Contestador de PQRs (Atención al Usuario)
Encargado de la comunicación directa con ciudadanos/clientes.
*   **Módulos clave**: `Contactos`.
*   **Funciones**:
    *   Revisar los PQRs entrantes desde el portal público.
    *   Filtrar por tipo (Petición, Queja, Reclamo) o por fecha (Semana, Mes, Año).
    *   **Lectura Completa**: Usar el modal maximizable para leer mensajes extensos.
    *   **Exportación**: Generar reportes en Excel/PDF para enviar a gerencia.

---

## 🛡️ Notas de Seguridad
*   **God Mode**: El rol de "Super Admin" (God) está reservado para configuraciones estructurales profundas y personal de TI. Los usuarios estándar no deben poseer este rol.
*   **Borrado Seguro**: Para eliminar usuarios o contenido crítico, el sistema solicitará escribir la palabra "**BORRAR**" para confirmar la acción.
