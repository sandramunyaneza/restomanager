import { useNavigate, useLocation } from 'react-router-dom';
import { menuForRole } from '../../utils/roles';

export default function Sidebar({ userRole }) {
  const navigate = useNavigate();
  const location = useLocation();
  const items = menuForRole(userRole);

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
          role="presentation"
        >
          <i className={`fas ${item.icon}`} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
