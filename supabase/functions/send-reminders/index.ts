// supabase/functions/send-reminders/index.ts
// 
// This Edge Function runs on a cron schedule (every 15 minutes).
// It checks which reminders are due, picks a fresh motivational phrase
// for each user, and sends a branded email via Resend.
//
// Required secrets (set via Supabase dashboard → Edge Functions → Secrets):
//   RESEND_API_KEY       - from resend.com (free tier: 3,000 emails/month)
//   SUPABASE_URL         - your Supabase project URL
//   SUPABASE_SERVICE_KEY  - your service role key (for server-side access)
//   APP_URL              - your production app URL (e.g. https://app.oneill-labs.com)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Reminder {
  id: string
  user_id: string
  title: string
  reminder_time: string
  enabled: boolean
}

interface UserProfile {
  id: string
  email: string
  raw_user_meta_data: { display_name?: string; name?: string }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendKey = Deno.env.get('RESEND_API_KEY')!
    const appUrl = Deno.env.get('APP_URL') || 'https://upgrade-your-body.vercel.app'

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get current time in HH:MM format (UTC)
    const now = new Date()
    const currentHour = now.getUTCHours().toString().padStart(2, '0')
    const currentMinute = now.getUTCMinutes()

    // Round to nearest 15-minute window
    const windowStart = Math.floor(currentMinute / 15) * 15
    const windowEnd = windowStart + 14
    const timeStart = `${currentHour}:${windowStart.toString().padStart(2, '0')}`
    const timeEnd = `${currentHour}:${Math.min(windowEnd, 59).toString().padStart(2, '0')}`

    // Fetch all enabled reminders in this time window
    const { data: reminders, error: remErr } = await supabase
      .from('reminders')
      .select('*')
      .eq('enabled', true)
      .gte('reminder_time', timeStart)
      .lte('reminder_time', timeEnd)

    if (remErr) throw remErr
    if (!reminders || reminders.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: 'No reminders due' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let sentCount = 0

    for (const reminder of reminders as Reminder[]) {
      // Get user email
      const { data: userData, error: userErr } = await supabase
        .from('auth.users')
        .select('id, email, raw_user_meta_data')
        .eq('id', reminder.user_id)
        .single()

      // Fallback: use admin API to get user
      let userEmail = ''
      let userName = ''

      if (userErr || !userData) {
        const { data: { user }, error: authErr } = await supabase.auth.admin.getUserById(reminder.user_id)
        if (authErr || !user) continue
        userEmail = user.email || ''
        userName = user.user_metadata?.display_name || user.user_metadata?.name || ''
      } else {
        const profile = userData as unknown as UserProfile
        userEmail = profile.email
        userName = profile.raw_user_meta_data?.display_name || profile.raw_user_meta_data?.name || ''
      }

      if (!userEmail) continue

      // Get a fresh motivational phrase
      const { data: phraseData } = await supabase.rpc('get_fresh_phrase', {
        p_user_id: reminder.user_id,
        p_category: 'General',
      })

      const phrase = phraseData?.[0]?.phrase || 'Every day is a new opportunity to upgrade yourself.'
      const phraseId = phraseData?.[0]?.phrase_id

      // Record phrase in history
      if (phraseId) {
        await supabase.from('phrase_history').upsert({
          user_id: reminder.user_id,
          phrase_id: phraseId,
          channel: 'email',
          sent_at: new Date().toISOString(),
        }, { onConflict: 'user_id,phrase_id,channel' })
      }

      // Also create an in-app notification
      await supabase.from('notifications').insert({
        user_id: reminder.user_id,
        title: reminder.title,
        message: `It's time for: ${reminder.title}`,
        phrase,
      })

      // Send branded email via Resend
      const greeting = userName ? `Hi ${userName},` : 'Hi there,'
      const htmlBody = buildEmail(greeting, reminder.title, phrase, appUrl)

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Upgrade Your Body <reminders@updates.oneill-labs.com>',
          to: [userEmail],
          subject: `${reminder.title} — Upgrade Your Body`,
          html: htmlBody,
        }),
      })

      if (emailRes.ok) sentCount++
    }

    return new Response(JSON.stringify({ sent: sentCount, checked: reminders.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

function buildEmail(greeting: string, title: string, phrase: string, appUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;">
<div style="background:radial-gradient(circle at top,#13263f 0%,#08111f 45%,#050b13 100%);padding:40px 20px;">
<div style="max-width:520px;margin:0 auto;">

  <!-- Logo -->
  <div style="text-align:center;margin-bottom:32px;">
    <span style="font-size:20px;font-weight:800;letter-spacing:-0.02em;">
      <span style="background:linear-gradient(90deg,#56b6ff,#41d98a,#ff9a3d);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">Upgrade</span>
      <span style="color:#f4f7fb;"> Your Body</span>
    </span>
  </div>

  <!-- Card -->
  <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:22px;padding:32px;box-shadow:0 20px 60px rgba(0,0,0,0.35);">
    
    <!-- Reminder title -->
    <div style="background:linear-gradient(135deg,rgba(86,182,255,0.16),rgba(65,217,138,0.16));border-radius:14px;padding:16px;margin-bottom:24px;">
      <div style="color:#b7c3d3;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;margin-bottom:6px;">Reminder</div>
      <div style="color:#f4f7fb;font-size:22px;font-weight:700;">${title}</div>
    </div>

    <!-- Greeting -->
    <p style="color:#f4f7fb;font-size:15px;line-height:1.6;margin:0 0 20px;">
      ${greeting}
    </p>
    <p style="color:#b7c3d3;font-size:15px;line-height:1.6;margin:0 0 24px;">
      This is your reminder to check in with <strong style="color:#f4f7fb;">${title.toLowerCase()}</strong>. Small, consistent actions build lasting change.
    </p>

    <!-- Motivational phrase -->
    <div style="border-left:4px solid #41d98a;padding:16px 20px;margin:0 0 28px;background:rgba(65,217,138,0.06);border-radius:0 12px 12px 0;">
      <p style="color:#e9f3ff;font-size:17px;line-height:1.5;margin:0;font-style:italic;">
        "${phrase}"
      </p>
    </div>

    <!-- CTA button -->
    <div style="text-align:center;margin-bottom:8px;">
      <a href="${appUrl}/app/tracker" style="display:inline-block;background:linear-gradient(90deg,#41d98a,#64f0b1);color:#041019;border-radius:999px;padding:14px 32px;font-weight:700;font-size:15px;text-decoration:none;box-shadow:0 8px 24px rgba(65,217,138,0.3);">
        Open your tracker
      </a>
    </div>
  </div>

  <!-- Footer -->
  <div style="text-align:center;margin-top:28px;">
    <p style="color:#b7c3d3;font-size:12px;margin:0 0 8px;">
      You're receiving this because you set a reminder in Upgrade Your Body.
    </p>
    <p style="color:#6b7f96;font-size:11px;margin:0;">
      <a href="${appUrl}/app/reminders" style="color:#56b6ff;text-decoration:none;">Manage reminders</a> · 
      © O'Neill Labs / Niall O'Neill
    </p>
  </div>

</div>
</div>
</body>
</html>`
}
