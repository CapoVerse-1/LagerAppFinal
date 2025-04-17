'use client';

import { useEffect, useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database } from '@/types/supabase';
import { calculateItemQuantities } from '@/lib/api/items';

type BaseItem = Database['public']['Tables']['items']['Row'];
type ItemQuantities = {
  originalQuantity: number;
  availableQuantity: number;
  inCirculation: number;
  totalQuantity: number;
};

interface Item extends BaseItem {
  quantities?: ItemQuantities;
}

export default function AlleItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    const fetchItemsAndQuantities = async () => {
      setLoading(true);
      setError(null);
      let fetchedItems: BaseItem[] = [];

      try {
        const { data: itemData, error: itemError } = await supabase
          .from('items')
          .select('id, name, original_quantity, is_shared')
          .eq('is_shared', false);

        if (itemError) {
          console.error('Error fetching items:', itemError);
          throw new Error('Fehler beim Laden der Artikel.');
        }
        fetchedItems = itemData || [];

        const itemsWithQuantities = await Promise.all(
          fetchedItems.map(async (item) => {
            try {
              const quantities = await calculateItemQuantities(item.id);
              return { ...item, quantities };
            } catch (quantityError) {
              console.error(`Error fetching quantities for item ${item.id}:`, quantityError);
              return { ...item, quantities: undefined };
            }
          })
        );

        setItems(itemsWithQuantities as Item[]);

      } catch (err) {
         if (err instanceof Error) {
            setError(err.message);
         } else {
            setError('Ein unbekannter Fehler ist aufgetreten.');
         }
      } finally {
        setLoading(false);
      }
    };

    fetchItemsAndQuantities();
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
            <Card key={item.id} className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-primary">
              <CardContent className="p-0">
                 <div className="p-4">
                   <h3 className="font-semibold text-lg truncate mb-4">{item.name || 'Unbenannter Artikel'}</h3>
                   {item.quantities ? (
                     <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                       <div>
                         <p className="text-muted-foreground">Original:</p>
                         <p>{item.quantities.originalQuantity}</p>
                       </div>
                       <div>
                         <p className="text-muted-foreground">Available:</p>
                         <p className="font-medium">{item.quantities.availableQuantity}</p>
                       </div>
                       <div>
                         <p className="text-muted-foreground">In Circulation:</p>
                         <p>{item.quantities.inCirculation}</p>
                       </div>
                       <div>
                         <p className="text-muted-foreground">Total:</p>
                         <p className="font-medium">{item.quantities.totalQuantity}</p>
                       </div>
                     </div>
                   ) : (
                     <p className="text-sm text-muted-foreground">Mengen konnten nicht geladen werden.</p>
                   )}
                 </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 