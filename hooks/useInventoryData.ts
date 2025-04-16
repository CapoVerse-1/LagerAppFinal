"use client";

import { useState } from 'react'
import { BrandWithItemCount } from '@/hooks/useBrands'; // Assuming this defines the brand type
import { ItemWithSizeCount } from '@/hooks/useItems'; // Assuming this defines the item type
import { Promoter } from '@/lib/api/promoters'; // Assuming this defines the promoter type

// Define expected types for state
export type PromoterItem = { // Define structure expected by ReturnDialog
  item_id: string;
  item_size_id: string;
  promoter_id: string;
  quantity: number;
  // Other potential fields...
};

export function useInventoryData() {
  const [brands, setBrands] = useState<BrandWithItemCount[]>([])
  const [items, setItems] = useState<ItemWithSizeCount[]>([])
  const [promoters, setPromoters] = useState<Promoter[]>([])
  const [promoterItems, setPromoterItems] = useState<PromoterItem[]>([]) // Use defined type
  const [selectedBrand, setSelectedBrand] = useState<BrandWithItemCount | null>(null) // Allow Brand or null
  const [selectedPromoter, setSelectedPromoter] = useState<Promoter | null>(null) // Allow Promoter or null (match usage)
  const [selectedItem, setSelectedItem] = useState<ItemWithSizeCount | null>(null) // Allow Item or null
  const [viewMode, setViewMode] = useState('brands')

  return {
    brands, setBrands,
    items, setItems,
    promoters, setPromoters,
    promoterItems, setPromoterItems,
    selectedBrand, setSelectedBrand,
    selectedPromoter, setSelectedPromoter,
    selectedItem, setSelectedItem,
    viewMode, setViewMode
  }
}

