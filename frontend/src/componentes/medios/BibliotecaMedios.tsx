import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Trash2, Image as ImageIcon, Check } from 'lucide-react';
import clienteAxios from '../../lib/cliente-axios';
import { resolveAssetUrl } from '../../lib/utils';

interface Medio {
    id: string;
    url: string;
    filename: string;
    originalName: string;
    mimetype: string;
}

interface Props {
    abierto: boolean;
    onCerrar: () => void;
    onSeleccionar?: (url: string) => void;
    modoSeleccion?: boolean;
    tipo?: 'imagen' | 'fuente' | 'todo';
}

export default function BibliotecaMedios({ abierto, onCerrar, onSeleccionar, modoSeleccion = false, tipo = 'imagen' }: Props) {
    const [medios, setMedios] = useState<Medio[]>([]);
    const [cargando, setCargando] = useState(false);
    const [subiendo, setSubiendo] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (abierto) {
            cargarMedios();
        }
    }, [abierto]);

    const cargarMedios = async () => {
        try {
            setCargando(true);
            const res = await clienteAxios.get('/medios');
            // Filtrar si es necesario (aunque idealmente el backend podría filtrar)
            let data = res.data;
            if (tipo === 'imagen') {
                data = data.filter((m: Medio) => m.mimetype.startsWith('image/'));
            } else if (tipo === 'fuente') {
                data = data.filter((m: Medio) => m.mimetype.includes('font') || m.filename.match(/\.(ttf|otf|woff|woff2)$/));
            }
            setMedios(data);
        } catch (error) {
            console.error('Error cargando medios:', error);
        } finally {
            setCargando(false);
        }
    };

    const manejarSubida = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const formData = new FormData();
        formData.append('file', files[0]);

        try {
            setSubiendo(true);
            await clienteAxios.post('/medios/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            await cargarMedios(); // Recargar lista
        } catch (error) {
            console.error('Error subiendo archivo:', error);
            alert('Error al subir el archivo');
        } finally {
            setSubiendo(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const eliminarMedio = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('¿Seguro que deseas eliminar el archivo?')) return;

        try {
            await clienteAxios.delete(`/medios/${id}`);
            setMedios(medios.filter(m => m.id !== id));
        } catch (error) {
            console.error('Error eliminando:', error);
        }
    };

    const getAccept = () => {
        if (tipo === 'imagen') return 'image/*';
        if (tipo === 'fuente') return '.ttf,.otf,.woff,.woff2';
        return '*/*';
    }

    if (!abierto) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
            <div className="bg-white text-gray-800 rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <ImageIcon className="w-6 h-6 text-primary" />
                        Biblioteca de Medios ({tipo})
                    </h2>
                    <button type="button" onClick={onCerrar} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
                    <span className="text-sm text-gray-500">{medios.length} archivos</span>
                    <div className="flex gap-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept={getAccept()}
                            onChange={manejarSubida}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={subiendo}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                        >
                            <Upload className="w-4 h-4" />
                            {subiendo ? 'Subiendo...' : 'Subir Archivo'}
                        </button>
                    </div>
                </div>

                {/* Gallery Grid */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
                    {cargando ? (
                        <div className="flex justify-center items-center h-full text-gray-400">Cargando...</div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {medios.map((medio) => (
                                <div
                                    key={medio.id}
                                    className="group relative aspect-square bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                                    onClick={() => modoSeleccion && onSeleccionar?.(medio.url)}
                                >
                                    {/* Preview Logic */}
                                    {medio.mimetype.startsWith('image/') ? (
                                        <img src={resolveAssetUrl(medio.url)} alt={medio.originalName} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-500 p-4">
                                            <span className="text-4xl font-bold">Aa</span>
                                            <span className="text-xs mt-2 break-all text-center">{medio.filename.split('.').pop()}</span>
                                        </div>
                                    )}

                                    {/* Overlay Actions */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        {modoSeleccion ? (
                                            <>
                                                <span className="text-white font-semibold flex items-center gap-1 cursor-pointer" onClick={() => onSeleccionar?.(medio.url)}>
                                                    <Check className="w-5 h-5" /> Seleccionar
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={(e) => eliminarMedio(medio.id, e)}
                                                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={(e) => eliminarMedio(medio.id, e)}
                                                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Info Footer */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-white/90 p-1 text-xs truncate text-center border-t">
                                        {medio.originalName}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
