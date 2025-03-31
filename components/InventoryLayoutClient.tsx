"use client";

import { Suspense } from 'react';

export default function InventoryLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          </div>
        </div>
      }>
        {children}
      </Suspense>
    </div>
  );
} 