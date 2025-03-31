import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { Database } from '@/types/supabase';

// GET /api/employees/[id] - Get a specific employee
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const id = params.id;
    
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Employee not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching employee:', error);
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

// PUT /api/employees/[id] - Update an employee
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const id = params.id;
    const body = await request.json();
    
    // Validate data
    if (body.initials && (body.initials.length < 2 || body.initials.length > 3)) {
      return NextResponse.json(
        { error: 'Initials must be 2-3 characters' },
        { status: 400 }
      );
    }
    
    const updateData: any = {};
    if (body.full_name !== undefined) updateData.full_name = body.full_name;
    if (body.initials !== undefined) updateData.initials = body.initials;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    
    const { data, error } = await supabase
      .from('employees')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating employee:', error);
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

// PATCH /api/employees/[id]/status - Toggle employee status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const id = params.id;
    const body = await request.json();
    
    if (body.is_active === undefined) {
      return NextResponse.json(
        { error: 'is_active field is required' },
        { status: 400 }
      );
    }
    
    const { data, error } = await supabase
      .from('employees')
      .update({ is_active: body.is_active })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating employee status:', error);
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

// DELETE /api/employees/[id] - Delete an employee
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const id = params.id;
    
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting employee:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 