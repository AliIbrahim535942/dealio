export interface GoogleUserInput {
  googleId: string;
  email: string;
  fullName: string;
  emailVerified: boolean;
}

export interface GoogleAuthUser {
  id: number;
  email: string;
  role: 'admin' | 'customer';
  is_active: boolean;
}
