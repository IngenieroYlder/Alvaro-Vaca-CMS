import { useState, useEffect } from 'react';
import clienteAxios from '../../lib/cliente-axios';
import { useAuth } from '../../contexto/ContextoAutenticacion';
import { Plus, Trash2, Search, FileSpreadsheet, FileText, Download, CheckSquare, Square, X, UserPlus, Filter, Upload, FileImage, ExternalLink } from 'lucide-react';
import { DEPARTAMENTOS_MUNICIPIOS } from '../../lib/colombia-data';

export default function Afiliados() {
    const { usuario } = useAuth();
    const isCoordinador = usuario?.roles?.includes('coordinador') || usuario?.roles?.includes('admin') || usuario?.roles?.includes('god');
    
    const [votantes, setVotantes] = useState<any[]>([]);
    const [cargando, setCargando] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    
    const [lideres, setLideres] = useState<any[]>([]);
    const [filtroLider, setFiltroLider] = useState('');

    // Planillas Modal
    const [modalPlanillas, setModalPlanillas] = useState(false);
    const [planillas, setPlanillas] = useState<any[]>([]);
    const [nuevaPlanilla, setNuevaPlanilla] = useState({ liderId: '', descripcion: '', fechaInicio: '', fechaFin: '', file: null as File | null });
    const [uploading, setUploading] = useState(false);
    
    // Manual Create Modal
    const [modalAbierto, setModalAbierto] = useState(false);
    const [nuevoVotante, setNuevoVotante] = useState({
        nombre: '', apellido: '', documento: '', telefono: '', email: '', direccion: '',
        departamento: 'Meta', municipio: 'Villavicencio', comuna: '', puestoVotacion: '', mesa: ''
    });
    const [municipiosOptions, setMunicipiosOptions] = useState<string[]>([]);
    const [votanteEditar, setVotanteEditar] = useState<any | null>(null);

    // Import Modal
    const [modalImportar, setModalImportar] = useState(false);
    const [asistentesDisponibles, setAsistentesDisponibles] = useState<any[]>([]);
    const [busquedaImportar, setBusquedaImportar] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [cargandoImportar, setCargandoImportar] = useState(false);

    useEffect(() => {
        if (isCoordinador) {
            cargarVotantes();
            cargarLideres();
        }
    }, [isCoordinador]); // Load only if privileged

    // Restriction Check
    if (!isCoordinador) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
               <div className="bg-red-50 p-6 rounded-full mb-4">
                 <Filter className="w-12 h-12 text-red-500" />
               </div>
               <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Restringido</h2>
               <p className="text-gray-500 max-w-md">Solo los coordinadores y administradores tienen acceso al módulo de gestión de afiliados y planillas.</p>
            </div>
        );
    }

    useEffect(() => {
        if (nuevoVotante.departamento) {
            setMunicipiosOptions(DEPARTAMENTOS_MUNICIPIOS[nuevoVotante.departamento] || []);
            // Only reset if current selection is invalid AND we are active (not empty string which might happen on reset)
            const currentMunis = DEPARTAMENTOS_MUNICIPIOS[nuevoVotante.departamento] || [];
             if (nuevoVotante.municipio && !currentMunis.includes(nuevoVotante.municipio)) {
                setNuevoVotante(prev => ({ ...prev, municipio: currentMunis[0] || '' }));
            }
        }
    }, [nuevoVotante.departamento]);

    const cargarVotantes = async () => {
        setCargando(true);
        try {
            const { data } = await clienteAxios.get('/votantes');
            setVotantes(data);
        } catch (error) {
            console.error('Error cargando votantes:', error);
        } finally {
            setCargando(false);
        }
    };

    const cargarAsistentesUnicos = async () => {
        setCargandoImportar(true);
        try {
            // Fetch unique attendees from my meetings
            // Assuming the endpoint '/reuniones/unique' gives me what I need (filtered by my meetings if I am leader)
            const { data } = await clienteAxios.get('/reuniones/unique'); 
            // Filter out those who are already in my 'votantes' list to avoid confusion?
            // Or just let backend handle duplicates. Let's filter client side for better UX.
            const existingDocs = new Set(votantes.map(v => v.documento));
            const available = data.filter((a: any) => a.documento && !existingDocs.has(a.documento));
            
            setAsistentesDisponibles(available);
        } catch (error) {
            console.error('Error cargando asistentes:', error);
            alert('Error cargando asistentes para importar');
        } finally {
            setCargandoImportar(false);
        }
    };

    const handleGuardarVotante = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (votanteEditar) {
                 await clienteAxios.patch(`/votantes/${votanteEditar.id}`, nuevoVotante);
            } else {
                 await clienteAxios.post('/votantes', nuevoVotante);
            }
            setModalAbierto(false);
            setVotanteEditar(null);
            setNuevoVotante({
                nombre: '', apellido: '', documento: '', telefono: '', email: '', direccion: '',
                departamento: 'Meta', municipio: 'Villavicencio', comuna: '', puestoVotacion: '', mesa: ''
            });
            cargarVotantes();
            alert('Votante guardado correctamente');
        } catch (error: any) {
            alert('Error guardando: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleImportarSeleccionados = async () => {
        if (selectedIds.size === 0) return;
        try {
            await clienteAxios.post('/votantes/importar', { attendeeIds: Array.from(selectedIds) });
            setModalImportar(false);
            setSelectedIds(new Set());
            cargarVotantes();
            alert('Asistentes importados correctamente');
        } catch (error) {
             alert('Error importando');
        }
    };

    const handleEdit = (votante: any) => {
        setVotanteEditar(votante);
        setNuevoVotante({
            nombre: votante.nombre,
            apellido: votante.apellido,
            documento: votante.documento,
            telefono: votante.telefono || '',
            email: votante.email || '',
            direccion: votante.direccion || '',
            departamento: votante.departamento,
            municipio: votante.municipio,
            comuna: votante.comuna || '',
            puestoVotacion: votante.puestoVotacion || '',
            mesa: votante.mesa || ''
        });
        setModalAbierto(true);
    };

    const handleDelete = async (id: string) => {
        if(!confirm('¿Eliminar este votante?')) return;
        try {
            await clienteAxios.delete(`/votantes/${id}`);
            setVotantes(prev => prev.filter(v => v.id !== id));
        } catch (error) {
            alert('Error al eliminar');
        }
    };
    
    const cargarLideres = async () => {
        try {
            const { data } = await clienteAxios.get('/usuarios?role=lider');
            setLideres(data);
        } catch (error) { console.error(error); }
    };

    const cargarPlanillas = async () => {
        try {
            const params: any = {};
            if (filtroLider) params.leaderId = filtroLider; // Or pass specific leader from modal
            const { data } = await clienteAxios.get('/planillas', { params });
            setPlanillas(data);
        } catch (error) { console.error(error); }
    };

    // Load planillas when modal opens
    useEffect(() => {
        if (modalPlanillas) cargarPlanillas();
    }, [modalPlanillas, filtroLider]);

    const handleUploadPlanilla = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nuevaPlanilla.file || !nuevaPlanilla.liderId) {
            alert('Debes seleccionar un líder y un archivo');
            return;
        }
        
        setUploading(true);
        const formData = new FormData();
        formData.append('file', nuevaPlanilla.file);
        formData.append('liderId', nuevaPlanilla.liderId);
        if (nuevaPlanilla.descripcion) formData.append('descripcion', nuevaPlanilla.descripcion);
        if (nuevaPlanilla.fechaInicio) formData.append('fechaInicio', nuevaPlanilla.fechaInicio);
        if (nuevaPlanilla.fechaFin) formData.append('fechaFin', nuevaPlanilla.fechaFin);

        try {
            await clienteAxios.post('/planillas/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Planilla subida exitosamente');
            alert('Planilla subida exitosamente');
            setNuevaPlanilla({ liderId: '', descripcion: '', fechaInicio: '', fechaFin: '', file: null });
            cargarPlanillas();
            cargarPlanillas();
        } catch (error: any) {
             alert('Error subiendo planilla: ' + (error.response?.data?.message || error.message));
        } finally {
            setUploading(false);
        }
    };
    
    // Original Export Function
    const handleExport = async (type: 'excel' | 'pdf') => {
        try {
             // Pass current filters if needed? Backend endpoint might not support it yet.
             // Standard endpoint exports ALL my votantes.
             const response = await clienteAxios.get(`/votantes/export/${type}`, { responseType: 'blob' });
             const url = window.URL.createObjectURL(new Blob([response.data]));
             const link = document.createElement('a');
             link.href = url;
             link.setAttribute('download', `mis_afiliados.${type === 'excel' ? 'xlsx' : 'pdf'}`);
             document.body.appendChild(link);
             link.click();
             link.remove();
        } catch (error) {
            alert('Error exportando');
        }
    };

    // Filters for Import Modal
    const asistentesFiltrados = asistentesDisponibles.filter(a => 
        (a.nombre?.toLowerCase().includes(busquedaImportar.toLowerCase()) || 
         a.documento?.includes(busquedaImportar))
    );

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const filteredVotantes = votantes.filter(v => {
        const matchSearch = v.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
                            v.apellido.toLowerCase().includes(busqueda.toLowerCase()) ||
                            v.documento.includes(busqueda);
        const matchLeader = !filtroLider || (v.lider && v.lider.id === filtroLider);
        return matchSearch && matchLeader;
    });

    return (
        <div className="p-8 max-w-7xl mx-auto">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Gestión de Afiliados</h1>
                    <p className="text-gray-500 mt-1">Base de datos de votantes y planillas</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => setModalPlanillas(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">
                        <Upload className="w-5 h-5" /> Planillas
                    </button>
                    <button onClick={() => handleExport('excel')} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg shadow-emerald-600/20 active:scale-95 transition-all">
                        <FileSpreadsheet className="w-5 h-5" /> Excel
                    </button>
                    <button onClick={() => handleExport('pdf')} className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg shadow-rose-600/20 active:scale-95 transition-all">
                        <FileText className="w-5 h-5" /> PDF
                    </button>
                    <button onClick={() => { cargarAsistentesUnicos(); setModalImportar(true); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-600/20 active:scale-95 transition-all">
                        <Download className="w-5 h-5" /> Importar
                    </button>
                    <button onClick={() => { setVotanteEditar(null); setModalAbierto(true); }} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/20 active:scale-95 transition-all">
                        <Plus className="w-5 h-5" /> Nuevo Afiliado
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row items-center gap-4">
                 <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o cédula..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                </div>
                
                <div className="relative w-full md:w-64">
                    <select 
                        className="w-full appearance-none bg-white border border-gray-200 text-gray-700 py-2 pl-4 pr-10 rounded-lg leading-tight focus:outline-none focus:border-primary"
                        value={filtroLider}
                        onChange={(e) => setFiltroLider(e.target.value)}
                    >
                        <option value="">Todos los Líderes</option>
                        {lideres.map(l => (
                            <option key={l.id} value={l.id}>{l.nombre} {l.apellido}</option>
                        ))}
                    </select>
                     <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                        <Filter className="w-4 h-4" />
                    </div>
                </div>

                <div className="text-sm text-gray-500 whitespace-nowrap min-w-fit">
                    Total: <span className="font-bold text-gray-900">{filteredVotantes.length}</span>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                         <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-medium">
                                <th className="px-6 py-4">Nombre Completo</th>
                                <th className="px-6 py-4">Cédula</th>
                                <th className="px-6 py-4">Contacto</th>
                                <th className="px-6 py-4">Ubicación</th>
                                <th className="px-6 py-4">Puesto Votación</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {cargando ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">Cargando...</td></tr>
                            ) : filteredVotantes.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No hay afiliados registrados con estos criterios</td></tr>
                            ) : (
                                filteredVotantes.map(v => (
                                    <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">{v.nombre} {v.apellido}</td>
                                        <td className="px-6 py-4 text-gray-600 font-mono">{v.documento}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {v.telefono && <div>{v.telefono}</div>}
                                            {v.email && <div className="text-xs text-gray-500">{v.email}</div>}
                                            {v.direccion && <div className="text-xs text-gray-400">{v.direccion}</div>}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {v.municipio}, {v.departamento}
                                            {v.comuna && <div className="text-xs text-gray-500 font-medium">Comuna: {v.comuna}</div>}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {v.puestoVotacion || '-'}
                                            {v.mesa && <span className="text-xs text-gray-400 ml-1">(Mesa: {v.mesa})</span>}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => handleEdit(v)} className="text-blue-600 hover:text-blue-800 mr-3 font-medium text-sm">Editar</button>
                                            <button onClick={() => handleDelete(v.id)} className="text-red-600 hover:text-red-800 font-medium text-sm">Eliminar</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {modalAbierto && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                     <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-900">{votanteEditar ? 'Editar Afiliado' : 'Nuevo Afiliado'}</h2>
                            <button onClick={() => setModalAbierto(false)}><X className="text-gray-400 hover:text-gray-600" /></button>
                        </div>
                        <form onSubmit={handleGuardarVotante} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Nombre</label>
                                    <input type="text" required className="w-full px-3 py-2 border rounded-lg" value={nuevoVotante.nombre} onChange={e => setNuevoVotante({...nuevoVotante, nombre: e.target.value})} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Apellido</label>
                                    <input type="text" required className="w-full px-3 py-2 border rounded-lg" value={nuevoVotante.apellido} onChange={e => setNuevoVotante({...nuevoVotante, apellido: e.target.value})} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Cédula</label>
                                <input type="text" required className="w-full px-3 py-2 border rounded-lg" value={nuevoVotante.documento} onChange={e => setNuevoVotante({...nuevoVotante, documento: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Celular</label>
                                    <input type="text" className="w-full px-3 py-2 border rounded-lg" value={nuevoVotante.telefono} onChange={e => setNuevoVotante({...nuevoVotante, telefono: e.target.value})} />
                                </div>
                                <div className="space-y-1">
                                     <label className="text-sm font-medium text-gray-700">Correo Electrónico</label>
                                    <input type="email" className="w-full px-3 py-2 border rounded-lg" value={nuevoVotante.email} onChange={e => setNuevoVotante({...nuevoVotante, email: e.target.value})} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Dirección</label>
                                <input type="text" className="w-full px-3 py-2 border rounded-lg" value={nuevoVotante.direccion} onChange={e => setNuevoVotante({...nuevoVotante, direccion: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Departamento</label>
                                    <select className="w-full px-3 py-2 border rounded-lg bg-white" value={nuevoVotante.departamento} onChange={e => setNuevoVotante({...nuevoVotante, departamento: e.target.value})}>
                                        {Object.keys(DEPARTAMENTOS_MUNICIPIOS).sort().map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <select className="w-full px-3 py-2 border rounded-lg bg-white" value={nuevoVotante.municipio} onChange={e => setNuevoVotante({...nuevoVotante, municipio: e.target.value})}>
                                        {municipiosOptions.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Comuna (Opcional)</label>
                                <input type="text" className="w-full px-3 py-2 border rounded-lg" value={nuevoVotante.comuna} onChange={e => setNuevoVotante({...nuevoVotante, comuna: e.target.value})} placeholder="Ej: Comuna 5" />
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Puesto Votación</label>
                                    <input type="text" className="w-full px-3 py-2 border rounded-lg" value={nuevoVotante.puestoVotacion} onChange={e => setNuevoVotante({...nuevoVotante, puestoVotacion: e.target.value})} />
                                </div>
                                <div className="space-y-1">
                                     <label className="text-sm font-medium text-gray-700">Mesa</label>
                                    <input type="text" className="w-full px-3 py-2 border rounded-lg" value={nuevoVotante.mesa} onChange={e => setNuevoVotante({...nuevoVotante, mesa: e.target.value})} />
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end gap-2">
                                <button type="button" onClick={() => setModalAbierto(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                                <button type="submit" className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            {modalImportar && (
               <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-3xl h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Importar Asistentes</h2>
                                <p className="text-sm text-gray-500">Selecciona los asistentes de tus reuniones para añadirlos a tu lista.</p>
                            </div>
                            <button onClick={() => setModalImportar(false)}><X className="text-gray-400 hover:text-gray-600" /></button>
                        </div>
                        
                        <div className="p-4 border-b border-gray-100 bg-white flex items-center gap-4 flex-shrink-0">
                             <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre o cédula..."
                                    value={busquedaImportar}
                                    onChange={(e) => setBusquedaImportar(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                />
                            </div>
                            <div className="text-sm font-medium text-gray-700">
                                {selectedIds.size} seleccionados
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-0">
                             {cargandoImportar ? (
                                <div className="text-center py-20 text-gray-400">Cargando asistentes...</div>
                            ) : asistentesFiltrados.length === 0 ? (
                                <div className="text-center py-20 text-gray-400">No se encontraron asistentes con ese criterio</div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">
                                            </th>
                                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cédula</th>
                                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Teléfono</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                    {asistentesFiltrados.map(asistente => {
                                        const isSelected = selectedIds.has(asistente.id);
                                        return (
                                            <tr key={asistente.id} className={`hover:bg-gray-50 cursor-pointer transition-colors ${isSelected ? 'bg-primary/5' : ''}`} onClick={() => toggleSelection(asistente.id)}>
                                                <td className="px-6 py-3 text-center">
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary text-white' : 'border-gray-300 bg-white'}`}>
                                                        {isSelected && <CheckSquare className="w-3.5 h-3.5" />}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 text-sm font-medium text-gray-900">{asistente.nombre} {asistente.apellido}</td>
                                                <td className="px-6 py-3 text-sm text-gray-500 font-mono">{asistente.documento}</td>
                                                <td className="px-6 py-3 text-sm text-gray-500">{asistente.telefono}</td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 flex-shrink-0">
                            <button onClick={() => setModalImportar(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Cancelar</button>
                            <button 
                                onClick={handleImportarSeleccionados} 
                                disabled={selectedIds.size === 0}
                                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <UserPlus className="w-4 h-4" />
                                Importar {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
                            </button>
                        </div>
                    </div>
               </div> 
            )} 
            {/* Planillas Modal */}
            {modalPlanillas && (
                 <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-900">Gestión de Planillas</h2>
                            <button onClick={() => setModalPlanillas(false)}><X className="text-gray-400 hover:text-gray-600" /></button>
                        </div>
                        
                        <div className="flex-1 flex overflow-hidden">
                            {/* Left: List */}
                            <div className="w-1/2 border-r border-gray-100 p-4 overflow-y-auto bg-gray-50/30">
                                <h3 className="font-bold text-gray-700 mb-3">Planillas Subidas</h3>
                                {planillas.length === 0 ? (
                                    <p className="text-sm text-gray-500 italic">No hay planillas para mostrar.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {planillas.map(p => (
                                            <div key={p.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex items-start gap-3">
                                                    <div className="bg-blue-50 p-2 rounded text-blue-600">
                                                        <FileImage className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">{p.nombreOriginal}</p>
                                                        <p className="text-xs text-gray-500">Líder: {p.lider?.nombre} {p.lider?.apellido}</p>
                                                        <p className="text-xs text-gray-400">{new Date(p.fechaCarga).toLocaleDateString()}</p>
                                                    </div>
                                                    <a href={clienteAxios.defaults.baseURL?.replace('/api', '') + p.url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-primary">
                                                        <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Right: Upload Form */}
                            <div className="w-1/2 p-6 overflow-y-auto">
                                <h3 className="font-bold text-gray-700 mb-4">Subir Nueva Planilla</h3>
                                <form onSubmit={handleUploadPlanilla} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar Líder</label>
                                        {/* Simple Search Filter for Leader Select */}
                                        <input 
                                            type="text" 
                                            placeholder="Buscar líder por nombre o cédula..." 
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg mb-2 text-sm"
                                            onChange={(e) => {
                                                // Filter logic handled in render, but for simplicity let's stick to native select or filtered options
                                                // Wait, I can't easily change the map below without state.
                                                // I'll add a state for 'leaderSearch' in Planillas context
                                            }}
                                            // Actually, let's implement the state update
                                            onInput={(e: any) => {
                                                const val = e.target.value.toLowerCase();
                                                const options = document.getElementById('leader-select-options') as HTMLSelectElement;
                                                if(options) {
                                                    Array.from(options.options).forEach(opt => {
                                                        if(opt.value === "") return; // Skip placeholder
                                                        const text = opt.text.toLowerCase();
                                                        // We can't hide options in all browsers easily, but we can try
                                                        if(text.includes(val)) {
                                                            opt.style.display = 'block';
                                                        } else {
                                                            opt.style.display = 'none';
                                                        }
                                                    })
                                                }
                                            }}
                                        />
                                        <select 
                                            id="leader-select-options"
                                            className="w-full px-3 py-2 border rounded-lg bg-white"
                                            required
                                            value={nuevaPlanilla.liderId}
                                            onChange={e => setNuevaPlanilla({...nuevaPlanilla, liderId: e.target.value})}
                                        >
                                            <option value="">-- Seleccionar --</option>
                                            {lideres.map(l => (
                                                <option key={l.id} value={l.id}>{l.nombre} {l.apellido} - CC: {l.documento}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                                            <input 
                                                type="date"
                                                className="w-full px-3 py-2 border rounded-lg"
                                                value={nuevaPlanilla.fechaInicio}
                                                onChange={e => setNuevaPlanilla({...nuevaPlanilla, fechaInicio: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                                            <input 
                                                type="date"
                                                className="w-full px-3 py-2 border rounded-lg"
                                                value={nuevaPlanilla.fechaFin}
                                                onChange={e => setNuevaPlanilla({...nuevaPlanilla, fechaFin: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (Opcional)</label>
                                        <input 
                                            type="text" 
                                            className="w-full px-3 py-2 border rounded-lg"
                                            value={nuevaPlanilla.descripcion}
                                            onChange={e => setNuevaPlanilla({...nuevaPlanilla, descripcion: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Archivo (Imagen/PDF)</label>
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                                            <input 
                                                type="file" 
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                accept="image/*,application/pdf"
                                                onChange={e => setNuevaPlanilla({...nuevaPlanilla, file: e.target.files ? e.target.files[0] : null})} 
                                            />
                                            <div className="pointer-events-none">
                                                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                                <p className="text-sm text-gray-500">
                                                    {nuevaPlanilla.file ? nuevaPlanilla.file.name : 'Click o arrastra archivo aquí'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        type="submit" 
                                        disabled={uploading}
                                        className="w-full py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium disabled:opacity-50"
                                    >
                                        {uploading ? 'Subiendo...' : 'Subir Planilla'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                 </div>
            )}
        </div>
    );
}
