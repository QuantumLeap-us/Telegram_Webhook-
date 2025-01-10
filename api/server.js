const express = require("express");
const serverless = require("serverless-http"); // 用于适配 Serverless
const axios = require("axios");

const app = express();
app.use(express.json());

// 替换为你的 Telegram 机器人信息
const TELEGRAM_BOT_TOKEN = "YOUR_TELEGRAM_BOT_TOKEN";
const TELEGRAM_CHAT_ID = "YOUR_CHAT_ID";

// Webhook 接口处理邮件通知
app.post("/api/webhook", async (req, res) => {
  try {
    // 从请求体中提取邮件内容
    const { subject, fromAddress, content, receivedAt } = req.body;

    // 构造要发送到 Telegram 的消息
    const message = `
📧 *新邮件通知*:
✉️ *发件人*: ${fromAddress}
📜 *主题*: ${subject}
🕒 *接收时间*: ${receivedAt}

📖 *内容*:
${content}
`;

    // 发送消息到 Telegram
    const telegramResponse = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "Markdown", // 启用格式化
      }
    );

    console.log("邮件通知发送到 Telegram:", telegramResponse.data);

    // 响应 Webhook 服务器
    res.status(200).send({ message: "邮件已推送到 Telegram！" });
  } catch (error) {
    console.error("推送到 Telegram 时出错:", error.response?.data || error.message);
    res.status(500).send({ message: "推送失败！" });
  }
});

// 导出为 Vercel 的 Serverless Function
module.exports = app;
module.exports.handler = serverless(app);

