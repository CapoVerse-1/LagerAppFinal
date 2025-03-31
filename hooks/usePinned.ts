"use client";

import { useMemo } from 'react';
import { usePinContext } from '../contexts/PinContext';

export function usePinned<T extends { id: string; isActive: boolean }>(items: T[], type: 'item' | 'brand' | 'promoter') {
  const { togglePin, isPinned } = usePinContext();

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      // First, sort by active status
      if (a.isActive !== b.isActive) {
        return a.isActive ? -1 : 1;
      }

      // Then, sort by pinned status
      const isPinnedA = isPinned(a.id, type);
      const isPinnedB = isPinned(b.id, type);

      if (isPinnedA && isPinnedB) {
        return items.findIndex(item => item.id === a.id) - items.findIndex(item => item.id === b.id);
      }
      if (isPinnedA) return -1;
      if (isPinnedB) return 1;

      // If neither is pinned, maintain original order
      return items.findIndex(item => item.id === a.id) - items.findIndex(item => item.id === b.id);
    });
  }, [items, isPinned, type]);

  return { 
    sortedItems, 
    togglePin: (id: string) => togglePin(id, type), 
    isPinned: (id: string) => isPinned(id, type) 
  };
}

