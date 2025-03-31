"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  fetchEmployees, 
  createEmployee, 
  updateEmployee, 
  toggleEmployeeStatus, 
  deleteEmployee 
} from '@/lib/api/employees';
import { Employee, CreateEmployeeData, UpdateEmployeeData } from '@/types/employee';
import { useToast } from '@/hooks/use-toast';

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch all employees
  const loadEmployees = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchEmployees();
      setEmployees(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load employees');
      toast({
        title: 'Error',
        description: 'Failed to load employees',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Create a new employee
  const addEmployee = useCallback(async (employeeData: CreateEmployeeData) => {
    setIsLoading(true);
    setError(null);
    try {
      const newEmployee = await createEmployee(employeeData);
      setEmployees(prev => [...prev, newEmployee]);
      toast({
        title: 'Success',
        description: 'Employee created successfully',
      });
      return newEmployee;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create employee');
      toast({
        title: 'Error',
        description: 'Failed to create employee',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Update an employee
  const editEmployee = useCallback(async (id: string, employeeData: UpdateEmployeeData) => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedEmployee = await updateEmployee(id, employeeData);
      setEmployees(prev => 
        prev.map(employee => 
          employee.id === id ? updatedEmployee : employee
        )
      );
      toast({
        title: 'Success',
        description: 'Employee updated successfully',
      });
      return updatedEmployee;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update employee');
      toast({
        title: 'Error',
        description: 'Failed to update employee',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Toggle employee active status
  const toggleActive = useCallback(async (id: string, isActive: boolean) => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedEmployee = await toggleEmployeeStatus(id, isActive);
      setEmployees(prev => 
        prev.map(employee => 
          employee.id === id ? updatedEmployee : employee
        )
      );
      toast({
        title: 'Success',
        description: `Employee ${isActive ? 'activated' : 'deactivated'} successfully`,
      });
      return updatedEmployee;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update employee status');
      toast({
        title: 'Error',
        description: 'Failed to update employee status',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Delete an employee
  const removeEmployee = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await deleteEmployee(id);
      setEmployees(prev => prev.filter(employee => employee.id !== id));
      toast({
        title: 'Success',
        description: 'Employee deleted successfully',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete employee');
      toast({
        title: 'Error',
        description: 'Failed to delete employee',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Load employees on component mount
  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  return {
    employees,
    isLoading,
    error,
    loadEmployees,
    addEmployee,
    editEmployee,
    toggleActive,
    removeEmployee,
  };
} 