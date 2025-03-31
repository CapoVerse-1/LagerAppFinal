import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { Database } from '@/types/supabase';

// GET /api/employees - Fetch all employees
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Check if user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('Authentication error:', sessionError);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('full_name');
    
    if (error) {
      console.error('Error fetching employees:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// POST /api/employees - Create a new employee
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Check if user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('Authentication error:', sessionError);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.full_name || !body.initials) {
      return NextResponse.json(
        { error: 'Full name and initials are required' },
        { status: 400 }
      );
    }
    
    // Validate initials length
    if (body.initials.length < 2 || body.initials.length > 3) {
      return NextResponse.json(
        { error: 'Initials must be 2-3 characters' },
        { status: 400 }
      );
    }
    
    const { data, error } = await supabase
      .from('employees')
      .insert([{
        full_name: body.full_name,
        initials: body.initials,
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating employee:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 
