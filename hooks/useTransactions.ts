import { useState, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import {
  Transaction,
  recordTakeOut,
  recordReturn,
  recordBurn,
  recordRestock,
  fetchItemHistory,
  fetchPromoterHistory,
  fetchAllTransactions,
  fetchItemHistoryDetailed,
  fetchPromoterHistoryDetailed,
  getItemTransactionStats,
  getPromoterTransactionStats
} from '@/lib/api/transactions';
import { useUser } from '../contexts/UserContext';

/**
 * Custom hook for managing transactions
 * @returns Object with transaction functions and state
 */
export function useTransactions() {
  const { currentUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Take out an item (give to promoter)
  const takeOutItem = async (data: {
    itemId: string;
    itemSizeId: string;
    quantity: number;
    promoterId: string;
    notes?: string;
  }) => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to perform this action.",
        variant: "destructive",
      });
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const transaction = await recordTakeOut({
        ...data,
        employeeId: currentUser.id
      });

      toast({
        title: "Success",
        description: `Item taken out successfully.`,
      });

      return transaction;
    } catch (err) {
      console.error('Error taking out item:', err);
      setError(err instanceof Error ? err : new Error('Failed to take out item'));
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to take out item. Please try again.',
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Return an item (from promoter)
  const returnItem = async (data: {
    itemId: string;
    itemSizeId: string;
    quantity: number;
    promoterId: string;
    notes?: string;
  }) => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to perform this action.",
        variant: "destructive",
      });
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const transaction = await recordReturn({
        ...data,
        employeeId: currentUser.id
      });

      toast({
        title: "Success",
        description: `Item returned successfully.`,
      });

      return transaction;
    } catch (err) {
      console.error('Error returning item:', err);
      setError(err instanceof Error ? err : new Error('Failed to return item'));
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to return item. Please try again.',
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Burn an item (mark as damaged/lost)
  const burnItem = async (data: {
    itemId: string;
    itemSizeId: string;
    quantity: number;
    promoterId: string;
    notes?: string;
  }) => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to perform this action.",
        variant: "destructive",
      });
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const transaction = await recordBurn({
        ...data,
        employeeId: currentUser.id
      });

      toast({
        title: "Success",
        description: `Item marked as damaged/lost successfully.`,
      });

      return transaction;
    } catch (err) {
      console.error('Error burning item:', err);
      setError(err instanceof Error ? err : new Error('Failed to burn item'));
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to burn item. Please try again.',
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Restock an item (add new inventory)
  const restockItem = async (data: {
    itemId: string;
    itemSizeId: string;
    quantity: number;
    notes?: string;
  }) => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to perform this action.",
        variant: "destructive",
      });
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const transaction = await recordRestock({
        ...data,
        employeeId: currentUser.id
      });

      toast({
        title: "Success",
        description: `Inventory restocked successfully.`,
      });

      return transaction;
    } catch (err) {
      console.error('Error restocking item:', err);
      setError(err instanceof Error ? err : new Error('Failed to restock item'));
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to restock item. Please try again.',
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Get item transaction history
  const getItemHistory = useCallback(async (
    itemId: string,
    page: number = 1,
    pageSize: number = 20
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const history = await fetchItemHistory(itemId, page, pageSize);
      return history;
    } catch (err) {
      console.error('Error fetching item history:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch item history'));
      toast({
        title: "Error",
        description: 'Failed to fetch item history. Please try again.',
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get promoter transaction history
  const getPromoterHistory = useCallback(async (
    promoterId: string,
    page: number = 1,
    pageSize: number = 20
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const history = await fetchPromoterHistory(promoterId, page, pageSize);
      return history;
    } catch (err) {
      console.error('Error fetching promoter history:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch promoter history'));
      toast({
        title: "Error",
        description: 'Failed to fetch promoter history. Please try again.',
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get all transactions with filtering
  const getAllTransactions = useCallback(async (
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
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await fetchAllTransactions(filters, page, pageSize);
      return result;
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch transactions'));
      toast({
        title: "Error",
        description: 'Failed to fetch transactions. Please try again.',
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get detailed item history with filtering
  const getItemHistoryDetailed = useCallback(async (
    itemId: string,
    filters: {
      transactionType?: TransactionType | TransactionType[];
      startDate?: string;
      endDate?: string;
    } = {},
    page: number = 1,
    pageSize: number = 20
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await fetchItemHistoryDetailed(itemId, filters, page, pageSize);
      return result;
    } catch (err) {
      console.error('Error fetching detailed item history:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch item history'));
      toast({
        title: "Error",
        description: 'Failed to fetch item history. Please try again.',
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get detailed promoter history with filtering
  const getPromoterHistoryDetailed = useCallback(async (
    promoterId: string,
    filters: {
      transactionType?: TransactionType | TransactionType[];
      startDate?: string;
      endDate?: string;
    } = {},
    page: number = 1,
    pageSize: number = 20
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await fetchPromoterHistoryDetailed(promoterId, filters, page, pageSize);
      return result;
    } catch (err) {
      console.error('Error fetching detailed promoter history:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch promoter history'));
      toast({
        title: "Error",
        description: 'Failed to fetch promoter history. Please try again.',
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get item transaction statistics
  const getItemStats = useCallback(async (itemId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const stats = await getItemTransactionStats(itemId);
      return stats;
    } catch (err) {
      console.error('Error fetching item stats:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch item statistics'));
      toast({
        title: "Error",
        description: 'Failed to fetch item statistics. Please try again.',
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get promoter transaction statistics
  const getPromoterStats = useCallback(async (promoterId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const stats = await getPromoterTransactionStats(promoterId);
      return stats;
    } catch (err) {
      console.error('Error fetching promoter stats:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch promoter statistics'));
      toast({
        title: "Error",
        description: 'Failed to fetch promoter statistics. Please try again.',
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    takeOutItem,
    returnItem,
    burnItem,
    restockItem,
    getItemHistory,
    getPromoterHistory,
    getAllTransactions,
    getItemHistoryDetailed,
    getPromoterHistoryDetailed,
    getItemStats,
    getPromoterStats
  };
} 