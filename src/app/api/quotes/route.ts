import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create service role client for API operations (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Function to generate next quote number for authenticated user
async function generateQuoteNumber(userId: string): Promise<string> {
  try {
    // Get the highest quote number for this user
    const { data: quotes, error } = await supabase
      .from('quotes')
      .select('id')
      .eq('user_id', userId)
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

    // Fetch quotes for the authenticated user only
    const { data: quotes, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('user_id', user.id)
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

    // Generate quote ID for this user
    const quoteId = await generateQuoteNumber(user.id);

    // Create new quote
    const newQuote = {
      id: quoteId,
      user_id: user.id, // Use authenticated user's ID
      client_name: body.client_name,
      client_email: body.client_email || '',
      items: body.items || [],
      total: parseFloat(body.total),
      status: body.status || 'draft',
      created_at: new Date().toISOString(),
      valid_until: body.valid_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      description: body.description || '',
    };

    // Insert into Supabase (RLS will ensure user isolation)
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