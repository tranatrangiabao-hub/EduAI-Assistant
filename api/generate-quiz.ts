import { handleGenerateQuiz, buildSmartFallbackFromContent } from "../server";

export const config = {
  maxDuration: 60,
};

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
    const customApiKey = (req.headers["x-gemini-api-key"] as string) || (req.headers["authorization"]?.replace("Bearer ", "") as string) || body?.apiKey;
    const data = await handleGenerateQuiz(body, customApiKey);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("[Vercel /api/generate-quiz Error]", error);
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

