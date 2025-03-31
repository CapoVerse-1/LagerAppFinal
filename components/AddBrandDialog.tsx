import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload } from 'lucide-react'
import Image from "next/image"
import { useBrands } from '@/hooks/useBrands'
import { useToast } from '@/hooks/use-toast'

interface AddBrandDialogProps {
  showDialog: boolean;
  setShowDialog: (show: boolean) => void;
  onSuccess: () => void;
}

export default function AddBrandDialog({ showDialog, setShowDialog, onSuccess }: AddBrandDialogProps) {
  const [brandName, setBrandName] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addBrand } = useBrands()
  const { toast } = useToast()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setPreviewUrl(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleAdd = async () => {
    if (brandName.trim() === '') return;
    
    try {
      setIsSubmitting(true)
      await addBrand(brandName, logoFile)
      resetForm()
      setShowDialog(false)
      onSuccess()
      toast({
        title: "Marke hinzugefügt",
        description: "Die Marke wurde erfolgreich hinzugefügt."
      })
    } catch (error) {
      console.error('Error adding brand:', error)
      toast({
        title: "Fehler",
        description: "Die Marke konnte nicht hinzugefügt werden.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setBrandName('')
    setLogoFile(null)
    setPreviewUrl(null)
  }

  const handleClose = () => {
    resetForm()
    setShowDialog(false)
  }

  return (
    <Dialog open={showDialog} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neue Marke hinzufügen</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="brandName" className="text-right">
              Name
            </Label>
            <Input
              id="brandName"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="brandLogo" className="text-right">
              Logo
            </Label>
            <div className="col-span-3">
              <Input
                id="brandLogo"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                ref={fileInputRef}
              />
              <Button 
                onClick={() => fileInputRef.current?.click()} 
                className="w-full"
                type="button"
              >
                <Upload className="mr-2 h-4 w-4" /> Logo hochladen
              </Button>
              <p className="text-xs text-gray-500 mt-1 text-center">Optional</p>
            </div>
          </div>
          {previewUrl && (
            <div className="mt-2 flex justify-center">
              <Image
                src={previewUrl}
                alt="Vorschau"
                width={100}
                height={100}
                className="object-contain"
              />
            </div>
          )}
        </div>
        <Button 
          onClick={handleAdd} 
          disabled={isSubmitting || brandName.trim() === ''}
        >
          {isSubmitting ? 'Wird hinzugefügt...' : 'Marke hinzufügen'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}

