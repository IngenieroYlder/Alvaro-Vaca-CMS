# Variables de Plantilla (Handlebars)

Este documento detalla todas las variables disponibles para usar en la plantilla `inicio.hbs` (y otras vistas dinámicas) que se renderizan desde el backend.

## Variables Globales del Negocio y Tema
Estas variables están disponibles en casi todas las vistas públicas, cargadas desde la configuración del negocio y tema.

| Variable | Descripción | Ejemplo de Uso |
| :--- | :--- | :--- |
| `{{empresaNombre}}` | Nombre de la empresa configurado en el Dashboard > Negocio. | `{{empresaNombre}}` |
| `{{empresaSlogan}}` | Slogan de la empresa. | `{{empresaSlogan}}` |
| `{{telefono}}` | Teléfono de contacto. | `<a href="tel:{{telefono}}">{{telefono}}</a>` |
| `{{email}}` | Correo electrónico de contacto. | `{{email}}` |
| `{{direccion}}` | Dirección física de la empresa. | `{{direccion}}` |
| `{{horarioAtencion}}` | Horario de atención al público. | `{{horarioAtencion}}` |
| `{{numeroContrato}}` | Número de contrato (mostrado en footer/legal). | `{{numeroContrato}}` |
| `{{tarifasImage}}` | URL de la imagen de tarifas (si está configurada). | `<img src="{{tarifasImage}}">` |
| `{{anio}}` | Año actual (generado automáticamente). | `© {{anio}} Todos los derechos reservados.` |
| `{{logoUrl}}` | URL del logo (automáticamente selecciona horizontal/vertical o blanco según contexto). | `<img src="{{logoUrl}}" alt="Logo">` |
| `{{faviconUrl}}` | URL del favicon. | `<link rel="icon" href="{{faviconUrl}}">` |
| `{{theme.primaryColor}}` | Color Primario del tema. | `text-[{{theme.primaryColor}}]` |
| `{{theme.secondaryColor}}` | Color Secundario del tema. | `bg-[{{theme.secondaryColor}}]` |
| `{{theme.tertiaryColor}}` | Color Terciario del tema. | `border-[{{theme.tertiaryColor}}]` |

## Variables Dinámicas de Página (Objeto `meta`)
Estas variables provienen específicamente del editor "Inicio" en el Dashboard > Páginas. Accedes a ellas usando el prefijo `meta.`.

### Sección Hero (Principal)
| Variable | Descripción |
| :--- | :--- |
| `{{meta.heroTitle}}` | Título principal grande. Soporta HTML básico (ej. `<span class="text-secondary">...</span>`). |
| `{{meta.heroSubtitle}}` | Subtítulo o descripción debajo del título principal. |
| `{{meta.heroLabel}}` | Pequeña etiqueta superior (ej. "Operaciones 24/7"). |

### Sección SST (Seguridad)
| Variable | Descripción |
| :--- | :--- |
| `{{meta.sstDescription}}` | Descripción principal del bloque de Seguridad y Salud en el Trabajo. |

### Sección Contacto
| Variable | Descripción |
| :--- | :--- |
| `{{meta.contactDescription}}` | Texto introductorio en la sección de contacto. |

### Sección Nosotros
| Variable | Descripción |
| :--- | :--- |
| `{{meta.misionTitle}}` | Título para la sección de Misión (Defecto: "Nuestra Misión"). |
| `{{meta.misionText}}` | Texto del párrafo de la Misión. |
| `{{meta.visionTitle}}` | Título para la sección de Visión (Defecto: "Nuestra Visión"). |
| `{{meta.visionText}}` | Texto del párrafo de la Visión. |
| `{{meta.values}}` | Array de objetos para los valores corporativos (Icono, Título, Descripción). |

### Sección FAQs (Preguntas Frecuentes)
Las FAQs son una lista (array). Debes iterar sobre ellas usando `{{#each meta.faqs}}`.

**Estructura de cada ítem FAQ:**
*   `{{this.question}}`: La pregunta.
*   `{{this.answer}}`: La respuesta (soporta HTML básico).
*   `{{this.icon}}`: Nombre del icono de Material Symbols (ej. 'help', 'info').

**Ejemplo de iteración:**
```hbs
{{#if meta.faqs}}
  {{#each meta.faqs}}
    <div class="faq-item">
      <h3><span class="material-symbols-outlined">{{this.icon}}</span> {{this.question}}</h3>
      <div>{{{this.answer}}}</div>
    </div>
  {{/each}}
{{else}}
  <p>No hay preguntas configuradas.</p>
{{/if}}
```

## Redes Sociales (Objeto `social`)
63: Las URLs de redes sociales se cargan desde el Dashboard > Negocio y se agrupan en un objeto.
64: 
65: | Variable | Red Social |
66: | :--- | :--- |
67: | `{{social.facebook}}` | Perfil de Facebook. |
68: | `{{social.instagram}}` | Perfil de Instagram. |
69: | `{{social.twitter}}` | Perfil de X (Twitter). |
70: | `{{social.tiktok}}` | Perfil de TikTok. |
71: | `{{social.linkedin}}` | Perfil de LinkedIn. |
72: | `{{social.youtube}}` | Perfil de YouTube. |
73: 
74: **Ejemplo de uso condicional:**
75: ```hbs
76: {{#if social.facebook}}
77:   <a href="{{social.facebook}}">Siguenos en Facebook</a>
78: {{/if}}
79: ```
80: 
81: ## Notas Adicionales
*   **HTML Seguro**: Las variables se escapan por defecto. Si necesitas renderizar HTML (como en `heroTitle` o `answer`), usa la triple llave: `{{{meta.heroTitle}}}`.
*   **Condicionales**: Usa `{{#if variable}}...{{else}}...{{/if}}` para mostrar contenido alternativo si un campo está vacío en el dashboard.

## Variables de Vacantes (Listado y Detalle)
Estas variables están disponibles en las vistas `vacantes.hbs` y `vacante-detalle.hbs`.

### Objeto `vacante` (Detalle)
| Variable | Descripción |
| :--- | :--- |
| `{{vacante.titulo}}` | Título del cargo. |
| `{{vacante.imagen}}` | URL de la imagen destacada. |
| `{{vacante.ubicacion}}` | Ubicación del puesto (Ej. Bogotá). |
| `{{vacante.salario}}` | Salario ofertado. |
| `{{vacante.tipoContrato}}` | Tipo de contrato (Tiempo Completo, Prestación de Servicios, etc.). |
| `{{vacante.descripcion}}` | Descripción completa en HTML. |
| `{{vacante.fechaCierre}}` | Fecha límite para postularse. |
| `{{vacante.categoria.nombre}}` | Nombre de la categoría asociada. |
| `{{vacante.requisitos}}` | Array de requisitos (strings). |
| `{{vacante.pasos}}` | Array de objetos con `titulo` y `descripcion` de los pasos de postulación. |

### Objeto `vacantes` (Listado)
Es un array sobre el que se itera con `{{#each vacantes}}`. Cada ítem tiene las mismas propiedades que el objeto `vacante` arriba descrito.
