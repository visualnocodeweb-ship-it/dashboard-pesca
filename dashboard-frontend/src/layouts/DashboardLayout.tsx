import { NavLink, Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../Auth';

const DashboardLayout = () => {
  const { user, signOut, role } = useAuth();
  const location = useLocation();

  // Define gestor-only routes
  const gestorRoutes = ['/recaudacion', '/reportes'];

  // If the user is 'comun' and tries to access a gestor route, redirect them.
  // This is a secondary defense layer to the main guard in ProtectedRoute.
  if (role === 'comun' && gestorRoutes.includes(location.pathname)) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-title-group">
          <img src="/Guardafauna - 1.png" alt="Logo" className="header-logo" />
          <h1>Panel de Control de Pesca</h1>
        </div>
        <div className="header-right-side">
          <nav className="main-nav">
            {/* Common Routes */}
            <NavLink to="/" className="nav-button">Permisos</NavLink>
            <NavLink to="/categorias" className="nav-button">Categorías</NavLink>
            <NavLink to="/regiones" className="nav-button">Regiones</NavLink>
            <NavLink to="/ultimos-registros" className="nav-button">Últimos Registros</NavLink>
            
            {/* Gestor-only Routes */}
            {role === 'gestor' && (
              <>
                <NavLink to="/recaudacion" className="nav-button">Recaudación</NavLink>
                <NavLink to="/reportes" className="nav-button">Reportes</NavLink>
              </>
            )}
          </nav>
          <div className="user-info">
            {/* Display user info based on role */}
            {role === 'gestor' ? (
              <span>Usuario Gestor</span>
            ) : (
              user && <span>{user.email}</span>
            )}
            <button onClick={signOut} className="nav-button">Cerrar Sesión</button>
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
