import { useState, useEffect, useCallback } from 'react';
import { fetchItemHistory, getTransactionDetails, Transaction } from '@/lib/api/transactions';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

export interface TransactionWithDetails {
  transaction: Transaction;
  item: { name: string; product_id: string };
  size: { size: string };
  promoter?: { name: string };
  employee: { full_name: string; initials: string };
}

export function useItemHistory(itemId: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionDetails, setTransactionDetails] = useState<Map<string, TransactionWithDetails>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [pagination, setPagination] = useState({
    totalCount: 0,
    totalPages: 0,
    currentPage: 1
  });
  const { toast } = useToast();

  // Load transaction history from Supabase
  const loadHistory = useCallback(async (page: number = 1, pageSize: number = 20) => {
    if (!itemId) return;
    
    try {
      setLoading(true);
      const result = await fetchItemHistory(itemId, page, pageSize);
      
      setTransactions(result.transactions);
      setPagination({
        totalCount: result.totalCount,
        totalPages: result.totalPages,
        currentPage: result.currentPage
      });
      setError(null);
    } catch (err) {
      console.error('Error loading transaction history:', err);
      setError(err instanceof Error ? err : new Error('Failed to load transaction history'));
      toast({
        title: 'Error',
        description: 'Failed to load transaction history. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [itemId, toast]);

  // Load transaction history on mount and when itemId changes
  useEffect(() => {
    if (itemId) {
      loadHistory();
    } else {
      setTransactions([]);
      setPagination({
        totalCount: 0,
        totalPages: 0,
        currentPage: 1
      });
    }
  }, [itemId, loadHistory]);

  // Load details for a specific transaction
  const loadTransactionDetails = useCallback(async (transactionId: string) => {
    try {
      // Check if we already have the details
      if (transactionDetails.has(transactionId)) {
        return transactionDetails.get(transactionId);
      }
      
      // Fetch details from Supabase
      const details = await getTransactionDetails(transactionId);
      
      // Update state
      setTransactionDetails(prev => {
        const newMap = new Map(prev);
        newMap.set(transactionId, details);
        return newMap;
      });
      
      return details;
    } catch (err) {
      console.error('Error loading transaction details:', err);
      toast({
        title: 'Error',
        description: 'Failed to load transaction details. Please try again.',
        variant: 'destructive',
      });
      throw err;
    }
  }, [transactionDetails, toast]);

  // Change page
  const changePage = async (page: number) => {
    if (page < 1 || page > pagination.totalPages) {
      return;
    }
    
    await loadHistory(page);
  };

  // Filter transactions by type
  const filterByType = async (type: 'take_out' | 'return' | 'burn' | 'restock' | null) => {
    try {
      setLoading(true);
      
      if (!type) {
        // If no filter, load all transactions
        await loadHistory();
        return;
      }
      
      // This is a client-side filter for simplicity
      // For a production app, you might want to add a server-side filter
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('item_id', itemId)
        .eq('transaction_type', type)
        .order('timestamp', { ascending: false });
        
      if (error) {
        throw new Error(error.message);
      }
      
      setTransactions(data || []);
      setPagination({
        ...pagination,
        totalCount: data?.length || 0,
        totalPages: 1,
        currentPage: 1
      });
    } catch (err) {
      console.error('Error filtering transactions:', err);
      toast({
        title: 'Error',
        description: 'Failed to filter transactions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Format transaction date for display
  const formatTransactionDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Get transaction type label
  const getTransactionTypeLabel = (type: string): string => {
    switch (type) {
      case 'take_out':
        return 'Take Out';
      case 'return':
        return 'Return';
      case 'burn':
        return 'Burn';
      case 'restock':
        return 'Restock';
      default:
        return type;
    }
  };

  return {
    transactions,
    loading,
    error,
    pagination,
    loadTransactionDetails,
    changePage,
    filterByType,
    formatTransactionDate,
    getTransactionTypeLabel,
    refreshHistory: loadHistory
  };
} 