import React, { useState } from 'react';
import { Image as ImageIcon, X } from 'lucide-react';
import BibliotecaMedios from '../medios/BibliotecaMedios';
import { resolveAssetUrl } from '../../lib/utils';

interface Props {
    label: string;
    valor?: string;
    onChange: (url: string) => void;
    tipo?: string; // Prop opcional para filtrar tipo de archivos si es necesario
}

export default function SelectorImagen({ label, valor, onChange, ...props }: Props) {
    const [modalAbierto, setModalAbierto] = useState(false);

    const manejarSeleccion = (url: string) => {
        onChange(url);
        setModalAbierto(false);
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">{label}</label>

            <div className="flex items-center gap-4">
                {/* Preview Container */}
                <div
                    className="w-32 h-32 bg-gray-100 border border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary transition-colors relative group"
                    onClick={() => setModalAbierto(true)}
                >
                    {valor ? (
                        <>
                            <img src={resolveAssetUrl(valor)} alt="Preview" className="w-full h-full object-contain" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs text-center p-2 transition-opacity">
                                Cambiar Imagen
                            </div>
                        </>
                    ) : (
                        <div className="text-gray-400 flex flex-col items-center gap-1">
                            <ImageIcon className="w-8 h-8" />
                            <span className="text-xs">Seleccionar</span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                {valor && (
                    <button
                        type="button"
                        onClick={() => onChange('')}
                        className="text-red-500 text-sm hover:underline flex items-center gap-1"
                    >
                        <X className="w-4 h-4" /> Quitar
                    </button>
                )}
            </div>

            <BibliotecaMedios
                abierto={modalAbierto}
                onCerrar={() => setModalAbierto(false)}
                onSeleccionar={manejarSeleccion}
                modoSeleccion={true}
                // @ts-ignore - Assuming BibliotecaMedios validates this prop
                tipo={props.tipo}
            />
        </div>
    );
}
