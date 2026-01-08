import { useState, useEffect, useRef } from 'react';
import {
    Folder, Image as ImageIcon, FileText, MoreVertical,
    Upload, Plus, ArrowLeft, Trash2, Link as LinkIcon,
    X, Check, Search, Download
} from 'lucide-react';
import clienteAxios from '../../lib/cliente-axios';
import { resolveAssetUrl } from '../../lib/utils';

interface Carpeta {
    id: string;
    nombre: string;
    parentId: string | null;
}

interface Medio {
    id: string;
    filename: string;
    originalName: string;
    mimetype: string;
    url: string;
    size: number;
    createdAt: string;
    // Metadata
    titulo?: string;
    alt?: string;
    leyenda?: string;
    descripcion?: string;
    carpetaId?: string;
}

interface MediosProps {
    onSelect?: (url: string) => void;
    selectionMode?: boolean;
}

export default function Medios({ onSelect, selectionMode = false }: MediosProps) {
    const [carpetas, setCarpetas] = useState<Carpeta[]>([]);
    const [medios, setMedios] = useState<Medio[]>([]);
    const [currentFolder, setCurrentFolder] = useState<Carpeta | null>(null);
    const [loading, setLoading] = useState(false);
    const [folderHistory, setFolderHistory] = useState<Carpeta[]>([]);

    // Modal & Selection
    const [selectedMedio, setSelectedMedio] = useState<Medio | null>(null);
    const [isUploadDragging, setIsUploadDragging] = useState(false);
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadContent(currentFolder?.id || 'root');
    }, [currentFolder]);

    const loadContent = async (folderId: string) => {
        setLoading(true);
        try {
            const { data } = await clienteAxios.get(`/medios/content?folderId=${folderId}`);
            setCarpetas(data.carpetas);
            setMedios(data.medios);
        } catch (error) {
            console.error('Error loading content', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNavigate = (folder: Carpeta) => {
        setFolderHistory([...folderHistory, folder]);
        setCurrentFolder(folder);
    };

    const handleNavigateUp = () => {
        if (folderHistory.length > 0) {
            const newHistory = [...folderHistory];
            newHistory.pop();
            setFolderHistory(newHistory);
            setCurrentFolder(newHistory.length > 0 ? newHistory[newHistory.length - 1] : null);
        } else {
            setCurrentFolder(null); // Root
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        try {
            await clienteAxios.post('/medios/folder', {
                nombre: newFolderName,
                parentId: currentFolder?.id
            });
            setNewFolderName('');
            setIsCreatingFolder(false);
            loadContent(currentFolder?.id || 'root');
        } catch (error) {
            console.error('Error creating folder', error);
            alert('Error al crear carpeta');
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const formData = new FormData();
        // Support single file upload for now as per controller, update to loop if multi needed
        // Assuming controller handles one by one or loop here
        for (let i = 0; i < files.length; i++) {
            const formData = new FormData();
            formData.append('file', files[i]);
            if (currentFolder?.id) {
                formData.append('carpetaId', currentFolder.id);
            }

            try {
                await clienteAxios.post('/medios/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } catch (error) {
                console.error('Error uploading file', error);
                alert(`Error al subir ${files[i].name}`);
            }
        }

        loadContent(currentFolder?.id || 'root');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const updateMetadata = async (id: string, field: string, value: string) => {
        try {
            await clienteAxios.patch(`/medios/${id}`, { [field]: value });
            // Update local state
            setMedios(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
            if (selectedMedio && selectedMedio.id === id) {
                setSelectedMedio(prev => prev ? { ...prev, [field]: value } : null);
            }
        } catch (error) {
            console.error('Error updating metadata', error);
        }
    };

    const deleteMedio = async (id: string) => {
        if (!confirm('¿Eliminar este archivo permanentemente?')) return;
        try {
            await clienteAxios.delete(`/medios/${id}`);
            setMedios(prev => prev.filter(m => m.id !== id));
            setSelectedMedio(null);
        } catch (error) {
            console.error('Error deleting file', error);
        }
    };

    const deleteFolder = async (id: string) => {
        if (!confirm('¿Eliminar carpeta y TODO su contenido?')) return;
        try {
            await clienteAxios.delete(`/medios/folder/${id}`);
            loadContent(currentFolder?.id || 'root');
        } catch (error) {
            console.error('Error deleting folder', error);
        }
    };

    const copyLink = (url: string) => {
        const fullUrl = resolveAssetUrl(url);
        navigator.clipboard.writeText(fullUrl);
        alert('Enlace copiado al portapapeles');
    };

    return (
        <div className={`flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${selectionMode ? 'h-[600px] w-full' : 'h-[calc(100vh-100px)]'}`}>
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                    {currentFolder ? (
                        <button onClick={handleNavigateUp} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                    ) : (
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Folder className="w-5 h-5 text-primary" />
                        </div>
                    )}

                    <div className="flex items-center text-sm font-medium text-gray-700">
                        <span
                            onClick={() => { setCurrentFolder(null); setFolderHistory([]); }}
                            className="hover:underline cursor-pointer hover:text-primary"
                        >
                            Medios
                        </span>
                        {folderHistory.map((folder, idx) => (
                            <div key={folder.id} className="flex items-center">
                                <span className="mx-2 text-gray-400">/</span>
                                <span className={idx === folderHistory.length - 1 ? "text-gray-900 font-bold" : "text-gray-600"}>
                                    {folder.nombre}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setIsCreatingFolder(true)}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 bg-white"
                    >
                        <Plus className="w-4 h-4" />
                        Nueva Carpeta
                    </button>
                    <div className="relative">
                        <input
                            type="file"
                            multiple
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors shadow-sm"
                        >
                            <Upload className="w-4 h-4" />
                            Subir Archivo
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Upload Drag Area */}
            <div className="flex-1 overflow-y-auto p-6 relative">
                {isCreatingFolder && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <Folder className="w-6 h-6 text-blue-500" />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Nombre de la carpeta..."
                            className="flex-1 bg-transparent border-b border-blue-300 focus:border-blue-600 outline-none px-2 py-1 text-sm font-medium text-blue-900 placeholder-blue-300"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                        />
                        <button onClick={handleCreateFolder} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setIsCreatingFolder(false)} className="p-2 text-blue-400 hover:text-blue-600"><X className="w-4 h-4" /></button>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <>
                        {/* Folders Grid */}
                        {carpetas.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Carpetas</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {carpetas.map(folder => (
                                        <div
                                            key={folder.id}
                                            className="group relative flex flex-col items-center p-4 bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-100 rounded-xl cursor-pointer transition-all"
                                            onClick={() => handleNavigate(folder)}
                                        >
                                            <Folder className="w-12 h-12 text-gray-300 group-hover:text-blue-400 mb-2 transition-colors" fill="currentColor" fillOpacity={0.1} />
                                            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700 truncate w-full text-center">{folder.nombre}</span>

                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }}
                                                className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Files Grid */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Archivos</h3>
                            {medios.length === 0 && carpetas.length === 0 && (
                                <div className="text-center py-20 text-gray-400">
                                    <Upload className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>Carpeta vacía</p>
                                </div>
                            )}
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {medios.map(medio => (
                                    <div
                                        key={medio.id}
                                        className="group relative aspect-square bg-gray-50 rounded-xl overflow-hidden border border-gray-200 cursor-pointer hover:shadow-md transition-all"
                                        onClick={() => setSelectedMedio(medio)}
                                    >
                                        {medio.mimetype.startsWith('image/') ? (
                                            <img
                                                src={resolveAssetUrl(medio.url)}
                                                alt={medio.alt || medio.originalName}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                        ) : medio.mimetype === 'application/pdf' ? (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-red-500 bg-red-50">
                                                <FileText className="w-12 h-12 mb-2" />
                                                <span className="text-xs px-2 text-center font-bold truncate w-full">{medio.originalName}</span>
                                                <span className="text-[10px] uppercase tracking-wider text-red-400 mt-1">PDF</span>
                                            </div>
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                                <FileText className="w-10 h-10 mb-2" />
                                                <span className="text-xs px-2 text-center truncate w-full">{medio.originalName}</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <p className="text-white text-xs truncate font-medium">{medio.originalName}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Detail Modal */}
            {selectedMedio && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col md:flex-row shadow-2xl">

                        {/* Preview */}
                        <div className="flex-1 bg-gray-900 flex items-center justify-center relative p-8">
                            {selectedMedio.mimetype.startsWith('image/') ? (
                                <img
                                    src={resolveAssetUrl(selectedMedio.url)}
                                    className="max-w-full max-h-full object-contain shadow-2xl"
                                    alt="Preview"
                                />
                            ) : selectedMedio.mimetype === 'application/pdf' ? (
                                <div className="text-center">
                                    <FileText className="w-32 h-32 text-red-500 mx-auto mb-4" />
                                    <p className="text-white text-lg font-medium">Documento PDF</p>
                                </div>
                            ) : (
                                <FileText className="w-32 h-32 text-gray-600" />
                            )}
                            <button onClick={() => setSelectedMedio(null)} className="absolute top-4 left-4 p-2 bg-black/50 text-white rounded-full hover:bg-white/20">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Sidebar Info */}
                        <div className="w-full md:w-96 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
                            <div className="p-6 border-b border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900 break-words line-clamp-2">{selectedMedio.originalName}</h3>
                                <p className="text-xs text-gray-500 mt-1">{(selectedMedio.size / 1024).toFixed(1)} KB • {new Date(selectedMedio.createdAt).toLocaleDateString()}</p>
                            </div>

                            <div className="p-6 space-y-6 flex-1">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título</label>
                                    <input
                                        type="text"
                                        value={selectedMedio.titulo || ''}
                                        onChange={(e) => updateMetadata(selectedMedio.id, 'titulo', e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                        placeholder="Título de la imagen"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Texto Alternativo (Alt)</label>
                                    <input
                                        type="text"
                                        value={selectedMedio.alt || ''}
                                        onChange={(e) => updateMetadata(selectedMedio.id, 'alt', e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                        placeholder="Descripción para invidentes y SEO"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Leyenda</label>
                                    <textarea
                                        rows={2}
                                        value={selectedMedio.leyenda || ''}
                                        onChange={(e) => updateMetadata(selectedMedio.id, 'leyenda', e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                        placeholder="Pie de foto..."
                                    ></textarea>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción</label>
                                    <textarea
                                        rows={3}
                                        value={selectedMedio.descripcion || ''}
                                        onChange={(e) => updateMetadata(selectedMedio.id, 'descripcion', e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                        placeholder="Detalles internos..."
                                    ></textarea>
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Enlace Directo</label>
                                    <div className="flex gap-2">
                                        <input
                                            readOnly
                                            value={resolveAssetUrl(selectedMedio.url)}
                                            className="flex-1 px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-xs font-mono text-gray-600 truncate select-all"
                                        />
                                        <button
                                            onClick={() => copyLink(selectedMedio.url)}
                                            className="p-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg transition-colors"
                                            title="Copiar Link"
                                        >
                                            <LinkIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                                {onSelect ? (
                                    <div className="flex justify-end w-full">
                                        <button
                                            onClick={() => {
                                                if (selectedMedio) {
                                                    onSelect(selectedMedio.url);
                                                    setSelectedMedio(null); // Close modal
                                                }
                                            }}
                                            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-sm font-medium flex items-center gap-2"
                                        >
                                            <Check className="w-4 h-4" /> Seleccionar esta imagen
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <a
                                            href={resolveAssetUrl(selectedMedio.url)}
                                            download
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1"
                                        >
                                            <Download className="w-4 h-4" /> Descargar
                                        </a>
                                        <button
                                            onClick={() => deleteMedio(selectedMedio.id)}
                                            className="text-sm font-medium text-red-500 hover:text-red-700 flex items-center gap-1 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" /> Eliminar
                                        </button>
                                    </>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
