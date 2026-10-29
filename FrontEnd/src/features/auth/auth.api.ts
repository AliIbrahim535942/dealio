import { apiClient } from '../../lib/api/client';
import axios from 'axios';
import type {
  ApiResponse,
  LoginResponse,
  SignUpResponse,
  UserProfile,
} from '../../shared/types/auth.types';
import type {
  LoginInput,
  ResendCodeInput,
  SignUpInput,
  VerifyEmailInput,
} from '../../shared/schemas/auth.schemas';

export async function signUp(input: SignUpInput) {
  const { data } = await apiClient.post<ApiResponse<SignUpResponse>>(
    '/auth/sign-up',
    input,
  );
  return data;
}

export async function login(input: LoginInput) {
  const { data } = await apiClient.post<ApiResponse<LoginResponse>>(
    '/auth/login',
    input,
  );
  if (!data.data) throw new Error('Login response did not include a session');
  return data.data;
}

export async function refresh() {
  const { data } =
    await apiClient.post<ApiResponse<{ accessToken: string }>>('/auth/refresh');
  if (!data.data) throw new Error('Refresh response did not include a token');
  return data.data;
}

export async function getCurrentUser() {
  const { data } =
    await apiClient.get<ApiResponse<{ user: UserProfile }>>('/auth/me');
  if (!data.data) throw new Error('Current-user response was empty');
  return data.data.user;
}

export async function logout() {
  await apiClient.post<ApiResponse<never>>('/auth/logout');
}

export async function verifyEmail(input: VerifyEmailInput) {
  const { data } = await apiClient.post<ApiResponse<never>>(
    '/auth/verify-email',
    input,
  );
  return data;
}

export async function resendCode(input: ResendCodeInput) {
  const { data } = await apiClient.post<ApiResponse<never>>(
    '/auth/resend-code',
    input,
  );
  return data;
}

export function getGoogleAuthUrl() {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api';
  return `${baseUrl.replace(/\/$/, '')}/auth/google`;
}

export function getAuthErrorMessage(
  error: unknown,
  fallback = 'Something went wrong',
) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string') return message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
