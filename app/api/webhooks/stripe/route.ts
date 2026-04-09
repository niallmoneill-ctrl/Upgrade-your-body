import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Use service role key to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getUserByEmail(email: string) {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error listing users:', error);
    return null;
  }
  return data.users.find((u) => u.email === email) || null;
}

async function upsertSubscription(
  userId: string,
  stripeCustomerId: string,
  updates: Record<string, any>
) {
  const { error } = await supabase
    .from('subscriptions')
    .upsert(
      {
        user_id: userId,
        stripe_customer_id: stripeCustomerId,
        updated_at: new Date().toISOString(),
        ...updates,
      },
      { onConflict: 'user_id' }
    );

  if (error) {
    console.error
cat > app/api/webhooks/stripe/route.ts << 'EOF'
import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Use service role key to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getUserByEmail(email: string) {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error listing users:', error);
    return null;
  }
  return data.users.find((u) => u.email === email) || null;
}

async function upsertSubscription(
  userId: string,
  stripeCustomerId: string,
  updates: Record<string, any>
) {
  const { error } = await supabase
    .from('subscriptions')
    .upsert(
      {
        user_id: userId,
        stripe_customer_id: stripeCustomerId,
        updated_at: new Date().toISOString(),
        ...updates,
      },
      { onConflict: 'user_id' }
    );

  if (error) {
    console.error('Supabase upsert error:', error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerEmail = session.customer_details?.email;
        const productType = session.metadata?.product_type;
        const stripeCustomerId = session.customer as string;

        console.log(`Checkout complete: ${productType} for ${customerEmail}`);

        if (!customerEmail) {
          console.error('No customer email in session');
          break;
        }

        // Find the Supabase user by email
        const user = await getUserByEmail(customerEmail);
        if (!user) {
          console.error(`No Supabase user found for ${customerEmail}`);
          break;
        }

        if (productType === 'subscription') {
          // Pro monthly or yearly subscription
          const subscription = await stripe.subscriptions.list({
            customer: stripeCustomerId,
            limit: 1,
          });
          const sub = subscription.data[0];

          await upsertSubscription(user.id, stripeCustomerId, {
            stripe_subscription_id: sub?.id || null,
            plan_type: 'pro',
            status: 'active',
            current_period_start: sub
              ? new Date(sub.current_period_start * 1000).toISOString()
              : null,
            current_period_end: sub
              ? new Date(sub.current_period_end * 1000).toISOString()
              : null,
          });
          console.log(`Pro subscription saved for ${customerEmail}`);
        } else if (productType === 'one_time') {
          // eBook purchase
          await upsertSubscription(user.id, stripeCustomerId, {
            ebook_purchased: true,
          });
          console.log(`eBook purchase saved for ${customerEmail}`);
        } else if (productType === 'bundle') {
          // Bundle: eBook + 3-month trial
          await upsertSubscription(user.id, stripeCustomerId, {
            plan_type: 'pro',
            status: 'active',
            ebook_purchased: true,
            bundle_purchased: true,
          });

          // Create the 3-month trial subscription in Stripe
          if (session.metadata?.create_trial_subscription === 'true') {
            const trialEnd =
              Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60;
            const trialSub = await stripe.subscriptions.create({
              customer: stripeCustomerId,
              items: [{ price: session.metadata.trial_price_id }],
              trial_end: trialEnd,
              metadata: { source: 'bundle_purchase' },
            });

            await upsertSubscription(user.id, stripeCustomerId, {
              stripe_subscription_id: trialSub.id,
              current_period_end: new Date(
                trialEnd * 1000
              ).toISOString(),
            });
          }
          console.log(`Bundle purchase saved for ${customerEmail}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by stripe customer ID
        const { data: subRecord } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (subRecord) {
          await upsertSubscription(subRecord.user_id, customerId, {
            status: subscription.status === 'active' ? 'active' : subscription.status,
            current_period_start: new Date(
              subscription.current_period_start * 1000
            ).toISOString(),
            current_period_end: new Date(
              subscription.current_period_end * 1000
            ).toISOString(),
          });
          console.log(`Subscription updated for customer ${customerId}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: subRecord } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (subRecord) {
          await upsertSubscription(subRecord.user_id, customerId, {
            plan_type: 'free',
            status: 'cancelled',
            stripe_subscription_id: null,
            current_period_start: null,
            current_period_end: null,
          });
          console.log(`Subscription cancelled for customer ${customerId}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { data: subRecord } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (subRecord) {
          await upsertSubscription(subRecord.user_id, customerId, {
            status: 'past_due',
          });
          console.log(`Payment failed for customer ${customerId}`);
        }
        break;
      }
    }
  } catch (err: any) {
    console.error('Webhook handler error:', err.message);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
