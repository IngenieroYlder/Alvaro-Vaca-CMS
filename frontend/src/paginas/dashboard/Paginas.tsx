import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Globe, EyeOff, Search, ChevronDown, ChevronUp, X, Layout, Shield, HelpCircle, Phone, FileText, Image as ImageIcon, Check } from 'lucide-react';
import clienteAxios from '../../lib/cliente-axios';
import Medios from './Medios';
import SelectorIconos from '../../componentes/ui/SelectorIconos';

interface Pagina {
    id: string;
    titulo: string;
    slug: string;
    contenido: string;
    esPublica: boolean;
    fechaActualizacion: string;
    meta?: any;
}

// MATERIAL_ICONS moved to SelectorIconos component

export default function Paginas() {
    const [paginas, setPaginas] = useState<Pagina[]>([]);
    const [cargando, setCargando] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [idEdicion, setIdEdicion] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('hero');

    // Media Selector State
    const [showMediaSelector, setShowMediaSelector] = useState(false);
    const [mediaTargetField, setMediaTargetField] = useState<string | null>(null);

    const [form, setForm] = useState({
        titulo: '',
        slug: '',
        contenido: '',
        esPublica: false,
        meta: {} as any
    });

    useEffect(() => {
        cargarPaginas();
    }, []);

    const cargarPaginas = async () => {
        setCargando(true);
        try {
            const { data } = await clienteAxios.get('/paginas');
            setPaginas(data);
        } catch (error) {
            console.error('Error cargando páginas', error);
        } finally {
            setCargando(false);
        }
    };

    const handleCrear = () => {
        setForm({ titulo: '', slug: '', contenido: '', esPublica: false, meta: {} });
        setModoEdicion(false);
        setActiveTab('hero');
        setModalOpen(true);
    };

    const handleEditar = (pagina: Pagina) => {
        setForm({
            titulo: pagina.titulo,
            slug: pagina.slug,
            contenido: pagina.contenido,
            esPublica: pagina.esPublica,
            meta: pagina.meta || {}
        });
        setIdEdicion(pagina.id);
        setModoEdicion(true);
        setActiveTab('hero');
        setModalOpen(true);
    };

    const eliminarPagina = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta página?')) return;
        try {
            await clienteAxios.delete(`/paginas/${id}`);
            cargarPaginas();
        } catch (error) {
            console.error('Error eliminando', error);
            alert('No se pudo eliminar');
        }
    };

    const generarSlug = (titulo: string) => {
        return titulo
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    const handleTituloChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const titulo = e.target.value;
        setForm(prev => ({
            ...prev,
            titulo,
            slug: !modoEdicion ? generarSlug(titulo) : prev.slug
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (modoEdicion && idEdicion) {
                await clienteAxios.patch(`/paginas/${idEdicion}`, form);
            } else {
                await clienteAxios.post('/paginas', form);
            }
            setModalOpen(false);
            cargarPaginas();
        } catch (error: any) {
            console.error('Error guardando página', error);
            alert(error.response?.data?.message || 'Error al guardar');
        }
    };

    const toggleVisibilidad = async (pagina: Pagina) => {
        try {
            await clienteAxios.patch(`/paginas/${pagina.id}`, { esPublica: !pagina.esPublica });
            cargarPaginas();
        } catch (error) {
            console.error('Error actualizando visibilidad', error);
        }
    };

    // --- Helpers para el Editor de Inicio ---
    const updateMeta = (key: string, value: any) => {
        setForm(prev => ({
            ...prev,
            meta: { ...prev.meta, [key]: value }
        }));
    };

    const addFaq = () => {
        const faqs = form.meta.faqs || [];
        updateMeta('faqs', [...faqs, { question: '', answer: '', icon: 'help' }]);
    };

    const updateFaq = (index: number, field: string, value: string) => {
        const faqs = [...(form.meta.faqs || [])];
        faqs[index] = { ...faqs[index], [field]: value };
        updateMeta('faqs', faqs);
    };

    const removeFaq = (index: number) => {
        const faqs = [...(form.meta.faqs || [])];
        faqs.splice(index, 1);
        updateMeta('faqs', faqs);
    };

    const moveFaq = (index: number, direction: 'up' | 'down') => {
        const faqs = [...(form.meta.faqs || [])];
        if (direction === 'up' && index > 0) {
            [faqs[index], faqs[index - 1]] = [faqs[index - 1], faqs[index]];
        } else if (direction === 'down' && index < faqs.length - 1) {
            [faqs[index], faqs[index + 1]] = [faqs[index + 1], faqs[index]];
        }
        updateMeta('faqs', faqs);
    };

    const addPolicy = () => {
        const polices = form.meta.polices || [];
        updateMeta('polices', [...polices, { title: '', url: '', description: '' }]);
    };

    const updatePolicy = (index: number, field: string, value: string) => {
        const polices = [...(form.meta.polices || [])];
        polices[index] = { ...polices[index], [field]: value };
        updateMeta('polices', polices);
    };

    const removePolicy = (index: number) => {
        const polices = [...(form.meta.polices || [])];
        polices.splice(index, 1);
        updateMeta('polices', polices);
    };

    const openMediaSelector = (field: string) => {
        setMediaTargetField(field);
        setShowMediaSelector(true);
    };

    const handleMediaSelect = (url: string) => {
        if (mediaTargetField) {
            if (mediaTargetField.startsWith('polices.')) {
                // Handle nested policy URL
                const parts = mediaTargetField.split('.');
                const index = parseInt(parts[1]);
                updatePolicy(index, 'url', url);
            } else {
                updateMeta(mediaTargetField, url);
            }
        }
        setShowMediaSelector(false);
        setMediaTargetField(null);
    };

    const TabButton = ({ id, label, icon: Icon }: { id: string, label: string, icon: any }) => (
        <button
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === id
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
        >
            <Icon className="w-4 h-4" />
            {label}
        </button>
    );

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Gestor de Páginas</h1>
                    <p className="text-gray-500">Administra el contenido y visibilidad de tus páginas.</p>
                </div>
                <button
                    onClick={handleCrear}
                    className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    Nueva Página
                </button>
            </div>

            {/* Listado */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {paginas.length === 0 && !cargando ? (
                    <div className="p-10 text-center text-gray-400 flex flex-col items-center">
                        <Globe className="w-12 h-12 mb-3 opacity-20" />
                        <p>No hay páginas creadas aún.</p>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-medium">
                            <tr>
                                <th className="px-6 py-4">Título / URL</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4">Última Edición</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginas.map((pagina) => (
                                <tr key={pagina.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{pagina.titulo}</div>
                                        <div className="text-xs text-gray-400 font-mono mt-0.5">/{pagina.slug}</div>
                                        {['inicio', '/inicio'].includes(pagina.slug) && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded ml-1">HOME</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => toggleVisibilidad(pagina)}
                                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${pagina.esPublica
                                                ? 'bg-green-50 text-green-700 border-green-100 hover:bg-green-100'
                                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                                }`}
                                        >
                                            {pagina.esPublica ? <Globe className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                            {pagina.esPublica ? 'Pública' : 'Borrador'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(pagina.fechaActualizacion).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEditar(pagina)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <a
                                                href={pagina.slug === 'inicio' ? '/inicio-v2' : `/${pagina.slug}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                title="Ver Página Pública"
                                            >
                                                <Globe className="w-4 h-4" />
                                            </a>
                                            <button
                                                onClick={() => eliminarPagina(pagina.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal de Creación/Edición */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-lg font-bold text-gray-800">
                                {modoEdicion ? 'Editar Página' : 'Nueva Página'}
                            </h2>
                            <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col">
                            {/* General Settings */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 pb-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.titulo}
                                        onChange={handleTituloChange}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
                                        placeholder="Ej: Nuestra Historia"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
                                    <div className="flex items-center">
                                        <span className="px-3 py-2 bg-gray-100 border border-r-0 border-gray-200 rounded-l-lg text-gray-500 text-sm">/</span>
                                        <input
                                            type="text"
                                            required
                                            value={form.slug}
                                            onChange={e => setForm({ ...form, slug: e.target.value })}
                                            className="flex-1 px-4 py-2 border border-gray-200 rounded-r-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-mono text-sm bg-white"
                                            placeholder="nuestra-historia"
                                        />
                                    </div>
                                </div>
                                <div className="md:col-span-2 flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="esPublica"
                                        checked={form.esPublica}
                                        onChange={e => setForm({ ...form, esPublica: e.target.checked })}
                                        className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                                    />
                                    <label htmlFor="esPublica" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                                        Hacer pública
                                    </label>
                                </div>
                            </div>

                            {['inicio', '/inicio'].includes(form.slug) ? (
                                <div className="flex-1 flex flex-col min-h-0 border-t border-gray-100">
                                    <div className="flex px-6 bg-gray-50/50 border-b border-gray-100 overflow-x-auto">
                                        <TabButton id="hero" label="Principal (Hero)" icon={Layout} />
                                        <TabButton id="sst" label="Seguridad (SST)" icon={Shield} />
                                        <TabButton id="faq" label="FAQ" icon={HelpCircle} />
                                        <TabButton id="contacto" label="Contacto" icon={Phone} />
                                        {/* <TabButton id="seo" label="SEO" icon={Globe} /> */}
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                        {/* HERO TAB */}
                                        {activeTab === 'hero' && (
                                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <div className="md:col-span-2">
                                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título Grande</label>
                                                        <textarea
                                                            rows={2}
                                                            value={form.meta.heroTitle || ''}
                                                            onChange={e => updateMeta('heroTitle', e.target.value)}
                                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none text-xl font-bold font-serif"
                                                            placeholder="ALVARO VACA 2026..."
                                                        ></textarea>
                                                        <p className="text-xs text-gray-400 mt-1">Soporta HTML básico.</p>
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subtítulo</label>
                                                        <textarea
                                                            rows={2}
                                                            value={form.meta.heroSubtitle || ''}
                                                            onChange={e => updateMeta('heroSubtitle', e.target.value)}
                                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                                            placeholder="Líderes en gestión integral..."
                                                        ></textarea>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Etiqueta Superior</label>
                                                        <input
                                                            type="text"
                                                            value={form.meta.heroLabel || ''}
                                                            onChange={e => updateMeta('heroLabel', e.target.value)}
                                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none"
                                                            placeholder="Operaciones 24/7..."
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Texto Botón Principal</label>
                                                        <input
                                                            type="text"
                                                            value={form.meta.heroButtonText || ''}
                                                            onChange={e => updateMeta('heroButtonText', e.target.value)}
                                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none"
                                                            placeholder="Nuestros Servicios"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">URL Botón Principal</label>
                                                        <input
                                                            type="text"
                                                            value={form.meta.heroButtonUrl || ''}
                                                            onChange={e => updateMeta('heroButtonUrl', e.target.value)}
                                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none"
                                                            placeholder="#servicios"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Texto 'Descubre Más'</label>
                                                        <input
                                                            type="text"
                                                            value={form.meta.heroDiscoverText || ''}
                                                            onChange={e => updateMeta('heroDiscoverText', e.target.value)}
                                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none"
                                                            placeholder="Descubre más"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Imagen de Fondo</label>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                value={form.meta.heroBgImage || ''}
                                                                onChange={e => updateMeta('heroBgImage', e.target.value)}
                                                                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg outline-none text-sm bg-gray-50"
                                                                placeholder="Selecciona una imagen..."
                                                                readOnly
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => openMediaSelector('heroBgImage')}
                                                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 border border-gray-200"
                                                            >
                                                                <ImageIcon className="w-4 h-4" /> Seleccionar
                                                            </button>
                                                        </div>
                                                        <p className="text-xs text-gray-400 mt-1">Recomendado: 1920x1080px. Se aplica un degradado encima automáticamente.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* SST TAB */}
                                        {activeTab === 'sst' && (
                                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subtítulo (Top)</label>
                                                        <input
                                                            type="text"
                                                            value={form.meta.sstSubtitle || ''}
                                                            onChange={e => updateMeta('sstSubtitle', e.target.value)}
                                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none"
                                                            placeholder="Seguridad Corporativa"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título Grande</label>
                                                        <textarea
                                                            rows={2}
                                                            value={form.meta.sstTitle || ''}
                                                            onChange={e => updateMeta('sstTitle', e.target.value)}
                                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none text-lg font-bold"
                                                            placeholder="Gestión de Seguridad..."
                                                        ></textarea>
                                                        <p className="text-xs text-gray-400 mt-1">Soporta HTML.</p>
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción</label>
                                                        <textarea
                                                            rows={3}
                                                            value={form.meta.sstDescription || ''}
                                                            onChange={e => updateMeta('sstDescription', e.target.value)}
                                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none"
                                                            placeholder="Cumplimos con los estándares..."
                                                        ></textarea>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Texto Botón</label>
                                                        <input
                                                            type="text"
                                                            value={form.meta.sstButtonText || ''}
                                                            onChange={e => updateMeta('sstButtonText', e.target.value)}
                                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none"
                                                            placeholder="Ver Políticas"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">URL Botón</label>
                                                        <input
                                                            type="text"
                                                            value={form.meta.sstButtonUrl || ''}
                                                            onChange={e => updateMeta('sstButtonUrl', e.target.value)}
                                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none"
                                                            placeholder="#"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Imagen Derecha</label>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                value={form.meta.sstImage || ''}
                                                                onChange={e => updateMeta('sstImage', e.target.value)}
                                                                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg outline-none text-sm bg-gray-50"
                                                                placeholder="Selecciona una imagen..."
                                                                readOnly
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => openMediaSelector('sstImage')}
                                                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 border border-gray-200"
                                                            >
                                                                <ImageIcon className="w-4 h-4" /> Seleccionar
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* CONTACT TAB */}
                                        {activeTab === 'contacto' && (
                                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción Intro</label>
                                                    <textarea
                                                        rows={2}
                                                        value={form.meta.contactDescription || ''}
                                                        onChange={e => updateMeta('contactDescription', e.target.value)}
                                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none"
                                                        placeholder="Visítenos en nuestra sede..."
                                                    ></textarea>
                                                </div>
                                            </div>
                                        )}

                                        {/* FAQ TAB */}
                                        {activeTab === 'faq' && (
                                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                <div className="flex justify-between items-center bg-blue-50/50 p-4 rounded-lg">
                                                    <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                                                        Lista de Preguntas
                                                    </h3>
                                                    <button
                                                        type="button"
                                                        onClick={addFaq}
                                                        className="text-sm bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                                                    >
                                                        <Plus className="w-4 h-4" /> Agregar Nueva
                                                    </button>
                                                </div>

                                                <div className="space-y-3">
                                                    {(form.meta.faqs || []).map((faq: any, index: number) => (
                                                        <div key={index} className="bg-white border border-gray-200 rounded-xl p-4 relative group hover:shadow-md transition-all">
                                                            <div className="absolute right-3 top-3 flex gap-1 bg-white shadow-sm p-1 rounded-lg border border-gray-100 opacity-60 group-hover:opacity-100 transition-opacity">
                                                                <button type="button" onClick={() => moveFaq(index, 'up')} className="p-1 hover:bg-gray-100 rounded text-gray-500"><ChevronUp className="w-4 h-4" /></button>
                                                                <button type="button" onClick={() => moveFaq(index, 'down')} className="p-1 hover:bg-gray-100 rounded text-gray-500"><ChevronDown className="w-4 h-4" /></button>
                                                                <button type="button" onClick={() => removeFaq(index)} className="p-1 hover:bg-red-50 text-red-500 rounded"><X className="w-4 h-4" /></button>
                                                            </div>
                                                            <div className="grid gap-4 pr-12">
                                                                <div>
                                                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Pregunta</label>
                                                                    <input
                                                                        type="text"
                                                                        value={faq.question}
                                                                        onChange={(e) => updateFaq(index, 'question', e.target.value)}
                                                                        className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 font-medium focus:ring-2 focus:ring-primary/10 outline-none"
                                                                        placeholder="¿Pregunta?"
                                                                    />
                                                                </div>
                                                                <div className="flex flex-col sm:flex-row gap-4">
                                                                    <div className="w-full sm:w-1/3">
                                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Icono</label>
                                                                        <SelectorIconos
                                                                            value={faq.icon}
                                                                            onChange={(newIcon) => updateFaq(index, 'icon', newIcon)}
                                                                        />
                                                                    </div>
                                                                    <div className="w-full sm:w-2/3">
                                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Respuesta</label>
                                                                        <textarea
                                                                            rows={2}
                                                                            value={faq.answer}
                                                                            onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                                                                            className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm text-gray-600 focus:ring-2 focus:ring-primary/10 outline-none"
                                                                            placeholder="Respuesta..."
                                                                        ></textarea>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {(form.meta.faqs || []).length === 0 && (
                                                        <div className="text-center p-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 bg-gray-50/50">
                                                            No hay preguntas frecuentes. Agrega una arriba.
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="border-t border-gray-100 pt-6 mt-6">
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Imagen Inferior (Opcional)</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={form.meta.faqFooterImage || ''}
                                                            onChange={e => updateMeta('faqFooterImage', e.target.value)}
                                                            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg outline-none text-sm bg-gray-50"
                                                            placeholder="Selecciona una imagen para el pie de la sección FAQ..."
                                                            readOnly
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => openMediaSelector('faqFooterImage')}
                                                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 border border-gray-200"
                                                        >
                                                            <ImageIcon className="w-4 h-4" /> Seleccionar
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-gray-400 mt-1">Se mostrará debajo de las preguntas frecuentes. Altura recomendada pequeña.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : ['nosotros', '/nosotros'].includes(form.slug) ? (
                                <div className="flex-1 overflow-y-auto p-6 space-y-6 border-t border-gray-100">
                                    <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Configuración de "Nosotros"</h3>

                                    {/* HERO SECTION */}
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                                        <h4 className="font-bold text-gray-600 text-sm uppercase">Sección Hero</h4>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Etiqueta Superior</label>
                                                <input
                                                    type="text"
                                                    value={form.meta.heroLabel || ''}
                                                    onChange={e => updateMeta('heroLabel', e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none"
                                                    placeholder="Trayectoria & Excelencia"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título</label>
                                                <input
                                                    type="text"
                                                    value={form.meta.title || ''}
                                                    onChange={e => updateMeta('title', e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none"
                                                    placeholder="Conoce Quiénes Somos"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subtítulo</label>
                                                <textarea
                                                    rows={2}
                                                    value={form.meta.subtitle || ''}
                                                    onChange={e => updateMeta('subtitle', e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none"
                                                    placeholder="Liderando la movilidad..."
                                                ></textarea>
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Imagen Principal (Hero)</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={form.meta.mainImage || ''}
                                                        onChange={e => updateMeta('mainImage', e.target.value)}
                                                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg outline-none text-sm bg-white"
                                                        readOnly
                                                    />
                                                    <button type="button" onClick={() => openMediaSelector('mainImage')} className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 border border-gray-200">
                                                        <ImageIcon className="w-4 h-4" /> Seleccionar
                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Texto Botón</label>
                                                <input
                                                    type="text"
                                                    value={form.meta.heroCtaText || ''}
                                                    onChange={e => updateMeta('heroCtaText', e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none"
                                                    placeholder="Explorar Historia"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Enlace Botón</label>
                                                <input
                                                    type="text"
                                                    value={form.meta.heroCtaLink || ''}
                                                    onChange={e => updateMeta('heroCtaLink', e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none"
                                                    placeholder="#historia"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* MISION / VISION / IMAGE LEFT */}
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                                        <h4 className="font-bold text-gray-600 text-sm uppercase">Columna Izquierda (Misión/Visión)</h4>
                                        <div className="grid gap-4">
                                            <div className="grid md:grid-cols-2 gap-4 border-b border-gray-200 pb-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título Misión</label>
                                                    <input
                                                        type="text"
                                                        value={form.meta.misionTitle || ''}
                                                        onChange={e => updateMeta('misionTitle', e.target.value)}
                                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none"
                                                        placeholder="Nuestra Misión"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título Visión</label>
                                                    <input
                                                        type="text"
                                                        value={form.meta.visionTitle || ''}
                                                        onChange={e => updateMeta('visionTitle', e.target.value)}
                                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none"
                                                        placeholder="Nuestra Visión"
                                                    />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Texto Misión</label>
                                                    <textarea
                                                        rows={3}
                                                        value={form.meta.misionText || ''}
                                                        onChange={e => updateMeta('misionText', e.target.value)}
                                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none"
                                                        placeholder="Brindar servicios integrales..."
                                                    ></textarea>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Texto Visión</label>
                                                    <textarea
                                                        rows={3}
                                                        value={form.meta.visionText || ''}
                                                        onChange={e => updateMeta('visionText', e.target.value)}
                                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none"
                                                        placeholder="Ser reconocidos a nivel municipal..."
                                                    ></textarea>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Imagen de Sección</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={form.meta.sectionImage || ''}
                                                        onChange={e => updateMeta('sectionImage', e.target.value)}
                                                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg outline-none text-sm bg-white"
                                                        readOnly
                                                        placeholder="Imagen para acompañar Misión/Visión"
                                                    />
                                                    <button type="button" onClick={() => openMediaSelector('sectionImage')} className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 border border-gray-200">
                                                        <ImageIcon className="w-4 h-4" /> Seleccionar
                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Enlace 'Trabaja con nosotros'</label>
                                                <input
                                                    type="text"
                                                    value={form.meta.workLink || ''}
                                                    onChange={e => updateMeta('workLink', e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none"
                                                    placeholder="/contacto"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* VALUES REPEATER */}
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-bold text-gray-600 text-sm uppercase">Valores Organizacionales (Slider)</h4>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const values = form.meta.values || [];
                                                    updateMeta('values', [...values, { icon: 'star', title: '', description: '' }]);
                                                }}
                                                className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-primary/90"
                                            >
                                                <Plus className="w-3 h-3" /> Agregar Valor
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {(form.meta.values || []).map((val: any, idx: number) => (
                                                <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 relative group">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const values = [...form.meta.values];
                                                            values.splice(idx, 1);
                                                            updateMeta('values', values);
                                                        }}
                                                        className="absolute top-2 right-2 text-red-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                    <div className="flex flex-col sm:flex-row gap-4">
                                                        <div className="w-full sm:w-1/4">
                                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Icono</label>
                                                            <SelectorIconos
                                                                value={val.icon}
                                                                onChange={(newIcon) => {
                                                                    const values = [...form.meta.values];
                                                                    values[idx] = { ...values[idx], icon: newIcon };
                                                                    updateMeta('values', values);
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="flex-1 space-y-3">
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Título</label>
                                                                <input
                                                                    type="text"
                                                                    value={val.title}
                                                                    onChange={e => {
                                                                        const values = [...form.meta.values];
                                                                        values[idx] = { ...values[idx], title: e.target.value };
                                                                        updateMeta('values', values);
                                                                    }}
                                                                    className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm outline-none"
                                                                    placeholder="Ej: Legalidad"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Descripción</label>
                                                                <textarea
                                                                    rows={2}
                                                                    value={val.description}
                                                                    onChange={e => {
                                                                        const values = [...form.meta.values];
                                                                        values[idx] = { ...values[idx], description: e.target.value };
                                                                        updateMeta('values', values);
                                                                    }}
                                                                    className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm outline-none"
                                                                    placeholder="Breve descripción..."
                                                                ></textarea>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {(form.meta.values || []).length === 0 && (
                                                <div className="text-center p-6 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 text-sm">
                                                    No hay valores agregados.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* FOOTER CTA */}
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                                        <h4 className="font-bold text-gray-600 text-sm uppercase">Pie de Página (CTA)</h4>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título Footer</label>
                                                <input
                                                    type="text"
                                                    value={form.meta.footerTitle || ''}
                                                    onChange={e => updateMeta('footerTitle', e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none"
                                                    placeholder="Compromiso con el Meta"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción Footer</label>
                                                <textarea
                                                    rows={2}
                                                    value={form.meta.footerDescription || ''}
                                                    onChange={e => updateMeta('footerDescription', e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none"
                                                    placeholder="Estamos presentes en los municipios claves..."
                                                ></textarea>
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Imagen "Compromiso" (Footer)</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={form.meta.footerImage || ''}
                                                        onChange={e => updateMeta('footerImage', e.target.value)}
                                                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg outline-none text-sm bg-white"
                                                        readOnly
                                                        placeholder="Imagen decorativa del footer"
                                                    />
                                                    <button type="button" onClick={() => openMediaSelector('footerImage')} className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 border border-gray-200">
                                                        <ImageIcon className="w-4 h-4" /> Seleccionar
                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Texto Botón</label>
                                                <input
                                                    type="text"
                                                    value={form.meta.footerCtaText || ''}
                                                    onChange={e => updateMeta('footerCtaText', e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none"
                                                    placeholder="Contactar Sede Principal"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Enlace Botón</label>
                                                <input
                                                    type="text"
                                                    value={form.meta.footerCtaLink || ''}
                                                    onChange={e => updateMeta('footerCtaLink', e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none"
                                                    placeholder="/contacto"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="md:col-span-2 pt-4 border-t border-gray-100">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contenido HTML Adicional (Inferior)</label>
                                        <textarea
                                            rows={10}
                                            value={form.meta.content || ''}
                                            onChange={e => updateMeta('content', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none font-mono text-sm"
                                            placeholder="<p>Este contenido aparecerá al final de la página...</p>"
                                        ></textarea>
                                    </div>
                                </div>
                            ) : ['sst', '/sst'].includes(form.slug) ? (
                                <div className="flex-1 overflow-y-auto p-6 space-y-6 border-t border-gray-100">
                                    <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Contenido de "SST"</h3>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título Hero</label>
                                            <input
                                                type="text"
                                                value={form.meta.title || ''}
                                                onChange={e => updateMeta('title', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none"
                                                placeholder="SST: Seguridad y Salud"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subtítulo Hero</label>
                                            <textarea
                                                rows={2}
                                                value={form.meta.subtitle || ''}
                                                onChange={e => updateMeta('subtitle', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none"
                                                placeholder="Protegemos lo más valioso..."
                                            ></textarea>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Imagen Hero</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={form.meta.heroImage || ''}
                                                    onChange={e => updateMeta('heroImage', e.target.value)}
                                                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg outline-none text-sm bg-gray-50"
                                                    readOnly
                                                />
                                                <button type="button" onClick={() => openMediaSelector('heroImage')} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 border border-gray-200">
                                                    <ImageIcon className="w-4 h-4" /> Seleccionar
                                                </button>
                                            </div>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contenido (HTML)</label>
                                            <textarea
                                                rows={8}
                                                value={form.meta.content || ''}
                                                onChange={e => updateMeta('content', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none font-mono text-sm"
                                            ></textarea>
                                        </div>

                                        {/* Policies Section */}
                                        <div className="md:col-span-2 bg-gray-50 p-6 rounded-2xl border border-gray-200">
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="font-bold text-gray-700">Políticas y Documentos</h4>
                                                <button type="button" onClick={addPolicy} className="bg-primary text-white px-3 py-1 rounded-lg text-xs flex items-center gap-1">
                                                    <Plus className="w-3 h-3" /> Agregar
                                                </button>
                                            </div>
                                            <div className="space-y-4">
                                                {(form.meta.polices || []).map((policy: any, idx: number) => (
                                                    <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative group">
                                                        <button type="button" onClick={() => removePolicy(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                        <div className="grid gap-3">
                                                            <input
                                                                type="text"
                                                                value={policy.title}
                                                                onChange={e => updatePolicy(idx, 'title', e.target.value)}
                                                                className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm outline-none"
                                                                placeholder="Título del documento"
                                                            />
                                                            <div className="flex gap-2">
                                                                <input
                                                                    type="text"
                                                                    value={policy.url}
                                                                    onChange={e => updatePolicy(idx, 'url', e.target.value)}
                                                                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded text-sm outline-none bg-gray-50"
                                                                    placeholder="URL del archivo (PDF)"
                                                                    readOnly
                                                                />
                                                                <button type="button" onClick={() => {
                                                                    setMediaTargetField(`polices.${idx}.url`);
                                                                    setShowMediaSelector(true);
                                                                }} className="bg-gray-100 px-3 py-1 rounded border border-gray-200 text-xs">
                                                                    Elegir
                                                                </button>
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={policy.description}
                                                                onChange={e => updatePolicy(idx, 'description', e.target.value)}
                                                                className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm outline-none"
                                                                placeholder="Pequeña descripción"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 pt-0">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contenido (HTML)</label>
                                    <textarea
                                        rows={12}
                                        value={form.contenido}
                                        onChange={e => setForm({ ...form, contenido: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-mono text-sm"
                                        placeholder="<p>Escribe tu contenido aquí...</p>"
                                    ></textarea>
                                    <p className="text-xs text-gray-500 mt-1">Acepta HTML básico.</p>
                                </div>
                            )}

                            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/30 mt-auto">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-sm font-medium"
                                >
                                    {modoEdicion ? 'Guardar Cambios' : 'Crear Página'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Media Selector Modal */}
            {showMediaSelector && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl h-[700px] overflow-hidden flex flex-col relative">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <ImageIcon className="w-5 h-5 text-primary" />
                                Seleccionar Archivo
                            </h2>
                            <button
                                onClick={() => setShowMediaSelector(false)}
                                className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden p-4 bg-gray-50">
                            <Medios
                                selectionMode={true}
                                onSelect={handleMediaSelect}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
