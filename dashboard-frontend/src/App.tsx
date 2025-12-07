import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import './App.css';
import CategoriaPescaDashboard from './components/CategoriaPescaDashboard';
import LatestRecordsDashboard from './components/LatestRecordsDashboard';
import PermisosDashboard from './components/PermisosDashboard';
import RecaudacionDashboard from './components/RecaudacionDashboard';
import RegionesDashboard from './components/RegionesDashboard';
import ReportesDashboard from './components/ReportesDashboard';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>Panel de Control de Pesca temporada 2025-2026</h1>
          <nav className="main-nav">
            <NavLink to="/permisos" className="nav-button">Permisos</NavLink>
            <NavLink to="/recaudacion" className="nav-button">Recaudación</NavLink>
            <NavLink to="/categorias" className="nav-button">Categorías</NavLink>
            <NavLink to="/regiones" className="nav-button">Regiones</NavLink>
            <NavLink to="/ultimos-registros" className="nav-button">Últimos Registros</NavLink>
            <NavLink to="/reportes" className="nav-button">Reportes</NavLink>
          </nav>
        </header>
        <main>
          <Routes>
            <Route path="/permisos" element={<PermisosDashboard />} />
            <Route path="/recaudacion" element={<RecaudacionDashboard />} />
            <Route path="/categorias" element={<CategoriaPescaDashboard />} />
            <Route path="/regiones" element={<RegionesDashboard />} />
            <Route path="/ultimos-registros" element={<LatestRecordsDashboard />} />
            <Route path="/reportes" element={<ReportesDashboard />} />
            <Route path="/" element={<PermisosDashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;