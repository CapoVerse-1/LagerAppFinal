import { supabase } from '../supabase';
import { Database } from '@/types/supabase';

export type Item = Database['public']['Tables']['items']['Row'];
export type CreateItemData = Database['public']['Tables']['items']['Insert'];
export type UpdateItemData = Database['public']['Tables']['items']['Update'];

export type ItemSize = Database['public']['Tables']['item_sizes']['Row'];
export type CreateItemSizeData = Database['public']['Tables']['item_sizes']['Insert'];
export type UpdateItemSizeData = Database['public']['Tables']['item_sizes']['Update'];

export type SharedItem = Database['public']['Tables']['shared_items']['Row'];
export type CreateSharedItemData = Database['public']['Tables']['shared_items']['Insert'];

/**
 * Fetch all items for a specific brand
 * @param brandId Brand ID
 * @returns Promise with array of items
 */
export async function fetchItems(brandId: string): Promise<Item[]> {
  try {
    // First, get items directly associated with the brand
    const { data: directItems, error: directError } = await supabase
      .from('items')
      .select('*')
      .eq('brand_id', brandId)
      .order('name');

    if (directError) {
      console.error('Error fetching direct items:', directError);
      throw new Error(directError.message);
    }

    // Then, get shared items associated with the brand
    const { data: sharedItemsData, error: sharedError } = await supabase
      .from('shared_items')
      .select('item_id')
      .eq('brand_id', brandId);

    if (sharedError) {
      console.error('Error fetching shared items:', sharedError);
      throw new Error(sharedError.message);
    }

    // If there are shared items, fetch their details
    let sharedItems: Item[] = [];
    if (sharedItemsData && sharedItemsData.length > 0) {
      const sharedItemIds = sharedItemsData.map(item => item.item_id);
      
      const { data: sharedItemDetails, error: detailsError } = await supabase
        .from('items')
        .select('*')
        .in('id', sharedItemIds)
        .order('name');

      if (detailsError) {
        console.error('Error fetching shared item details:', detailsError);
        throw new Error(detailsError.message);
      }

      sharedItems = sharedItemDetails || [];
    }

    // Combine direct and shared items
    return [...(directItems || []), ...sharedItems];
  } catch (error) {
    console.error('Error in fetchItems:', error);
    throw error;
  }
}

/**
 * Create a new item
 * @param itemData Item data to create
 * @returns Promise with the created item
 */
export async function createItem(itemData: CreateItemData): Promise<Item> {
  try {
    // Check if user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error('Authentication required');
    }

    // Remove automatic assignment of auth user ID
    // The created_by field should be provided by the caller

    const { data, error } = await supabase
      .from('items')
      .insert([itemData])
      .select()
      .single();

    if (error) {
      console.error('Error creating item:', error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error('Error in createItem:', error);
    throw error;
  }
}

/**
 * Update an existing item
 * @param id Item ID
 * @param itemData Updated item data
 * @returns Promise with the updated item
 */
export async function updateItem(id: string, itemData: UpdateItemData): Promise<Item> {
  try {
    // Check if user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error('Authentication required');
    }

    const { data, error } = await supabase
      .from('items')
      .update(itemData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating item:', error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error('Error in updateItem:', error);
    throw error;
  }
}

/**
 * Toggle item active status
 * @param id Item ID
 * @param isActive New active status
 * @returns Promise with the updated item
 */
export async function toggleItemStatus(id: string, isActive: boolean): Promise<Item> {
  return updateItem(id, { is_active: isActive });
}

/**
 * Delete an item
 * @param id Item ID
 * @returns Promise with success status
 */
export async function deleteItem(id: string): Promise<void> {
  try {
    // Check if user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error('Authentication required');
    }

    // First, delete all item sizes
    const { error: sizeError } = await supabase
      .from('item_sizes')
      .delete()
      .eq('item_id', id);

    if (sizeError) {
      console.error('Error deleting item sizes:', sizeError);
      throw new Error(sizeError.message);
    }

    // Then, delete all shared item references
    const { error: sharedError } = await supabase
      .from('shared_items')
      .delete()
      .eq('item_id', id);

    if (sharedError) {
      console.error('Error deleting shared item references:', sharedError);
      throw new Error(sharedError.message);
    }

    // Finally, delete the item itself
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting item:', error);
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Error in deleteItem:', error);
    throw error;
  }
}

/**
 * Count sizes for an item
 * @param itemId Item ID
 * @returns Promise with the count of sizes
 */
export async function countItemSizes(itemId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('item_sizes')
      .select('*', { count: 'exact', head: true })
      .eq('item_id', itemId);

    if (error) {
      console.error('Error counting item sizes:', error);
      throw new Error(error.message);
    }

    return count || 0;
  } catch (error) {
    console.error('Error in countItemSizes:', error);
    throw error;
  }
}

/**
 * Add a new size to an item
 * @param sizeData Size data to create
 * @returns Promise with the created size
 */
export async function addItemSize(sizeData: CreateItemSizeData): Promise<ItemSize> {
  try {
    // Check if user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error('Authentication required');
    }

    // Set in_circulation to 0 if not provided
    if (sizeData.in_circulation === undefined) {
      sizeData.in_circulation = 0;
    }

    const { data, error } = await supabase
      .from('item_sizes')
      .insert([sizeData])
      .select()
      .single();

    if (error) {
      console.error('Error adding item size:', error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error('Error in addItemSize:', error);
    throw error;
  }
}

/**
 * Update an existing item size
 * @param id Size ID
 * @param sizeData Updated size data
 * @returns Promise with the updated size
 */
export async function updateItemSize(id: string, sizeData: UpdateItemSizeData): Promise<ItemSize> {
  try {
    // Check if user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error('Authentication required');
    }

    const { data, error } = await supabase
      .from('item_sizes')
      .update(sizeData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating item size:', error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error('Error in updateItemSize:', error);
    throw error;
  }
}

/**
 * Delete an item size
 * @param id Size ID
 * @returns Promise with success status
 */
export async function deleteItemSize(id: string): Promise<void> {
  try {
    // Check if user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error('Authentication required');
    }

    const { error } = await supabase
      .from('item_sizes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting item size:', error);
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Error in deleteItemSize:', error);
    throw error;
  }
}

/**
 * Fetch all sizes for a specific item
 * @param itemId Item ID
 * @returns Promise with array of sizes
 */
export async function fetchItemSizes(itemId: string): Promise<ItemSize[]> {
  try {
    console.log('fetchItemSizes - Starting for item:', itemId);
    
    const { data, error } = await supabase
      .from('item_sizes')
      .select('*')
      .eq('item_id', itemId)
      .order('size');

    if (error) {
      console.error('Error fetching item sizes:', error);
      throw new Error(error.message);
    }

    console.log('fetchItemSizes - Fetched sizes:', data);
    return data || [];
  } catch (error) {
    console.error('Error in fetchItemSizes:', error);
    throw error;
  }
}

/**
 * Link an existing item to multiple brands (shared item)
 * @param itemId Item ID
 * @param brandIds Array of brand IDs to link the item to
 * @returns Promise with success status
 */
export async function linkSharedItem(itemId: string, brandIds: string[]): Promise<void> {
  try {
    // Check if user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error('Authentication required');
    }

    // First, mark the item as shared
    await updateItem(itemId, { is_shared: true });

    // Create shared_items entries for each brand
    const sharedItemsData = brandIds.map(brandId => ({
      item_id: itemId,
      brand_id: brandId
    }));

    const { error } = await supabase
      .from('shared_items')
      .insert(sharedItemsData);

    if (error) {
      console.error('Error linking shared item:', error);
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Error in linkSharedItem:', error);
    throw error;
  }
}

/**
 * Get all brands that an item is shared with
 * @param itemId Item ID
 * @returns Promise with array of brand IDs
 */
export async function getSharedItemBrands(itemId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('shared_items')
      .select('brand_id')
      .eq('item_id', itemId);

    if (error) {
      console.error('Error fetching shared item brands:', error);
      throw new Error(error.message);
    }

    return (data || []).map(item => item.brand_id);
  } catch (error) {
    console.error('Error in getSharedItemBrands:', error);
    throw error;
  }
}

/**
 * Remove a shared item link from a brand
 * @param itemId Item ID
 * @param brandId Brand ID
 * @returns Promise with success status
 */
export async function unlinkSharedItem(itemId: string, brandId: string): Promise<void> {
  try {
    // Check if user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error('Authentication required');
    }

    const { error } = await supabase
      .from('shared_items')
      .delete()
      .eq('item_id', itemId)
      .eq('brand_id', brandId);

    if (error) {
      console.error('Error unlinking shared item:', error);
      throw new Error(error.message);
    }

    // Check if this was the last shared link
    const remainingLinks = await getSharedItemBrands(itemId);
    if (remainingLinks.length === 0) {
      // If no more links, mark the item as not shared
      await updateItem(itemId, { is_shared: false });
    }
  } catch (error) {
    console.error('Error in unlinkSharedItem:', error);
    throw error;
  }
}

/**
 * Calculate total quantities for an item across all sizes
 * @param itemId Item ID
 * @returns Promise with calculated quantities
 */
export async function calculateItemQuantities(itemId: string): Promise<{
  originalQuantity: number;
  availableQuantity: number;
  inCirculation: number;
  totalQuantity: number;
}> {
  try {
    console.log('calculateItemQuantities - Starting for item:', itemId);
    const sizes = await fetchItemSizes(itemId);
    console.log('calculateItemQuantities - Fetched sizes:', sizes);
    
    // Log each size's contribution to the total
    sizes.forEach((size, index) => {
      console.log(`calculateItemQuantities - Size ${index + 1} (${size.size}):`, {
        original: size.original_quantity,
        available: size.available_quantity,
        inCirculation: size.in_circulation
      });
    });
    
    const originalQuantity = sizes.reduce((sum, size) => sum + size.original_quantity, 0);
    const availableQuantity = sizes.reduce((sum, size) => sum + size.available_quantity, 0);
    const inCirculation = sizes.reduce((sum, size) => sum + size.in_circulation, 0);
    const totalQuantity = availableQuantity + inCirculation;
    
    console.log('calculateItemQuantities - Calculated quantities:', {
      originalQuantity,
      availableQuantity,
      inCirculation,
      totalQuantity
    });
    
    return {
      originalQuantity,
      availableQuantity,
      inCirculation,
      totalQuantity
    };
  } catch (error) {
    console.error('Error in calculateItemQuantities:', error);
    throw error;
  }
}

/**
 * Fetch all sizes for all items in a brand
 * @param brandId Brand ID
 * @returns Promise with array of all item sizes for the brand
 */
export async function fetchAllItemSizesForBrand(brandId: string): Promise<(ItemSize & { item_name?: string })[]> {
  try {
    // First, get all item IDs for the brand (both direct and shared)
    const items = await fetchItems(brandId);
    
    if (items.length === 0) {
      return [];
    }
    
    const itemIds = items.map(item => item.id);
    
    // Then fetch all sizes for these items in a single query
    const { data, error } = await supabase
      .from('item_sizes')
      .select(`
        *,
        items:item_id (
          name
        )
      `)
      .in('item_id', itemIds)
      .order('size');
      
    if (error) {
      console.error('Error fetching item sizes for brand:', error);
      throw new Error(error.message);
    }
    
    // Add item_name property to each size
    const sizesWithNames = (data || []).map(size => ({
      ...size,
      item_name: size.items?.name || 'Unknown'
    }));
    
    return sizesWithNames;
  } catch (error) {
    console.error('Error in fetchAllItemSizesForBrand:', error);
    throw error;
  }
}

/**
 * Search for items across all brands
 * @param searchTerm Search term for item name or product_id
 * @param limit Maximum number of results to return
 * @returns Promise with array of items
 */
export async function searchItems(searchTerm: string, limit: number = 10): Promise<Item[]> {
  try {
    if (!searchTerm.trim()) {
      return [];
    }
    
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,product_id.ilike.%${searchTerm}%`)
      .order('name')
      .limit(limit);
      
    if (error) {
      console.error('Error searching items:', error);
      throw new Error(error.message);
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in searchItems:', error);
    throw error;
  }
}

/**
 * Get shared items for a specific brand
 * @param brandId Brand ID
 * @returns Promise with array of shared items
 */
export async function getSharedItemsForBrand(brandId: string): Promise<Item[]> {
  try {
    // Get shared items associated with the brand
    const { data: sharedItemsData, error: sharedError } = await supabase
      .from('shared_items')
      .select('item_id')
      .eq('brand_id', brandId);

    if (sharedError) {
      console.error('Error fetching shared items:', sharedError);
      throw new Error(sharedError.message);
    }

    // If there are shared items, fetch their details
    let sharedItems: Item[] = [];
    if (sharedItemsData && sharedItemsData.length > 0) {
      const sharedItemIds = sharedItemsData.map(item => item.item_id);
      
      const { data: sharedItemDetails, error: detailsError } = await supabase
        .from('items')
        .select('*')
        .in('id', sharedItemIds)
        .order('name');

      if (detailsError) {
        console.error('Error fetching shared item details:', detailsError);
        throw new Error(detailsError.message);
      }

      sharedItems = sharedItemDetails || [];
    }

    return sharedItems;
  } catch (error) {
    console.error('Error in getSharedItemsForBrand:', error);
    throw error;
  }
}