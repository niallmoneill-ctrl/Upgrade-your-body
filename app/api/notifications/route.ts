import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ notifications: data })
}

// Mark notification(s) as read
export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { id, mark_all_read } = body

  if (mark_all_read) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ notification: data })
}

// Generate a motivational notification for the user
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { title, category } = body

  // Get a fresh phrase this user hasn't seen in 6 months
  const { data: phraseData, error: phraseError } = await supabase
    .rpc('get_fresh_phrase', {
      p_user_id: user.id,
      p_category: category || 'General',
    })

  if (phraseError || !phraseData || phraseData.length === 0) {
    // Fallback: use a generic phrase
    const { data: notif, error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        title: title || 'Reminder',
        message: 'Time to check in with your health goals.',
        phrase: 'Every day is a new opportunity to upgrade yourself.',
      })
      .select()
      .single()

    if (notifError) return NextResponse.json({ error: notifError.message }, { status: 500 })
    return NextResponse.json({ notification: notif }, { status: 201 })
  }

  const chosen = phraseData[0]

  // Record in phrase history to prevent repeats
  await supabase.from('phrase_history').upsert({
    user_id: user.id,
    phrase_id: chosen.phrase_id,
    channel: 'in_app',
    sent_at: new Date().toISOString(),
  }, { onConflict: 'user_id,phrase_id,channel' })

  // Create the notification
  const { data: notif, error: notifError } = await supabase
    .from('notifications')
    .insert({
      user_id: user.id,
      title: title || 'Reminder',
      message: `It's time for: ${title || 'your check-in'}`,
      phrase: chosen.phrase,
    })
    .select()
    .single()

  if (notifError) return NextResponse.json({ error: notifError.message }, { status: 500 })
  return NextResponse.json({ notification: notif }, { status: 201 })
}
