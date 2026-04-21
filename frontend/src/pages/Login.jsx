import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(email, password);
    if (!result?.ok) {
      setError(result?.message || 'Connexion impossible.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>🍽️ RestoManager</h2>
        <p>Connectez-vous à votre espace</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemple@resto.com"
              required
            />
          </div>
          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p style={{ color: 'red', marginBottom: '15px' }}>{error}</p>}
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>
            Se connecter
          </button>
        </form>
        <div style={{ marginTop: '12px' }}>
          <button
            type="button"
            className="btn-secondary"
            style={{ width: '100%' }}
            onClick={() => navigate('/register')}
          >
            Créer un compte
          </button>
        </div>
        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e0e0e0' }}>
          <p style={{ fontSize: '12px', color: '#666', textAlign: 'center' }}>
            <strong>Comptes de démonstration (mot de passe partout : Password123!) :</strong><br />
            admin@resto.com · client@resto.com · caissier@resto.com<br />
            cuisinier@resto.com · livreur@resto.com · magasinier@resto.com · serveur@resto.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;