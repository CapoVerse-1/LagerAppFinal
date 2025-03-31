import { useState, useEffect, useCallback } from 'react';
import { usePinContext } from '../contexts/PinContext';
import { useUser } from '../contexts/UserContext';
import { 
  fetchBrands, 
  createBrand, 
  updateBrand, 
  deleteBrand, 
  toggleBrandStatus, 
  toggleBrandPinned,
  countBrandItems,
  Brand
} from '@/lib/api/brands';
import { uploadBrandLogo, updateBrandLogo, deleteBrandLogo } from '@/lib/api/storage';
import { useToast } from '@/hooks/use-toast';

export interface BrandWithItemCount extends Brand {
  itemCount: number;
}

export function useBrands() {
  const [brands, setBrands] = useState<BrandWithItemCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { pinnedBrands, togglePin, isPinned } = usePinContext();
  const { toast } = useToast();
  const { currentUser } = useUser();

  // Load brands from Supabase
  const refreshBrands = useCallback(async () => {
    try {
      setLoading(true);
      const brandsData = await fetchBrands();
      
      // Get item counts for each brand
      const brandsWithCounts = await Promise.all(
        brandsData.map(async (brand) => {
          const count = await countBrandItems(brand.id);
          return { ...brand, itemCount: count };
        })
      );
      
      setBrands(brandsWithCounts);
      setError(null);
    } catch (err) {
      console.error('Error loading brands:', err);
      setError(err instanceof Error ? err : new Error('Failed to load brands'));
      toast({
        title: 'Error',
        description: 'Failed to load brands. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Load brands on mount
  useEffect(() => {
    refreshBrands();
  }, [refreshBrands]);

  // Sort brands: pinned first, then active, then inactive
  const sortedBrands = [...brands].sort((a, b) => {
    // First, sort by active status
    if (a.is_active !== b.is_active) {
      return a.is_active ? -1 : 1;
    }

    // Then, sort by pinned status
    const isPinnedA = a.is_pinned;
    const isPinnedB = b.is_pinned;

    if (isPinnedA && isPinnedB) {
      // If both are pinned, maintain original order
      return brands.findIndex(brand => brand.id === a.id) - 
             brands.findIndex(brand => brand.id === b.id);
    }
    if (isPinnedA) return -1;
    if (isPinnedB) return 1;

    // If neither is pinned, sort alphabetically
    return a.name.localeCompare(b.name);
  });

  // Debug log to see what's happening with the brands state
  useEffect(() => {
    console.log('Brands state updated:', brands);
  }, [brands]);

  // Add a new brand
  const addBrand = async (name: string, logoFile: File | null): Promise<BrandWithItemCount> => {
    try {
      // Check if an employee is selected
      if (!currentUser) {
        throw new Error('Please select an employee before creating a brand');
      }

      // Create brand data
      const brandData: any = {
        name,
        is_active: true,
        is_pinned: false,
        created_by: currentUser.id
      };
      
      // Upload logo to Supabase Storage if provided
      if (logoFile) {
        const logoUrl = await uploadBrandLogo(logoFile);
        brandData.logo_url = logoUrl;
      }
      
      // Create brand in Supabase
      await createBrand(brandData);
      
      // Refresh brands to get the latest data
      await refreshBrands();
      
      toast({
        title: 'Success',
        description: `Brand "${name}" has been created.`,
      });
      
      return brands.find(b => b.name === name) || { id: '', name, is_active: true, is_pinned: false, itemCount: 0 };
    } catch (err) {
      console.error('Error adding brand:', err);
      toast({
        title: 'Error',
        description: 'Failed to create brand. Please try again.',
        variant: 'destructive',
      });
      throw err;
    }
  };

  // Update an existing brand
  const updateBrandDetails = async (
    id: string, 
    name: string, 
    logoFile?: File
  ): Promise<BrandWithItemCount> => {
    try {
      // Find the current brand
      const currentBrand = brands.find(b => b.id === id);
      if (!currentBrand) {
        throw new Error('Brand not found');
      }
      
      // Prepare update data
      const updateData: any = { name };
      
      // If a new logo was provided, upload it
      if (logoFile) {
        const logoUrl = await updateBrandLogo(logoFile, currentBrand.logo_url || undefined);
        updateData.logo_url = logoUrl;
      }
      
      // Update brand in Supabase
      await updateBrand(id, updateData);
      
      // Refresh brands to get the latest data
      await refreshBrands();
      
      toast({
        title: 'Success',
        description: `Brand "${name}" has been updated.`,
      });
      
      return brands.find(b => b.id === id) || currentBrand;
    } catch (err) {
      console.error('Error updating brand:', err);
      toast({
        title: 'Error',
        description: 'Failed to update brand. Please try again.',
        variant: 'destructive',
      });
      throw err;
    }
  };

  // Toggle brand active status
  const toggleActive = async (id: string): Promise<void> => {
    try {
      // Find the current brand
      const currentBrand = brands.find(b => b.id === id);
      if (!currentBrand) {
        throw new Error('Brand not found');
      }
      
      // Update in Supabase
      await toggleBrandStatus(id, !currentBrand.is_active);
      
      // Refresh brands to get the latest data
      await refreshBrands();
      
      toast({
        title: 'Success',
        description: `Brand "${currentBrand.name}" is now ${!currentBrand.is_active ? 'active' : 'inactive'}.`,
      });
    } catch (err) {
      console.error('Error toggling brand status:', err);
      toast({
        title: 'Error',
        description: 'Failed to update brand status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Toggle brand pinned status
  const togglePinned = async (id: string): Promise<void> => {
    try {
      // Find the current brand
      const currentBrand = brands.find(b => b.id === id);
      if (!currentBrand) {
        throw new Error('Brand not found');
      }
      
      // Update in Supabase
      await toggleBrandPinned(id, !currentBrand.is_pinned);
      
      // Also update the pin context for local storage persistence
      togglePin(id, 'brand');
      
      // Refresh brands to get the latest data
      await refreshBrands();
      
      toast({
        title: 'Success',
        description: `Brand "${currentBrand.name}" is now ${!currentBrand.is_pinned ? 'pinned' : 'unpinned'}.`,
      });
    } catch (err) {
      console.error('Error toggling brand pinned status:', err);
      toast({
        title: 'Error',
        description: 'Failed to update brand pinned status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Remove a brand
  const removeBrand = async (id: string): Promise<void> => {
    try {
      // Find the current brand
      const currentBrand = brands.find(b => b.id === id);
      if (!currentBrand) {
        throw new Error('Brand not found');
      }
      
      // Delete brand logo if exists
      if (currentBrand.logo_url) {
        await deleteBrandLogo(currentBrand.logo_url);
      }
      
      // Delete brand from Supabase
      await deleteBrand(id);
      
      // Refresh brands to get the latest data
      await refreshBrands();
      
      toast({
        title: 'Success',
        description: `Brand "${currentBrand.name}" has been deleted.`,
      });
    } catch (err) {
      console.error('Error removing brand:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete brand. Please try again.',
        variant: 'destructive',
      });
      throw err;
    }
  };

  return {
    brands: sortedBrands,
    loading,
    error,
    refreshBrands,
    addBrand,
    updateBrandDetails,
    toggleActive,
    togglePinned,
    removeBrand
  };
}