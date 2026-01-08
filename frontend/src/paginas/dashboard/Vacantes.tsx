import Medios from './Medios';
import { resolveAssetUrl } from '../../lib/utils';
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, MapPin, DollarSign, X, User, Maximize2, Minimize2, Image as ImageIcon } from 'lucide-react';
import clienteAxios from '../../lib/cliente-axios';
import CandidatesModal from '../../components/CandidatesModal';

interface Categoria {
    id: string;
    nombre: string;
    slug: string;
    descripcion?: string;
}

interface Vacante {
    id: string;
    titulo: string;
    slug: string;
    descripcion: string;
    requisitos?: string;
    ubicacion: string;
    salario?: string;
    tipoContrato: string;
    categoria?: Categoria;
    estado: 'abierta' | 'cerrada' | 'finaliza_pronto';
    fechaCierre?: string;
    imagen?: string; // Added
    activo: boolean;
}

export default function Vacantes() {
    const [activeTab, setActiveTab] = useState('vacantes');
    const [vacantes, setVacantes] = useState<Vacante[]>([]);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [filtro, setFiltro] = useState('');
    const [novedadesCount, setNovedadesCount] = useState(0);

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [imageSelectorOpen, setImageSelectorOpen] = useState(false); // New state
    const [maximized, setMaximized] = useState(false); // New state
    const [editingId, setEditingId] = useState<string | null>(null);

    // Candidates Modal State
    const [candidatesModalOpen, setCandidatesModalOpen] = useState(false);
    const [selectedVacanteForCandidates, setSelectedVacanteForCandidates] = useState<any>(null);

    // Category Modal State
    const [catModalOpen, setCatModalOpen] = useState(false);
    const [editingCatId, setEditingCatId] = useState<string | null>(null);
    const [catFormData, setCatFormData] = useState({ nombre: '', slug: '', descripcion: '' });

    // Form Data
    const [formData, setFormData] = useState({
        titulo: '', slug: '', descripcion: '', requisitos: [] as string[],
        ubicacion: '', salario: '', tipoContrato: 'Tiempo Completo',
        categoria: '', estado: 'abierta', fechaCierre: '',
        pasos: [] as { titulo: string, descripcion: string }[],
        imagen: '',
        activo: true
    });


    useEffect(() => {
        fetchVacantes();
        fetchCategorias();
        fetchNovedades();
    }, []);

    const fetchVacantes = async () => {
        try {
            const { data } = await clienteAxios.get('/api/vacantes');
            setVacantes(data);
        } catch (error) { console.error(error); }
    };

    const fetchNovedades = async () => {
        try {
            const { data } = await clienteAxios.get('/postulaciones/novedades');
            setNovedadesCount(data.novedades);
        } catch (error) { console.error(error); }
    };

    const fetchCategorias = async () => {
        try {
            const { data } = await clienteAxios.get('/catalogo/categorias-vacantes');
            setCategorias(data || []);
        } catch (error) {
            console.error("Error loading categories", error);
        }
    };

    // Generic Handlers (Save, Delete) ... similar to Noticias but pointing to /vacantes
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await clienteAxios.put(`/api/vacantes/${editingId}`, formData);
            } else {
                await clienteAxios.post('/api/vacantes', formData);
            }
            setModalOpen(false);
            fetchVacantes();
        } catch (error) { alert('Error al guardar'); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar vacante?')) return;
        try {
            await clienteAxios.delete(`/api/vacantes/${id}`);
            fetchVacantes();
        } catch (error) { alert('Error al eliminar'); }
    };

    // ... Category Handlers ...
    const handleSaveCat = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingCatId) {
                await clienteAxios.patch(`/catalogo/categorias-vacantes/${editingCatId}`, catFormData);
            } else {
                await clienteAxios.post('/catalogo/categorias-vacantes', catFormData);
            }
            setCatModalOpen(false);
            fetchCategorias();
        } catch (error) { alert('Error al guardar categoría'); }
    };

    const handleDeleteCat = async (id: string) => {
        if (!confirm('¿Eliminar categoría?')) return;
        try {
            await clienteAxios.delete(`/catalogo/categorias-vacantes/${id}`);
            fetchCategorias();
        } catch (error) { alert('Error al eliminar categoría'); }
    };

    const generarSlug = (texto: string) => {
        return texto.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    };

    // ... Render ...
    const filteredVacantes = vacantes.filter((v: any) =>
        v.titulo.toLowerCase().includes(filtro.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Gestión de Vacantes</h1>
                    <p className="text-gray-500 mt-1">Publica ofertas y gestiona candidatos.</p>
                </div>
                <div className="flex bg-white rounded-xl border border-gray-200 p-1">
                    <button onClick={() => setActiveTab('vacantes')} className={`relative px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'vacantes' ? 'bg-secondary text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}>
                        Vacantes
                        {novedadesCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                                {novedadesCount}
                            </span>
                        )}
                    </button>
                    <button onClick={() => setActiveTab('categorias')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'categorias' ? 'bg-secondary text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}>Categorías</button>
                </div>
            </div>

            {activeTab === 'vacantes' && (
                <>
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input type="text" placeholder="Buscar vacantes..." value={filtro} onChange={e => setFiltro(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-secondary focus:ring-4 focus:ring-secondary/10 outline-none transition-all" />
                        </div>
                        <button onClick={() => { setEditingId(null); setFormData({ titulo: '', slug: '', descripcion: '', requisitos: [], ubicacion: '', salario: '', tipoContrato: 'Tiempo Completo', categoria: '', estado: 'abierta', fechaCierre: '', pasos: [], imagen: '', activo: true }); setMaximized(false); setModalOpen(true); }} className="bg-secondary hover:bg-secondary/90 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-secondary/30 flex items-center gap-2 transition-all">
                            <Plus size={20} /> Nueva Vacante
                        </button>
                    </div>

                    <div className="bg-white rounded-3xl border border-gray-200 shadow-xl shadow-gray-200/50 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Imagen</th>
                                    <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Título</th>
                                    <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Ubicación / Salario</th>
                                    <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Estado</th>
                                    <th className="p-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredVacantes.map((v: any) => (
                                    <tr key={v.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4">
                                            <div className="w-16 h-12 rounded-lg bg-gray-100 overflow-hidden border border-gray-200">
                                                {v.imagen ? (
                                                    <img src={resolveAssetUrl(v.imagen)} alt="" className="w-full h-full object-cover" />
                                                ) : <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={20} /></div>}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <p className="font-bold text-gray-900">{v.titulo}</p>
                                            <div className="flex gap-2 mt-1">
                                                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold">{v.categoria?.nombre || 'General'}</span>
                                                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-bold">{v.tipoContrato}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1 text-sm text-gray-500">
                                                <span className="flex items-center gap-1"><MapPin size={14} /> {v.ubicacion}</span>
                                                <span className="flex items-center gap-1"><DollarSign size={14} /> {v.salario || 'A convenir'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${v.estado === 'abierta' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {v.estado}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => { setEditingId(v.id); setFormData({ ...v, categoria: v.categoria?.id || '', imagen: v.imagen || '' }); setMaximized(false); setModalOpen(true); }} className="p-2 rounded-lg text-gray-400 hover:text-secondary hover:bg-secondary/10 transition-colors"><Edit size={18} /></button>
                                                <button onClick={() => { setSelectedVacanteForCandidates(v); setCandidatesModalOpen(true); }} className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Ver Candidatos"><User size={18} /></button>
                                                <button onClick={() => handleDelete(v.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* Modal Vacante */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-all duration-300">
                    <div className={`bg-white rounded-3xl shadow-2xl w-full transition-all duration-300 overflow-hidden flex flex-col ${maximized ? 'fixed inset-0 rounded-none h-full max-w-none' : 'max-w-4xl max-h-[90vh]'}`}>
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white z-10 shrink-0">
                            <h2 className="text-2xl font-black text-gray-900">{editingId ? 'Editar Vacante' : 'Nueva Vacante'}</h2>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setMaximized(!maximized)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors" title={maximized ? "Restaurar" : "Maximizar"}>
                                    {maximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                                </button>
                                <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"><X size={24} /></button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                            <form onSubmit={handleSave} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="font-bold text-gray-700">Título del Puesto</label>
                                        <input type="text" required className="w-full p-3 rounded-xl border border-gray-200 focus:border-secondary outline-none" value={formData.titulo} onChange={e => { const slug = generarSlug(e.target.value); setFormData({ ...formData, titulo: e.target.value, slug: editingId ? formData.slug : slug }) }} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="font-bold text-gray-700">Slug URL</label>
                                        <input type="text" required className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500" value={formData.slug} onChange={e => setFormData({ ...formData, slug: generarSlug(e.target.value) })} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="font-bold text-gray-700">Imagen Destacada</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <input type="text" readOnly className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-600 focus:outline-none cursor-default" value={formData.imagen} placeholder="Selecciona una imagen..." />
                                            {formData.imagen && (
                                                <div className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded overflow-hidden border border-gray-200">
                                                    <img src={resolveAssetUrl(formData.imagen)} alt="" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                        </div>
                                        <button type="button" onClick={() => setImageSelectorOpen(true)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 rounded-xl font-bold transition-colors flex items-center gap-2">
                                            <ImageIcon size={20} />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="font-bold text-gray-700">Categoría</label>
                                        <select className="w-full p-3 rounded-xl border border-gray-200 focus:border-secondary outline-none" value={formData.categoria} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, categoria: e.target.value })}>
                                            <option value="">Seleccionar...</option>
                                            {categorias.map((c: any) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="font-bold text-gray-700">Tipo Contrato</label>
                                        <select className="w-full p-3 rounded-xl border border-gray-200 focus:border-secondary outline-none" value={formData.tipoContrato} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, tipoContrato: e.target.value })}>
                                            <option>Tiempo Completo</option>
                                            <option>Medio Tiempo</option>
                                            <option>Contrato de Obra</option>
                                            <option>Prestación de Servicios</option>
                                            <option>Prácticas</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="font-bold text-gray-700">Estado</label>
                                        <select className="w-full p-3 rounded-xl border border-gray-200 focus:border-secondary outline-none" value={formData.estado} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, estado: e.target.value })}>
                                            <option value="abierta">Abierta</option>
                                            <option value="cerrada">Cerrada</option>
                                            <option value="finaliza_pronto">Finaliza Pronto</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="font-bold text-gray-700">Ubicación</label>
                                        <input type="text" className="w-full p-3 rounded-xl border border-gray-200 focus:border-secondary outline-none" value={formData.ubicacion} onChange={e => setFormData({ ...formData, ubicacion: e.target.value })} placeholder="Ej: Bogotá, Presencial" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="font-bold text-gray-700">Salario</label>
                                        <input type="text" className="w-full p-3 rounded-xl border border-gray-200 focus:border-secondary outline-none" value={formData.salario} onChange={e => setFormData({ ...formData, salario: e.target.value })} placeholder="Ej: $2.500.000 - $3.000.000" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="font-bold text-gray-700">Fecha de Cierre</label>
                                        <input type="date" className="w-full p-3 rounded-xl border border-gray-200 focus:border-secondary outline-none" value={formData.fechaCierre ? formData.fechaCierre.split('T')[0] : ''} onChange={e => setFormData({ ...formData, fechaCierre: e.target.value })} />
                                        <p className="text-xs text-gray-400">Dejar vacío para indefinido.</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="font-bold text-gray-700">Descripción del Puesto (HTML)</label>
                                    <textarea rows={5} className="w-full p-3 rounded-xl border border-gray-200 focus:border-secondary outline-none font-mono text-sm" value={formData.descripcion} onChange={e => setFormData({ ...formData, descripcion: e.target.value })}></textarea>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="font-bold text-gray-700">Requisitos</label>
                                        <button type="button" onClick={() => setFormData({ ...formData, requisitos: [...formData.requisitos, ''] })} className="text-secondary text-sm font-bold hover:underline">+ Agregar Requisito</button>
                                    </div>
                                    <div className="space-y-2">
                                        {formData.requisitos.map((req, index) => (
                                            <div key={index} className="flex gap-2">
                                                <input type="text" className="flex-1 p-3 rounded-xl border border-gray-200 focus:border-secondary outline-none" value={req} onChange={e => {
                                                    const newReqs = [...formData.requisitos];
                                                    newReqs[index] = e.target.value;
                                                    setFormData({ ...formData, requisitos: newReqs });
                                                }} placeholder="Ej: Licencia C2 vigente" />
                                                <button type="button" onClick={() => {
                                                    const newReqs = formData.requisitos.filter((_, i) => i !== index);
                                                    setFormData({ ...formData, requisitos: newReqs });
                                                }} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={18} /></button>
                                            </div>
                                        ))}
                                        {formData.requisitos.length === 0 && <p className="text-gray-400 text-sm italic">No hay requisitos agregados.</p>}
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-gray-100">
                                    <div className="flex justify-between items-center">
                                        <label className="font-bold text-gray-700">Pasos para Postularse</label>
                                        <button type="button" onClick={() => setFormData({ ...formData, pasos: [...formData.pasos, { titulo: '', descripcion: '' }] })} className="text-secondary text-sm font-bold hover:underline">+ Agregar Paso</button>
                                    </div>
                                    <div className="space-y-4">
                                        {formData.pasos.map((paso, index) => (
                                            <div key={index} className="bg-gray-50 p-4 rounded-xl border border-gray-200 relative group">
                                                <button type="button" onClick={() => {
                                                    const newPasos = formData.pasos.filter((_, i) => i !== index);
                                                    setFormData({ ...formData, pasos: newPasos });
                                                }} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1"><Trash2 size={16} /></button>

                                                <div className="grid grid-cols-1 gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <span className="bg-secondary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">{index + 1}</span>
                                                        <input type="text" className="flex-1 p-2 rounded-lg border border-gray-200 focus:border-secondary outline-none text-sm font-bold" value={paso.titulo} onChange={e => {
                                                            const newPasos = [...formData.pasos];
                                                            newPasos[index].titulo = e.target.value;
                                                            setFormData({ ...formData, pasos: newPasos });
                                                        }} placeholder="Título del paso (ej: Registro)" />
                                                    </div>
                                                    <textarea rows={2} className="w-full p-2 rounded-lg border border-gray-200 focus:border-secondary outline-none text-sm" value={paso.descripcion} onChange={e => {
                                                        const newPasos = [...formData.pasos];
                                                        newPasos[index].descripcion = e.target.value;
                                                        setFormData({ ...formData, pasos: newPasos });
                                                    }} placeholder="Descripción detallada..."></textarea>
                                                </div>
                                            </div>
                                        ))}
                                        {formData.pasos.length === 0 && <p className="text-gray-400 text-sm italic">No hay pasos definidos.</p>}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                    <button type="button" onClick={() => setModalOpen(false)} className="px-6 py-2 rounded-xl text-gray-500 font-bold hover:bg-gray-100">Cancelar</button>
                                    <button type="submit" className="px-8 py-2 rounded-xl bg-secondary text-white font-bold shadow-lg">Guardar Vacante</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'categorias' && (
                <>
                    <div className="flex justify-end mb-6">
                        <button onClick={() => { setEditingCatId(null); setCatFormData({ nombre: '', slug: '', descripcion: '' }); setCatModalOpen(true); }} className="bg-secondary hover:bg-secondary/90 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-secondary/30 flex items-center gap-2 transition-all">
                            <Plus size={20} /> Nueva Categoría
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {categorias.map((cat: any) => (
                            <div key={cat.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group relative">
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditingCatId(cat.id); setCatFormData({ nombre: cat.nombre, slug: cat.slug, descripcion: cat.descripcion || '' }); setCatModalOpen(true); }} className="p-2 bg-white rounded-full text-gray-400 hover:text-secondary shadow-sm hover:shadow border border-gray-100"><Edit size={16} /></button>
                                    <button onClick={() => handleDeleteCat(cat.id)} className="p-2 bg-white rounded-full text-gray-400 hover:text-red-500 shadow-sm hover:shadow border border-gray-100"><Trash2 size={16} /></button>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-1">{cat.nombre}</h3>
                                <code className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded block w-fit mb-3">{cat.slug}</code>
                                <p className="text-gray-500 text-sm line-clamp-3">{cat.descripcion || 'Sin descripción'}</p>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Modal Categoría */}
            {catModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-2xl font-black text-gray-900">{editingCatId ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
                            <button onClick={() => setCatModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"><X size={24} /></button>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleSaveCat} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="font-bold text-gray-700">Nombre</label>
                                    <input type="text" required className="w-full p-3 rounded-xl border border-gray-200 focus:border-secondary outline-none" value={catFormData.nombre} onChange={e => { const slug = generarSlug(e.target.value); setCatFormData({ ...catFormData, nombre: e.target.value, slug: editingCatId ? catFormData.slug : slug }) }} />
                                </div>
                                <div className="space-y-2">
                                    <label className="font-bold text-gray-700">Slug</label>
                                    <input type="text" required className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500" value={catFormData.slug} onChange={e => setCatFormData({ ...catFormData, slug: generarSlug(e.target.value) })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="font-bold text-gray-700">Descripción</label>
                                    <textarea rows={3} className="w-full p-3 rounded-xl border border-gray-200 focus:border-secondary outline-none" value={catFormData.descripcion} onChange={e => setCatFormData({ ...catFormData, descripcion: e.target.value })}></textarea>
                                </div>
                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                    <button type="button" onClick={() => setCatModalOpen(false)} className="px-6 py-2 rounded-xl text-gray-500 font-bold hover:bg-gray-100">Cancelar</button>
                                    <button type="submit" className="px-8 py-2 rounded-xl bg-secondary text-white font-bold shadow-lg">Guardar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Media Selector Modal */}
            {imageSelectorOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col relative shadow-2xl">
                        <button onClick={() => setImageSelectorOpen(false)} className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-100">
                            <X size={20} />
                        </button>
                        <Medios selectionMode={true} onSelect={(url) => { setFormData({ ...formData, imagen: url }); setImageSelectorOpen(false); }} />
                    </div>
                </div>
            )}

            {candidatesModalOpen && selectedVacanteForCandidates && (
                <CandidatesModal
                    vacanteId={selectedVacanteForCandidates.id}
                    vacanteTitulo={selectedVacanteForCandidates.titulo} // Fixed prop name
                    onClose={() => setCandidatesModalOpen(false)}
                />
            )}
        </div>
    );
}
