import { supabase } from './supabaseClient';
import { InventoryItem, ProductCatalogItem, Franchise } from '../types';

// Fetch inventory items for a specific store
export const getStoreInventory = async (storeId: string): Promise<InventoryItem[]> => {
  const { data, error } = await supabase
    .from('inventory_items')
    .select(`
      *,
      products (
        description,
        unit_cost
      )
    `)
    .eq('store_id', storeId)
    .order('expiry_date', { ascending: true });

  if (error) {
    console.error('Error fetching inventory:', error);
    return [];
  }

  return data.map((item: any) => ({
    ...item,
    product_description: item.products?.description || 'Produto não encontrado',
  }));
};

// Fetch all inventory items (for Admin)
export const getAllInventory = async (): Promise<InventoryItem[]> => {
  const { data, error } = await supabase
    .from('inventory_items')
    .select(`
      *,
      products (
        description,
        unit_cost
      ),
      stores (
        name
      )
    `)
    .order('expiry_date', { ascending: true });

  if (error) {
    console.error('Error fetching all inventory:', error);
    return [];
  }

  return data.map((item: any) => ({
    ...item,
    product_description: item.products?.description || 'Produto não encontrado',
    store_name: item.stores?.name
  }));
};

// Add new inventory item
export const addInventoryItem = async (item: Omit<InventoryItem, 'id' | 'created_at'> & { unit_cost?: number }) => {
  // 1. Ensure product exists and update/insert description and cost
  const { data: product } = await supabase
    .from('products')
    .select('code')
    .eq('code', item.product_code)
    .single();

  if (!product) {
    // Create product
    await supabase.from('products').insert({
      code: item.product_code,
      description: item.product_description || '',
      unit_cost: item.unit_cost || 0
    });
  } else {
    // Update product cost/description if provided
    const updates: any = {};
    if (item.product_description) updates.description = item.product_description;
    if (item.unit_cost !== undefined) updates.unit_cost = item.unit_cost;

    if (Object.keys(updates).length > 0) {
      await supabase.from('products').update(updates).eq('code', item.product_code);
    }
  }

  // 2. Fetch franchise_id from store if not provided
  let franchiseId = item.franchise_id;
  if (!franchiseId) {
    const { data: store } = await supabase.from('stores').select('franchise_id').eq('id', item.store_id).single();
    if (store) franchiseId = store.franchise_id;
  }

  // 3. Insert Inventory Item
  const { data, error } = await supabase
    .from('inventory_items')
    .insert([{
      store_id: item.store_id,
      franchise_id: franchiseId,
      product_code: item.product_code,
      quantity: item.quantity,
      expiry_date: item.expiry_date,
      total_cost: item.total_cost || (item.quantity * (item.unit_cost || 0))
    }])
    .select()
    .single();

  if (error) {
    console.error('Error adding item:', error);
    throw error;
  }
  return data;
};

// Update inventory item
export const updateInventoryItem = async (id: string, updates: Partial<InventoryItem>) => {
  const { data, error } = await supabase
    .from('inventory_items')
    .update({
      quantity: updates.quantity,
      expiry_date: updates.expiry_date
    })
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error updating item:', error);
    throw error;
  }
  return data;
};

// Delete inventory item
export const deleteInventoryItem = async (id: string) => {
  const { error } = await supabase
    .from('inventory_items')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting item:', error);
    throw error;
  }
};

// Get product description by code
export const getProductByCode = async (code: string): Promise<ProductCatalogItem | null> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('code', code)
    .single();

  if (error) return null;
  return data;
};

// Get all stores
export const getStores = async () => {
  const { data, error } = await supabase.from('stores').select('*');
  if (error) throw error;
  return data;
}

// Add new store
export const addStore = async (name: string, franchiseId?: string, contactEmail?: string) => {
  const { data, error } = await supabase
    .from('stores')
    .insert([{ name, franchise_id: franchiseId, contact_email: contactEmail }])
    .select()
    .single();

  if (error) {
    console.error('Error adding store:', error);
    throw error;
  }
  return data;
};

// Update store
export const updateStore = async (id: string, updates: { name?: string, contact_email?: string }) => {
  const { data, error } = await supabase
    .from('stores')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating store:', error);
    throw error;
  }
  return data;
};

// Delete store
export const deleteStore = async (id: string) => {
  const { error } = await supabase
    .from('stores')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting store:', error);
    throw error;
  }
};

// --- Franchise Services ---

export const getFranchises = async () => {
  const { data, error } = await supabase.from('franchises').select('*').order('name');
  if (error) throw error;
  return data;
};

export const addFranchise = async (franchise: Partial<Franchise>) => {
  const { data, error } = await supabase
    .from('franchises')
    .insert([franchise])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getFranchiseStores = async (franchiseId: string) => {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('franchise_id', franchiseId);

  if (error) throw error;
  return data;
};

// --- User Management Services ---

export const getPendingUsers = async (franchiseId: string) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('franchise_id', franchiseId)
    .eq('status', 'pending');

  if (error) throw error;
  return data;
};

export const getFranchiseUsers = async (franchiseId: string) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select(`
      *,
      user_stores (
        stores (
          id,
          name
        )
      )
    `)
    .eq('franchise_id', franchiseId)
    .neq('status', 'pending');

  if (error) throw error;

  return data.map((u: any) => ({
    ...u,
    // Map the nested structure to a flat array of stores
    stores: u.user_stores?.map((us: any) => us.stores) || []
  }));
};

export const updateUserStatus = async (userId: string, status: 'approved' | 'rejected', role: 'store_user' | 'manager' = 'store_user') => {
  const updateData: any = { status, role };

  const { data, error } = await supabase
    .from('user_profiles')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const linkUserToStore = async (userId: string, storeId: string) => {
  const { error } = await supabase
    .from('user_stores')
    .insert([{ user_id: userId, store_id: storeId }]);

  if (error) throw error;
};

export const unlinkUserFromStore = async (userId: string, storeId: string) => {
  const { error } = await supabase
    .from('user_stores')
    .delete()
    .match({ user_id: userId, store_id: storeId });

  if (error) throw error;
};

export const updateUserProfile = async (userId: string, updates: { full_name?: string }) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};
