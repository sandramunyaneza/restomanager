import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = ({ userRole }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = {
    admin: [
      { path: '/dashboard', icon: 'fa-chart-line', label: 'Dashboard' },
      { path: '/commandes', icon: 'fa-shopping-cart', label: 'Commandes' },
      { path: '/reservations', icon: 'fa-calendar-alt', label: 'Réservations' },
      { path: '/menu', icon: 'fa-utensils', label: 'Carte & Menu' },
      { path: '/stock', icon: 'fa-boxes', label: 'Gestion Stock' },
      { path: '/livraisons', icon: 'fa-truck', label: 'Livraisons' },
      { path: '/factures', icon: 'fa-file-invoice', label: 'Factures' },
      { path: '/rapports', icon: 'fa-chart-bar', label: 'Rapports' },
      { path: '/utilisateurs', icon: 'fa-users', label: 'Utilisateurs' },
      { path: '/caisse', icon: 'fa-cash-register', label: 'Caisse' }
    ],
    serveur: [
      { path: '/dashboard', icon: 'fa-chart-line', label: 'Dashboard' },
      { path: '/commandes', icon: 'fa-shopping-cart', label: 'Commandes' },
      { path: '/reservations', icon: 'fa-calendar-alt', label: 'Réservations' },
      { path: '/menu', icon: 'fa-utensils', label: 'Carte & Menu' },
      { path: '/factures', icon: 'fa-file-invoice', label: 'Factures' }
    ],
    cuisinier: [
      { path: '/dashboard', icon: 'fa-chart-line', label: 'Dashboard' },
      { path: '/commandes', icon: 'fa-shopping-cart', label: 'Commandes' }
    ],
    client: [
      { path: '/dashboard', icon: 'fa-chart-line', label: 'Dashboard' },
      { path: '/commandes', icon: 'fa-shopping-cart', label: 'Mes Commandes' },
      { path: '/reservations', icon: 'fa-calendar-alt', label: 'Mes Réservations' },
      { path: '/menu', icon: 'fa-utensils', label: 'Carte' }
    ],
    caissier: [
      { path: '/dashboard', icon: 'fa-chart-line', label: 'Dashboard' },
      { path: '/caisse', icon: 'fa-cash-register', label: 'Encaissement' },
      { path: '/factures', icon: 'fa-file-invoice', label: 'Factures' },
      { path: '/commandes', icon: 'fa-shopping-cart', label: 'Commandes' },
      { path: '/rapports', icon: 'fa-chart-bar', label: 'Rapports' }
    ]
  };

  const items = menuItems[userRole] || menuItems.client;

  return (
    <div className="sidebar">
      <div className="logo">
        <h2>🍽️ RestoManager</h2>
        <p>Solution complète de gestion</p>
      </div>
      {items.map((item) => (
        <div
          key={item.path}
          className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <i className={`fas ${item.icon}`}></i>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export default Sidebar;