import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoadingState } from '../../components/shared/StateViews';
import { useAuthStore } from '../../stores/auth.store';

export function ProtectedRoute() {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitializing = useAuthStore((state) => state.isInitializing);

  if (isInitializing) return <LoadingState label='Restoring your session...' />;

  if (!isAuthenticated) {
    return <Navigate to='/auth/sign-in' replace state={{ from: location }} />;
  }

  return <Outlet />;
}
