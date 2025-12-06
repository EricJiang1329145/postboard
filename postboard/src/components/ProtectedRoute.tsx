import { Navigate, Outlet } from 'react-router-dom';
import { useUserStore } from '../context/useStore';

const ProtectedRoute = () => {
  const { currentUser } = useUserStore();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
