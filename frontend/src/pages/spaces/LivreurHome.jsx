import { Link } from 'react-router-dom';

export default function LivreurHome() {
  return (
    <div>
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#74b9ff' }}>
            <i className="fas fa-motorcycle" />
          </div>
          <h3>Tournées</h3>
          <p>Suivez les statuts de livraison et mettez à jour les courses assignées.</p>
        </div>
      </div>
      <Link className="btn-primary" to="/livraisons">
        Voir les livraisons
      </Link>
    </div>
  );
}
