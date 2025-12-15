import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <img src="/Guardafauna - 1.png" alt="Logo" className="auth-logo" />
      <h2>Crear Cuenta</h2>
      {error && <p className="error-message">{error}</p>}
      {success ? (
        <div className="success-message">
          <p>¡Registro exitoso! Por favor, revisa tu correo electrónico para verificar tu cuenta.</p>
          <button onClick={() => navigate('/login')}>Volver a Iniciar Sesión</button>
        </div>
      ) : (
        <>
          <p>Crea una cuenta para acceder al sistema.</p>
          <form onSubmit={handleRegister}>
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
                placeholder="Crea una contraseña segura"
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Registrando...' : 'Crear Cuenta'}
            </button>
          </form>
          <p className="auth-switch">
            ¿Ya tienes una cuenta? <Link to="/login">Inicia Sesión</Link>
          </p>
        </>
      )}
    </div>
  );
};

export default RegisterPage;
