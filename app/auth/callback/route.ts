import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { notifyAdmin } from '@/lib/notify-admin'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/app/dashboard'
  const supabase = await createClient()

  function isNewUser(createdAt: string) {
    return Date.now() - new Date(createdAt).getTime() < 5 * 60 * 1000
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type: type as any, token_hash })
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user && isNewUser(user.created_at)) {
        notifyAdmin('New signup', 'Email: ' + (user.email || 'unknown') + '<br>Method: ' + (type || 'magic link') + '<br>Time: ' + new Date().toISOString())
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user && isNewUser(user.created_at)) {
        notifyAdmin('New signup', 'Email: ' + (user.email || 'unknown') + '<br>Method: OAuth<br>Time: ' + new Date().toISOString())
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
