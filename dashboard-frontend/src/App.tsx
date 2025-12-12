import { useState, useEffect } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { supabase } from './supabaseClient';
import type { Session } from '@supabase/supabase-js';

import './App.css';
import Auth from './components/Auth';
import CategoriaPescaDashboard from './components/CategoriaPescaDashboard';
import LatestRecordsDashboard from './components/LatestRecordsDashboard';
import PermisosDashboard from './components/PermisosDashboard';
import RecaudacionDashboard from './components/RecaudacionDashboard';
import RegionesDashboard from './components/RegionesDashboard';
import ReportesDashboard from './components/ReportesDashboard';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  }

  if (loading) {
    return <div>Cargando...</div>; // O un componente de Spinner/Loader
  }

  return (
    <>
      {!session ? (
        <Auth />
      ) : (
        <div className="App">
          <header className="App-header">
            <img src="/Guardafauna - 1.png" alt="Fauna NQN Logo" className="header-logo" style={{ height: '50px', marginRight: '10px' }} />
            <h1>Temporada 2025-2026</h1>
            <nav className="main-nav">
              <NavLink to="/permisos" className="nav-button">Permisos</NavLink>
              <NavLink to="/recaudacion" className="nav-button">Recaudación</NavLink>
              <NavLink to="/categorias" className="nav-button">Categorías</NavLink>
              <NavLink to="/regiones" className="nav-button">Regiones</NavLink>
              <NavLink to="/ultimos-registros" className="nav-button">Últimos Registros</NavLink>
              <NavLink to="/reportes" className="nav-button">Reportes</NavLink>
              <button onClick={handleSignOut} className="nav-button logout-button">
                Cerrar Sesión
              </button>
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
      )}
    </>
  );
}

export default App;