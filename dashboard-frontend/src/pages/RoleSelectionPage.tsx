import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Auth';

const RoleSelectionPage = () => {
  const [showGestorPassword, setShowGestorPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { selectRole } = useAuth();
  const navigate = useNavigate();

  const handleComunSelect = () => {
    if (selectRole('comun')) {
      navigate('/');
    }
  };

  const handleGestorSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (selectRole('gestor', password)) {
      navigate('/');
    } else {
      setError('Contraseña de gestor incorrecta.');
    }
  };

  return (
    <div className="auth-container">
      <img src="/Guardafauna - 1.png" alt="Logo" className="auth-logo" />
      <h2>Seleccionar Rol</h2>
      <p>Has iniciado sesión. Ahora, elige cómo quieres entrar al panel.</p>

      <div className="role-selection-buttons-container">
        <button onClick={handleComunSelect} className="role-button">
          Entrar como Usuario Común
        </button>

        <button onClick={() => setShowGestorPassword(!showGestorPassword)} className="role-button gestor-button">
          Entrar como Usuario Gestor
        </button>

        {showGestorPassword && (
          <form onSubmit={handleGestorSubmit} className="gestor-form">
            {error && <p className="error-message">{error}</p>}
            <div className="input-group">
              <label htmlFor="gestor-password">Contraseña de Gestor</label>
              <input
                id="gestor-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Ingresa la contraseña"
              />
            </div>
            <button type="submit">Confirmar y Entrar</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default RoleSelectionPage;
