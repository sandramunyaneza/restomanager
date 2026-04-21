import { useAuth } from '../../context/AuthContext';

const PATH_TITLES = {
  '/dashboard': 'Dashboard',
  '/commandes': 'Commandes',
  '/reservations': 'Réservations',
  '/menu': 'Carte & Menu',
  '/stock': 'Gestion Stock',
  '/livraisons': 'Livraisons',
  '/factures': 'Factures',
  '/rapports': 'Rapports',
  '/utilisateurs': 'Utilisateurs',
  '/caisse': 'Caisse',
  '/cuisine': 'Cuisine',
  '/livreur': 'Livreur',
  '/magasin': 'Magasin',
  '/client': 'Espace client',
};

export default function Header({ user, onNotify }) {
  const { logout } = useAuth();
  const path = typeof window !== 'undefined' ? window.location.pathname : '/dashboard';

  const title = PATH_TITLES[path] || 'Dashboard';

  return (
    <div className="header">
      <div className="page-title">
        <h1>{title}</h1>
        <p>Bienvenue, {user?.nom || user?.full_name}</p>
      </div>
      <div className="user-info">
        <i
          className="fas fa-bell"
          style={{ fontSize: '20px', cursor: 'pointer' }}
          onClick={() => onNotify?.('Notifications : aucun nouvel événement')}
          title="Notifications"
        />
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          onClick={logout}
        >
          <i className="fas fa-sign-out-alt" style={{ fontSize: '20px' }} />
          <i className="fas fa-user-circle" style={{ fontSize: '32px' }} />
        </div>
      </div>
    </div>
  );
}
