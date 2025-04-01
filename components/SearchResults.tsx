import { SearchResult } from '@/lib/api/search';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Loader2, Search, Tag, User, Package, History } from 'lucide-react';
import Image from 'next/image';

interface SearchResultsProps {
  results: {
    brands: SearchResult[];
    items: SearchResult[];
    promoters: SearchResult[];
    transactions: SearchResult[];
    allResults: SearchResult[];
  };
  onResultClick: (result: SearchResult) => void;
  loading?: boolean;
  query: string;
}

export default function SearchResults({ results, onResultClick, loading, query }: SearchResultsProps) {
  const hasResults = results.allResults.length > 0;
  const hasQuery = query && query.trim().length >= 2;

  if (!hasQuery) return null;
  
  if (loading) {
    return (
      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border rounded-md shadow-lg p-4">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
          <p>Searching...</p>
        </div>
      </div>
    );
  }

  if (hasQuery && !hasResults) {
    return (
      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border rounded-md shadow-lg p-4">
        <div className="flex flex-col items-center justify-center py-4">
          <Search className="h-6 w-6 text-gray-400 mb-2" />
          <p className="text-gray-500">No results found for "{query}"</p>
        </div>
      </div>
    );
  }

  if (!hasResults) return null;

  return (
    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border rounded-md shadow-lg">
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full flex overflow-x-auto whitespace-nowrap">
          <TabsTrigger value="all" className="text-xs flex-1 min-w-fit px-2">
            All ({results.allResults.length})
          </TabsTrigger>
          <TabsTrigger value="brands" className="text-xs flex-1 min-w-fit px-2">
            <Tag className="h-3 w-3 mr-1" /> Brands ({results.brands.length})
          </TabsTrigger>
          <TabsTrigger value="items" className="text-xs flex-1 min-w-fit px-2">
            <Package className="h-3 w-3 mr-1" /> Items ({results.items.length})
          </TabsTrigger>
          <TabsTrigger value="promoters" className="text-xs flex-1 min-w-fit px-2">
            <User className="h-3 w-3 mr-1" /> Promoters ({results.promoters.length})
          </TabsTrigger>
          <TabsTrigger value="transactions" className="text-xs flex-1 min-w-fit px-2">
            <History className="h-3 w-3 mr-1" /> Transactions ({results.transactions.length})
          </TabsTrigger>
        </TabsList>
        
        <ScrollArea className="h-[300px]">
          <TabsContent value="all" className="m-0">
            {results.allResults.length > 0 ? (
              <ResultsList results={results.allResults} onResultClick={onResultClick} />
            ) : (
              <EmptyResults />
            )}
          </TabsContent>
          
          <TabsContent value="brands" className="m-0">
            {results.brands.length > 0 ? (
              <ResultsList results={results.brands} onResultClick={onResultClick} />
            ) : (
              <EmptyResults />
            )}
          </TabsContent>
          
          <TabsContent value="items" className="m-0">
            {results.items.length > 0 ? (
              <ResultsList results={results.items} onResultClick={onResultClick} />
            ) : (
              <EmptyResults />
            )}
          </TabsContent>
          
          <TabsContent value="promoters" className="m-0">
            {results.promoters.length > 0 ? (
              <ResultsList results={results.promoters} onResultClick={onResultClick} />
            ) : (
              <EmptyResults />
            )}
          </TabsContent>
          
          <TabsContent value="transactions" className="m-0">
            {results.transactions.length > 0 ? (
              <ResultsList results={results.transactions} onResultClick={onResultClick} />
            ) : (
              <EmptyResults />
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

function ResultsList({ results, onResultClick }: { results: SearchResult[], onResultClick: (result: SearchResult) => void }) {
  return (
    <div className="divide-y">
      {results.map((result) => (
        <div
          key={`${result.type}-${result.id}`}
          className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center"
          onClick={() => onResultClick(result)}
        >
          <div className="flex-shrink-0 mr-3">
            {result.imageUrl ? (
              <Image
                src={result.imageUrl}
                alt={result.name}
                width={40}
                height={40}
                className="rounded-md object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-md bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                {result.type === 'brand' && <Tag className="h-5 w-5 text-gray-500" />}
                {result.type === 'item' && <Package className="h-5 w-5 text-gray-500" />}
                {result.type === 'promoter' && <User className="h-5 w-5 text-gray-500" />}
                {result.type === 'transaction' && <History className="h-5 w-5 text-gray-500" />}
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              <p className="text-sm font-medium truncate">{result.name}</p>
              <Badge variant="outline" className="ml-2 text-xs">
                {result.type === 'brand' && 'Brand'}
                {result.type === 'item' && 'Item'}
                {result.type === 'promoter' && 'Promoter'}
                {result.type === 'transaction' && 'Transaction'}
              </Badge>
            </div>
            {result.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{result.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyResults() {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <Search className="h-8 w-8 text-gray-400 mb-2" />
      <p className="text-gray-500">No results found in this category</p>
    </div>
  );
}

