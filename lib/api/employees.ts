import { supabase } from '../supabase';
import { Employee, CreateEmployeeData, UpdateEmployeeData } from '@/types/employee';

/**
 * Fetch all employees from the database
 * @returns Promise with array of employees
 */
export async function fetchEmployees(): Promise<Employee[]> {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('full_name');

    if (error) {
      console.error('Error fetching employees:', error);
      throw new Error(error.message);
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchEmployees:', error);
    throw error;
  }
}

/**
 * Create a new employee
 * @param employeeData Employee data to create
 * @returns Promise with the created employee
 */
export async function createEmployee(employeeData: CreateEmployeeData): Promise<Employee> {
  try {
    // Check if user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error('Authentication required');
    }

    const { data, error } = await supabase
      .from('employees')
      .insert([employeeData])
      .select()
      .single();

    if (error) {
      console.error('Error creating employee:', error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error('Error in createEmployee:', error);
    throw error;
  }
}

/**
 * Update an existing employee
 * @param id Employee ID
 * @param employeeData Updated employee data
 * @returns Promise with the updated employee
 */
export async function updateEmployee(id: string, employeeData: UpdateEmployeeData): Promise<Employee> {
  try {
    // Check if user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error('Authentication required');
    }

    const { data, error } = await supabase
      .from('employees')
      .update(employeeData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating employee:', error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error('Error in updateEmployee:', error);
    throw error;
  }
}

/**
 * Toggle employee active status
 * @param id Employee ID
 * @param isActive New active status
 * @returns Promise with the updated employee
 */
export async function toggleEmployeeStatus(id: string, isActive: boolean): Promise<Employee> {
  return updateEmployee(id, { is_active: isActive });
}

/**
 * Delete an employee
 * @param id Employee ID
 * @returns Promise with success status
 */
export async function deleteEmployee(id: string): Promise<void> {
  try {
    // Check if user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error('Authentication required');
    }

    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting employee:', error);
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Error in deleteEmployee:', error);
    throw error;
  }
} 