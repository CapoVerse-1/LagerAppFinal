"use client";

import { useState, Dispatch, SetStateAction } from 'react'
// Import necessary types
import { BrandWithItemCount } from './useBrands'; 
import { ItemWithSizeCount } from './useItems'; 
import { PromoterWithDetails } from './usePromoters';

// Define the shape of the data managed by the hook
interface InventoryData {
  brands: BrandWithItemCount[];
  setBrands: Dispatch<SetStateAction<BrandWithItemCount[]>>;
  items: ItemWithSizeCount[];
  setItems: Dispatch<SetStateAction<ItemWithSizeCount[]>>;
  promoters: PromoterWithDetails[];
  setPromoters: Dispatch<SetStateAction<PromoterWithDetails[]>>;
  promoterItems: any[]; // Keep as any[] for now, or define a specific type if known
  setPromoterItems: Dispatch<SetStateAction<any[]>>;
  selectedBrand: BrandWithItemCount | null;
  setSelectedBrand: Dispatch<SetStateAction<BrandWithItemCount | null>>;
  selectedPromoter: PromoterWithDetails | null;
  setSelectedPromoter: Dispatch<SetStateAction<PromoterWithDetails | null>>;
  selectedItem: ItemWithSizeCount | null;
  setSelectedItem: Dispatch<SetStateAction<ItemWithSizeCount | null>>;
  viewMode: 'brands' | 'promoters';
  setViewMode: Dispatch<SetStateAction<'brands' | 'promoters'>>;
}

export function useInventoryData(): InventoryData {
  const [brands, setBrands] = useState<BrandWithItemCount[]>([])
  const [items, setItems] = useState<ItemWithSizeCount[]>([])
  const [promoters, setPromoters] = useState<PromoterWithDetails[]>([])
  const [promoterItems, setPromoterItems] = useState<any[]>([]) // Keep as any[] for now
  const [selectedBrand, setSelectedBrand] = useState<BrandWithItemCount | null>(null)
  const [selectedPromoter, setSelectedPromoter] = useState<PromoterWithDetails | null>(null)
  const [selectedItem, setSelectedItem] = useState<ItemWithSizeCount | null>(null)
  const [viewMode, setViewMode] = useState<'brands' | 'promoters'>('brands')

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

