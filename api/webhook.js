// Endpoint pentru Webhook Stripe
import express from "express";
import bodyParser from "body-parser";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET; // Setat în Stripe Dashboard

const app = express();

// Configurare bodyParser pentru a citi raw-body (necesar pentru verificarea semnăturii Stripe)
app.post("/api/webhook", bodyParser.raw({ type: "application/json" }), (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Gestionare eveniment Stripe
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object;

      // Actualizare baza de date sau logică pentru a marca utilizatorul ca "hasPaid"
      console.log("Plata confirmată pentru sesiunea:", session.id);
      // Exemplu: Salvează hasPaid pentru utilizator (în funcție de implementarea bazei tale de date)
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).send("Webhook received.");
});

export default app;
