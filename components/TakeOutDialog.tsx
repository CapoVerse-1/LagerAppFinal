import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { recordTakeOut } from '@/lib/api/transactions';
import { fetchItemSizes } from '@/lib/api/items';
import { useUser } from '../contexts/UserContext';
import PromoterSelector from './PromoterSelector';
import { supabase } from '@/lib/supabase';

interface TakeOutDialogProps {
  item: any;
  setTakingOutItem: (item: any) => void;
  onSuccess?: () => void;
}

export default function TakeOutDialog({
  item,
  setTakingOutItem,
  onSuccess
}: TakeOutDialogProps) {
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
    console.log('TakeOutDialog mounted with item:', item);
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
    console.log('TakeOutDialog state:', { 
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

  const handleConfirmTakeOut = async () => {
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
      
      console.log('TakeOutDialog - Before API call:', {
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
        
      console.log('TakeOutDialog - DB quantities before transaction:', {
        available: beforeData?.available_quantity,
        inCirculation: beforeData?.in_circulation
      });
      
      await recordTakeOut({
        itemId: item.id,
        itemSizeId: sizeId,
        quantity: quantity,
        promoterId: promoterId,
        employeeId: currentUser?.id,
        notes: notes
      });
      
      console.log('TakeOutDialog - After API call');
      
      // Get updated quantities directly from the database
      const { data: afterData } = await supabase
        .from('item_sizes')
        .select('available_quantity, in_circulation')
        .eq('id', sizeId)
        .single();
        
      console.log('TakeOutDialog - DB quantities after transaction:', {
        available: afterData?.available_quantity,
        inCirculation: afterData?.in_circulation
      });
      
      toast({
        title: "Success",
        description: "Item taken out successfully.",
      });
      
      if (onSuccess) {
        console.log('TakeOutDialog - Calling onSuccess callback');
        onSuccess();
      }
      
      setTakingOutItem(null);
    } catch (error) {
      console.error("Error taking out item:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to take out item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!item) return null;

  // Find the selected size to display available quantity
  const selectedSize = sizes.find(size => size.id === sizeId);
  const availableQuantity = selectedSize ? selectedSize.available_quantity : 0;

  return (
    <Dialog open={!!item} onOpenChange={() => setTakingOutItem(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Artikel ausgeben</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="takeOutItem" className="text-right">Artikel</Label>
            <div className="col-span-3">
              <p>{item.name || item.product_id}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="takeOutSize" className="text-right">Größe</Label>
            <Select value={sizeId} onValueChange={setSizeId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Größe auswählen" />
              </SelectTrigger>
              <SelectContent>
                {sizes.map((size) => (
                  <SelectItem key={size.id} value={size.id}>
                    {size.size} (Verfügbar: {size.available_quantity})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="takeOutQuantity" className="text-right">Menge</Label>
            <Input
              id="takeOutQuantity"
              type="number"
              min="1"
              max={availableQuantity}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              className="col-span-3"
            />
            {selectedSize && (
              <div className="col-span-4 text-right text-sm text-muted-foreground">
                Verfügbar: {availableQuantity}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="takeOutPromoter" className="text-right">Promoter</Label>
            <div className="col-span-3">
              <PromoterSelector 
                value={promoterId} 
                onChange={handlePromoterId} 
                placeholder="Promoter auswählen"
                includeInactive={false}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="takeOutNotes" className="text-right">Notizen</Label>
            <Input
              id="takeOutNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional: Zusätzliche Informationen"
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setTakingOutItem(null)}>Abbrechen</Button>
          <Button 
            onClick={handleConfirmTakeOut} 
            disabled={isSubmitting || !sizeId || !promoterId || quantity <= 0 || quantity > availableQuantity}
          >
            {isSubmitting ? 'Wird gespeichert...' : 'Bestätigen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 