import { useState, useEffect } from 'react';
import clienteAxios from '../../lib/cliente-axios';
import { Plus, Trash2, Search, FileSpreadsheet, FileText, Download, CheckSquare, Square, X, UserPlus, Filter } from 'lucide-react';
import { DEPARTAMENTOS_MUNICIPIOS } from '../../lib/colombia-data';

export default function Proyeccion() {
    const [votantes, setVotantes] = useState<any[]>([]);
    const [cargando, setCargando] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    
    // Manual Create Modal
    const [modalAbierto, setModalAbierto] = useState(false);
    const [nuevoVotante, setNuevoVotante] = useState({
        nombre: '', apellido: '', documento: '', telefono: '', email: '', direccion: '',
        departamento: 'Meta', municipio: 'Villavicencio', puestoVotacion: '', mesa: ''
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
        cargarVotantes();
    }, []);

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
                departamento: 'Meta', municipio: 'Villavicencio', puestoVotacion: '', mesa: ''
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
    
    const handleExport = async (type: 'excel' | 'pdf') => {
        try {
             const response = await clienteAxios.get(`/votantes/export/${type}`, { responseType: 'blob' });
             const url = window.URL.createObjectURL(new Blob([response.data]));
             const link = document.createElement('a');
             link.href = url;
             link.setAttribute('download', `mis_votantes.${type === 'excel' ? 'xlsx' : 'pdf'}`);
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

    const filteredVotantes = votantes.filter(v => 
        v.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
        v.apellido.toLowerCase().includes(busqueda.toLowerCase()) ||
        v.documento.includes(busqueda)
    );

    return (
        <div className="p-8 max-w-7xl mx-auto">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Mis Votantes</h1>
                    <p className="text-gray-500 mt-1">Proyección electoral y listado fijo</p>
                </div>
                <div className="flex flex-wrap gap-2">
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
                        <Plus className="w-5 h-5" /> Nuevo Votante
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex items-center gap-4">
                 <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o cédula..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                </div>
                <div className="text-sm text-gray-500">
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
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No hay votantes registrados</td></tr>
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
                            <h2 className="text-xl font-bold text-gray-900">{votanteEditar ? 'Editar Votante' : 'Nuevo Votante'}</h2>
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
                                    <label className="text-sm font-medium text-gray-700">Municipio</label>
                                    <select className="w-full px-3 py-2 border rounded-lg bg-white" value={nuevoVotante.municipio} onChange={e => setNuevoVotante({...nuevoVotante, municipio: e.target.value})}>
                                        {municipiosOptions.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
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
        </div>
    );
}
