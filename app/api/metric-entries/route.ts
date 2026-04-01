import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { metric_id, value, entry_date, note } = body

  if (!metric_id) {
    return NextResponse.json({ error: 'metric_id is required' }, { status: 400 })
  }

  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return NextResponse.json({ error: 'A numeric value is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('metric_entries')
    .insert({
      user_id: user.id,
      metric_id,
      value: Number(value),
      entry_date: entry_date ?? new Date().toISOString().slice(0, 10),
      note: note ?? null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ entry: data }, { status: 201 })
}