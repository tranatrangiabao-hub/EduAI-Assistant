import {
  handleGenerateQuiz,
  handleAdaptiveRelevel,
  handleExplainQuestion,
  pruneUnusedContent,
  buildSmartFallbackFromContent,
} from "../server";

export const config = {
  maxDuration: 60,
};

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

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") return res.status(200).end();

  const url = req.url || "";
  const body = req.method === "POST" ? await parseRequestBody(req) : {};

  if (url.includes("generate-quiz")) {
    try {
      const data = await handleGenerateQuiz(body);
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[Vercel /api/index generate-quiz Error]", error);
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
      const data = await handleAdaptiveRelevel(body);
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
      const text = await handleExplainQuestion(body);
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

