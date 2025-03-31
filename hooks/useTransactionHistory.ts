import { useState, useEffect, useCallback } from 'react';
import { fetchAllTransactions, Transaction, TransactionType } from '@/lib/api/transactions';
import { useToast } from '@/hooks/use-toast';

export interface TransactionFilters {
  transactionType?: TransactionType | TransactionType[];
  itemId?: string;
  promoterId?: string;
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
}

export interface TransactionWithDetails extends Transaction {
  items: { name: string; product_id: string; brand_id: string };
  item_sizes: { size: string };
  promoters: { name: string } | null;
  employees: { full_name: string; initials: string };
}

export interface PaginationState {
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export function useTransactionHistory() {
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [pagination, setPagination] = useState<PaginationState>({
    totalCount: 0,
    totalPages: 0,
    currentPage: 1
  });
  const { toast } = useToast();

  // Load transactions with current filters
  const loadTransactions = useCallback(async (
    page: number = pagination.currentPage,
    pageSize: number = 20
  ) => {
    try {
      setLoading(true);
      
      const result = await fetchAllTransactions(filters, page, pageSize);
      
      setTransactions(result.transactions as TransactionWithDetails[]);
      setPagination({
        totalCount: result.totalCount,
        totalPages: result.totalPages,
        currentPage: result.currentPage
      });
      setError(null);
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError(err instanceof Error ? err : new Error('Failed to load transactions'));
      toast({
        title: 'Error',
        description: 'Failed to load transactions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.currentPage, toast]);

  // Load transactions on mount and when filters change
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Update filters and reload transactions
  const updateFilters = useCallback((newFilters: Partial<TransactionFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    // Reset to first page when filters change
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFilters({});
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  // Change page
  const changePage = useCallback((page: number) => {
    if (page < 1 || (pagination.totalPages > 0 && page > pagination.totalPages)) {
      return;
    }
    
    setPagination(prev => ({ ...prev, currentPage: page }));
  }, [pagination.totalPages]);

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

  // Get transaction type color
  const getTransactionTypeColor = (type: string): string => {
    switch (type) {
      case 'take_out':
        return 'text-red-500';
      case 'return':
        return 'text-green-500';
      case 'burn':
        return 'text-orange-500';
      case 'restock':
        return 'text-blue-500';
      default:
        return '';
    }
  };

  return {
    transactions,
    loading,
    error,
    filters,
    pagination,
    updateFilters,
    resetFilters,
    changePage,
    formatTransactionDate,
    getTransactionTypeLabel,
    getTransactionTypeColor,
    refreshTransactions: loadTransactions
  };
} 