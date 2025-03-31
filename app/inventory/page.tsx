"use client";

import { Suspense } from 'react';
import InventoryManagement from '@/components/InventoryManagement';

export default function InventoryPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading Inventory...</h1>
        </div>
      </div>
    }>
      <InventoryManagement />
    </Suspense>
  );
} 