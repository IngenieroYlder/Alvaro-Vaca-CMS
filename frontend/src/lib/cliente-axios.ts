import axios from 'axios';

const clienteAxios = axios.create({
    baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3000'),
});

// Interceptor para agregar el token a cada petición
clienteAxios.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor para debugging de errores (y posible manejo de 401)
clienteAxios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.warn('[AXIOS DEBUG] 401 Unauthorized detectado en:', error.config.url);
            // Si el token expiró o es inválido, forzamos logout para evitar estados inconsistentes
            localStorage.removeItem('token');
            // Redirigir al login si no estamos ya allí
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/dashboard/login';
            }
        }
        return Promise.reject(error);
    }
);

export default clienteAxios;
