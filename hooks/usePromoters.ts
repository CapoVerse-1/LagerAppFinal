import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { useUser } from '../contexts/UserContext';
import {
  Promoter,
  fetchPromoters,
  createPromoter,
  updatePromoter,
  togglePromoterStatus,
  deletePromoter,
  getPromoterInventory,
  countPromoterTransactions
} from '@/lib/api/promoters';
import { uploadPromoterPhoto, updatePromoterPhoto, deletePromoterPhoto } from '@/lib/api/storage';

// Extended type with transaction count and inventory
export type PromoterWithDetails = Promoter & {
  transactionCount: number;
  inventory?: any[];
};

/**
 * Custom hook for managing promoters
 * @returns Object with promoters data and functions
 */
export function usePromoters() {
  const [promoters, setPromoters] = useState<PromoterWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [activeFilter, setActiveFilter] = useState<boolean | null>(null); // Default to showing all promoters
  const { currentUser } = useUser();

  // Load promoters with transaction counts
  const loadPromoters = useCallback(async () => {
    try {
      console.log('Loading promoters...');
      setLoading(true);
      setError(null);
      
      const promotersData = await fetchPromoters();
      console.log('Raw promoters data:', promotersData);
      
      // Get transaction counts for each promoter
      const promotersWithDetails = await Promise.all(
        promotersData.map(async (promoter) => {
          const count = await countPromoterTransactions(promoter.id);
          return { ...promoter, transactionCount: count };
        })
      );
      
      console.log('Promoters with details:', promotersWithDetails);
      setPromoters(promotersWithDetails);
    } catch (err) {
      console.error('Error loading promoters:', err);
      setError(err instanceof Error ? err : new Error('Failed to load promoters'));
      toast({
        title: 'Error',
        description: 'Failed to load promoters. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      console.log('Finished loading promoters');
    }
  }, []);

  // Load promoters on mount
  useEffect(() => {
    loadPromoters();
  }, [loadPromoters]);

  // Add a new promoter
  const addPromoter = async (
    name: string, 
    photoFile: File | null, 
    address: string | null = null, 
    clothingSize: string | null = null, 
    phoneNumber: string | null = null, 
    notes: string | null = null
  ) => {
    try {
      // Check if an employee is selected
      if (!currentUser) {
        throw new Error('Please select an employee before creating a promoter');
      }

      // Create promoter data
      const promoterData: any = {
        name,
        is_active: true,
        address,
        clothing_size: clothingSize,
        phone_number: phoneNumber,
        notes,
        created_by: currentUser.id // Use employee ID from UserContext
      };

      // Upload photo if provided
      if (photoFile) {
        const photoUrl = await uploadPromoterPhoto(photoFile);
        promoterData.photo_url = photoUrl;
      }

      // Create promoter in Supabase
      const newPromoter = await createPromoter(promoterData);

      // Refresh the promoters list to get the latest data
      await loadPromoters();

      toast({
        title: 'Success',
        description: `Promoter ${name} has been created.`,
      });

      return newPromoter;
    } catch (err) {
      console.error('Error adding promoter:', err);
      setError(err instanceof Error ? err : new Error('Failed to add promoter'));
      toast({
        title: 'Error',
        description: 'Failed to create promoter. Please try again.',
        variant: 'destructive',
      });
      throw err;
    }
  };

  // Update an existing promoter
  const updatePromoterDetails = async (
    id: string, 
    name: string, 
    photoFile?: File, 
    address: string | null = null, 
    clothingSize: string | null = null, 
    phoneNumber: string | null = null, 
    notes: string | null = null
  ) => {
    try {
      // Find the current promoter
      const currentPromoter = promoters.find(p => p.id === id);
      if (!currentPromoter) {
        throw new Error('Promoter not found');
      }

      // Prepare update data
      const updateData: any = { 
        name,
        address,
        clothing_size: clothingSize,
        phone_number: phoneNumber,
        notes
      };

      // Update photo if provided
      if (photoFile) {
        const photoUrl = await updatePromoterPhoto(photoFile, currentPromoter.photo_url || undefined);
        updateData.photo_url = photoUrl;
      }

      // Update promoter in Supabase
      const updatedPromoter = await updatePromoter(id, updateData);

      // Refresh the promoters list to get the latest data
      await loadPromoters();

      toast({
        title: 'Success',
        description: `Promoter ${name} has been updated.`,
      });

      return updatedPromoter;
    } catch (err) {
      console.error('Error updating promoter:', err);
      setError(err instanceof Error ? err : new Error('Failed to update promoter'));
      toast({
        title: 'Error',
        description: 'Failed to update promoter. Please try again.',
        variant: 'destructive',
      });
      throw err;
    }
  };

  // Toggle promoter active status
  const toggleActive = async (id: string) => {
    try {
      // Find the current promoter
      const currentPromoter = promoters.find(p => p.id === id);
      if (!currentPromoter) {
        throw new Error('Promoter not found');
      }

      // Toggle status in Supabase
      const newStatus = !currentPromoter.is_active;
      const updatedPromoter = await togglePromoterStatus(id, newStatus);

      // Refresh the promoters list to get the latest data
      await loadPromoters();

      toast({
        title: 'Success',
        description: `Promoter ${currentPromoter.name} is now ${newStatus ? 'active' : 'inactive'}.`,
      });

      return updatedPromoter;
    } catch (err) {
      console.error('Error toggling promoter status:', err);
      setError(err instanceof Error ? err : new Error('Failed to update promoter status'));
      toast({
        title: 'Error',
        description: 'Failed to update promoter status. Please try again.',
        variant: 'destructive',
      });
      throw err;
    }
  };

  // Remove a promoter
  const removePromoter = async (id: string) => {
    try {
      // Find the current promoter
      const currentPromoter = promoters.find(p => p.id === id);
      if (!currentPromoter) {
        throw new Error('Promoter not found');
      }

      // Delete photo if exists
      if (currentPromoter.photo_url) {
        await deletePromoterPhoto(currentPromoter.photo_url);
      }

      // Delete promoter from Supabase
      await deletePromoter(id);

      // Refresh the promoters list to get the latest data
      await loadPromoters();

      toast({
        title: 'Success',
        description: `Promoter ${currentPromoter.name} has been deleted.`,
      });
    } catch (err) {
      console.error('Error removing promoter:', err);
      setError(err instanceof Error ? err : new Error('Failed to delete promoter'));
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete promoter. Please try again.',
        variant: 'destructive',
      });
      throw err;
    }
  };

  // Load a promoter's inventory
  const loadPromoterInventory = async (id: string) => {
    try {
      const inventory = await getPromoterInventory(id);
      
      // Update local state with inventory
      setPromoters(prev =>
        prev.map(p => p.id === id ? { ...p, inventory } : p)
      );

      return inventory;
    } catch (err) {
      console.error('Error loading promoter inventory:', err);
      setError(err instanceof Error ? err : new Error('Failed to load promoter inventory'));
      toast({
        title: 'Error',
        description: 'Failed to load promoter inventory. Please try again.',
        variant: 'destructive',
      });
      throw err;
    }
  };

  // Filter promoters by active status
  const filteredPromoters = useCallback(() => {
    if (activeFilter === null) {
      return promoters; // Show all
    }
    return promoters.filter(p => p.is_active === activeFilter);
  }, [promoters, activeFilter]);

  // Sort promoters: active first, then by name
  const sortedPromoters = useCallback(() => {
    return [...filteredPromoters()].sort((a, b) => {
      // If filtering by active status, just sort by name
      if (activeFilter !== null) {
        return a.name.localeCompare(b.name);
      }
      
      // If showing all, sort active first, then by name
      if (a.is_active !== b.is_active) {
        return a.is_active ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }, [filteredPromoters, activeFilter]);

  return {
    promoters: sortedPromoters(),
    loading,
    error,
    activeFilter,
    setActiveFilter,
    addPromoter,
    updatePromoterDetails,
    toggleActive,
    removePromoter,
    loadPromoterInventory,
    refreshPromoters: loadPromoters
  };
}