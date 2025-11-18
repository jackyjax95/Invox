import { NextRequest, NextResponse } from 'next/server';
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
const mockInvoices = [
  {
    id: 'INV00001',
    invoice_number: 'INV00001',
    user_id: 'demo-user',
    client_name: 'ABC Corp',
    client_email: 'billing@abc.com',
    items: [{ description: 'Web development services', quantity: 1, price: 1500 }],
    total: 1500,
    status: 'paid',
    created_at: new Date().toISOString(),
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Website development project'
  }
];

// Function to generate next invoice number
async function generateInvoiceNumber(): Promise<string> {
  try {
    if (supabaseAdmin) {
      // Get the highest invoice number from Supabase
      const { data: invoices, error } = await supabaseAdmin
        .from('invoices')
        .select('invoice_number')
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
    } else {
      // Use mock data numbering
      const existingNumbers = mockInvoices
        .map(invoice => parseInt(invoice.invoice_number.replace('INV', '')))
        .filter(num => !isNaN(num));

      const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
      return `INV${nextNumber.toString().padStart(5, '0')}`;
    }

    return 'INV00001';
  } catch (error) {
    console.error('Error generating invoice number:', error);
    return 'INV00001';
  }
}

export async function GET(request: NextRequest) {
  try {
    if (supabaseAdmin) {
      const { data: invoices, error } = await supabaseAdmin
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching invoices:', error);
        return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
      }

      return NextResponse.json({ invoices: invoices || [] });
    } else {
      // Return mock data when Supabase is not configured
      return NextResponse.json({ invoices: mockInvoices });
    }
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/invoices called');
    console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.log('SUPABASE_SERVICE_ROLE_KEY value:', process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.log('supabaseAdmin is null:', supabaseAdmin === null);

    const body = await request.json();

    console.log('Received invoice data:', body);

    // Validate required fields
    if (!body.client_name || !body.total || !body.user_id) {
      console.log('Validation failed:', { client_name: body.client_name, total: body.total, user_id: body.user_id });
      return NextResponse.json({ error: 'Missing required fields: client_name, total, user_id' }, { status: 400 });
    }

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Create new invoice
    const newInvoice = {
      invoice_number: invoiceNumber,
      user_id: body.user_id,
      client_name: body.client_name,
      client_email: body.client_email || '',
      items: body.items || [],
      total: parseFloat(body.total),
      status: body.status || 'draft',
      created_at: body.created_at || new Date().toISOString(),
      due_date: body.due_date || null,
      description: body.description || '',
    };

    console.log('Creating invoice:', {
      invoice_number: newInvoice.invoice_number,
      client_name: newInvoice.client_name,
      total: newInvoice.total,
      created_at: newInvoice.created_at,
    });

    if (supabaseAdmin) {
      // Insert into Supabase
      const { data, error } = await supabaseAdmin
        .from('invoices')
        .insert(newInvoice)
        .select()
        .single();

      if (error) {
        console.error('Error creating invoice:', error);
        return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
      }

      return NextResponse.json(data);
    } else {
      // Use mock data when Supabase is not configured
      console.log('Using mock data fallback for invoice creation');
      const mockInvoice = {
        ...newInvoice,
        id: newInvoice.invoice_number, // Use invoice number as ID for mock data
      };
      console.log('Created mock invoice:', mockInvoice);
      mockInvoices.push(mockInvoice);
      console.log('Mock invoices array now has', mockInvoices.length, 'items');
      return NextResponse.json(mockInvoice);
    }
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}