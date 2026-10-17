export interface CustomerInfoResponse {
  id: string;
  email: string;
  full_name: string;
  role: 'customer' | 'admin';
  phone:string
}
