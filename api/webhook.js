// Endpoint pentru Webhook Stripe
import express from "express";
import bodyParser from "body-parser";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET; // Setat în Stripe Dashboard

const app = express();

// Configurare bodyParser pentru a citi raw-body DOAR pentru endpoint-ul webhook
app.post(
  "/api/webhook",
  bodyParser.raw({ type: "application/json" }),
  (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;

    try {
      // Verifică semnătura folosind secretul webhook
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error("Webhook signature verification failed.", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Gestionare eveniment Stripe
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object;

        // Logică pentru a marca utilizatorul ca "hasPaid"
        console.log("Plata confirmată pentru sesiunea:", session.id);
        // Exemplu: Actualizare bază de date sau logică personalizată
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.status(200).send("Webhook received.");
  }
);

// Exportă aplicația
export default app;
