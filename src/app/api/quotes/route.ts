import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Function to generate next quote number
async function generateQuoteNumber(): Promise<string> {
  try {
    // Get the highest quote number
    const { data: quotes, error } = await supabase
      .from('quotes')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching quote numbers:', error);
      // Fallback to a default number
      return 'Q00001';
    }

    if (quotes && quotes.length > 0) {
      const lastId = quotes[0].id;
      // Extract the numeric part (assuming format QXXXXX)
      const numericPart = parseInt(lastId.replace('Q', ''));
      if (!isNaN(numericPart)) {
        return `Q${(numericPart + 1).toString().padStart(5, '0')}`;
      }
    }

    return 'Q00001';
  } catch (error) {
    console.error('Error generating quote number:', error);
    return 'Q00001';
  }
}

export async function GET(request: NextRequest) {
  try {
    const { data: quotes, error } = await supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching quotes:', error);
      return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 });
    }

    return NextResponse.json({ quotes: quotes || [] });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.client_name || !body.total || !body.user_id) {
      return NextResponse.json({ error: 'Missing required fields: client_name, total, user_id' }, { status: 400 });
    }

    // Generate quote ID
    const quoteId = await generateQuoteNumber();

    // Create new quote
    const newQuote = {
      id: quoteId,
      user_id: body.user_id,
      client_name: body.client_name,
      client_email: body.client_email || '',
      items: body.items || [],
      total: parseFloat(body.total),
      status: body.status || 'draft',
      created_at: body.created_at || new Date().toISOString(),
      valid_until: body.valid_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      description: body.description || '',
    };

    console.log('Creating quote:', {
      id: newQuote.id,
      client_name: newQuote.client_name,
      total: newQuote.total,
      created_at: newQuote.created_at,
    });

    // Insert into Supabase
    const { data, error } = await supabase
      .from('quotes')
      .insert(newQuote)
      .select()
      .single();

    if (error) {
      console.error('Error creating quote:', error);
      return NextResponse.json({ error: 'Failed to create quote' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating quote:', error);
    return NextResponse.json({ error: 'Failed to create quote' }, { status: 500 });
  }
}