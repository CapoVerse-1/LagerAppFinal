import { Metadata } from 'next';
import LoginForm from './LoginForm';

export const metadata: Metadata = {
  title: 'Login - JTI 1-2-1 Inventory Management',
  description: 'Login to the JTI 1-2-1 Inventory Management System',
};

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <LoginForm />
    </div>
  );
} 