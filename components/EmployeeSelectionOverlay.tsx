"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Plus, Loader2 } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useEmployees } from '@/hooks/useEmployees';
import { Employee, CreateEmployeeData } from '@/types/employee';
import { useAuth } from '@/contexts/AuthContext';

export default function EmployeeSelectionOverlay() {
  const { currentUser, setCurrentUser } = useUser();
  const { user, isLoading: authLoading } = useAuth();
  const { 
    employees, 
    isLoading, 
    error, 
    addEmployee 
  } = useEmployees();
  
  const [newEmployee, setNewEmployee] = useState<CreateEmployeeData>({ full_name: "", initials: "" });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // If authentication is still loading or there's no authenticated user, don't show the overlay
  if (authLoading || !user) {
    return null;
  }

  // If there's a current user selected, don't show the overlay
  if (currentUser) {
    return null;
  }

  const handleAddEmployee = async () => {
    if (newEmployee.full_name && newEmployee.initials) {
      try {
        const employee = await addEmployee(newEmployee);
        setCurrentUser({
          id: employee.id,
          name: employee.full_name,
          initials: employee.initials
        });
        setNewEmployee({ full_name: "", initials: "" });
        setIsAddDialogOpen(false);
      } catch (error) {
        console.error('Failed to add employee:', error);
      }
    }
  };

  const handleSelectEmployee = (employee: Employee) => {
    setCurrentUser({
      id: employee.id,
      name: employee.full_name,
      initials: employee.initials
    });
  };

  return (
    <>
      {/* Overlay that covers the entire screen */}
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-auto">
          <h2 className="text-xl font-bold mb-4">Mitarbeiter auswählen</h2>
          <p className="text-gray-600 mb-6">
            Bitte wählen Sie einen Mitarbeiter aus oder fügen Sie einen neuen hinzu, 
            um mit der Anwendung fortzufahren.
          </p>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Mitarbeiter werden geladen...</span>
            </div>
          ) : error ? (
            <div className="text-red-500 p-2 text-sm">{error}</div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
              {employees && employees.length > 0 ? (
                employees.map((employee) => (
                  <Button
                    key={employee.id}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-3"
                    onClick={() => handleSelectEmployee(employee)}
                  >
                    <span>{employee.full_name} ({employee.initials})</span>
                  </Button>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  Keine Mitarbeiter gefunden. Bitte fügen Sie einen neuen Mitarbeiter hinzu.
                </div>
              )}
            </div>
          )}
          
          <Button 
            className="w-full" 
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Neuen Mitarbeiter hinzufügen
          </Button>
        </div>
      </div>

      {/* Dialog for adding a new employee */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuen Mitarbeiter hinzufügen</DialogTitle>
            <DialogDescription>
              Fügen Sie einen neuen Mitarbeiter hinzu, um mit der Anwendung fortzufahren.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newEmployee.full_name}
                onChange={(e) => setNewEmployee(prev => ({ ...prev, full_name: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="initials" className="text-right">
                Initialen
              </Label>
              <Input
                id="initials"
                value={newEmployee.initials}
                onChange={(e) => setNewEmployee(prev => ({ ...prev, initials: e.target.value }))}
                className="col-span-3"
                maxLength={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddEmployee}>Hinzufügen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 