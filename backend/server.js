// server.js  (Backend - Node.js + Express)
// Deploy this folder to Render. Keep secrets in environment variables.

import express from "express";
import axios from "axios";
import admin from "firebase-admin";

const app = express();
app.use(express.json());

// Initialize Firebase Admin using service account JSON from env var
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error("FIREBASE_SERVICE_ACCOUNT environment variable not set.");
  process.exit(1);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
if (!PAYSTACK_SECRET) {
  console.error("PAYSTACK_SECRET_KEY environment variable not set.");
  process.exit(1);
}

// Health check
app.get("/", (req, res) => res.json({ status: "ok", message: "Backend alive" }));

// Verify Paystack transaction and update Firestore
app.post("/paystack/verify", async (req, res) => {
  try {
    const { reference, userId, amount } = req.body;
    if (!reference || !userId || !amount) {
      return res.status(400).json({ status: "error", message: "Missing fields" });
    }

    // 1) Verify transaction with Paystack
    const verifyUrl = `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`;
    const verifyResp = await axios.get(verifyUrl, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
    });

    if (!verifyResp.data || !verifyResp.data.status || verifyResp.data.data.status !== "success") {
      return res.status(400).json({ status: "failed", message: "Transaction not successful" });
    }

    // Optional: confirm amount matches what Paystack returned
    const paidAmount = verifyResp.data.data.amount / 100; // Paystack returns amount in kobo
    if (Math.abs(paidAmount - Number(amount)) > 0.001) {
      // warning: amounts mismatch — still proceed depending on your policy
      console.warn("Amount mismatch:", { paidAmount, amount });
    }

    // 2) Update Firestore (increment credit balance and push transaction)
    const userRef = db.collection("users").doc(userId);
    const tx = {
      type: "credit",
      amount: Number(amount),
      method: "Mobile Money",
      provider: verifyResp.data.data.gateway || "Paystack",
      ref: reference,
      raw: verifyResp.data.data,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };

    await userRef.set({
      credit_balance: admin.firestore.FieldValue.increment(Number(amount)),
      transactions: admin.firestore.FieldValue.arrayUnion(tx)
    }, { merge: true });

    return res.json({ status: "success", message: "Payment verified and account credited." });
  } catch (err) {
    console.error("Error in /paystack/verify:", err?.response?.data || err.message || err);
    return res.status(500).json({ status: "error", message: "Server error", detail: err?.message || err });
  }
});

// Start server (Render sets PORT env var)
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
