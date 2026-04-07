# Email Reminder System — Setup Guide

## Overview

The system sends branded reminder emails with motivational phrases to users
at their scheduled times. It runs as a Supabase Edge Function on a 15-minute
cron schedule and uses Resend for email delivery (free: 3,000 emails/month).

Each email also creates an in-app notification, so users see it in both places.
The no-repeat system ensures the same phrase won't be sent to the same user
within 6 months.

---

## Step 1: Set up Resend (5 minutes)

1. Go to **https://resend.com** and create a free account
2. In the Resend dashboard, go to **API Keys** → **Create API Key**
3. Copy the key (starts with `re_`)
4. Go to **Domains** → **Add Domain**
5. Add `updates.oneill-labs.com` (or any subdomain you want to send from)
6. Resend will show you DNS records to add (usually 3 records):
   - 1x MX record
   - 1x TXT record (SPF)
   - 1x TXT record (DKIM)
7. Add these DNS records in HostGator cPanel → Zone Editor
8. Wait for Resend to verify (can take 5-30 minutes)

**Note:** Until the domain is verified, you can use Resend's test address
`onboarding@resend.dev` in the `from` field for testing.

---

## Step 2: Run the database migration

If you haven't already, go to **Supabase → SQL Editor** and run the
contents of `supabase/migrations/002_motivational_reminders.sql`.

This creates:
- `motivational_phrases` table (80 curated phrases)
- `phrase_history` table (tracks what each user has seen)
- `notifications` table (in-app notifications)
- `get_fresh_phrase()` function (picks a phrase with no 6-month repeats)
- RLS policies for all tables

---

## Step 3: Deploy the Edge Function

Install the Supabase CLI if you haven't already:

```bash
npm install -g supabase
```

Login and link your project:

```bash
supabase login
supabase link --project-ref kwqedqenjatfmhffaqrq
```

Deploy the function:

```bash
supabase functions deploy send-reminders --no-verify-jwt
```

The `--no-verify-jwt` flag is needed because cron invocations don't
include a JWT token.

---

## Step 4: Set secrets

```bash
supabase secrets set RESEND_API_KEY=re_your_api_key_here
supabase secrets set SUPABASE_URL=https://kwqedqenjatfmhffaqrq.supabase.co
supabase secrets set SUPABASE_SERVICE_KEY=your_service_role_key_here
supabase secrets set APP_URL=https://app.oneill-labs.com
```

Replace the values with your actual keys. The service role key is in your
`.env.local` file as `SUPABASE_SERVICE_ROLE_KEY`.

---

## Step 5: Set up the cron schedule

Go to **Supabase Dashboard → Database → Extensions** and enable `pg_cron`
if it isn't already.

Then go to **SQL Editor** and run:

```sql
SELECT cron.schedule(
  'send-reminders',
  '*/15 * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://kwqedqenjatfmhffaqrq.supabase.co/functions/v1/send-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
```

This triggers the Edge Function every 15 minutes.

**Alternative (simpler):** If pg_cron feels complex, you can use a free
external cron service like **cron-job.org** to hit your Edge Function URL
every 15 minutes with a POST request.

---

## Step 6: Test it

1. Create a reminder in the app set to the current time (rounded to 15 mins)
2. Manually trigger the function:

```bash
curl -X POST https://kwqedqenjatfmhffaqrq.supabase.co/functions/v1/send-reminders \
  -H "Content-Type: application/json"
```

3. Check your email inbox
4. Check the notification bell in the app

---

## How it works

1. Every 15 minutes, the cron job triggers the Edge Function
2. The function queries all enabled reminders where `reminder_time` falls
   in the current 15-minute window
3. For each due reminder, it:
   - Fetches the user's email via Supabase Admin API
   - Calls `get_fresh_phrase()` to get a motivational quote they haven't
     seen in 6 months
   - Records the phrase in `phrase_history` to prevent repeats
   - Creates an in-app notification
   - Sends a branded email via Resend
4. The email uses your website's dark theme design: navy background,
   green accents, gradient branding, quote block with green border

---

## Costs

- **Resend free tier:** 3,000 emails/month (100/day)
- **Supabase Edge Functions:** included in free tier
- **pg_cron:** included in Supabase free tier

For a launch with fewer than 100 daily active users, this is completely free.

---

## Important note on time zones

Reminder times are currently stored and compared in UTC. For Irish users
(GMT/IST), reminders set to "08:00" will trigger at 08:00 UTC which is
correct during winter (GMT) but 1 hour early during summer (IST).

A future improvement would be to store each user's timezone in their profile
and adjust the comparison accordingly.
