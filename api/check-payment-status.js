// Endpoint pentru verificarea stării de plată
import express from "express";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

// Variabila pentru stocarea stării de plată (doar pentru testare locală)
let hasPaid = false; // Într-un proiect real, aceasta trebuie salvată într-o bază de date

app.get("/api/check-payment-status", (req, res) => {
  // Trimite statusul plății către client
  res.json({ hasPaid });
});

app.post("/api/mark-as-paid", (req, res) => {
  // Endpoint pentru a marca manual statusul ca "plătit"
  hasPaid = true;
  res.status(200).send("Statusul plății a fost actualizat.");
});

export default app;
