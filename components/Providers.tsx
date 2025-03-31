'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { UserProvider } from '@/contexts/UserContext';
import { ThemeProvider } from 'next-themes';
import EmployeeSelectionOverlay from './EmployeeSelectionOverlay';
import ResetUserOnNavigation from './ResetUserOnNavigation';
import { useState, useEffect } from 'react';
import { PinProvider } from '@/contexts/PinContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  // Add mounted state to prevent hydration mismatch
  const [mounted, setMounted] = useState(false);

  // Update mounted state once component mounts in the client
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <UserProvider>
          <PinProvider>
            <ResetUserOnNavigation />
            {/* Only render children after client-side mounting to prevent hydration mismatch */}
            {mounted ? children : <div style={{ visibility: 'hidden' }}>{children}</div>}
            <EmployeeSelectionOverlay />
          </PinProvider>
        </UserProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}