"use client";

import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload } from 'lucide-react'
import Image from "next/image"
import { useItems } from '@/hooks/useItems'
import { useToast } from '@/hooks/use-toast'

export default function EditItemDialog({ item, setEditingItem, brandId }) {
  const { updateItemDetails, refreshItems } = useItems(brandId);
  const { toast } = useToast();
  
  const [editedItem, setEditedItem] = useState(item || {})
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    setEditedItem(item || {})
    setImageFile(null)
  }, [item])

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setEditedItem(prev => ({ ...prev, image_preview: reader.result }))
      reader.readAsDataURL(file)
    }
  }

  const handleUpdate = async () => {
    try {
      setIsSubmitting(true)
      
      // Validate input
      if (!editedItem.name?.trim()) {
        toast({
          title: "Error",
          description: "Please enter a name for the item.",
          variant: "destructive",
        })
        return
      }
      
      if (!editedItem.product_id?.trim()) {
        toast({
          title: "Error",
          description: "Please enter a product ID for the item.",
          variant: "destructive",
        })
        return
      }
      
      // Update the item
      await updateItemDetails(
        item.id,
        editedItem.name,
        editedItem.product_id,
        imageFile || undefined
      )
      
      // Refresh items to get the latest data
      await refreshItems()
      
      // Close the dialog
      setEditingItem(null)
      
      toast({
        title: "Success",
        description: "Item updated successfully.",
      })
    } catch (error) {
      console.error("Error updating item:", error)
      toast({
        title: "Error",
        description: "Failed to update item. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!item) return null;

  return (
    <Dialog open={!!item} onOpenChange={() => setEditingItem(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Artikel bearbeiten</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="itemName" className="text-right">Name</Label>
            <Input
              id="itemName"
              value={editedItem.name || ''}
              onChange={(e) => setEditedItem({ ...editedItem, name: e.target.value })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="productId" className="text-right">Produkt-ID</Label>
            <Input
              id="productId"
              value={editedItem.product_id || ''}
              onChange={(e) => setEditedItem({ ...editedItem, product_id: e.target.value })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Bild</Label>
            <div className="col-span-3">
              <div className="flex items-center gap-4 mb-2">
                <div className="relative w-16 h-16 border rounded overflow-hidden">
                  <Image
                    src={editedItem.image_preview || editedItem.image_url || '/placeholder.svg'}
                    alt={editedItem.name || 'Item'}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <input
                  id="itemImage"
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  ref={fileInputRef}
                />
                <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                  <Upload className="mr-2 h-4 w-4" /> Bild ändern
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setEditingItem(null)}>Abbrechen</Button>
          <Button onClick={handleUpdate} disabled={isSubmitting}>
            {isSubmitting ? 'Speichern...' : 'Speichern'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

