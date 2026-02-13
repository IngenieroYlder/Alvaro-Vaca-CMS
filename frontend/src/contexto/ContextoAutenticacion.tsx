import { createContext, useState, useEffect, useContext } from 'react';
import type { ReactNode } from 'react';
import clienteAxios from '../lib/cliente-axios';
import { jwtDecode } from 'jwt-decode';

interface Usuario {
    id: string;
    email: string;
    roles: string[];
    permisos?: string[]; // Added
    nombre: string;
    apellido: string;
    fotoPerfil?: string;
    documento?: string;
    telefono?: string;
}

interface AuthContextType {
    usuario: Usuario | null;
    token: string | null;
    cargando: boolean;
    iniciarSesion: (email: string, contrasena: string) => Promise<void>;
    cerrarSesion: () => void;
    // Permitir recargar manualmente (ej: después de editar perfil)
    recargarUsuario: () => Promise<void>;
    actualizarUsuario: (usuario: Usuario) => void;
    esAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [cargando, setCargando] = useState(true);

    const actualizarUsuario = (nuevoUsuario: Usuario) => {
        setUsuario(prev => ({ ...prev, ...nuevoUsuario }));
    };

    const recargarUsuario = async () => {
        const currentToken = localStorage.getItem('token');
        if (!currentToken) {
            setUsuario(null);
            setToken(null);
            setCargando(false);
            return;
        }

        setToken(currentToken);
        try {
            const decoded: any = jwtDecode(currentToken);

            // Función auxiliar para asegurar que sea array y normalizar
            const toArray = (val: any) => {
                let arr: any[] = [];
                if (Array.isArray(val)) arr = val;
                else if (typeof val === 'string') arr = [val];
                return arr.map(item => String(item).toLowerCase().trim());
            };

            // 1. Configurar información básica del token inmediatamente para velocidad
            const usuarioBasico: Usuario = {
                id: decoded.sub,
                email: decoded.email,
                roles: toArray(decoded.roles),
                permisos: toArray(decoded.permisos), // Extraer permisos
                nombre: decoded.nombre || 'Usuario',
                apellido: decoded.apellido || '',
                fotoPerfil: '',
                documento: '',
                telefono: ''
            };

            // Verificar expiración
            if (decoded.exp * 1000 < Date.now()) {
                // Token expirado
                // localStorage.removeItem('token');
                // setUsuario(null);
                // setCargando(false);
                // return;
            }

            // 2. Obtener datos frescos del backend
            try {
                // Actualización optimista
                setUsuario(usuarioBasico);

                const { data } = await clienteAxios.get(`/usuarios/${decoded.sub}`);

                setUsuario({
                    ...usuarioBasico, // Mantener datos del token como respaldo
                    id: data.id,
                    email: data.email,
                    roles: data.roles ? toArray(data.roles) : usuarioBasico.roles,
                    permisos: data.permisos ? toArray(data.permisos) : usuarioBasico.permisos,
                    nombre: data.nombre,
                    apellido: data.apellido,
                    fotoPerfil: data.fotoPerfil,
                    documento: data.documento,
                    telefono: data.telefono
                });
            } catch (fetchError) {
                // datos no obtenidos
            }
        } catch (error) {
            localStorage.removeItem('token');
            setUsuario(null);
            setToken(null);
        } finally {
            setCargando(false);
        }
    };


    useEffect(() => {
        recargarUsuario();
    }, []);

    const iniciarSesion = async (email: string, contrasena: string) => {
        try {
            const { data } = await clienteAxios.post('/autenticacion/login', { email, contrasena });
            localStorage.setItem('token', data.access_token);
            setToken(data.access_token);
            await recargarUsuario();
        } catch (error) {
            console.error('[AUTH DEBUG] Error in iniciarSesion:', error);
            throw error;
        }
    };

    const cerrarSesion = () => {
        localStorage.removeItem('token');
        setUsuario(null);
        setToken(null);
    };

    useEffect(() => {
    }, [cargando]);

    useEffect(() => {
    }, [usuario]);

    const esAdmin = usuario?.roles?.includes('admin') || usuario?.roles?.includes('god') || false;

    return (
        <AuthContext.Provider value={{ usuario, token, cargando, iniciarSesion, cerrarSesion, recargarUsuario, actualizarUsuario, esAdmin }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
    return context;
};
