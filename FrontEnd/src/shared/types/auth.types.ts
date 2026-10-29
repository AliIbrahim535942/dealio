export type UserRole = 'customer' | 'admin';
export type AuthProvider = 'local' | 'google';

export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
}

export interface UserProfile extends AuthUser {
  full_name: string;
  phone: string | null;
  auth_provider: AuthProvider;
  is_email_verified: boolean;
  created_at: string;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  message: string;
  data?: T;
}

export interface AuthErrorResponse {
  status?: string;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
}

export interface SignUpResponse {
  name: string;
  email: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}
