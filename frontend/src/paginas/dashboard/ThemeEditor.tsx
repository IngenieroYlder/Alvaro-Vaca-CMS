import { useEffect, useState } from 'react';
import { ThemeManager } from '../../lib/theme-manager';
import axios from '../../lib/cliente-axios';
import SelectorImagen from '../../componentes/common/SelectorImagen';
import SelectorFuente from '../../componentes/common/SelectorFuente';

export default function ThemeEditor() {
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        axios.get('/theme/config')
            .then(res => setConfig(res.data))
            .catch(err => {
                console.error('Error cargando tema:', err);
                setError('No se pudo cargar la configuración del tema. Revisa la conexión con el servidor.');
            });
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setConfig((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setLoading(true);
        await ThemeManager.updateConfig(config);
        setLoading(false);
        alert('Tema actualizado correctamente');
    };

    if (error) return (
        <div className="p-10 flex flex-col items-center justify-center text-red-500">
            <p className="font-bold mb-2">Error de Carga</p>
            <p>{error}</p>
            <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 text-gray-700 font-medium"
            >
                Reintentar
            </button>
        </div>
    );

    if (!config) return (
        <div className="p-10 flex flex-col items-center justify-center text-gray-500">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
            <p>Cargando configuración...</p>
        </div>
    );

    return (
        <div className="p-8 max-w-6xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200">
            <h1 className="text-3xl font-bold mb-8 text-gray-900 border-b pb-4">
                Editor de Tema
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Colores */}
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-800">Colores Principales</h2>
                    <ColorInput label="Color Primario" name="primaryColor" value={config.primaryColor} onChange={handleChange} />
                    <ColorInput label="Color Secundario" name="secondaryColor" value={config.secondaryColor} onChange={handleChange} />
                    <ColorInput label="Color Terciario" name="tertiaryColor" value={config.tertiaryColor} onChange={handleChange} />
                    <ColorInput label="Color Base (Texto)" name="baseColor" value={config.baseColor} onChange={handleChange} />
                    <ColorInput label="Color Acento" name="accentColor" value={config.accentColor} onChange={handleChange} />
                </div>

                {/* Tipografía y Espaciado */}
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-800">Geometría & Fuente</h2>
                    <SelectorFuente label="Fuente Títulos" name="headingFont" value={config.headingFont} onChange={handleChange} />
                    <SelectorFuente label="Fuente Cuerpo" name="bodyFont" value={config.bodyFont} onChange={handleChange} />
                    <RangeInput label="Radio de Borde (px)" name="borderRadius" value={config.borderRadius} onChange={handleChange} min={0} max={50} />
                    <RangeInput label="Escala Espaciado" name="spacingScale" value={config.spacingScale} onChange={handleChange} step={0.1} min={1} max={3} />
                </div>
            </div>

            {/* Gestión de Logos */}
            <div className="pt-8 border-t border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Identidad Visual & Logos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <SelectorImagen
                        label="Logo Vertical (Principal)"
                        valor={config.logoVertical}
                        onChange={(url: string) => setConfig({ ...config, logoVertical: url })}
                    />
                    <SelectorImagen
                        label="Logo Horizontal"
                        valor={config.logoHorizontal}
                        onChange={(url: string) => setConfig({ ...config, logoHorizontal: url })}
                    />
                    <SelectorImagen
                        label="Logo Blanco (Fondo Oscuro)"
                        valor={config.logoBlanco}
                        onChange={(url: string) => setConfig({ ...config, logoBlanco: url })}
                    />
                    <SelectorImagen
                        label="Logo Negro (Documentos)"
                        valor={config.logoNegro}
                        onChange={(url: string) => setConfig({ ...config, logoNegro: url })}
                    />
                </div>
            </div>

            {/* Configuración SEO */}
            <div className="pt-8 border-t border-gray-100 mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">SEO y Metadatos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-gray-700 font-medium">Favicon</label>
                            <SelectorImagen
                                label="Subir Icono"
                                valor={config.favicon}
                                onChange={(url: string) => setConfig({ ...config, favicon: url })}
                                tipo="image" // Asegurar que acepte imágenes
                            />
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-gray-700 font-medium">Título de la Página (Browser Tab)</label>
                            <input
                                type="text"
                                name="tituloPagina"
                                value={config.tituloPagina || ''}
                                onChange={handleChange}
                                className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:ring-2 focus:ring-primary outline-none"
                                placeholder="Ej: Mi Empresa - Dashboard"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-gray-700 font-medium">Descripción (Meta Tag)</label>
                            <textarea
                                name="descripcionPagina"
                                value={config.descripcionPagina || ''}
                                onChange={(e: any) => handleChange(e)}
                                rows={3}
                                className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:ring-2 focus:ring-primary outline-none resize-none"
                                placeholder="Breve descripción del sitio..."
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-10 flex justify-end gap-4 pt-6 border-t border-gray-100">
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-lg font-bold transition-colors shadow-lg shadow-primary/30 disabled:opacity-50"
                >
                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>
        </div>
    );
}

const ColorInput = ({ label, name, value, onChange }: any) => (
    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
        <label className="text-gray-700 font-medium">{label}</label>
        <div className="flex items-center gap-3">
            <span className="text-sm font-mono text-gray-500">{value}</span>
            <input
                type="color"
                name={name}
                value={value}
                onChange={onChange}
                className="w-10 h-10 rounded cursor-pointer border-0 p-0"
            />
        </div>
    </div>
);

const TextInput = ({ label, name, value, onChange }: any) => (
    <div className="flex flex-col gap-2">
        <label className="text-gray-700 font-medium">{label}</label>
        <input
            type="text"
            name={name}
            value={value}
            onChange={onChange}
            className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:ring-2 focus:ring-primary outline-none"
        />
    </div>
);

const RangeInput = ({ label, name, value, onChange, min, max, step = 1 }: any) => (
    <div className="flex flex-col gap-2">
        <div className="flex justify-between">
            <label className="text-gray-700 font-medium">{label}</label>
            <span className="text-primary font-bold">{value}</span>
        </div>
        <input
            type="range"
            name={name}
            value={value}
            onChange={onChange}
            min={min}
            max={max}
            step={step}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
        />
    </div>
);
