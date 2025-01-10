const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json()); // Middleware to parse incoming JSON requests

// Telegram Bot Configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN; // Telegram Bot Token
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID; // Telegram Chat ID

// Exit if environment variables are not set
if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID environment variables");
  process.exit(1);
}

// GET endpoint to check if the webhook is running
app.get("/api/webhook", (req, res) => {
  res.status(200).send("Webhook is running!");
});

// POST endpoint to handle incoming webhook data and send it to Telegram
app.post("/api/webhook", async (req, res) => {
  try {
    // Extracting data from the incoming request
    const { subject, fromAddress, content } = req.body;

    // Validate required fields
    if (!subject || !fromAddress || !content) {
      return res.status(400).send({ error: "Missing required fields in request body" });
    }

    // Construct a formatted message to send to Telegram
    const message = `
📧 <b>New Email Received</b>:
✉️ <b>From</b>: ${fromAddress}
📜 <b>Subject</b>: ${subject}

📝 <b>Content</b>:
<pre>${content}</pre>
`;

    // Send the message to Telegram without any inline buttons
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: "HTML" // Use HTML for formatting
    });

    // Respond with success after sending the message
    res.status(200).send({ message: "Webhook received and message sent to Telegram!" });
  } catch (error) {
    // Log errors and respond with an error message
    console.error("Error sending message to Telegram:", error.message);
    res.status(500).send({ error: "Failed to send message to Telegram" });
  }
});

// Export the Express app for Vercel
module.exports = app;
