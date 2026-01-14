import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, ShoppingBag, Layers, Globe, Shield, Building, FileText, Menu as MenuIcon, Image as ImageIcon, MessageSquare, Newspaper, Briefcase, UserCheck, QrCode } from 'lucide-react';
import { useAuth } from '../../contexto/ContextoAutenticacion';
import { resolveAssetUrl } from '../../lib/utils';
import { MENU_ITEMS, tienePermiso } from '../../config/permisos';

interface Props {
    tema: any;
    colapsado: boolean;
}

// Mapa de Iconos
const ICONS: any = { LayoutDashboard, Users, ShoppingBag, Layers, Globe, Shield, Building, FileText, Menu: MenuIcon, Image: ImageIcon, MessageSquare, Newspaper, Briefcase, UserCheck, QrCode };

export default function BarraLateral({ tema, colapsado }: Props) {
    const location = useLocation();
    const { usuario } = useAuth();

    // Determinar logo a mostrar
    const logoSrc = colapsado
        ? (tema?.logoVertical || tema?.logoHorizontal)
        : (tema?.logoHorizontal || tema?.logoVertical);

    const menusPermitidos = MENU_ITEMS.filter(item => tienePermiso(usuario, item.permiso || ''));

    return (
        <aside
            className={`bg-white border-r border-gray-200 h-screen sticky top-0 flex flex-col transition-all duration-300 ${colapsado ? 'w-20' : 'w-64'}`}
        >
            {/* Logo Area */}
            <div className="h-16 flex items-center justify-center border-b border-gray-100 p-4">
                {logoSrc ? (
                    <img
                        src={resolveAssetUrl(logoSrc)}
                        alt="Logo"
                        className={`object-contain transition-all ${colapsado ? 'h-8 w-8' : 'h-10 w-full'}`}
                    />
                ) : (
                    <span className={`font-bold text-primary transition-all ${colapsado ? 'text-xs' : 'text-xl'}`}>
                        {colapsado ? 'CMS' : 'Colombia Picture'}
                    </span>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {menusPermitidos.map((menu) => {
                    const active = menu.exact
                        ? location.pathname === menu.path
                        : location.pathname.startsWith(menu.path);

                    const Icon = ICONS[menu.icon] || LayoutDashboard;

                    if ((menu as any).external) {
                        return (
                            <a
                                key={menu.path}
                                href={menu.path}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group text-gray-600 hover:bg-gray-50 hover:text-gray-900`}
                                title={colapsado ? menu.label : ''}
                            >
                                <Icon className={`w-5 h-5 text-gray-400 group-hover:text-gray-600`} />
                                {!colapsado && <span>{menu.label}</span>}
                            </a>
                        );
                    }

                    return (
                        <Link
                            key={menu.path}
                            to={menu.path}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${active
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            title={colapsado ? menu.label : ''}
                        >
                            <Icon className={`w-5 h-5 ${active ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600'}`} />
                            {!colapsado && <span>{menu.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer / User Info */}
            <div className="p-4 border-t border-gray-100">
                {!colapsado && (
                    <div className="text-xs text-gray-400 text-center">
                        v1.1.2
                    </div>
                )}
            </div>
        </aside>
    );
}
