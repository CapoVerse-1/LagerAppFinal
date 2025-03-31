"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from 'lucide-react';
import Image from "next/image";
import { useToast } from '@/hooks/use-toast';
import { useItems } from '@/hooks/useItems';

interface Item {
  id: string;
  name: string;
  product_id: string;
  image_url: string | null;
  original_quantity: number;
  is_shared?: boolean;
  brand_id?: string;
  sizes?: Array<{ size: string; quantity: number }>;
}

interface ConfirmSharedItemDialogProps {
  item: Item | null;
  brandId: string;
  onConfirm: (item: Item) => void;
  onCancel: () => void;
}

export default function ConfirmSharedItemDialog({ 
  item, 
  brandId,
  onConfirm, 
  onCancel
}: ConfirmSharedItemDialogProps) {
  const { toast } = useToast();
  const { addSharedItem } = useItems(brandId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  if (!item) return null;

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      
      // Add the shared item
      await addSharedItem(item, item.sizes);
      
      onConfirm(item);
      
      toast({
        title: "Erfolg",
        description: `Der geteilte Artikel "${item.name}" wurde erfolgreich hinzugefügt.`,
      });
    } catch (error) {
      console.error("Error confirming shared item:", error);
      toast({
        title: "Fehler",
        description: "Der geteilte Artikel konnte nicht hinzugefügt werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={!!item} onOpenChange={() => !isSubmitting && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Geteilten Artikel bestätigen</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Name</Label>
            <div className="col-span-3">{item.name}</div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Produkt-ID</Label>
            <div className="col-span-3">{item.product_id}</div>
          </div>
          {item.sizes && item.sizes.length > 0 && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Größen</Label>
              <div className="col-span-3">
                {item.sizes.map((size, index) => (
                  <div key={index} className="mb-1">
                    {size.size}: {size.quantity}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Bild</Label>
            <div className="col-span-3">
              <Image
                src={item.image_url || "/placeholder.svg"}
                alt="Artikelbild"
                width={100}
                height={100}
                className="object-contain"
              />
            </div>
          </div>
          <div className="py-2 text-sm text-gray-600">
            <p>Dieser Artikel wird mit anderen Marken geteilt. Wenn das Inventar in einer Marke aktualisiert wird, werden die Änderungen in allen Marken, die diesen Artikel verwenden, übernommen.</p>
            {item.is_shared && (
              <p className="mt-2 font-medium text-blue-600">
                Dieser Artikel ist bereits als geteilter Artikel markiert.
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Abbrechen
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wird hinzugefügt...
              </>
            ) : (
              "Hinzufügen"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
