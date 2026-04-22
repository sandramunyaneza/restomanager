import { Link } from 'react-router-dom';

/** Interface dédiée cuisine : vue synthétique + lien vers la file commandes. */
export default function CuisineHome() {
  return (
    <div>
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ffeaa7' }}>
            <i className="fas fa-fire" />
          </div>
          <h3>Cuisine</h3>
          <p>Priorisez les commandes « en cours » et marquez-les « prêtes » depuis la liste.</p>
        </div>
      </div>
      <Link className="btn-primary" to="/commandes">
        Ouvrir la file commandes
      </Link>
    </div>
  );
}
