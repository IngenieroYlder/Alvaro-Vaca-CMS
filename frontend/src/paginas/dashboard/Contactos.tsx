import { useState, useEffect } from 'react';
import clienteAxios from '../../lib/cliente-axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Contacto {
    id: string;
    nombre: string;
    email: string;
    telefono: string;
    tieneWhatsapp: boolean;
    otroWhatsapp?: string;
    ciudad: string;
    tipo: string;
    mensaje: string;
    fecha: string;
    estado?: string;
    rol_sumate?: string;
}

const Contactos = () => {
    const [contactos, setContactos] = useState<Contacto[]>([]);
    const [cargando, setCargando] = useState(true);
    const [filtroCiudad, setFiltroCiudad] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('');
    const [filtroFecha, setFiltroFecha] = useState('todos'); // todos, semana, mes, año, personalizado
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [mensajeSeleccionado, setMensajeSeleccionado] = useState<Contacto | null>(null);
    const [modalMaximizado, setModalMaximizado] = useState(false);

    useEffect(() => {
        cargarContactos();
    }, [filtroTipo, filtroEstado, filtroFecha, fechaDesde, fechaHasta]);

    const cargarContactos = async () => {
        setCargando(true);
        try {
            let query = `/contactos?`;
            if (filtroTipo) query += `tipo=${filtroTipo}&`;
            if (filtroEstado) query += `estado=${filtroEstado}&`;

            let desde = '';
            let hasta = '';

            const now = new Date();
            if (filtroFecha === 'semana') {
                const startOfWeek = new Date(now);
                startOfWeek.setDate(now.getDate() - now.getDay());
                desde = format(startOfWeek, 'yyyy-MM-dd');
                hasta = format(now, 'yyyy-MM-dd');
            } else if (filtroFecha === 'mes') {
                desde = format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd');
                hasta = format(now, 'yyyy-MM-dd');
            } else if (filtroFecha === 'año') {
                desde = format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd');
                hasta = format(now, 'yyyy-MM-dd');
            } else if (filtroFecha === 'personalizado') {
                desde = fechaDesde;
                hasta = fechaHasta;
            }

            if (desde) query += `desde=${desde}&`;
            if (hasta) query += `hasta=${hasta}&`;

            const res = await clienteAxios.get(query);
            setContactos(res.data);
        } catch (error) {
            console.error('Error cargando contactos:', error);
        } finally {
            setCargando(false);
        }
    };

    const getFilterParams = () => {
        let params = `?`;
        if (filtroTipo) params += `tipo=${filtroTipo}&`;
        if (filtroEstado) params += `estado=${filtroEstado}&`;

        let desde = '';
        let hasta = '';
        const now = new Date();
        if (filtroFecha === 'semana') {
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            desde = format(startOfWeek, 'yyyy-MM-dd');
            hasta = format(now, 'yyyy-MM-dd');
        } else if (filtroFecha === 'mes') {
            desde = format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd');
            hasta = format(now, 'yyyy-MM-dd');
        } else if (filtroFecha === 'año') {
            desde = format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd');
            hasta = format(now, 'yyyy-MM-dd');
        } else if (filtroFecha === 'personalizado') {
            desde = fechaDesde;
            hasta = fechaHasta;
        }

        if (desde) params += `desde=${desde}&`;
        if (hasta) params += `hasta=${hasta}&`;
        return params;
    };

    const actualizarEstado = async (id: string, nuevoEstado: string) => {
        if (!mensajeSeleccionado) return;
        try {
            await clienteAxios.post(`/contactos/${id}/estado`, { estado: nuevoEstado });
            // Actualizar localmente
            setContactos(prev => prev.map(c => c.id === id ? { ...c, estado: nuevoEstado } : c));
            setMensajeSeleccionado(prev => prev ? { ...prev, estado: nuevoEstado } : null);
            alert('Estado actualizado correctamente');
        } catch (error) {
            console.error('Error al actualizar estado:', error);
            alert('Error al actualizar el estado');
        }
    };

    const exportarExcel = async () => {
        try {
            const res = await clienteAxios.get(`/contactos/export/excel${getFilterParams()}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Mensajes_y_Voluntariado_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error exportando Excel:', error);
            alert('Error al exportar a Excel');
        }
    };

    const exportarPDF = async () => {
        try {
            const res = await clienteAxios.get(`/contactos/export/pdf${getFilterParams()}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Mensajes_y_Voluntariado_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error exportando PDF:', error);
            alert('Error al exportar a PDF');
        }
    };

    // Filter Logic for Client Side (Search)
    const contactosFiltrados = contactos.filter(c => {
        const matchCiudad = filtroCiudad ? c.ciudad.toLowerCase().includes(filtroCiudad.toLowerCase()) : true;
        return matchCiudad;
    });

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-800">Mensajes y Voluntariado</h1>
                    <p className="text-gray-500">Gestión de mensajes directos, voluntarios y líderes zonales.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button onClick={exportarExcel} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all">
                        <span className="material-symbols-outlined">table_view</span> Excel
                    </button>
                    <button onClick={exportarPDF} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-rose-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all">
                        <span className="material-symbols-outlined">picture_as_pdf</span> PDF
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Search by City */}
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400">search</span>
                            <input
                                type="text"
                                placeholder="Buscar por ciudad..."
                                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                value={filtroCiudad}
                                onChange={e => setFiltroCiudad(e.target.value)}
                            />
                        </div>

                        {/* Filter by Type */}
                        <select
                            value={filtroTipo}
                            onChange={e => setFiltroTipo(e.target.value)}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                        >
                            <option value="">Todos los tipos</option>
                            <option value="mensaje">Mensajes Directos</option>
                            <option value="sumate">Voluntarios / Súmate</option>
                            <option value="peticion">Peticiones</option>
                            <option value="queja">Quejas</option>
                            <option value="reclamo">Reclamos</option>
                        </select>

                        {/* Filter by Status */}
                        <select
                            value={filtroEstado}
                            onChange={e => setFiltroEstado(e.target.value)}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                        >
                            <option value="">Todos los estados</option>
                            <option value="sin_responder">Sin responder</option>
                            <option value="abierto">En Proceso</option>
                            <option value="resuelto">Resuelto</option>
                            <option value="no_resuelto">Archivado</option>
                        </select>

                        {/* Filter by Date Range */}
                        <select
                            value={filtroFecha}
                            onChange={e => setFiltroFecha(e.target.value)}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                        >
                            <option value="todos">Cualquier fecha</option>
                            <option value="semana">Esta semana</option>
                            <option value="mes">Este mes</option>
                            <option value="año">Este año</option>
                            <option value="personalizado">Rango personalizado...</option>
                        </select>

                        {filtroFecha === 'personalizado' && (
                            <div className="flex gap-2 lg:col-span-2 items-center animate-in fade-in slide-in-from-top-2 duration-300">
                                <input
                                    type="date"
                                    value={fechaDesde}
                                    onChange={e => setFechaDesde(e.target.value)}
                                    className="px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500"
                                />
                                <span className="text-gray-400">a</span>
                                <input
                                    type="date"
                                    value={fechaHasta}
                                    onChange={e => setFechaHasta(e.target.value)}
                                    className="px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/80 border-b border-gray-100">
                            <tr>
                                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest">Fecha</th>
                                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest">Estado</th>
                                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest">Usuario / Tipo</th>
                                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest">Rol Súmate</th>
                                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest">Contacto</th>
                                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest">Ciudad</th>
                                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest">Mensaje</th>
                                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest">Canal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {cargando ? (
                                <tr><td colSpan={8} className="p-12 text-center text-gray-400">
                                    <div className="animate-spin inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full mb-2"></div>
                                    <p className="text-sm font-medium">Actualizando lista...</p>
                                </td></tr>
                            ) : contactosFiltrados.length === 0 ? (
                                <tr><td colSpan={8} className="p-12 text-center text-gray-400">No se encontraron mensajes con los filtros actuales.</td></tr>
                            ) : (
                                contactosFiltrados.map(c => (
                                    <tr key={c.id} className="hover:bg-gray-50/80 transition-colors group">
                                        <td className="p-4 text-sm text-gray-500 whitespace-nowrap">
                                            {format(new Date(c.fecha), 'yyyy-MM-dd HH:mm')}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${c.estado === 'resuelto' ? 'bg-green-100 text-green-700' :
                                                c.estado === 'no_resuelto' ? 'bg-red-100 text-red-700' :
                                                    c.estado === 'abierto' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-gray-100 text-gray-600'
                                                }`}>
                                                {(!c.estado || c.estado === 'sin_responder') ? 'Sin Responder' : c.estado.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-gray-900 group-hover:text-primary transition-colors">{c.nombre}</div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${c.tipo === 'sumate' ? 'bg-purple-100 text-purple-600' :
                                                    c.tipo === 'mensaje' ? 'bg-indigo-100 text-indigo-600' :
                                                        c.tipo === 'reclamo' ? 'bg-rose-100 text-rose-600' :
                                                            c.tipo === 'queja' ? 'bg-amber-100 text-amber-600' :
                                                                'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {c.tipo === 'sumate' ? 'VOLUNTARIO' : (c.tipo || 'MENSAJE')}
                                                </span>
                                                <span className="text-[11px] text-gray-400 font-medium truncate max-w-[120px]">{c.email}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {c.rol_sumate ? (
                                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded font-bold text-xs uppercase">
                                                    {c.rol_sumate}
                                                </span>
                                            ) : <span className="text-gray-300">-</span>}
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 font-medium">
                                            {c.telefono}
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">
                                            {c.ciudad}
                                        </td>
                                        <td className="p-4 max-w-xs">
                                            <div
                                                onClick={() => setMensajeSeleccionado(c)}
                                                className="text-xs text-gray-500 italic bg-gray-50 p-2 rounded-lg border border-gray-100 cursor-pointer hover:bg-white hover:border-blue-200 transition-all line-clamp-2 hover:shadow-sm"
                                            >
                                                {c.mensaje}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {c.tieneWhatsapp ? (
                                                <a href={`https://wa.me/57${c.telefono}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                                                    <span className="material-symbols-outlined text-xl">chat</span>
                                                </a>
                                            ) : c.otroWhatsapp ? (
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase">Otro WA</span>
                                                    <a href={`https://wa.me/57${c.otroWhatsapp}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                                                        <span className="material-symbols-outlined text-xl">chat</span>
                                                    </a>
                                                </div>
                                            ) : (
                                                <span className="text-gray-200">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MESSAGE MODAL */}
            {mensajeSeleccionado && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className={`bg-white rounded-[2.5rem] shadow-2xl overflow-hidden transition-all duration-300 flex flex-col ${modalMaximizado ? 'w-full h-full rounded-none' : 'w-full max-w-2xl max-h-[80vh]'}`}>
                        <div className="p-6 md:p-8 flex justify-between items-start border-b border-gray-100 bg-gray-50/50">
                            <div className="flex-1 mr-4">
                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${mensajeSeleccionado.tipo === 'reclamo' ? 'bg-rose-100 text-rose-600' :
                                        mensajeSeleccionado.tipo === 'queja' ? 'bg-amber-100 text-amber-600' :
                                            mensajeSeleccionado.tipo === 'peticion' ? 'bg-blue-100 text-blue-600' :
                                                mensajeSeleccionado.tipo === 'sumate' ? 'bg-purple-100 text-purple-600' :
                                                    'bg-gray-100 text-gray-600'
                                        }`}>
                                        {mensajeSeleccionado.tipo || 'consulta'}
                                    </span>

                                    <select
                                        value={mensajeSeleccionado.estado || 'sin_responder'}
                                        onChange={(e) => actualizarEstado(mensajeSeleccionado.id, e.target.value)}
                                        className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border-none cursor-pointer focus:ring-2 focus:ring-offset-1 focus:ring-gray-200 outline-none transition-all ${(mensajeSeleccionado.estado === 'resuelto') ? 'bg-green-100 text-green-700' :
                                            (mensajeSeleccionado.estado === 'no_resuelto') ? 'bg-red-100 text-red-700' :
                                                (mensajeSeleccionado.estado === 'abierto') ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-200 text-gray-600'
                                            }`}
                                    >
                                        <option value="sin_responder">Sin Responder</option>
                                        <option value="abierto">Abierto</option>
                                        <option value="resuelto">Resuelto</option>
                                        <option value="no_resuelto">No Resuelto</option>
                                    </select>

                                    <span className="text-sm text-gray-400 font-medium ml-auto">#{mensajeSeleccionado.id.slice(0, 8)}</span>
                                </div>
                                <h2 className="text-2xl font-black text-gray-800 leading-tight mb-1">{mensajeSeleccionado.nombre}</h2>
                                <p className="text-gray-500 font-medium text-sm">{mensajeSeleccionado.email} • {mensajeSeleccionado.telefono}</p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <button
                                    onClick={() => setModalMaximizado(!modalMaximizado)}
                                    className="p-2 sm:p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                                    title={modalMaximizado ? "Restaurar tamaño" : "Pantalla completa"}
                                >
                                    <span className="material-symbols-outlined">{modalMaximizado ? 'close_fullscreen' : 'open_in_full'}</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setMensajeSeleccionado(null);
                                        setModalMaximizado(false);
                                    }}
                                    className="p-3 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 p-8 md:p-10 overflow-y-auto">
                            <div className="flex items-center gap-2 mb-6 text-xs font-black text-gray-400 uppercase tracking-widest">
                                <span className="material-symbols-outlined text-lg">notes</span> Contenido del Mensaje
                            </div>

                            {mensajeSeleccionado.rol_sumate && (
                                <div className="mb-6 p-4 bg-purple-50 rounded-2xl border border-purple-100 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                        <span className="material-symbols-outlined">volunteer_activism</span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Rol Solicitado</p>
                                        <p className="font-bold text-purple-900 capitalize text-lg">{mensajeSeleccionado.rol_sumate}</p>
                                    </div>
                                </div>
                            )}
                            <div className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap font-medium select-text">
                                {mensajeSeleccionado.mensaje}
                            </div>
                        </div>

                        <div className="p-6 md:p-8 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                            <div className="text-sm text-gray-400 font-medium">
                                Recibido el {format(new Date(mensajeSeleccionado.fecha), 'PPP p', { locale: es })}
                            </div>
                            <button
                                onClick={() => {
                                    setMensajeSeleccionado(null);
                                    setModalMaximizado(false);
                                }}
                                className="px-8 py-3 bg-gray-800 text-white font-bold rounded-2xl hover:bg-gray-900 transition-all"
                            >
                                Cerrar Ventana
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Contactos;
