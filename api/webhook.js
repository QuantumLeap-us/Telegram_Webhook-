const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json()); // 用于解析 JSON 数据

// 从环境变量中读取 Telegram 配置信息
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// 如果环境变量未设置，抛出错误并终止
if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID environment variables");
  process.exit(1);
}

// GET 方法用于调试
app.get("/api/webhook", (req, res) => {
  res.status(200).send("Webhook is running!");
});

// POST 方法处理 Webhook 数据
app.post("/api/webhook", async (req, res) => {
  try {
    const { subject, fromAddress, content } = req.body;

    // 验证请求体内容
    if (!subject || !fromAddress || !content) {
      return res.status(400).send({ error: "Missing required fields in request body" });
    }

    // 构造发送到 Telegram 的消息
    const message = `
📧 *New Email Received*:
✉️ *From*: ${fromAddress}
📜 *Subject*: ${subject}
📝 *Content*: ${content}
`;

    // 调用 Telegram API
    const telegramResponse = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "Markdown",
      }
    );

    console.log("Message sent to Telegram:", telegramResponse.data);
    res.status(200).send({ message: "Webhook received and message sent to Telegram!" });
  } catch (error) {
    console.error("Error processing webhook:", error.response?.data || error.message);
    res.status(500).send({ error: "Failed to send message to Telegram" });
  }
});

module.exports = app;
