import { useState, useEffect } from 'react';
import { RefreshCw, Check, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexto/ContextoAutenticacion';

export default function Ajustes() {
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [version, setVersion] = useState<string>('');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const fetchVersion = async () => {
        try {
            const res = await fetch('http://localhost:4000/api/configuracion/version', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setVersion(data.version);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchVersion();
    }, []);

    const handleClearCache = async () => {
        if (!confirm('¿Estás seguro de que deseas limpiar la caché? Esto obligará a todos los usuarios a recargar los archivos estáticos.')) return;
        
        setLoading(true);
        setMessage(null);

        try {
            const res = await fetch('http://localhost:4000/api/configuracion/limpiar-cache', {
                method: 'POST',
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await res.json();
            
            if (res.ok) {
                setVersion(data.version);
                setMessage({ type: 'success', text: 'Caché limpiado correctamente. Nueva versión: ' + data.version });
            } else {
                setMessage({ type: 'error', text: data.message || 'Error al limpiar caché' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error de conexión' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Ajustes del Sistema</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Caché y Rendimiento</h2>
                        <p className="text-sm text-gray-500">Gestiona la caché de archivos estáticos (imágenes, CSS, JS)</p>
                    </div>
                    <span className="text-xs font-mono bg-gray-200 px-2 py-1 rounded text-gray-600">
                        Versión actual: {version || 'Draft'}
                    </span>
                </div>
                
                <div className="p-8">
                    <div className="flex items-start gap-6">
                        <div className="p-4 bg-orange-100 text-orange-600 rounded-full">
                            <RefreshCw className="w-8 h-8" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Limpiar Caché del Sitio Web</h3>
                            <p className="text-gray-600 mb-6 leading-relaxed">
                                Utiliza esta opción cuando realices cambios en imágenes, estilos o scripts y no se vean reflejados inmediatamente en la web pública.
                                <br/>
                                <span className="text-sm text-orange-600 font-semibold mt-2 block">
                                    <AlertTriangle className="w-4 h-4 inline mr-1"/>
                                    Esto forzará la recarga de recursos para todos los visitantes.
                                </span>
                            </p>
                            
                            <button 
                                onClick={handleClearCache}
                                disabled={loading}
                                className={`px-6 py-3 rounded-lg font-bold text-white shadow-lg transition-all flex items-center gap-2
                                    ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-green-700 hover:-translate-y-1'}
                                `}
                            >
                                {loading ? (
                                    <>
                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                        Limpiando...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="w-5 h-5" />
                                        Limpiar Caché Ahora
                                    </>
                                )}
                            </button>

                            {message && (
                                <div className={`mt-6 p-4 rounded-lg flex items-center gap-3 ${
                                    message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                                }`}>
                                    {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                                    <span className="font-medium">{message.text}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
