"use client";

import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload } from 'lucide-react'
import Image from "next/image"
import { toast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { usePromoters, PromoterWithDetails } from '@/hooks/usePromoters'
import { useToast } from '@/hooks/use-toast'

interface EditPromoterDialogProps {
  promoter: PromoterWithDetails | null;
  setEditingPromoter: (promoter: PromoterWithDetails | null) => void;
  onUpdate?: () => void;
}

export default function EditPromoterDialog({ promoter, setEditingPromoter, onUpdate }: EditPromoterDialogProps) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [clothingSize, setClothingSize] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [photoFile, setPhotoFile] = useState<File | undefined>(undefined)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { updatePromoterDetails } = usePromoters()
  const { toast: useToastToast } = useToast()

  useEffect(() => {
    if (promoter) {
      setName(promoter.name || '')
      setAddress(promoter.address || '')
      setClothingSize(promoter.clothing_size || '')
      setPhoneNumber(promoter.phone_number || '')
      setNotes(promoter.notes || '')
      setPhotoPreview(promoter.photo_url || null)
      setPhotoFile(undefined)
    }
  }, [promoter])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => setPhotoPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!promoter) return;
    
    setIsSubmitting(true)

    try {
      await updatePromoterDetails(
        promoter.id,
        name,
        photoFile,
        address || null,
        clothingSize || null,
        phoneNumber || null,
        notes || null
      )
      setEditingPromoter(null)
      onUpdate?.()
      useToastToast({
        title: "Success",
        description: "Promoter has been updated successfully.",
      })
    } catch (error) {
      console.error('Error updating promoter:', error)
      useToastToast({
        title: "Error",
        description: "Failed to update promoter. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!promoter) return null;

  return (
    <Dialog open={!!promoter} onOpenChange={() => setEditingPromoter(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Promoter bearbeiten</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clothingSize">Kleidungsgröße</Label>
            <Input
              id="clothingSize"
              value={clothingSize}
              onChange={(e) => setClothingSize(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Telefonnummer</Label>
            <Input
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notizen</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="image">Bild</Label>
            <div className="flex items-center gap-2">
              <Input
                id="image"
                type="file"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
              />
              <Button
                type="button"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.click()
                  }
                }}
              >
                <Upload className="mr-2 h-4 w-4" /> Bild hochladen
              </Button>
            </div>
            {photoPreview && (
              <div className="mt-2">
                <Image
                  src={photoPreview}
                  alt="Preview"
                  width={100}
                  height={100}
                  className="rounded-md"
                />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingPromoter(null)}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Wird gespeichert...' : 'Speichern'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

