import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useDataManagement } from '@/hooks/useDataManagement';
import { TableName } from '@/lib/excel';

const AVAILABLE_TABLES: { name: TableName; label: string }[] = [
  { name: 'brands', label: 'Brands' },
  { name: 'items', label: 'Items' },
  { name: 'item_sizes', label: 'Item Sizes' },
  { name: 'promoters', label: 'Promoters' },
  { name: 'transactions', label: 'Transactions' },
  { name: 'employees', label: 'Employees' },
];

export default function ExportDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTables, setSelectedTables] = useState<TableName[]>([]);
  const { handleExportAll, handleExportTables, isExporting } = useDataManagement();

  const handleTableSelect = (table: TableName) => {
    setSelectedTables(prev =>
      prev.includes(table)
        ? prev.filter(t => t !== table)
        : [...prev, table]
    );
  };

  const handleExport = async () => {
    if (selectedTables.length === 0 || selectedTables.length === AVAILABLE_TABLES.length) {
      await handleExportAll();
    } else {
      await handleExportTables(selectedTables);
    }
    setIsOpen(false);
  };

  const handleSelectAll = () => {
    setSelectedTables(
      selectedTables.length === AVAILABLE_TABLES.length
        ? []
        : AVAILABLE_TABLES.map(t => t.name)
    );
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="outline">
        Export Data
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={selectedTables.length === AVAILABLE_TABLES.length}
                onClick={handleSelectAll}
              />
              <label
                htmlFor="select-all"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Select All Tables
              </label>
            </div>
            <div className="space-y-2">
              {AVAILABLE_TABLES.map(({ name, label }) => (
                <div key={name} className="flex items-center space-x-2">
                  <Checkbox
                    id={name}
                    checked={selectedTables.includes(name)}
                    onClick={() => handleTableSelect(name)}
                  />
                  <label
                    htmlFor={name}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {label}
                  </label>
                </div>
              ))}
            </div>
            <div className="text-sm text-muted-foreground">
              {selectedTables.length === 0
                ? 'Select tables to export or leave all unselected to export everything.'
                : `Selected ${selectedTables.length} table(s) for export.`}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? 'Exporting...' : 'Export'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 