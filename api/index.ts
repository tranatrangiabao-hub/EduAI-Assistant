import {
  handleGenerateQuiz,
  handleAdaptiveRelevel,
  handleExplainQuestion,
  pruneUnusedContent,
  buildSmartFallbackFromContent,
} from "../server";

// Hobby plan chỉ cho phép tối đa 10s — set đúng thực tế, tránh hiểu nhầm
export const config = {
  maxDuration: 10,
};

// Ngưỡng timeout nội bộ, để lại buffer an toàn trước khi Vercel platform giết cứng ở giây thứ 10
const INTERNAL_TIMEOUT_MS = 8000;

async function parseRequestBody(req: any): Promise<any> {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string" && req.body.trim().length > 0) {
    try { return JSON.parse(req.body); } catch (_) { return {}; }
  }
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk: any) => { data += chunk; });
    req.on("end", () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch (_) { resolve({}); }
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

  if (req.method === "OPTIONS") return res.status(200).end();

  const url = req.url || "";
  const body = req.method === "POST" ? await parseRequestBody(req) : {};
  const customApiKey =
    (req.headers["x-gemini-api-key"] as string) ||
    (req.headers["authorization"]?.replace("Bearer ", "") as string) ||
    body?.apiKey;

  if (url.includes("generate-quiz")) {
    try {
      const data = await withTimeout(
        handleGenerateQuiz(body, customApiKey),
        INTERNAL_TIMEOUT_MS,
        "handleGenerateQuiz"
      );
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[Vercel /api/index generate-quiz Error]", error?.message || error);
      const safeSubject = body?.subject || "Tin học";
      const safeGrade = body?.grade || "Lớp 12";
      const safeContent = body?.content || "";
      const safeCount = Math.max(1, Math.min(50, Number(body?.questionCount) || 10));

      const fallbackData = buildSmartFallbackFromContent(safeContent, safeSubject, safeGrade, safeSubject, safeCount);
      return res.status(200).json({
        success: true,
        data: fallbackData,
        warning: "Hệ thống đã kích hoạt bộ ngân hàng câu hỏi phân hóa chuẩn GD&ĐT theo tài liệu của bạn.",
      });
    }
  }

  if (url.includes("adaptive-relevel")) {
    try {
      const data = await withTimeout(
        handleAdaptiveRelevel(body, customApiKey),
        INTERNAL_TIMEOUT_MS,
        "handleAdaptiveRelevel"
      );
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      return res.status(200).json({
        success: false,
        error: error?.message || "Lỗi tạo câu hỏi thích ứng.",
        data: {
          feedback: "Hệ thống đang hỗ trợ ôn tập kiến thức cơ bản.",
          recommendedAction: "Ôn lại các phần lý thuyết trọng tâm.",
          remedialQuestions: []
        }
      });
    }
  }

  if (url.includes("explain-question")) {
    try {
      const text = await withTimeout(
        handleExplainQuestion(body, customApiKey),
        INTERNAL_TIMEOUT_MS,
        "handleExplainQuestion"
      );
      return res.status(200).json({ success: true, explanation: text });
    } catch (error: any) {
      return res.status(200).json({
        success: false,
        explanation: `⚠️ Không thể khởi tạo lời giải thích chi tiết lúc này: ${error?.message || "Lỗi máy chủ"}`,
        error: error?.message || "Lỗi giải thích câu hỏi."
      });
    }
  }

  if (url.includes("prune-text")) {
    const text = body?.text || "";
    const pruned = pruneUnusedContent(text);
    return res.status(200).json({
      success: true,
      data: {
        originalLength: text.length,
        prunedLength: pruned.length,
        prunedText: pruned,
      }
    });
  }

  return res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "EduAI Vercel Router",
  });
}
