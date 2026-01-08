import { useState } from 'react';
import { Type, Upload } from 'lucide-react';
import BibliotecaMedios from '../medios/BibliotecaMedios';

interface Props {
    label: string;
    name: string;
    value: string;
    onChange: (e: any) => void;
}

const COMMON_FONTS = [
    'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
    'Poppins', 'Oswald', 'Raleway', 'Nunito', 'Merriweather',
    'Playfair Display', 'Lora', 'PT Sans', 'Ubuntu', 'Mukta'
];

export default function SelectorFuente({ label, name, value, onChange }: Props) {
    const [libAbierta, setLibAbierta] = useState(false);
    const [modoPersonalizado, setModoPersonalizado] = useState(value.includes('http') || !COMMON_FONTS.includes(value));

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (val === 'custom') {
            setModoPersonalizado(true);
            onChange({ target: { name, value: '' } });
        } else {
            setModoPersonalizado(false);
            onChange({ target: { name, value: val } });
        }
    };

    const handleFileUpload = (url: string) => {
        onChange({ target: { name, value: url } });
        setLibAbierta(false);
    };

    return (
        <div className="flex flex-col gap-2">
            <label className="text-gray-700 font-medium flex items-center gap-2">
                <Type className="w-4 h-4" /> {label}
            </label>

            <div className="flex gap-2">
                {!modoPersonalizado ? (
                    <select
                        value={value}
                        onChange={handleSelectChange}
                        className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:ring-2 focus:ring-primary outline-none flex-1"
                    >
                        <option value="">Seleccionar Fuente...</option>
                        {COMMON_FONTS.map(font => (
                            <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                        ))}
                        <option value="custom">Subir Fuente / Otra...</option>
                    </select>
                ) : (
                    <div className="flex-1 flex gap-2">
                        <input
                            type="text"
                            value={value}
                            onChange={(e) => onChange({ target: { name, value: e.target.value } })}
                            placeholder="Nombre fuente o URL..."
                            className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:ring-2 focus:ring-primary outline-none flex-1"
                        />
                        <button
                            onClick={() => setLibAbierta(true)}
                            className="bg-gray-100 hover:bg-gray-200 p-2 rounded-lg border border-gray-300"
                            title="Subir archivo de fuente"
                        >
                            <Upload className="w-5 h-5 text-gray-600" />
                        </button>
                        <button
                            onClick={() => setModoPersonalizado(false)}
                            className="text-xs text-primary underline"
                        >
                            Lista
                        </button>
                    </div>
                )}
            </div>

            <BibliotecaMedios
                abierto={libAbierta}
                onCerrar={() => setLibAbierta(false)}
                onSeleccionar={handleFileUpload}
                modoSeleccion={true}
                tipo="fuente"
            />
        </div>
    );
}
