import { useState, useEffect } from 'react';
import clienteAxios from '../../lib/cliente-axios';
import { Plus, Pencil, Trash2, Search, X, Shield, Crown, FileSpreadsheet, FileText } from 'lucide-react';
import { useAuth } from '../../contexto/ContextoAutenticacion';
import SafeDeleteModal from '../../components/SafeDeleteModal';

interface Usuario {
    id: string;
    nombre: string;
    apellido: string;
    documento?: string;
    email: string;
    roles: string[];
    activo: boolean;
    creadoEn: string;
}

interface Rol {
    id: string;
    nombre: string;
}

export default function Usuarios() {
    const { usuario: usuarioActual, esAdmin } = useAuth();
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [coordinadores, setCoordinadores] = useState<Usuario[]>([]);
    const [rolesDisponibles, setRolesDisponibles] = useState<Rol[]>([]);
    const [cargando, setCargando] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const [modalAbierto, setModalAbierto] = useState(false);
    const [usuarioEditar, setUsuarioEditar] = useState<Usuario | null>(null);
    const [usuarioAEliminar, setUsuarioAEliminar] = useState<Usuario | null>(null);

    useEffect(() => {
        cargarUsuarios();
        cargarRoles();
        cargarCoordinadores();
    }, []);

    const cargarCoordinadores = async () => {
        try {
            const { data } = await clienteAxios.get('/usuarios?role=coordinador');
            setCoordinadores(data);
        } catch (error) {
            console.error('Error cargando coordinadores:', error);
        }
    };

    const cargarUsuarios = async () => {
        setCargando(true);
        try {
            const { data } = await clienteAxios.get('/usuarios');
            setUsuarios(data);
        } catch (error) {
            console.error('Error cargando usuarios:', error);
        } finally {
            setCargando(false);
        }
    };

    const cargarRoles = async () => {
        try {
            const { data } = await clienteAxios.get('/roles');
            setRolesDisponibles(data);
        } catch (error) {
            console.error('Error cargando roles:', error);
        }
    };

    // Form State (Updated with coordinatorId)
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        documento: '',
        email: '',
        contrasena: '',
        roles: 'usuario',
        coordinatorId: '',
        activo: true
    });

    const handleOpenModal = (usuario?: Usuario) => {
        if (usuario) {
            setUsuarioEditar(usuario);
            let initialRole = 'usuario';
            if (usuario.roles.includes('god')) initialRole = 'god';
            else if (usuario.roles.length > 0) initialRole = usuario.roles[0];

            setFormData({
                nombre: usuario.nombre || '',
                apellido: usuario.apellido || '',
                documento: usuario.documento || '',
                email: usuario.email,
                contrasena: '',
                roles: initialRole,
                coordinatorId: (usuario as any).coordinatorId || '',
                activo: usuario.activo
            });
        } else {
            setUsuarioEditar(null);
            const isCoordinador = usuarioActual?.roles.includes('coordinador') && !esAdmin;
            
            setFormData({
                nombre: '',
                apellido: '',
                documento: '',
                email: '',
                contrasena: '',
                roles: isCoordinador ? 'lider' : 'usuario',
                coordinatorId: '',
                activo: true
            });
        }
        setModalAbierto(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let rolesToSend = [formData.roles];
            if (formData.roles === 'god') {
                rolesToSend = ['god', 'admin'];
            }

            const payload: any = {
                nombre: formData.nombre,
                apellido: formData.apellido,
                documento: formData.documento,
                email: formData.email,
                roles: rolesToSend,
                activo: formData.activo,
                coordinatorId: formData.coordinatorId || null
            };

            if (formData.contrasena) {
                payload.contrasena = formData.contrasena;
            }

            if (usuarioEditar) {
                await clienteAxios.patch(`/usuarios/${usuarioEditar.id}`, payload);
            } else {
                await clienteAxios.post('/usuarios', payload);
            }

            setModalAbierto(false);
            cargarUsuarios();
            alert(usuarioEditar ? 'Usuario actualizado' : 'Usuario creado');
        } catch (error: any) {
            console.error('Error guardando usuario:', error);
            alert('Error al guardar: ' + (error.response?.data?.message || error.message));
        }
    };
    
    // ... (rest of methods until render)
    


    const confirmarEliminacion = (usuario: Usuario) => {
        setUsuarioAEliminar(usuario);
    };

    const eliminarUsuario = async (id: string) => {
        try {
            await clienteAxios.delete(`/usuarios/${id}`);
            setUsuarios(prev => prev.filter(u => u.id !== id));
            alert('Usuario eliminado correctamente');
        } catch (error) {
            console.error('Error eliminando:', error);
            alert('No se pudo eliminar el usuario');
        }
    };

    const handleExport = async (type: 'excel' | 'pdf') => {
        try {
            const endpoint = type === 'excel' ? '/usuarios/exportar/excel' : '/usuarios/exportar/pdf';
            const filename = type === 'excel' ? 'usuarios.xlsx' : 'usuarios.pdf';

            // Use clienteAxios to send Auth Token
            const response = await clienteAxios.get(endpoint, {
                responseType: 'blob'
            });

            // Create blob link and download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error exportando:', error);
            alert('Error al exportar datos. Verifica tus permisos o intenta nuevamente.');
        }
    };

    const usuariosFiltrados = usuarios.filter(u =>
        u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        u.email.toLowerCase().includes(busqueda.toLowerCase())
    );

    // Permitir asignar GOD si soy admin o god
    const puedoAsignarGod = esAdmin || usuarioActual?.roles.includes('god');

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Usuarios</h1>
                    <p className="text-gray-500 mt-1">Gestión de acceso y permisos del sistema</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => handleExport('excel')}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                        title="Exportar a Excel"
                    >
                        <FileSpreadsheet className="w-5 h-5" />
                        <span className="hidden sm:inline">Excel</span>
                    </button>
                    <button
                        onClick={() => handleExport('pdf')}
                        className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg shadow-rose-600/20 transition-all active:scale-95"
                        title="Exportar a PDF"
                    >
                        <FileText className="w-5 h-5" />
                        <span className="hidden sm:inline">PDF</span>
                    </button>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/25 transition-all active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="hidden sm:inline">Nuevo Usuario</span>
                    </button>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o email..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-medium">
                                <th className="px-6 py-4">Usuario</th>
                                <th className="px-6 py-4">Rol</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4">Fecha Registro</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {cargando ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">Cargando usuarios...</td>
                                </tr>
                            ) : usuariosFiltrados.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">No se encontraron usuarios</td>
                                </tr>
                            ) : (
                                usuariosFiltrados.map((usuario) => {
                                    const isGod = usuario.roles.includes('god');
                                    return (
                                        <tr key={usuario.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center font-bold text-sm">
                                                        {usuario.nombre?.[0] || usuario.email[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{usuario.nombre} {usuario.apellido}</p>
                                                        <p className="text-sm text-gray-500">{usuario.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${isGod
                                                    ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                                    : usuario.roles.includes('admin')
                                                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                                        : 'bg-blue-100 text-blue-700 border border-blue-200'
                                                    }`}>
                                                    {isGod ? <Crown className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                                                    {isGod ? 'God Mode' : usuario.roles[0]}
                                                    {usuario.roles.length > 1 && !isGod && <span className="text-[10px] opacity-70">+{usuario.roles.length - 1}</span>}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${usuario.activo
                                                    ? 'bg-green-100 text-green-700 border border-green-200'
                                                    : 'bg-red-100 text-red-700 border border-red-200'
                                                    }`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${usuario.activo ? 'bg-green-500' : 'bg-red-500'}`} />
                                                    {usuario.activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                                                {new Date(usuario.creadoEn).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleOpenModal(usuario)}
                                                        className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    {/* Solo Admin/God puede ver el botón eliminar y usar el borrado seguro */}
                                                    {(esAdmin || usuarioActual?.roles.includes('god')) && (
                                                        <button
                                                            onClick={() => confirmarEliminacion(usuario)}
                                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Eliminar de forma segura"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Create/Edit */}
            {modalAbierto && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-900">
                                {usuarioEditar ? 'Editar Usuario' : 'Nuevo Usuario'}
                            </h2>
                            <button onClick={() => setModalAbierto(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Nombre</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                        value={formData.nombre}
                                        onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Apellido</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                        value={formData.apellido}
                                        onChange={e => setFormData({ ...formData, apellido: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Documento de Identidad (Cédula)</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Cédula (Obligatorio)"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                    value={formData.documento}
                                    onChange={e => setFormData({ ...formData, documento: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Email</label>
                                <input
                                    type="email"
                                    // required // Email is optional now
                                    disabled={!!usuarioEditar}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none disabled:bg-gray-100 disabled:text-gray-500"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Contraseña {usuarioEditar && <span className="text-gray-400 font-normal">(Dejar en blanco para mantener actual)</span>}
                                </label>
                                <input
                                    type="password"
                                    required={!usuarioEditar && !formData.documento} // Si hay documento, la pass es opcional (se auto-genera)
                                    minLength={6}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                    value={formData.contrasena}
                                    onChange={e => setFormData({ ...formData, contrasena: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Rol</label>
                                    <select
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
                                        value={formData.roles}
                                        onChange={e => setFormData({ ...formData, roles: e.target.value })}
                                        disabled={usuarioActual?.roles.includes('coordinador') && !esAdmin}
                                    >
                                        <option value="usuario">Seleccionar Rol...</option>
                                        {/* Roles dinámicos */}
                                        {rolesDisponibles
                                            .filter(rol => {
                                                if (usuarioActual?.roles.includes('coordinador') && !esAdmin) {
                                                    return rol.nombre === 'lider';
                                                }
                                                return true;
                                            })
                                            .map(rol => (
                                            <option key={rol.id} value={rol.nombre}>{rol.nombre.charAt(0).toUpperCase() + rol.nombre.slice(1)}</option>
                                        ))}

                                        {/* Modo Dios (Solo para admins) */}
                                        {puedoAsignarGod && (
                                            <option value="god">👑 Modo Dios (Super Admin)</option>
                                        )}
                                    </select>
                                </div>

                                {formData.roles === 'lider' && (esAdmin || usuarioActual?.roles.includes('god')) && (
                                     <div className="space-y-2 col-span-2">
                                        <label className="text-sm font-medium text-gray-700">Coordinador Asignado</label>
                                        <select
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
                                            value={formData.coordinatorId}
                                            onChange={e => setFormData({ ...formData, coordinatorId: e.target.value })}
                                        >
                                            <option value="">-- Sin Coordinador --</option>
                                            {coordinadores.map(c => (
                                                <option key={c.id} value={c.id}>
                                                    {c.nombre} {c.apellido}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-gray-500">
                                            Asigna este líder a un coordinador para que pueda gestionar sus reuniones.
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Estado</label>
                                    <div className="flex items-center gap-3 h-[42px]">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, activo: !formData.activo })}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.activo ? 'bg-green-500' : 'bg-gray-300'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.activo ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                        <span className="text-sm text-gray-600 font-medium">
                                            {formData.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setModalAbierto(false)}
                                    className="px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark shadow-lg shadow-primary/25 transition-all active:scale-95"
                                >
                                    {usuarioEditar ? 'Guardar Cambios' : 'Crear Usuario'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <SafeDeleteModal
                isOpen={!!usuarioAEliminar}
                onClose={() => setUsuarioAEliminar(null)}
                onConfirm={() => eliminarUsuario(usuarioAEliminar?.id || '')}
                itemName={usuarioAEliminar ? `${usuarioAEliminar.nombre} ${usuarioAEliminar.apellido}` : ''}
            />
        </div>
    );
}
