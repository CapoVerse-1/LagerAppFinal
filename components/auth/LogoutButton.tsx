'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface LogoutButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export default function LogoutButton({ 
  variant = 'outline', 
  size = 'default',
  className = '',
}: LogoutButtonProps) {
  const { signOut } = useAuth();

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={signOut}
      className={className}
    >
      Sign Out
    </Button>
  );
} 