"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AuthTestPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    async function getSession() {
      const { data, error } = await supabase.auth.getSession();
      setSession(data.session);
      setLoading(false);
    }
    
    getSession();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setAuthError(error.message);
      }
    } catch (error) {
      console.error('Sign in error:', error);
      setAuthError('An unexpected error occurred');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const testEmployeesAPI = async () => {
    setTestResult(null);
    try {
      // Test GET request
      const getResponse = await fetch('/api/employees');
      const getData = await getResponse.json();
      
      setTestResult(`GET /api/employees: ${getResponse.status} ${getResponse.statusText}\n` +
                   `Data: ${JSON.stringify(getData, null, 2)}`);
    } catch (error) {
      console.error('API test error:', error);
      setTestResult(`Error testing API: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  if (loading) {
    return <div className="container mx-auto py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Supabase Authentication Test</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Authentication Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Status:</strong> {session ? 'Authenticated' : 'Not authenticated'}</p>
            {session && (
              <>
                <p><strong>User ID:</strong> {session.user.id}</p>
                <p><strong>Email:</strong> {session.user.email}</p>
                <p><strong>Token expires:</strong> {new Date(session.expires_at * 1000).toLocaleString()}</p>
              </>
            )}
          </div>
        </CardContent>
        <CardFooter>
          {session ? (
            <Button onClick={handleSignOut}>Sign Out</Button>
          ) : (
            <p>Please sign in below</p>
          )}
        </CardFooter>
      </Card>

      {!session && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Sign in with your Supabase credentials</CardDescription>
          </CardHeader>
          <form onSubmit={handleSignIn}>
            <CardContent className="space-y-4">
              {authError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {authError}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button type="submit" className="w-full">Sign In</Button>
              <a href="/auth-test/signup" className="text-sm text-blue-500 hover:underline">
                Create a test user
              </a>
            </CardFooter>
          </form>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>API Test</CardTitle>
          <CardDescription>Test the employees API endpoint</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={testEmployeesAPI} disabled={!session}>
            Test GET /api/employees
          </Button>
          
          {testResult && (
            <div className="mt-4 p-4 bg-gray-100 rounded overflow-auto">
              <pre className="whitespace-pre-wrap">{testResult}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 