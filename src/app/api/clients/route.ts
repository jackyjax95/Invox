import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

// Service role client for bypassing RLS in MVP
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching clients:', error);
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
    }

    return NextResponse.json({ clients: clients || [] });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.email || !body.user_id) {
      return NextResponse.json({ error: 'Name, email, and user_id are required' }, { status: 400 });
    }

    // Create new client
    const newClient = {
      user_id: body.user_id,
      name: body.name,
      email: body.email,
      phone: body.phone || '',
      company: body.company || '',
      address: body.address || '',
      created_at: body.created_at || new Date().toISOString(),
    };

    console.log('Creating client:', {
      name: newClient.name,
      email: newClient.email,
      user_id: newClient.user_id,
    });

    // Insert into Supabase using admin client to bypass RLS for MVP
    const { data, error } = await supabaseAdmin
      .from('clients')
      .insert(newClient)
      .select()
      .single();

    if (error) {
      console.error('Error creating client:', error);
      return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}