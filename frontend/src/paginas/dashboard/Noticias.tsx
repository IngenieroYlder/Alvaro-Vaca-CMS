import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Image as ImageIcon, Check, X, Bold, Italic, Link as LinkIcon, List, Type, MoreVertical, Globe, Maximize2, Minimize2 } from 'lucide-react';
import Medios from './Medios';
import clienteAxios from '../../lib/cliente-axios';
import { resolveAssetUrl } from '../../lib/utils';
// Assuming MediaSelector exists or we use a simple input for now if not found, 
// but based on guidelines we should use one. I will implement a placeholder or use the one if found.
// If not found, I will use a simple text input with a button to open Medios in a new tab for now 
// or implement a basic modal using the Medios component if possible.
// For this step, I'll stick to text input for URL + "Select" button concept which I'll wire up later 
// if the component doesn't exist.

export default function Noticias() {
    const [activeTab, setActiveTab] = useState('noticias');
    const [noticias, setNoticias] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filtro, setFiltro] = useState('');

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [maximized, setMaximized] = useState(false); // New state for maximize
    const [imageSelectorTarget, setImageSelectorTarget] = useState<'main' | 'editor' | null>(null); // Changed boolean to target string


    const [catModalOpen, setCatModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        titulo: '', slug: '', resumen: '', contenido: '',
        categoria: '', imagenPrincipal: '', destacada: false, activo: true,
        autor: '' // will be set by backend usually, or selected
    });
    const [catFormData, setCatFormData] = useState({ nombre: '', slug: '', descripcion: '' });

    useEffect(() => {
        fetchNoticias();
        fetchCategorias();
    }, []);

    const fetchNoticias = async () => {
        setLoading(true);
        try {
            const { data } = await clienteAxios.get('/api/noticias');
            setNoticias(data);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const fetchCategorias = async () => {
        try {
            const { data } = await clienteAxios.get('/catalogo/categorias-noticias');
            setCategorias(data);
        } catch (error) { console.error(error); }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await clienteAxios.put(`/api/noticias/${editingId}`, formData);
            } else {
                await clienteAxios.post('/api/noticias', formData);
            }
            setModalOpen(false);
            fetchNoticias();
        } catch (error) { alert('Error al guardar'); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar noticia?')) return;
        try {
            await clienteAxios.delete(`/api/noticias/${id}`);
            fetchNoticias();
        } catch (error) { alert('Error al eliminar'); }
    };

    const handleSaveCat = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                // Update implementation if needed, API endpoint? 
                // Assuming simple create for now for MVP or adding update later
                alert("Edición de categorías pendiente de endpoint PUT en backend");
            } else {
                await clienteAxios.post('/catalogo/categorias-noticias', catFormData);
            }
            setCatModalOpen(false);
            fetchCategorias();
        } catch (error) { alert('Error al guardar categoría'); }
    };

    const generarSlug = (texto: string) => {
        return texto.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    };

    // Editor Helpers
    const insertTag = (tag: string, endTag = '') => {
        const textarea = document.getElementById('editor-content') as HTMLTextAreaElement;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const newText = text.substring(0, start) + tag + text.substring(start, end) + endTag + text.substring(end);
        setFormData({ ...formData, contenido: newText });
    };

    const filteredNoticias = noticias.filter((n: any) =>
        n.titulo.toLowerCase().includes(filtro.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Gestión de Noticias</h1>
                    <p className="text-gray-500 mt-1">Administra el blog y las categorías.</p>
                </div>
                <div className="flex gap-2">
                    <div className="flex bg-white rounded-xl border border-gray-200 p-1">
                        <button
                            onClick={() => setActiveTab('noticias')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'noticias' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            Noticias
                        </button>
                        <button
                            onClick={() => setActiveTab('categorias')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'categorias' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            Categorías
                        </button>
                    </div>
                </div>
            </div>

            {activeTab === 'noticias' && (
                <>
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar noticias..."
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                value={filtro}
                                onChange={e => setFiltro(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => {
                                setEditingId(null);
                                setFormData({ titulo: '', slug: '', resumen: '', contenido: '', categoria: '', imagenPrincipal: '', destacada: false, activo: true, autor: '' });
                                setMaximized(false);
                                setModalOpen(true);
                            }}
                            className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary/30 flex items-center gap-2 transition-all hover:-translate-y-1"
                        >
                            <Plus size={20} /> Nueva Noticia
                        </button>
                    </div>

                    <div className="bg-white rounded-3xl border border-gray-200 shadow-xl shadow-gray-200/50 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Imagen</th>
                                    <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Título</th>
                                    <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Categoría</th>
                                    <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Estado</th>
                                    <th className="p-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-gray-500">Cargando...</td></tr>
                                ) : filteredNoticias.map((noticia: any) => (
                                    <tr key={noticia.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4">
                                            <div className="w-16 h-12 rounded-lg bg-gray-100 overflow-hidden border border-gray-200">
                                                {noticia.imagenPrincipal ? (
                                                    <img src={resolveAssetUrl(noticia.imagenPrincipal)} alt="" className="w-full h-full object-cover" />
                                                ) : <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={20} /></div>}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <p className="font-bold text-gray-900">{noticia.titulo}</p>
                                            <p className="text-xs text-gray-500 font-mono truncate max-w-[200px]">{noticia.slug}</p>
                                        </td>
                                        <td className="p-4">
                                            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold">
                                                {noticia.categoria?.nombre || 'Sin categoría'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {noticia.activo ?
                                                <span className="inline-flex items-center gap-1 text-green-600 text-xs font-bold"><Check size={12} /> Activo</span> :
                                                <span className="inline-flex items-center gap-1 text-gray-400 text-xs font-bold">Inactivo</span>
                                            }
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => {
                                                    setEditingId(noticia.id);
                                                    setFormData({
                                                        ...noticia,
                                                        categoria: noticia.categoria?.id || ''
                                                    });
                                                    setMaximized(false);
                                                    setModalOpen(true);
                                                }} className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors">
                                                    <Edit size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(noticia.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {activeTab === 'categorias' && (
                <>
                    <div className="flex justify-end mb-6">
                        <button
                            onClick={() => { setCatModalOpen(true); setCatFormData({ nombre: '', slug: '', descripcion: '' }); }}
                            className="btn-pill btn-md bg-secondary text-white"
                        >
                            <Plus size={20} className="mr-2" /> Nueva Categoría
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {categorias.map((cat: any) => (
                            <div key={cat.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                <h3 className="text-xl font-bold text-gray-800 mb-1">{cat.nombre}</h3>
                                <code className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded block w-fit mb-3">{cat.slug}</code>
                                <p className="text-gray-500 text-sm">{cat.descripcion || 'Sin descripción'}</p>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Modal Noticia */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-all duration-300">
                    <div className={`bg-white rounded-3xl shadow-2xl w-full transition-all duration-300 overflow-hidden flex flex-col ${maximized ? 'fixed inset-0 rounded-none h-full max-w-none' : 'max-w-4xl max-h-[90vh]'}`}>
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white z-10 shrink-0">
                            <h2 className="text-2xl font-black text-gray-900">
                                {editingId ? 'Editar Noticia' : 'Nueva Noticia'}
                            </h2>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setMaximized(!maximized)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors" title={maximized ? "Restaurar" : "Maximizar"}>
                                    {maximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                                </button>
                                <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                            <form onSubmit={handleSave} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="font-bold text-gray-700">Título</label>
                                        <input
                                            type="text" required
                                            className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none"
                                            value={formData.titulo}
                                            onChange={e => {
                                                const slug = generarSlug(e.target.value);
                                                setFormData({ ...formData, titulo: e.target.value, slug: editingId ? formData.slug : slug }); // Only auto-update slug on create
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="font-bold text-gray-700">Slug (URL)</label>
                                        <input
                                            type="text" required
                                            className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500"
                                            value={formData.slug}
                                            onChange={e => setFormData({ ...formData, slug: generarSlug(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="font-bold text-gray-700">Categoría</label>
                                        <select
                                            className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none"
                                            value={formData.categoria}
                                            onChange={e => setFormData({ ...formData, categoria: e.target.value })}
                                        >
                                            <option value="">Seleccionar...</option>
                                            {categorias.map((c: any) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="font-bold text-gray-700">Imagen Principal</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                readOnly
                                                className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-600 focus:outline-none cursor-default"
                                                value={formData.imagenPrincipal}
                                                placeholder="Selecciona una imagen..."
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setImageSelectorTarget('main')}
                                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 rounded-xl font-bold transition-colors flex items-center gap-2"
                                            >
                                                <ImageIcon size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="font-bold text-gray-700">Resumen</label>
                                    <textarea
                                        className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none"
                                        rows={3}
                                        value={formData.resumen}
                                        onChange={e => setFormData({ ...formData, resumen: e.target.value })}
                                    ></textarea>
                                </div>

                                <div className="space-y-2">
                                    <label className="font-bold text-gray-700 flex justify-between">
                                        Contenido
                                        <div className="flex gap-1 text-gray-500">
                                            <button type="button" onClick={() => insertTag('<b>', '</b>')} className="p-1 hover:bg-gray-100 rounded" title="Negrita"><Bold size={16} /></button>
                                            <button type="button" onClick={() => insertTag('<i>', '</i>')} className="p-1 hover:bg-gray-100 rounded" title="Cursiva"><Italic size={16} /></button>
                                            <button type="button" onClick={() => insertTag('<h3>', '</h3>')} className="p-1 hover:bg-gray-100 rounded" title="Subtítulo"><Type size={16} /></button>
                                            <button type="button" onClick={() => insertTag('<a href="#" class="text-primary font-bold">', '</a>')} className="p-1 hover:bg-gray-100 rounded" title="Enlace"><LinkIcon size={16} /></button>
                                            <div className="w-px h-4 bg-gray-200 mx-1"></div>
                                            <button type="button" onClick={() => setImageSelectorTarget('editor')} className="p-1 hover:bg-blue-50 text-blue-600 rounded" title="Seleccionar Imagen de Medios"><ImageIcon size={16} /></button>
                                            <button type="button" onClick={() => insertTag('<img src="/uploads/..." class="w-full rounded-xl my-4" />')} className="p-1 hover:bg-gray-100 text-gray-400 rounded" title="Insertar Código HTML de Imagen"><code className="text-xs font-bold">&lt;/&gt;</code></button>
                                        </div>
                                    </label>
                                    <textarea
                                        id="editor-content"
                                        className="w-full p-4 rounded-xl border border-gray-200 focus:border-primary outline-none font-mono text-sm leading-relaxed"
                                        rows={12}
                                        value={formData.contenido}
                                        onChange={e => setFormData({ ...formData, contenido: e.target.value })}
                                    ></textarea>
                                    <p className="text-xs text-gray-400">Puedes usar HTML básico y clases de Tailwind.</p>
                                </div>

                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                            checked={formData.activo}
                                            onChange={e => setFormData({ ...formData, activo: e.target.checked })}
                                        />
                                        <span className="font-medium text-gray-700">Publicado / Activo</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 rounded border-gray-300 text-secondary focus:ring-secondary"
                                            checked={formData.destacada}
                                            onChange={e => setFormData({ ...formData, destacada: e.target.checked })}
                                        />
                                        <span className="font-medium text-gray-700">Destacada</span>
                                    </label>
                                </div>

                                <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                                    <button type="button" onClick={() => setModalOpen(false)} className="px-6 py-2 rounded-xl font-bold text-gray-500 hover:bg-gray-100">Cancelar</button>
                                    <button type="submit" className="px-8 py-2 rounded-xl font-bold bg-primary text-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
                                        Guardar Noticia
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Media Selector Modal */}
            {imageSelectorTarget && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col relative shadow-2xl">
                        <button
                            onClick={() => setImageSelectorTarget(null)}
                            className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
                        >
                            <X size={20} />
                        </button>
                        <Medios
                            selectionMode={true}
                            onSelect={(url) => {
                                if (imageSelectorTarget === 'main') {
                                    setFormData({ ...formData, imagenPrincipal: url });
                                } else if (imageSelectorTarget === 'editor') {
                                    const imgTag = `<img src="${resolveAssetUrl(url)}" class="w-full rounded-xl my-4 shadow-sm" alt="Imagen insertada" />`;
                                    insertTag(imgTag);
                                }
                                setImageSelectorTarget(null);
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Modal Categoría */}
            {catModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-xl font-black text-gray-900">Nueva Categoría</h2>
                        </div>
                        <form onSubmit={handleSaveCat} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nombre</label>
                                <input
                                    type="text" required
                                    className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary"
                                    value={catFormData.nombre}
                                    onChange={e => {
                                        const slug = generarSlug(e.target.value);
                                        setCatFormData({ ...catFormData, nombre: e.target.value, slug });
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Slug</label>
                                <input
                                    type="text" required
                                    className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500"
                                    value={catFormData.slug}
                                    onChange={e => setCatFormData({ ...catFormData, slug: generarSlug(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Descripción</label>
                                <textarea
                                    className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary"
                                    rows={3}
                                    value={catFormData.descripcion}
                                    onChange={e => setCatFormData({ ...catFormData, descripcion: e.target.value })}
                                ></textarea>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setCatModalOpen(false)} className="px-4 py-2 rounded-xl text-gray-500 font-bold hover:bg-gray-100">Cancelar</button>
                                <button type="submit" className="px-6 py-2 rounded-xl bg-secondary text-white font-bold shadow-lg">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
