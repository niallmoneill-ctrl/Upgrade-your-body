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
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#08111f;" bgcolor="#08111f">

<!-- Outer wrapper -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#08111f" style="background-color:#08111f;">
  <tr>
    <td align="center" style="padding:40px 20px;">

      <!-- Inner container -->
      <table width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;">

        <!-- Logo -->
        <tr>
          <td align="center" style="padding-bottom:32px;">
            <span style="font-size:20px;font-weight:800;letter-spacing:-0.02em;font-family:Arial,Helvetica,sans-serif;">
              <span style="color:#41d98a;">Upgrade</span><span style="color:#f4f7fb;"> Your Body</span>
            </span>
          </td>
        </tr>

        <!-- Card -->
        <tr>
          <td bgcolor="#0d1e33" style="background-color:#0d1e33;border-radius:18px;padding:32px;border:1px solid #1e3a5f;">

            <!-- Reminder label + title -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
              <tr>
                <td bgcolor="#112240" style="background-color:#112240;border-radius:12px;padding:16px;">
                  <p style="margin:0 0 6px;color:#7aa8cc;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;font-family:Arial,Helvetica,sans-serif;">Reminder</p>
                  <p style="margin:0;color:#f4f7fb;font-size:22px;font-weight:700;font-family:Arial,Helvetica,sans-serif;">${title}</p>
                </td>
              </tr>
            </table>

            <!-- Greeting -->
            <p style="margin:0 0 20px;color:#f4f7fb;font-size:15px;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">${greeting}</p>
            <p style="margin:0 0 24px;color:#b7c3d3;font-size:15px;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">
              This is your reminder to check in with <strong style="color:#f4f7fb;">${title.toLowerCase()}</strong>. Small, consistent actions build lasting change.
            </p>

            <!-- Motivational phrase -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
              <tr>
                <td bgcolor="#0e2a1e" style="background-color:#0e2a1e;border-left:4px solid #41d98a;border-radius:0 10px 10px 0;padding:16px 20px;">
                  <p style="margin:0;color:#d4f0e4;font-size:16px;line-height:1.6;font-style:italic;font-family:Arial,Helvetica,sans-serif;">&ldquo;${phrase}&rdquo;</p>
                </td>
              </tr>
            </table>

            <!-- CTA button -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" style="padding-bottom:8px;">
                  <!--[if mso]>
                  <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
                    href="${appUrl}/app/tracker"
                    style="height:50px;v-text-anchor:middle;width:200px;" arcsize="50%"
                    fillcolor="#41d98a">
                    <w:anchorlock/>
                    <center style="color:#041019;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;">Open your tracker</center>
                  </v:roundrect>
                  <![endif]-->
                  <!--[if !mso]><!-->
                  <a href="${appUrl}/app/tracker"
                    style="display:inline-block;background-color:#41d98a;color:#041019;border-radius:999px;padding:14px 32px;font-weight:700;font-size:15px;text-decoration:none;font-family:Arial,Helvetica,sans-serif;">
                    Open your tracker
                  </a>
                  <!--<![endif]-->
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="padding-top:28px;">
            <p style="margin:0 0 8px;color:#b7c3d3;font-size:12px;font-family:Arial,Helvetica,sans-serif;">
              You're receiving this because you set a reminder in Upgrade Your Body.
            </p>
            <p style="margin:0;color:#6b7f96;font-size:11px;font-family:Arial,Helvetica,sans-serif;">
              <a href="${appUrl}/app/reminders" style="color:#56b6ff;text-decoration:none;">Manage reminders</a> &middot;
              &copy; O&apos;Neill Labs / Niall O&apos;Neill
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>`
}
