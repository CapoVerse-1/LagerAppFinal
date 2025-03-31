"use client";

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUser } from '../contexts/UserContext'
import { useToast } from '@/hooks/use-toast'
import { recordBurn } from '@/lib/api/transactions'
import { fetchItemSizes, ItemSize } from '@/lib/api/items'
import PromoterSelector from './PromoterSelector'

interface BurnItemDialogProps {
  item: any;
  setBurningItem: (item: any | null) => void;
  onSuccess?: () => void;
}

export default function BurnItemDialog({
  item,
  setBurningItem,
  onSuccess
}: BurnItemDialogProps) {
  const { currentUser } = useUser();
  const { toast } = useToast();
  const [burnQuantity, setBurnQuantity] = useState(1)
  const [promoterId, setPromoterId] = useState("")
  const [sizeId, setSizeId] = useState("")
  const [sizes, setSizes] = useState<ItemSize[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notes, setNotes] = useState("")

  // Fetch item sizes
  useEffect(() => {
    const fetchSizes = async () => {
      if (item && item.id) {
        try {
          const itemSizes = await fetchItemSizes(item.id);
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

  const handleConfirmBurn = async () => {
    console.log('BurnItemDialog - handleConfirmBurn called');
    console.log('BurnItemDialog - item:', item);
    console.log('BurnItemDialog - sizeId:', sizeId);
    console.log('BurnItemDialog - promoterId:', promoterId);
    console.log('BurnItemDialog - burnQuantity:', burnQuantity);
    console.log('BurnItemDialog - currentUser:', currentUser);
    
    if (!currentUser) {
      console.log('BurnItemDialog - No current user found');
      toast({
        title: "Authentication Error",
        description: "You need to be logged in to perform this action. Please refresh the page and try again.",
        variant: "destructive",
      });
      return;
    }
    
    if (!item || !sizeId || !promoterId || burnQuantity <= 0) {
      console.log('BurnItemDialog - Validation failed');
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('BurnItemDialog - Starting burn process');
      setIsSubmitting(true);
      
      await recordBurn({
        itemId: item.id,
        itemSizeId: sizeId,
        quantity: burnQuantity,
        promoterId: promoterId,
        employeeId: currentUser.id,
        notes: notes
      });
      
      console.log('BurnItemDialog - Burn successful');
      toast({
        title: "Success",
        description: "Item burned successfully.",
      });
      
      if (onSuccess) {
        console.log('BurnItemDialog - Calling onSuccess callback');
        onSuccess();
      }
      
      setBurningItem(null);
    } catch (error) {
      console.error("Error burning item:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to burn item. Please try again.",
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
    <Dialog open={!!item} onOpenChange={() => setBurningItem(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Artikel als verloren/beschädigt markieren</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="burnItem" className="text-right">Artikel</Label>
            <div className="col-span-3">
              <p>{item.name || item.product_id}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="burnSize" className="text-right">Größe</Label>
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
            <Label htmlFor="burnQuantity" className="text-right">Menge</Label>
            <Input
              id="burnQuantity"
              type="number"
              min="1"
              max={inCirculationQuantity}
              value={burnQuantity}
              onChange={(e) => setBurnQuantity(parseInt(e.target.value) || 0)}
              className="col-span-3"
            />
            {selectedSize && (
              <div className="col-span-4 text-right text-sm text-muted-foreground">
                Im Umlauf: {inCirculationQuantity}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="burnPromoter" className="text-right">Promoter</Label>
            <div className="col-span-3">
              <PromoterSelector 
                value={promoterId} 
                onChange={setPromoterId} 
                placeholder="Promoter auswählen"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="burnNotes" className="text-right">Notizen</Label>
            <Input
              id="burnNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional: Grund für Verlust/Beschädigung"
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setBurningItem(null)}>Abbrechen</Button>
          <Button 
            onClick={() => {
              console.log('BurnItemDialog - Confirm button clicked');
              handleConfirmBurn();
            }} 
            disabled={isSubmitting || !sizeId || !promoterId || burnQuantity <= 0 || burnQuantity > inCirculationQuantity}
          >
            {isSubmitting ? 'Wird gespeichert...' : 'Bestätigen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

