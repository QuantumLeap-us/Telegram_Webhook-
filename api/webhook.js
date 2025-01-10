const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json()); // Middleware to parse incoming JSON requests

// Telegram Bot Configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN; // Token for Telegram Bot
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID; // Chat ID for Telegram Bot to send messages

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

    // Send the message to Telegram with an inline button for deletion
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: "HTML", // Use HTML for formatting
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🗑️ Delete Email", // Text for the delete button
              callback_data: "delete_email", // Data sent back when the button is clicked
            },
          ],
        ],
      },
    });

    // Respond with success after sending the message
    res.status(200).send({ message: "Webhook received and message sent to Telegram!" });
  } catch (error) {
    // Log errors and respond with an error message
    console.error("Error sending message to Telegram:", error.message);
    res.status(500).send({ error: "Failed to send message to Telegram" });
  }
});

// POST endpoint to handle Telegram button callback queries
app.post("/api/telegram-callback", async (req, res) => {
  try {
    console.log("Callback received:", JSON.stringify(req.body, null, 2));

    const { callback_query } = req.body;

    if (!callback_query) {
      console.warn("No callback_query received");
      return res.status(400).send("No callback_query received");
    }

    const chat_id = callback_query.message.chat.id;
    const message_id = callback_query.message.message_id;

    console.log("chat_id:", chat_id);
    console.log("message_id:", message_id);

    if (callback_query.data === "delete_email") {
      
      const deleteResponse = await axios.post(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteMessage`,
        {
          chat_id,
          message_id,
        }
      );

      console.log("Delete response:", deleteResponse.data);

      await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        chat_id,
        text: "🗑️ Email deleted successfully!",
      });

      return res.status(200).send("Message deleted");
    } else {
      console.warn("Unexpected callback data:", callback_query.data);
      return res.status(400).send("Unexpected callback data");
    }
  } catch (error) {
    console.error("Error processing callback:", error.message, error.response?.data);
    res.status(500).send({ error: "Failed to process callback" });
  }
});
// Export the Express app for Vercel
module.exports = app;
