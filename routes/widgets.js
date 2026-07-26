const express = require('express');
const router = express.Router();

const ContactRequest = require('../models/ContactRequest');

const SYSTEM_PROMPT = `Bạn là trợ lý ảo tư vấn của VSIA (Vietnam STEM Innovation Alliance) — tổ chức đào tạo, bồi dưỡng giáo viên STEM tại Việt Nam. VSIA cung cấp: các khoá học/chương trình bồi dưỡng giáo viên STEM, tư vấn thiết kế phòng Lab STEM, tổ chức ngày hội và cuộc thi STEM cho trường học, kết nối chuyên gia và mạng lưới đối tác giáo dục.
Hãy trả lời bằng tiếng Việt, thân thiện, ngắn gọn, đúng trọng tâm. Nếu người dùng hỏi về thông tin cụ thể (giá, lịch học, hồ sơ) mà bạn không chắc chắn, hãy gợi ý họ để lại thông tin liên hệ qua form tư vấn trên trang hoặc email taphuan@vsia.edu.vn để được hỗ trợ chính xác. Không bịa đặt thông tin cụ thể (giá cả, ngày giờ) nếu không chắc chắn.`;

const MAX_HISTORY = 16;
const MAX_MESSAGE_LENGTH = 2000;

function sanitizeMessages(rawMessages) {
  if (!Array.isArray(rawMessages)) return [];
  return rawMessages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, MAX_MESSAGE_LENGTH) }));
}

router.post('/api/chatbot', async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: 'Chatbot chưa được cấu hình. Vui lòng thử lại sau hoặc dùng form tư vấn.' });
  }

  const messages = sanitizeMessages(req.body.messages);
  if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
    return res.status(400).json({ error: 'Vui lòng nhập nội dung câu hỏi.' });
  }

  try {
    const { GoogleGenAI } = require('@google/genai');
    const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
    const response = await client.models.generateContent({
      model: 'gemini-flash-latest',
      contents,
      config: { systemInstruction: SYSTEM_PROMPT, maxOutputTokens: 1024, temperature: 0.6 },
    });
    const reply = (typeof response.text === 'function' ? response.text() : response.text)?.trim()
      || 'Xin lỗi, tôi chưa có câu trả lời phù hợp lúc này.';
    res.json({ reply });
  } catch (err) {
    console.error('Chatbot error:', err.message);
    res.status(502).json({ error: 'Không thể kết nối trợ lý AI lúc này, vui lòng thử lại sau.' });
  }
});

router.post('/lien-he-tu-van', async (req, res) => {
  const name = (req.body.name || '').trim();
  const contact = (req.body.contact || '').trim();
  const message = (req.body.message || '').trim();

  if (!name || !contact || !message) {
    return res.status(400).json({ error: 'Vui lòng điền đầy đủ họ tên, thông tin liên hệ và nội dung cần tư vấn.' });
  }

  await ContactRequest.create({
    name: name.slice(0, 200),
    contact: contact.slice(0, 200),
    message: message.slice(0, 2000),
  });

  res.json({ success: true });
});

module.exports = router;
