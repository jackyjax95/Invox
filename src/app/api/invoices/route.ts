import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create service role client for API operations (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Function to generate next invoice number for authenticated user
async function generateInvoiceNumber(userId: string): Promise<string> {
  try {
    // Get the highest invoice number from Supabase for this user
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('user_id', userId)
      .order('invoice_number', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching invoice numbers:', error);
      // Fallback to a default number
      return 'INV00001';
    }

    if (invoices && invoices.length > 0) {
      const lastNumber = invoices[0].invoice_number;
      // Extract the numeric part (assuming format INVXXXXX)
      const numericPart = parseInt(lastNumber.replace('INV', ''));
      if (!isNaN(numericPart)) {
        return `INV${(numericPart + 1).toString().padStart(5, '0')}`;
      }
    }

    return 'INV00001';
  } catch (error) {
    console.error('Error generating invoice number:', error);
    return 'INV00001';
  }
}

export async function GET(request: NextRequest) {
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

    // Fetch invoices for the authenticated user only
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invoices:', error);
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
    }

    return NextResponse.json({ invoices: invoices || [] });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();

    // Validate required fields
    if (!body.client_name || !body.total) {
      return NextResponse.json({ error: 'Missing required fields: client_name, total' }, { status: 400 });
    }

    // Ensure user record exists in public.users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!existingUser) {
      // Create user record if it doesn't exist
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          created_at: new Date().toISOString(),
        });

      if (userError) {
        console.error('Error creating user record:', userError);
        return NextResponse.json({ error: 'Failed to create user record' }, { status: 500 });
      }
    }

    // Generate invoice number for this user
    const invoiceNumber = await generateInvoiceNumber(user.id);

    // Create new invoice
    const newInvoice = {
      invoice_number: invoiceNumber,
      user_id: user.id, // Use authenticated user's ID
      client_name: body.client_name,
      client_email: body.client_email || '',
      items: body.items || [],
      total: parseFloat(body.total),
      status: body.status || 'draft',
      created_at: new Date().toISOString(),
      due_date: body.due_date || null,
      description: body.description || '',
    };

    // Insert into Supabase (RLS will ensure user isolation)
    const { data, error } = await supabase
      .from('invoices')
      .insert(newInvoice)
      .select()
      .single();

    if (error) {
      console.error('Error creating invoice:', error);
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}