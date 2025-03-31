import { supabase } from '../supabase';
import { Brand } from './brands';
import { Item } from './items';
import { Promoter } from './promoters';
import { Transaction } from './transactions';

export type SearchResultType = 'brand' | 'item' | 'promoter' | 'transaction';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  name: string;
  description?: string;
  imageUrl?: string;
  additionalInfo?: Record<string, any>;
}

/**
 * Perform a global search across brands, items, promoters, and transactions
 * @param query Search query string
 * @returns Promise with search results categorized by type
 */
export async function globalSearch(query: string): Promise<{
  brands: SearchResult[];
  items: SearchResult[];
  promoters: SearchResult[];
  transactions: SearchResult[];
}> {
  console.log('Performing global search for:', query);
  
  if (!query || query.trim().length < 2) {
    console.log('Search query too short, returning empty results');
    return {
      brands: [],
      items: [],
      promoters: [],
      transactions: []
    };
  }

  const searchTerm = query.trim().toLowerCase();
  console.log('Normalized search term:', searchTerm);

  try {
    // Search brands by name
    const { data: brandsData, error: brandsError } = await supabase
      .from('brands')
      .select('*')
      .ilike('name', `%${searchTerm}%`)
      .limit(10);

    if (brandsError) {
      console.error('Error searching brands:', brandsError);
      throw new Error(brandsError.message);
    }

    // Search items by name or product_id
    const { data: itemsData, error: itemsError } = await supabase
      .from('items')
      .select(`
        *,
        brands:brand_id (name)
      `)
      .or(`name.ilike.%${searchTerm}%,product_id.ilike.%${searchTerm}%`)
      .limit(10);

    if (itemsError) {
      console.error('Error searching items:', itemsError);
      throw new Error(itemsError.message);
    }

    // Search item sizes
    const { data: sizesData, error: sizesError } = await supabase
      .from('item_sizes')
      .select(`
        *,
        items:item_id (
          id,
          name,
          product_id,
          brand_id,
          brands:brand_id (name)
        )
      `)
      .ilike('size', `%${searchTerm}%`)
      .limit(10);

    if (sizesError) {
      console.error('Error searching item sizes:', sizesError);
      throw new Error(sizesError.message);
    }

    // Search promoters by name
    const { data: promotersData, error: promotersError } = await supabase
      .from('promoters')
      .select('*')
      .ilike('name', `%${searchTerm}%`)
      .limit(10);

    if (promotersError) {
      console.error('Error searching promoters:', promotersError);
      throw new Error(promotersError.message);
    }

    // Search transactions by product_id (joining with items)
    const { data: transactionsData, error: transactionsError } = await supabase
      .from('transactions')
      .select(`
        *,
        items:item_id (name, product_id),
        promoters:promoter_id (name),
        employees:employee_id (full_name, initials)
      `)
      .in('transaction_type', ['take_out', 'return', 'burn', 'restock'])
      .order('timestamp', { ascending: false })
      .limit(10);

    if (transactionsError) {
      console.error('Error searching transactions:', transactionsError);
      throw new Error(transactionsError.message);
    }

    // Filter transactions by product_id
    const filteredTransactions = transactionsData.filter(
      transaction => transaction.items?.product_id?.toLowerCase().includes(searchTerm)
    );

    console.log('Search results:', {
      brands: brandsData.length,
      items: itemsData.length,
      sizes: sizesData.length,
      promoters: promotersData.length,
      transactions: filteredTransactions.length
    });

    // Format results
    const brandResults: SearchResult[] = brandsData.map(brand => ({
      id: brand.id,
      type: 'brand',
      name: brand.name,
      imageUrl: brand.logo_url || undefined,
      additionalInfo: {
        isActive: brand.is_active,
        isPinned: brand.is_pinned
      }
    }));

    const itemResults: SearchResult[] = [
      ...itemsData.map(item => ({
        id: item.id,
        type: 'item',
        name: item.name,
        description: `ID: ${item.product_id}`,
        imageUrl: item.image_url || undefined,
        additionalInfo: {
          productId: item.product_id,
          brandId: item.brand_id,
          brandName: item.brands?.name,
          isActive: item.is_active
        }
      })),
      ...sizesData.map(size => ({
        id: size.item_id,
        type: 'item',
        name: size.items?.name || 'Unknown Item',
        description: `Size: ${size.size}, ID: ${size.items?.product_id || 'Unknown'}`,
        additionalInfo: {
          sizeId: size.id,
          size: size.size,
          productId: size.items?.product_id,
          brandId: size.items?.brand_id,
          brandName: size.items?.brands?.name
        }
      }))
    ];

    const promoterResults: SearchResult[] = promotersData.map(promoter => ({
      id: promoter.id,
      type: 'promoter',
      name: promoter.name,
      imageUrl: promoter.photo_url || undefined,
      additionalInfo: {
        isActive: promoter.is_active
      }
    }));

    const transactionResults: SearchResult[] = filteredTransactions.map(transaction => ({
      id: transaction.id,
      type: 'transaction',
      name: `${transaction.transaction_type.toUpperCase()} - ${transaction.items?.name || 'Unknown Item'}`,
      description: `Product ID: ${transaction.items?.product_id}, Promoter: ${transaction.promoters?.name || 'N/A'}`,
      additionalInfo: {
        transactionType: transaction.transaction_type,
        timestamp: transaction.timestamp,
        quantity: transaction.quantity,
        itemId: transaction.item_id,
        itemName: transaction.items?.name,
        productId: transaction.items?.product_id,
        promoterId: transaction.promoter_id,
        promoterName: transaction.promoters?.name,
        employeeId: transaction.employee_id,
        employeeName: transaction.employees?.full_name,
        employeeInitials: transaction.employees?.initials
      }
    }));

    return {
      brands: brandResults,
      items: itemResults,
      promoters: promoterResults,
      transactions: transactionResults
    };
  } catch (error) {
    console.error('Error in globalSearch:', error);
    throw error;
  }
}

/**
 * Get search suggestions based on partial input
 * @param query Partial search query
 * @returns Promise with suggested search terms
 */
export async function getSearchSuggestions(query: string): Promise<string[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const searchTerm = query.trim().toLowerCase();
  const suggestions: Set<string> = new Set();

  try {
    // Get brand name suggestions
    const { data: brandSuggestions } = await supabase
      .from('brands')
      .select('name')
      .ilike('name', `%${searchTerm}%`)
      .limit(5);

    brandSuggestions?.forEach(brand => suggestions.add(brand.name));

    // Get item name suggestions
    const { data: itemSuggestions } = await supabase
      .from('items')
      .select('name, product_id')
      .or(`name.ilike.%${searchTerm}%,product_id.ilike.%${searchTerm}%`)
      .limit(5);

    itemSuggestions?.forEach(item => {
      suggestions.add(item.name);
      suggestions.add(item.product_id);
    });

    // Get promoter name suggestions
    const { data: promoterSuggestions } = await supabase
      .from('promoters')
      .select('name')
      .ilike('name', `%${searchTerm}%`)
      .limit(5);

    promoterSuggestions?.forEach(promoter => suggestions.add(promoter.name));

    return Array.from(suggestions);
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    return [];
  }
} 