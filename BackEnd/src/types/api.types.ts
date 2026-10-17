export interface CustomerInfoResponse {
  id: string;
  email: string;
  full_name: string;
  role: 'customer' | 'admin';
  phone: string;
}
export interface UserToLogin {
  id: string;
  email: string;
  password: string|null;
  role: string;
  is_active: boolean;
  is_email_verified: boolean;
}
