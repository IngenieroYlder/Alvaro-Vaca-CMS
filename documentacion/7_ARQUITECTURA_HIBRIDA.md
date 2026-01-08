# Arquitectura Híbrida del Sistema CMS

Este documento describe la arquitectura de rutas implementada para el Sistema CMS, donde un solo dominio sirve tanto el Panel de Administración (Dashboard) como el Sitio Web Público.

## Diagrama de Flujo

```
Usuario visita: consorciomovitrans.com
          │
          ▼
    ┌─────────────────┐
    │   Nginx (Front) │  <-- Contenedor Frontend
    │   Puerto 80     │
    └────────┬────────┘
             │
     ┌───────┴───────┐
     │               │
     ▼               ▼
/dashboard/*     /* (Root, /nosotros, etc.)
     │               │
     ▼               ▼
┌─────────┐    ┌─────────────┐
│ React   │    │   NestJS    │  <-- Contenedor Backend
│ SPA     │    │   SSR/API   │
└─────────┘    └─────────────┘
```

## Componentes

### Frontend (React + Nginx)
*   **Contenedor:** `frontend`
*   **Puerto:** `80`
*   **Función Principal:** Servir el Dashboard React en `/dashboard` y actuar como "Director de Tráfico" (Reverse Proxy) para todas las demás rutas.
*   **Archivos Clave:**
    *   `nginx.conf` - Configuración del proxy.
    *   `vite.config.ts` - `base: '/dashboard/'` para assets.
    *   `App.tsx` - `<BrowserRouter basename="/dashboard">`.

### Backend (NestJS)
*   **Contenedor:** `backend` (o `cms_movitrans_backend`)
*   **Puerto:** `3000`
*   **Función Principal:**
    1.  **API REST:** Servir endpoints JSON para el Dashboard (`/autenticacion`, `/usuarios`, etc.).
    2.  **SSR (Server-Side Rendering):** Servir páginas HTML del Sitio Público (`/`, `/nosotros`, `/contacto`) usando Handlebars.
*   **Archivos Clave:**
    *   `src/public/public.controller.ts` - Renderiza vistas.
    *   `views/*.hbs` - Plantillas HTML.
    *   `main.ts` - Configuración de `hbs` y `viewsDir`.

## Rutas

| Ruta | Manejador | Descripción |
| :--- | :--- | :--- |
| `/dashboard` | React (Nginx sirve estático) | Panel de Administración |
| `/dashboard/login` | React (Nginx sirve estático) | Login del Dashboard |
| `/` | NestJS (SSR) | Página de Inicio Pública |
| `/nosotros` | NestJS (SSR) | Página "Nosotros" |
| `/contacto` | NestJS (SSR) | Página de Contacto |
| `/autenticacion/*` | NestJS (API) | Endpoints de Login/Token |
| `/usuarios/*` | NestJS (API) | CRUD de Usuarios |
| ... | NestJS (API) | Otros endpoints de API |

## Cómo Agregar Nuevas Páginas Públicas

1.  **Vista:** Crear `backend/views/nueva-pagina.hbs`.
2.  **Controlador:** Agregar un nuevo método `@Get('ruta')` con `@Render('nueva-pagina')` en `PublicController`.
3.  **Datos:** Inyectar datos dinámicos desde `NegocioService` o crear nuevos servicios.
