import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: Fetch all accounts with decrypted tokens
export async function GET() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // TODO: Add role-based access control to ensure only super-admins can call this.
  
  const { data, error } = await supabase.rpc('get_decrypted_gs_accounts');

  if (error) {
    console.error('Error fetching GS accounts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST: Create a new Grand Shooting account
export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
  
  const { name, base_url, bearer_token } = await request.json();

  // Input validation
  if (!name || !base_url || !bearer_token) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // TODO: Add role-based access control.

  const { data, error } = await supabase.rpc('create_gs_account', {
    name,
    base_url,
    bearer_token,
  });

  if (error) {
    console.error('Error creating GS account:', error);
    // Handle unique constraint violation specifically
    if (error.code === '23505') { // unique_violation
      return NextResponse.json({ error: 'An account with this name already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data, message: 'Account created successfully' });
} 