import { supabase } from '../supabase';
import { Database } from '@/types/supabase';

export type Brand = Database['public']['Tables']['brands']['Row'];
export type CreateBrandData = Database['public']['Tables']['brands']['Insert'];
export type UpdateBrandData = Database['public']['Tables']['brands']['Update'];

/**
 * Fetch all brands from the database
 * @returns Promise with array of brands
 */
export async function fetchBrands(): Promise<Brand[]> {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching brands:', error);
      throw new Error(error.message);
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchBrands:', error);
    throw error;
  }
}

/**
 * Create a new brand
 * @param brandData Brand data to create
 * @returns Promise with the created brand
 */
export async function createBrand(brandData: CreateBrandData): Promise<Brand> {
  try {
    // Check if user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error('Authentication required');
    }

    // Remove automatic assignment of auth user ID
    // The created_by field should be provided by the caller

    const { data, error } = await supabase
      .from('brands')
      .insert([brandData])
      .select()
      .single();

    if (error) {
      console.error('Error creating brand:', error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error('Error in createBrand:', error);
    throw error;
  }
}

/**
 * Update an existing brand
 * @param id Brand ID
 * @param brandData Updated brand data
 * @returns Promise with the updated brand
 */
export async function updateBrand(id: string, brandData: UpdateBrandData): Promise<Brand> {
  try {
    // Check if user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error('Authentication required');
    }

    const { data, error } = await supabase
      .from('brands')
      .update(brandData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating brand:', error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error('Error in updateBrand:', error);
    throw error;
  }
}

/**
 * Toggle brand active status
 * @param id Brand ID
 * @param isActive New active status
 * @returns Promise with the updated brand
 */
export async function toggleBrandStatus(id: string, isActive: boolean): Promise<Brand> {
  return updateBrand(id, { is_active: isActive });
}

/**
 * Toggle brand pinned status
 * @param id Brand ID
 * @param isPinned New pinned status
 * @returns Promise with the updated brand
 */
export async function toggleBrandPinned(id: string, isPinned: boolean): Promise<Brand> {
  return updateBrand(id, { is_pinned: isPinned });
}

/**
 * Delete a brand
 * @param id Brand ID
 * @returns Promise with success status
 */
export async function deleteBrand(id: string): Promise<void> {
  try {
    // Check if user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error('Authentication required');
    }

    const { error } = await supabase
      .from('brands')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting brand:', error);
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Error in deleteBrand:', error);
    throw error;
  }
}

/**
 * Count items for a brand
 * @param brandId Brand ID
 * @returns Promise with the count of items
 */
export async function countBrandItems(brandId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('items')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', brandId);

    if (error) {
      console.error('Error counting brand items:', error);
      throw new Error(error.message);
    }

    return count || 0;
  } catch (error) {
    console.error('Error in countBrandItems:', error);
    throw error;
  }
}