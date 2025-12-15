import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../Auth';

const ProtectedRoute = () => {
  const { session, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // You might want to render a spinner here
    return null; 
  }

  // If there's no active session, redirect to login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // If a session exists but no role has been selected,
  // and the user is not already on the role selection page,
  // redirect them to select a role.
  if (!role && location.pathname !== '/role-selection') {
    return <Navigate to="/role-selection" replace />;
  }
  
  // If a role IS selected, but the user tries to go back to role selection,
  // send them to the dashboard's main page.
  if (role && location.pathname === '/role-selection') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
