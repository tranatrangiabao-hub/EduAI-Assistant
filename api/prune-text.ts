import { pruneUnusedContent } from "../server";

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
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const body = await parseRequestBody(req);
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
  } catch (error: any) {
    return res.status(200).json({
      success: true,
      data: {
        originalLength: 0,
        prunedLength: 0,
        prunedText: "",
      }
    });
  }
}

