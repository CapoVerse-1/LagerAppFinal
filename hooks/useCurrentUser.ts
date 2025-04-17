"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';
// Removed supabase import as we won't fetch here
// import { supabase } from '@/lib/supabase';

// Employee interface might still be useful if used elsewhere, but not strictly needed for this hook now.
// interface Employee {
//   id: string;
//   full_name: string;
//   initials: string;
// }

export function useCurrentUser() {
  // Get auth state and loading status
  const { user, isLoading: authIsLoading } = useAuth();
  // Get the already-set employee details from UserContext
  const { currentUser } = useUser();
  // isLoading now primarily reflects auth loading or waiting for EmployeeSelectionOverlay
  const isLoading = authIsLoading || (!authIsLoading && !!user && !currentUser);
  // Error state might be less relevant here now, could potentially reflect auth error
  const [error, setError] = useState<string | null>(null);

  // Remove the useEffect that was fetching employee data by email.
  // The EmployeeSelectionOverlay component is responsible for fetching
  // the list of employees and setting the currentUser in UserContext.
  /*
  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      // If we already have the current user data, don't fetch it again
      if (currentUser) {
        setIsLoading(false);
        return;
      }
      try {
        // Fetch employee data from Supabase
        const { data, error } = await supabase
          .from('employees')
          .select('id, full_name, initials')
          .eq('email', user.email) // <<< FAULTY QUERY
          .single();
        if (error) {
          setError(error.message);
          setIsLoading(false);
          return;
        }
        // Set the current user in the UserContext
        setCurrentUser({
          id: data.id,
          name: data.full_name,
          initials: data.initials,
        });
      } catch (err) {
        setError('Failed to fetch employee data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEmployeeData();
  }, [user, currentUser, setCurrentUser]);
  */

  // Return the currentUser from context and the relevant loading state
  return { currentUser, isLoading, error };
} 