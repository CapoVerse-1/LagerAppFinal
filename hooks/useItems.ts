import { useState, useEffect, useCallback } from 'react';
import { useUser } from '../contexts/UserContext';
import { 
  fetchItems, 
  createItem, 
  updateItem, 
  deleteItem, 
  toggleItemStatus,
  countItemSizes,
  fetchItemSizes,
  addItemSize,
  updateItemSize,
  deleteItemSize,
  calculateItemQuantities,
  unlinkSharedItem,
  Item,
  ItemSize
} from '@/lib/api/items';
import { uploadItemImage, updateItemImage, deleteItemImage } from '@/lib/api/storage';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export interface ItemWithSizeCount extends Item {
  sizeCount: number;
  quantities?: {
    originalQuantity: number;
    availableQuantity: number;
    inCirculation: number;
    totalQuantity: number;
  };
  is_shared_instance?: boolean;
}

export function useItems(brandId: string) {
  const [items, setItems] = useState<ItemWithSizeCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [initialItemCount, setInitialItemCount] = useState<number | null>(null);
  const { toast } = useToast();
  const { currentUser } = useUser();

  // Load items from Supabase
  const loadItems = useCallback(async (overrideBrandId?: string) => {
    const effectiveBrandId = overrideBrandId || brandId;
    if (!effectiveBrandId) return;
    
    try {
      console.log('useItems - loadItems called with brandId:', effectiveBrandId);
      setLoading(true);
      const itemsData = await fetchItems(effectiveBrandId);
      console.log('useItems - fetchItems returned:', itemsData.length, 'items');
      
      // Get size counts, quantities, and determine if it's a shared instance for each item
      const itemsWithDetails = await Promise.all(
        itemsData.map(async (item) => {
          const count = await countItemSizes(item.id);
          const quantities = await calculateItemQuantities(item.id);
          // Determine if it's a shared instance for the *current* brand
          const is_shared_instance = item.is_shared === true && item.brand_id !== effectiveBrandId;
          return { 
            ...item, 
            sizeCount: count, 
            quantities,
            is_shared_instance
          };
        })
      );
      
      console.log('useItems - Setting items with details:', itemsWithDetails.length, 'items');
      setItems(itemsWithDetails);
      setError(null);
    } catch (err) {
      console.error('Error loading items:', err);
      setError(err instanceof Error ? err : new Error('Failed to load items'));
      toast({
        title: 'Error',
        description: 'Failed to load items. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [brandId, toast]);

  // Check for changes in items count
  const checkForChanges = useCallback(async () => {
    if (!brandId) return;
    
    try {
      const { count, error } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true })
        .eq('brand_id', brandId);
        
      if (error) throw error;
      
      if (initialItemCount === null) {
        console.log('useItems - Setting initial item count:', count);
        setInitialItemCount(count);
        return;
      }
      
      if (count !== initialItemCount) {
        console.log('useItems - Item count changed from', initialItemCount, 'to', count);
        setInitialItemCount(count);
        loadItems();
      }
    } catch (err) {
      console.error('Error checking for changes:', err);
    }
  }, [brandId, initialItemCount, loadItems]);

  // Set up polling interval
  useEffect(() => {
    if (!brandId) return;
    
    // Initial load
    loadItems();
    
    // Set up polling interval
    const intervalId = setInterval(checkForChanges, 1000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [brandId, loadItems, checkForChanges]);

  // Alias for refreshItems to use in the component
  const refreshItems = loadItems;

  // Load items on mount and when brandId changes
  useEffect(() => {
    if (brandId) {
      loadItems();
    } else {
      setItems([]);
    }
  }, [brandId, loadItems]);

  // Sort items: active first, then inactive
  const sortedItems = [...items].sort((a, b) => {
    // First, sort by active status
    if (a.is_active !== b.is_active) {
      return a.is_active ? -1 : 1;
    }
    
    // Then, sort alphabetically
    return a.name.localeCompare(b.name);
  });

  // Debug log to see what's happening with the items state
  useEffect(() => {
    console.log('Items state updated:', items);
  }, [items]);

  // Add a new item
  const addItem = async (
    name: string, 
    productId: string, 
    originalQuantity: number,
    imageFile: File | null,
    isShared: boolean = false,
    sizes?: Array<{ size: string, quantity: number }>
  ): Promise<ItemWithSizeCount> => {
    try {
      console.log('useItems - addItem called with name:', name);
      
      // Check if an employee is selected
      if (!currentUser) {
        throw new Error('Please select an employee before creating an item');
      }

      // Create item data
      const itemData: any = {
        name,
        product_id: productId,
        brand_id: brandId,
        is_active: true,
        is_shared: isShared,
        original_quantity: originalQuantity,
        created_by: currentUser.id
      };
      
      // Upload image to Supabase Storage if provided
      if (imageFile) {
        console.log('useItems - Uploading image for item:', name);
        const imageUrl = await uploadItemImage(imageFile);
        itemData.image_url = imageUrl;
      }
      
      // Create item in Supabase
      console.log('useItems - Creating item in database:', name);
      const newItem = await createItem(itemData);
      console.log('useItems - Item created successfully:', newItem.id);
      
      // If multiple sizes are provided, create all of them
      if (sizes && sizes.length > 0) {
        console.log('useItems - Creating multiple sizes for item:', name);
        for (const sizeObj of sizes) {
          await addItemSize({
            item_id: newItem.id,
            size: sizeObj.size,
            original_quantity: sizeObj.quantity,
            available_quantity: sizeObj.quantity,
            in_circulation: 0
          });
        }
      } else {
        console.log('useItems - Creating default size for item:', name);
        await addItemSize({
          item_id: newItem.id,
          size: 'Einheitsgröße',
          original_quantity: originalQuantity,
          available_quantity: originalQuantity,
          in_circulation: 0
        });
      }
      
      console.log('useItems - Item and sizes created successfully:', name);
      toast({
        title: 'Success',
        description: `Item "${name}" has been created.`,
      });
      
      // Return the item with the correct type
      return {
        ...newItem,
        sizeCount: sizes ? sizes.length : 1,
        quantities: {
          originalQuantity,
          availableQuantity: originalQuantity,
          inCirculation: 0,
          totalQuantity: originalQuantity
        }
      };
    } catch (err) {
      console.error('Error adding item:', err);
      toast({
        title: 'Error',
        description: 'Failed to create item. Please try again.',
        variant: 'destructive',
      });
      throw err;
    }
  };

  // Update an existing item
  const updateItemDetails = async (
    id: string, 
    name: string, 
    productId: string,
    imageFile?: File
  ): Promise<ItemWithSizeCount> => {
    try {
      // Find the current item
      const currentItem = items.find(i => i.id === id);
      if (!currentItem) {
        throw new Error('Item not found');
      }
      
      // Prepare update data
      const updateData: any = { 
        name,
        product_id: productId
      };
      
      // If a new image was provided, upload it
      if (imageFile) {
        const imageUrl = await updateItemImage(imageFile, currentItem.image_url || undefined);
        updateData.image_url = imageUrl;
      }
      
      // Update item in Supabase
      const updatedItem = await updateItem(id, updateData);
      
      // Update local state with optimistic update
      setItems(prev => 
        prev.map(i => i.id === id ? { 
          ...i, 
          ...updatedItem,
          sizeCount: i.sizeCount,
          quantities: i.quantities
        } : i)
      );
      
      toast({
        title: 'Success',
        description: `Item "${name}" has been updated.`,
      });
      
      return { 
        ...updatedItem, 
        sizeCount: currentItem.sizeCount,
        quantities: currentItem.quantities
      };
    } catch (err) {
      console.error('Error updating item:', err);
      toast({
        title: 'Error',
        description: 'Failed to update item. Please try again.',
        variant: 'destructive',
      });
      throw err;
    }
  };

  // Toggle item active status
  const toggleActive = async (id: string): Promise<void> => {
    try {
      // Find the current item
      const currentItem = items.find(i => i.id === id);
      if (!currentItem) {
        throw new Error('Item not found');
      }
      
      // Optimistic update
      setItems(prev => 
        prev.map(i => i.id === id ? { ...i, is_active: !i.is_active } : i)
      );
      
      // Update in Supabase
      await toggleItemStatus(id, !currentItem.is_active);
      
      toast({
        title: 'Success',
        description: `Item "${currentItem.name}" is now ${!currentItem.is_active ? 'active' : 'inactive'}.`,
      });
    } catch (err) {
      // Revert optimistic update on error
      setItems(prev => 
        prev.map(i => i.id === id ? { ...i, is_active: !i.is_active } : i)
      );
      
      console.error('Error toggling item status:', err);
      toast({
        title: 'Error',
        description: 'Failed to update item status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Remove an item
  const removeItem = async (id: string): Promise<void> => {
    try {
      // Find the current item
      const currentItem = items.find(i => i.id === id);
      if (!currentItem) {
        throw new Error('Item not found');
      }
      
      // Optimistic update
      setItems(prev => prev.filter(i => i.id !== id));
      
      // Delete image if it exists
      if (currentItem.image_url) {
        await deleteItemImage(currentItem.image_url);
      }
      
      // Delete from Supabase
      await deleteItem(id);
      
      toast({
        title: 'Success',
        description: `Item "${currentItem.name}" has been deleted.`,
      });
    } catch (err) {
      // Revert optimistic update on error
      loadItems();
      
      console.error('Error removing item:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete item. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Add a size to an item
  const addSize = async (
    itemId: string,
    size: string,
    originalQuantity: number
  ): Promise<ItemSize> => {
    try {
      // Create size data
      const sizeData = {
        item_id: itemId,
        size,
        original_quantity: originalQuantity,
        available_quantity: originalQuantity,
        in_circulation: 0
      };
      
      // Add size in Supabase
      const newSize = await addItemSize(sizeData);
      
      // Update item in local state
      const updatedItem = items.find(i => i.id === itemId);
      if (updatedItem) {
        updatedItem.sizeCount = (updatedItem.sizeCount || 0) + 1;
        
        // Update quantities
        if (updatedItem.quantities) {
          updatedItem.quantities.originalQuantity += originalQuantity;
          updatedItem.quantities.availableQuantity += originalQuantity;
          updatedItem.quantities.totalQuantity += originalQuantity;
        }
        
        setItems([...items]);
      }
      
      toast({
        title: 'Success',
        description: `Size "${size}" has been added.`,
      });
      
      // Force a refresh to ensure the UI is updated
      setTimeout(() => {
        loadItems();
      }, 500);
      
      return newSize;
    } catch (err) {
      console.error('Error adding size:', err);
      toast({
        title: 'Error',
        description: 'Failed to add size. Please try again.',
        variant: 'destructive',
      });
      throw err;
    }
  };

  // Update a size
  const updateSize = async (
    id: string,
    itemId: string,
    size: string,
    originalQuantity: number,
    availableQuantity: number,
    inCirculation: number
  ): Promise<ItemSize> => {
    try {
      // Get current size data
      const { data: currentSize, error } = await supabase
        .from('item_sizes')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        throw new Error(error.message);
      }
      
      // Calculate quantity differences
      const originalDiff = originalQuantity - currentSize.original_quantity;
      const availableDiff = availableQuantity - currentSize.available_quantity;
      const inCirculationDiff = inCirculation - currentSize.in_circulation;
      
      // Update size in Supabase
      const updatedSize = await updateItemSize(id, {
        size,
        original_quantity: originalQuantity,
        available_quantity: availableQuantity,
        in_circulation: inCirculation
      });
      
      // Update item quantities in local state
      const updatedItem = items.find(i => i.id === itemId);
      if (updatedItem && updatedItem.quantities) {
        updatedItem.quantities.originalQuantity += originalDiff;
        updatedItem.quantities.availableQuantity += availableDiff;
        updatedItem.quantities.inCirculation += inCirculationDiff;
        updatedItem.quantities.totalQuantity = updatedItem.quantities.availableQuantity + updatedItem.quantities.inCirculation;
        
        setItems([...items]);
      }
      
      toast({
        title: 'Success',
        description: `Size "${size}" has been updated.`,
      });
      
      return updatedSize;
    } catch (err) {
      console.error('Error updating size:', err);
      toast({
        title: 'Error',
        description: 'Failed to update size. Please try again.',
        variant: 'destructive',
      });
      throw err;
    }
  };

  // Remove a size
  const removeSize = async (id: string, itemId: string): Promise<void> => {
    try {
      // Get current size data
      const { data: currentSize, error } = await supabase
        .from('item_sizes')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        throw new Error(error.message);
      }
      
      // Delete size from Supabase
      await deleteItemSize(id);
      
      // Update item in local state
      const updatedItem = items.find(i => i.id === itemId);
      if (updatedItem) {
        updatedItem.sizeCount = Math.max(0, (updatedItem.sizeCount || 0) - 1);
        
        // Update quantities
        if (updatedItem.quantities) {
          updatedItem.quantities.originalQuantity -= currentSize.original_quantity;
          updatedItem.quantities.availableQuantity -= currentSize.available_quantity;
          updatedItem.quantities.inCirculation -= currentSize.in_circulation;
          updatedItem.quantities.totalQuantity = updatedItem.quantities.availableQuantity + updatedItem.quantities.inCirculation;
        }
        
        setItems([...items]);
      }
      
      toast({
        title: 'Success',
        description: `Size "${currentSize.size}" has been removed.`,
      });
    } catch (err) {
      console.error('Error removing size:', err);
      toast({
        title: 'Error',
        description: 'Failed to remove size. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Fetch sizes for an item
  const fetchSizes = async (itemId: string): Promise<ItemSize[]> => {
    try {
      return await fetchItemSizes(itemId);
    } catch (err) {
      console.error('Error fetching sizes:', err);
      toast({
        title: 'Error',
        description: 'Failed to fetch sizes. Please try again.',
        variant: 'destructive',
      });
      throw err;
    }
  };

  // Add a new shared item from an existing item
  const addSharedItem = async (
    existingItem: Item,
    sizes?: Array<{ size: string, quantity: number }>
  ): Promise<ItemWithSizeCount> => {
    try {
      // Check if this is already a shared item
      const isAlreadyShared = existingItem.is_shared;
      
      // Prepare item data
      const itemData: any = {
        name: existingItem.name,
        product_id: existingItem.product_id,
        brand_id: brandId,
        is_active: true,
        is_shared: true,
        original_quantity: existingItem.original_quantity,
        image_url: existingItem.image_url
      };
      
      let newItemId: string;
      
      if (isAlreadyShared) {
        // If it's already a shared item, we just need to create a relationship in shared_items
        newItemId = existingItem.id;
        
        // Create shared_item entry to link this brand with the existing item
        await supabase
          .from('shared_items')
          .insert([{
            item_id: existingItem.id,
            brand_id: brandId
          }]);
      } else {
        // If it's not already shared, update the original item to be shared
        await supabase
          .from('items')
          .update({ is_shared: true })
          .eq('id', existingItem.id);
          
        // Create shared_item entries for both the original brand and this brand
        await supabase
          .from('shared_items')
          .insert([
            {
              item_id: existingItem.id,
              brand_id: existingItem.brand_id
            },
            {
              item_id: existingItem.id,
              brand_id: brandId
            }
          ]);
          
        newItemId = existingItem.id;
      }
      
      // Get the updated item
      const { data: updatedItem, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', newItemId)
        .single();
        
      if (error) throw error;
      
      // Calculate quantities for the new item
      const quantities = await calculateItemQuantities(newItemId);
      
      // Add to local state with optimistic update
      const sizesCount = await countItemSizes(newItemId);
      const itemWithCount = { 
        ...updatedItem, 
        sizeCount: sizesCount,
        quantities
      };
      
      // Update the items state with the new item
      setItems(prev => [...prev, itemWithCount]);
      
      toast({
        title: 'Success',
        description: `Shared item "${existingItem.name}" has been added.`,
      });
      
      return itemWithCount;
    } catch (err) {
      console.error('Error adding shared item:', err);
      toast({
        title: 'Error',
        description: 'Failed to add shared item. Please try again.',
        variant: 'destructive',
      });
      throw err;
    }
  };

  // Stop sharing an item for the current brand
  const stopSharingItem = async (itemId: string): Promise<void> => {
    try {
      if (!brandId) {
        throw new Error("Brand ID is required to stop sharing.");
      }
      console.log(`useItems - stopSharingItem called for item ${itemId} in brand ${brandId}`);
      
      // Call the API function to remove the link in shared_items table
      await unlinkSharedItem(itemId, brandId);
      
      console.log(`useItems - Shared link removed for item ${itemId} in brand ${brandId}`);
      
      toast({
        title: 'Success',
        description: 'Item sharing has been stopped for this brand.',
      });

      // Refresh the items list to reflect the change
      await refreshItems(); 

    } catch (err) {
      console.error('Error stopping item sharing:', err);
      toast({
        title: 'Error',
        description: 'Failed to stop sharing the item. Please try again.',
        variant: 'destructive',
      });
      throw err; // Rethrow error for potential handling upstream
    }
  };

  // Add real-time subscription to shared item updates
  useEffect(() => {
    if (!brandId) return;

    // Listen for changes to items that are shared
    const subscription = supabase
      .channel('shared-items-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'items',
          filter: 'is_shared=eq.true'
        },
        (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
          console.log('Shared item changed:', payload);
          
          // Check if this item exists in our current items list
          const changedItemId = (payload.new as { id?: string })?.id;
          if (changedItemId) {
            const exists = items.some(item => item.id === changedItemId);
            if (exists) {
              console.log('Refreshing items due to shared item update');
              // Refresh our items to get the updated data
              refreshItems();
            }
          }
        }
      )
      .subscribe();

    // Also listen for changes to item_sizes
    const sizeSubscription = supabase
      .channel('shared-item-sizes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'item_sizes'
        },
        async (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
          console.log('Item size changed:', payload);
          
          // Get the item ID for this size using type assertion and optional chaining
          const itemSizeId = (payload.new as { id?: string })?.id || (payload.old as { id?: string })?.id;
          
          if (itemSizeId) {
            try {
              // Get the item this size belongs to
              const { data, error } = await supabase
                .from('item_sizes')
                .select('item_id')
                .eq('id', itemSizeId)
                .single();
                
              if (error && error.code !== 'PGRST116') throw error;
              
              if (data) {
                // Check if this item exists in our current items list
                const exists = items.some(item => item.id === data.item_id);
                
                if (exists) {
                  console.log('Refreshing items due to item size update');
                  // Refresh our items to get the updated data
                  refreshItems();
                }
              }
            } catch (err) {
              console.error('Error checking item size change:', err);
            }
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      sizeSubscription.unsubscribe();
    };
  }, [brandId, items, refreshItems]);

  return {
    items: sortedItems,
    loading,
    error,
    addItem,
    addSharedItem,
    updateItemDetails,
    toggleActive,
    removeItem,
    addSize,
    updateSize,
    removeSize,
    fetchSizes,
    stopSharingItem,
    refreshItems
  };
}