"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
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
import { Promoter } from '@/lib/api/promoters';
import { Loader2 } from 'lucide-react';

// Define the structure for promoter items if not already defined
interface PromoterItem {
  item_id: string;
  item_size_id: string;
  promoter_id: string;
  quantity: number;
  // Optional fields for display in warning - might need fetching/joining if not present
  promoter_name?: string;
  // Add other relevant fields if needed, like name, size string etc.
  // These might need to be fetched/joined if promoterItems only has IDs
}

interface ReturnDialogProps {
  item: any; // Consider using a more specific type like ItemWithSizeCount
  setReturningItem: (item: any | null) => void; // Use specific type
  onSuccess?: () => void;
  promoterItems: PromoterItem[]; // Add promoterItems prop
  promoters: Promoter[]; // Add promoters prop type
}

export default function ReturnDialog({
  item,
  setReturningItem,
  onSuccess,
  promoterItems,
  promoters
}: ReturnDialogProps) {
  const { currentUser } = useUser();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [promoterId, setPromoterId] = useState("");
  const [sizeId, setSizeId] = useState("");
  const [sizes, setSizes] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [inCirculationQuantity, setInCirculationQuantity] = useState(0);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [promoterNameForWarning, setPromoterNameForWarning] = useState<string>("");

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
            setInCirculationQuantity(itemSizes[0].in_circulation || 0);
          } else {
            // Reset if multiple sizes exist and none is selected
            setSizeId("");
            setInCirculationQuantity(0);
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

  // Update inCirculation when size changes
  useEffect(() => {
    const selectedSize = sizes.find(s => s.id === sizeId);
    setInCirculationQuantity(selectedSize ? selectedSize.in_circulation : 0);
  }, [sizeId, sizes]);

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

  const handleReturn = async () => {
    if (!promoterId) { 
      toast({ title: "Error", description: "Please select a promoter.", variant: "destructive" });
      return;
    }
    if (!sizeId) {
      toast({ title: "Error", description: "Please select a size.", variant: "destructive" });
      return;
    }
    if (quantity <= 0) {
      toast({ title: "Error", description: "Quantity must be greater than 0.", variant: "destructive" });
      return;
    }

    const promoterItem = promoterItems.find(
      pItem => pItem.promoter_id === promoterId && 
               pItem.item_id === item.id && 
               pItem.item_size_id === sizeId && 
               pItem.quantity > 0
    );

    if (!promoterItem) {
      // Find promoter name using the passed promoters array
      const selectedPromoter = promoters.find(p => p.id === promoterId); 
      setPromoterNameForWarning(selectedPromoter?.name || `ID: ${promoterId}`);
      setShowWarningDialog(true); // Show warning
    } else {
      await forceReturn(); // Proceed directly if item is found
    }
  };
  
  const forceReturn = async () => {
    if (!promoterId || !sizeId || quantity <= 0) { // Re-validate just in case
      console.error("Invalid state in forceReturn");
      return;
    }

    setIsSubmitting(true);
    try {
      await recordReturn({
        itemId: item.id,
        itemSizeId: sizeId,
        quantity,
        promoterId: promoterId, // Use promoterId state variable
        employeeId: currentUser?.id || 'unknown' // Provide fallback
      });
      toast({
        title: "Success",
        description: "Item returned successfully.",
      });
      setReturningItem(null);
      onSuccess?.();
    } catch (error) {
      console.error("Error returning item:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast({
        title: "Error",
        description: `Failed to return item: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setShowWarningDialog(false);
    }
  };

  if (!item) return null;

  // Find the selected size to display in circulation quantity
  const selectedSize = sizes.find(size => size.id === sizeId);

  return (
    <>
      <Dialog open={!!item} onOpenChange={(open) => !open && !isSubmitting && setReturningItem(null)}>
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
              onClick={handleReturn}
              disabled={isSubmitting || !sizeId || !promoterId || quantity <= 0 || quantity > inCirculationQuantity}
            >
              {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Zurückgeben
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bestätigung erforderlich</AlertDialogTitle>
            <AlertDialogDescription>
              Laut System hat Promoter "{promoterNameForWarning}" den Artikel "{item?.name}" 
              (Größe: {sizes.find(s => s.id === sizeId)?.size || 'N/A'}) derzeit nicht im Inventar.
              Möchten Sie die Rückgabe trotzdem durchführen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowWarningDialog(false)}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={forceReturn} disabled={isSubmitting}>
              {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Trotzdem bestätigen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 