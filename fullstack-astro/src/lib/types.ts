// Shared shapes for the storefront. These mirror the Base44 entity schemas in
// `base44/entities/*.jsonc`, plus the server-injected fields (`id`,
// `created_date`, ...) that every Base44 record carries.

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

export type RoastLevel = "light" | "medium" | "medium-dark" | "dark";

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  currency: string;
  images?: string[];
  category_id?: string;
  stock?: number;
  featured?: boolean;
  tags?: string[];
  status?: "active" | "draft";
  origin?: string;
  roast_level?: RoastLevel;
  /** Optional brand accent used by the generated product tile (demo data only). */
  accent?: string;
  created_date?: string;
}

export interface Review {
  id: string;
  product_id: string;
  rating: number;
  title?: string;
  body?: string;
  author_name?: string;
  created_by?: string;
  created_date?: string;
}

export interface OrderItem {
  product_id: string;
  name: string;
  qty: number;
  unit_price: number;
}

export interface ShippingAddress {
  name?: string;
  line1?: string;
  line2?: string;
  city?: string;
  region?: string;
  postal_code?: string;
  country?: string;
}

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  currency: string;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  customer_email?: string;
  shipping_address?: ShippingAddress;
  created_date?: string;
}
