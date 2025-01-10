const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// Telegram Bot 配置
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// 检查环境变量
if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID environment variables");
  process.exit(1);
}

// GET 方法，用于调试 Webhook 是否正常运行
app.get("/api/webhook", (req, res) => {
  res.status(200).send("Webhook is running!");
});

// POST 方法，处理 Webhook 数据并发送到 Telegram
app.post("/api/webhook", async (req, res) => {
  try {
    const { subject, fromAddress, content } = req.body;

    // 验证请求体内容
    if (!subject || !fromAddress || !content) {
      return res.status(400).send({ error: "Missing required fields in request body" });
    }

    // 构造美化后的消息
    const message = `
📧 <b>New Email Received</b>:
✉️ <b>From</b>: ${fromAddress}
📜 <b>Subject</b>: ${subject}

📝 <b>Content</b>:
<pre>${content}</pre>
`;

    // 发送消息到 Telegram，附加删除按钮
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🗑️ Delete Email", // 按钮文本
              callback_data: "delete_email", // 回调数据
            },
          ],
        ],
      },
    });

    res.status(200).send({ message: "Webhook received and message sent to Telegram!" });
  } catch (error) {
    console.error("Error sending message to Telegram:", error.message);
    res.status(500).send({ error: "Failed to send message to Telegram" });
  }
});

// 处理删除按钮的回调事件
app.post("/api/telegram-callback", async (req, res) => {
  try {
    console.log("Callback received:", req.body); // 打印回调数据，便于调试

    const { callback_query } = req.body;

    if (callback_query) {
      const chat_id = callback_query.message.chat.id; // 获取 Chat ID
      const message_id = callback_query.message.message_id; // 获取消息 ID

      // 如果回调数据为 "delete_email"，则执行删除操作
      if (callback_query.data === "delete_email") {
        // 调用 Telegram API 删除消息
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteMessage`, {
          chat_id,
          message_id,
        });

        // 给用户发送反馈
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          chat_id,
          text: "🗑️ Email deleted successfully!",
        });

        return res.status(200).send("Message deleted");
      }
    }

    res.status(400).send("No valid callback query received");
  } catch (error) {
    console.error("Error processing callback:", error.message);
    res.status(500).send({ error: "Failed to process callback" });
  }
});

module.exports = app;
