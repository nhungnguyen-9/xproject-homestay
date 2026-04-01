import { Navigate, Outlet } from 'react-router';
import * as authService from '@/services/authService';

export function ProtectedRoute() {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }
  return <Outlet />;
}
