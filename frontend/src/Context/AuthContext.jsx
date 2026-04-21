import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authService from '../services/authService';
import { TOKEN_KEY } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

/** Adapte la réponse API (libellés français) vers l’état UI (rôle + nom affichables). */
function normalizeUser(apiUser) {
  if (!apiUser) return null;
  const profil = apiUser.profil;
  return {
    id: apiUser.id,
    courriel: apiUser.courriel,
    email: apiUser.courriel,
    full_name: apiUser.nom_complet,
    nom: apiUser.nom_complet,
    numero_telephone: apiUser.numero_telephone,
    phone: apiUser.numero_telephone,
    profil,
    role: profil,
  };
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const bootstrap = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    const stored = localStorage.getItem('user');
    if (!token) {
      if (stored) {
        setUser(JSON.parse(stored));
      }
      setLoading(false);
      return;
    }
    try {
      const me = await authService.fetchMe();
      const u = normalizeUser(me);
      setUser(u);
      localStorage.setItem('user', JSON.stringify(u));
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = async (courriel, motDePasse) => {
    try {
      const data = await authService.loginRequest(courriel, motDePasse);
      localStorage.setItem(TOKEN_KEY, data.jeton_acces);
      const u = normalizeUser(data.utilisateur);
      setUser(u);
      localStorage.setItem('user', JSON.stringify(u));
      navigate('/dashboard');
      return { ok: true };
    } catch (error) {
      const status = error?.response?.status;
      if (!status) {
        return { ok: false, message: "API backend indisponible (serveur non lancé ou URL incorrecte)." };
      }
      if (status === 401) {
        return { ok: false, message: "Identifiants invalides." };
      }
      return { ok: false, message: error?.response?.data?.detail || "Erreur serveur pendant la connexion." };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('user');
    navigate('/login');
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      refresh: bootstrap,
    }),
    [user, loading, bootstrap]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
