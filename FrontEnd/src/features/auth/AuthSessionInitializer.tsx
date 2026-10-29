import { useEffect, type PropsWithChildren } from 'react';
import { getCurrentUser, refresh } from './auth.api';
import { useAuthStore } from '../../stores/auth.store';

export function AuthSessionInitializer({ children }: PropsWithChildren) {
  const setSession = useAuthStore((state) => state.setSession);
  const reset = useAuthStore((state) => state.reset);
  const setInitializing = useAuthStore((state) => state.setInitializing);

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        const { accessToken } = await refresh();
        const user = await getCurrentUser();
        if (active) setSession(accessToken, user);
      } catch {
        if (active) reset();
      } finally {
        if (active) setInitializing(false);
      }
    }

    void initialize();
    return () => {
      active = false;
    };
  }, [reset, setInitializing, setSession]);

  return children;
}
