import { useState, useEffect } from 'react';
import clienteAxios from '../../lib/cliente-axios';
import { useAuth } from '../../contexto/ContextoAutenticacion';
import { Plus, Trash2, Calendar, MapPin, Users, Copy, QrCode, Filter } from 'lucide-react'; // Added QrCode and Filter already in previous step? Filter added here
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DEPARTAMENTOS_MUNICIPIOS } from '../../lib/colombia-data';

export default function Reuniones() {
    const { usuario } = useAuth();
    const [reuniones, setReuniones] = useState<any[]>([]);
    const [cargando, setCargando] = useState(false);
    const [modalAbierto, setModalAbierto] = useState(false);
    
    // Coordinator Logic
    const isCoordinador = usuario?.roles?.includes('coordinador') || usuario?.roles?.includes('admin') || usuario?.roles?.includes('god');
    const [lideres, setLideres] = useState<any[]>([]);
    const [filtroLider, setFiltroLider] = useState(''); // For list filtering
    
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
        lugarReferencia: '',
        liderId: '' // For assignment
    });

    const [municipiosOptions, setMunicipiosOptions] = useState<string[]>([]);

    useEffect(() => {
        cargarReuniones();
        if (isCoordinador) {
            cargarLideres();
        }
    }, [isCoordinador, filtroLider]); // Updates when filter changes

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
            const params: any = {};
            if (filtroLider) params.leaderId = filtroLider;
            
            const { data } = await clienteAxios.get('/reuniones', { params });
            setReuniones(data);
        } catch (error) {
            console.error('Error cargando reuniones:', error);
        } finally {
            setCargando(false);
        }
    };

    const cargarLideres = async () => {
        try {
            const { data } = await clienteAxios.get('/usuarios?role=lider');
            setLideres(data);
        } catch (error) {
            console.error('Error cargando lideres:', error);
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
            setModalAbierto(false);
            setNuevaReunion({ 
                nombre: '', fecha: '', hora: '', 
                departamento: 'Meta', municipio: 'Villavicencio', 
                comuna: '', barrio: '', direccion: '', lugarReferencia: '',
                liderId: ''
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

    const descargarQR = async (reunionId: string, codigo: string) => {
        try {
             // Request blob with auth headers (clienteAxios handles auth)
             const response = await clienteAxios.get(`/reuniones/${reunionId}/qr-flyer`, { responseType: 'blob' });
             
             // Extract filename from header
             const contentDisposition = response.headers['content-disposition'];
             let filename = `Flyer_QR_${codigo}.pdf`; // Fallback
             if (contentDisposition) {
                 const filenameMatch = contentDisposition.match(/filename=(.+)/);
                 if (filenameMatch && filenameMatch.length > 1) {
                     filename = filenameMatch[1].replace(/['"]/g, '');
                 }
             }

             const url = window.URL.createObjectURL(new Blob([response.data]));
             const link = document.createElement('a');
             link.href = url;
             link.setAttribute('download', filename);
             document.body.appendChild(link);
             link.click();
             link.remove();
        } catch (error) {
            console.error(error);
            alert('Error descargando el Flyer QR');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mis Reuniones</h1>
                    <p className="text-gray-500">Gestiona tus eventos y asistencia</p>
                </div>
                <div className="flex gap-4 items-center">
                    {isCoordinador && (
                         <div className="relative">
                            <select 
                                className="appearance-none bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                                value={filtroLider}
                                onChange={(e) => setFiltroLider(e.target.value)}
                            >
                                <option value="">Todos los Líderes</option>
                                <option value={usuario?.id}>Mis Reuniones</option>
                                {lideres.filter(l => l.id !== usuario?.id).map((lid: any) => (
                                    <option key={lid.id} value={lid.id}>{lid.nombre} {lid.apellido}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                <Filter className="w-4 h-4" />
                            </div>
                        </div>
                    )}
                    <button 
                        onClick={() => setModalAbierto(true)}
                        className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium"
                    >
                        <Plus className="w-5 h-5" /> Nueva Reunión
                    </button>
                </div>
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
                                    <button onClick={() => descargarQR(reunion.id, reunion.codigo)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="Descargar Flyer QR">
                                        <QrCode className="w-4 h-4" />
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

                            {isCoordinador && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Asignar Líder (Opcional)</label>
                                    <select 
                                        className="w-full px-3 py-2 border rounded-lg bg-white"
                                        value={nuevaReunion.liderId}
                                        onChange={e => setNuevaReunion({...nuevaReunion, liderId: e.target.value})}
                                    >
                                        <option value="">-- Yo mismo ({usuario?.nombre}) --</option>
                                        {lideres.map(lid => (
                                            <option key={lid.id} value={lid.id}>
                                                {lid.nombre} {lid.apellido} - {lid.documento}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">Si seleccionas un líder, la reunión se creará a su nombre.</p>
                                </div>
                            )}
                            
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
