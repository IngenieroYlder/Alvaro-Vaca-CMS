import { useState, useEffect } from 'react';
import clienteAxios from '../../lib/cliente-axios';
import { Plus, Trash2, Calendar, MapPin, Users, Copy, QrCode } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DEPARTAMENTOS_MUNICIPIOS } from '../../lib/colombia-data';

export default function Reuniones() {
    const [reuniones, setReuniones] = useState<any[]>([]);
    const [cargando, setCargando] = useState(false);
    const [modalAbierto, setModalAbierto] = useState(false);
    
    // Formulario crear
    const [nuevaReunion, setNuevaReunion] = useState({
        nombre: '',
        fecha: '',
        hora: '',
        departamento: 'Meta', // Default
        municipio: 'Villavicencio', // Default
        comuna: '',
        barrio: '',
        direccion: '',
        lugarReferencia: ''
    });

    const [municipiosOptions, setMunicipiosOptions] = useState<string[]>([]);

    useEffect(() => {
        cargarReuniones();
    }, []);

    useEffect(() => {
        if (nuevaReunion.departamento) {
            setMunicipiosOptions(DEPARTAMENTOS_MUNICIPIOS[nuevaReunion.departamento] || []);
            // Reset municipio if not in new list, unless it's the initial load logic
            const currentMunis = DEPARTAMENTOS_MUNICIPIOS[nuevaReunion.departamento] || [];
            if (!currentMunis.includes(nuevaReunion.municipio)) {
                setNuevaReunion(prev => ({ ...prev, municipio: currentMunis[0] || '' }));
            }
        }
    }, [nuevaReunion.departamento]);

    const cargarReuniones = async () => {
        setCargando(true);
        try {
            const { data } = await clienteAxios.get('/reuniones'); // Filtros pueden ir aquí
            setReuniones(data);
        } catch (error) {
            console.error('Error cargando reuniones:', error);
        } finally {
            setCargando(false);
        }
    };

    const crearReunion = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const fechaCompleta = new Date(`${nuevaReunion.fecha}T${nuevaReunion.hora}`);
            
            await clienteAxios.post('/reuniones', {
                ...nuevaReunion,
                fecha: fechaCompleta
            });
            
            setModalAbierto(false);
            setNuevaReunion({ 
                nombre: '', fecha: '', hora: '', 
                departamento: 'Meta', municipio: 'Villavicencio', 
                comuna: '', barrio: '', direccion: '', lugarReferencia: '' 
            });
            cargarReuniones();
            alert('Reunión creada exitosamente');
        } catch (error: any) {
            const msg = error.response?.data?.message || error.message;
            if (msg.includes('perfil con tu documento')) {
                 if(confirm(`${msg} ¿Deseas ir a tu perfil ahora?`)) {
                    window.location.href = '/dashboard/perfil'; // Adjust path if needed
                 }
            } else {
                alert('Error creando reunión: ' + msg);
            }
        }
    };

    const eliminarReunion = async (id: string) => {
        if (!confirm('¿Seguro que deseas eliminar esta reunión?')) return;
        try {
            await clienteAxios.delete(`/reuniones/${id}`);
            // Optimistic update
            setReuniones(prev => prev.filter(r => r.id !== id));
        } catch (error: any) {
            alert('Error eliminando reunión: ' + (error.response?.data?.message || 'Error desconocido'));
        }
    };

    const copiarEnlace = (codigo: string) => {
        const url = `${window.location.origin}/reuniones/formulario/${codigo}`; 
        navigator.clipboard.writeText(url);
        alert('Enlace copiado al portapapeles: ' + url);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mis Reuniones</h1>
                    <p className="text-gray-500">Gestiona tus eventos y asistencia</p>
                </div>
                <button 
                    onClick={() => setModalAbierto(true)}
                    className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium"
                >
                    <Plus className="w-5 h-5" /> Nueva Reunión
                </button>
            </div>

            {cargando ? (
                <div className="text-center py-10">Cargando...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reuniones.map(reunion => (
                        <div key={reunion.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded inline-block mb-2">
                                        CÓDIGO: {reunion.codigo}
                                    </div>
                                    <h3 className="font-bold text-lg text-gray-900">{reunion.nombre}</h3>
                                    <p className="text-xs text-gray-500 mt-1">Líder: {reunion.liderNombre}</p>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => copiarEnlace(reunion.codigo)} className="p-2 text-gray-400 hover:text-primary hover:bg-gray-50 rounded" title="Copiar Enlace Registro">
                                        <Copy className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => eliminarReunion(reunion.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded" title="Eliminar">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="space-y-3 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    {format(new Date(reunion.fecha), "PPP p", { locale: es })}
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    {reunion.barrio}, {reunion.municipio}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-gray-400" />
                                    <span className="font-medium text-gray-900">{reunion.asistentesCount || (reunion.asistentes ? reunion.asistentes.length : 0)} Asistentes</span>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                                <a href={`/reuniones/formulario/${reunion.codigo}`} target="_blank" rel="noreferrer" className="flex-1 text-center py-2 text-sm text-gray-600 hover:bg-gray-50 rounded border border-gray-200">
                                    Ver Formulario
                                </a>
                                {/* Could link to specific details page if implemented */}
                            </div>
                        </div>
                    ))}
                    
                    {reuniones.length === 0 && (
                        <div className="col-span-full text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            <p className="text-gray-500 mb-2">No tienes reuniones creadas.</p>
                            <button onClick={() => setModalAbierto(true)} className="text-primary font-medium hover:underline">Crear mi primera reunión</button>
                        </div>
                    )}
                </div>
            )}

            {/* Modal Crear */}
            {modalAbierto && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                            <h2 className="text-lg font-bold">Nueva Reunión</h2>
                        </div>
                        <form onSubmit={crearReunion} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del evento</label>
                                <input type="text" required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" 
                                    value={nuevaReunion.nombre} onChange={e => setNuevaReunion({...nuevaReunion, nombre: e.target.value})} 
                                    placeholder="Ej: Reunión Barrio La Esperanza" />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                                    <input type="date" required className="w-full px-3 py-2 border rounded-lg"
                                        value={nuevaReunion.fecha} onChange={e => setNuevaReunion({...nuevaReunion, fecha: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                                    <input type="time" required className="w-full px-3 py-2 border rounded-lg"
                                        value={nuevaReunion.hora} onChange={e => setNuevaReunion({...nuevaReunion, hora: e.target.value})} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                                    <select className="w-full px-3 py-2 border rounded-lg bg-white"
                                        value={nuevaReunion.departamento}
                                        onChange={e => setNuevaReunion({...nuevaReunion, departamento: e.target.value})}
                                    >
                                        {Object.keys(DEPARTAMENTOS_MUNICIPIOS).sort().map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Municipio</label>
                                    <select className="w-full px-3 py-2 border rounded-lg bg-white"
                                        value={nuevaReunion.municipio}
                                        onChange={e => setNuevaReunion({...nuevaReunion, municipio: e.target.value})}
                                    >
                                        {municipiosOptions.map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Barrio</label>
                                    <input type="text" required className="w-full px-3 py-2 border rounded-lg"
                                        value={nuevaReunion.barrio} onChange={e => setNuevaReunion({...nuevaReunion, barrio: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Comuna (Opcional)</label>
                                    <input type="text" className="w-full px-3 py-2 border rounded-lg"
                                        value={nuevaReunion.comuna} onChange={e => setNuevaReunion({...nuevaReunion, comuna: e.target.value})} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                                <input type="text" className="w-full px-3 py-2 border rounded-lg"
                                    value={nuevaReunion.direccion} onChange={e => setNuevaReunion({...nuevaReunion, direccion: e.target.value})} 
                                    placeholder="Calle 123 # 45-67" />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setModalAbierto(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                                <button type="submit" className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium">Crear Reunión</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
