"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTransactionHistory } from '@/hooks/useTransactionHistory';
import { TransactionType } from '@/lib/api/transactions';
import { Brand } from '@/lib/api/brands';
import { useBrands } from '@/hooks/useBrands';
import { usePromoters } from '@/hooks/usePromoters';
import { useEmployees } from '@/hooks/useEmployees';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Loader2, ArrowLeft, ArrowRight, Search, X } from 'lucide-react';
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { debounce } from 'lodash';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';

export default function TransactionHistoryView() {
  const {
    transactions,
    loading,
    filters,
    pagination,
    updateFilters,
    resetFilters,
    changePage,
    formatTransactionDate,
    getTransactionTypeLabel,
    getTransactionTypeColor,
    refreshTransactions
  } = useTransactionHistory();
  
  const { employees = [] } = useEmployees() || {};
  const { promoters = [] } = usePromoters() || {};
  
  const { brands = [], loading: brandsLoading, error: brandsError } = useBrands() || {};
  
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPromoter, setSelectedPromoter] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  
  // Apply date range filter
  useEffect(() => {
    if (dateRange?.from || dateRange?.to) {
      const newFilters: any = {};
      if (dateRange.from) {
        newFilters.startDate = dateRange.from.toISOString();
      }
      if (dateRange.to) {
        newFilters.endDate = dateRange.to.toISOString();
      }
      updateFilters(newFilters);
    } else {
      updateFilters({ startDate: undefined, endDate: undefined });
    }
  }, [dateRange, updateFilters]);
  
  // Handle search input with debounce
  const debouncedSearch = debounce((term: string) => {
    updateFilters({ searchTerm: term || undefined });
  }, 300);
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    debouncedSearch(term);
  };
  
  // Handle transaction type filter change
  const handleTypeChange = (value: string) => {
    setSelectedType(value);
    if (value === 'all') {
      updateFilters({ transactionType: undefined });
    } else {
      updateFilters({ transactionType: value as TransactionType });
    }
  };
  
  // Handle promoter filter change
  const handlePromoterChange = (value: string) => {
    setSelectedPromoter(value);
    if (value === 'all') {
      updateFilters({ promoterId: undefined });
    } else {
      updateFilters({ promoterId: value });
    }
  };
  
  // Handle employee filter change
  const handleEmployeeChange = (value: string) => {
    setSelectedEmployee(value);
    if (value === 'all') {
      updateFilters({ employeeId: undefined });
    } else {
      updateFilters({ employeeId: value });
    }
  };
  
  // Create a map for quick brand lookup by ID
  const brandsMap = useMemo(() => {
    const map = new Map<string, string>();
    console.log("Building brandsMap with brands:", brands);
    brands.forEach(brand => {
      if (brand?.id) {
        map.set(brand.id, brand.name ?? 'Unnamed Brand');
      } else {
        console.warn('Skipping invalid brand data for map:', brand);
      }
    });
    console.log("Created brandsMap:", map);
    return map;
  }, [brands]);
  
  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setDateRange(undefined);
    setSelectedType('all');
    setSelectedPromoter('all');
    setSelectedEmployee('all');
    resetFilters();
  };
  
  // Get brand name from transaction, trying nested object first, then map lookup
  const getBrandName = useCallback((transaction: any): string => {
    try {
      const directName = transaction?.items?.brands?.name;
      if (directName) {
        return directName;
      }

      const brandId = transaction?.items?.brand_id;
      if (brandId) {
        const mappedName = brandsMap.get(brandId);
        if (mappedName) {
          return mappedName;
        } else {
          console.warn(`Brand name missing for transaction ${transaction.id}, brand_id: ${brandId} not found in brandsMap.`);
          return `Unknown Brand [${brandId.substring(0, 8)}...]`;
        }
      }

      return "N/A";

    } catch (error) {
      console.error(`Error getting brand name for transaction ${transaction?.id}:`, error);
      return "Fehler";
    }
  }, [brandsMap]);
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück
            </Button>
            <h1 className="text-2xl font-bold">Transaktionsverlauf</h1>
          </div>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="relative">
                <Input
                  placeholder="Suche nach Artikel, Produkt-ID..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-9"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1.5 h-7 w-7 p-0"
                    onClick={() => {
                      setSearchTerm('');
                      updateFilters({ searchTerm: undefined });
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <Select value={selectedType} onValueChange={handleTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Aktionstyp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Aktionen</SelectItem>
                  <SelectItem value="take_out">Take Out</SelectItem>
                  <SelectItem value="return">Return</SelectItem>
                  <SelectItem value="burn">Burn</SelectItem>
                  <SelectItem value="restock">Restock</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={selectedPromoter}
                onValueChange={handlePromoterChange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Promoter wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Promoter</SelectItem>
                  {promoters && promoters.length > 0 && promoters.map(promoter => (
                    <SelectItem key={promoter.id} value={promoter.id}>
                      {promoter.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedEmployee} onValueChange={handleEmployeeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Mitarbeiter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Mitarbeiter</SelectItem>
                  {employees && employees.length > 0 && employees.map(employee => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.full_name} ({employee.initials})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-wrap gap-4 items-center">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd.MM.yy", { locale: de })} - {" "}
                          {format(dateRange.to, "dd.MM.yy", { locale: de })}
                        </>
                      ) : (
                        format(dateRange.from, "dd.MM.yy", { locale: de })
                      )
                    ) : (
                      <span>Zeitraum auswählen</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    locale={de}
                  />
                  <div className="p-2 border-t">
                    <Button variant="outline" size="sm" onClick={() => setDateRange(undefined)} className="w-full">
                      Auswahl löschen
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              
              <Button variant="outline" onClick={handleResetFilters}>
                Filter zurücksetzen
              </Button>
              
              <Button variant="default" onClick={() => refreshTransactions()}>
                Aktualisieren
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            {loading || brandsLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">Datum</TableHead>
                        <TableHead>Artikel</TableHead>
                        <TableHead>Marke</TableHead>
                        <TableHead>Menge</TableHead>
                        <TableHead>Größe</TableHead>
                        <TableHead>Aktion</TableHead>
                        <TableHead>Promoter</TableHead>
                        <TableHead>Mitarbeiter</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!transactions || transactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                            Keine Transaktionen gefunden
                          </TableCell>
                        </TableRow>
                      ) : (
                        transactions.map((transaction: any) => (
                          <TableRow key={transaction.id}>
                            <TableCell>{formatTransactionDate(transaction.timestamp)}</TableCell>
                            <TableCell>{transaction.items?.name || 'N/A'}</TableCell>
                            <TableCell>{getBrandName(transaction)}</TableCell>
                            <TableCell>{transaction.quantity}</TableCell>
                            <TableCell>{transaction.item_sizes?.size || 'N/A'}</TableCell>
                            <TableCell className={getTransactionTypeColor(transaction.transaction_type)}>
                              {getTransactionTypeLabel(transaction.transaction_type)}
                            </TableCell>
                            <TableCell>
                              {transaction.promoters?.name || (transaction.transaction_type === 'restock' ? 'Lager' : '-')}
                            </TableCell>
                            <TableCell>{transaction.employees?.initials || '-'}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 