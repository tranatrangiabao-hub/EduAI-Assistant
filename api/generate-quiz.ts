import { handleGenerateQuiz, buildSmartFallbackFromContent, fetchVipQuestions } from "../server";

// Hobby plan chỉ cho phép tối đa 10s — set đúng thực tế, tránh hiểu nhầm
export const config = {
  maxDuration: 10,
};

// Ngưỡng timeout nội bộ, để lại buffer an toàn trước khi Vercel platform giết cứng ở giây thứ 10
const INTERNAL_TIMEOUT_MS = 8000;

async function parseRequestBody(req: any): Promise<any> {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }
  if (typeof req.body === "string" && req.body.trim().length > 0) {
    try {
      return JSON.parse(req.body);
    } catch (_) {
      return {};
    }
  }
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk: any) => {
      data += chunk;
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (_) {
        resolve({});
      }
    });
    req.on("error", () => resolve({}));
  });
}

// Ép timeout cho bất kỳ promise nào — nếu quá hạn, reject chủ động thay vì chờ Vercel kill
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);

    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-gemini-api-key, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  let body: any = {};
  try {
    body = await parseRequestBody(req);
    const customApiKey =
      (req.headers["x-gemini-api-key"] as string) ||
      (req.headers["authorization"]?.replace("Bearer ", "") as string) ||
      body?.apiKey;

    // Chủ động timeout ở 8s thay vì để Vercel giết cứng ở 10s
    const data = await withTimeout(
      handleGenerateQuiz(body, customApiKey),
      INTERNAL_TIMEOUT_MS,
      "handleGenerateQuiz"
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("[Vercel /api/generate-quiz Error]", error?.message || error);
    const safeSubject = body?.subject || "Tin học";
    const safeGrade = body?.grade || "Lớp 12";
    const safeContent = body?.content || "";
    const safeCount = Math.max(1, Math.min(50, Number(body?.questionCount) || 10));

    const fallbackData = buildSmartFallbackFromContent(safeContent, safeSubject, safeGrade, safeSubject, safeCount);

    // Bù thêm câu hỏi thuật toán từ engine vip.py nếu bộ fallback dựng sẵn
    // chưa đủ số lượng yêu cầu.
    const shortfall = safeCount - fallbackData.questions.length;
    if (shortfall > 0) {
      const gradeNumber = (safeGrade.match(/\d+/) || ["12"])[0];
      const vipQuestions = await fetchVipQuestions({
        grade: gradeNumber,
        subject: safeSubject,
        count: shortfall,
      });
      fallbackData.questions = [...fallbackData.questions, ...vipQuestions].slice(0, safeCount);
    }

    return res.status(200).json({
      success: true,
      data: fallbackData,
      warning: "Hệ thống đã kích hoạt bộ ngân hàng câu hỏi phân hóa chuẩn GD&ĐT (kết hợp bộ tạo đề riêng) theo tài liệu của bạn.",
    });
  }
}