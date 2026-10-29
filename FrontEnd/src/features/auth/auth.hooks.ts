import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/auth.store';
import {
  getCurrentUser,
  login,
  logout,
  resendCode,
  signUp,
  verifyEmail,
} from './auth.api';

export function useLogin() {
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setSession = useAuthStore((state) => state.setSession);
  return useMutation({
    mutationFn: login,
    onSuccess: async ({ accessToken }) => {
      setAccessToken(accessToken);
      const user = await getCurrentUser();
      setSession(accessToken, user);
    },
  });
}

export function useSignUp() {
  return useMutation({ mutationFn: signUp });
}

export function useVerifyEmail() {
  return useMutation({ mutationFn: verifyEmail });
}

export function useResendCode() {
  return useMutation({ mutationFn: resendCode });
}

export function useLogout() {
  const reset = useAuthStore((state) => state.reset);
  return useMutation({
    mutationFn: logout,
    onSettled: reset,
  });
}
