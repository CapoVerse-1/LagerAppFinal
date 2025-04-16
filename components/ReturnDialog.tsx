import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { recordReturn } from '@/lib/api/transactions';
import { fetchItemSizes, ItemSize } from '@/lib/api/items';
import { useUser } from '../contexts/UserContext';
import PromoterSelector from './PromoterSelector';
import { supabase } from '@/lib/supabase';
import ReturnWarningDialog from './ReturnWarningDialog';

// Define PromoterItem type (adjust based on actual structure if different)
interface PromoterItem {
  id: string;
  item_id: string;
  item_size_id: string; // Assuming size ID is stored
  promoterId: string;
  size: string; // Assuming size string is stored
  productId: string; // Assuming product ID is stored
  // Add other relevant fields from promoterItems
}

interface ReturnDialogProps {
  item: any; // Consider using a more specific type if available
  setReturningItem: (item: any) => void;
  onSuccess?: () => void;
  promoterItems: PromoterItem[]; // Add promoterItems prop
}

export default function ReturnDialog({
  item,
  setReturningItem,
  onSuccess,
  promoterItems // Destructure the prop
}: ReturnDialogProps) {
  const { currentUser } = useUser();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [promoterId, setPromoterId] = useState("");
  const [sizeId, setSizeId] = useState("");
  const [sizes, setSizes] = useState<ItemSize[]>([]); // Use ItemSize type
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [showReturnWarning, setShowReturnWarning] = useState(false); // State for warning dialog

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

  // Function to perform the actual return logic
  const performReturn = async () => {
    // Add check for currentUser before proceeding
    if (!currentUser?.id) {
        toast({
            title: "Error",
            description: "Benutzerinformation nicht gefunden. Bitte erneut anmelden.",
            variant: "destructive",
        });
        setIsSubmitting(false); // Ensure submitting state is reset
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
        employeeId: currentUser.id,
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
      
      setReturningItem(null); // Close the main dialog
    } catch (error) {
      console.error("Error returning item:", error);
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to return item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Initial confirmation handler - performs check first
  const handleConfirmReturn = async () => {
    if (!item || !sizeId || !promoterId || quantity <= 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Check if the promoter has the item/size
    const selectedSizeObj = sizes.find(s => s.id === sizeId);
    if (!selectedSizeObj) {
        toast({ title: "Error", description: "Selected size not found.", variant: "destructive" });
        return; 
    }
    const hasItem = promoterItems.some(
      pItem => pItem.promoterId === promoterId && 
               pItem.productId === item.product_id && // Match on product_id
               pItem.size === selectedSizeObj.size // Match on size string
               // Add pItem.quantity >= quantity check if needed?
               // The prompt only asked if they *have* it, not *enough* quantity
    );

    if (!hasItem) {
      // If promoter doesn't have the item, show the warning dialog
      console.log("Promoter doesn't have the item/size. Showing warning.");
      setShowReturnWarning(true);
    } else {
      // If promoter has the item, proceed directly
      console.log("Promoter has the item/size. Proceeding with return.");
      await performReturn();
    }
  };

  // Handler for the warning dialog's confirm button
  const handleConfirmAnyways = async () => {
    console.log("User confirmed return despite warning.");
    setShowReturnWarning(false); // Close warning dialog
    await performReturn(); // Proceed with the return logic
  };

  if (!item) return null;

  // Find the selected size to display in circulation quantity
  const selectedSize = sizes.find(size => size.id === sizeId);
  const inCirculationQuantity = selectedSize ? selectedSize.in_circulation : 0;

  return (
    <>
      <Dialog open={!!item} onOpenChange={(open) => !open && !showReturnWarning && setReturningItem(null)}> 
        {/* Main Return Dialog Content */}
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
              onClick={handleConfirmReturn} // This now performs the check
              disabled={isSubmitting || !sizeId || !promoterId || quantity <= 0 || quantity > inCirculationQuantity}
            >
              {isSubmitting ? 'Wird gespeichert...' : 'Bestätigen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Render the Warning Dialog Conditionally */}
      <ReturnWarningDialog
        open={showReturnWarning}
        onClose={() => setShowReturnWarning(false)}
        onConfirm={handleConfirmAnyways}
      />
    </>
  );
} 