import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      navigate('/'); // Redirect to dashboard on successful login
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/', // Redirect to the current origin after Google login
      },
    });

    if (error) {
      setError(error.message);
    }
    setLoading(false);
    // Supabase will handle the redirect, so no explicit navigation here
  };

  return (
    <div className="auth-container">
      <h2>Iniciar Sesión</h2>
      <p>Ingresa para acceder al dashboard.</p>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleLogin}>
        <div className="input-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="tu@email.com"
          />
        </div>
        <div className="input-group">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Tu contraseña"
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Cargando...' : 'Iniciar Sesión'}
        </button>
      </form>

      <div className="social-auth-options">
        <p>O inicia sesión con:</p>
        <button className="google-signin-button" onClick={handleGoogleSignIn} disabled={loading}>
          Google
        </button>
      </div>

      <p className="auth-switch">
        ¿No tienes una cuenta? <Link to="/register">Regístrate</Link>
      </p>
    </div>
  );
};

export default LoginPage;
