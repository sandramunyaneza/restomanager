import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ClientHome() {
  const { user } = useAuth();
  return (
    <div>
      <h2 style={{ marginBottom: '16px' }}>Bonjour {user?.nom}</h2>
      <p style={{ color: '#555', marginBottom: '24px' }}>
        Réservez une table, parcourez la carte et suivez vos commandes.
      </p>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <Link className="btn-primary" to="/menu">
          Voir la carte
        </Link>
        <Link className="btn-secondary" to="/reservations" style={{ padding: '12px 24px' }}>
          Mes réservations
        </Link>
        <Link className="btn-secondary" to="/commandes" style={{ padding: '12px 24px' }}>
          Mes commandes
        </Link>
      </div>
    </div>
  );
}
