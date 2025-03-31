"use client";

import { useState } from 'react'

export function useInventoryData() {
  const [brands, setBrands] = useState([])
  const [items, setItems] = useState([])
  const [promoters, setPromoters] = useState([])
  const [promoterItems, setPromoterItems] = useState([])
  const [selectedBrand, setSelectedBrand] = useState(null)
  const [selectedPromoter, setSelectedPromoter] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
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

