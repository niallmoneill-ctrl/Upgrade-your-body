import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerSupabase } from '@/lib/supabase/server';

const EBOOK_PATH = 'Upgrade_Your_Body_Plus.pdf';

export async function GET(req: NextRequest) {
  try {
    // Verify the user is authenticated
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has purchased the eBook
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: subscription } = await adminSupabase
      .from('subscriptions')
      .select('ebook_purchased')
      .eq('user_id', user.id)
      .single();

    if (!subscription?.ebook_purchased) {
      return NextResponse.json({ error: 'eBook not purchased' }, { status: 403 });
    }

    // Generate a signed URL (valid for 60 seconds)
    const { data, error } = await adminSupabase.storage
      .from('ebooks')
      .createSignedUrl(EBOOK_PATH, 60);

    if (error || !data?.signedUrl) {
      console.error('Signed URL error:', error);
      return NextResponse.json({ error: 'Failed to generate download link' }, { status: 500 });
    }

    return NextResponse.json({ url: data.signedUrl });
  } catch (err: any) {
    console.error('eBook download error:', err.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
