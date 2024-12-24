app.post("/api/create-checkout-session", async (req, res) => {
  try {
    console.log("Cerere primită pentru creare sesiune");
    console.log("Cheia secretă Stripe:", process.env.STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "ron",
            product_data: {
              name: "Access Fee",
            },
            unit_amount: 100, // 1 RON
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.origin}/success`,
      cancel_url: `${req.headers.origin}/cancel`,
    });

    console.log("Sesiune creată:", session.id);
    res.json({ id: session.id });
  } catch (error) {
    console.error("Eroare la crearea sesiunii:", error.message);
    res.status(500).json({ error: error.message });
  }
});
