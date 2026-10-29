import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoadingState } from '../../components/shared/StateViews';
import {
  getAuthErrorMessage,
  getCurrentUser,
  refresh,
} from '../../features/auth/auth.api';
import { useAuthStore } from '../../stores/auth.store';

export function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);

  useEffect(() => {
    let active = true;
    async function complete() {
      try {
        const { accessToken } = await refresh();
        const user = await getCurrentUser();
        if (active) {
          setSession(accessToken, user);
          navigate('/', { replace: true });
        }
      } catch (error) {
        if (active) {
          const reason =
            params.get('error') ??
            getAuthErrorMessage(error, 'google_auth_failed');
          navigate(`/auth/sign-in?error=${encodeURIComponent(reason)}`, {
            replace: true,
          });
        }
      }
    }
    void complete();
    return () => {
      active = false;
    };
  }, [navigate, params, setSession]);

  return <LoadingState label='Completing secure sign-in...' />;
}
