import { useState } from 'react';
import { useAuth } from '../contexto/ContextoAutenticacion';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, User } from 'lucide-react';
import { resolveAssetUrl } from '../lib/utils';

export default function Login() {
    const [email, setEmail] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState<any>(null); // State for theme config
    const { iniciarSesion } = useAuth();
    const navigate = useNavigate();

    // Fetch theme config on mount
    useState(() => {
        import('../lib/cliente-axios').then(({ default: clienteAxios }) => {
            clienteAxios.get('/theme/config').then(res => setConfig(res.data)).catch(() => { });
        });
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await iniciarSesion(email, contrasena);
            // Pequeña pausa para asegurar que se vean los logs y se setee el estado
            setTimeout(() => {
                navigate('/');
            }, 1000);
        } catch (err: any) {
            console.error('[LOGIN ERROR] Full error:', err);
            if (err.response) {
                console.error('[LOGIN ERROR] Response status:', err.response.status);
                console.error('[LOGIN ERROR] Response data:', err.response.data);
            }
            setError('Nombre de usuario o contraseña incorrectos.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f0f1]">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                {/* Logo Area */}
                <div className="flex justify-center mb-6">
                    {/* Logic: Horizontal -> Vertical -> Negro -> Fallback ColombiaPictures */}
                    {config?.logoHorizontal ? (
                        <img src={resolveAssetUrl(config.logoHorizontal)} alt="Logo" className="h-16 object-contain" />
                    ) : config?.logoVertical ? (
                        <img src={resolveAssetUrl(config.logoVertical)} alt="Logo" className="h-20 object-contain" />
                    ) : config?.logoNegro ? (
                        <img src={resolveAssetUrl(config.logoNegro)} alt="Logo" className="h-16 object-contain" />
                    ) : (
                        /* Fallback Colombia Pictures Default Logo */
                        <div className="flex flex-col items-center">
                            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-lg relative overflow-hidden">
                                <img
                                    src={resolveAssetUrl('uploads/007-Logo-CPCP-Negro-Horizontal.png')}
                                    onError={(e) => {
                                        // Fallback si falla la imagen externa, mostrar icono
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.parentElement?.classList.add('fallback-icon');
                                    }}
                                    alt="CP"
                                    className="w-full h-full object-cover"
                                />
                                <Lock className="text-white w-10 h-10 absolute hidden fallback-icon:block" />
                            </div>
                            <span className="mt-2 text-gray-500 font-bold text-sm">Colombia Pictures</span>
                        </div>
                    )}
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-[320px] bg-white p-6 shadow-md border border-gray-200/60"
            >
                {error && (
                    <div className="mb-4 bg-white border-l-4 border-red-500 p-3 shadow-sm">
                        <p className="text-xs text-gray-700">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-600 mb-1 font-medium">Nombre de usuario o correo electrónico</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-2 pl-3 border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-gray-800 text-lg shadow-inner bg-gray-50/50"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600 mb-1 font-medium">Contraseña</label>
                        <div className="relative">
                            <input
                                type="password"
                                value={contrasena}
                                onChange={(e) => setContrasena(e.target.value)}
                                className="w-full p-2 pl-3 border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-gray-800 text-lg shadow-inner bg-gray-50/50"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <label className="flex items-center text-xs text-gray-600 cursor-pointer">
                            <input type="checkbox" className="mr-2 rounded border-gray-300 text-primary focus:ring-primary" />
                            Recuérdame
                        </label>
                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-primary text-white border border-primary hover:bg-primary-dark transition-colors text-sm font-semibold rounded shadow-sm disabled:opacity-50"
                        >
                            {loading ? 'Accediendo...' : 'Acceder'}
                        </motion.button>
                    </div>
                </form>
            </motion.div>

            <div className="mt-6 text-center space-y-2">
                <a href="#" className="block text-xs text-gray-500 hover:text-primary transition-colors">¿Has olvidado tu contraseña?</a>
                <a href="/" className="block text-xs text-gray-500 hover:text-primary transition-colors">← Ir a Patios</a>
            </div>

            <div className="mt-12 text-center text-[10px] text-gray-400 font-medium uppercase tracking-wide opacity-80 hover:opacity-100 transition-opacity">
                <p className="mb-1">Desarrollado por <span className="text-gray-500 font-bold">Ingeniero Ylder Gonzalez</span></p>
                <p className="mb-1 text-[9px] text-gray-400">Colombia Picture - Colombia Pictures SAS</p>
                <div className="flex items-center justify-center gap-2 mt-2 text-[9px]">
                    <span>3223171673</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <a href="https://www.colombiapictures.co" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors border-b border-transparent hover:border-primary">
                        www.colombiapictures.co
                    </a>
                </div>
            </div>
        </div>
    );
}

