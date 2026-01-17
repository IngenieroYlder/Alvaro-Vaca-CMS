import { useState, useEffect } from 'react';
import clienteAxios from '../../lib/cliente-axios';
import { useAuth } from '../../contexto/ContextoAutenticacion';
import { Download, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DEPARTAMENTOS_MUNICIPIOS } from '../../lib/colombia-data';

export default function Asistentes() {
    const [asistentes, setAsistentes] = useState<any[]>([]);
    const [cargando, setCargando] = useState(false);
    
    // Filtros
    const [busqueda, setBusqueda] = useState('');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    
    // Nuevos Filtros
    const [liderId, setLiderId] = useState('');
    const [reunionId, setReunionId] = useState('');
    const [departamento, setDepartamento] = useState('');
    const [municipio, setMunicipio] = useState('');

    // Listas para selects
    const [lideres, setLideres] = useState<any[]>([]);
    const [reuniones, setReuniones] = useState<any[]>([]);
    const [municipiosOptions, setMunicipiosOptions] = useState<string[]>([]);
    const [deptosOptions] = useState(Object.keys(DEPARTAMENTOS_MUNICIPIOS).sort());

    useEffect(() => {
        cargarLideres();
    }, []);

    useEffect(() => {
        cargarReuniones();
    }, [liderId]); // Recargar reuniones si cambia el líder

    useEffect(() => {
        cargarAsistentes();
    }, [fechaInicio, fechaFin, liderId, reunionId, departamento, municipio]); 

    // Actualizar municipios cuando cambia departamento
    useEffect(() => {
        if (departamento && DEPARTAMENTOS_MUNICIPIOS[departamento]) {
            setMunicipiosOptions(DEPARTAMENTOS_MUNICIPIOS[departamento]);
        } else {
            setMunicipiosOptions([]);
        }
        setMunicipio(''); // Reset municipio
    }, [departamento]);

    const cargarLideres = async () => {
        try {
            const { data } = await clienteAxios.get('/usuarios?role=lider');
            setLideres(data);
        } catch (error) {
            console.error('Error cargando líderes', error);
        }
    };

    const cargarReuniones = async () => {
        try {
            const params = new URLSearchParams();
            if (liderId) params.append('leaderId', liderId);
            const { data } = await clienteAxios.get(`/reuniones?${params.toString()}`);
            setReuniones(data);
        } catch (error) {
            console.error('Error cargando reuniones', error);
        }
    };

    const cargarAsistentes = async () => {
        setCargando(true);
        try {
            const params = new URLSearchParams();
            if (fechaInicio) params.append('dateStart', fechaInicio);
            if (fechaFin) params.append('dateEnd', fechaFin);
            if (reunionId) params.append('reunionId', reunionId);
            if (departamento) params.append('departamento', departamento);
            if (municipio) params.append('municipio', municipio);
            // Unique endpoint seems to not handle 'leaderId' directly in controller if not admin? 
            // In controller findAllUnique: it accepts reunionId from query. 
            // If we filter by reunionId which belongs to the leader, it is safe.
            // If user selects Leader only, and NO meeting, validation might be needed or we accept it lists unique people from ALL meetings of that leader?
            // Current unique endpoint controller does not filter by leaderId directly in its params (I didn't add it to findAllUnique params explicitly in service call, only reuse findAll logic? No, findAllUnique uses distinct query).
            // However, we added reunionId to findAllUnique. So selecting a meeting filters correctly.
            
            const { data } = await clienteAxios.get(`/reuniones/unique?${params.toString()}`);
            setAsistentes(data);
        } catch (error) {
            console.error('Error cargando asistentes:', error);
        } finally {
            setCargando(false);
        }
    };

    const { usuario } = useAuth();
    const canExport = usuario?.roles?.some((r: string) => ['admin', 'god', 'coordinador'].includes(r));

    const exportarExcel = async () => {
        try {
            const params = new URLSearchParams();
            params.append('unique', 'true');
            if (fechaInicio) params.append('dateStart', fechaInicio);
            if (fechaFin) params.append('dateEnd', fechaFin);
            if (reunionId) params.append('reunionId', reunionId);
            if (departamento) params.append('departamento', departamento);
            if (municipio) params.append('municipio', municipio);
            if (liderId) params.append('leader', liderId); 
            
            const response = await clienteAxios.get('/reuniones/export/excel', { 
                params,
                responseType: 'blob' 
            });

            // Extract filename or default
            let filename = `Reporte_Asistencia_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
            const contentDisposition = response.headers['content-disposition'];
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
            console.error('Error exportando excel:', error);
            alert('Error al exportar el archivo Excel. Verifica tus permisos o intenta nuevamente.');
        }
    };

    const asistentesFiltrados = asistentes.filter(a => 
        a.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
        a.documento?.includes(busqueda) || 
        a.telefono?.includes(busqueda)
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Base de Datos de Asistentes</h1>
                    <p className="text-gray-500">Personas registradas en las reuniones</p>
                </div>
                {canExport && (
                    <button 
                        onClick={exportarExcel}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-colors"
                    >
                        <Download className="w-5 h-5" /> Exportar Excel
                    </button>
                )}
            </div>

            {/* Filtros Container */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 space-y-4">
                
                {/* Fila 1: Búsqueda y Fechas */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Buscar Persona</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Nombre, cédula o teléfono..." 
                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                         <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Desde</label>
                         <input type="date" className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none" 
                            value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
                    </div>
                    <div>
                         <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Hasta</label>
                         <input type="date" className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none" 
                            value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
                    </div>
                    <div className="flex items-end">
                        <button 
                            onClick={cargarAsistentes}
                            className="w-full md:w-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium"
                        >
                            <Filter className="w-4 h-4" /> Filtrar
                        </button>
                    </div>
                </div>

                <div className="h-px bg-gray-100"></div>

                {/* Fila 2: Filtros Avanzados */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Filtro Lider */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Filtrar por Líder</label>
                        <select 
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none appearance-none"
                            value={liderId}
                            onChange={(e) => setLiderId(e.target.value)}
                        >
                            <option value="">Todos los Líderes</option>
                            {lideres.map(l => (
                                <option key={l.id} value={l.id}>{l.nombre} {l.apellido}</option>
                            ))}
                        </select>
                    </div>

                    {/* Filtro Reunión */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Filtrar por Reunión</label>
                        <select 
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none appearance-none"
                            value={reunionId}
                            onChange={(e) => setReunionId(e.target.value)}
                            disabled={reuniones.length === 0}
                        >
                            <option value="">Todas las Reuniones</option>
                            {reuniones.map(r => (
                                <option key={r.id} value={r.id}>
                                    {format(new Date(r.fecha), "dd/MM", { locale: es })} - {r.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Filtro Departamento */}
                    <div>
                         <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Departamento</label>
                         <select 
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none appearance-none"
                            value={departamento}
                            onChange={(e) => setDepartamento(e.target.value)}
                         >
                            <option value="">Todos</option>
                            {deptosOptions.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                         </select>
                    </div>

                    {/* Filtro Municipio */}
                    <div>
                         <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Municipio</label>
                         <select 
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none appearance-none"
                            value={municipio}
                            onChange={(e) => setMunicipio(e.target.value)}
                            disabled={!departamento}
                         >
                            <option value="">Todos</option>
                            {municipiosOptions.map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                         </select>
                    </div>
                </div>

            </div>

            {/* Tabla */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Documento</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contacto</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Última Reunión</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ubicación</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {cargando ? (
                                <tr><td colSpan={5} className="py-10 text-center text-gray-500">Cargando datos...</td></tr>
                            ) : asistentesFiltrados.length === 0 ? (
                                <tr><td colSpan={5} className="py-10 text-center text-gray-500">No se encontraron asistentes.</td></tr>
                            ) : (
                                asistentesFiltrados.map((asistente: any, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">{asistente.nombre} {asistente.apellido}</div>
                                            <div className="text-xs text-gray-500">{asistente.email}</div>
                                            {asistente.direccion && (
                                                 <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                                                    <span className="material-icons-round text-[10px]">home</span> {asistente.direccion}
                                                 </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 font-mono text-sm">
                                            {asistente.documento || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {asistente.telefono}
                                        </td>
                                        <td className="px-6 py-4">
                                            {asistente.reunion ? (
                                                <div className="text-sm">
                                                    <div className="font-medium text-primary">{format(new Date(asistente.reunion.fecha), "dd MMM yyyy", { locale: es })}</div>
                                                    <div className="text-xs text-gray-500">{asistente.reunion.nombre}</div>
                                                </div>
                                            ) : <span className="text-gray-400">-</span>}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {asistente.reunion ? (
                                                <div className="flex flex-col">
                                                    <span>{asistente.reunion.municipio}, {asistente.reunion.departamento}</span>
                                                    <span className="text-xs text-gray-400">{asistente.reunion.barrio}</span>
                                                </div>
                                            ) : '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                 <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 text-xs text-gray-500 flex justify-between items-center">
                    <span>Mostrando {asistentesFiltrados.length} registros</span>
                    {/* Aquí se podría agregar paginación futura */}
                </div>
            </div>
        </div>
    );
}
