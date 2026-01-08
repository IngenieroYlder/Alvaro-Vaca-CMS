import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexto/ContextoAutenticacion';
import { motion } from 'framer-motion';
import { Users, ShoppingBag, Radio, Home, LogOut } from 'lucide-react';
import clsx from 'clsx';

export default function BarraLateral() {
    const { usuario, cerrarSesion } = useAuth();
    const location = useLocation();

    const itemsMenu = [
        { etiqueta: 'Tablero', ruta: '/dashboard', icono: Home, roles: [] },
        { etiqueta: 'Usuarios', ruta: '/dashboard/usuarios', icono: Users, roles: ['admin', 'god'] },
        { etiqueta: 'Catálogo', ruta: '/dashboard/catalogo', icono: ShoppingBag, roles: ['admin', 'editor', 'god'] },
        { etiqueta: 'Webhooks', ruta: '/dashboard/webhooks', icono: Radio, roles: ['admin', 'god'] },
    ];

    const itemsFiltrados = itemsMenu.filter(item =>
        item.roles.length === 0 || item.roles.some(rol => usuario?.roles.includes(rol))
    );

    return (
        <div className="w-64 bg-gray-900 text-white h-screen flex flex-col p-4 shadow-xl z-10">
            <div className="text-2xl font-bold mb-8 text-center text-blue-400 tracking-wider">
                ColombiaPicture
            </div>

            <div className="mb-6 px-4">
                <p className="text-xs text-gray-400 uppercase">Bienvenido</p>
                <p className="font-semibold truncate">{usuario?.email}</p>
            </div>

            <nav className="flex-1 space-y-2">
                {itemsFiltrados.map((item) => {
                    const activo = location.pathname === item.ruta;
                    const Icono = item.icono;
                    return (
                        <Link key={item.ruta} to={item.ruta}>
                            <motion.div
                                whileHover={{ x: 5 }}
                                className={clsx(
                                    "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                                    activo ? "bg-blue-600 text-white shadow-lg" : "text-gray-300 hover:bg-gray-800 hover:text-white"
                                )}
                            >
                                <Icono size={20} />
                                <span>{item.etiqueta}</span>
                            </motion.div>
                        </Link>
                    );
                })}
            </nav>

            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={cerrarSesion}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-red-600/20 hover:text-red-400 text-gray-400 transition-colors mt-auto border border-transparent hover:border-red-600/30"
            >
                <LogOut size={20} />
                <span>Cerrar Sesión</span>
            </motion.button>
        </div>
    );
}
