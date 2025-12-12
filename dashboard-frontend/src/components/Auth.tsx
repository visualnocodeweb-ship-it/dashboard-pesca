import { useState } from 'react';
import { supabase } from '../supabaseClient';
import './Auth.css'; // Crearemos este archivo para estilos básicos

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      alert(error.message);
    }
    // No es necesario setEmail o setPassword aquí, el login recargará o cambiará el componente a mostrar
    setLoading(false);
  };

  const handleSignUp = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setLoading(true);
    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({ email, password });

    if (error) {
      alert(error.message);
    } else if (!session) {
      alert('Revisa tu correo para activar tu cuenta!');
    }
    setLoading(false);
  };
  
  async function signInWithGoogle() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if(error) {
      alert(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
          <img src="/Guardafauna - 1.png" alt="Fauna NQN Logo" style={{ height: '50px', marginRight: '10px' }} />
          <h1 className="auth-header" style={{ margin: 0 }}></h1>
        </div>
        <p className="auth-description">Temporada 2025-2026 - Inicia sesión para continuar</p>
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className="auth-input"
              type="email"
              placeholder="tu@email.com"
              value={email}
              required={true}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              className="auth-input"
              type="password"
              placeholder="••••••••"
              value={password}
              required={true}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="auth-button primary" disabled={loading}>
            {loading ? <span>Cargando...</span> : <span>Iniciar Sesión</span>}
          </button>
          <button type="button" onClick={handleSignUp} className="auth-button secondary" disabled={loading}>
            Registrarse
          </button>
        </form>
        <div className="divider">O</div>
        <button onClick={signInWithGoogle} className="auth-button google" disabled={loading}>
          {loading ? '...' : 'Iniciar Sesión con Google'}
        </button>
      </div>
    </div>
  );
}
