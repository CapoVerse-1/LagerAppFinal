import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';
import { cn } from "@/lib/utils";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  itemName?: string;
  isDeleting?: boolean;
}

export default function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  isDeleting = false
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white">
        <div className="p-6">
          <div className="flex justify-between items-center mb-2">
            <DialogTitle className="text-xl font-medium">{title}</DialogTitle>
          </div>
          <p className="text-base text-gray-600 mt-2">
            {description}
            {itemName && <strong className="font-medium"> {itemName}</strong>}
          </p>
        </div>

        <div className="flex border-t p-4 bg-gray-50 gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-md"
          >
            Abbrechen
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-md bg-black hover:bg-gray-800 text-white"
          >
            {isDeleting ? 'Wird gelöscht...' : 'Bestätigen'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 