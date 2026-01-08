import { useState } from 'react';
import { Menu, LogOut, User, X, Camera, Globe } from 'lucide-react';
import { useAuth } from '../../contexto/ContextoAutenticacion';
import clienteAxios from '../../lib/cliente-axios';
import SelectorImagen from '../common/SelectorImagen';
import { resolveAssetUrl } from '../../lib/utils';

interface Props {
    colapsado: boolean;
    setColapsado: (v: boolean) => void;
}

export default function Encabezado({ colapsado, setColapsado }: Props) {
    const { usuario, cerrarSesion, iniciarSesion, recargarUsuario } = useAuth(); // Need to refresh user
    const [modalPerfil, setModalPerfil] = useState(false);

    // Form States
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [email, setEmail] = useState('');
    const [fotoPerfil, setFotoPerfil] = useState('');
    const [password, setPassword] = useState('');

    const abrirModal = () => {
        if (!usuario) return;
        setNombre(usuario.nombre || '');
        setApellido(usuario.apellido || '');
        setEmail(usuario.email || '');
        setFotoPerfil(usuario.fotoPerfil || '');
        setPassword('');
        setModalPerfil(true);
    };

    const guardarPerfil = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!usuario) return;

        try {
            const payload: any = {
                nombre,
                apellido,
                email,
                fotoPerfil
            };
            if (password) payload.contrasena = password;

            const { data } = await clienteAxios.patch(`/usuarios/${usuario.id}`, payload);

            await recargarUsuario(); // Refrescar contexto sin recargar página
            alert('Perfil actualizado correctamente.');
            setModalPerfil(false);
        } catch (error: any) {
            alert('Error actualizando perfil: ' + error.message);
        }
    };

    return (
        <>
            <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setColapsado(!colapsado)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    <a
                        href="/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors border border-primary/10"
                        title="Ver Sitio Web"
                    >
                        <Globe className="w-4 h-4" />
                        <span className="hidden sm:inline">Ver Sitio</span>
                    </a>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={abrirModal}
                        className="flex items-center gap-3 hover:bg-gray-50 px-3 py-1.5 rounded-full transition-colors border border-transparent hover:border-gray-200"
                    >
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-gray-800 leading-tight">{usuario?.nombre || 'Usuario'} {usuario?.apellido}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{usuario?.roles[0]}</p>
                        </div>
                        <div className="relative">
                            {usuario?.fotoPerfil ? (
                                <img src={resolveAssetUrl(usuario.fotoPerfil)} alt="Avatar" className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                            ) : (
                                <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                    {usuario?.nombre?.[0] || usuario?.email?.[0]?.toUpperCase()}
                                </div>
                            )}
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                    </button>

                    <div className="h-8 w-px bg-gray-200 mx-1"></div>

                    <button
                        onClick={cerrarSesion}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Cerrar Sesión"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Modal Editar Perfil */}
            {modalPerfil && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-end animate-in fade-in duration-200">
                    <div className="h-full w-full max-w-md bg-white shadow-2xl p-0 flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <User className="w-5 h-5 text-primary" />
                                Mi Perfil
                            </h2>
                            <button onClick={() => setModalPerfil(false)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={guardarPerfil} className="flex-1 overflow-y-auto p-6 space-y-6">

                            {/* Foto Section */}
                            <div className="flex flex-col items-center justify-center gap-4 py-4">
                                <div className="relative group cursor-pointer">
                                    {fotoPerfil ? (
                                        <img src={fotoPerfil} alt="Preview" className="w-24 h-24 rounded-full object-cover shadow-lg border-4 border-white" />
                                    ) : (
                                        <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border-4 border-white shadow-lg">
                                            <User className="w-10 h-10" />
                                        </div>
                                    )}
                                    {/* Overlay Helper */}
                                    <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white font-medium text-xs">
                                        Cambiar
                                    </div>

                                    {/* Selector Oculto (Usando el componente SelectorImagen estándar abajo) */}
                                </div>
                                <div className="w-full">
                                    <SelectorImagen
                                        label="URL Foto de Perfil"
                                        valor={fotoPerfil}
                                        onChange={setFotoPerfil}
                                        tipo="image"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Nombre</label>
                                    <input
                                        type="text"
                                        value={nombre}
                                        onChange={e => setNombre(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Apellido</label>
                                    <input
                                        type="text"
                                        value={apellido}
                                        onChange={e => setApellido(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Correo Electrónico</label>
                                <input
                                    type="email"
                                    value={email}
                                    disabled
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                                />
                                <p className="text-xs text-gray-400">El correo no se puede cambiar por seguridad.</p>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <h3 className="font-semibold text-gray-900 mb-4">Seguridad</h3>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Cambiar Contraseña</label>
                                    <input
                                        type="password"
                                        placeholder="Nueva contraseña (opcional)"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </form>

                        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-3">
                            <button
                                onClick={() => setModalPerfil(false)}
                                className="flex-1 py-2.5 text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 font-medium rounded-xl transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={guardarPerfil}
                                className="flex-1 py-2.5 text-white bg-primary hover:bg-primary-dark font-bold rounded-xl shadow-lg shadow-primary/25 transition-all"
                            >
                                Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
