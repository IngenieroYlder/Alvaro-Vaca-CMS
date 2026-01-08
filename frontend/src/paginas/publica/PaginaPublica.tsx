import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import clienteAxios from '../../lib/cliente-axios';

export default function PaginaPublica() {
    const { slug } = useParams();
    const [pagina, setPagina] = useState<any>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!slug) return;
        clienteAxios.get(`/paginas/slug/${slug}`)
            .then(({ data }) => setPagina(data))
            .catch(() => setError(true))
            .finally(() => setCargando(false));
    }, [slug]);

    if (cargando) return <div className="p-10 text-center">Cargando...</div>;

    if (error || !pagina) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-300 mb-4">404</h1>
                <p className="text-gray-600">Página no encontrada</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-white">
            {/* Aquí iría el Header/Menú Público en el futuro */}

            <main className="max-w-4xl mx-auto px-6 py-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-8">{pagina.titulo}</h1>
                <div
                    className="prose prose-lg max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{ __html: pagina.contenido }}
                />
            </main>

            {/* Aquí iría el Footer Público en el futuro */}
        </div>
    );
}
