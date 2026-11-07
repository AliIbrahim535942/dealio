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
  password: string | null;
  role: 'customer' | 'admin';
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
export type PublicCategory = Pick<
  Category,
  'id' | 'name' | 'slug' | 'description' | 'image_url' | 'parent_id'
>;

export interface CategoryNode extends PublicCategory {
  children: CategoryNode[];
}

export interface CategoryDetails extends PublicCategory {
  ancestors: Pick<Category, 'id' | 'name' | 'slug'>[];
  children: PublicCategory[];
}
export interface ProductPublic {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  stock_quantity: number;
  categories: { id: number; name: string; slug: string }[];
  images: {
    id: number;
    image_url: string;
    is_primary: boolean;
    display_order: number;
  }[];
}
export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: string; // DECIMAL values remain strings.
  stock_quantity: number;
  sku: string | null;
  created_at: Date;
}

export interface ProductImage {
  id: number;
  image_url: string;
  is_primary: boolean;
  display_order: number;
}

export interface ProductWithDetails extends Product {
  category_ids: number[];
  images: ProductImage[];
}

export interface ProductListItem {
  id: number;
  name: string;
  slug: string;
  price: string;
  stock_quantity: number;
  primary_image: string | null;
}

export interface ProductListResult {
  items: ProductListItem[];
  meta: { page: number; limit: number; total: number; total_pages: number };
}
export interface CartItem {
  product_id: number;
  name: string;
  slug: string;
  price: string;
  quantity: number;
  line_total: string;
  stock_quantity: number;
  primary_image: string | null;
  available: boolean;
}

export interface Cart {
  items: CartItem[];
  subtotal: string;
}
