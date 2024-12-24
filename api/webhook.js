import { buffer } from "micro";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // Cheia secretă Stripe

export const config = {
  api: {
    bodyParser: false, // Dezactivează bodyParser pentru a putea procesa payload-ul brut
  },
};

export default async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
    return;
  }

  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed.`, err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Gestionăm evenimentele Stripe
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    // Actualizează starea plății în baza de date (sau alt mecanism de stocare)
    console.log("Payment was successful for session: ", session.id);
  }

  res.status(200).json({ received: true });
};
