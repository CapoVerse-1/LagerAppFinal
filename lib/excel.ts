import * as XLSX from 'xlsx';
import { supabase } from './supabase';

// Define table names that can be exported/imported
export type TableName = 'brands' | 'items' | 'item_sizes' | 'promoters' | 'transactions' | 'employees';

const TABLES: TableName[] = ['brands', 'items', 'item_sizes', 'promoters', 'transactions', 'employees'];

// Function to export all tables to an Excel file
export async function exportAllTables(): Promise<Blob> {
  const workbook = XLSX.utils.book_new();

  // Export each table to a separate sheet
  for (const table of TABLES) {
    const { data, error } = await supabase.from(table).select('*');
    if (error) {
      throw new Error(`Error fetching ${table}: ${error.message}`);
    }

    const worksheet = XLSX.utils.json_to_sheet(data || []);
    XLSX.utils.book_append_sheet(workbook, worksheet, table);
  }

  // Convert workbook to blob
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

// Function to export specific tables to an Excel file
export async function exportTables(tables: TableName[]): Promise<Blob> {
  const workbook = XLSX.utils.book_new();

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*');
    if (error) {
      throw new Error(`Error fetching ${table}: ${error.message}`);
    }

    const worksheet = XLSX.utils.json_to_sheet(data || []);
    XLSX.utils.book_append_sheet(workbook, worksheet, table);
  }

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

// Function to import data from Excel file
export async function importFromExcel(file: File): Promise<{ success: boolean; message: string }> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

    // Process each sheet/table in sequence
    for (const table of TABLES) {
      if (!workbook.SheetNames.includes(table)) {
        console.warn(`Sheet ${table} not found in Excel file`);
        continue;
      }

      const worksheet = workbook.Sheets[table];
      const data = XLSX.utils.sheet_to_json(worksheet);

      // Delete existing data
      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (deleteError) {
        throw new Error(`Error deleting data from ${table}: ${deleteError.message}`);
      }

      // Insert new data if there is any
      if (data.length > 0) {
        const { error: insertError } = await supabase
          .from(table)
          .insert(data);

        if (insertError) {
          throw new Error(`Error inserting data into ${table}: ${insertError.message}`);
        }
      }
    }

    return { success: true, message: 'Data imported successfully' };
  } catch (error) {
    console.error('Import error:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'An error occurred during import' 
    };
  }
} 