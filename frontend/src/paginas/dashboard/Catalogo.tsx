import { useState, useEffect } from 'react';
import { Plus, Package, Briefcase, Tag, Edit, Trash2, Search, X, Archive, Settings, Layers, Box, Check, Palette } from 'lucide-react';
import clienteAxios from '../../lib/cliente-axios';

interface Categoria {
    id: string;
    nombre: string;
    descripcion?: string;
}

interface AtributoGlobal { id: string; nombre: string; valores?: { id: string; valor: string }[]; }
interface BadgeGlobal { id: string; texto: string; colorFondo: string; colorTexto: string; }

interface ItemCatalogo {
    id: string;
    nombre: string;
    sku?: string;
    descripcionCorta?: string;
    descripcionLarga?: string;
    precio: number;
    precioRebajado?: number;
    categoria?: Categoria;
    stock?: number;
    tipo?: 'simple' | 'variable' | 'kit' | 'virtual';
    atributos?: { nombre: string; valores: string }[];
    badges?: { texto: string; color: string }[];
    componentesKit?: { hijoId: string, cantidad: number, nombre?: string }[];
}

export default function Catalogo() {
    const [activeTab, setActiveTab] = useState<'productos' | 'servicios'>('productos');
    const [subTab, setSubTab] = useState<'items' | 'categorias'>('items');

    // Data
    const [items, setItems] = useState<ItemCatalogo[]>([]);
    const [categorias, setCategorias] = useState<Categoria[]>([]);

    // Globals
    const [globalAtributos, setGlobalAtributos] = useState<AtributoGlobal[]>([]);
    const [globalBadges, setGlobalBadges] = useState<BadgeGlobal[]>([]);

    const [loading, setLoading] = useState(false);

    // Modals
    const [modalItemOpen, setModalItemOpen] = useState(false);
    const [modalCatOpen, setModalCatOpen] = useState(false);
    const [globalConfigOpen, setGlobalConfigOpen] = useState(false);

    // Editing
    const [editingItem, setEditingItem] = useState<ItemCatalogo | null>(null);
    const [editingCat, setEditingCat] = useState<Categoria | null>(null);

    // Forms
    const [formDataItem, setFormDataItem] = useState<any>({});
    const [formDataCat, setFormDataCat] = useState<any>({ nombre: '', descripcion: '' });

    // Product Modal Tab State
    const [productModalTab, setProductModalTab] = useState<'general' | 'inventario' | 'atributos' | 'kit'>('general');

    // Kit helpers
    const [kitSearchTerm, setKitSearchTerm] = useState('');
    const [kitSearchResults, setKitSearchResults] = useState<ItemCatalogo[]>([]);

    useEffect(() => {
        cargarDatos();
        cargarGlobales();
    }, [activeTab, subTab]);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            if (subTab === 'items') {
                const endpoint = activeTab === 'productos' ? '/catalogo/productos' : '/catalogo/servicios';
                const { data } = await clienteAxios.get(endpoint);
                setItems(data);

                const catEndpoint = activeTab === 'productos' ? '/catalogo/categorias-productos' : '/catalogo/categorias-servicios';
                const catRes = await clienteAxios.get(catEndpoint);
                setCategorias(catRes.data);
            } else {
                const endpoint = activeTab === 'productos' ? '/catalogo/categorias-productos' : '/catalogo/categorias-servicios';
                const { data } = await clienteAxios.get(endpoint);
                setCategorias(data);
            }
        } catch (error) {
            console.error('Error cargando datos:', error);
        } finally {
            setLoading(false);
        }
    };

    const cargarGlobales = async () => {
        try {
            const [resAttrs, resBadges] = await Promise.all([
                clienteAxios.get('/catalogo/atributos'),
                clienteAxios.get('/catalogo/badges')
            ]);
            setGlobalAtributos(resAttrs.data);
            setGlobalBadges(resBadges.data);
        } catch (e) { console.error("Error cargando globales", e); }
    };

    // --- Kit Handlers ---
    const searchForKit = (term: string) => {
        setKitSearchTerm(term);
        if (!term) { setKitSearchResults([]); return; }
        const found = items.filter(i => i.nombre.toLowerCase().includes(term.toLowerCase()) && i.id !== formDataItem.id);
        setKitSearchResults(found);
    };

    const addToKit = (item: ItemCatalogo) => {
        const current = formDataItem.componentesKit || [];
        if (current.find((k: any) => k.hijoId === item.id)) return;
        setFormDataItem({ ...formDataItem, componentesKit: [...current, { hijoId: item.id, cantidad: 1, nombre: item.nombre }] });
        setKitSearchTerm('');
        setKitSearchResults([]);
    };

    const removeFromKit = (idx: number) => {
        const current = [...(formDataItem.componentesKit || [])];
        current.splice(idx, 1);
        setFormDataItem({ ...formDataItem, componentesKit: current });
    };

    const handleSaveItem = async (e: React.FormEvent) => {
        e.preventDefault();
        const endpoint = activeTab === 'productos' ? '/catalogo/productos' : '/catalogo/servicios';
        try {
            const payload = {
                ...formDataItem,
                precio: Number(formDataItem.precio),
                precioRebajado: formDataItem.precioRebajado ? Number(formDataItem.precioRebajado) : null,
                stock: activeTab === 'productos' ? Number(formDataItem.stock || 0) : 0
            };

            if (editingItem) {
                // await clienteAxios.patch(`${endpoint}/${editingItem.id}`, payload);
                alert("Edición pendiente en backend. (Usando POST para simular)");
            } else {
                await clienteAxios.post(endpoint, payload);
            }
            setModalItemOpen(false);
            cargarDatos();
        } catch (error: any) {
            alert('Error: ' + error.message);
        }
    };

    const handleDeleteItem = async (id: string) => {
        if (!confirm('¿Eliminar?')) return;
        alert("Eliminación pendiente en backend");
    };

    const handleSaveCat = async (e: React.FormEvent) => {
        e.preventDefault();
        const endpoint = activeTab === 'productos' ? '/catalogo/categorias-productos' : '/catalogo/categorias-servicios';
        try {
            await clienteAxios.post(endpoint, formDataCat);
            setModalCatOpen(false);
            cargarDatos();
        } catch (error: any) {
            alert('Error: ' + error.message);
        }
    };

    // --- Dynamic Fields Handlers (Legacy removed, using direct handlers) ---

    // --- Attributes UI Helper ---
    const addAttributeToProduct = (attrName: string) => {
        const current = formDataItem.atributos || [];
        if (current.find((a: any) => a.nombre === attrName)) return;
        setFormDataItem({ ...formDataItem, atributos: [...current, { nombre: attrName, valores: '' }] });
    };

    const toggleBadge = (badge: BadgeGlobal) => {
        const current = formDataItem.badges || [];
        const exists = current.find((b: any) => b.texto === badge.texto);
        if (exists) {
            setFormDataItem({ ...formDataItem, badges: current.filter((b: any) => b.texto !== badge.texto) });
        } else {
            setFormDataItem({ ...formDataItem, badges: [...current, { texto: badge.texto, color: badge.colorFondo }] });
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Catálogo</h1>
                    <p className="text-gray-500 mt-1">Gestión avanzada de {activeTab}</p>
                </div>

                <div className="bg-gray-100 p-1 rounded-xl flex">
                    <button onClick={() => { setActiveTab('productos'); setSubTab('items'); }} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'productos' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}>
                        <Package className="w-5 h-5" /> Productos
                    </button>
                    <button onClick={() => { setActiveTab('servicios'); setSubTab('items'); }} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'servicios' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500'}`}>
                        <Briefcase className="w-5 h-5" /> Servicios
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-6 border-b border-gray-200 mb-6">
                <button onClick={() => setSubTab('items')} className={`pb-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${subTab === 'items' ? 'border-primary text-gray-900' : 'border-transparent text-gray-500'}`}>
                    <Search className="w-4 h-4" /> Listado
                </button>
                <button onClick={() => setSubTab('categorias')} className={`pb-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${subTab === 'categorias' ? 'border-primary text-gray-900' : 'border-transparent text-gray-500'}`}>
                    <Tag className="w-4 h-4" /> Categorías
                </button>
            </div>

            <div className="flex justify-end mb-6">
                <button
                    onClick={() => {
                        if (subTab === 'items') {
                            setFormDataItem({ tipo: 'simple', atributos: [], componentesKit: [], badges: [] });
                            setEditingItem(null);
                            setProductModalTab('general');
                            setModalItemOpen(true);
                        } else {
                            setFormDataCat({ nombre: '', descripcion: '' });
                            setEditingCat(null);
                            setModalCatOpen(true);
                        }
                    }}
                    className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg font-bold shadow-lg hover:bg-primary-dark transition-all"
                >
                    <Plus className="w-5 h-5" /> Nuevo {subTab === 'items' ? 'Ítem' : 'Categoría'}
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
                {loading ? <div className="p-10 text-center text-gray-400">Cargando...</div> :
                    subTab === 'items' ? (
                        items.length === 0 ? <div className="p-10 text-center text-gray-400">Sin registros.</div> :
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-bold">
                                    <tr>
                                        <th className="px-6 py-4">Producto</th>
                                        <th className="px-6 py-4">SKU</th>
                                        <th className="px-6 py-4">Precio</th>
                                        <th className="px-6 py-4">Stock</th>
                                        <th className="px-6 py-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {items.map(item => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900">{item.nombre}</div>
                                                <div className="text-xs text-gray-500 flex gap-2 items-center mt-1">
                                                    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 uppercase text-[10px] tracking-wider">{item.tipo}</span>
                                                    {item.sku}
                                                </div>
                                                <div className="flex gap-1 mt-1">
                                                    {(item.badges || []).map((b, i) => (
                                                        <span key={i} className="text-[10px] px-1 rounded text-white" style={{ backgroundColor: b.color }}>{b.texto}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs">{item.sku || '-'}</td>
                                            <td className="px-6 py-4">
                                                {item.precioRebajado ? (
                                                    <div>
                                                        <span className="text-green-600 font-bold">${item.precioRebajado}</span>
                                                        <span className="text-gray-400 line-through text-xs ml-2">${item.precio}</span>
                                                    </div>
                                                ) : <span className="text-gray-900 font-bold">${item.precio}</span>}
                                            </td>
                                            <td className="px-6 py-4 text-sm">{item.stock}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => { setEditingItem(item); setFormDataItem(item); setModalItemOpen(true); }} className="text-blue-500 hover:text-blue-700 mr-2"><Edit className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteItem(item.id)} className="text-red-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                    ) : (
                        // Categorias table
                        categorias.length === 0 ? <div className="p-10 text-center text-gray-400">Sin categorías.</div> :
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-bold">
                                    <tr>
                                        <th className="px-6 py-4">Nombre</th>
                                        <th className="px-6 py-4">Descripción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {categorias.map(cat => (
                                        <tr key={cat.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-bold">{cat.nombre}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{cat.descripcion}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                    )
                }
            </div>

            {/* --- MODAL AVANZADO DE PRODUCTO --- */}
            {modalItemOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg text-gray-800">{editingItem ? 'Editar' : 'Nuevo'} {activeTab}</h3>
                            <button onClick={() => setModalItemOpen(false)}><X className="w-6 h-6 text-gray-400 hover:text-red-500" /></button>
                        </div>

                        <div className="flex flex-1 overflow-hidden">
                            {/* Sidebar Tabs */}
                            <div className="w-64 bg-gray-50 border-r border-gray-100 p-4 space-y-2">
                                <button onClick={() => setProductModalTab('general')} className={`w-full text-left px-4 py-2 rounded-lg flex items-center gap-2 ${productModalTab === 'general' ? 'bg-white shadow-sm text-primary font-bold' : 'text-gray-600 hover:bg-gray-100'}`}>
                                    <Settings className="w-4 h-4" /> General
                                </button>
                                <button onClick={() => setProductModalTab('inventario')} className={`w-full text-left px-4 py-2 rounded-lg flex items-center gap-2 ${productModalTab === 'inventario' ? 'bg-white shadow-sm text-primary font-bold' : 'text-gray-600 hover:bg-gray-100'}`}>
                                    <Archive className="w-4 h-4" /> Inventario y Precio
                                </button>
                                <button onClick={() => setProductModalTab('atributos')} className={`w-full text-left px-4 py-2 rounded-lg flex items-center gap-2 ${productModalTab === 'atributos' ? 'bg-white shadow-sm text-primary font-bold' : 'text-gray-600 hover:bg-gray-100'}`}>
                                    <Layers className="w-4 h-4" /> Atributos y Extras
                                </button>
                                {formDataItem.tipo === 'kit' && (
                                    <button onClick={() => setProductModalTab('kit')} className={`w-full text-left px-4 py-2 rounded-lg flex items-center gap-2 ${productModalTab === 'kit' ? 'bg-white shadow-sm text-primary font-bold' : 'text-gray-600 hover:bg-gray-100'}`}><Box className="w-4 h-4" /> Componentes Kit</button>
                                )}
                            </div>

                            {/* Form Content */}
                            <div className="flex-1 overflow-y-auto p-8">
                                <form onSubmit={handleSaveItem} className="space-y-6 max-w-3xl">
                                    {productModalTab === 'general' && (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-1">Nombre del Producto</label>
                                                <input type="text" required value={formDataItem.nombre || ''} onChange={e => setFormDataItem({ ...formDataItem, nombre: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción Corta (Para Cards)</label>
                                                <textarea rows={2} value={formDataItem.descripcionCorta || ''} onChange={e => setFormDataItem({ ...formDataItem, descripcionCorta: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"></textarea>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción Larga (Detalle)</label>
                                                <textarea rows={6} value={formDataItem.descripcionLarga || ''} onChange={e => setFormDataItem({ ...formDataItem, descripcionLarga: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"></textarea>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                                                <select value={formDataItem.categoria?.id || formDataItem.categoria || ''} onChange={e => setFormDataItem({ ...formDataItem, categoria: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white">
                                                    <option value="">Sin Categoría</option>
                                                    {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    {productModalTab === 'inventario' && (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-1">Tipo de Producto</label>
                                                <select value={formDataItem.tipo || 'simple'} onChange={e => setFormDataItem({ ...formDataItem, tipo: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white">
                                                    <option value="simple">Producto Simple</option>
                                                    <option value="variable">Producto Variable</option>
                                                    <option value="kit">Kit (Combo)</option>
                                                    <option value="virtual">Servicio / Virtual</option>
                                                </select>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio Normal ($)</label>
                                                    <input type="number" required value={formDataItem.precio || ''} onChange={e => setFormDataItem({ ...formDataItem, precio: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio Rebajado ($)</label>
                                                    <input type="number" value={formDataItem.precioRebajado || ''} onChange={e => setFormDataItem({ ...formDataItem, precioRebajado: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg" placeholder="Opcional" />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU (Referencia)</label>
                                                    <input type="text" value={formDataItem.sku || ''} onChange={e => setFormDataItem({ ...formDataItem, sku: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock (Unidades)</label>
                                                    <input type="number" value={formDataItem.stock || ''} onChange={e => setFormDataItem({ ...formDataItem, stock: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {productModalTab === 'atributos' && (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                            <div className="flex justify-end">
                                                <button type="button" onClick={() => setGlobalConfigOpen(true)} className="flex items-center gap-2 text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg text-gray-700 font-bold transition">
                                                    <Settings className="w-4 h-4" /> Gestionar Globales
                                                </button>
                                            </div>
                                            {/* Attributes Section */}
                                            <div>
                                                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                                                    <h4 className="font-bold text-blue-900 mb-2">Atributos Globales</h4>
                                                    <p className="text-xs text-blue-700 mb-3 block">Selecciona atributos para habilitar variaciones (ej: Color, Talla).</p>
                                                    <div className="flex gap-2">
                                                        <select className="flex-1 border p-2 rounded bg-white text-sm" onChange={(e) => { if (e.target.value) addAttributeToProduct(e.target.value); }}>
                                                            <option value="">+ Agregar atributo...</option>
                                                            {globalAtributos.map(ga => <option key={ga.id} value={ga.nombre}>{ga.nombre}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    {(formDataItem.atributos || []).map((attr: any, idx: number) => {
                                                        const globalDef = globalAtributos.find(g => g.nombre === attr.nombre);
                                                        return (
                                                            <div key={idx} className="border border-gray-200 p-4 rounded-lg bg-white shadow-sm">
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <label className="font-bold text-gray-800">{attr.nombre}</label>
                                                                    <button type="button" onClick={() => { const a = [...formDataItem.atributos]; a.splice(idx, 1); setFormDataItem({ ...formDataItem, atributos: a }) }} className="text-red-500 text-xs hover:underline">Quitar</button>
                                                                </div>
                                                                <input
                                                                    className="w-full border-gray-300 border p-2 rounded text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                                                    placeholder="Valores (separados por | ejemplo: S|M|L)"
                                                                    value={attr.valores}
                                                                    onChange={(e) => { const a = [...formDataItem.atributos]; a[idx].valores = e.target.value; setFormDataItem({ ...formDataItem, atributos: a }) }}
                                                                />
                                                                {globalDef && (globalDef.valores || []).length > 0 && (
                                                                    <div className="mt-2 flex flex-wrap gap-1">
                                                                        <span className="text-[10px] text-gray-400 w-full mb-1">Opciones Globales (Click para agregar):</span>
                                                                        {(globalDef.valores || []).map(val => (
                                                                            <button
                                                                                key={val.id}
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const current = attr.valores ? attr.valores.split('|').filter((s: string) => s.trim() !== '') : [];
                                                                                    if (!current.includes(val.valor)) {
                                                                                        const newVal = [...current, val.valor].join('|');
                                                                                        const a = [...formDataItem.atributos];
                                                                                        a[idx].valores = newVal;
                                                                                        setFormDataItem({ ...formDataItem, atributos: a });
                                                                                    }
                                                                                }}
                                                                                className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100 hover:bg-blue-100 transition"
                                                                            >
                                                                                {val.valor}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                <p className="text-[10px] text-gray-400 mt-2">Puedes escribir manual o elegir sugerencias. Usa '|' para separar.</p>
                                                            </div>
                                                        );
                                                    })}
                                                    {(formDataItem.atributos || []).length === 0 && <p className="text-sm text-gray-400 italic text-center py-4">No hay atributos asignados.</p>}
                                                </div>
                                            </div>

                                            {/* Badges Section */}
                                            <div className="pt-6 border-t border-gray-100">
                                                <div className="flex justify-between items-center mb-3">
                                                    <h4 className="font-bold text-gray-800">Badges / Etiquetas</h4>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {globalBadges.map(badge => {
                                                        const isSelected = (formDataItem.badges || []).find((b: any) => b.texto === badge.texto);
                                                        return (
                                                            <button
                                                                key={badge.id}
                                                                type="button"
                                                                onClick={() => toggleBadge(badge)}
                                                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${isSelected ? 'ring-2 ring-offset-1 ring-primary border-transparent' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                                                                style={{ backgroundColor: isSelected ? badge.colorFondo : '#ffffff', color: isSelected ? badge.colorTexto : 'inherit' }}
                                                            >
                                                                {badge.texto}
                                                            </button>
                                                        );
                                                    })}
                                                    {globalBadges.length === 0 && <p className="text-xs text-gray-400 italic">No hay badges globales creados.</p>}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {productModalTab === 'kit' && (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                            <div className="bg-orange-50 p-4 rounded-lg">
                                                <label className="font-bold block mb-2 text-orange-900">Buscar productos para el Kit</label>
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                                    <input
                                                        className="w-full border p-2 pl-9 rounded"
                                                        placeholder="Escribe el nombre del producto..."
                                                        value={kitSearchTerm}
                                                        onChange={e => searchForKit(e.target.value)}
                                                    />
                                                </div>
                                                {kitSearchResults.length > 0 && (
                                                    <div className="bg-white border rounded mt-2 max-h-40 overflow-y-auto shadow-sm">
                                                        {kitSearchResults.map(res => (
                                                            <div key={res.id} onClick={() => addToKit(res)} className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between">
                                                                <span>{res.nombre}</span>
                                                                <span className="font-bold text-green-600">${res.precio}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                <h4 className="font-bold mb-2">Contenido del Kit</h4>
                                                {(formDataItem.componentesKit || []).length === 0 && <p className="text-gray-400 italic">No hay productos en este kit.</p>}
                                                {(formDataItem.componentesKit || []).map((comp: any, idx: number) => (
                                                    <div key={idx} className="flex items-center gap-4 border-b py-2">
                                                        <span className="flex-1 font-medium">{comp.nombre || 'Producto ID ' + comp.hijoId}</span>
                                                        <input type="number" min="1" className="w-20 border p-1 rounded text-center" value={comp.cantidad} onChange={(e) => { const c = [...formDataItem.componentesKit]; c[idx].cantidad = parseInt(e.target.value); setFormDataItem({ ...formDataItem, componentesKit: c }) }} />
                                                        <button type="button" onClick={() => removeFromKit(idx)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Footer Actions */}
                                    <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                                        <button type="button" onClick={() => setModalItemOpen(false)} className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                                        <button type="submit" className="px-6 py-2 bg-primary text-white font-bold rounded shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all">Guardar Producto</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL CATEGORIAS --- */}
            {modalCatOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg">Nueva Categoría de {activeTab === 'productos' ? 'Producto' : 'Servicio'}</h3>
                            <button onClick={() => setModalCatOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleSaveCat} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                <input type="text" required autoFocus value={formDataCat.nombre} onChange={e => setFormDataCat({ ...formDataCat, nombre: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                <textarea rows={3} value={formDataCat.descripcion} onChange={e => setFormDataCat({ ...formDataCat, descripcion: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"></textarea>
                            </div>
                            <div className="pt-4 flex justify-end gap-2">
                                <button type="button" onClick={() => setModalCatOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                                <button type="submit" className={`px-6 py-2 text-white font-bold rounded-lg shadow-lg active:scale-95 transition-all ${activeTab === 'productos' ? 'bg-primary hover:bg-primary-dark' : 'bg-orange-500 hover:bg-orange-600'}`}>Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* --- MODAL CONFIGURACION GLOBAL --- */}
            {globalConfigOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2"><Settings className="w-5 h-5" /> Configuración Global</h3>
                            <button onClick={() => setGlobalConfigOpen(false)}><X className="w-6 h-6 text-gray-400 hover:text-red-500" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 flex flex-col md:flex-row gap-6">

                            {/* COLUMNA ATRIBUTOS */}
                            <div className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col">
                                <h4 className="font-bold text-lg mb-4 text-blue-900 border-b pb-2 flex justify-between">
                                    Atributos
                                    <span className="text-xs font-normal text-gray-500 self-center">Variaciones</span>
                                </h4>
                                <div className="space-y-4 mb-4 flex-1 overflow-y-auto pr-2">
                                    {globalAtributos.length === 0 && <p className="text-sm text-center text-gray-400 mt-10">Sin atributos.</p>}
                                    {globalAtributos.map(attr => (
                                        <div key={attr.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Layers className="w-4 h-4 text-gray-400" />
                                                <input
                                                    defaultValue={attr.nombre}
                                                    className="flex-1 bg-transparent border-none focus:ring-0 font-bold text-gray-700 p-0 text-sm"
                                                    onBlur={(e) => {
                                                        if (e.target.value !== attr.nombre && e.target.value.trim() !== '') {
                                                            clienteAxios.patch(`/catalogo/atributos/${attr.id}`, { nombre: e.target.value }).then(cargarGlobales);
                                                        }
                                                    }}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                                                />
                                                <button onClick={async () => {
                                                    if (confirm('¿Eliminar esta definición de atributo?')) {
                                                        await clienteAxios.delete(`/catalogo/atributos/${attr.id}`);
                                                        cargarGlobales();
                                                    }
                                                }} className="text-red-400 hover:text-red-600 p-1"><Trash2 className="w-4 h-4" /></button>
                                            </div>

                                            {/* Valores del Atributo */}
                                            <div className="pl-6">
                                                <div className="flex flex-wrap gap-2 mb-2">
                                                    {(attr.valores || []).map((val: any) => (
                                                        <span key={val.id} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600">
                                                            {val.valor}
                                                            <button onClick={async () => {
                                                                if (confirm('¿Borrar valor?')) {
                                                                    await clienteAxios.delete(`/catalogo/valores-atributos/${val.id}`);
                                                                    cargarGlobales();
                                                                }
                                                            }} className="text-red-400 hover:text-red-600"><X className="w-3 h-3" /></button>
                                                        </span>
                                                    ))}
                                                </div>
                                                <form onSubmit={async (e) => {
                                                    e.preventDefault();
                                                    const form = e.target as HTMLFormElement;
                                                    const input = form.elements.namedItem('val') as HTMLInputElement;
                                                    if (!input.value) return;
                                                    await clienteAxios.post(`/catalogo/atributos/${attr.id}/valores`, { valor: input.value });
                                                    input.value = '';
                                                    cargarGlobales();
                                                }} className="flex items-center gap-2">
                                                    <input name="val" placeholder="+ Opción (ej: Rojo)" className="text-xs border-b border-gray-300 focus:border-blue-500 outline-none bg-transparent px-1 py-0.5 w-full" />
                                                </form>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-auto pt-4 border-t border-gray-100">
                                    <form onSubmit={async (e) => {
                                        e.preventDefault();
                                        const form = e.target as HTMLFormElement;
                                        const input = form.elements.namedItem('nuevoAttr') as HTMLInputElement;
                                        if (!input.value) return;
                                        await clienteAxios.post('/catalogo/atributos', { nombre: input.value });
                                        input.value = '';
                                        cargarGlobales();
                                    }} className="flex gap-2">
                                        <input name="nuevoAttr" placeholder="Nuevo Atributo..." className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
                                        <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 shadow-md shadow-blue-600/20"><Plus className="w-5 h-5" /></button>
                                    </form>
                                </div>
                            </div>

                            {/* COLUMNA BADGES */}
                            <div className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col">
                                <h4 className="font-bold text-lg mb-4 text-orange-900 border-b pb-2 flex justify-between">
                                    Badges
                                    <span className="text-xs font-normal text-gray-500 self-center">Etiquetas</span>
                                </h4>
                                <div className="space-y-2 mb-4 flex-1 overflow-y-auto pr-2">
                                    {globalBadges.length === 0 && <p className="text-sm text-center text-gray-400 mt-10">Sin badges.</p>}
                                    {globalBadges.map(badge => (
                                        <div key={badge.id} className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg group transition-colors">
                                            <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-gray-200 shadow-sm shrink-0 cursor-pointer hover:scale-105 transition-transform">
                                                <input
                                                    type="color"
                                                    defaultValue={badge.colorFondo}
                                                    className="absolute -top-4 -left-4 w-16 h-16 cursor-pointer opacity-0"
                                                    onChange={async (e) => {
                                                        await clienteAxios.patch(`/catalogo/badges/${badge.id}`, { colorFondo: e.target.value });
                                                        cargarGlobales();
                                                    }}
                                                />
                                                <div className="w-full h-full" style={{ backgroundColor: badge.colorFondo }}></div>
                                            </div>

                                            <input
                                                defaultValue={badge.texto}
                                                className="flex-1 bg-transparent border-none focus:ring-0 font-bold text-sm"
                                                style={{ color: badge.colorFondo }}
                                                onBlur={async (e) => {
                                                    if (e.target.value !== badge.texto && e.target.value.trim() !== '') {
                                                        await clienteAxios.patch(`/catalogo/badges/${badge.id}`, { texto: e.target.value });
                                                        cargarGlobales();
                                                    }
                                                }}
                                                onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                                            />

                                            <button onClick={async () => {
                                                if (confirm('¿Eliminar badge?')) {
                                                    await clienteAxios.delete(`/catalogo/badges/${badge.id}`);
                                                    cargarGlobales();
                                                }
                                            }} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity p-1"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-auto pt-4 border-t border-gray-100">
                                    <form onSubmit={async (e) => {
                                        e.preventDefault();
                                        const form = e.target as HTMLFormElement;
                                        const textInput = form.elements.namedItem('nuevoBadgeText') as HTMLInputElement;
                                        const colorInput = form.elements.namedItem('nuevoBadgeColor') as HTMLInputElement;
                                        if (!textInput.value) return;

                                        await clienteAxios.post('/catalogo/badges', {
                                            texto: textInput.value,
                                            colorFondo: colorInput.value,
                                            colorTexto: '#ffffff'
                                        });
                                        textInput.value = '';
                                        cargarGlobales();
                                    }} className="flex gap-2 items-center">
                                        <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-300 shadow-sm shrink-0 hover:ring-2 ring-orange-200 transition-all">
                                            <input name="nuevoBadgeColor" type="color" defaultValue="#3b82f6" className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer" />
                                        </div>
                                        <input name="nuevoBadgeText" placeholder="Nuevo Badge..." className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 outline-none" />
                                        <button type="submit" className="bg-orange-600 text-white p-2 rounded-lg hover:bg-orange-700 shadow-md shadow-orange-600/20"><Plus className="w-5 h-5" /></button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
