"use client";

import { useState } from 'react';
import { useEmployees } from '@/hooks/useEmployees';
import { Employee, CreateEmployeeData, UpdateEmployeeData } from '@/types/employee';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2, Plus, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react';

export default function EmployeeManagement() {
  const { 
    employees, 
    isLoading, 
    error, 
    loadEmployees, 
    addEmployee, 
    editEmployee, 
    toggleActive, 
    removeEmployee 
  } = useEmployees();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [newEmployee, setNewEmployee] = useState<CreateEmployeeData>({ full_name: '', initials: '' });
  const [editedEmployee, setEditedEmployee] = useState<UpdateEmployeeData>({ full_name: '', initials: '' });

  // Handle adding a new employee
  const handleAddEmployee = async () => {
    try {
      await addEmployee(newEmployee);
      setNewEmployee({ full_name: '', initials: '' });
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Failed to add employee:', error);
    }
  };

  // Handle editing an employee
  const handleEditEmployee = async () => {
    if (!selectedEmployee) return;
    
    try {
      await editEmployee(selectedEmployee.id, editedEmployee);
      setSelectedEmployee(null);
      setEditedEmployee({ full_name: '', initials: '' });
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to edit employee:', error);
    }
  };

  // Handle toggling employee active status
  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await toggleActive(id, isActive);
    } catch (error) {
      console.error('Failed to toggle employee status:', error);
    }
  };

  // Handle deleting an employee
  const handleDeleteEmployee = async (id: string) => {
    try {
      await removeEmployee(id);
    } catch (error) {
      console.error('Failed to delete employee:', error);
    }
  };

  // Open edit dialog with employee data
  const openEditDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEditedEmployee({
      full_name: employee.full_name,
      initials: employee.initials,
    });
    setIsEditDialogOpen(true);
  };

  if (error) {
    return (
      <div className="p-4 text-red-500">
        <p>Error loading employees: {error}</p>
        <Button onClick={loadEmployees} variant="outline" className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Employee Management</span>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
                <DialogDescription>
                  Create a new employee with their full name and initials.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="full_name" className="text-right">
                    Full Name
                  </Label>
                  <Input
                    id="full_name"
                    value={newEmployee.full_name}
                    onChange={(e) => setNewEmployee({ ...newEmployee, full_name: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="initials" className="text-right">
                    Initials
                  </Label>
                  <Input
                    id="initials"
                    value={newEmployee.initials}
                    onChange={(e) => setNewEmployee({ ...newEmployee, initials: e.target.value })}
                    className="col-span-3"
                    maxLength={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddEmployee}>
                  Add Employee
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardTitle>
        <CardDescription>
          Manage employees who can access the inventory system.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Initials</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No employees found. Add your first employee to get started.
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((employee) => (
                  <TableRow key={employee.id} className={!employee.is_active ? "opacity-60" : ""}>
                    <TableCell>{employee.full_name}</TableCell>
                    <TableCell>{employee.initials}</TableCell>
                    <TableCell>
                      {employee.is_active ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(employee)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleActive(employee.id, !employee.is_active)}
                      >
                        {employee.is_active ? (
                          <XCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {employee.full_name}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteEmployee(employee.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Edit Employee Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>
              Update employee information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_full_name" className="text-right">
                Full Name
              </Label>
              <Input
                id="edit_full_name"
                value={editedEmployee.full_name}
                onChange={(e) => setEditedEmployee({ ...editedEmployee, full_name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_initials" className="text-right">
                Initials
              </Label>
              <Input
                id="edit_initials"
                value={editedEmployee.initials}
                onChange={(e) => setEditedEmployee({ ...editedEmployee, initials: e.target.value })}
                className="col-span-3"
                maxLength={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditEmployee}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
} 