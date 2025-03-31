"use client";

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { UserCircle, Plus, Edit, Trash, Loader2, LogOut } from 'lucide-react'
import { useUser } from '../contexts/UserContext'
import { useEmployees } from '@/hooks/useEmployees'
import { Employee, CreateEmployeeData } from '@/types/employee'
import Image from 'next/image';

export function ProfileMenu() {
  const { currentUser, setCurrentUser } = useUser();
  const { 
    employees, 
    isLoading, 
    error, 
    addEmployee, 
    editEmployee, 
    toggleActive, 
    removeEmployee 
  } = useEmployees();
  
  const [newEmployee, setNewEmployee] = useState<CreateEmployeeData>({ full_name: "", initials: "" });
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [open, setOpen] = useState(false);

  const handleAddEmployee = async () => {
    if (newEmployee.full_name && newEmployee.initials) {
      try {
        await addEmployee(newEmployee);
        setNewEmployee({ full_name: "", initials: "" });
        setIsAddDialogOpen(false);
      } catch (error) {
        console.error('Failed to add employee:', error);
      }
    }
  };

  const handleEditEmployee = async () => {
    if (editingEmployee) {
      try {
        await editEmployee(editingEmployee.id, {
          full_name: editingEmployee.full_name,
          initials: editingEmployee.initials
        });
        
        if (currentUser && currentUser.id === editingEmployee.id) {
          setCurrentUser({
            id: editingEmployee.id,
            name: editingEmployee.full_name,
            initials: editingEmployee.initials
          });
        }
        
        setEditingEmployee(null);
        setIsEditDialogOpen(false);
      } catch (error) {
        console.error('Failed to update employee:', error);
      }
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    try {
      await removeEmployee(employeeId);
      if (currentUser && currentUser.id === employeeId) {
        setCurrentUser(null);
      }
    } catch (error) {
      console.error('Failed to delete employee:', error);
    }
  };

  const handleSelectEmployee = (employee: Employee) => {
    setCurrentUser({
      id: employee.id,
      name: employee.full_name,
      initials: employee.initials
    });
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2 px-2"
          >
            <div className={`relative h-[32px] w-[32px] rounded-full p-0.5 ${
              currentUser ? 'ring-2 ring-gray-400 ring-offset-2' : ''
            } data-[state=open]:ring-2 data-[state=open]:ring-gray-400 data-[state=open]:ring-offset-2`}
            data-state={open ? 'open' : 'closed'}
            >
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/svg-38fOfeNBPMG9hFw51EYqXMuwhsJK2Y.svg"
                alt="User Profile"
                width={32}
                height={32}
                className="h-full w-full rounded-full"
              />
              {currentUser && (
                <span className="absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full bg-green-500 border-[1px] border-white" />
              )}
            </div>
            {currentUser ? (
              <span className="font-medium text-sm hidden md:inline-block">
                {currentUser.name}
              </span>
            ) : (
              <span className="font-medium text-sm text-red-500 hidden md:inline-block">
                Kein Mitarbeiter ausgewählt
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5 text-sm font-medium text-center border-b">
            Mitarbeiter für diese Sitzung
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="ml-2">Loading...</span>
            </div>
          ) : error ? (
            <div className="text-red-500 p-2 text-sm">{error}</div>
          ) : employees && employees.length > 0 ? (
            employees.map((employee) => (
              <DropdownMenuItem
                key={employee.id}
                onSelect={() => handleSelectEmployee(employee)}
              >
                <span className="flex-grow">
                  {employee.full_name}
                  {currentUser?.id === employee.id && " ✓"}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingEmployee(employee);
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteEmployee(employee.id);
                  }}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem disabled>No employees found</DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Mitarbeiter hinzufügen
          </DropdownMenuItem>
          {currentUser && (
            <DropdownMenuItem onSelect={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Abmelden
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuen Mitarbeiter hinzufügen</DialogTitle>
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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mitarbeiter bearbeiten</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-name"
                value={editingEmployee?.full_name || ""}
                onChange={(e) => setEditingEmployee(prev => prev ? {...prev, full_name: e.target.value} : null)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-initials" className="text-right">
                Initialen
              </Label>
              <Input
                id="edit-initials"
                value={editingEmployee?.initials || ""}
                onChange={(e) => setEditingEmployee(prev => prev ? {...prev, initials: e.target.value} : null)}
                className="col-span-3"
                maxLength={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEditEmployee}>Änderungen speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

