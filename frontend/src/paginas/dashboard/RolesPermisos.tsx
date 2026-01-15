import { useState, useEffect } from 'react';
import clienteAxios from '../../lib/cliente-axios';
import { Shield, Check, Save, Briefcase, User, Star, Crown, Zap, Heart, Pencil, Trash2 } from 'lucide-react';

interface Rol {
    id: string;
    nombre: string;
    permisos: string[];
    icono?: string;
}

const AVAILABLE_ICONS = ['Shield', 'User', 'Briefcase', 'Star', 'Crown', 'Zap', 'Heart'];
const ICONS: any = { Shield, User, Briefcase, Star, Crown, Zap, Heart };

const MODULES = [
    { id: 'dashboard', label: 'Tablero' },
    { id: 'catalogo', label: 'Catálogo' },
    { id: 'usuarios', label: 'Usuarios' },
    { id: 'roles', label: 'Roles y Permisos' },
    { id: 'temas', label: 'Temas' },
    { id: 'medios', label: 'Medios' },
    { id: 'negocio', label: 'Negocio' },
    { id: 'paginas', label: 'Páginas' },
    { id: 'contactos', label: 'Contactos' },
    { id: 'menus', label: 'Menús' },
    { id: 'reuniones', label: 'Reuniones y Asistentes' },
    { id: 'proyeccion', label: 'Mis Votantes' }
];

export default function RolesPermisos() {
    const [roles, setRoles] = useState<Rol[]>([]);
    const [cargando, setCargando] = useState(false);
    const [saving, setSaving] = useState(false);

    const [nuevoRolNombre, setNuevoRolNombre] = useState('');
    const [nuevoRolIcono, setNuevoRolIcono] = useState('Shield');
    const [modalCrear, setModalCrear] = useState(false);

    // Estado para edición
    const [rolEditar, setRolEditar] = useState<Rol | null>(null);

    useEffect(() => {
        cargarRoles();
    }, []);

    const cargarRoles = async () => {
        setCargando(true);
        try {
            const { data } = await clienteAxios.get('/roles');

            if (!Array.isArray(data)) {
                console.error('[RolesPermisos ERROR] Data is not an array:', data);
                // Evitar crash si no es array
                setRoles([]);
                return;
            }
            setRoles(data || []);
        } catch (error) {
            console.error('Error cargando roles:', error);
        } finally {
            setCargando(false);
        }
    };

    const crearRol = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { data } = await clienteAxios.post('/roles', {
                nombre: nuevoRolNombre.toLowerCase(),
                permisos: ['dashboard'],
                icono: nuevoRolIcono
            });
            setRoles([...roles, data]);
            setModalCrear(false);
            setNuevoRolNombre('');
            setNuevoRolIcono('Shield');
        } catch (error: any) {
            alert('Error creando rol: ' + (error.response?.data?.message || error.message));
        }
    };

    const editarRol = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rolEditar) return;
        try {
            await clienteAxios.patch(`/roles/${rolEditar.id}`, {
                nombre: rolEditar.nombre,
                icono: rolEditar.icono
            });

            // Actualizar estado local
            setRoles(roles.map(r => r.id === rolEditar.id ? rolEditar : r));
            setRolEditar(null);
            alert('Rol actualizado');
        } catch (error: any) {
            alert('Error al editar rol: ' + error.message);
        }
    };

    const togglePermiso = (rolId: string, moduloId: string) => {
        setRoles(prevRoles => prevRoles.map(rol => {
            if (rol.id !== rolId) return rol;

            const nuevosPermisos = rol.permisos.includes(moduloId)
                ? rol.permisos.filter(p => p !== moduloId)
                : [...rol.permisos, moduloId];

            return { ...rol, permisos: nuevosPermisos };
        }));
    };

    const eliminarRol = async (id: string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este rol? Esta acción no se puede deshacer.')) return;

        try {
            await clienteAxios.delete(`/roles/${id}`);
            setRoles(roles.filter(r => r.id !== id));
            setRolEditar(null);
            alert('Rol eliminado correctamente');
        } catch (error: any) {
            console.error('Error eliminando rol:', error);
            alert('Error al eliminar rol: ' + (error.response?.data?.message || error.message));
        }
    };

    const guardarCambios = async () => {
        setSaving(true);
        try {
            // Guardar permisos
            await Promise.all(roles.map(rol =>
                clienteAxios.patch(`/roles/${rol.id}`, { permisos: rol.permisos })
            ));
            alert('Permisos actualizados correctamente. Los usuarios deberán recargar la página.');
        } catch (error) {
            console.error('Error guardando:', error);
            alert('Error al guardar cambios');
        } finally {
            setSaving(false);
        }
    };

    if (cargando) return <div className="p-10 text-center">Cargando roles...</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            {/* Header omitted for brevity, logic unchanged */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Roles y Permisos</h1>
                    <p className="text-gray-500 mt-1">Configura qué módulos puede ver cada rol</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => { setNuevoRolNombre(''); setNuevoRolIcono('Shield'); setModalCrear(true); }}
                        className="px-5 py-3 text-primary font-bold bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors"
                    >
                        + Crear Rol
                    </button>
                    <button
                        onClick={guardarCambios}
                        disabled={saving}
                        className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary/25 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <Save className="w-5 h-5" />
                        {saving ? 'Guardando...' : 'Guardar Configuración'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50/80 border-b border-gray-100">
                            <th className="px-6 py-4 text-left font-semibold text-gray-600">Módulo / Sección</th>
                            {roles.length === 0 ? (
                                <th className="px-6 py-4 text-center text-gray-400 font-normal italic">
                                    No se encontraron roles.
                                </th>
                            ) : (
                                roles.map(rol => {
                                    const IconComponent = ICONS[rol.icono || 'Shield'] || Shield;
                                    return (
                                        <th key={rol.id} className="px-6 py-4 text-center font-bold text-gray-800 uppercase text-sm tracking-wider">
                                            <div className="flex flex-col items-center gap-2 group relative cursor-pointer" onClick={() => setRolEditar(rol)}>
                                                <div className="relative">
                                                    <IconComponent className={`w-6 h-6 ${rol.nombre === 'admin' ? 'text-purple-500' : 'text-blue-500'}`} />
                                                    <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Pencil className="w-3 h-3 text-gray-500" />
                                                    </div>
                                                </div>
                                                {rol.nombre}
                                            </div>
                                        </th>
                                    );
                                })
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {MODULES.map(modulo => (
                            <tr key={modulo.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-700">
                                    {modulo.label}
                                </td>
                                {roles.length > 0 && roles.map(rol => {
                                    const activo = rol.permisos.includes(modulo.id);
                                    return (
                                        <td key={`${rol.id}-${modulo.id}`} className="px-6 py-4 text-center align-middle">
                                            <div className="flex justify-center">
                                                <input
                                                    type="checkbox"
                                                    checked={activo}
                                                    onChange={() => togglePermiso(rol.id, modulo.id)}
                                                    className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer accent-primary"
                                                />
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal Crear/Editar Rol */}
            {(modalCrear || rolEditar) && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">{rolEditar ? 'Editar Rol' : 'Crear Nuevo Rol'}</h2>
                        <form onSubmit={rolEditar ? editarRol : crearRol}>
                            <div className="mb-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Rol</label>
                                    <input
                                        type="text"
                                        autoFocus
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                        placeholder="Ej: editor, soporte..."
                                        value={rolEditar ? rolEditar.nombre : nuevoRolNombre}
                                        onChange={e => rolEditar ? setRolEditar({ ...rolEditar, nombre: e.target.value }) : setNuevoRolNombre(e.target.value)}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Icono</label>
                                    <div className="grid grid-cols-5 gap-2">
                                        {AVAILABLE_ICONS.map((iconName) => {
                                            const IconComponent = ICONS[iconName] || Shield;
                                            const isSelected = rolEditar
                                                ? rolEditar.icono === iconName
                                                : nuevoRolIcono === iconName;

                                            return (
                                                <button
                                                    key={iconName}
                                                    type="button"
                                                    onClick={() => rolEditar ? setRolEditar({ ...rolEditar, icono: iconName }) : setNuevoRolIcono(iconName)}
                                                    className={`p-2 rounded-lg flex items-center justify-center transition-all ${isSelected
                                                        ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/30'
                                                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                                                        }`}
                                                    title={iconName}
                                                >
                                                    <IconComponent className="w-5 h-5" />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
                                {rolEditar ? (
                                    <button
                                        type="button"
                                        onClick={() => eliminarRol(rolEditar.id)}
                                        className="px-4 py-2 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg flex items-center gap-2 transition-colors font-medium"
                                        title="Eliminar este rol permanentemente"
                                    >
                                        <Trash2 className="w-4 h-4" /> Eliminar Rol
                                    </button>
                                ) : <div />} {/* Spacer if no delete button */}

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => { setModalCrear(false); setRolEditar(null); }}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-bold shadow-lg shadow-primary/20"
                                    >
                                        {rolEditar ? 'Guardar Cambios' : 'Crear Rol'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="mt-6 bg-blue-50 text-blue-800 p-4 rounded-xl text-sm border border-blue-100 flex gap-3">
                <div className="pt-0.5">ℹ️</div>
                <div>
                    <strong>Nota:</strong> Los cambios en permisos se aplicarán la próxima vez que el usuario cargue la página o inicie sesión.
                </div>
            </div>
        </div >
    );
}
