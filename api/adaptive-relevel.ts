import { handleAdaptiveRelevel } from "../server";

// Hobby plan chỉ cho phép tối đa 10s
export const config = {
  maxDuration: 10,
};

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
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const body = await parseRequestBody(req);
    const customApiKey = (req.headers["x-gemini-api-key"] as string) || (req.headers["authorization"]?.replace("Bearer ", "") as string) || body?.apiKey;
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
