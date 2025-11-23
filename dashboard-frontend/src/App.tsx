import { useState } from 'react';
import './App.css';
import PermisosDashboard from './PermisosDashboard';
import RecaudacionDashboard from './RecaudacionDashboard';
import CategoriaPescaDashboard from './CategoriaPescaDashboard';
import RegionesDashboard from './RegionesDashboard';
import LatestRecordsDashboard from './LatestRecordsDashboard'; // Import the new component

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
          <button // New button for Latest Records
            className={`nav-button ${activeTab === 'ultimos-registros' ? 'active' : ''}`}
            onClick={() => setActiveTab('ultimos-registros')}
          >
            Últimos Registros
          </button>
        </nav>
      </header>
      <main>
        {activeTab === 'permisos' && <PermisosDashboard />}
        {activeTab === 'recaudacion' && <RecaudacionDashboard />}
        {activeTab === 'categoria' && <CategoriaPescaDashboard />}
        {activeTab === 'regiones' && <RegionesDashboard />}
        {activeTab === 'ultimos-registros' && <LatestRecordsDashboard />} {/* Render new component */}
      </main>
    </div>
  );
}

export default App;