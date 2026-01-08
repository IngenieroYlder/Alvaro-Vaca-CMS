import { useEffect, useState } from 'react';
import { Save, Building as BuildingIcon, Globe } from 'lucide-react';
import clienteAxios from '../../lib/cliente-axios';
import SelectorImagen from '../../componentes/common/SelectorImagen';

export default function Negocio() {
    const [activeTab, setActiveTab] = useState('contacto');
    const [cargando, setCargando] = useState(false);
    const [guardando, setGuardando] = useState(false);

    // Negocio Data
    const [formData, setFormData] = useState({
        nombre: '',
        telefono: '',
        direccion: '',
        email: '',
        contactoUrl: '',
        instagram: '',
        facebook: '',
        x: '',
        tiktok: '',
        pinterest: '',
        youtube: '',
        linkedin: '',
    });

    // Webhooks Data
    interface WebhookConfig {
        formId: string;
        url: string;
        isActive: boolean;
    }
    const [webhooks, setWebhooks] = useState<Record<string, WebhookConfig>>({
        'contacto-form': { formId: 'contacto-form', url: '', isActive: true },
        'sumate-form': { formId: 'sumate-form', url: '', isActive: true }
    });

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        setCargando(true);
        try {
            // Cargar Negocio
            const resNegocio = await clienteAxios.get('/negocio');
            if (resNegocio.data) {
                setFormData(prev => ({ ...prev, ...resNegocio.data }));
            }

            // Cargar Webhooks
            const resWebhooks = await clienteAxios.get('/contactos/webhooks');
            if (resWebhooks.data && Array.isArray(resWebhooks.data)) {
                const map: Record<string, WebhookConfig> = { ...webhooks };
                resWebhooks.data.forEach((w: any) => {
                    if (map[w.formId] || ['contacto-form', 'sumate-form'].includes(w.formId)) {
                        map[w.formId] = { formId: w.formId, url: w.url, isActive: w.isActive };
                    }
                });
                setWebhooks(map);
            }
        } catch (error) {
            console.error('Error cargando datos:', error);
        } finally {
            setCargando(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleWebhookChange = (formId: string, field: keyof WebhookConfig, value: any) => {
        setWebhooks(prev => ({
            ...prev,
            [formId]: { ...prev[formId], [field]: value }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setGuardando(true);
        try {
            // Guardar Negocio
            if (activeTab !== 'webhook') {
                await clienteAxios.post('/negocio', formData);
            }

            // Guardar Webhooks (si estamos en esa pestaña o siempre? Mejor guardar todo si es un solo botón, pero aquí dividimos lógica por tab para UX o todo junto)
            // Guardaremos TODO para asegurar consistencia
            await clienteAxios.post('/negocio', formData);

            // Guardar cada webhook
            const promises = Object.values(webhooks).map(w =>
                clienteAxios.post('/contactos/webhooks', w)
            );
            await Promise.all(promises);

            alert('Información y configuración guardada correctamente');
        } catch (error) {
            console.error('Error guardando:', error);
            alert('Error al guardar');
        } finally {
            setGuardando(false);
        }
    };

    if (cargando) return <div className="p-10">Cargando información...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Información del Negocio</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-gray-100 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('contacto')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'contacto'
                            ? 'text-primary border-b-2 border-primary bg-primary/5'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <BuildingIcon className="w-4 h-4" />
                        Contacto General
                    </button>
                    <button
                        onClick={() => setActiveTab('redes')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'redes'
                            ? 'text-primary border-b-2 border-primary bg-primary/5'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <Globe className="w-4 h-4" />
                        Redes Sociales
                    </button>
                    <button
                        onClick={() => setActiveTab('webhook')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'webhook'
                            ? 'text-primary border-b-2 border-primary bg-primary/5'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <span className="material-symbols-outlined text-sm">api</span>
                        Webhook Automation
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {activeTab === 'contacto' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Nombre de la Empresa</label>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    placeholder="Ej: Colombia Pictures"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Slogan / Frase Corporativa</label>
                                <input
                                    type="text"
                                    name="slogan"
                                    value={(formData as any).slogan || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    placeholder="Ej: Transporte de calidad mundial"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Email de Contacto</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    placeholder="contacto@empresa.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Teléfono</label>
                                <input
                                    type="tel"
                                    name="telefono"
                                    value={formData.telefono}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    placeholder="+57 300 123 4567"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Dirección</label>
                                <input
                                    type="text"
                                    name="direccion"
                                    value={formData.direccion}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    placeholder="Calle 123 # 45-67"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Número de Contrato</label>
                                <input
                                    type="text"
                                    name="numeroContrato"
                                    value={(formData as any).numeroContrato || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    placeholder="Ej: Contrato No. 123 de 2025"
                                />
                            </div>
                            <div className="col-span-full space-y-2">
                                <div className="space-y-1">
                                    <SelectorImagen
                                        label="Imagen de Tarifas (Se mostrará en el footer como popup)"
                                        valor={(formData as any).tarifasImage || ''}
                                        onChange={(url: string) => setFormData(prev => ({ ...prev, tarifasImage: url }))}
                                    />
                                </div>
                            </div>
                            <div className="col-span-full space-y-2">
                                <label className="text-sm font-medium text-gray-700">Horario de Atención (HTML/Texto)</label>
                                <textarea
                                    name="horarioAtencion"
                                    rows={4}
                                    value={(formData as any).horarioAtencion || ''}
                                    onChange={(e: any) => handleChange(e)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    placeholder="Lunes a Viernes: 8am - 6pm..."
                                />
                                <p className="text-xs text-gray-500">Se mostrará en el footer.</p>
                            </div>
                            <div className="col-span-full space-y-2">
                                <label className="text-sm font-medium text-gray-700">URL de Contacto (Personalizada)</label>
                                <input
                                    type="url"
                                    name="contactoUrl"
                                    value={formData.contactoUrl}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    placeholder="https://wa.me/..."
                                />
                                <p className="text-xs text-gray-500">Útil para enlazar directamente a WhatsApp o un formulario externo.</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'redes' && (
                        <div className="space-y-4 animate-in fade-in duration-300">
                            {[
                                { name: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/usuario' },
                                { name: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/usuario' },
                                { name: 'x', label: 'X (Twitter)', placeholder: 'https://x.com/usuario' },
                                { name: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@usuario' },
                                { name: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/c/canal' },
                                { name: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/usuario' },
                                { name: 'pinterest', label: 'Pinterest', placeholder: 'https://pinterest.com/usuario' },
                            ].map((network) => (
                                <div key={network.name} className="flex items-center gap-4">
                                    <label className="w-32 text-sm font-medium text-gray-700 capitalize">{network.label}</label>
                                    <input
                                        type="url"
                                        name={network.name}
                                        value={(formData as any)[network.name]}
                                        onChange={handleChange}
                                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        placeholder={network.placeholder}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'webhook' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-start gap-3">
                                <span className="material-symbols-outlined text-blue-600">info</span>
                                <div className="text-sm text-blue-800">
                                    <p className="font-bold mb-1">Automatización con Webhooks (n8n, Make, Zapier)</p>
                                    <p>Configure URLs específicas para cada formulario. Cuando un usuario envíe datos, se reenviarán automáticamente a estas direcciones.</p>
                                </div>
                            </div>

                            {/* Contact Form */}
                            <div className="p-5 border border-gray-200 rounded-xl bg-gray-50/50">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                        <span className="material-symbols-outlined">mail</span>
                                        Formulario de Contacto ("Escríbenos")
                                    </h3>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={webhooks['contacto-form']?.isActive}
                                            onChange={(e) => handleWebhookChange('contacto-form', 'isActive', e.target.checked)}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-600">URL del Webhook (POST)</label>
                                    <input
                                        type="url"
                                        value={webhooks['contacto-form']?.url || ''}
                                        onChange={(e) => handleWebhookChange('contacto-form', 'url', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                                        placeholder="https://su-instancia.n8n.cloud/webhook/..."
                                    />
                                </div>
                            </div>

                            {/* Sumate Form */}
                            <div className="p-5 border border-gray-200 rounded-xl bg-gray-50/50">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                        <span className="material-symbols-outlined">volunteer_activism</span>
                                        Formulario de Voluntarios ("Súmate")
                                    </h3>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={webhooks['sumate-form']?.isActive}
                                            onChange={(e) => handleWebhookChange('sumate-form', 'isActive', e.target.checked)}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                    </label>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-600">URL del Webhook (POST)</label>
                                    <input
                                        type="url"
                                        value={webhooks['sumate-form']?.url || ''}
                                        onChange={(e) => handleWebhookChange('sumate-form', 'url', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none bg-white"
                                        placeholder="https://su-instancia.n8n.cloud/webhook/..."
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-8 flex justify-end">
                        <button
                            type="submit"
                            disabled={guardando}
                            className="bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {guardando ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
