import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../Auth';

const DashboardLayout = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="App">
      <header className="App-header">
        <h1>Panel de Control de Pesca</h1>
        <nav className="main-nav">
          <NavLink to="/" className="nav-button">Permisos</NavLink>
          <NavLink to="/recaudacion" className="nav-button">Recaudación</NavLink>
          <NavLink to="/categorias" className="nav-button">Categorías</NavLink>
          <NavLink to="/regiones" className="nav-button">Regiones</NavLink>
          <NavLink to="/ultimos-registros" className="nav-button">Últimos Registros</NavLink>
          <NavLink to="/reportes" className="nav-button">Reportes</NavLink>
        </nav>
        <div className="header-right-side">
          <div className="user-info">
            {user && <span>{user.email}</span>}
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
