import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { data: expenses, error } = await supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching expenses:', error);
      return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
    }

    return NextResponse.json({ expenses: expenses || [] });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendor, description, amount, category, date, user_id, quantity, vat_included } = body;

    // Validate required fields
    if (!vendor || !amount || !category || !date || !user_id) {
      return NextResponse.json({ error: 'Missing required fields: vendor, amount, category, date, user_id' }, { status: 400 });
    }

    // Create new expense
    const newExpense = {
      user_id,
      vendor,
      invoice_number: body.invoice_number || '',
      description: description || '',
      quantity: quantity || 1,
      amount: parseFloat(amount),
      category,
      date: new Date(date).toISOString(),
      vat_included: vat_included || false,
      created_at: new Date().toISOString(),
    };

    console.log('Creating expense:', {
      vendor: newExpense.vendor,
      amount: newExpense.amount,
      category: newExpense.category,
      user_id: newExpense.user_id,
    });

    // Insert into Supabase
    const { data, error } = await supabase
      .from('expenses')
      .insert(newExpense)
      .select()
      .single();

    if (error) {
      console.error('Error creating expense:', error);
      return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}