import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useUser } from '../contexts/UserContext'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from '@/hooks/use-toast'
import { recordRestock } from '@/lib/api/transactions'
import { fetchItemSizes } from '@/lib/api/items'

// Define the structure of the item with sizes
interface ItemSize {
  size: string;
  quantity: number;
}

interface ItemWithSizes {
  id: string;
  name: string;
  productId: string;
  brand: string;
  sizes: ItemSize[];
  [key: string]: any; // Allow other properties
}

interface RestockQuantityDialogProps {
  item: any;
  showDialog: boolean;
  setShowDialog: (show: boolean) => void;
  onSuccess?: () => void;
}

export default function RestockQuantityDialog({ 
  item, 
  showDialog, 
  setShowDialog, 
  onSuccess 
}: RestockQuantityDialogProps) {
  const { currentUser } = useUser();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [sizes, setSizes] = useState<any[]>([]);
  const [selectedSizeId, setSelectedSizeId] = useState("");

  // Fetch item sizes when item changes
  useEffect(() => {
    const fetchSizes = async () => {
      if (item && item.id) {
        try {
          const itemSizes = await fetchItemSizes(item.id);
          setSizes(itemSizes);
          if (itemSizes.length === 1) {
            setSelectedSizeId(itemSizes[0].id);
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
    
    if (showDialog) {
      fetchSizes();
    }
  }, [item, showDialog, toast]);

  const handleConfirmRestock = async () => {
    console.log('RestockQuantityDialog - handleConfirmRestock called');
    console.log('RestockQuantityDialog - item:', item);
    console.log('RestockQuantityDialog - selectedSizeId:', selectedSizeId);
    console.log('RestockQuantityDialog - quantity:', quantity);
    console.log('RestockQuantityDialog - currentUser:', currentUser);
    
    if (!currentUser) {
      console.log('RestockQuantityDialog - No current user found');
      toast({
        title: "Authentication Error",
        description: "You need to be logged in to perform this action. Please refresh the page and try again.",
        variant: "destructive",
      });
      return;
    }
    
    if (!item || !selectedSizeId || quantity <= 0) {
      console.log('RestockQuantityDialog - Validation failed');
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('RestockQuantityDialog - Starting restock process');
      setIsSubmitting(true);
      
      await recordRestock({
        itemId: item.id,
        itemSizeId: selectedSizeId,
        quantity: quantity,
        employeeId: currentUser.id,
        notes: notes
      });
      
      console.log('RestockQuantityDialog - Restock successful');
      toast({
        title: "Success",
        description: "Inventory restocked successfully.",
      });
      
      if (onSuccess) {
        console.log('RestockQuantityDialog - Calling onSuccess callback');
        onSuccess();
      }
      
      setShowDialog(false);
    } catch (error) {
      console.error("Error restocking inventory:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to restock inventory. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onCancel = () => {
    setShowDialog(false);
  };

  // If item is null, don't render the dialog content
  if (!item) return null;

  return (
    <Dialog open={showDialog} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lagerbestand auffüllen für {item.name}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="size" className="text-right">
              Größe
            </Label>
            <Select 
              value={selectedSizeId} 
              onValueChange={setSelectedSizeId}
            >
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
            <Label htmlFor="quantity" className="text-right">
              Menge
            </Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              min={1}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="text-right">
              Notizen
            </Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional: Zusätzliche Informationen"
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Abbrechen</Button>
          <Button 
            onClick={() => {
              console.log('RestockQuantityDialog - Confirm button clicked');
              handleConfirmRestock();
            }} 
            disabled={isSubmitting || quantity <= 0 || !selectedSizeId}
          >
            {isSubmitting ? 'Wird gespeichert...' : 'Bestätigen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

