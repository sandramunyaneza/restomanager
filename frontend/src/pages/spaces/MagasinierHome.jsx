import { Link } from 'react-router-dom';

export default function MagasinierHome() {
  return (
    <div>
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#a8e6cf' }}>
            <i className="fas fa-warehouse" />
          </div>
          <h3>Entrepôt</h3>
          <p>Gérez les ingrédients, seuils d’alerte et mouvements de stock.</p>
        </div>
      </div>
      <Link className="btn-primary" to="/stock">
        Accéder au stock
      </Link>
    </div>
  );
}
