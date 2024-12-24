const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY); // Folosește cheia secretă Stripe din variabilele de mediu
const cors = require("cors");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Endpoint pentru creare sesiuni Stripe Checkout
app.post("/api/create-checkout-session", async (req, res) => {
  try {
    console.log("Cerere primită pentru creare sesiune");
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "ron",
            product_data: {
              name: "Access Fee",
            },
            unit_amount: 100, // 1 RON în bani
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.origin}/success`,
      cancel_url: `${req.headers.origin}/cancel`,
    });

    console.log("Sesiune creată: ", session.id);
    res.json({ id: session.id });
  } catch (error) {
    console.error("Eroare la crearea sesiunii: ", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Rulează serverul pe portul 4242 sau un port specificat în variabilele de mediu
const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
