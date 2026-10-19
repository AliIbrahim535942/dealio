export interface CustomerInfoResponse {
  id: string;
  email: string;
  full_name: string;
  role: 'customer' | 'admin';
  phone: string;
}
export interface UserToLogin {
  id: number;
  email: string;
  password: string|null;
  role: 'customer'|'admin';
  is_active: boolean;
  is_email_verified: boolean;
}
