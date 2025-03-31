"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/lib/supabase';

interface Employee {
  id: string;
  full_name: string;
  initials: string;
}

export function useCurrentUser() {
  const { user } = useAuth();
  const { currentUser, setCurrentUser } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          .eq('email', user.email)
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

  return { currentUser, isLoading, error };
} 