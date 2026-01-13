import { useState, useEffect } from 'react';
import clienteAxios from '../../lib/cliente-axios';
import { Plus, Trash2, Calendar, MapPin, Users, Copy, QrCode } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Reuniones() {
    const [reuniones, setReuniones] = useState<any[]>([]);
    const [cargando, setCargando] = useState(false);
    const [modalAbierto, setModalAbierto] = useState(false);
    
    // Formulario crear
    const [nuevaReunion, setNuevaReunion] = useState({
        nombre: '',
        fecha: '',
        hora: '',
        municipio: '',
        comuna: '',
        barrio: '',
        direccion: '',
        lugarReferencia: ''
    });

    useEffect(() => {
        cargarReuniones();
    }, []);

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
            setNuevaReunion({ nombre: '', fecha: '', hora: '', municipio: '', comuna: '', barrio: '', direccion: '', lugarReferencia: '' });
            cargarReuniones();
            alert('Reunión creada exitosamente');
        } catch (error: any) {
            alert('Error creando reunión: ' + (error.response?.data?.message || error.message));
        }
    };

    const eliminarReunion = async (id: string) => {
        if (!confirm('¿Seguro que deseas eliminar esta reunión?')) return;
        try {
            await clienteAxios.delete(`/reuniones/${id}`);
            setReuniones(reuniones.filter(r => r.id !== id));
        } catch (error) {
            alert('Error eliminando reunión');
        }
    };

    const copiarEnlace = (codigo: string) => {
        const url = `${window.location.origin}/reuniones/${codigo}`; // O la URL pública de registro
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
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => copiarEnlace(reunion.codigo)} className="p-2 text-gray-400 hover:text-primary hover:bg-gray-50 rounded" title="Copiar Enlace">
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
                                <button className="flex-1 text-center py-2 text-sm text-gray-600 hover:bg-gray-50 rounded border border-gray-200">
                                    Ver QR
                                </button>
                                <button className="flex-1 text-center py-2 text-sm text-white bg-gray-900 hover:bg-black rounded">
                                    Registrar Asistente
                                </button>
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
                    <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                            <h2 className="text-lg font-bold">Nueva Reunión</h2>
                        </div>
                        <form onSubmit={crearReunion} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del evento</label>
                                <input type="text" required className="w-full px-3 py-2 border rounded-lg" 
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Municipio</label>
                                    <input type="text" required className="w-full px-3 py-2 border rounded-lg"
                                        value={nuevaReunion.municipio} onChange={e => setNuevaReunion({...nuevaReunion, municipio: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Barrio</label>
                                    <input type="text" required className="w-full px-3 py-2 border rounded-lg"
                                        value={nuevaReunion.barrio} onChange={e => setNuevaReunion({...nuevaReunion, barrio: e.target.value})} />
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
