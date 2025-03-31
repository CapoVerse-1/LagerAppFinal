import React, { useState } from 'react';
import { useItemHistory } from '@/hooks/useItemHistory';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ItemHistoryProps {
  itemId: string;
}

export function ItemHistory({ itemId }: ItemHistoryProps) {
  const [activeTab, setActiveTab] = useState<string>('all');
  const { 
    transactions, 
    loading, 
    error, 
    pagination, 
    changePage, 
    filterByType,
    formatTransactionDate,
    getTransactionTypeLabel
  } = useItemHistory(itemId);

  const handleTabChange = async (value: string) => {
    setActiveTab(value);
    
    if (value === 'all') {
      await filterByType(null);
    } else {
      await filterByType(value as any);
    }
  };

  const getTransactionTypeColor = (type: string): string => {
    switch (type) {
      case 'take_out':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'return':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'burn':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'restock':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 text-center text-red-500">
            Error loading transaction history. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="take_out">Take Out</TabsTrigger>
            <TabsTrigger value="return">Return</TabsTrigger>
            <TabsTrigger value="burn">Burn</TabsTrigger>
            <TabsTrigger value="restock">Restock</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-0">
            {loading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="mb-4 p-4 border rounded-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-4 w-48 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              ))
            ) : transactions.length === 0 ? (
              // No transactions
              <div className="p-4 text-center text-gray-500">
                No transactions found.
              </div>
            ) : (
              // Transaction list
              <>
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="mb-4 p-4 border rounded-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-500">
                          {formatTransactionDate(transaction.timestamp)}
                        </p>
                        <p className="font-medium">
                          {transaction.quantity} item(s) - {transaction.notes || 'No notes'}
                        </p>
                        <p className="text-sm">
                          {transaction.promoter_id ? (
                            <>By promoter ID: {transaction.promoter_id.substring(0, 8)}...</>
                          ) : (
                            'Inventory update'
                          )}
                          {' • '}
                          Employee: {transaction.employee_id.substring(0, 3)}
                        </p>
                      </div>
                      <Badge className={`${getTransactionTypeColor(transaction.transaction_type)}`}>
                        {getTransactionTypeLabel(transaction.transaction_type)}
                      </Badge>
                    </div>
                  </div>
                ))}
                
                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-between items-center mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => changePage(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <span className="text-sm text-gray-500">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => changePage(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === pagination.totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 