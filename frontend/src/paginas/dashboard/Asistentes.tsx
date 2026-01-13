import { useState, useEffect } from 'react';
import clienteAxios from '../../lib/cliente-axios';
import { Download, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Asistentes() {
    const [asistentes, setAsistentes] = useState<any[]>([]);
    const [cargando, setCargando] = useState(false);
    
    // Filtros
    const [busqueda, setBusqueda] = useState('');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');

    useEffect(() => {
        cargarAsistentes();
    }, [fechaInicio, fechaFin]); // Recargar si cambian fechas

    const cargarAsistentes = async () => {
        setCargando(true);
        try {
            // Usamos el endpoint unique para listar personas únicas
            const params = new URLSearchParams();
            if (fechaInicio) params.append('dateStart', fechaInicio);
            if (fechaFin) params.append('dateEnd', fechaFin);
            
            const { data } = await clienteAxios.get(`/reuniones/unique?${params.toString()}`);
            setAsistentes(data);
        } catch (error) {
            console.error('Error cargando asistentes:', error);
        } finally {
            setCargando(false);
        }
    };

    const exportarExcel = () => {
        const url = `${clienteAxios.defaults.baseURL}/reuniones/export/excel?unique=true&dateStart=${fechaInicio}&dateEnd=${fechaFin}`;
        window.open(url, '_blank');
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
                <button 
                    onClick={exportarExcel}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm"
                >
                    <Download className="w-5 h-5" /> Exportar Excel
                </button>
            </div>

            {/* Filtros */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Buscar</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Nombre, cédula o teléfono..." 
                            className="w-full pl-9 pr-4 py-2 border rounded-lg bg-gray-50 focus:bg-white transition-colors"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>
                </div>
                <div>
                     <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
                     <input type="date" className="px-3 py-2 border rounded-lg" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
                </div>
                <div>
                     <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
                     <input type="date" className="px-3 py-2 border rounded-lg" value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
                </div>
                <button 
                    onClick={cargarAsistentes}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2"
                >
                    <Filter className="w-4 h-4" /> Filtrar
                </button>
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
                                    <tr key={idx} className="hover:bg-gray-50/50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{asistente.nombre}</div>
                                            <div className="text-xs text-gray-500">{asistente.email}</div>
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
                                                    <div className="font-medium">{format(new Date(asistente.reunion.fecha), "dd MMM yyyy", { locale: es })}</div>
                                                    <div className="text-xs text-gray-500">{asistente.reunion.nombre}</div>
                                                </div>
                                            ) : <span className="text-gray-400">-</span>}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {asistente.reunion ? `${asistente.reunion.barrio}, ${asistente.reunion.municipio}` : '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                 <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
                    Mostrando {asistentesFiltrados.length} registros
                </div>
            </div>
        </div>
    );
}
