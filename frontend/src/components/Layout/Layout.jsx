import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../Context/AuthContext';

const Layout = () => {
  const { user } = useAuth();

  return (
    <div>
      <Sidebar userRole={user?.role} />
      <div className="main-content">
        <Header user={user} />
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;