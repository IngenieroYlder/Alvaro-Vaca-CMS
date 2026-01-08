import { useState, useEffect } from 'react';
import { X, User, Mail, Download, AlertCircle } from 'lucide-react';
import clienteAxios from '../lib/cliente-axios';

interface Candidato {
    id: string;
    fechaPostulacion: string;
    // Updated states matching backend
    estado: 'registrado' | 'hoja_vida_enviada' | 'en_revision' | 'sera_contactado' | 'seleccionado' | 'rechazado';
    usuario: {
        id: string;
        nombre: string;
        apellido?: string;
        email: string;
        telefono?: string;
    };
    pasoActual: number;
    hojaDeVida?: string;
    motivoRechazo?: string;
}

interface CandidatesModalProps {
    vacanteId: string;
    vacanteTitulo: string;
    onClose: () => void;
}

const ESTADOS = {
    registrado: { label: 'Registrado', color: 'bg-yellow-100 text-yellow-700' },
    hoja_vida_enviada: { label: 'CV Enviado', color: 'bg-blue-100 text-blue-700' },
    en_revision: { label: 'En Revisión', color: 'bg-purple-100 text-purple-700' },
    sera_contactado: { label: 'Será Contactado', color: 'bg-indigo-100 text-indigo-700' },
    seleccionado: { label: 'Seleccionado', color: 'bg-green-100 text-green-700' },
    rechazado: { label: 'Rechazado', color: 'bg-red-100 text-red-700' },
};

export default function CandidatesModal({ vacanteId, vacanteTitulo, onClose }: CandidatesModalProps) {
    const [candidates, setCandidates] = useState<Candidato[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchCandidates();
    }, [vacanteId]);

    const fetchCandidates = async () => {
        try {
            const { data } = await clienteAxios.get(`/postulaciones/vacante/${vacanteId}`);
            setCandidates(data);
        } catch (error) {
            console.error("Error fetching candidates:", error);
            setError("No se pudieron cargar los candidatos. Verifica tu conexión o intenta recargar.");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        let motivoRechazo = undefined;

        if (newStatus === 'rechazado') {
            const reason = prompt("Por favor ingrese el motivo del rechazo:");
            if (!reason) return; // Cancel if no reason provided
            motivoRechazo = reason;
        }

        try {
            // Also update local state optimistically
            setCandidates(prev => prev.map(c => c.id === id ? { ...c, estado: newStatus as any, motivoRechazo } : c));

            await clienteAxios.patch(`/postulaciones/${id}/estado`, {
                estado: newStatus,
                motivoRechazo
            });

        } catch (error) {
            alert("Error actualizando estado");
            fetchCandidates(); // Revert on error
        }
    };

    const handleDownloadCV = async (id: string) => {
        try {
            const candidate = candidates.find(c => c.id === id);
            const response = await clienteAxios.get(`/postulaciones/${id}/descargar-cv`, {
                responseType: 'blob'
            });

            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            // Generate Filename: Hoja de vida {Nombre} {Apellido} {YYYYMMDDHHmm}
            // User requested: "Hoja de vida + nombre completo del cadidato + fecha año mes dia hora"
            const date = new Date();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hour = String(date.getHours()).padStart(2, '0');
            const minute = String(date.getMinutes()).padStart(2, '0');

            const timestamp = `${year}${month}${day}${hour}${minute}`;
            const fullName = candidate ? `${candidate.usuario.nombre} ${candidate.usuario.apellido || ''}`.trim() : 'Candidato';

            const filename = `Hoja de vida ${fullName} ${timestamp}.zip`;

            link.setAttribute('download', filename);

            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            alert("Error al descargar el archivo. Puede que no exista.");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white z-10">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900">Candidatos</h2>
                        <p className="text-gray-500 text-sm">Postulantes para: <span className="font-bold text-secondary">{vacanteTitulo}</span></p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 bg-red-50 rounded-2xl border border-red-100">
                            <AlertCircle className="mx-auto h-10 w-10 text-red-500 mb-2" />
                            <h3 className="text-lg font-bold text-red-800">Error</h3>
                            <p className="text-red-600">{error}</p>
                            <button onClick={fetchCandidates} className="mt-4 px-4 py-2 bg-white border border-red-200 text-red-700 rounded-lg hover:bg-red-50 font-bold transition-colors">Reintentar</button>
                        </div>
                    ) : candidates.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                                <User size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Sin candidatos aún</h3>
                            <p className="text-gray-500">Nadie se ha postulado a esta vacante todavía.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Candidato</th>
                                        <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Fecha</th>
                                        <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Estado</th>
                                        <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">CV</th>
                                        <th className="p-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Mover a</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {candidates.map((c) => (
                                        <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center font-bold shrink-0">
                                                        {c.usuario.nombre.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-gray-900 truncate">{c.usuario.nombre} {c.usuario.apellido || ""}</p>
                                                        <div className="flex items-center gap-1 text-xs text-gray-500 truncate">
                                                            <Mail size={12} /> {c.usuario.email}
                                                        </div>
                                                        {c.usuario.telefono && (
                                                            <div className="flex items-center gap-1 text-xs text-gray-500 truncate mt-0.5">
                                                                <span className="material-symbols-outlined text-[10px]">call</span> {c.usuario.telefono}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-gray-600 whitespace-nowrap">
                                                {new Date(c.fechaPostulacion).toLocaleDateString()}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase inline-flex items-center gap-1.5 whitespace-nowrap ${ESTADOS[c.estado]?.color || 'bg-gray-100'}`}>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                                    {ESTADOS[c.estado]?.label || c.estado}
                                                </span>
                                                {c.estado === 'rechazado' && c.motivoRechazo && (
                                                    <div className="mt-1 text-xs text-red-500 flex items-center gap-1" title={c.motivoRechazo}>
                                                        <AlertCircle size={10} /> Motivo
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                {c.hojaDeVida ? (
                                                    <button onClick={() => handleDownloadCV(c.id)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="Descargar CV">
                                                        <Download size={16} />
                                                    </button>
                                                ) : <span className="text-gray-300">-</span>}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-1 flex-wrap max-w-[300px] ml-auto">
                                                    {/* Rechazar available unless already final */}
                                                    {c.estado !== 'rechazado' && c.estado !== 'seleccionado' && (
                                                        <button onClick={() => handleStatusChange(c.id, 'rechazado')} className="p-1 px-2 text-xs rounded border border-red-200 text-red-600 hover:bg-red-50 font-medium">Rechazar</button>
                                                    )}

                                                    {/* Workflow Logic */}
                                                    {(c.estado === 'registrado' || c.estado === 'hoja_vida_enviada') && (
                                                        <button onClick={() => handleStatusChange(c.id, 'en_revision')} className="p-1 px-2 text-xs rounded bg-purple-50 text-purple-600 hover:bg-purple-100 font-bold border border-purple-100">En Revisión</button>
                                                    )}

                                                    {c.estado === 'en_revision' && (
                                                        <button onClick={() => handleStatusChange(c.id, 'sera_contactado')} className="p-1 px-2 text-xs rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold border border-indigo-100">Contactar</button>
                                                    )}

                                                    {c.estado === 'sera_contactado' && (
                                                        <button onClick={() => handleStatusChange(c.id, 'seleccionado')} className="p-1 px-2 text-xs rounded bg-green-50 text-green-600 hover:bg-green-100 font-bold border border-green-100">Seleccionar</button>
                                                    )}

                                                    {c.estado === 'rechazado' && (
                                                        <button onClick={() => handleStatusChange(c.id, 'registrado')} className="p-1 px-2 text-xs rounded border border-gray-200 text-gray-500 hover:bg-gray-50">Restaurar</button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
