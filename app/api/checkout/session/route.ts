import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-03-25.dahlia',
  });
}

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return NextResponse.json({
      product_type: session.metadata?.product_type || 'unknown',
      amount: session.amount_total?.toString() || session.metadata?.custom_amount || null,
      customer_email: session.customer_details?.email || session.metadata?.customer_email || null,
    });
  } catch (err: any) {
    console.error('Session lookup error:', err.message);
    return NextResponse.json({ error: 'Could not retrieve session' }, { status: 500 });
  }
}
