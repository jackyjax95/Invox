import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

// Service role client for bypassing RLS in MVP
const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY &&
  process.env.SUPABASE_SERVICE_ROLE_KEY !== 'your_service_role_key_here' &&
  process.env.SUPABASE_SERVICE_ROLE_KEY.trim() !== ''
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  : null;

// Mock data for development when Supabase is not configured
const mockClients = [
  {
    id: '1',
    user_id: 'demo-user',
    name: 'Jacqualine Schutte',
    email: 'jacqualine@example.com',
    phone: '+27 12 345 6789',
    company: 'ABC Corp',
    address: '123 Business St, Pretoria, South Africa',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    user_id: 'demo-user',
    name: 'John Smith',
    email: 'john@techsolutions.com',
    phone: '+27 21 987 6543',
    company: 'Tech Solutions Inc',
    address: '456 Innovation Ave, Cape Town, South Africa',
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    user_id: 'demo-user',
    name: 'Sarah Johnson',
    email: 'sarah@designstudio.co.za',
    phone: '+27 11 555 1234',
    company: 'Design Studio',
    address: '789 Creative Blvd, Johannesburg, South Africa',
    created_at: new Date().toISOString(),
  },
  {
    id: '4',
    user_id: 'demo-user',
    name: 'Mike Wilson',
    email: 'mike@consulting.co.za',
    phone: '+27 31 222 3333',
    company: 'Business Consulting',
    address: '321 Strategy St, Durban, South Africa',
    created_at: new Date().toISOString(),
  },
  {
    id: '5',
    user_id: 'demo-user',
    name: 'Lisa Brown',
    email: 'lisa@marketingpro.co.za',
    phone: '+27 41 444 5555',
    company: 'Marketing Pro',
    address: '654 Brand Ave, Port Elizabeth, South Africa',
    created_at: new Date().toISOString(),
  }
];

export async function GET(request: NextRequest) {
  try {
    if (supabaseAdmin) {
      // Use service role client to bypass RLS for MVP demo
      const { data: clients, error } = await supabaseAdmin
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching clients:', error);
        return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
      }

      return NextResponse.json({ clients: clients || [] });
    } else {
      // Return mock data when Supabase is not configured
      return NextResponse.json({ clients: mockClients });
    }
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

    if (supabaseAdmin) {
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
    } else {
      // Use mock data when Supabase is not configured
      const mockClient = {
        ...newClient,
        id: (mockClients.length + 1).toString(),
      };
      mockClients.push(mockClient);
      return NextResponse.json(mockClient);
    }
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}