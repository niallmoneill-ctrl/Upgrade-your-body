import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const weekStart = searchParams.get('week_start')

  let query = supabase
    .from('weekly_reviews')
    .select('*')
    .eq('user_id', user.id)
    .order('week_start', { ascending: false })

  if (weekStart) {
    query = query.eq('week_start', weekStart)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ reviews: data })
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
  const { week_start, wins, challenges, next_focus } = body

  if (!week_start) {
    return NextResponse.json({ error: 'week_start is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('weekly_reviews')
    .upsert(
      {
        user_id: user.id,
        week_start,
        wins: wins ?? null,
        challenges: challenges ?? null,
        next_focus: next_focus ?? null,
      },
      { onConflict: 'user_id,week_start' }
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ review: data }, { status: 201 })
}