'use server';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          try {
            cookieStore.set(name, value, options);
          } catch (error) {
            // This might fail in middleware or other contexts
            // We can safely ignore it since we're using this primarily for reading the session
          }
        },
        remove(name, options) {
          try {
            cookieStore.set(name, '', { ...options, maxAge: 0 });
          } catch (error) {
            // This might fail in middleware or other contexts
            // We can safely ignore it since we're using this primarily for reading the session
          }
        },
      },
    }
  );
} 