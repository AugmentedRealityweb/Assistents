// Endpoint pentru verificarea stării plății
import express from "express";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

router.get("/api/check-payment-status", async (req, res) => {
  try {
    // Exemplu: Extrage userId-ul sau alt identificator din query params
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

export default router;
