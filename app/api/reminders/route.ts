import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ reminders: data })
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { title, reminder_time, enabled } = body

  if (!title || !reminder_time) {
    return NextResponse.json(
      { error: 'title and reminder_time are required' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('reminders')
    .insert({
      user_id: user.id,
      title,
      reminder_time,
      enabled: enabled ?? true,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ reminder: data }, { status: 201 })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { id, title, reminder_time, enabled } = body

  if (!id) {
    return NextResponse.json({ error: 'Reminder id is required' }, { status: 400 })
  }

  const updatePayload: Record<string, unknown> = {}
  if (title !== undefined) updatePayload.title = title
  if (reminder_time !== undefined) updatePayload.reminder_time = reminder_time
  if (enabled !== undefined) updatePayload.enabled = enabled

  const { data, error } = await supabase
    .from('reminders')
    .update(updatePayload)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ reminder: data })
}