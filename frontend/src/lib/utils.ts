/**
 * Resuelve la URL de un activo (imagen, archivo) para asegurar que funcione
 * correctamente tanto en el entorno de desarrollo como en producción,
 * especialmente cuando la app corre bajo un sub-path como /dashboard.
 * 
 * Ejemplo: 'uploads/logo.png' -> '/uploads/logo.png'
 */
export const resolveAssetUrl = (url: string | undefined | null): string => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;

    // En Producción (PROD=true), ignoramos la variable de entorno para evitar problemas 
    // con builds de Docker mal configurados. Usamos rutas relativas que Nginx manejará.
    // En Desarrollo, usamos localhost:3000 (o lo que diga el .env).
    const isProd = import.meta.env.PROD;
    const apiUrl = isProd ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3000');

    // Asegurar que la URL relativa empiece sin slash para concatenar bien, 
    // o manejar la lógica de slash inicial correctamente.
    // Si apiUrl es vacio, queremos que el resultado empiece con / (ej: /uploads/img.png)
    // Si apiUrl tiene valor, queremos concatenar (ej: http://localhost:3000/uploads/img.png)

    const cleanUrl = url.startsWith('/') ? url.slice(1) : url;

    if (!apiUrl) {
        return `/${cleanUrl}`;
    }

    return `${apiUrl}/${cleanUrl}`;
};
