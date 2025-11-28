import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create authenticated Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the authorization header to authenticate the user
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify the JWT token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: clientId } = await params;

    // Fetch client details (RLS will ensure user isolation)
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .eq('user_id', user.id) // Ensure client belongs to authenticated user
      .single();

    if (clientError || !client) {
      console.error('Error fetching client:', clientError);
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Fetch all invoices for this client (RLS will ensure user isolation)
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('*')
      .eq('client_email', client.email)
      .eq('user_id', user.id) // Ensure invoices belong to authenticated user
      .order('created_at', { ascending: false });

    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError);
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
    }

    // Calculate outstanding balance (sum of unpaid invoices)
    const outstandingBalance = (invoices || [])
      .filter((invoice) => invoice.status !== 'paid')
      .reduce((total, invoice) => total + parseFloat(invoice.total || 0), 0);

    return NextResponse.json({
      client,
      invoices: invoices || [],
      outstandingBalance
    });
  } catch (error) {
    console.error('Error fetching client details:', error);
    return NextResponse.json({ error: 'Failed to fetch client details' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the authorization header to authenticate the user
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify the JWT token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: clientId } = await params;

    // Delete client from Supabase (RLS will ensure user isolation)
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId)
      .eq('user_id', user.id); // Ensure client belongs to authenticated user

    if (error) {
      console.error('Error deleting client:', error);
      return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}