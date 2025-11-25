import { useState } from 'react';
import './App.css';
import PermisosDashboard from './PermisosDashboard';
import RecaudacionDashboard from './RecaudacionDashboard';
import CategoriaPescaDashboard from './CategoriaPescaDashboard';
import RegionesDashboard from './RegionesDashboard';
import LatestRecordsDashboard from './LatestRecordsDashboard';
import ReportesDashboard from './ReportesDashboard'; // Import the new component

function App() {
  const [activeTab, setActiveTab] = useState('permisos');

  return (
    <div className="App">
      <header className="App-header">
        <h1>Dashboard de Análisis de Pesca</h1>
        <nav className="main-nav">
          <button 
            className={`nav-button ${activeTab === 'permisos' ? 'active' : ''}`}
            onClick={() => setActiveTab('permisos')}
          >
            Cantidad de Permisos
          </button>
          <button 
            className={`nav-button ${activeTab === 'recaudacion' ? 'active' : ''}`}
            onClick={() => setActiveTab('recaudacion')}
          >
            Recaudacion
          </button>
          <button 
            className={`nav-button ${activeTab === 'categoria' ? 'active' : ''}`}
            onClick={() => setActiveTab('categoria')}
          >
            Categoria Pesca
          </button>
          <button 
            className={`nav-button ${activeTab === 'regiones' ? 'active' : ''}`}
            onClick={() => setActiveTab('regiones')}
          >
            Regiones
          </button>
          <button
            className={`nav-button ${activeTab === 'ultimos-registros' ? 'active' : ''}`}
            onClick={() => setActiveTab('ultimos-registros')}
          >
            Últimos Registros
          </button>
          <button // New button for Reports
            className={`nav-button ${activeTab === 'reportes' ? 'active' : ''}`}
            onClick={() => setActiveTab('reportes')}
          >
            Reportes
          </button>
        </nav>
      </header>
      <main>
        {activeTab === 'permisos' && <PermisosDashboard />}
        {activeTab === 'recaudacion' && <RecaudacionDashboard />}
        {activeTab === 'categoria' && <CategoriaPescaDashboard />}
        {activeTab === 'regiones' && <RegionesDashboard />}
        {activeTab === 'ultimos-registros' && <LatestRecordsDashboard />}
        {activeTab === 'reportes' && <ReportesDashboard />} {/* Render new component */}
      </main>
    </div>
  );
}

export default App;