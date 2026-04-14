import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './Context/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Commandes from './pages/Commandes';
import Reservations from './pages/Reservations';
import Menu from './pages/Menu';
import Stock from './pages/Stock';
import Livraisons from './pages/Livraisons';
import Factures from './pages/Factures';
import Rapports from './pages/Rapports';
import Utilisateurs from './pages/Utilisateurs';
import Caisse from './pages/Caisse';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Chargement...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="commandes" element={<Commandes />} />
        <Route path="reservations" element={<Reservations />} />
        <Route path="menu" element={<Menu />} />
        <Route path="stock" element={<Stock />} />
        <Route path="livraisons" element={<Livraisons />} />
        <Route path="factures" element={<Factures />} />
        <Route path="rapports" element={<Rapports />} />
        <Route path="utilisateurs" element={<Utilisateurs />} />
        <Route path="caisse" element={<Caisse />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;