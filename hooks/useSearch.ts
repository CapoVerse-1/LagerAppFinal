import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from './useDebounce';
import { globalSearch, getSearchSuggestions, SearchResult } from '@/lib/api/search';
import { useToast } from './use-toast';

export interface SearchResults {
  brands: SearchResult[];
  items: SearchResult[];
  promoters: SearchResult[];
  transactions: SearchResult[];
  allResults: SearchResult[];
}

export function useSearch() {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<SearchResults>({
    brands: [],
    items: [],
    promoters: [],
    transactions: [],
    allResults: []
  });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  // Debounce the search query to avoid excessive API calls
  const debouncedQuery = useDebounce(query, 300);

  // Perform search when debounced query changes
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery || debouncedQuery.trim().length < 2) {
        setResults({
          brands: [],
          items: [],
          promoters: [],
          transactions: [],
          allResults: []
        });
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('Executing search for:', debouncedQuery);
        const searchResults = await globalSearch(debouncedQuery);
        
        // Combine all results for easy access
        const allResults = [
          ...searchResults.brands,
          ...searchResults.items,
          ...searchResults.promoters,
          ...searchResults.transactions
        ];

        setResults({
          ...searchResults,
          allResults
        });
        
        console.log('Search completed with results:', {
          brands: searchResults.brands.length,
          items: searchResults.items.length,
          promoters: searchResults.promoters.length,
          transactions: searchResults.transactions.length,
          total: allResults.length
        });
      } catch (err) {
        console.error('Error performing search:', err);
        setError(err instanceof Error ? err : new Error('Failed to perform search'));
        toast({
          title: 'Search Error',
          description: 'Failed to perform search. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery, toast]);

  // Get search suggestions when query changes
  useEffect(() => {
    const getSuggestions = async () => {
      if (!query || query.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const suggestionResults = await getSearchSuggestions(query);
        setSuggestions(suggestionResults);
      } catch (err) {
        console.error('Error getting search suggestions:', err);
        // Don't show toast for suggestion errors to avoid annoying the user
      }
    };

    getSuggestions();
  }, [query]);

  // Clear search results
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults({
      brands: [],
      items: [],
      promoters: [],
      transactions: [],
      allResults: []
    });
    setSuggestions([]);
  }, []);

  return {
    query,
    setQuery,
    results,
    suggestions,
    loading,
    error,
    clearSearch,
    hasResults: results.allResults.length > 0
  };
} 