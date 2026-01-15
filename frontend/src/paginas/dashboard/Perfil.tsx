import { useState, useEffect } from 'react';
import clienteAxios from '../../lib/cliente-axios';
import { useAuth } from '../../contexto/ContextoAutenticacion';
import { User, Save, Lock, Phone, CreditCard, Mail } from 'lucide-react';

export default function Perfil() {
    const { usuario, actualizarUsuario } = useAuth();
    const [cargando, setCargando] = useState(false);
    const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        documento: '',
        telefono: '', // whatsapp in backend? or telefono?
        email: '', // Read only
        contrasena: '',
        confirmarContrasena: ''
    });

    useEffect(() => {
        if (usuario) {
            setFormData({
                nombre: usuario.nombre || '',
                apellido: usuario.apellido || '',
                documento: usuario.documento || '',
                telefono: usuario.telefono || '', 
                email: usuario.email || '',
                contrasena: '',
                confirmarContrasena: ''
            });
        }
    }, [usuario]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMensaje({ tipo: '', texto: '' });

        if (formData.contrasena && formData.contrasena !== formData.confirmarContrasena) {
            setMensaje({ tipo: 'error', texto: 'Las contraseñas no coinciden' });
            return;
        }

        setCargando(true);
        try {
            const payload: any = {
                nombre: formData.nombre,
                apellido: formData.apellido,
                documento: formData.documento,
                telefono: formData.telefono,
            };

            if (formData.contrasena) {
                payload.contrasena = formData.contrasena;
            }

            // Update user
            const { data } = await clienteAxios.patch(`/usuarios/${usuario?.id}`, payload);
            
            // Update context
            if (actualizarUsuario) {
                 actualizarUsuario(data);
            }

            setMensaje({ tipo: 'exito', texto: 'Perfil actualizado correctamente' });
            setFormData(prev => ({ ...prev, contrasena: '', confirmarContrasena: '' }));
        } catch (error: any) {
            console.error(error);
            setMensaje({ tipo: 'error', texto: error.response?.data?.message || 'Error al actualizar perfil' });
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mi Perfil</h1>
            <p className="text-gray-500 mb-8">Administra tu información personal y seguridad</p>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 md:p-8">
                    {mensaje.texto && (
                        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${mensaje.tipo === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                            <span className="font-medium">{mensaje.texto}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Personal Info Section */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <User className="w-5 h-5 text-primary" /> Información Personal
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                    <input
                                        type="text"
                                        name="nombre"
                                        value={formData.nombre}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                                    <input
                                        type="text"
                                        name="apellido"
                                        value={formData.apellido}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Documento de Identidad (Cédula)</label>
                                    <div className="relative">
                                        <CreditCard className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            name="documento"
                                            value={formData.documento}
                                            onChange={handleChange}
                                            placeholder="Ingresa tu cédula"
                                            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Requerido para crear reuniones.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono / WhatsApp</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            name="telefono"
                                            value={formData.telefono}
                                            onChange={handleChange}
                                            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        {/* Account Info Section */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Lock className="w-5 h-5 text-primary" /> Cuenta y Seguridad
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                        <input
                                            type="email"
                                            value={formData.email}
                                            disabled
                                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
                                    <input
                                        type="password"
                                        name="contrasena"
                                        value={formData.contrasena}
                                        onChange={handleChange}
                                        placeholder="Dejar vacio para no cambiar"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Contraseña</label>
                                    <input
                                        type="password"
                                        name="confirmarContrasena"
                                        value={formData.confirmarContrasena}
                                        onChange={handleChange}
                                        placeholder="Repite la contraseña"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={cargando}
                                className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Save className="w-5 h-5" />
                                {cargando ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
