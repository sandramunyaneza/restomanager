import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authService from '../services/authService';
import { TOKEN_KEY } from '../services/api';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    courriel: '',
    mot_de_passe: '',
    nom_complet: '',
    numero_telephone: '',
    profil: 'client',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        numero_telephone: form.numero_telephone || null,
      };
      const data = await authService.registerRequest(payload);
      localStorage.setItem(TOKEN_KEY, data.jeton_acces);
      // `AuthContext` bootstrap fera le fetch /me au reload ; on redirige.
      navigate('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.detail || "Inscription impossible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>🍽️ RestoManager</h2>
        <p>Créer un compte</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nom complet</label>
            <input value={form.nom_complet} onChange={onChange('nom_complet')} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.courriel} onChange={onChange('courriel')} required />
          </div>
          <div className="form-group">
            <label>Téléphone (optionnel)</label>
            <input value={form.numero_telephone} onChange={onChange('numero_telephone')} />
          </div>
          <div className="form-group">
            <label>Rôle</label>
            <select value={form.profil} onChange={onChange('profil')}>
              <option value="client">client</option>
              <option value="cuisinier">cuisinier</option>
              <option value="livreur">livreur</option>
              <option value="caissier">caissier</option>
              <option value="magasinier">magasinier</option>
            </select>
          </div>
          <div className="form-group">
            <label>Mot de passe</label>
            <input type="password" value={form.mot_de_passe} onChange={onChange('mot_de_passe')} required />
          </div>
          {error && <p style={{ color: 'red', marginBottom: '15px' }}>{error}</p>}
          <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
            Créer mon compte
          </button>
        </form>
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button className="btn-secondary" onClick={() => navigate('/login')} style={{ width: '100%' }}>
            Retour connexion
          </button>
        </div>
      </div>
    </div>
  );
}

