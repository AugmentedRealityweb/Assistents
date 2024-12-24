const express = require("express");
const stripe = require("stripe")("const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
"); // Înlocuiește cu cheia ta secretă Stripe
const cors = require("cors");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Endpoint pentru creare sesiuni Stripe Checkout
app.post("/create-checkout-session", async (req, res) => {
  try {
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

    res.json({ id: session.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rulează serverul pe portul 4242
app.listen(4242, () => console.log("Server running on http://localhost:4242"));
