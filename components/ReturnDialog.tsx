import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { recordReturn } from '@/lib/api/transactions';
import { fetchItemSizes } from '@/lib/api/items';
import { useUser } from '../contexts/UserContext';
import PromoterSelector from './PromoterSelector';
import { supabase } from '@/lib/supabase';

interface ReturnDialogProps {
  item: any;
  setReturningItem: (item: any) => void;
  onSuccess?: () => void;
}

export default function ReturnDialog({
  item,
  setReturningItem,
  onSuccess
}: ReturnDialogProps) {
  const { currentUser } = useUser();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [promoterId, setPromoterId] = useState("");
  const [sizeId, setSizeId] = useState("");
  const [sizes, setSizes] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState("");

  // Debug: Log component mount and props
  useEffect(() => {
    console.log('ReturnDialog mounted with item:', item);
  }, [item]);

  // Fetch item sizes
  useEffect(() => {
    const fetchSizes = async () => {
      if (item && item.id) {
        try {
          console.log('Fetching sizes for item:', item.id);
          const itemSizes = await fetchItemSizes(item.id);
          console.log('Fetched sizes:', itemSizes);
          setSizes(itemSizes);
          if (itemSizes.length === 1) {
            setSizeId(itemSizes[0].id);
          }
        } catch (error) {
          console.error("Error fetching item sizes:", error);
          toast({
            title: "Error",
            description: "Failed to load item sizes.",
            variant: "destructive",
          });
        }
      }
    };
    
    fetchSizes();
  }, [item, toast]);

  // Debug: Log state changes
  useEffect(() => {
    console.log('ReturnDialog state:', { 
      promoterId, 
      sizeId, 
      quantity, 
      isSubmitting 
    });
  }, [promoterId, sizeId, quantity, isSubmitting]);

  const handlePromoterId = (id: string) => {
    console.log('Promoter ID changed to:', id);
    setPromoterId(id);
  };

  const handleConfirmReturn = async () => {
    if (!item || !sizeId || !promoterId || quantity <= 0) {
      console.log('Validation failed:', { item, sizeId, promoterId, quantity });
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      console.log('ReturnDialog - Before API call:', {
        itemId: item.id,
        itemSizeId: sizeId,
        quantity: quantity,
        promoterId: promoterId
      });
      
      // Get current quantities directly from the database for comparison
      const { data: beforeData } = await supabase
        .from('item_sizes')
        .select('available_quantity, in_circulation')
        .eq('id', sizeId)
        .single();
        
      console.log('ReturnDialog - DB quantities before transaction:', {
        available: beforeData?.available_quantity,
        inCirculation: beforeData?.in_circulation
      });
      
      await recordReturn({
        itemId: item.id,
        itemSizeId: sizeId,
        quantity: quantity,
        promoterId: promoterId,
        employeeId: currentUser?.id,
        notes: notes
      });
      
      console.log('ReturnDialog - After API call');
      
      // Get updated quantities directly from the database
      const { data: afterData } = await supabase
        .from('item_sizes')
        .select('available_quantity, in_circulation')
        .eq('id', sizeId)
        .single();
        
      console.log('ReturnDialog - DB quantities after transaction:', {
        available: afterData?.available_quantity,
        inCirculation: afterData?.in_circulation
      });
      
      toast({
        title: "Success",
        description: "Item returned successfully.",
      });
      
      if (onSuccess) {
        console.log('ReturnDialog - Calling onSuccess callback');
        onSuccess();
      }
      
      setReturningItem(null);
    } catch (error) {
      console.error("Error returning item:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to return item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!item) return null;

  // Find the selected size to display in circulation quantity
  const selectedSize = sizes.find(size => size.id === sizeId);
  const inCirculationQuantity = selectedSize ? selectedSize.in_circulation : 0;

  return (
    <Dialog open={!!item} onOpenChange={() => setReturningItem(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Artikel zurückgeben</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="returnItem" className="text-right">Artikel</Label>
            <div className="col-span-3">
              <p>{item.name || item.product_id}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="returnSize" className="text-right">Größe</Label>
            <Select value={sizeId} onValueChange={setSizeId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Größe auswählen" />
              </SelectTrigger>
              <SelectContent>
                {sizes.map((size) => (
                  <SelectItem key={size.id} value={size.id}>
                    {size.size} (Im Umlauf: {size.in_circulation})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="returnQuantity" className="text-right">Menge</Label>
            <Input
              id="returnQuantity"
              type="number"
              min="1"
              max={inCirculationQuantity}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              className="col-span-3"
            />
            {selectedSize && (
              <div className="col-span-4 text-right text-sm text-muted-foreground">
                Im Umlauf: {inCirculationQuantity}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="returnPromoter" className="text-right">Promoter</Label>
            <div className="col-span-3">
              <PromoterSelector 
                value={promoterId} 
                onChange={handlePromoterId} 
                placeholder="Promoter auswählen"
                includeInactive={true}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="returnNotes" className="text-right">Notizen</Label>
            <Input
              id="returnNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional: Zusätzliche Informationen"
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setReturningItem(null)}>Abbrechen</Button>
          <Button 
            onClick={handleConfirmReturn} 
            disabled={isSubmitting || !sizeId || !promoterId || quantity <= 0 || quantity > inCirculationQuantity}
          >
            {isSubmitting ? 'Wird gespeichert...' : 'Bestätigen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 