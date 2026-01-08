# Guías de UI/UX y Estándares de Frontend

Este documento establece las "leyes" y reglas de diseño que deben seguirse en el desarrollo del CMS CONSORCIO MOVITRANS.

## 1. Gestión de Medios e Imágenes

### ⚠️ Regla de Oro: No Pedir URLs Manuales
**Nunca** se debe diseñar un formulario que pida al usuario pegar manualmente una URL de imagen (ej. `/uploads/...`).

*   **Razón:** Es propenso a errores, difícil para el usuario final y "enredado".
*   **Solución Obligatoria:** Siempre se debe implementar un **Selector de Medios**.

### Implementación Estándar
Para cualquier campo que requiera una imagen:
1.  Mostrar un `input` de texto en modo `readOnly` (para ver qué hay seleccionado).
2.  Colocar al lado un botón **"Seleccionar"** con icono de Imagen.
3.  Al hacer clic, abrir el Modal de `Medios` en modo selección (`selectionMode={true}`).
4.  Permitir al usuario navegar, subir y seleccionar la imagen visualmente.

**Ejemplo de Código (Paginas.tsx):**
```tsx
<div className="flex gap-2">
    <input 
        readOnly 
        value={form.image} 
        className="..." 
        placeholder="Selecciona una imagen..." 
    />
    <button onClick={() => openMediaSelector('imageField')}>
        <ImageIcon /> Seleccionar
    </button>
</div>
```

---

## 2. Arquitectura & Reutilización

### ♻️ Regla de Oro: DRY (Don't Repeat Yourself)
Antes de escribir un bloque de código UI que se usará en más de un lugar, **cápsulalo en un Componente**.

*   **Partials (Handlebars/Backend):**
    *   **Header y Footer:** DEBEN ser archivos separados (`partials/header.hbs`, `partials/footer.hbs`) e incluidos en cada plantilla.
    *   **Meta Tags:** Usar un partial para el `<head>` común.
    *   **Beneficio:** Si cambias el logo o un link del menú, se actualiza en todo el sitio automáticamente.

*   **Componentes (React/Frontend):**
    *   Si un botón, tarjeta o input tiene más de 10 líneas de estilos, crea un componente (ej. `<BotonPrimario />`, `<TarjetaMedio />`).

---

## 3. Feedback al Usuario

### 📢 Regla de Oro: Que el Usuario Nunca se Pregunte "¿Qué pasó?"
*   **Cargas:** Mostrar siempre `spinners` o estados de loading.
    *   *Mal:* Clic en Guardar -> Nada pasa por 2 segundos.
    *   *Bien:* Clic en Guardar -> Botón se deshabilita y dice "Guardando...".
*   **Errores:** Usar alertas claras o `toasts` que expliquen el problema (no "Error 500", sino "No pudimos guardar los cambios, intenta de nuevo").
*   **Confirmaciones:**
    *   **Estándar:** Pedir confirmación simple (`confirm()`) para acciones reversibles.
    *   **Crítico (Safe Delete):** Para acciones irreversibles (ej. eliminar usuarios), USAR `SafeDeleteModal`. Requiere que el usuario escriba una palabra clave (ej. "BORRAR") y marque un checkbox.

---

## 4. Estados Vacíos (Empty States)

### 🏜️ Regla de Oro: El Vacío no debe ser Triste
Cuando una lista no tenga datos (ej. Carpeta vacía, sin usuarios), no muestres una tabla en blanco.
*   **Mostrar:** Un icono grande (usar `lucide-react` con opacidad baja), un texto explicativo ("No hay archivos aquí aún") y preferiblemente **el botón de acción principal** ("Subir Archivo").
*   **Ejemplo:** Ver implementación en `Medios.tsx`.

---

## 5. Diseño Responsivo (Mobile First)
*   **Regla:** Todo el CMS debe ser operable desde un celular.
*   **Verificación:** Antes de dar por terminada una tarea, reducir la ventana del navegador al ancho de un móvil (375px) y verificar que no haya scroll horizontal roto ni botones inalcanzables.
75: 
76: ---
77: 
78: ## 6. 🌕 Regla de Oro: Botones Estándar (Pill Shape)
79: 
80: Todos los botones de acción principal y secundaria en el sitio web público **DEBEN** seguir el estilo "Pill" (completamente redondeado - `rounded-full`). 
81: 
82: *   **Prioridad:** Forma y Animación sobre Color.
83: *   **Prohibición:** No se permiten botones con esquinas cuadradas o levemente redondeadas (como `rounded-md` o `rounded-xl`).
84: 
85: ### Especificaciones de Diseño
86: 1.  **Forma:** Siempre usar `border-radius: 9999px` (Tailwind: `rounded-full`).
87: 2.  **Sombra:** Deben tener una sombra suave (`btn-shadow`) que combine con el color de fondo.
88: 3.  **Animación:** Deben reaccionar al hover con una leve elevación (`translate-y-[-2px]`) y cambio de escala o brillo.
89: 4.  **Tipografía:** Fuente en negrita (`font-bold`) y centrado perfecto.
90: 
91: ### Clases CSS Base (Disponibles vía partial `styles.hbs`)
92: *   `.btn-pill`: Clase base que aplica el redondeo `9999px`, transiciones y alineación flex. **Obligatoria**.
93: *   `.btn-xl`, `.btn-lg`, `.btn-md`: Clases para manejar alturas y espaciados estandarizados.
94: 
95: ### Ejemplo de Uso Correcto (Colores Flexibles)
96: ```html
97: <!-- Botón Hero (Color Naranja/Terciario) -->
98: <a href="/servicios" class="btn-pill btn-xl bg-tertiary text-white">
99:     Nuestros Servicios
100: </a>
101: 
102: <!-- Botón Header (Color Azul/Primario) -->
103: <a href="/login" class="btn-pill btn-md bg-primary text-white">
104:     Portal Clientes
105: </a>
106: ```
107: 
108: **⚠️ Nota:** Esta regla asegura una identidad visual moderna y consistente en la forma, permitiendo que cada sección mantenga sus acentos de color originales.

---

## 7. Estándares de Tipografía (Typography)

Para garantizar consistencia visual y jerarquía clara en todo el sitio, se deben seguir estrictamente las siguientes escalas de tamaño para encabezados.

### H1 - Título Hero (Principal)
Exclusivo para el título principal de la página (Hero Section). Debe usarse una sola vez por página.
*   **Clases Tailwind:** `text-4xl sm:text-5xl md:text-6xl lg:text-7xl`
*   **Estilo:** `font-black`, `tracking-tight` o `tracking-tighter`.
*   **Color:** Solid White (sobre fondos oscuros) o `text-primary` (sobre fondos claros). **No usar gradientes en H1s.**

### H2 - Títulos de Sección
Usado para los títulos de secciones principales (ej. "Nuestros Servicios", "Preguntas Frecuentes").
*   **Clases Tailwind:** `text-3xl md:text-5xl`
*   **Estilo:** `font-black`, `tracking-tight`.
*   **Color:** `text-primary`. Puede incluir palabras destacadas con gradiente (`bg-gradient-to-r`).

### H3 - Títulos de Tarjetas o Subsecciones
Usado para títulos dentro de tarjetas (ej. Nombre del servicio) o divisiones menores.
*   **Clases Tailwind:** `text-2xl md:text-3xl`
*   **Estilo:** `font-bold`.

