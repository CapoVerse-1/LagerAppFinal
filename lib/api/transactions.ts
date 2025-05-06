import { supabase } from '../supabase';
import { Database } from '@/types/supabase';
import { updateItemSize, fetchItemSizes } from './items';

export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type CreateTransactionData = Database['public']['Tables']['transactions']['Insert'];
export type UpdateTransactionData = Database['public']['Tables']['transactions']['Update'];
export type TransactionType = Database['public']['Enums']['transaction_type'];

/**
 * Record a take-out transaction (item given to promoter)
 * @param data Transaction data
 * @returns Promise with the created transaction
 */
export async function recordTakeOut(data: {
  itemId: string;
  itemSizeId: string;
  quantity: number;
  promoterId: string;
  employeeId: string;
  notes?: string;
}): Promise<Transaction> {
  try {
    // Generate a unique transaction ID for tracking
    const transactionTrackingId = `takeout-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    console.log(`Take out [${transactionTrackingId}] - Starting transaction`);
    
    // Check if user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error('Authentication required');
    }

    console.log(`Take out [${transactionTrackingId}] - Starting transaction with quantity:`, data.quantity);
    console.log(`Take out [${transactionTrackingId}] - Transaction data:`, {
      itemId: data.itemId,
      itemSizeId: data.itemSizeId,
      quantity: data.quantity,
      promoterId: data.promoterId,
      employeeId: data.employeeId
    });

    // Get current quantities directly from the database for logging
    const beforeQuantities = await getCurrentQuantities(data.itemSizeId);
    console.log(`Take out [${transactionTrackingId}] - Direct DB quantities before transaction:`, beforeQuantities);

    // Get current item size data for logging
    const { data: sizeData, error: sizeError } = await supabase
      .from('item_sizes')
      .select('available_quantity, in_circulation') // Minimal select for logging
      .eq('id', data.itemSizeId)
      .single();

    if (sizeError) {
      console.error(`Take out [${transactionTrackingId}] - Error fetching item size for logging:`, sizeError);
      throw new Error(`Failed to fetch item size details: ${sizeError.message}`);
    }

    if (sizeData) {
        console.log(`Take out [${transactionTrackingId}] - Current quantities (for logging) before attempting transaction:`, {
          available: sizeData.available_quantity,
          inCirculation: sizeData.in_circulation
        });
        if (sizeData.available_quantity < data.quantity) {
            // Log a warning, but do not throw. Database will perform the atomic check.
            console.warn(`Take out [${transactionTrackingId}] - Client-side check indicates requested quantity ${data.quantity} may exceed available ${sizeData.available_quantity}. Database will perform final atomic check.`);
        }
    } else {
        console.warn(`Take out [${transactionTrackingId}] - Could not retrieve sizeData for pre-transaction logging.`);
    }

    // Intentionally removed pre-emptive throw based on client-side quantity check.
    // Database CHECK constraints will handle this atomically during the transaction's trigger.

    // Create transaction record
    const transactionData: CreateTransactionData = {
      transaction_type: 'take_out',
      item_id: data.itemId,
      item_size_id: data.itemSizeId,
      quantity: data.quantity,
      promoter_id: data.promoterId,
      employee_id: data.employeeId,
      notes: data.notes || null,
      timestamp: new Date().toISOString()
    };

    console.log(`Take out [${transactionTrackingId}] - Creating transaction with data:`, transactionData);

    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert([transactionData])
      .select()
      .single();

    if (error) {
      console.error(`Take out [${transactionTrackingId}] - Error recording take-out transaction:`, error);
      throw new Error(error.message);
    }

    console.log(`Take out [${transactionTrackingId}] - Transaction created:`, transaction);

    // Get updated quantities directly from the database for logging
    const afterQuantities = await getCurrentQuantities(data.itemSizeId);
    console.log(`Take out [${transactionTrackingId}] - Direct DB quantities after transaction:`, afterQuantities);
    console.log(`Take out [${transactionTrackingId}] - Quantity changes:`, {
      available: afterQuantities.available - beforeQuantities.available,
      inCirculation: afterQuantities.inCirculation - beforeQuantities.inCirculation
    });

    // Get updated item size data to verify changes
    const { data: updatedSizeData } = await supabase
      .from('item_sizes')
      .select('*')
      .eq('id', data.itemSizeId)
      .single();

    console.log(`Take out [${transactionTrackingId}] - After transaction:`, {
      available: updatedSizeData?.available_quantity,
      inCirculation: updatedSizeData?.in_circulation
    });

    return transaction;
  } catch (error) {
    console.error('Error in recordTakeOut:', error);
    throw error;
  }
}

/**
 * Record a return transaction (item returned by promoter)
 * @param data Transaction data
 * @returns Promise with the created transaction
 */
export async function recordReturn(data: {
  itemId: string;
  itemSizeId: string;
  quantity: number;
  promoterId: string;
  employeeId: string;
  notes?: string;
}): Promise<Transaction> {
  try {
    // Generate a unique transaction ID for tracking
    const transactionTrackingId = `return-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    console.log(`Return [${transactionTrackingId}] - Starting transaction`);
    
    // Check if user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error('Authentication required');
    }

    console.log(`Return [${transactionTrackingId}] - Starting transaction with quantity:`, data.quantity);
    console.log(`Return [${transactionTrackingId}] - Transaction data:`, {
      itemId: data.itemId,
      itemSizeId: data.itemSizeId,
      quantity: data.quantity,
      promoterId: data.promoterId,
      employeeId: data.employeeId
    });

    // Get current quantities directly from the database for logging
    const beforeQuantities = await getCurrentQuantities(data.itemSizeId);
    console.log(`Return [${transactionTrackingId}] - Direct DB quantities before transaction:`, beforeQuantities);

    // Get current item size data for logging
    const { data: sizeData, error: sizeError } = await supabase
      .from('item_sizes')
      .select('available_quantity, in_circulation') // Minimal select for logging
      .eq('id', data.itemSizeId)
      .single();

    if (sizeError) {
      console.error(`Return [${transactionTrackingId}] - Error fetching item size for logging:`, sizeError);
      throw new Error(`Failed to fetch item size details: ${sizeError.message}`);
    }

    if (sizeData) {
        console.log(`Return [${transactionTrackingId}] - Current quantities (for logging) before attempting transaction:`, {
          available: sizeData.available_quantity,
          inCirculation: sizeData.in_circulation
        });
        if (sizeData.in_circulation < data.quantity) {
            // Log a warning, but do not throw. Database will perform the atomic check.
            console.warn(`Return [${transactionTrackingId}] - Client-side check indicates requested quantity ${data.quantity} may exceed in_circulation ${sizeData.in_circulation}. Database will perform final atomic check.`);
        }
    } else {
        console.warn(`Return [${transactionTrackingId}] - Could not retrieve sizeData for pre-transaction logging.`);
    }
    
    // Intentionally removed pre-emptive throw based on client-side quantity check.

    // Create transaction record
    const transactionData: CreateTransactionData = {
      transaction_type: 'return',
      item_id: data.itemId,
      item_size_id: data.itemSizeId,
      quantity: data.quantity,
      promoter_id: data.promoterId,
      employee_id: data.employeeId,
      notes: data.notes || null,
      timestamp: new Date().toISOString()
    };

    console.log(`Return [${transactionTrackingId}] - Creating transaction with data:`, transactionData);

    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert([transactionData])
      .select()
      .single();

    if (error) {
      console.error(`Return [${transactionTrackingId}] - Error recording return transaction:`, error);
      throw new Error(error.message);
    }

    console.log(`Return [${transactionTrackingId}] - Transaction created:`, transaction);

    // Get updated quantities directly from the database for logging
    const afterQuantities = await getCurrentQuantities(data.itemSizeId);
    console.log(`Return [${transactionTrackingId}] - Direct DB quantities after transaction:`, afterQuantities);
    console.log(`Return [${transactionTrackingId}] - Quantity changes:`, {
      available: afterQuantities.available - beforeQuantities.available,
      inCirculation: afterQuantities.inCirculation - beforeQuantities.inCirculation
    });

    // Get updated item size data to verify changes
    const { data: updatedSizeData } = await supabase
      .from('item_sizes')
      .select('*')
      .eq('id', data.itemSizeId)
      .single();

    console.log(`Return [${transactionTrackingId}] - After transaction:`, {
      available: updatedSizeData?.available_quantity,
      inCirculation: updatedSizeData?.in_circulation
    });

    return transaction;
  } catch (error) {
    console.error('Error in recordReturn:', error);
    throw error;
  }
}

/**
 * Record a burn transaction (item damaged or lost)
 * @param data Transaction data
 * @returns Promise with the created transaction
 */
export async function recordBurn(data: {
  itemId: string;
  itemSizeId: string;
  quantity: number;
  promoterId: string; // Added promoterId for consistency, can be null if burning from main stock
  employeeId: string;
  notes?: string;
}): Promise<Transaction> {
  try {
    // Generate a unique transaction ID for tracking
    const transactionTrackingId = `burn-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    console.log(`Burn [${transactionTrackingId}] - Starting transaction`);
    
    // Check if user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error('Authentication required');
    }

    console.log(`Burn [${transactionTrackingId}] - Starting transaction with quantity:`, data.quantity);
    console.log(`Burn [${transactionTrackingId}] - Transaction data:`, {
      itemId: data.itemId,
      itemSizeId: data.itemSizeId,
      quantity: data.quantity,
      promoterId: data.promoterId,
      employeeId: data.employeeId
    });
    
    // Get current quantities directly from the database for logging
    const beforeQuantities = await getCurrentQuantities(data.itemSizeId);
    console.log(`Burn [${transactionTrackingId}] - Direct DB quantities before transaction:`, beforeQuantities);

    // Get current item size data for logging
    const { data: sizeData, error: sizeError } = await supabase
      .from('item_sizes')
      .select('in_circulation') // Only need in_circulation for burn logging
      .eq('id', data.itemSizeId)
      .single();

    if (sizeError) {
      console.error(`Burn [${transactionTrackingId}] - Error fetching item size for logging:`, sizeError);
      throw new Error(`Failed to fetch item size details: ${sizeError.message}`);
    }

    if (sizeData) {
        console.log(`Burn [${transactionTrackingId}] - Current in_circulation (for logging) before attempting transaction: ${sizeData.in_circulation}`);
        if (sizeData.in_circulation < data.quantity) {
            // Log a warning, but do not throw. Database will perform the atomic check.
            console.warn(`Burn [${transactionTrackingId}] - Client-side check indicates requested quantity ${data.quantity} may exceed in_circulation ${sizeData.in_circulation}. Database will perform final atomic check.`);
        }
    } else {
        console.warn(`Burn [${transactionTrackingId}] - Could not retrieve sizeData for pre-transaction logging.`);
    }

    // Intentionally removed pre-emptive throw based on client-side quantity check.

    // Create transaction record
    const transactionData: CreateTransactionData = {
      transaction_type: 'burn',
      item_id: data.itemId,
      item_size_id: data.itemSizeId,
      quantity: data.quantity,
      promoter_id: data.promoterId,
      employee_id: data.employeeId,
      notes: data.notes || null,
      timestamp: new Date().toISOString()
    };

    console.log(`Burn [${transactionTrackingId}] - Creating transaction with data:`, transactionData);

    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert([transactionData])
      .select()
      .single();

    if (error) {
      console.error(`Burn [${transactionTrackingId}] - Error recording burn transaction:`, error);
      throw new Error(error.message);
    }

    console.log(`Burn [${transactionTrackingId}] - Transaction created:`, transaction);

    // Get updated quantities directly from the database for logging
    const afterQuantities = await getCurrentQuantities(data.itemSizeId);
    console.log(`Burn [${transactionTrackingId}] - Direct DB quantities after transaction:`, afterQuantities);
    console.log(`Burn [${transactionTrackingId}] - Quantity changes:`, {
      available: afterQuantities.available - beforeQuantities.available,
      inCirculation: afterQuantities.inCirculation - beforeQuantities.inCirculation
    });

    // Get updated item size data to verify changes
    const { data: updatedSizeData } = await supabase
      .from('item_sizes')
      .select('*')
      .eq('id', data.itemSizeId)
      .single();

    console.log(`Burn [${transactionTrackingId}] - After transaction:`, {
      available: updatedSizeData?.available_quantity,
      inCirculation: updatedSizeData?.in_circulation
    });

    return transaction;
  } catch (error) {
    console.error('Error in recordBurn:', error);
    throw error;
  }
}

/**
 * Record a restock transaction (new items added to inventory)
 * @param data Transaction data
 * @returns Promise with the created transaction
 */
export async function recordRestock(data: {
  itemId: string;
  itemSizeId: string;
  quantity: number;
  employeeId: string;
  notes?: string;
}): Promise<Transaction> {
  try {
    // Generate a unique transaction ID for tracking
    const transactionTrackingId = `restock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    console.log(`Restock [${transactionTrackingId}] - Starting transaction`);
    
    // Check if user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error('Authentication required');
    }

    console.log(`Restock [${transactionTrackingId}] - Starting transaction with quantity:`, data.quantity);
    console.log(`Restock [${transactionTrackingId}] - Transaction data:`, {
      itemId: data.itemId,
      itemSizeId: data.itemSizeId,
      quantity: data.quantity,
      employeeId: data.employeeId
    });

    // Get current quantities directly from the database
    const beforeQuantities = await getCurrentQuantities(data.itemSizeId);
    console.log(`Restock [${transactionTrackingId}] - Direct DB quantities before transaction:`, beforeQuantities);

    // Get current item size data
    const { data: sizeData, error: sizeError } = await supabase
      .from('item_sizes')
      .select('*')
      .eq('id', data.itemSizeId)
      .single();

    if (sizeError) {
      console.error(`Restock [${transactionTrackingId}] - Error fetching item size:`, sizeError);
      throw new Error(sizeError.message);
    }

    console.log(`Restock [${transactionTrackingId}] - Before transaction:`, {
      original: sizeData.original_quantity,
      available: sizeData.available_quantity
    });

    // Create transaction record
    const transactionData: CreateTransactionData = {
      transaction_type: 'restock',
      item_id: data.itemId,
      item_size_id: data.itemSizeId,
      quantity: data.quantity,
      employee_id: data.employeeId,
      notes: data.notes || null,
      timestamp: new Date().toISOString()
    };

    console.log(`Restock [${transactionTrackingId}] - Creating transaction with data:`, transactionData);

    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert([transactionData])
      .select()
      .single();

    if (error) {
      console.error(`Restock [${transactionTrackingId}] - Error recording restock transaction:`, error);
      throw new Error(error.message);
    }

    console.log(`Restock [${transactionTrackingId}] - Transaction created:`, transaction);

    // Wait a moment for the trigger to execute
    await new Promise(resolve => setTimeout(resolve, 500));

    // Get updated quantities directly from the database
    const afterQuantities = await getCurrentQuantities(data.itemSizeId);
    console.log(`Restock [${transactionTrackingId}] - Direct DB quantities after transaction:`, afterQuantities);
    console.log(`Restock [${transactionTrackingId}] - Quantity changes:`, {
      available: afterQuantities.available - beforeQuantities.available,
      original: afterQuantities.original - beforeQuantities.original
    });

    // Get updated item size data to verify changes
    const { data: updatedSizeData } = await supabase
      .from('item_sizes')
      .select('*')
      .eq('id', data.itemSizeId)
      .single();

    console.log(`Restock [${transactionTrackingId}] - After transaction:`, {
      original: updatedSizeData?.original_quantity,
      available: updatedSizeData?.available_quantity
    });

    return transaction;
  } catch (error) {
    console.error('Error in recordRestock:', error);
    throw error;
  }
}

/**
 * Fetch transaction history for an item
 * @param itemId Item ID
 * @param page Page number (1-indexed)
 * @param pageSize Number of transactions per page
 * @returns Promise with transactions and pagination info
 */
export async function fetchItemHistory(
  itemId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<{
  transactions: Transaction[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}> {
  try {
    // Calculate pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Get total count
    const { count, error: countError } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('item_id', itemId);

    if (countError) {
      console.error('Error counting transactions:', countError);
      throw new Error(countError.message);
    }

    // Fetch transactions with pagination
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('item_id', itemId)
      .order('timestamp', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching item history:', error);
      throw new Error(error.message);
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      transactions: data || [],
      totalCount,
      totalPages,
      currentPage: page
    };
  } catch (error) {
    console.error('Error in fetchItemHistory:', error);
    throw error;
  }
}

/**
 * Fetch transaction history for a promoter
 * @param promoterId Promoter ID
 * @param page Page number (1-indexed)
 * @param pageSize Number of transactions per page
 * @returns Promise with transactions and pagination info
 */
export async function fetchPromoterHistory(
  promoterId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<{
  transactions: Transaction[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}> {
  try {
    // Calculate pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Get total count
    const { count, error: countError } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('promoter_id', promoterId);

    if (countError) {
      console.error('Error counting transactions:', countError);
      throw new Error(countError.message);
    }

    // Fetch transactions with pagination
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('promoter_id', promoterId)
      .order('timestamp', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching promoter history:', error);
      throw new Error(error.message);
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      transactions: data || [],
      totalCount,
      totalPages,
      currentPage: page
    };
  } catch (error) {
    console.error('Error in fetchPromoterHistory:', error);
    throw error;
  }
}

/**
 * Fetch current inventory for a promoter
 * @param promoterId Promoter ID
 * @returns Promise with current inventory items
 */
export async function fetchPromoterInventory(promoterId: string): Promise<{
  itemId: string;
  itemSizeId: string;
  quantity: number;
}[]> {
  try {
    // This is a more complex query that requires aggregating transaction data
    // We need to calculate the net quantity for each item size with this promoter
    
    // First, get all take-out transactions for this promoter
    const { data: takeOutData, error: takeOutError } = await supabase
      .from('transactions')
      .select('item_id, item_size_id, quantity')
      .eq('promoter_id', promoterId)
      .eq('transaction_type', 'take_out');

    if (takeOutError) {
      console.error('Error fetching take-out transactions:', takeOutError);
      throw new Error(takeOutError.message);
    }

    // Then, get all return and burn transactions for this promoter
    const { data: returnData, error: returnError } = await supabase
      .from('transactions')
      .select('item_id, item_size_id, quantity')
      .eq('promoter_id', promoterId)
      .in('transaction_type', ['return', 'burn']);

    if (returnError) {
      console.error('Error fetching return/burn transactions:', returnError);
      throw new Error(returnError.message);
    }

    // Calculate net inventory
    const inventory = new Map<string, { itemId: string; itemSizeId: string; quantity: number }>();
    
    // Add take-out quantities
    (takeOutData || []).forEach(transaction => {
      const key = `${transaction.item_id}-${transaction.item_size_id}`;
      const current = inventory.get(key) || { 
        itemId: transaction.item_id, 
        itemSizeId: transaction.item_size_id, 
        quantity: 0 
      };
      current.quantity += transaction.quantity;
      inventory.set(key, current);
    });
    
    // Subtract return and burn quantities
    (returnData || []).forEach(transaction => {
      const key = `${transaction.item_id}-${transaction.item_size_id}`;
      const current = inventory.get(key);
      if (current) {
        current.quantity -= transaction.quantity;
        if (current.quantity <= 0) {
          inventory.delete(key);
        } else {
          inventory.set(key, current);
        }
      }
    });
    
    // Convert map to array and return only items with positive quantities
    return Array.from(inventory.values()).filter(item => item.quantity > 0);
  } catch (error) {
    console.error('Error in fetchPromoterInventory:', error);
    throw error;
  }
}

/**
 * Get transaction details with related data
 * @param transactionId Transaction ID
 * @returns Promise with transaction and related data
 */
export async function getTransactionDetails(transactionId: string): Promise<{
  transaction: Transaction;
  item: { name: string; product_id: string };
  size: { size: string };
  promoter?: { name: string };
  employee: { full_name: string; initials: string };
}> {
  try {
    // Get transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (transactionError) {
      console.error('Error fetching transaction:', transactionError);
      throw new Error(transactionError.message);
    }

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Get item details
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('name, product_id')
      .eq('id', transaction.item_id)
      .single();

    if (itemError) {
      console.error('Error fetching item:', itemError);
      throw new Error(itemError.message);
    }

    // Get size details
    const { data: size, error: sizeError } = await supabase
      .from('item_sizes')
      .select('size')
      .eq('id', transaction.item_size_id)
      .single();

    if (sizeError) {
      console.error('Error fetching size:', sizeError);
      throw new Error(sizeError.message);
    }

    // Get employee details
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('full_name, initials')
      .eq('id', transaction.employee_id)
      .single();

    if (employeeError) {
      console.error('Error fetching employee:', employeeError);
      throw new Error(employeeError.message);
    }

    // Get promoter details if applicable
    let promoter = undefined;
    if (transaction.promoter_id) {
      const { data: promoterData, error: promoterError } = await supabase
        .from('promoters')
        .select('name')
        .eq('id', transaction.promoter_id)
        .single();

      if (promoterError) {
        console.error('Error fetching promoter:', promoterError);
        throw new Error(promoterError.message);
      }

      promoter = promoterData;
    }

    return {
      transaction,
      item,
      size,
      promoter,
      employee
    };
  } catch (error) {
    console.error('Error in getTransactionDetails:', error);
    throw error;
  }
}

/**
 * Fetch transaction history for a specific item
 */
export async function getItemTransactions(itemId: string): Promise<Transaction[]> {
  try {
    // Check if user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error('Authentication required');
    }

    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        promoter:promoters(name),
        employee:employees(initials),
        item_size:item_sizes(size)
      `)
      .eq('item_id', itemId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching item transactions:', error);
      throw error;
    }

    // Transform the data to match the expected format
    return data.map(transaction => ({
      ...transaction,
      target_name: transaction.promoter?.name || '-',
      employee_name: transaction.employee?.initials || '-',
      size: transaction.item_size?.size || '-',
      created_at: new Date(transaction.created_at).toISOString(),
    }));
  } catch (error) {
    console.error('Error in getItemTransactions:', error);
    throw error;
  }
}

/**
 * Test function to check if the database trigger is working
 */
export async function testDatabaseTrigger(itemSizeId: string): Promise<void> {
  try {
    // Get current item size data
    const { data: sizeDataBefore, error: sizeErrorBefore } = await supabase
      .from('item_sizes')
      .select('*')
      .eq('id', itemSizeId)
      .single();

    if (sizeErrorBefore) {
      console.error('Error fetching item size:', sizeErrorBefore);
      throw new Error(sizeErrorBefore.message);
    }

    console.log('Test - Before transaction:', {
      available: sizeDataBefore.available_quantity,
      inCirculation: sizeDataBefore.in_circulation
    });

    // Create a test transaction
    const testTransaction = {
      transaction_type: 'take_out' as const,
      item_id: sizeDataBefore.item_id,
      item_size_id: itemSizeId,
      quantity: 1,
      promoter_id: '00000000-0000-0000-0000-000000000000', // Dummy ID
      employee_id: '00000000-0000-0000-0000-000000000000', // Dummy ID
      notes: 'Test transaction',
      timestamp: new Date().toISOString()
    };

    console.log('Test - Creating transaction with data:', testTransaction);

    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert([testTransaction])
      .select()
      .single();

    if (error) {
      console.error('Error creating test transaction:', error);
      throw new Error(error.message);
    }

    console.log('Test - Transaction created:', transaction);

    // Wait a moment for the trigger to execute
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get updated item size data
    const { data: sizeDataAfter, error: sizeErrorAfter } = await supabase
      .from('item_sizes')
      .select('*')
      .eq('id', itemSizeId)
      .single();

    if (sizeErrorAfter) {
      console.error('Error fetching updated item size:', sizeErrorAfter);
      throw new Error(sizeErrorAfter.message);
    }

    console.log('Test - After transaction:', {
      available: sizeDataAfter.available_quantity,
      inCirculation: sizeDataAfter.in_circulation
    });

    // Check if the trigger worked
    const availableChanged = sizeDataBefore.available_quantity !== sizeDataAfter.available_quantity;
    const inCirculationChanged = sizeDataBefore.in_circulation !== sizeDataAfter.in_circulation;

    console.log('Test - Trigger worked?', {
      availableChanged,
      inCirculationChanged
    });

    // Clean up the test transaction
    const { error: deleteError } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transaction.id);

    if (deleteError) {
      console.error('Error deleting test transaction:', deleteError);
    }

    // Restore the original values
    const { error: updateError } = await supabase
      .from('item_sizes')
      .update({
        available_quantity: sizeDataBefore.available_quantity,
        in_circulation: sizeDataBefore.in_circulation
      })
      .eq('id', itemSizeId);

    if (updateError) {
      console.error('Error restoring original values:', updateError);
    }

    console.log('Test - Original values restored');
  } catch (error) {
    console.error('Error in testDatabaseTrigger:', error);
    throw error;
  }
}

/**
 * Get current quantities for an item size (for debugging)
 * @param itemSizeId Item size ID
 * @returns Promise with the current quantities
 */
export async function getCurrentQuantities(itemSizeId: string): Promise<{
  available: number;
  inCirculation: number;
  original: number;
}> {
  try {
    const { data, error } = await supabase
      .from('item_sizes')
      .select('available_quantity, in_circulation, original_quantity')
      .eq('id', itemSizeId)
      .single();

    if (error) {
      console.error('Error fetching current quantities:', error);
      throw new Error(error.message);
    }

    return {
      available: data.available_quantity,
      inCirculation: data.in_circulation,
      original: data.original_quantity
    };
  } catch (error) {
    console.error('Error in getCurrentQuantities:', error);
    throw error;
  }
}

/**
 * Fetch all transactions with filtering options
 * @param filters Filter options for transactions
 * @param page Page number for pagination
 * @param pageSize Number of items per page
 * @returns Promise with transactions and pagination info
 */
export async function fetchAllTransactions(
  filters: {
    transactionType?: TransactionType | TransactionType[];
    itemId?: string;
    promoterId?: string;
    employeeId?: string;
    startDate?: string;
    endDate?: string;
    searchTerm?: string;
  } = {},
  page: number = 1,
  pageSize: number = 20
): Promise<{
  transactions: Transaction[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}> {
  try {
    // Check if user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error('Authentication required');
    }

    // Start building the query
    let query = supabase
      .from('transactions')
      .select('*, items!inner(name, product_id, brand_id), item_sizes!inner(size), promoters(name), employees!inner(full_name, initials)', { count: 'exact' });

    // Apply filters
    if (filters.transactionType) {
      if (Array.isArray(filters.transactionType)) {
        query = query.in('transaction_type', filters.transactionType);
      } else {
        query = query.eq('transaction_type', filters.transactionType);
      }
    }

    if (filters.itemId) {
      query = query.eq('item_id', filters.itemId);
    }

    if (filters.promoterId) {
      query = query.eq('promoter_id', filters.promoterId);
    }

    if (filters.employeeId) {
      query = query.eq('employee_id', filters.employeeId);
    }

    if (filters.startDate) {
      query = query.gte('timestamp', filters.startDate);
    }

    if (filters.endDate) {
      // Add one day to include the end date fully
      const endDate = new Date(filters.endDate);
      endDate.setDate(endDate.getDate() + 1);
      query = query.lt('timestamp', endDate.toISOString());
    }

    if (filters.searchTerm) {
      // Search in related tables
      query = query.or(`items.name.ilike.%${filters.searchTerm}%,items.product_id.ilike.%${filters.searchTerm}%,promoters.name.ilike.%${filters.searchTerm}%`);
    }

    // Add pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Execute the query with pagination and ordering
    const { data, error, count } = await query
      .order('timestamp', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching transactions:', error);
      throw new Error(error.message);
    }

    // Calculate pagination info
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      transactions: data || [],
      totalCount,
      totalPages,
      currentPage: page
    };
  } catch (error) {
    console.error('Error in fetchAllTransactions:', error);
    throw error;
  }
}

/**
 * Enhanced function to fetch item history with detailed information
 * @param itemId Item ID
 * @param filters Filter options
 * @param page Page number
 * @param pageSize Items per page
 * @returns Promise with transactions and pagination info
 */
export async function fetchItemHistoryDetailed(
  itemId: string,
  filters: {
    transactionType?: TransactionType | TransactionType[];
    startDate?: string;
    endDate?: string;
  } = {},
  page: number = 1,
  pageSize: number = 20
): Promise<{
  transactions: (Transaction & {
    items: { name: string; product_id: string; brand_id: string };
    item_sizes: { size: string };
    promoters: { name: string } | null;
    employees: { full_name: string; initials: string };
  })[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}> {
  return fetchAllTransactions(
    {
      ...filters,
      itemId
    },
    page,
    pageSize
  ) as Promise<any>;
}

/**
 * Enhanced function to fetch promoter history with detailed information
 * @param promoterId Promoter ID
 * @param filters Filter options
 * @param page Page number
 * @param pageSize Items per page
 * @returns Promise with transactions and pagination info
 */
export async function fetchPromoterHistoryDetailed(
  promoterId: string,
  filters: {
    transactionType?: TransactionType | TransactionType[];
    startDate?: string;
    endDate?: string;
  } = {},
  page: number = 1,
  pageSize: number = 20
): Promise<{
  transactions: (Transaction & {
    items: { name: string; product_id: string; brand_id: string };
    item_sizes: { size: string };
    promoters: { name: string } | null;
    employees: { full_name: string; initials: string };
  })[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}> {
  return fetchAllTransactions(
    {
      ...filters,
      promoterId
    },
    page,
    pageSize
  ) as Promise<any>;
}

/**
 * Get transaction statistics for an item
 * @param itemId Item ID
 * @returns Promise with transaction statistics
 */
export async function getItemTransactionStats(itemId: string): Promise<{
  totalTakeOuts: number;
  totalReturns: number;
  totalBurns: number;
  totalRestocks: number;
  mostFrequentPromoter: { id: string; name: string; count: number } | null;
}> {
  try {
    // Check if user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error('Authentication required');
    }

    // Get counts by transaction type
    const { data: typeCounts, error: typeError } = await supabase
      .from('transactions')
      .select('transaction_type, count')
      .eq('item_id', itemId)
      .group('transaction_type');

    if (typeError) throw new Error(typeError.message);

    // Get most frequent promoter
    const { data: promoterData, error: promoterError } = await supabase
      .from('transactions')
      .select('promoter_id, promoters(name), count')
      .eq('item_id', itemId)
      .not('promoter_id', 'is', null)
      .group('promoter_id, promoters(name)')
      .order('count', { ascending: false })
      .limit(1);

    if (promoterError) throw new Error(promoterError.message);

    // Process the results
    const counts = {
      totalTakeOuts: 0,
      totalReturns: 0,
      totalBurns: 0,
      totalRestocks: 0
    };

    typeCounts?.forEach(item => {
      switch (item.transaction_type) {
        case 'take_out':
          counts.totalTakeOuts = parseInt(item.count);
          break;
        case 'return':
          counts.totalReturns = parseInt(item.count);
          break;
        case 'burn':
          counts.totalBurns = parseInt(item.count);
          break;
        case 'restock':
          counts.totalRestocks = parseInt(item.count);
          break;
      }
    });

    let mostFrequentPromoter = null;
    if (promoterData && promoterData.length > 0) {
      mostFrequentPromoter = {
        id: promoterData[0].promoter_id,
        name: promoterData[0].promoters?.name || 'Unknown',
        count: parseInt(promoterData[0].count)
      };
    }

    return {
      ...counts,
      mostFrequentPromoter
    };
  } catch (error) {
    console.error('Error in getItemTransactionStats:', error);
    throw error;
  }
}

/**
 * Get transaction statistics for a promoter
 * @param promoterId Promoter ID
 * @returns Promise with transaction statistics
 */
export async function getPromoterTransactionStats(promoterId: string): Promise<{
  totalTakeOuts: number;
  totalReturns: number;
  totalBurns: number;
  mostFrequentItem: { id: string; name: string; count: number } | null;
  currentInventoryCount: number;
}> {
  try {
    // Check if user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error('Authentication required');
    }

    // Get counts by transaction type
    const { data: typeCounts, error: typeError } = await supabase
      .from('transactions')
      .select('transaction_type, count')
      .eq('promoter_id', promoterId)
      .group('transaction_type');

    if (typeError) throw new Error(typeError.message);

    // Get most frequent item
    const { data: itemData, error: itemError } = await supabase
      .from('transactions')
      .select('item_id, items(name), count')
      .eq('promoter_id', promoterId)
      .group('item_id, items(name)')
      .order('count', { ascending: false })
      .limit(1);

    if (itemError) throw new Error(itemError.message);

    // Get current inventory count
    const { data: inventory } = await fetchPromoterInventory(promoterId);
    const currentInventoryCount = inventory.reduce((sum, item) => sum + item.quantity, 0);

    // Process the results
    const counts = {
      totalTakeOuts: 0,
      totalReturns: 0,
      totalBurns: 0
    };

    typeCounts?.forEach(item => {
      switch (item.transaction_type) {
        case 'take_out':
          counts.totalTakeOuts = parseInt(item.count);
          break;
        case 'return':
          counts.totalReturns = parseInt(item.count);
          break;
        case 'burn':
          counts.totalBurns = parseInt(item.count);
          break;
      }
    });

    let mostFrequentItem = null;
    if (itemData && itemData.length > 0) {
      mostFrequentItem = {
        id: itemData[0].item_id,
        name: itemData[0].items?.name || 'Unknown',
        count: parseInt(itemData[0].count)
      };
    }

    return {
      ...counts,
      mostFrequentItem,
      currentInventoryCount
    };
  } catch (error) {
    console.error('Error in getPromoterTransactionStats:', error);
    throw error;
  }
} 