import { useState } from 'react';
import { exportAllTables, exportTables, importFromExcel, TableName } from '@/lib/excel';
import { toast } from 'sonner';

export function useDataManagement() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Export all tables
  const handleExportAll = async () => {
    try {
      setIsExporting(true);
      const blob = await exportAllTables();

      // Create download link
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `inventory_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast.success('Export successful', {
        description: 'All data has been exported to Excel.',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed', {
        description: error instanceof Error ? error.message : 'An error occurred during export',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Export specific tables
  const handleExportTables = async (tables: TableName[]) => {
    try {
      setIsExporting(true);
      const blob = await exportTables(tables);

      // Create download link
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${tables.join('_')}_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast.success('Export successful', {
        description: `Selected tables have been exported to Excel.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed', {
        description: error instanceof Error ? error.message : 'An error occurred during export',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Import data from Excel file
  const handleImport = async (file: File) => {
    try {
      setIsImporting(true);
      const result = await importFromExcel(file);

      if (result.success) {
        toast.success('Import successful', {
          description: result.message,
        });
      } else {
        toast.error('Import failed', {
          description: result.message,
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Import failed', {
        description: error instanceof Error ? error.message : 'An error occurred during import',
      });
    } finally {
      setIsImporting(false);
    }
  };

  return {
    isExporting,
    isImporting,
    handleExportAll,
    handleExportTables,
    handleImport,
  };
} 