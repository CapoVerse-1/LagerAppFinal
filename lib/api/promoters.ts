import { supabase } from '../supabase';
import { Database } from '@/types/supabase';
import { fetchPromoterInventory } from './transactions';

export type Promoter = Database['public']['Tables']['promoters']['Row'];
export type CreatePromoterData = Database['public']['Tables']['promoters']['Insert'];
export type UpdatePromoterData = Database['public']['Tables']['promoters']['Update'];

/**
 * Fetch all promoters from the database
 * @returns Promise with array of promoters
 */
export async function fetchPromoters(): Promise<Promoter[]> {
  try {
    const { data, error } = await supabase
      .from('promoters')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching promoters:', error);
      throw new Error(error.message);
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchPromoters:', error);
    throw error;
  }
}

/**
 * Create a new promoter
 * @param promoterData Promoter data to create
 * @returns Promise with the created promoter
 */
export async function createPromoter(promoterData: CreatePromoterData): Promise<Promoter> {
  try {
    // Check if user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error('Authentication required');
    }

    // Remove automatic assignment of auth user ID
    // The created_by field should be provided by the caller

    const { data, error } = await supabase
      .from('promoters')
      .insert([promoterData])
      .select()
      .single();

    if (error) {
      console.error('Error creating promoter:', error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error('Error in createPromoter:', error);
    throw error;
  }
}

/**
 * Update an existing promoter
 * @param id Promoter ID
 * @param promoterData Updated promoter data
 * @returns Promise with the updated promoter
 */
export async function updatePromoter(id: string, promoterData: UpdatePromoterData): Promise<Promoter> {
  try {
    // Check if user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error('Authentication required');
    }

    const { data, error } = await supabase
      .from('promoters')
      .update(promoterData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating promoter:', error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error('Error in updatePromoter:', error);
    throw error;
  }
}

/**
 * Toggle promoter active status
 * @param id Promoter ID
 * @param isActive New active status
 * @returns Promise with the updated promoter
 */
export async function togglePromoterStatus(id: string, isActive: boolean): Promise<Promoter> {
  return updatePromoter(id, { is_active: isActive });
}

/**
 * Delete a promoter
 * @param id Promoter ID
 * @returns Promise with success status
 */
export async function deletePromoter(id: string): Promise<void> {
  try {
    // Check if user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error('Authentication required');
    }

    // Check if promoter has any active transactions
    const { count, error: countError } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('promoter_id', id);

    if (countError) {
      console.error('Error checking promoter transactions:', countError);
      throw new Error(countError.message);
    }

    // If promoter has transactions, don't allow deletion
    if (count && count > 0) {
      throw new Error('Cannot delete promoter with transaction history. Consider marking as inactive instead.');
    }

    const { error } = await supabase
      .from('promoters')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting promoter:', error);
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Error in deletePromoter:', error);
    throw error;
  }
}

/**
 * Get a promoter's current inventory
 * @param promoterId Promoter ID
 * @returns Promise with the promoter's inventory
 */
export async function getPromoterInventory(promoterId: string): Promise<any[]> {
  try {
    // Get the raw inventory data
    const inventoryItems = await fetchPromoterInventory(promoterId);
    
    if (inventoryItems.length === 0) {
      return [];
    }
    
    // Fetch detailed information for each item
    const itemDetails = await Promise.all(
      inventoryItems.map(async (item) => {
        // Get item details
        const { data: itemData, error: itemError } = await supabase
          .from('items')
          .select('*, brands(name)')
          .eq('id', item.itemId)
          .single();
          
        if (itemError) {
          console.error('Error fetching item details:', itemError);
          throw new Error(itemError.message);
        }
        
        // Get size details
        const { data: sizeData, error: sizeError } = await supabase
          .from('item_sizes')
          .select('*')
          .eq('id', item.itemSizeId)
          .single();
          
        if (sizeError) {
          console.error('Error fetching size details:', sizeError);
          throw new Error(sizeError.message);
        }
        
        return {
          ...item,
          item: itemData,
          size: sizeData
        };
      })
    );
    
    return itemDetails;
  } catch (error) {
    console.error('Error in getPromoterInventory:', error);
    throw error;
  }
}

/**
 * Count transactions for a promoter
 * @param promoterId Promoter ID
 * @returns Promise with the count of transactions
 */
export async function countPromoterTransactions(promoterId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('promoter_id', promoterId);

    if (error) {
      console.error('Error counting promoter transactions:', error);
      throw new Error(error.message);
    }

    return count || 0;
  } catch (error) {
    console.error('Error in countPromoterTransactions:', error);
    throw error;
  }
}