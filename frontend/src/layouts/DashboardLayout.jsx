import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import Toast from '../components/Common/Toast';

export default function DashboardLayout() {
  const { user } = useAuth();
  const { message, show } = useToast();

  return (
    <div>
      <Sidebar userRole={user?.role} />
      <div className="main-content">
        <Header user={user} onNotify={show} />
        <Outlet />
        <Toast message={message} />
      </div>
    </div>
  );
}
