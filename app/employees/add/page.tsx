"use client";

import { useState } from 'react';
import { useEmployees } from '@/hooks/useEmployees';
import { CreateEmployeeData } from '@/types/employee';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export default function AddEmployeePage() {
  const router = useRouter();
  const { addEmployee, isLoading } = useEmployees();
  const [newEmployee, setNewEmployee] = useState<CreateEmployeeData>({
    full_name: '',
    initials: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addEmployee(newEmployee);
      router.push('/employees');
    } catch (error) {
      console.error('Failed to add employee:', error);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Add New Employee</h1>
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Add Employee</CardTitle>
          <CardDescription>
            Create a new employee with their full name and initials.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={newEmployee.full_name}
                onChange={(e) => setNewEmployee({ ...newEmployee, full_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="initials">Initials (2-3 characters)</Label>
              <Input
                id="initials"
                value={newEmployee.initials}
                onChange={(e) => setNewEmployee({ ...newEmployee, initials: e.target.value })}
                maxLength={3}
                minLength={2}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Employee'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 