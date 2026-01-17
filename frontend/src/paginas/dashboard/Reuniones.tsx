import { useState, useEffect } from 'react';
import clienteAxios from '../../lib/cliente-axios';
import { useAuth } from '../../contexto/ContextoAutenticacion';
import { Plus, Trash2, Calendar, MapPin, Users, Copy, QrCode, Filter, Search } from 'lucide-react'; // Added QrCode and Filter already in previous step? Filter added here
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
    const [busquedaLider, setBusquedaLider] = useState(''); // Text input for leader search
    const [fechaFiltro, setFechaFiltro] = useState('all'); // today, week, month, all
    
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
    }, [isCoordinador, filtroLider, fechaFiltro]); // Updates when filter changes

    // ... (rest of code) ...

}

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
            
            // Date Logic
            const now = new Date();
            if (fechaFiltro === 'today') {
                params.dateStart = new Date(now.setHours(0,0,0,0)).toISOString();
                params.dateEnd = new Date(now.setHours(23,59,59,999)).toISOString();
            } else if (fechaFiltro === 'week') {
                const firstDay = now.getDate() - now.getDay();
                params.dateStart = new Date(now.setDate(firstDay)).toISOString();
                params.dateEnd = new Date().toISOString(); 
            } else if (fechaFiltro === 'month') {
                params.dateStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
                params.dateEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
            }

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

    // WhatsApp Modal
    const [modalWhatsApp, setModalWhatsApp] = useState<{ open: boolean; reunion: any | null; numero: string }>({ open: false, reunion: null, numero: '' });

    const handleWhatsAppShare = (reunion: any) => {
        setModalWhatsApp({ open: true, reunion, numero: '' });
    };

    const enviarWhatsApp = (e: React.FormEvent) => {
        e.preventDefault();
        const { reunion, numero } = modalWhatsApp;
        if (!reunion) return;

        const url = `${window.location.origin}/reuniones/formulario/${reunion.codigo}`;
        const mensaje = `¡Hola! Te invito a visitar mi página web https://alvarovaca.com.co y conocer mis propuestas. Apóyame en el Senado con el #75 en el tarjetón del Partido Alianza Verde. \n\nPara registrar tu asistencia a nuestra reunión, ingresa aquí: ${url} \n\n¡Gracias por tu apoyo!`;
        
        const encodedMsg = encodeURIComponent(mensaje);
        let waLink = '';
        
        if (numero && numero.trim() !== '') {
             // Clean number (remove non-digits)
             const cleanNum = numero.replace(/\D/g, '');
             // Ensure it has 57 prefix if not present (assuming Colombian for now or user inputs it)
             // User input "310..." -> "57310..."
             const finalNum = cleanNum.startsWith('57') ? cleanNum : `57${cleanNum}`;
             waLink = `https://wa.me/${finalNum}?text=${encodedMsg}`;
        } else {
             // Direct share to contact selection
             waLink = `https://wa.me/?text=${encodedMsg}`;
        }
        
        window.open(waLink, '_blank');
        setModalWhatsApp({ open: false, reunion: null, numero: '' });
    };

    const copiarCodigo = (codigo: string) => {
        navigator.clipboard.writeText(codigo);
        alert(`Código ${codigo} copiado al portapapeles`);
    };

    return (
        <div>
            {/* ... (Header remains same) ... */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mis Reuniones</h1>
                    <p className="text-gray-500">Gestiona tus eventos y asistencia</p>
                </div>
                <div className="flex gap-4 items-center">
                    {isCoordinador && (
                         <div className="flex flex-col sm:flex-row gap-3 items-center">
                            {/* Date Quick Filters */}
                            <div className="flex gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
                                <button onClick={() => setFechaFiltro('today')} className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${fechaFiltro === 'today' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'}`}>Hoy</button>
                                <button onClick={() => setFechaFiltro('week')} className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${fechaFiltro === 'week' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'}`}>Semana</button>
                                <button onClick={() => setFechaFiltro('month')} className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${fechaFiltro === 'month' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'}`}>Mes</button>
                                <button onClick={() => setFechaFiltro('all')} className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${fechaFiltro === 'all' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'}`}>Todos</button>
                            </div>

                             {/* Searchable Leader Select - Simulated with a Datalist or just a filtered Select */}
                             <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                                <input 
                                    type="text" 
                                    placeholder="Buscar líder..."
                                    className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                    list="leaders-list"
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        // Find ID by name? Datalist sends value. 
                                        // Better UX: Show names in list, but we need ID. 
                                        // If using native datalist, the input value is what user sees.
                                        // Let's us a smarter approach: Filter state for the dropdown below.
                                        setBusquedaLider(val);
                                    }}
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                     <Filter className="w-4 h-4 text-gray-400" />
                                </div>
                                
                                {busquedaLider && (
                                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-60 overflow-y-auto z-10">
                                        <div 
                                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                                            onClick={() => { setFiltroLider(''); setBusquedaLider(''); }}
                                        >
                                            Todos los Líderes
                                        </div>
                                         <div 
                                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm font-medium text-primary"
                                            onClick={() => { setFiltroLider(usuario?.id); setBusquedaLider('Mis Reuniones'); }}
                                        >
                                            Mis Reuniones
                                        </div>
                                        {lideres
                                          .filter(l => l.nombre.toLowerCase().includes(busquedaLider.toLowerCase()) || l.apellido.toLowerCase().includes(busquedaLider.toLowerCase()) || l.documento.includes(busquedaLider))
                                          .map(l => (
                                            <div 
                                                key={l.id} 
                                                className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm border-t border-gray-50"
                                                onClick={() => { 
                                                    setFiltroLider(l.id); 
                                                    setBusquedaLider(`${l.nombre} ${l.apellido}`); // Update input to show selection
                                                }}
                                            >
                                                <span className="font-medium text-gray-900">{l.nombre} {l.apellido}</span>
                                                <span className="block text-xs text-gray-500">{l.documento}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
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
                                    <button onClick={() => copiarCodigo(reunion.codigo)} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded" title="Copiar Solo Código">
                                         <Copy className="w-4 h-4" />
                                    </button>
                                     {/* Original 'Copiar Enlace' kept per user request? User asked for 'copiar solo codigo' AND 'copiar enlace' wasn't explicitly removable but 'eliminemos esa palabra flyer' suggests refining. Keeping old copy link too if useful, but maybe redundant if we have manual link button? Let's keep existing Actions (Trash, QR) but add new ones.*/}
                                     {/* Wait, user said: "al lado de descargar qr, y copiar enlace de registro y de eliminar, crea otro icono para copiar solo el codigo" -> So KEEP ALL + Add Code Copy */}
                                    <button onClick={() => copiarEnlace(reunion.codigo)} className="p-2 text-gray-400 hover:text-primary hover:bg-gray-50 rounded" title="Copiar Enlace Registro">
                                         {/* Using a different icon for Link vs Code might be better, but Copy is fine for both with tooltip */}
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-link"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                                    </button>
                                    <button onClick={() => descargarQR(reunion.id, reunion.codigo)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="Descargar QR de la reunión">
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

                            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
                                {/* 50% width button */}
                                <a href={`/reuniones/formulario/${reunion.codigo}`} target="_blank" rel="noreferrer" className="w-1/2 text-center py-2 text-sm text-gray-600 hover:bg-gray-50 rounded border border-gray-200 font-medium transition-colors">
                                    Ver Formulario
                                </a>
                                
                                {/* 50% space for icons aligned right */}
                                <div className="w-1/2 flex justify-end gap-2">
                                     <a href="/reuniones/registro" target="_blank" rel="noreferrer" className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Registro Manual (Digitar Código)">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clipboard-list"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>
                                     </a>
                                     <button onClick={() => handleWhatsAppShare(reunion)} className="p-2 text-gray-500 hover:text-green-500 hover:bg-green-50 rounded transition-colors" title="Compartir por WhatsApp">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
                                     </button>
                                </div>
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
                     {/* ... (Existing Create Modal Content - kept same logic via component structure or just verifying it isn't lost here if I replace whole file? I am replacing 'return' block onwards. I need to make sure I don't lose the modal content.
                      Wait, the replacement block starts at `// WhatsApp Modal` which is inserted BEFORE the return, and then replaces the return block.
                      So I need to include the Create Modal JSX in the replacement content at the end.
                      */}
                    <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                            <h2 className="text-lg font-bold">Nueva Reunión</h2>
                        </div>
                        <form onSubmit={crearReunion} className="p-6 space-y-4">
                             {/* ... Inputs ... I will copy them back or use Previous content ...
                             I'll try to preserve existing modal code by pasting it in. */}
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

             {/* Modal WhatsApp */}
             {modalWhatsApp.open && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-gray-900 mb-2">Compartir por WhatsApp</h2>
                        <p className="text-sm text-gray-500 mb-4">Ingresa el número celular para enviar la invitación directamente. Si lo dejas vacío, podrás seleccionar el contacto en WhatsApp.</p>
                        
                        <form onSubmit={enviarWhatsApp}>
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Número Celular (+57)</label>
                                <input 
                                    type="tel" 
                                    placeholder="Ej: 300 123 4567" 
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none text-lg"
                                    value={modalWhatsApp.numero}
                                    onChange={e => setModalWhatsApp({...modalWhatsApp, numero: e.target.value})}
                                    autoFocus
                                />
                            </div>
                            
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setModalWhatsApp({ ...modalWhatsApp, open: false })} className="px-3 py-2 text-gray-500 hover:bg-gray-100 rounded-lg font-medium">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium flex items-center gap-2">
                                    Enviar
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
             )}
        </div>
    );
}
