# Sistema Colombia Pictures CMS

Bienvenido al sistema de gestión de contenido y comercio para Colombia Pictures.

## 📚 Documentación
Toda la documentación detallada se encuentra en la carpeta `documentacion/`:

1.  **[Visión General](./documentacion/1_VISION_GENERAL.md)**
2.  **[Arquitectura Técnica](./documentacion/2_ARQUITECTURA_TECNICA.md)**
3.  **[Módulos Funcionales](./documentacion/3_MODULOS_FUNCIONALES.md)**
4.  **[API Endpoints y Primeros Pasos](./documentacion/4_API_ENDPOINTS.md)** - **¡Empieza aquí!** Contiene credenciales por defecto.
5.  **[Guía de Despliegue en VPS (Docker Manual)](./documentacion/5_DESPLIEGUE_VPS.md)**
6.  **[Guía de Despliegue en Easypanel](./documentacion/6_GUIA_EASYPANEL.md)** - **¡Recomendado!** Guía visual para tu panel.
7.  **[Arquitectura Híbrida (SSR + SPA)](./documentacion/7_ARQUITECTURA_HIBRIDA.md)** - Cómo funciona el Dashboard junto al Sitio Público.

## 🚀 Despliegue Rápido (Docker)
Para generar un respaldo listo para producción:
```powershell
.\crear_respaldo_v0.1.ps1
```

Esto generará un archivo `.tar` listo para cargar en tu VPS.
