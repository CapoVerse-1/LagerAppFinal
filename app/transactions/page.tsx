import { Metadata } from 'next';
import TransactionHistoryView from '@/components/TransactionHistoryView';

export const metadata: Metadata = {
  title: 'Transaktionsverlauf | JTI Inventory Management',
  description: 'Übersicht aller Transaktionen im JTI Inventory Management System',
};

export default function TransactionsPage() {
  return <TransactionHistoryView />;
} 