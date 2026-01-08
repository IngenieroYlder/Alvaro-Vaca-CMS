import { useState } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface SafeDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    itemName: string; // The name of the item being deleted for context
    expectedWord?: string; // Default: "BORRAR"
}

export default function SafeDeleteModal({ isOpen, onClose, onConfirm, itemName, expectedWord = "BORRAR" }: SafeDeleteModalProps) {
    const [confirmWord, setConfirmWord] = useState('');
    const [isChecked, setIsChecked] = useState(false);

    if (!isOpen) return null;

    const isConfirmed = confirmWord === expectedWord && isChecked;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isConfirmed) {
            onConfirm();
            onClose(); // Close modal immediately after confirming, parent handles async state
            setConfirmWord('');
            setIsChecked(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-red-100">
                {/* Header Warning */}
                <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-start gap-3">
                    <div className="p-2 bg-red-100 rounded-lg text-red-600">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-lg font-bold text-red-900 leading-tight">Acción Destructiva Irreversible</h2>
                        <p className="text-xs text-red-700 mt-1">Esta acción no se puede deshacer.</p>
                    </div>
                    <button onClick={onClose} className="text-red-400 hover:text-red-700 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-600">
                        Estás a punto de eliminar permanentemente:
                        <br />
                        <span className="font-bold text-gray-900 text-base block mt-1 break-words">
                            "{itemName}"
                        </span>
                        <p className="mt-2 text-xs text-gray-500">
                            Se eliminarán todos los datos relacionados (postulaciones, historial, etc.) de la base de datos de forma definitiva.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                id="confirmCheck"
                                checked={isChecked}
                                onChange={(e) => setIsChecked(e.target.checked)}
                                className="mt-1 w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 cursor-pointer"
                            />
                            <label htmlFor="confirmCheck" className="text-sm text-gray-700 cursor-pointer select-none">
                                Entiendo que esta acción eliminará la información permanentemente y acepto las consecuencias.
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">
                                Escribe "<span className="text-red-600">{expectedWord}</span>" para confirmar
                            </label>
                            <input
                                type="text"
                                value={confirmWord}
                                onChange={(e) => setConfirmWord(e.target.value)}
                                placeholder={expectedWord}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none font-mono text-center uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal placeholder:font-sans"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={!isConfirmed}
                            className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                        >
                            <Trash2 className="w-5 h-5" />
                            Eliminar Definitivamente
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
