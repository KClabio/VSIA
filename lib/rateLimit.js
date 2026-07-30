const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_MINUTE_LIMIT = 10;
const DEFAULT_DAY_LIMIT = 50;

const buckets = new Map();

function checkAndConsume(key, { minuteLimit = DEFAULT_MINUTE_LIMIT, dayLimit = DEFAULT_DAY_LIMIT } = {}) {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { minuteCount: 0, minuteStart: now, dayCount: 0, dayStart: now };
    buckets.set(key, bucket);
  }
  if (now - bucket.minuteStart >= MINUTE_MS) {
    bucket.minuteCount = 0;
    bucket.minuteStart = now;
  }
  if (now - bucket.dayStart >= DAY_MS) {
    bucket.dayCount = 0;
    bucket.dayStart = now;
  }

  if (bucket.minuteCount >= minuteLimit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.minuteStart + MINUTE_MS - now) / 1000) };
  }
  if (bucket.dayCount >= dayLimit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.dayStart + DAY_MS - now) / 1000) };
  }

  bucket.minuteCount += 1;
  bucket.dayCount += 1;
  return { allowed: true };
}

// Trần tổng toàn hệ thống cho chatbot (không phân biệt IP/user) — bảo vệ chi phí Gemini API
// không vượt kiểm soát nếu bị tấn công đồng loạt từ nhiều IP khác nhau, dù mỗi IP riêng lẻ vẫn
// đang tuân thủ giới hạn 10/phút - 50/ngày ở trên.
const GLOBAL_CHATBOT_MINUTE_LIMIT = 60;
const GLOBAL_CHATBOT_DAY_LIMIT = 1000;
function checkGlobalChatbotLimit() {
  return checkAndConsume('__global_chatbot__', {
    minuteLimit: GLOBAL_CHATBOT_MINUTE_LIMIT,
    dayLimit: GLOBAL_CHATBOT_DAY_LIMIT,
  });
}

// Sweep out buckets that haven't been touched in a full day so the Map doesn't grow unbounded with IP churn.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now - bucket.minuteStart >= MINUTE_MS && now - bucket.dayStart >= DAY_MS) {
      buckets.delete(key);
    }
  }
}, DAY_MS).unref();

module.exports = { checkAndConsume, checkGlobalChatbotLimit };
