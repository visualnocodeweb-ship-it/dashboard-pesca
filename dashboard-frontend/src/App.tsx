import { Routes, Route } from 'react-router-dom';
import './App.css';

// Page Imports
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RoleSelectionPage from './pages/RoleSelectionPage';

// Layout and Protection
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Dashboard Component Imports
import CategoriaPescaDashboard from './components/CategoriaPescaDashboard';
import LatestRecordsDashboard from './components/LatestRecordsDashboard';
import PermisosDashboard from './components/PermisosDashboard';
import RecaudacionDashboard from './components/RecaudacionDashboard';
import RegionesDashboard from './components/RegionesDashboard';
import ReportesDashboard from './components/ReportesDashboard';

function App() {
  return (
    <div className="App-container">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/role-selection" element={<RoleSelectionPage />} />
            <Route element={<DashboardLayout />}>
              <Route index element={<PermisosDashboard />} />
              <Route path="/recaudacion" element={<RecaudacionDashboard />} />
              <Route path="/categorias" element={<CategoriaPescaDashboard />} />
              <Route path="/regiones" element={<RegionesDashboard />} />
              <Route path="/ultimos-registros" element={<LatestRecordsDashboard />} />
              <Route path="/reportes" element={<ReportesDashboard />} />
            </Route>
          </Route>
        </Routes>
    </div>
  );
}

export default App;
