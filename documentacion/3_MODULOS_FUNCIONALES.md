# Módulos Funcionales y Características

Este documento detalla las funcionalidades implementadas hasta la fecha.

## 1. Módulo de Autenticación y Login
*   **Pantalla de Login Dinámica**:
    *   La pantalla de inicio de sesión se adapta a la marca configurada en el sistema.
    *   **Lógica de Logos**: Prioriza `Logo Horizontal` > `Logo Vertical` > `Logo Negro`. Si ninguno existe, muestra un logo por defecto de "Colombia Pictures".
    *   Muestra información de créditos en el pie de página.
*   **Seguridad**:
    *   Autenticación vía Token Bearer (JWT).
    *   Protección contra accesos no autorizados a rutas internas.

## 2. Gestión de Usuarios (`/usuarios`)
- **Módulo de Noticias**: Gestión de artículos, categorías y comentarios.
- **Módulo de Vacantes y Candidatos**: Motor de empleo completo con portal de candidatos y gestión de procesos de selección (Ver [`9_CANDIDATE_ENGINE.md`](./9_CANDIDATE_ENGINE.md)).
    - **Mejoras en Registro**: Campos obligatorios de **Celular** y **WhatsApp** para mejorar el contacto.
    - **Autogestión**: Los candidatos pueden editar su perfil y eliminar su cuenta de forma autónoma con seguridad reforzada.

*   **Listado**: Tabla con búsqueda por nombre o email. Muestra avatares generados por iniciales.
*   **Creación/Edición**:
    *   Modal para gestionar datos personales (Nombre, Email).
    *   Gestión de Contraseñas (opcional al editar).
    *   Control de Estado (Activo/Inactivo).
    *   **Eliminación Segura**:
        *   Implementación de un sistema "Hard Delete" protegido.
        *   Requiere confirmación explícita escribiendo la palabra clave "BORRAR" y marcando una casilla de advertencia.
    *   **Exportación de Datos**:
        *   **Excel (.xlsx)**: Exporta el listado completo de usuarios (excluyendo usuarios Modo Dios) con todos sus metadatos.
        *   **PDF**: Genera un reporte imprimible con los usuarios registrados.
    *   **Asignación de Roles**:
        *   Desplegable dinámico que lee los roles existentes en el sistema.
        *   **Modo Dios (God Mode)**: Opción exclusiva visible solo para Administradores o Superusuarios. Al asignar este rol, el usuario recibe privilegios absolutos (`['god', 'admin']`) y se visualiza con una corona dorada 👑.

## 3. Roles y Permisos (`/roles`)
Sistema centralizado para definir qué puede hacer cada tipo de usuario.
*   **Creación de Roles**: Permite crear nuevos roles con nombres personalizados (ej: "Auditor", "Editor").
*   **Personalización de Iconos**:
    *   Al crear o editar un rol, se puede seleccionar un icono representativo (Escudo, Estrella, Maletín, Corona, etc.).
    *   Edición rápida haciendo clic en el icono del rol en la tabla.
*   **Matriz de Permisos**:
    *   Tabla visual donde las filas son los módulos (Tablero, Catálogo, Usuarios, etc.) y las columnas son los Roles.
    *   Casillas de verificación centradas para otorgar/revocar acceso.
    *   **Regla de Seguridad**: El rol `admin` no tiene acceso total automático; debe tener los permisos marcados explícitamente (salvo que también sea `god`).

## 4. Editor de Temas y SEO (`/temas`)
Panel para controlar la identidad visual y metadatos del sitio sin tocar código.
*   **Identidad Visual**:
    *   **Colores**: Selectores para color Primario, Secundario, Terciario, Base y Acento.
    *   **Tipografía**: Selección de fuentes para Títulos y Cuerpo.
    *   **Geometría**: Control de redondeo de bordes (border-radius) y escala de espaciado.
*   **Branding**:
    *   **Logos**: Gestión de logo vertical, horizontal, blanco y negro.
    *   **Favicon dinámico**: Carga dinámica con prioridad (Favicon Personalizado > Logo Vertical > Logo Horizontal).
    *   **SEO**: Título y descripción configurables.
*   **Aplicación**: Los cambios se reflejan inmediatamente en toda la aplicación (incluyendo Login) gracias al `ThemeManager`.

## 5. Información del Negocio (`/negocio`)
Centraliza la información de contacto y presencia digital de la empresa para uso global en el frontend.
*   **Datos de Contacto**: Dirección, Teléfono, Email, URL de contacto.
*   **Redes Sociales**: Gestión de enlaces para Instagram, Facebook, X (Twitter), TikTok, Pinterest, YouTube, LinkedIn.
*   **Uso**: Estos datos alimentan automáticamente el pie de página (footer) y la página de contacto.

## 6. Gestor de Páginas (`/paginas`)
Sistema CMS ligero para administrar el contenido y visibilidad de las páginas del sitio.
*   **Creación y Edición**:
    *   Definición de Título y Slug (URL amigable).
    *   Editor de contenido (Texto/HTML).
*   **Control de Visibilidad**: Toggle para hacer pública o privada una página.
*   **Listado**: Vista general de todas las páginas creadas.

## 7. Gestor de Menús (`/menus`)
Herramienta flexible para organizar la navegación del sitio.
*   **Múltiples Menús**: Capacidad para crear distintos menús (ej: "Menú Principal - Visitante", "Menú Principal - Usuario", "Footer").
*   **Elementos Personalizables**:
    *   Enlaces a páginas internas (seleccionables del módulo de Páginas).
    *   Enlaces personalizados (URL externa o interna específica).
    *   Etiquetas personalizadas y soporte para iconos.
    *   Opción para abrir en nueva pestaña (`target="_blank"`).
*   **Jerarquía**: Soporte para submenús (items anidados).
*   **Ordenamiento**: Control del orden de aparición de los elementos.

## 8. Módulo de Catálogo y Comercio (`/catalogo`)
Sistema avanzado para la gestión de productos y servicios con soporte tipo e-commerce.

*   **Gestión de Productos y Servicios**:
    *   **Tipos de Producto**: Soporte para productos Simples, Variables (con atributos), Kits (paquetes de productos) y Virtuales.
    *   **Precios**: Manejo de precio normal y precio rebajado (oferta).
    *   **Inventario**: Control de stock y SKU.
*   **Atributos y Variaciones Globales**:
    *   **Gestión Centralizada**: Panel dedicado para crear atributos globales (ej: "Color", "Talla") y sus valores predefinidos (ej: "Rojo", "Azul", "S", "M").
    *   **Flexibilidad**: Al editar un producto, se pueden usar los valores globales o ingresar valores personalizados al vuelo.
*   **Badges (Etiquetas) Globales**:
    *   Sistema visual para crear etiquetas reutilizables (ej: "Nuevo", "Agotado", "Oferta").
    *   Personalización completa de colores (fondo y texto) desde la interfaz.
*   **Categorización**:
    *   Entidades separadas para `Categorías de Producto` y `Categorías de Servicio` para una mejor organización.
*   **Kits / Bundles**:
    *   Funcionalidad para agrupar múltiples productos existentes en un solo "Kit" con precio especial.

---
*Nota: Esta documentación debe actualizarse cada vez que se agregue una nueva funcionalidad mayor.*
