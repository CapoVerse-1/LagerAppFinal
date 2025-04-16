"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ReturnWarningDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ReturnWarningDialog({
  open,
  onClose,
  onConfirm,
}: ReturnWarningDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-yellow-500" />
            Bestätigung erforderlich
          </DialogTitle>
          <DialogDescription className="py-4">
            Der ausgewählte Promoter hat diesen Artikel (in dieser Größe) aktuell nicht in seinem Inventar.
            Möchten Sie die Rückgabe trotzdem durchführen?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
          </DialogClose>
          <Button
            onClick={() => {
              onConfirm();
              onClose(); // Close the dialog after confirming
            }}
            variant="destructive" // Use destructive variant for caution
          >
            Trotzdem bestätigen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 