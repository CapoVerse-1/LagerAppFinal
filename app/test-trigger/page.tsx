"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { testDatabaseTrigger } from '@/lib/api/transactions';
import { fetchAllItemSizesForBrand } from '@/lib/api/items';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function TestTriggerPage() {
  const [itemSizes, setItemSizes] = useState<any[]>([]);
  const [selectedSizeId, setSelectedSizeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    async function loadSizes() {
      try {
        // Use a known brand ID or fetch all sizes
        const sizes = await fetchAllItemSizesForBrand('25834a6c-b1b9-4734-bb60-0118fdc8ca87');
        setItemSizes(sizes);
        if (sizes.length > 0) {
          setSelectedSizeId(sizes[0].id);
        }
      } catch (error) {
        console.error('Error loading sizes:', error);
        setResult('Error loading sizes: ' + (error instanceof Error ? error.message : String(error)));
      }
    }
    
    loadSizes();
  }, []);

  const handleTestTrigger = async () => {
    if (!selectedSizeId) {
      setResult('Please select an item size first');
      return;
    }
    
    setLoading(true);
    setResult('Running test...');
    
    try {
      await testDatabaseTrigger(selectedSizeId);
      setResult('Test completed. Check the console for results.');
    } catch (error) {
      console.error('Error testing trigger:', error);
      setResult('Error testing trigger: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Test Database Trigger</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="itemSize" className="text-right">Item Size</Label>
              <Select value={selectedSizeId} onValueChange={setSelectedSizeId}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select an item size" />
                </SelectTrigger>
                <SelectContent>
                  {itemSizes.map((size) => (
                    <SelectItem key={size.id} value={size.id}>
                      {size.item_name || 'Unknown'} - {size.size} (Available: {size.available_quantity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={handleTestTrigger} disabled={loading || !selectedSizeId}>
                {loading ? 'Testing...' : 'Test Trigger'}
              </Button>
            </div>
            
            {result && (
              <div className="mt-4 p-4 border rounded bg-gray-50">
                <pre className="whitespace-pre-wrap">{result}</pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 