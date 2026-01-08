import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexto/ContextoAutenticacion';
import Login from './paginas/Login';
import Negocio from './paginas/dashboard/Negocio';
import Paginas from './paginas/dashboard/Paginas';
import Medios from './paginas/dashboard/Medios';
import Menus from './paginas/dashboard/Menus';
import ThemeEditor from './paginas/dashboard/ThemeEditor';
import Catalogo from './paginas/dashboard/Catalogo';
import Usuarios from './paginas/dashboard/Usuarios';
import RolesPermisos from './paginas/dashboard/RolesPermisos';
import Contactos from './paginas/dashboard/Contactos';
import Noticias from './paginas/dashboard/Noticias';
import Vacantes from './paginas/dashboard/Vacantes';
import PaginaPublica from './paginas/publica/PaginaPublica';
import DisenoTablero from './layouts/DisenoTablero';
import { tienePermiso, PERMISOS } from './config/permisos';

// Componente para proteger rutas
const RutaProtegida = () => {
  const { usuario, cargando } = useAuth();
  if (cargando) return <div className="p-10 text-center text-white">Cargando...</div>;
  return usuario ? <Outlet /> : <Navigate to="/login" />;
};

// Componente para proteger rutas por rol/permiso
const RutaAutorizada = ({ permiso }: { permiso?: string }) => {
  const { usuario, cargando } = useAuth();
  if (cargando) return null;

  // tienePermiso ahora espera (usuario, requiredPermission)
  if (!tienePermiso(usuario, permiso || '')) {
    return <div className="p-10 text-center">No tienes permiso para ver esta sección.</div>;
  }

  return <Outlet />;
};

function App() {
  return (
    <BrowserRouter basename="/dashboard">
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<RutaProtegida />}>
            <Route element={<DisenoTablero />}>

              {/* Rutas Comunes (Dashboard) */}
              <Route element={<RutaAutorizada permiso={PERMISOS.DASHBOARD} />}>
                <Route path="/" element={<div className="p-10">Bienvenido al Dashboard</div>} />
              </Route>

              <Route element={<RutaAutorizada permiso={PERMISOS.CATALOGO} />}>
                <Route path="/catalogo" element={<Catalogo />} />
              </Route>

              <Route element={<RutaAutorizada permiso={PERMISOS.VACANTES} />}>
                <Route path="/vacantes" element={<Vacantes />} />
              </Route>

              {/* Rutas Admin / Modulares */}
              <Route element={<RutaAutorizada permiso={PERMISOS.MEDIOS} />}>
                <Route path="/medios" element={<Medios />} />
              </Route>

              <Route element={<RutaAutorizada permiso={PERMISOS.USUARIOS} />}>
                <Route path="/usuarios" element={<Usuarios />} />
              </Route>

              <Route element={<RutaAutorizada permiso={PERMISOS.ROLES} />}>
                <Route path="/roles" element={<RolesPermisos />} />
              </Route>

              <Route element={<RutaAutorizada permiso={PERMISOS.TEMAS} />}>
                <Route path="/temas" element={<ThemeEditor />} />
              </Route>

              <Route element={<RutaAutorizada permiso={PERMISOS.NEGOCIO} />}>
                <Route path="/negocio" element={<Negocio />} />
              </Route>

              <Route element={<RutaAutorizada permiso={PERMISOS.PAGINAS} />}>
                <Route path="/paginas" element={<Paginas />} />
              </Route>

              <Route element={<RutaAutorizada permiso={PERMISOS.MENUS} />}>
                <Route path="/menus" element={<Menus />} />
              </Route>

              <Route element={<RutaAutorizada permiso={PERMISOS.CONTACTOS} />}>
                <Route path="/contactos" element={<Contactos />} />
              </Route>

              <Route element={<RutaAutorizada permiso={PERMISOS.NOTICIAS} />}>
                <Route path="/noticias" element={<Noticias />} />
              </Route>

            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
