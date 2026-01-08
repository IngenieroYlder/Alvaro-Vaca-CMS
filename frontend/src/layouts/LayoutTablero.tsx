import { Outlet } from 'react-router-dom';
import BarraLateral from '../componentes/layout/BarraLateral';
import { motion } from 'framer-motion';

export default function LayoutTablero() {
    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            <BarraLateral />
            <main className="flex-1 overflow-auto relative">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                    className="min-h-full p-8"
                >
                    <Outlet />
                </motion.div>
            </main>
        </div>
    );
}
