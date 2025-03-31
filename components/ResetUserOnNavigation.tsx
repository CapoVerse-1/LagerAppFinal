"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';

export default function ResetUserOnNavigation() {
  const { setCurrentUser } = useUser();
  const pathname = usePathname();

  // Reset the current user whenever the pathname changes
  useEffect(() => {
    setCurrentUser(null);
  }, [pathname, setCurrentUser]);

  // This component doesn't render anything
  return null;
} 