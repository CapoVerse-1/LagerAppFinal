"use client";

import { useState, useMemo, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon, Loader2, ArrowLeft, ArrowRight, BarChart3 } from 'lucide-react'
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { useTransactions } from '@/hooks/useTransactions'
import { TransactionType } from '@/lib/api/transactions'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ItemHistoryDialogProps {
  item: {
    id: string;
    name: string;
    product_id: string;
  };
  setShowHistoryDialog: (show: boolean) => void;
}

export default function ItemHistoryDialog({ item, setShowHistoryDialog }: ItemHistoryDialogProps) {
  const { getItemHistoryDetailed, getItemStats } = useTransactions();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState<{
    totalTakeOuts: number;
    totalReturns: number;
    totalBurns: number;
    totalRestocks: number;
    mostFrequentPromoter: { id: string; name: string; count: number } | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [transactionType, setTransactionType] = useState<TransactionType | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null });
  const [pagination, setPagination] = useState({
    totalCount: 0,
    totalPages: 0,
    currentPage: 1
  });
  const [activeTab, setActiveTab] = useState("history");

  // Load transaction history
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        
        // Prepare filters
        const filters: any = {};
        if (transactionType) {
          filters.transactionType = transactionType;
        }
        if (dateRange.from) {
          filters.startDate = dateRange.from.toISOString();
        }
        if (dateRange.to) {
          filters.endDate = dateRange.to.toISOString();
        }
        
        // Fetch transactions with filters
        const result = await getItemHistoryDetailed(
          item.id, 
          filters, 
          pagination.currentPage
        );
        
        if (result) {
          setTransactions(result.transactions);
          setPagination({
            totalCount: result.totalCount,
            totalPages: result.totalPages,
            currentPage: result.currentPage
          });
        }
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    if (item?.id) {
      fetchTransactions();
    }
  }, [item, getItemHistoryDetailed, transactionType, dateRange, pagination.currentPage]);

  // Load item statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        const result = await getItemStats(item.id);
        if (result) {
          setStats(result);
        }
      } catch (error) {
        console.error("Error fetching item stats:", error);
      } finally {
        setStatsLoading(false);
      }
    };

    if (item?.id && activeTab === "stats") {
      fetchStats();
    }
  }, [item, getItemStats, activeTab]);

  // Get unique promoters from transactions
  const uniquePromoters = useMemo(() => {
    const promoters = transactions
      .filter(t => t.promoters)
      .map(t => ({ id: t.promoter_id, name: t.promoters.name }));
    
    return [...new Map(promoters.map(p => [p.id, p])).values()];
  }, [transactions]);

  // Reset filters
  const resetFilters = () => {
    setTransactionType(null);
    setDateRange({ from: null, to: null });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Change page
  const changePage = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) {
      return;
    }
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  // Format transaction date
  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get transaction type display
  const getTransactionTypeDisplay = (type: TransactionType) => {
    switch (type) {
      case 'take_out':
        return 'Take Out';
      case 'return':
        return 'Return';
      case 'burn':
        return 'Burn';
      case 'restock':
        return 'Restock';
      default:
        return type;
    }
  };

  // Get transaction type color
  const getTransactionTypeColor = (type: TransactionType) => {
    switch (type) {
      case 'take_out':
        return 'text-red-500';
      case 'return':
        return 'text-green-500';
      case 'burn':
        return 'text-orange-500';
      case 'restock':
        return 'text-blue-500';
      default:
        return '';
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => setShowHistoryDialog(false)}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Verlauf für {item.name} (ID: {item.product_id})</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="history">Transaktionsverlauf</TabsTrigger>
            <TabsTrigger value="stats">Statistiken</TabsTrigger>
          </TabsList>
          
          <TabsContent value="history">
            <div className="flex flex-wrap gap-2 mb-4">
              <Select 
                value={transactionType || "all"} 
                onValueChange={(value) => setTransactionType(value === "all" ? null : value as TransactionType)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Aktion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Aktionen</SelectItem>
                  <SelectItem value="take_out">Take Out</SelectItem>
                  <SelectItem value="return">Return</SelectItem>
                  <SelectItem value="burn">Burn</SelectItem>
                  <SelectItem value="restock">Restock</SelectItem>
                </SelectContent>
              </Select>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd.MM.yy", { locale: de })} -{" "}
                          {format(dateRange.to, "dd.MM.yy", { locale: de })}
                        </>
                      ) : (
                        format(dateRange.from, "dd.MM.yyyy", { locale: de })
                      )
                    ) : (
                      "Datum auswählen"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from || undefined}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={1}
                    locale={de}
                    className="w-[280px]"
                  />
                </PopoverContent>
              </Popover>
              
              <Button onClick={resetFilters} size="sm" className="w-[140px]">
                Filter zurücksetzen
              </Button>
            </div>
            
            <div className="mt-4 max-h-[60vh] overflow-auto">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Datum</TableHead>
                        <TableHead>Menge</TableHead>
                        <TableHead>Größe</TableHead>
                        <TableHead>Aktion</TableHead>
                        <TableHead>Promoter</TableHead>
                        <TableHead>Mitarbeiter</TableHead>
                        <TableHead>Notizen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                            Keine Transaktionen gefunden
                          </TableCell>
                        </TableRow>
                      ) : (
                        transactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>{formatDate(transaction.timestamp)}</TableCell>
                            <TableCell>{transaction.quantity}</TableCell>
                            <TableCell>{transaction.item_sizes.size}</TableCell>
                            <TableCell className={getTransactionTypeColor(transaction.transaction_type)}>
                              {getTransactionTypeDisplay(transaction.transaction_type)}
                            </TableCell>
                            <TableCell>
                              {transaction.promoters?.name || (transaction.transaction_type === 'restock' ? 'Lager' : '-')}
                            </TableCell>
                            <TableCell>{transaction.employees.initials}</TableCell>
                            <TableCell>{transaction.notes || '-'}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  
                  {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-muted-foreground">
                        Seite {pagination.currentPage} von {pagination.totalPages} ({pagination.totalCount} Einträge)
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => changePage(pagination.currentPage - 1)}
                          disabled={pagination.currentPage <= 1}
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => changePage(pagination.currentPage + 1)}
                          disabled={pagination.currentPage >= pagination.totalPages}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="stats">
            {statsLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : stats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Transaktionsübersicht</CardTitle>
                    <CardDescription>Zusammenfassung aller Transaktionen</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Take Outs:</span>
                        <Badge variant="outline" className="text-red-500">{stats.totalTakeOuts}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Returns:</span>
                        <Badge variant="outline" className="text-green-500">{stats.totalReturns}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Burns:</span>
                        <Badge variant="outline" className="text-orange-500">{stats.totalBurns}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Restocks:</span>
                        <Badge variant="outline" className="text-blue-500">{stats.totalRestocks}</Badge>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-muted-foreground">Gesamt:</span>
                        <Badge variant="outline">
                          {stats.totalTakeOuts + stats.totalReturns + stats.totalBurns + stats.totalRestocks}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Häufigster Promoter</CardTitle>
                    <CardDescription>Promoter mit den meisten Transaktionen</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {stats.mostFrequentPromoter ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Name:</span>
                          <span className="font-medium">{stats.mostFrequentPromoter.name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Anzahl Transaktionen:</span>
                          <Badge>{stats.mostFrequentPromoter.count}</Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        Keine Promoter-Daten verfügbar
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                Keine Statistiken verfügbar
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

