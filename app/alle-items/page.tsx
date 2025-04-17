'use client';

import { useEffect, useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database } from '@/types/supabase';

type Item = Database['public']['Tables']['items']['Row'];

export default function AlleItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('items')
        .select('id, name, original_quantity, is_shared')
        .eq('is_shared', false);

      if (error) {
        console.error('Error fetching items:', error);
        setError('Fehler beim Laden der Artikel.');
      } else if (data) {
        setItems(data as Item[]);
      }
      setLoading(false);
    };

    fetchItems();
  }, [supabase]);

  if (loading) {
    return <div className="container mx-auto p-4">Lade Artikel...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Alle Artikel (Übersicht)</h1>
      {items.length === 0 ? (
        <p>Keine Artikel gefunden.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg">{item.name || 'Unbenannter Artikel'}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                 <p>Originalmenge: <Badge variant="secondary">{item.original_quantity ?? 0}</Badge></p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 