import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

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

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerEmail = session.customer_details?.email;
      const productType = session.metadata?.product_type;

      console.log(`Checkout complete: ${productType} for ${customerEmail}`);

      if (productType === 'bundle' && session.metadata?.create_trial_subscription === 'true') {
        const trialEnd = Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60;
        await stripe.subscriptions.create({
          customer: session.customer as string,
          items: [{ price: session.metadata.trial_price_id }],
          trial_end: trialEnd,
          metadata: { source: 'bundle_purchase' },
        });
        console.log(`3-month trial subscription created for ${customerEmail}`);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      console.log(`Subscription ${subscription.id} cancelled`);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
