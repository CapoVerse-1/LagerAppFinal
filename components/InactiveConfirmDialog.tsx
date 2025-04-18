import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { PromoterWithDetails } from '@/hooks/usePromoters'

interface InactiveConfirmDialogProps {
  showDialog: boolean;
  setShowDialog: (show: boolean) => void;
  promoter: PromoterWithDetails | null;
  onConfirm: () => void;
}

export default function InactiveConfirmDialog({
  showDialog, 
  setShowDialog, 
  promoter, 
  onConfirm 
}: InactiveConfirmDialogProps) {
  const descriptionId = "inactive-confirm-description";

  if (!promoter) return null;

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent aria-describedby={descriptionId}>
        <DialogHeader>
          <DialogTitle>Promoter inaktiv setzen</DialogTitle>
          <DialogDescription id={descriptionId}>
            {promoter.name} hat noch aktive Artikel im Sortiment. 
            Möchten Sie wirklich fortfahren und den Promoter inaktiv setzen?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDialog(false)}>Abbrechen</Button>
          <Button onClick={() => {
            onConfirm()
            setShowDialog(false)
          }}>
            Bestätigen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

