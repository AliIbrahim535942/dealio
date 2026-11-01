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
export interface UserProfile {
  id: number;
  full_name: string;
  email: string;
  role: 'admin' | 'customer';
  phone: string | null;
  auth_provider: 'local' | 'google';
  is_email_verified: boolean;
  created_at: Date;
}
export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: number | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}