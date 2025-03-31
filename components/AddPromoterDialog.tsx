import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload } from 'lucide-react'
import Image from "next/image"
import { usePromoters } from '@/hooks/usePromoters'
import { useToast } from '@/hooks/use-toast'
import { Textarea } from "@/components/ui/textarea"

interface AddPromoterDialogProps {
  showDialog: boolean;
  setShowDialog: (show: boolean) => void;
  onSuccess?: () => void;
}

export default function AddPromoterDialog({ showDialog, setShowDialog, onSuccess }: AddPromoterDialogProps) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [clothingSize, setClothingSize] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef(null)
  const { addPromoter } = usePromoters()
  const { toast } = useToast()

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      setPhotoFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => setPhotoPreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await addPromoter(name, photoFile, address, clothingSize, phoneNumber, notes)
      setName('')
      setAddress('')
      setClothingSize('')
      setPhoneNumber('')
      setNotes('')
      setPhotoFile(null)
      setPhotoPreview(null)
      setShowDialog(false)
      onSuccess?.()
      toast({
        title: "Success",
        description: "Promoter has been added successfully.",
      })
    } catch (error) {
      console.error('Error adding promoter:', error)
      toast({
        title: "Error",
        description: "Failed to add promoter. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neuen Promoter hinzufügen</DialogTitle>
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
                className="hidden"
                ref={fileInputRef}
              />
              <Button
                type="button"
                onClick={() => fileInputRef.current.click()}
              >
                <Upload className="mr-2 h-4 w-4" /> Bild hochladen
              </Button>
            </div>
          </div>
          {photoPreview && (
            <div className="mt-2">
              <Image
                src={photoPreview}
                alt="Vorschau"
                width={100}
                height={100}
                className="object-contain"
              />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDialog(false)}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Wird hinzugefügt...' : 'Hinzufügen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

