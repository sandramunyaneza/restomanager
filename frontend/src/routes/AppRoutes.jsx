import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import Commandes from '../pages/Commandes';
import Reservations from '../pages/Reservations';
import Menu from '../pages/Menu';
import Stock from '../pages/Stock';
import Livraisons from '../pages/Livraisons';
import Factures from '../pages/Factures';
import Rapports from '../pages/Rapports';
import Utilisateurs from '../pages/Utilisateurs';
import Caisse from '../pages/Caisse';
import CuisineHome from '../pages/spaces/CuisineHome';
import LivreurHome from '../pages/spaces/LivreurHome';
import MagasinierHome from '../pages/spaces/MagasinierHome';
import ClientHome from '../pages/spaces/ClientHome';
<<<<<<< HEAD
import ServeurHome from '../pages/spaces/ServeurHome';
=======
>>>>>>> c22961cdc564de1d53b8f1381e1d373448e90275

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="login-container">Chargement…</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function RoleRoute({ roles, children }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="commandes" element={<Commandes />} />
        <Route path="reservations" element={<Reservations />} />
        <Route path="menu" element={<Menu />} />
        <Route path="stock" element={<Stock />} />
        <Route path="livraisons" element={<Livraisons />} />
        <Route path="factures" element={<Factures />} />
        <Route
          path="rapports"
          element={
            <RoleRoute roles={['admin', 'caissier']}>
              <Rapports />
            </RoleRoute>
          }
        />
        <Route
          path="utilisateurs"
          element={
            <RoleRoute roles={['admin']}>
              <Utilisateurs />
            </RoleRoute>
          }
        />
        <Route
          path="caisse"
          element={
            <RoleRoute roles={['admin', 'caissier']}>
              <Caisse />
            </RoleRoute>
          }
        />
        <Route path="cuisine" element={<CuisineHome />} />
        <Route path="livreur" element={<LivreurHome />} />
        <Route path="magasin" element={<MagasinierHome />} />
        <Route path="client" element={<ClientHome />} />
<<<<<<< HEAD
        <Route
          path="serveur"
          element={
            <RoleRoute roles={['admin', 'serveur']}>
              <ServeurHome />
            </RoleRoute>
          }
        />
=======
>>>>>>> c22961cdc564de1d53b8f1381e1d373448e90275
      </Route>
    </Routes>
  );
}
