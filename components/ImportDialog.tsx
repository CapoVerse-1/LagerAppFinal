import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useDataManagement } from '@/hooks/useDataManagement';
import { AlertTriangle } from 'lucide-react';

export default function ImportDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { handleImport, isImporting } = useDataManagement();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmImport = async () => {
    if (selectedFile) {
      await handleImport(selectedFile);
      setShowConfirmDialog(false);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="outline">
        Import Data
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                onChange={handleFileSelect}
                disabled={isImporting}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Please select an Excel file (.xlsx) containing the data to import.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Confirm Data Import
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This action will replace all existing data in the database with the data from the selected file. This cannot be undone.
            </p>
            <p className="text-sm font-medium">
              Selected file: {selectedFile?.name}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isImporting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmImport}
              disabled={isImporting}
            >
              {isImporting ? 'Importing...' : 'Confirm Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

