import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (email, password) => {
    // Simulation d'authentification
    const users = {
      'admin@resto.com': { id: 1, nom: 'Admin User', email: 'admin@resto.com', role: 'admin', password: 'admin123' },
      'serveur@resto.com': { id: 2, nom: 'Marie Martin', email: 'serveur@resto.com', role: 'serveur', password: 'serveur123' },
      'cuisinier@resto.com': { id: 3, nom: 'Pierre Durand', email: 'cuisinier@resto.com', role: 'cuisinier', password: 'cuisinier123' },
      'client@resto.com': { id: 4, nom: 'Jean Dupont', email: 'client@resto.com', role: 'client', password: 'client123' }
    };

    const foundUser = Object.values(users).find(u => u.email === email && u.password === password);
    
    if (foundUser) {
      const { password, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem('user', JSON.stringify(userWithoutPassword));
      navigate('/dashboard');
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};