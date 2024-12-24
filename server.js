const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const cors = require("cors");

const app = express();
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Simulare bază de date pentru stocarea stării plății
let userPaymentStatus = {};

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

// Endpoint pentru verificarea stării plății
app.get("/api/check-payment-status", async (req, res) => {
  try {
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required." });
    }

    // Obține detalii despre sesiunea de plată
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      return res.status(200).json({ hasPaid: true });
    } else {
      return res.status(200).json({ hasPaid: false });
    }
  } catch (error) {
    console.error("Eroare la verificarea statusului plății:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint pentru webhook Stripe
app.post(
  "/api/webhook",
  express.raw({ type: "application/json" }),
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

        // Exemplu: Folosim `client_reference_id` ca identificator unic al utilizatorului
        const userId = session.client_reference_id;
        userPaymentStatus[userId] = true; // Marcam utilizatorul ca plătit

        console.log("Plata confirmată pentru sesiunea:", session.id);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.status(200).send("Webhook received.");
  }
);

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
