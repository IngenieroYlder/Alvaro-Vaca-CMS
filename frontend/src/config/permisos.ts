// Códigos de permisos que coinciden con los guardados en BD (roles.service.ts / RolesPermisos.tsx)
export const PERMISOS = {
    DASHBOARD: 'dashboard',
    CATALOGO: 'catalogo',
    VACANTES: 'catalogo', // Share permission or create new
    USUARIOS: 'usuarios',
    ROLES: 'roles',
    TEMAS: 'temas',
    MEDIOS: 'medios',
    NEGOCIO: 'negocio',
    PAGINAS: 'paginas',
    CONTACTOS: 'contactos',
    NOTICIAS: 'noticias',
    MENUS: 'menus',
    REUNIONES: 'reuniones'
};

export const MENU_ITEMS = [
    {
        label: 'Tablero',
        path: '/',
        icon: 'LayoutDashboard',
        exact: true,
        permiso: PERMISOS.DASHBOARD
    },
    {
        label: 'Reuniones',
        path: '/reuniones',
        icon: 'Users', // Or 'Calendar'
        permiso: PERMISOS.REUNIONES
    },
    {
        label: 'Asistentes',
        path: '/asistentes',
        icon: 'UserCheck', // Or 'ClipboardList'
        permiso: PERMISOS.REUNIONES // Or specific permission if needed, currently sharing REUNIONES
    },
    {
        label: 'Contactos',
        path: '/contactos',
        icon: 'MessageSquare',
        permiso: PERMISOS.CONTACTOS
    },
NOT_APPLICABLE
    {
        label: 'Noticias',
        path: '/noticias',
        icon: 'Newspaper',
        permiso: PERMISOS.NOTICIAS
    },
    {
        label: 'Catálogo',
        path: '/catalogo',
        icon: 'ShoppingBag',
        permiso: PERMISOS.CATALOGO
    },
    {
        label: 'Vacantes',
        path: '/vacantes',
        icon: 'Briefcase',
        permiso: PERMISOS.CATALOGO
    },
    {
        label: 'Usuarios',
        path: '/usuarios',
        icon: 'Users',
        permiso: PERMISOS.USUARIOS
    },
    {
        label: 'Roles y Permisos',
        path: '/roles',
        icon: 'Shield',
        permiso: PERMISOS.ROLES
    },
    {
        label: 'Temas',
        path: '/temas',
        icon: 'Layers',
        permiso: PERMISOS.TEMAS
    },
    {
        label: 'Medios',
        path: '/medios',
        icon: 'Image',
        permiso: PERMISOS.MEDIOS
    },
    {
        label: 'Negocio',
        path: '/negocio',
        icon: 'Building',
        permiso: PERMISOS.NEGOCIO
    },
    {
        label: 'Páginas',
        path: '/paginas',
        icon: 'FileText',
        permiso: PERMISOS.PAGINAS
    },
    {
        label: 'Menús',
        path: '/menus',
        icon: 'Menu',
        permiso: PERMISOS.MENUS
    },
];

// Ahora recibimos el objeto usuario completo (o sus permisos)
export const tienePermiso = (user: any, requiredPermission: string): boolean => {
    if (!user) return false;

    // Debugging logs (remove in production)
    // console.log('Checking permission:', requiredPermission, 'for user:', user);

    // Normalizar roles a minúsculas para comparar
    const userRoles = user.roles?.map((r: string) => r.toLowerCase()) || [];

    // SuperAdmin hardcodeado si es necesario, o basado en rol 'god'
    if (userRoles.includes('god') || userRoles.includes('admin')) return true; // Mantener admin como superusuario por seguridad si se desea

    // Si no requiere permiso, pasa
    if (!requiredPermission) return true;

    // Verificar array de permisos devuelto por el backend
    return user.permisos?.includes(requiredPermission) || false;
};
