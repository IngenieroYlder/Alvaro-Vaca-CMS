import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import BarraLateral from '../componentes/dashboard/BarraLateral';
import Encabezado from '../componentes/dashboard/Encabezado';
import clienteAxios from '../lib/cliente-axios';

export default function DisenoTablero() {
    const [colapsado, setColapsado] = useState(false);
    const [tema, setTema] = useState<any>(null);

    // Cargar configuración del tema (para el logo)
    useEffect(() => {
        clienteAxios.get('/theme/config')
            .then(res => setTema(res.data))
            .catch(err => console.error('Error cargando tema:', err));
    }, []);

    return (
        <div className="flex min-h-screen bg-gray-50 font-sans">
            <BarraLateral tema={tema} colapsado={colapsado} />

            <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
                <Encabezado colapsado={colapsado} setColapsado={setColapsado} />

                <main className="flex-1 p-6 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
