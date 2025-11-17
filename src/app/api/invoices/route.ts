import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Function to generate next invoice number
async function generateInvoiceNumber(): Promise<string> {
  try {
    // Get the highest invoice number
    const { data: invoices, error } = await supabase
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

    return 'INV00001';
  } catch (error) {
    console.error('Error generating invoice number:', error);
    return 'INV00001';
  }
}

export async function GET(request: NextRequest) {
  try {
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
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
    const body = await request.json();

    // Validate required fields
    if (!body.client_name || !body.total || !body.user_id) {
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

    // Insert into Supabase
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