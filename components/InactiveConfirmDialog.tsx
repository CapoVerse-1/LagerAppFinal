import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export default function InactiveConfirmDialog({ showDialog, setShowDialog, promoter, onConfirm }) {
  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Promoter inaktiv setzen</DialogTitle>
        </DialogHeader>
        <p>
          {promoter?.name} hat noch aktive Artikel im Sortiment. 
          Möchten Sie wirklich fortfahren und den Promoter inaktiv setzen?
        </p>
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

