import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';

const Header = ({ user }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const getPageTitle = () => {
    const path = window.location.pathname;
    switch(path) {
      case '/dashboard': return 'Dashboard';
      case '/commandes': return 'Commandes';
      case '/reservations': return 'Réservations';
      case '/menu': return 'Carte & Menu';
      case '/stock': return 'Gestion Stock';
      case '/livraisons': return 'Livraisons';
      case '/factures': return 'Factures';
      case '/rapports': return 'Rapports';
      case '/utilisateurs': return 'Utilisateurs';
      default: return 'Dashboard';
    }
  };

  return (
    <div className="header">
      <div className="page-title">
        <h1>{getPageTitle()}</h1>
        <p>Bienvenue, {user?.nom}</p>
      </div>
      <div className="user-info">
        <i className="fas fa-bell" style={{ fontSize: '20px', cursor: 'pointer' }}></i>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={logout}>
          <i className="fas fa-sign-out-alt" style={{ fontSize: '20px' }}></i>
          <i className="fas fa-user-circle" style={{ fontSize: '32px' }}></i>
        </div>
      </div>
    </div>
  );
};

export default Header;