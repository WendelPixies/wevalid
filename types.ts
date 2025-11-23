export interface ProductCatalogItem {
  id: string;
  code: string;
  description: string;
}

export interface InventoryItem {
  id: string;
  store_id: string;
  product_code: string;
  product_description?: string; // Joined from products table
  quantity: number;
  expiry_date: string; // YYYY-MM-DD
  created_at?: string;
}

export interface Franchise {
  id: string;
  name: string;
}

export interface Store {
  id: string;
  name: string;
  franchise_id?: string;
  contact_email?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'manager' | 'store_user';
  status?: 'pending' | 'approved' | 'rejected';
  store_id?: string;
  franchise_id?: string;
}

export enum FilterType {
  ALL = 'ALL',
  TODAY = 'TODAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
}
