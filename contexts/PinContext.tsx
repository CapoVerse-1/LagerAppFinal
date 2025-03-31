import React, { createContext, useContext, useState, useEffect } from 'react';

interface PinContextType {
  pinnedItems: string[];
  pinnedBrands: string[];
  pinnedPromoters: string[];
  togglePin: (id: string, type: 'item' | 'brand' | 'promoter') => void;
  isPinned: (id: string, type: 'item' | 'brand' | 'promoter') => boolean;
}

const PinContext = createContext<PinContextType | undefined>(undefined);

export const PinProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pinnedItems, setPinnedItems] = useState<string[]>([]);
  const [pinnedBrands, setPinnedBrands] = useState<string[]>([]);
  const [pinnedPromoters, setPinnedPromoters] = useState<string[]>([]);

  useEffect(() => {
    const loadPinnedData = () => {
      const storedPinnedItems = localStorage.getItem('pinnedItems');
      const storedPinnedBrands = localStorage.getItem('pinnedBrands');
      const storedPinnedPromoters = localStorage.getItem('pinnedPromoters');

      if (storedPinnedItems) setPinnedItems(JSON.parse(storedPinnedItems));
      if (storedPinnedBrands) setPinnedBrands(JSON.parse(storedPinnedBrands));
      if (storedPinnedPromoters) setPinnedPromoters(JSON.parse(storedPinnedPromoters));
    };

    loadPinnedData();
  }, []);

  useEffect(() => {
    localStorage.setItem('pinnedItems', JSON.stringify(pinnedItems));
    localStorage.setItem('pinnedBrands', JSON.stringify(pinnedBrands));
    localStorage.setItem('pinnedPromoters', JSON.stringify(pinnedPromoters));
  }, [pinnedItems, pinnedBrands, pinnedPromoters]);

  const togglePin = (id: string, type: 'item' | 'brand' | 'promoter') => {
    const updatePinned = (prev: string[]) => 
      prev.includes(id) ? prev.filter(pinnedId => pinnedId !== id) : [...prev, id];

    switch (type) {
      case 'item':
        setPinnedItems(updatePinned);
        break;
      case 'brand':
        setPinnedBrands(updatePinned);
        break;
      case 'promoter':
        setPinnedPromoters(updatePinned);
        break;
    }
  };

  const isPinned = (id: string, type: 'item' | 'brand' | 'promoter') => {
    switch (type) {
      case 'item':
        return pinnedItems.includes(id);
      case 'brand':
        return pinnedBrands.includes(id);
      case 'promoter':
        return pinnedPromoters.includes(id);
    }
  };

  return (
    <PinContext.Provider value={{ pinnedItems, pinnedBrands, pinnedPromoters, togglePin, isPinned }}>
      {children}
    </PinContext.Provider>
  );
};

export const usePinContext = () => {
  const context = useContext(PinContext);
  if (context === undefined) {
    throw new Error('usePinContext must be used within a PinProvider');
  }
  return context;
};

