const express = require('express');
const router = express.Router();
const crypto = require('crypto');

const ContactRequest = require('../models/ContactRequest');
const { TOOL_DECLARATIONS, executeTool } = require('../lib/chatbotTools');
const { checkAndConsume } = require('../lib/rateLimit');

const SYSTEM_PROMPT = `Bạn là trợ lý ảo tư vấn của VSIA (Vietnam STEM Innovation Alliance) — tổ chức đào tạo, bồi dưỡng giáo viên STEM tại Việt Nam. VSIA cung cấp: các khoá học/chương trình bồi dưỡng giáo viên STEM, tư vấn thiết kế phòng Lab STEM, tổ chức ngày hội và cuộc thi STEM cho trường học, kết nối chuyên gia và mạng lưới đối tác giáo dục.
Hãy trả lời bằng tiếng Việt, thân thiện, ngắn gọn, đúng trọng tâm.

Bạn có 3 công cụ:
- search_courses: dùng để tra cứu khóa học thật trong hệ thống trước khi trả lời bất kỳ câu hỏi nào về khóa học cụ thể (tên, giá, danh mục...).
- search_articles: dùng để tra cứu bài viết/tin tức thật trong hệ thống trước khi trả lời câu hỏi về tin tức.
- enroll_in_course: dùng để đăng ký người dùng vào một khóa học, CHỈ khi người dùng yêu cầu rõ ràng muốn đăng ký/ghi danh, và phải có course_id lấy được từ kết quả search_courses trước đó.

Không được bịa đặt tên khóa học, bài viết, giá cả hay kết quả đăng ký nếu chưa gọi công cụ tương ứng. Nếu công cụ trả về lỗi hoặc rỗng, hãy nói thật với người dùng và gợi ý họ để lại thông tin liên hệ qua form tư vấn trên trang hoặc email taphuan@vsia.edu.vn.`;

const MAX_HISTORY = 16;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_TOOL_ITERATIONS = 4;
const FALLBACK_REPLY = 'Dạ hiện tại mình chưa thể trả lời ngay lúc này. Bạn để lại thông tin liên hệ qua form tư vấn trên trang hoặc email taphuan@vsia.edu.vn, đội ngũ VSIA sẽ hỗ trợ bạn sớm nhất nhé!';

function sanitizeMessages(rawMessages) {
  if (!Array.isArray(rawMessages)) return [];
  return rawMessages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, MAX_MESSAGE_LENGTH) }));
}

router.post('/api/chatbot', async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.json({ reply: FALLBACK_REPLY });
  }

  const messages = sanitizeMessages(req.body.messages);
  if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
    return res.status(400).json({ error: 'Vui lòng nhập nội dung câu hỏi.' });
  }

  const clientKey = req.user ? `user:${req.user._id}` : `ip:${req.ip}`;
  const rateLimit = checkAndConsume(clientKey);
  if (!rateLimit.allowed) {
    res.set('Retry-After', String(rateLimit.retryAfterSeconds));
    return res.status(429).json({ error: `Bạn đã gửi quá nhiều tin nhắn, vui lòng thử lại sau ${rateLimit.retryAfterSeconds} giây.` });
  }

  try {
    const { GoogleGenAI, createPartFromFunctionResponse } = require('@google/genai');
    const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
    const config = {
      systemInstruction: SYSTEM_PROMPT,
      maxOutputTokens: 1024,
      temperature: 0.6,
      tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
    };

    let reply = null;
    for (let i = 0; i < MAX_TOOL_ITERATIONS; i += 1) {
      const response = await client.models.generateContent({ model: 'gemini-flash-latest', contents, config });
      const functionCalls = response.functionCalls;

      if (!functionCalls || !functionCalls.length) {
        reply = (typeof response.text === 'function' ? response.text() : response.text)?.trim() || null;
        break;
      }

      contents.push(response.candidates[0].content);

      const responseParts = [];
      for (const call of functionCalls) {
        const result = await executeTool(call.name, call.args, req);
        responseParts.push(createPartFromFunctionResponse(call.id || crypto.randomUUID(), call.name, { output: result }));
      }
      contents.push({ role: 'user', parts: responseParts });
    }

    res.json({ reply: reply || 'Xin lỗi, tôi chưa có câu trả lời phù hợp lúc này.' });
  } catch (err) {
    console.error('Chatbot error:', err.message);
    res.json({ reply: FALLBACK_REPLY });
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
