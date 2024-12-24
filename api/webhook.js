import express from "express";
import bodyParser from "body-parser";
import Stripe from "stripe";
import cors from "cors";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET; // Setat în Stripe Dashboard

const app = express();

// Middleware pentru JSON și CORS
app.use(express.json());
app.use(cors());

// Endpoint pentru crearea sesiunii Stripe Checkout
app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "ron",
            product_data: { name: "Access Fee" },
            unit_amount: 200, // 2 RON
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.origin}/success`,
      cancel_url: `${req.headers.origin}/cancel`,
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error("Eroare la crearea sesiunii: ", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint pentru verificarea stării plății utilizatorului
let userPaymentStatus = {}; // Simulare bază de date
app.get("/api/payment-status", (req, res) => {
  const userId = req.query.userId; // Presupunem că userId este trimis în query string
  const hasPaid = userPaymentStatus[userId] || false;
  res.json({ hasPaid });
});

// Configurare bodyParser pentru a citi raw-body (necesar pentru verificarea semnăturii Stripe)
app.post(
  "/api/webhook",
  bodyParser.raw({ type: "application/json" }),
  (req, res) => {
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

        // Actualizare bază de date sau logică pentru a marca utilizatorul ca "hasPaid"
        console.log("Plata confirmată pentru sesiunea:", session.id);
        const userId = session.client_reference_id; // Utilizare client_reference_id pentru identificarea utilizatorului
        userPaymentStatus[userId] = true; // Marcăm utilizatorul ca plătit
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.status(200).send("Webhook received.");
  }
);

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
