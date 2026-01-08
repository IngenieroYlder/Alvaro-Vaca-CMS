import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronRight, ChevronDown, FileText, ExternalLink, Edit, Trash2, CornerDownRight } from 'lucide-react';

interface Props {
    id: string;
    depth: number;
    data: any;
    onEdit: (data: any) => void;
    onDelete: (id: string) => void;
    indentationWidth: number;
    clone?: boolean;
}

export function SortableTreeItem({ id, depth, data, onEdit, onDelete, indentationWidth, clone = false }: Props) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        marginLeft: !clone ? `${depth * indentationWidth}px` : undefined, // Apply indentation only if not cloning for drag overlay
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative mb-2 touch-none ${clone ? 'shadow-2xl opacity-100 rotate-2' : ''}`}
        >
            <div className={`
        flex items-center justify-between p-3 
        bg-white border rounded-lg shadow-sm transition-all
        ${isDragging ? 'border-primary/50 bg-primary/5 shadow-md scale-[1.02]' : 'border-gray-200 hover:border-primary/30'}
      `}>
                <div className="flex items-center gap-3 flex-1 overflow-hidden">

                    {/* Drag Handle */}
                    <div {...attributes} {...listeners} className="cursor-grab hover:text-primary text-gray-400 p-1 -ml-1">
                        <GripVertical className="w-5 h-5" />
                    </div>

                    {!clone && depth > 0 && <CornerDownRight className="w-4 h-4 text-gray-300 flex-shrink-0" />}

                    {/* Icon */}
                    <div className={`p-2 rounded-md flex-shrink-0 ${data.tipo === 'pagina' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                        {data.tipo === 'pagina' ? <FileText className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-800 truncate">{data.titulo}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 truncate">
                            {data.tipo === 'pagina'
                                ? <span className="text-blue-500 truncate">Página: /{data.pagina?.slug}</span>
                                : <span className="text-orange-500 truncate">URL: {data.url}</span>
                            }
                            {data.targetBlank && <span className="bg-gray-100 px-1.5 rounded text-[10px] flex-shrink-0">Nueva Pestaña</span>}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pl-2">
                    <button
                        onClick={() => onEdit(data)}
                        className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Indentation Guide Lines */}
            {!clone && depth > 0 && (
                <div className="absolute top-0 bottom-0 border-l border-dashed border-gray-200"
                    style={{ left: `-${(indentationWidth / 2)}px` }} />
            )}
        </div>
    );
}
