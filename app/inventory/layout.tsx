import { Metadata } from 'next';
import InventoryLayoutClient from '@/components/InventoryLayoutClient';

export const metadata: Metadata = {
  title: 'Inventory - JTI 1-2-1 Inventory Management',
  description: 'Manage inventory for JTI 1-2-1 project',
};

export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <InventoryLayoutClient>{children}</InventoryLayoutClient>;
} 