import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

const MATERIAL_ICONS = [
    'help', 'info', 'check_circle', 'warning', 'error', 'settings',
    'person', 'group', 'home', 'search', 'email', 'phone',
    'location_on', 'schedule', 'attach_money', 'payments', 'security',
    'lock', 'visibility', 'description', 'assignment', 'build', 'star',
    'support_agent', 'verified', 'workspace_premium', 'menu', 'close',
    'add', 'done', 'arrow_forward', 'folder', 'upload', 'cloud',
    'laptop', 'smartphone', 'grid_view', 'list', 'edit', 'delete'
];

interface SelectorIconosProps {
    value: string;
    onChange: (icon: string) => void;
}

export default function SelectorIconos({ value, onChange }: SelectorIconosProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredIcons = MATERIAL_ICONS.filter(icon =>
        icon.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="relative w-full" ref={containerRef}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-lg px-3 py-2 text-sm transition-all focus:ring-2 focus:ring-primary/20 outline-none"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-white border border-gray-100 flex items-center justify-center text-gray-600">
                        <span className="material-symbols-outlined text-xl">{value || 'help'}</span>
                    </div>
                    <span className="font-medium text-gray-700">{value || 'Seleccionar...'}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Popover */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-[300px]">
                    {/* Search */}
                    <div className="p-3 border-b border-gray-100 sticky top-0 bg-white z-10">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                autoFocus
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar icono..."
                                className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/10 outline-none"
                            />
                        </div>
                    </div>

                    {/* Grid */}
                    <div className="overflow-y-auto p-2 grid grid-cols-4 gap-2">
                        {filteredIcons.map(icon => (
                            <button
                                key={icon}
                                type="button"
                                onClick={() => {
                                    onChange(icon);
                                    setIsOpen(false);
                                }}
                                className={`flex flex-col items-center justify-center p-2 rounded-lg gap-1 transition-colors ${value === icon
                                        ? 'bg-primary/10 text-primary border border-primary/20'
                                        : 'hover:bg-gray-50 text-gray-500 hover:text-gray-900 border border-transparent hover:border-gray-100'
                                    }`}
                                title={icon}
                            >
                                <span className="material-symbols-outlined text-2xl">{icon}</span>
                                <span className="text-[10px] truncate w-full text-center opacity-70">{icon}</span>
                            </button>
                        ))}
                        {filteredIcons.length === 0 && (
                            <div className="col-span-4 py-4 text-center text-gray-400 text-xs">
                                No se encontraron iconos.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
