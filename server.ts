import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Support both standalone Node.js and Vercel Serverless environment where req.body is already pre-parsed
app.use((req, res, next) => {
  if (req.body && typeof req.body === "object") {
    return next();
  }
  express.json({ limit: "50mb" })(req, res, next);
});

app.use((req, res, next) => {
  if (req.body && typeof req.body === "object") {
    return next();
  }
  express.urlencoded({ limit: "50mb", extended: true })(req, res, next);
});

// Custom error type so callers can distinguish "no key configured" from
// network/timeout/quota failures instead of collapsing everything into one
// generic fallback message.
export class MissingApiKeyError extends Error {
  constructor() {
    super("MISSING_API_KEY: No Gemini API key found (customApiKey / GEMINI_API_KEY / API_KEY are all empty).");
    this.name = "MissingApiKeyError";
  }
}

function resolveApiKey(customApiKey?: string): string {
  const apiKey = (customApiKey || process.env.GEMINI_API_KEY || process.env.API_KEY || "").trim();
  if (!apiKey) {
    throw new MissingApiKeyError();
  }
  return apiKey;
}

// Initialize Google GenAI Server-side helper
function getAiClient(customApiKey?: string) {
  const apiKey = resolveApiKey(customApiKey);
  return new GoogleGenAI({
    apiKey,
  });
}

// Health check
app.get(["/api/health", "/health"], (_req, res) => {
  res.json({ status: "ok", version: "1.0.0" });
});

/**
 * Automatically purges administrative exam headers, footer page numbers,
 * exam code boilerplate, empty answer lines, and non-exercise noise from uploaded files.
 */
function pruneUnusedContent(rawText: string): string {
  if (!rawText) return "";

  let text = rawText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u00A0/g, " ");

  // 1. Remove administrative exam header blocks & institutional boilerplate
  text = text.replace(/(BỘ|SỞ)\s+GIÁO\s+DỤC\s+VÀ\s+ĐÀO\s+TẠO[^\n]*/gi, "");
  text = text.replace(/TRƯỜNG\s+(THPT|THCS|ĐẠI\s+HỌC|TIEU\s+HOC)[^\n]*/gi, "");
  text = text.replace(/ĐỀ\s+THI\s+(CHÍNH\s+THỨC|THỬ|GIỮA\s+KỲ|CUỐI\s+KỲ|ĐỊNH\s+KỲ)[^\n]*/gi, "");
  text = text.replace(/MÃ\s+ĐỀ\s*(THI)?\s*:\s*\d+/gi, "");
  text = text.replace(/\(Đề\s+thi\s+gồm\s+\d+\s+trang\)/gi, "");
  text = text.replace(/\(Thí\s+sinh\s+không\s+được\s+sử\s+dụng\s+tài\s+liệu[^\)]*\)/gi, "");
  text = text.replace(/\(Cán\s+bộ\s+coi\s+thi\s+không\s+giải\s+thích\s+gì\s+thêm[^\)]*\)/gi, "");

  // 2. Remove student ID / Answer sheet metadata lines
  text = text.replace(/Họ\s*và\s*tên\s*(thí\s*sinh)?\s*:\s*[\._\-\s]{2,}[^\n]*/gi, "");
  text = text.replace(/Số\s+báo\s+danh\s*:\s*[\._\-\s]{2,}[^\n]*/gi, "");
  text = text.replace(/Mã\s+học\s+sinh\s*:\s*[\._\-\s]{2,}[^\n]*/gi, "");
  text = text.replace(/Chữ\s+ký\s+giám\s+thị\s*\d*\s*:\s*[\._\-\s]*/gi, "");

  // 3. Remove footer page indicators & watermarks / web URLs
  text = text.replace(/(Trang|Page)\s+\d+(\s*[\/\\]\s*\d+)?/gi, "");
  text = text.replace(/https?:\/\/\S+/gi, "");
  text = text.replace(/www\.\S+/gi, "");
  text = text.replace(/(Nguồn|Source|Download|Tải tại)\s*:\s*\S+/gi, "");

  // 4. Remove empty answer dotted/dashed lines
  text = text.replace(/\.{4,}/g, " ");
  text = text.replace(/_{4,}/g, " ");
  text = text.replace(/\-{4,}/g, " ");
  text = text.replace(/={4,}/g, " ");

  // 5. Remove trailing end markers
  text = text.replace(/---+\s*(HẾT|END)\s*---+/gi, "");
  text = text.replace(/CÁN\s+BỘ\s+COI\s+THI\s+KHÔNG\s+GIẢI\s+THÍCH\s+GÌ\s+THÊM\.?/gi, "");

  // 6. Clean up white spaces
  text = text.replace(/[ \t]+/g, " ");
  text = text.replace(/\n\s*\n\s*\n+/g, "\n\n");

  return text.trim();
}

/**
 * POST /api/prune-text
 * Standalone API endpoint to prune boilerplate text from client
 */
app.post(["/api/prune-text", "/prune-text"], (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Thành phần text không được để trống." });
    }
    const rawTrimmed = text.trim();
    const pruned = pruneUnusedContent(rawTrimmed);
    res.json({
      originalLength: rawTrimmed.length,
      prunedLength: pruned.length,
      removedCount: Math.max(0, rawTrimmed.length - pruned.length),
      prunedText: pruned,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Helper to clean and compress document text for maximum processing speed & minimum token noise
function cleanTextForAi(text: string, maxChars = 16000): string {
  if (!text) return "";
  const pruned = pruneUnusedContent(text);
  return pruned.substring(0, maxChars);
}

// Helper function to safely parse JSON with automatic pre-sanitization, truncation repair, and salvage
function safeParseJSON(
  text: string,
  subjectInfo?: { subject?: string; grade?: string; title?: string; content?: string }
): any {
  if (!text && !subjectInfo?.content) return buildSmartFallbackFromContent("", subjectInfo?.subject, subjectInfo?.grade, subjectInfo?.title);
  
  let cleaned = (text || "").trim();
  cleaned = cleaned.replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```\s*$/, "").trim();

  if (cleaned.length > 0) {
    // Try standard parse first
    try {
      return JSON.parse(cleaned);
    } catch (_) {}

    // Pre-sanitize unescaped newlines/tabs inside quotes & trailing commas
    let sanitized = cleaned;
    try {
      sanitized = cleaned
        .replace(/,\s*([}\]])/g, "$1") // Remove trailing commas
        .replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (match) => {
          return match.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
        });

      return JSON.parse(sanitized);
    } catch (_) {}

    // Attempt backwards truncation repair by finding valid closing brace '}' positions
    let searchPos = sanitized.length;
    while (searchPos > 0) {
      const braceIdx = sanitized.lastIndexOf("}", searchPos - 1);
      if (braceIdx === -1) break;
      searchPos = braceIdx;

      const candidates = [
        sanitized.substring(0, braceIdx + 1) + "\n]}",
        sanitized.substring(0, braceIdx + 1) + "\n}",
        sanitized.substring(0, braceIdx + 1)
      ];

      for (const cand of candidates) {
        try {
          const parsed = JSON.parse(cand);
          if (parsed && typeof parsed === "object" && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
            return parsed;
          }
        } catch (_) {
          try {
            const fixedCand = cand.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (m) =>
              m.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t")
            );
            const parsed = JSON.parse(fixedCand);
            if (parsed && typeof parsed === "object" && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
              return parsed;
            }
          } catch (_) {}
        }
      }
    }

    // Salvage top-level fields and complete question objects
    const salvaged: any = {
      title: subjectInfo?.title || "Đề thi / Ngân hàng câu hỏi GD&ĐT",
      summaryPoints: [],
      mindmapMermaid: "",
      questions: []
    };

    // Try to parse title
    const titleMatch = cleaned.match(/"title"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
    if (titleMatch) {
      try { salvaged.title = JSON.parse(`"${titleMatch[1]}"`); } catch (_) { salvaged.title = titleMatch[1]; }
    }

    // Try to parse mindmapMermaid
    const mindmapMatch = cleaned.match(/"mindmapMermaid"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
    if (mindmapMatch) {
      try { salvaged.mindmapMermaid = JSON.parse(`"${mindmapMatch[1]}"`); } catch (_) { salvaged.mindmapMermaid = mindmapMatch[1]; }
    }

    // Try to salvage summaryPoints array
    const summaryMatch = cleaned.match(/"summaryPoints"\s*:\s*\[([\s\S]*?)\]/);
    if (summaryMatch) {
      try {
        salvaged.summaryPoints = JSON.parse(`[${summaryMatch[1]}]`);
      } catch (_) {
        salvaged.summaryPoints = summaryMatch[1].split(/",\s*"/).map(s => s.replace(/^["\s]+|["\s]+$/g, "")).filter(Boolean);
      }
    }

    // Regex extract individual question objects { "question": ... }
    const questionBlockMatches = cleaned.match(/\{\s*"questionType"[\s\S]*?\}/g) || cleaned.match(/\{\s*"question"[\s\S]*?\}/g);
    if (questionBlockMatches) {
      for (const block of questionBlockMatches) {
        try {
          salvaged.questions.push(JSON.parse(block));
        } catch (_) {
          try {
            const fixedBlock = block.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (m) =>
              m.replace(/\n/g, "\\n").replace(/\r/g, "\\r")
            );
            salvaged.questions.push(JSON.parse(fixedBlock));
          } catch (_) {}
        }
      }
    }

    if (salvaged.questions.length > 0) {
      console.log(`[safeParseJSON] Successfully salvaged ${salvaged.questions.length} complete question objects via regex.`);
      return salvaged;
    }
  }

  console.warn("[safeParseJSON] Could not extract valid JSON. Building smart content-based fallback questions.");
  return buildSmartFallbackFromContent(subjectInfo?.content || "", subjectInfo?.subject, subjectInfo?.grade, subjectInfo?.title);
}

/**
 * Domain-specific questions library when input content is sparse or AI is rate-limited
 */
function getSubjectDomainQuestions(subjLower: string, cleanSubj: string, cleanGrade: string): any[] {
  if (subjLower.includes("toán")) {
    return [
      {
        id: "q_math_1",
        questionType: "multiple_choice",
        question: "Công thức tính thể tích V của khối trụ tròn xoay có bán kính đáy r và chiều cao h là:",
        options: ["V = π * r² * h", "V = 1/3 * π * r² * h", "V = 2 * π * r * h", "V = 4/3 * π * r³"],
        correctOption: 0,
        explanation: "Thể tích khối trụ bằng diện tích đáy nhân chiều cao: V = B * h = π * r² * h.",
        taxonomyLevel: "Nhận biết",
        difficulty: "Dễ",
        topic: "Khối trụ tròn xoay"
      },
      {
        id: "q_math_2",
        questionType: "multiple_choice",
        question: "Hàm số y = f(x) có đạo hàm f'(x) = x(x - 1)²(x + 2). Số điểm cực trị của hàm số là bao nhiêu?",
        options: ["2", "1", "3", "0"],
        correctOption: 0,
        explanation: "f'(x) đổi dấu khi qua x = 0 và x = -2 (nghiệm đơn). Tại x = 1 f'(x) không đổi dấu (nghiệm bội 2). Do đó hàm số có 2 điểm cực trị.",
        taxonomyLevel: "Thông hiểu",
        difficulty: "Trung bình",
        topic: "Cực trị hàm số"
      },
      {
        id: "q_math_3",
        questionType: "true_false",
        question: "Cho hình nón có bán kính đáy r = 3 cm, đường sinh l = 5 cm và chiều cao h = 4 cm (lấy π = 3.14). Xét tính Đúng/Sai của các mệnh đề sau:",
        tfStatements: [
          { id: "s1", statement: "a) Diện tích xung quanh của hình nón là S_xq = 47.1 cm².", isCorrect: true },
          { id: "s2", statement: "b) Thể tích của khối nón là V = 37.68 cm³.", isCorrect: true },
          { id: "s3", statement: "c) Diện tích toàn phần của hình nón là S_tp = 75.36 cm².", isCorrect: true },
          { id: "s4", statement: "d) Góc ở đỉnh của hình nón bằng 90°.", isCorrect: false }
        ],
        explanation: "a) S_xq = π*r*l = 3.14*3*5 = 47.1 cm² (ĐÚNG). b) V = (1/3)*π*r²*h = 37.68 cm³ (ĐÚNG). c) S_tp = 47.1 + 3.14*9 = 75.36 cm² (ĐÚNG). d) tan(alpha/2) = 3/4 => alpha != 90° (SAI).",
        taxonomyLevel: "Vận dụng",
        difficulty: "Khó",
        topic: "Hình nón tròn xoay"
      },
      {
        id: "q_math_4",
        questionType: "short_answer",
        question: "Tính thể tích V (cm³) của khối trụ tròn xoay có bán kính đáy r = 5 cm và chiều cao h = 10 cm. (Lấy π = 3.14).",
        shortAnswer: "785",
        acceptableAnswers: ["785", "785 cm3", "785cm3"],
        explanation: "V = π * r² * h = 3.14 * 25 * 10 = 785 cm³.",
        taxonomyLevel: "Vận dụng",
        difficulty: "Khó",
        topic: "Thể tích khối trụ"
      },
      {
        id: "q_math_5",
        questionType: "multiple_choice",
        question: "Đường tiệm cận đứng của đồ thị hàm số y = (2x + 1) / (x - 1) là đường thẳng nào?",
        options: ["x = 1", "y = 2", "x = -1", "y = -1"],
        correctOption: 0,
        explanation: "Nghiệm của mẫu số x - 1 = 0 là x = 1. Giới hạn lim_{x->1} y = vô cùng, nên x = 1 là tiệm cận đứng.",
        taxonomyLevel: "Nhận biết",
        difficulty: "Dễ",
        topic: "Tiệm cận đồ thị"
      },
      {
        id: "q_math_6",
        questionType: "multiple_choice",
        question: "Tích phân I = ∫[0->1] e^x dx có giá trị bằng bao nhiêu?",
        options: ["e - 1", "e", "e + 1", "1"],
        correctOption: 0,
        explanation: "∫ e^x dx = e^x|[0->1] = e^1 - e^0 = e - 1.",
        taxonomyLevel: "Thông hiểu",
        difficulty: "Trung bình",
        topic: "Tích phân xác định"
      },
      {
        id: "q_math_7",
        questionType: "multiple_choice",
        question: "Tập xác định của hàm số y = log2(x - 1) là khoảng nào sau đây?",
        options: ["(1; +∞)", "[1; +∞)", "(0; +∞)", "ℝ \\ {1}"],
        correctOption: 0,
        explanation: "Biểu thức dưới dấu logarit phải dương: x - 1 > 0 <=> x > 1. Vậy tập xác định D = (1; +∞).",
        taxonomyLevel: "Nhận biết",
        difficulty: "Dễ",
        topic: "Mũ và Logarit"
      },
      {
        id: "q_math_8",
        questionType: "multiple_choice",
        question: "Tập xác định của hàm số y = tan(x) là:",
        options: ["D = ℝ \\ {π/2 + kπ, k ∈ ℤ}", "D = ℝ \\ {kπ, k ∈ ℤ}", "D = ℝ", "D = [-1; 1]"],
        correctOption: 0,
        explanation: "Hàm số y = tan(x) = sin(x)/cos(x) xác định khi cos(x) ≠ 0 <=> x ≠ π/2 + kπ (k ∈ ℤ).",
        taxonomyLevel: "Nhận biết",
        difficulty: "Dễ",
        topic: "Lượng giác cơ bản"
      },
      {
        id: "q_math_9",
        questionType: "multiple_choice",
        question: "Đạo hàm của hàm số y = x⁴ - 2x² + 1 là:",
        options: ["y' = 4x³ - 4x", "y' = 4x³ - 2x", "y' = x³ - 4x", "y' = 4x³ - 4"],
        correctOption: 0,
        explanation: "Áp dụng công thức (x^n)' = n*x^(n-1): y' = 4x³ - 2*(2x) + 0 = 4x³ - 4x.",
        taxonomyLevel: "Thông hiểu",
        difficulty: "Trung bình",
        topic: "Đạo hàm hàm số"
      },
      {
        id: "q_math_10",
        questionType: "multiple_choice",
        question: "Công thức tính thể tích V của khối cầu bán kính R là:",
        options: ["V = (4/3) * π * R³", "V = 4 * π * R²", "V = π * R³", "V = (1/3) * π * R³"],
        correctOption: 0,
        explanation: "Thể tích khối cầu bán kính R được tính theo công thức chuẩn: V = (4/3) * π * R³.",
        taxonomyLevel: "Nhận biết",
        difficulty: "Dễ",
        topic: "Khối cầu tròn xoay"
      },
      {
        id: "q_math_11",
        questionType: "true_false",
        question: "Xét tính Đúng/Sai của các mệnh đề sau về cấp số cộng có số hạng đầu u1 = 3 và công sai d = 2:",
        tfStatements: [
          { id: "s1", statement: "a) Số hạng thứ hai u2 bằng 5.", isCorrect: true },
          { id: "s2", statement: "b) Công thức số hạng tổng quát là un = 2n + 1.", isCorrect: true },
          { id: "s3", statement: "c) Tổng 10 số hạng đầu tiên S10 bằng 120.", isCorrect: true },
          { id: "s4", statement: "d) Dãy số (un) là dãy số giảm.", isCorrect: false }
        ],
        explanation: "a) u2 = u1 + d = 3 + 2 = 5 (ĐÚNG). b) un = 3 + (n-1)*2 = 2n + 1 (ĐÚNG). c) S10 = 10*(3 + 21)/2 = 120 (ĐÚNG). d) Vì d = 2 > 0 nên dãy số tăng (SAI).",
        taxonomyLevel: "Thông hiểu",
        difficulty: "Trung bình",
        topic: "Cấp số cộng"
      },
      {
        id: "q_math_12",
        questionType: "short_answer",
        question: "Nghiệm của phương trình log3(x) = 2 là bao nhiêu?",
        shortAnswer: "9",
        acceptableAnswers: ["9", "x=9", "x = 9"],
        explanation: "log3(x) = 2 <=> x = 3² = 9.",
        taxonomyLevel: "Nhận biết",
        difficulty: "Dễ",
        topic: "Phương trình logarit"
      },
      {
        id: "q_math_13",
        questionType: "multiple_choice",
        question: "Trong không gian Oxyz, phương trình mặt phẳng đi qua điểm M(1; 2; 3) và có vectơ pháp tuyến n = (2; -1; 1) là:",
        options: ["2x - y + z - 3 = 0", "2x - y + z + 3 = 0", "x + 2y + 3z - 3 = 0", "2x + y + z - 7 = 0"],
        correctOption: 0,
        explanation: "Phương trình mặt phẳng: 2(x - 1) - 1(y - 2) + 1(z - 3) = 0 <=> 2x - y + z - 3 = 0.",
        taxonomyLevel: "Thông hiểu",
        difficulty: "Trung bình",
        topic: "Hình học Oxyz"
      },
      {
        id: "q_math_14",
        questionType: "multiple_choice",
        question: "Nguyên hàm của hàm số f(x) = 3x² + 2x là:",
        options: ["F(x) = x³ + x² + C", "F(x) = 6x + 2 + C", "F(x) = 3x³ + 2x² + C", "F(x) = x³ + 2x² + C"],
        correctOption: 0,
        explanation: "∫ (3x² + 2x) dx = 3*(x³/3) + 2*(x²/2) + C = x³ + x² + C.",
        taxonomyLevel: "Thông hiểu",
        difficulty: "Trung bình",
        topic: "Nguyên hàm cơ bản"
      },
      {
        id: "q_math_15",
        questionType: "short_answer",
        question: "Cho tập hợp A có 5 phần tử. Số tập con gồm 2 phần tử của A (ký hiệu C(5,2)) bằng bao nhiêu?",
        shortAnswer: "10",
        acceptableAnswers: ["10"],
        explanation: "Số tập con gồm 2 phần tử là tổ hợp chập 2 của 5: C(5, 2) = 5! / (2! * 3!) = 10.",
        taxonomyLevel: "Vận dụng",
        difficulty: "Trung bình",
        topic: "Tổ hợp và xác suất"
      }
    ];
  }

  if (subjLower.includes("công nghệ") || subjLower.includes("kỹ thuật") || subjLower.includes("vẽ") || subjLower.includes("cơ khí")) {
    return [
      {
        id: "q_cn_1",
        questionType: "multiple_choice",
        question: "Trong bản vẽ kỹ thuật, đường tâm và đường trục được biểu diễn bằng loại nét vẽ nào?",
        options: ["Nét gạch chấm mảnh", "Nét liền đậm", "Nét liền mảnh", "Nét đứt mảnh"],
        correctOption: 0,
        explanation: "Theo TCVN về bản vẽ kỹ thuật, đường tâm và đường trục đối xứng được vẽ bằng nét gạch chấm mảnh.",
        taxonomyLevel: "Nhận biết",
        difficulty: "Dễ",
        topic: "Các loại nét vẽ kỹ thuật"
      },
      {
        id: "q_cn_2",
        questionType: "multiple_choice",
        question: "Hình chiếu đứng của một vật thể thể hiện hướng chiếu từ vị trí nào sau đây?",
        options: ["Từ trước tới", "Từ trên xuống", "Từ trái sang", "Từ phải sang"],
        correctOption: 0,
        explanation: "Hình chiếu đứng có hướng chiếu từ trước tới mặt phẳng chiếu đứng.",
        taxonomyLevel: "Nhận biết",
        difficulty: "Dễ",
        topic: "Phương pháp chiếu góc"
      },
      {
        id: "q_cn_3",
        questionType: "multiple_choice",
        question: "Phương pháp gia công cơ khí nào sau đây thuộc nhóm phương pháp gia công có cắt gọt?",
        options: ["Gia công tiện, phay, bào, khoan", "Gia công đúc kim loại", "Gia công rèn và dập nóng", "Gia công bằng hàn áp lực"],
        correctOption: 0,
        explanation: "Gia công có cắt gọt sử dụng dụng cụ cắt để hớt đi lớp kim loại thừa (như tiện, phay, bào, khoan).",
        taxonomyLevel: "Thông hiểu",
        difficulty: "Trung bình",
        topic: "Phương pháp gia công cơ khí"
      },
      {
        id: "q_cn_4",
        questionType: "multiple_choice",
        question: "Trong động cơ đốt trong 4 kỳ, ở kỳ nào cả hai van (xupap) nạp và xupap thải đều đóng kín?",
        options: ["Kỳ nén và kỳ cháy-dãn nở (nổ)", "Kỳ nạp và kỳ thải", "Chỉ ở kỳ nạp", "Chỉ ở kỳ thải"],
        correctOption: 0,
        explanation: "Trong kỳ nén và kỳ cháy-dãn nở, cả xupap nạp và xupap thải đều đóng kín để nén hỗn hợp nhiên liệu và sinh công.",
        taxonomyLevel: "Thông hiểu",
        difficulty: "Trung bình",
        topic: "Động cơ đốt trong"
      },
      {
        id: "q_cn_5",
        questionType: "true_false",
        question: "Xét tính Đúng/Sai của các phát biểu sau đây về linh kiện điện tử trong mạch điện:",
        tfStatements: [
          { id: "s1", statement: "a) Điện trở có tác dụng cản trở dòng điện và phân chia điện áp trong mạch.", isCorrect: true },
          { id: "s2", statement: "b) Tụ điện có khả năng tích trữ và phóng điện năng khi có điện áp đặt vào.", isCorrect: true },
          { id: "s3", statement: "c) Diode bán dẫn chỉ cho dòng điện đi theo một chiều nhất định.", isCorrect: true },
          { id: "s4", statement: "d) Cuộn cảm chỉ cho dòng điện cao tần đi qua và cản trở dòng một chiều.", isCorrect: false }
        ],
        explanation: "a, b, c ĐÚNG. d SAI vì cuộn cảm cản trở dòng điện cao tần và cho dòng một chiều đi qua.",
        taxonomyLevel: "Thông hiểu",
        difficulty: "Trung bình",
        topic: "Linh kiện điện tử"
      },
      {
        id: "q_cn_6",
        questionType: "short_answer",
        question: "Trong hệ thống truyền động cơ khí, nếu bánh dẫn có 20 răng và bánh bị dẫn có 40 răng thì tỉ số truyền i bằng bao nhiêu?",
        shortAnswer: "2",
        acceptableAnswers: ["2", "i=2", "i = 2"],
        explanation: "Tỉ số truyền i = Z2 / Z1 = 40 / 20 = 2.",
        taxonomyLevel: "Vận dụng",
        difficulty: "Khó",
        topic: "Truyền động cơ khí"
      }
    ];
  }

  if (subjLower.includes("hóa")) {
    return [
      {
        id: "q_chem_1",
        questionType: "multiple_choice",
        question: "Dãy chất nào sau đây gồm các chất đều tác dụng được với dung dịch HCl tạo ra muối và nước?",
        options: ["NaOH, CuO, Fe(OH)3", "Cu, CuO, CaCO3", "Fe, Fe2O3, SO2", "Ag, Al2O3, BaSO4"],
        correctOption: 0,
        explanation: "NaOH (bazơ), CuO (oxit bazơ), Fe(OH)3 (bazơ) đều phản ứng trung hòa với HCl tạo muối và H2O.",
        taxonomyLevel: "Thông hiểu",
        difficulty: "Trung bình",
        topic: "Tính chất hóa học của Axit"
      },
      {
        id: "q_chem_2",
        questionType: "multiple_choice",
        question: "Khi cho khí CO2 dư đi qua dung dịch Ca(OH)2 trong suốt, hiện tượng quan sát được là:",
        options: [
          "Dung dịch xuất hiện kết tủa trắng, sau đó kết tủa tan dần thành dung dịch trong suốt",
          "Dung dịch xuất hiện kết tủa trắng không tan",
          "Dung dịch chuyển sang màu xanh lục",
          "Có hiện tượng sủi bọt khí không màu thoát ra"
        ],
        correctOption: 0,
        explanation: "Ban đầu CO2 + Ca(OH)2 -> CaCO3 (trắng) + H2O. Sau đó CO2 dư: CO2 + H2O + CaCO3 -> Ca(HCO3)2 (tan).",
        taxonomyLevel: "Thông hiểu",
        difficulty: "Trung bình",
        topic: "Phản ứng của CO2"
      },
      {
        id: "q_chem_3",
        questionType: "multiple_choice",
        question: "Công thức cấu tạo thu gọn của ester Etyl axetat (ethyl acetate) là:",
        options: ["CH3COOC2H5", "HCOOCH3", "C2H5COOCH3", "CH3COOH"],
        correctOption: 0,
        explanation: "Etyl axetat được tạo thành từ axit axetic (CH3COOH) và ancol etylic (C2H5OH), có công thức CH3COOC2H5.",
        taxonomyLevel: "Nhận biết",
        difficulty: "Dễ",
        topic: "Ester và Lipid"
      },
      {
        id: "q_chem_4",
        questionType: "true_false",
        question: "Xét tính Đúng/Sai của các phát biểu sau đây về tính chất hóa học của kim loại và hợp chất:",
        tfStatements: [
          { id: "s1", statement: "a) Kim loại Natri (Na) được bảo quản bằng cách ngâm chìm trong dầu hỏa.", isCorrect: true },
          { id: "s2", statement: "b) Kim loại kiềm có tính khử mạnh nhất trong cùng một chu kỳ.", isCorrect: true },
          { id: "s3", statement: "c) Nhôm (Al) tan tốt trong dung dịch HNO3 đặc, nguội.", isCorrect: false },
          { id: "s4", statement: "d) Thạch cao sống có công thức hóa học là CaSO4.2H2O.", isCorrect: true }
        ],
        explanation: "a, b, d ĐÚNG. c SAI vì Al, Fe, Cr bị thụ động hóa (không phản ứng) trong HNO3 đặc, nguội.",
        taxonomyLevel: "Thông hiểu",
        difficulty: "Trung bình",
        topic: "Kim loại kiềm và Nhôm"
      },
      {
        id: "q_chem_5",
        questionType: "short_answer",
        question: "Cho 5.6 gam sắt (Fe, M=56) tác dụng hoàn toàn với dung dịch HCl dư. Thể tích khí H2 thu được ở điều kiện tiêu chuẩn (đktc, 22.4 lit/mol) bằng bao nhiêu lít?",
        shortAnswer: "2.24",
        acceptableAnswers: ["2.24", "2,24", "2.24 lít", "2.24L"],
        explanation: "n_Fe = 5.6 / 56 = 0.1 mol. Phương trình: Fe + 2HCl -> FeCl2 + H2. n_H2 = 0.1 mol -> V_H2 = 0.1 * 22.4 = 2.24 lít.",
        taxonomyLevel: "Vận dụng",
        difficulty: "Khó",
        topic: "Tính toán hóa học"
      },
      {
        id: "q_chem_6",
        questionType: "multiple_choice",
        question: "Dung dịch Glucozơ (C6H12O6) tham gia phản ứng tráng bạc với dung dịch AgNO3 trong NH3 đun nóng thu được kim loại nào?",
        options: ["Bạc (Ag)", "Đồng (Cu)", "Sắt (Fe)", "Nhôm (Al)"],
        correctOption: 0,
        explanation: "Glucozơ chứa nhóm -CHO nên có tính khử, phản ứng với AgNO3/NH3 khử Ag+ thành Ag kim loại bám vào thành ống nghiệm.",
        taxonomyLevel: "Nhận biết",
        difficulty: "Dễ",
        topic: "Carbohydrate"
      }
    ];
  }

  if (subjLower.includes("sinh")) {
    return [
      {
        id: "q_bio_1",
        questionType: "multiple_choice",
        question: "Quá trình nhân đôi ADN ở sinh vật nhân thực diễn ra ở vị trí nào trong tế bào?",
        options: ["Trong nhân tế bào (tại kỳ trung gian)", "Trong tế bào chất", "Tại màng sinh chất", "Trong chất nền ty thể"],
        correctOption: 0,
        explanation: "Ở sinh vật nhân thực, nhân đôi ADN diễn ra chủ yếu trong nhân tế bào ở pha S của kỳ trung gian.",
        taxonomyLevel: "Nhận biết",
        difficulty: "Dễ",
        topic: "Cơ chế di truyền tế bào"
      },
      {
        id: "q_bio_2",
        questionType: "multiple_choice",
        question: "Sản phẩm trực tiếp của quá trình quang hợp ở thực vật được giải phóng ra môi trường khí quyển là khí nào?",
        options: ["Khí Ôxi (O2)", "Khí Các-bô-nhiêu (CO2)", "Khí Nitơ (N2)", "Khí Mê-tan (CH4)"],
        correctOption: 0,
        explanation: "Trong pha sáng quang hợp, quá trình quang phân nước giải phóng O2 ra ngoài môi trường.",
        taxonomyLevel: "Nhận biết",
        difficulty: "Dễ",
        topic: "Quang hợp ở thực vật"
      },
      {
        id: "q_bio_3",
        questionType: "multiple_choice",
        question: "Nguyên tố khoáng đóng vai trò quan trọng cấu tạo nên trung tâm phân tử diệp lục (Chlorophyll) ở cây xanh là:",
        options: ["Magie (Mg)", "Sắt (Fe)", "Canxi (Ca)", "Kali (K)"],
        correctOption: 0,
        explanation: "Mg là thành phần cấu trúc không thể thiếu của phân tử diệp lục, thiếu Mg lá cây sẽ bị vàng.",
        taxonomyLevel: "Nhận biết",
        difficulty: "Dễ",
        topic: "Dinh dưỡng khoáng ở thực vật"
      },
      {
        id: "q_bio_4",
        questionType: "true_false",
        question: "Xét tính Đúng/Sai của các phát biểu sau đây về cơ chế di truyền và biến dị ở cấp độ phân tử:",
        tfStatements: [
          { id: "s1", statement: "a) Quá trình nhân đôi ADN diễn ra theo nguyên tắc bổ sung và nguyên tắc bán bảo tồn.", isCorrect: true },
          { id: "s2", statement: "b) Mạch phân tử mARN được tổng hợp theo chiều 5' -> 3'.", isCorrect: true },
          { id: "s3", statement: "c) Bazơ nitơ Uraxil (U) tham gia cấu tạo nên phân tử ADN nhân tế bào.", isCorrect: false },
          { id: "s4", statement: "d) Enzim ADN polimeraza đóng vai trò tổng hợp mạch polynucleotit mới.", isCorrect: true }
        ],
        explanation: "a, b, d ĐÚNG. c SAI vì Uraxil (U) chỉ tham gia cấu tạo ARN, còn ADN chứa Timin (T).",
        taxonomyLevel: "Thông hiểu",
        difficulty: "Trung bình",
        topic: "Cơ chế di truyền phân tử"
      },
      {
        id: "q_bio_5",
        questionType: "short_answer",
        question: "Bộ nhiễm sắc thể lưỡng bội bình thường của loài người (kí hiệu 2n) gồm bao nhiêu chiếc nhiễm sắc thể?",
        shortAnswer: "46",
        acceptableAnswers: ["46", "46 chiếc", "2n=46"],
        explanation: "Bộ nhiễm sắc thể lưỡng bội 2n của người gồm 46 chiếc (23 cặp, trong đó có 22 cặp NST thường và 1 cặp NST giới tính).",
        taxonomyLevel: "Nhận biết",
        difficulty: "Dễ",
        topic: "Nhiễm sắc thể"
      },
      {
        id: "q_bio_6",
        questionType: "multiple_choice",
        question: "Dạng đột biến gen nào sau đây làm thay đổi một cặp nucleotit dẫn đến thay đổi duy nhất một axit amin trong chuỗi polipeptit?",
        options: ["Đột biến thay thế một cặp nucleotit", "Đột biến mất một cặp nucleotit", "Đột biến thêm một cặp nucleotit", "Đột biến lặp đoạn nhiễm sắc thể"],
        correctOption: 0,
        explanation: "Đột biến thay thế 1 cặp nucleotit chỉ làm biến đổi 1 bộ ba mã hóa trên mARN nên có thể làm thay đổi 1 axit amin tương ứng.",
        taxonomyLevel: "Thông hiểu",
        difficulty: "Trung bình",
        topic: "Đột biến gen"
      },
      {
        id: "q_bio_7",
        questionType: "multiple_choice",
        question: "Loại mạch dẫn trong thân cây có chức năng vận chuyển dòng nước và ion khoáng từ rễ lên lá là:",
        options: ["Mạch gỗ (Xylem)", "Mạch rây (Phloem)", "Tế bào biểu bì", "Mô phân sinh đỉnh"],
        correctOption: 0,
        explanation: "Mạch gỗ gồm các tế bào chết (quản bào và mạch ống) vận chuyển dòng nước và khoáng từ rễ lên các cơ quan trên cao.",
        taxonomyLevel: "Nhận biết",
        difficulty: "Dễ",
        topic: "Vận chuyển các chất trong cây"
      }
    ];
  }

  if (subjLower.includes("quốc phòng") || subjLower.includes("an ninh") || subjLower.includes("gdqp")) {
    return [
      {
        id: "q_gdqp_1",
        questionType: "multiple_choice",
        question: "Theo Luật Giáo dục Quốc phòng và An ninh năm 2013, trách nhiệm của học sinh, sinh viên đối với môn học là gì?",
        options: [
          "Học tập, rèn luyện kiến thức và kỹ năng quốc phòng an ninh theo đúng chương trình quy định",
          "Tự do lựa chọn không tham gia môn học nếu thấy không cần thiết",
          "Chỉ học phần lý thuyết và miễn toàn bộ các bài tập thực hành điều lệnh",
          "Ủy quyền cho người khác đi học và thực hành thay mình"
        ],
        correctOption: 0,
        explanation: "Học sinh, sinh viên có trách nhiệm hoàn thành đầy đủ chương trình GDQP&AN nhằm nâng cao ý thức bảo vệ Tổ quốc.",
        taxonomyLevel: "Nhận biết",
        difficulty: "Dễ",
        topic: "Luật GDQP&AN"
      },
      {
        id: "q_gdqp_2",
        questionType: "true_false",
        question: "Xét tính Đúng/Sai của các phát biểu sau đây về động tác di chuyển cơ bản trên chiến trường:",
        tfStatements: [
          { id: "s1", statement: "a) Động tác bò được sử dụng khi vận động qua nơi có địa hình, địa vật thấp hơn tầm quỳ.", isCorrect: true },
          { id: "s2", statement: "b) Động tác trườn áp dụng khi ở gần địch, địa hình rất trống trải và cần áp sát mục tiêu.", isCorrect: true },
          { id: "s3", statement: "c) Tư thế vọt tiến được thực hiện khi di chuyển nhanh từ nơi ẩn nấp sang vị trí mới.", isCorrect: true },
          { id: "s4", statement: "d) Động tác lê áp dụng khi di chuyển qua địa hình bằng phẳng không có bất kỳ che đỡ nào.", isCorrect: false }
        ],
        explanation: "a, b, c ĐÚNG. d SAI vì động tác lê dùng khi vận động qua nơi có vật che đỡ cao ngang tầm người ngồi.",
        taxonomyLevel: "Thông hiểu",
        difficulty: "Trung bình",
        topic: "Kỹ thuật di chuyển chiến thuật"
      },
      {
        id: "q_gdqp_3",
        questionType: "multiple_choice",
        question: "Trong kỹ thuật sơ cứu y tế quân sự, nguyên tắc hàng đầu khi đặt garô cầm máu tạm thời vết thương động mạch là:",
        options: [
          "Đặt garô ở vị trí sát phía trên vết thương (phía gần tim hơn)",
          "Đặt garô trực tiếp đè lên giữa vết thương hở",
          "Đặt garô ở vị trí phía dưới vết thương (phía xa tim hơn)",
          "Buộc garô thật chặt và giữ liên tục trên 5 giờ không xả"
        ],
        correctOption: 0,
        explanation: "Do máu động mạch chảy từ tim ra nên phải đặt garô ở phía trên vết thương (gần tim hơn) và nới garô định kỳ.",
        taxonomyLevel: "Thông hiểu",
        difficulty: "Trung bình",
        topic: "Sơ cứu y tế quân sự"
      },
      {
        id: "q_gdqp_4",
        questionType: "short_answer",
        question: "Ở tư thế 'Nghiêm' trong điều lệnh đội ngũ, hai gót chân sát nhau và hai đầu bàn chân mở rộng tạo thành một góc bao nhiêu độ?",
        shortAnswer: "60",
        acceptableAnswers: ["60", "60 độ", "60°"],
        explanation: "Theo quy chuẩn điều lệnh đội ngũ, hai gót chân đặt sát nhau trên một đường thẳng, hai đầu bàn chân mở rộng góc 60°.",
        taxonomyLevel: "Nhận biết",
        difficulty: "Dễ",
        topic: "Điều lệnh đội ngũ"
      }
    ];
  }

  if (subjLower.includes("văn") || subjLower.includes("ngữ văn")) {
    return [
      {
        id: "q_van_1",
        questionType: "multiple_choice",
        question: "Phương thức biểu đạt chính được sử dụng trong văn bản nghị luận văn học hoặc nghị luận xã hội là gì?",
        options: [
          "Phương thức nghị luận (dùng lý lẽ và chứng cứ để thuyết phục)",
          "Phương thức tự sự (kể lại diễn biến câu chuyện)",
          "Phương thức miêu tả (tái hiện đặc điểm sự vật)",
          "Phương thức biểu cảm (bộc lộ cảm xúc trực tiếp)"
        ],
        correctOption: 0,
        explanation: "Văn bản nghị luận sử dụng hệ thống luận điểm, lý lẽ và dẫn chứng để làm sáng tỏ một tư tưởng, quan điểm.",
        taxonomyLevel: "Nhận biết",
        difficulty: "Dễ",
        topic: "Phương thức biểu đạt"
      },
      {
        id: "q_van_2",
        questionType: "multiple_choice",
        question: "Ai là tác giả của bản 'Tuyên ngôn Độc lập' lịch sử đọc tại Quảng trường Ba Đình ngày 2/9/1945?",
        options: ["Hồ Chí Minh", "Phan Bội Châu", "Phan Châu Trinh", "Nguyễn Trãi"],
        correctOption: 0,
        explanation: "Chủ tịch Hồ Chí Minh là người soạn thảo và tuyên đọc bản Tuyên ngôn Độc lập khai sinh ra nước VNDCCH.",
        taxonomyLevel: "Nhận biết",
        difficulty: "Dễ",
        topic: "Tác gia văn học"
      },
      {
        id: "q_van_3",
        questionType: "multiple_choice",
        question: "Biện pháp tu từ nào được sử dụng trong câu thơ: 'Thân em như chẽn lúa đòng đòng / Phất phơ dưới ngọn nắng hồng ban mai'?",
        options: ["So sánh", "Ẩn dụ", "Hoán dụ", "Điệp từ"],
        correctOption: 0,
        explanation: "Từ 'như' kết nối hai hình ảnh đối chiếu 'Thân em' và 'chẽn lúa đòng đòng', thể hiện biện pháp tu từ So sánh.",
        taxonomyLevel: "Thông hiểu",
        difficulty: "Trung bình",
        topic: "Biện pháp tu từ"
      },
      {
        id: "q_van_4",
        questionType: "true_false",
        question: "Xét tính Đúng/Sai của các nhận định sau đây về đặc trưng phong cách ngôn ngữ và văn học:",
        tfStatements: [
          { id: "s1", statement: "a) Phong cách ngôn ngữ báo chí có tính thông tin thời sự, tính ngắn gọn và sinh động.", isCorrect: true },
          { id: "s2", statement: "b) Lập luận trong văn bản nghị luận gồm có luận điểm, lý lẽ và dẫn chứng.", isCorrect: true },
          { id: "s3", statement: "c) Biện pháp ẩn dụ là gọi tên sự vật này bằng tên sự vật khác có nét tương đồng.", isCorrect: true },
          { id: "s4", statement: "d) Văn bản tự sự hoàn toàn không thể kết hợp yếu tố miêu tả hay biểu cảm.", isCorrect: false }
        ],
        explanation: "a, b, c ĐÚNG. d SAI vì văn bản tự sự thường xuyên đan xen miêu tả và biểu cảm để gia tăng sức gợi.",
        taxonomyLevel: "Thông hiểu",
        difficulty: "Trung bình",
        topic: "Tiếng Việt và Làm văn"
      },
      {
        id: "q_van_5",
        questionType: "short_answer",
        question: "Hãy ghi tên biện pháp tu từ gợi tả hình ảnh đối chiếu trực tiếp qua các từ so sánh như 'như', 'bằng', 'tựa như':",
        shortAnswer: "So sánh",
        acceptableAnswers: ["So sánh", "so sánh", "Biện pháp so sánh"],
        explanation: "Biện pháp so sánh làm tăng sức gợi hình, gợi cảm cho sự diễn đạt.",
        taxonomyLevel: "Nhận biết",
        difficulty: "Dễ",
        topic: "Biện pháp tu từ"
      }
    ];
  }

  if (subjLower.includes("anh") || subjLower.includes("english")) {
    return [
      {
        id: "q_eng_1",
        questionType: "multiple_choice",
        question: "Choose the word whose underlined part is pronounced differently from the others:",
        options: ["worked", "played", "cleaned", "offered"],
        correctOption: 0,
        explanation: "'worked' has the -ed ending pronounced as /t/, while the others are pronounced as /d/.",
        taxonomyLevel: "Nhận biết",
        difficulty: "Dễ",
        topic: "Phonetics - Pronunciation"
      },
      {
        id: "q_eng_2",
        questionType: "multiple_choice",
        question: "Choose the word that has a different stress pattern from the others:",
        options: ["important", "beautiful", "dangerous", "terrible"],
        correctOption: 0,
        explanation: "'important' is stressed on the second syllable (/ɪmˈpɔːtnt/), whereas others are stressed on the first syllable.",
        taxonomyLevel: "Thông hiểu",
        difficulty: "Trung bình",
        topic: "Word Stress"
      },
      {
        id: "q_eng_3",
        questionType: "multiple_choice",
        question: "If I _____ enough money right now, I would buy that new laptop for my study.",
        options: ["had", "have", "will have", "have had"],
        correctOption: 0,
        explanation: "Conditional Sentence Type 2 (unreal present condition): If + S + V-ed/past simple, S + would + V-bare.",
        taxonomyLevel: "Thông hiểu",
        difficulty: "Trung bình",
        topic: "Conditional Sentences"
      },
      {
        id: "q_eng_4",
        questionType: "true_false",
        question: "Evaluate True/False for the following English grammar statements:",
        tfStatements: [
          { id: "s1", statement: "a) Present Perfect tense connects a past action to the present moment.", isCorrect: true },
          { id: "s2", statement: "b) Passive voice converts the object of an active sentence into the new subject.", isCorrect: true },
          { id: "s3", statement: "c) Relative pronoun 'who' is used exclusively for things and places.", isCorrect: false },
          { id: "s4", statement: "d) Modal verb 'must' expresses strong necessity or obligation.", isCorrect: true }
        ],
        explanation: "a, b, d are TRUE. c is FALSE because 'who' is used for people, whereas 'which' is used for things.",
        taxonomyLevel: "Thông hiểu",
        difficulty: "Trung bình",
        topic: "Grammar Rules"
      },
      {
        id: "q_eng_5",
        questionType: "short_answer",
        question: "Complete the sentence with the past participle form of the verb 'WRITE': 'This article was _____ by an expert.'",
        shortAnswer: "written",
        acceptableAnswers: ["written", "WRITTEN"],
        explanation: "Passive voice structure: S + was/were + V3 (past participle). The V3 of 'write' is 'written'.",
        taxonomyLevel: "Nhận biết",
        difficulty: "Dễ",
        topic: "Verb Forms"
      }
    ];
  }

  if (subjLower.includes("sử") || subjLower.includes("lịch sử")) {
    return [
      {
        id: "q_hist_1",
        questionType: "multiple_choice",
        question: "Sự kiện lịch sử nào đánh dấu bước ngoặt vĩ đại của Cách mạng Việt Nam, mở ra kỷ nguyên độc lập tự do năm 1945?",
        options: ["Thắng lợi của Cách mạng tháng Tám năm 1945", "Chiến dịch Điện Biên Phủ năm 1954", "Hiệp định Pa-ri năm 1973", "Tổng tiến công mùa Xuân 1975"],
        correctOption: 0,
        explanation: "Cách mạng tháng Tám năm 1945 lật đổ chế độ phong kiến và ách đô hộ của thực dân, thành lập nước VNDCCH.",
        taxonomyLevel: "Nhận biết",
        difficulty: "Dễ",
        topic: "Lịch sử Việt Nam hiện đại"
      },
      {
        id: "q_hist_2",
        questionType: "multiple_choice",
        question: "Chiến thắng lịch sử 'Lừng lẫy năm châu, chấn động địa cầu' năm 1954 kết thúc cuộc kháng chiến chống Pháp diễn ra tại đâu?",
        options: ["Điện Biên Phủ", "Việt Bắc", "Hà Nội - Điện Biên Phủ trên không", "Ấp Bắc"],
        correctOption: 0,
        explanation: "Chiến dịch Điện Biên Phủ năm 1954 buộc thực dân Pháp phải ký Hiệp định Giơ-ne-vơ chấm đứt chiến tranh xâm lược.",
        taxonomyLevel: "Nhận biết",
        difficulty: "Dễ",
        topic: "Kháng chiến chống Pháp"
      },
      {
        id: "q_hist_3",
        questionType: "short_answer",
        question: "Chủ tịch Hồ Chí Minh đọc bản Tuyên ngôn Độc lập khai sinh ra nước Việt Nam Dân chủ Cộng hòa vào ngày tháng năm nào? (Viết dạng DD/MM/YYYY)",
        shortAnswer: "02/09/1945",
        acceptableAnswers: ["02/09/1945", "2/9/1945", "02-09-1945", "2-9-1945"],
        explanation: "Ngày 2/9/1945 là ngày Quốc khánh của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam.",
        taxonomyLevel: "Nhận biết",
        difficulty: "Dễ",
        topic: "Sự kiện lịch sử"
      },
      {
        id: "q_hist_4",
        questionType: "true_false",
        question: "Xét tính Đúng/Sai của các phát biểu sau đây về lịch sử dân tộc Việt Nam:",
        tfStatements: [
          { id: "s1", statement: "a) Đảng Cộng sản Việt Nam được thành lập vào ngày 3/2/1930 tại Cửu Long (Hương Cảng, Trung Quốc).", isCorrect: true },
          { id: "s2", statement: "b) Chiến dịch Hồ Chí Minh lịch sử giải phóng hoàn toàn miền Nam diễn ra vào năm 1975.", isCorrect: true },
          { id: "s3", statement: "c) Hiệp định Pa-ri về chấm dứt chiến tranh lập lại hòa bình ở Việt Nam được ký kết năm 1954.", isCorrect: false },
          { id: "s4", statement: "d) Cuộc Tổng tiến công và nổi dậy Xuân Mậu Thân diễn ra vào năm 1968.", isCorrect: true }
        ],
        explanation: "a, b, d ĐÚNG. c SAI vì Hiệp định Pa-ri ký kết năm 1973, còn Hiệp định Giơ-ne-vơ mới ký năm 1954.",
        taxonomyLevel: "Thông hiểu",
        difficulty: "Trung bình",
        topic: "Kháng chiến chống Mỹ"
      }
    ];
  }

  if (subjLower.includes("địa") || subjLower.includes("địa lý")) {
    return [
      {
        id: "q_geo_1",
        questionType: "multiple_choice",
        question: "Đặc điểm nổi bật của khí hậu phần lãnh thổ phía Bắc nước ta (từ dãy Bạch Mã trở ra) là:",
        options: [
          "Khí hậu nhiệt đới ẩm gió mùa có mùa đông lạnh",
          "Khí hậu cận xích đạo gió mùa nóng quanh năm",
          "Khí hậu ôn đới lục địa khô hạn",
          "Khí hậu nhiệt đới khô gió phơn Tây Nam"
        ],
        correctOption: 0,
        explanation: "Phía Bắc chịu ảnh hưởng mạnh của gió mùa Đông Bắc nên có mùa đông lạnh, nhiệt độ giảm sút.",
        taxonomyLevel: "Nhận biết",
        difficulty: "Dễ",
        topic: "Địa lý tự nhiên Việt Nam"
      },
      {
        id: "q_geo_2",
        questionType: "multiple_choice",
        question: "Vùng kinh tế dẫn đầu cả nước về quy mô công nghiệp khai thác và chế biến dầu khí ở Việt Nam là:",
        options: ["Đông Nam Bộ", "Đồng bằng sông Cửu Long", "Đồng bằng sông Hồng", "Duyên hải Nam Trung Bộ"],
        correctOption: 0,
        explanation: "Đông Nam Bộ là vùng phát triển năng lượng dầu khí lớn nhất nước ta với các mỏ Bạch Hổ, Rồng, Đại Hùng.",
        taxonomyLevel: "Thông hiểu",
        difficulty: "Trung bình",
        topic: "Địa lý các vùng kinh tế"
      },
      {
        id: "q_geo_3",
        questionType: "short_answer",
        question: "Hãy ghi tên đỉnh núi cao nhất Việt Nam và toàn bán đảo Đông Dương (được mệnh danh là 'Nóc nhà Đông Dương'):",
        shortAnswer: "Fansipan",
        acceptableAnswers: ["Fansipan", "Phan-xi-păng", "Phansipan", "FansiPan"],
        explanation: "Đỉnh Fansipan nằm trên dãy Hoàng Liên Sơn có độ cao 3.143 mét.",
        taxonomyLevel: "Nhận biết",
        difficulty: "Dễ",
        topic: "Địa hình Việt Nam"
      },
      {
        id: "q_geo_4",
        questionType: "true_false",
        question: "Xét tính Đúng/Sai của các phát biểu sau đây về địa lý tự nhiên Việt Nam:",
        tfStatements: [
          { id: "s1", statement: "a) Đồi núi chiếm khoảng 3/4 diện tích lãnh thổ đất liền nước ta.", isCorrect: true },
          { id: "s2", statement: "b) Chiều dài đường bờ biển nước ta kéo dài khoảng 3.260 km.", isCorrect: true },
          { id: "s3", statement: "c) Sông Hồng và sông Cửu Long là hai hệ thống sông lớn nhất đổ ra biển Đông.", isCorrect: true },
          { id: "s4", statement: "d) Việt Nam nằm hoàn toàn trong vùng nội chí tuyến bán cầu Nam.", isCorrect: false }
        ],
        explanation: "a, b, c ĐÚNG. d SAI vì Việt Nam nằm hoàn toàn ở bán cầu Bắc.",
        taxonomyLevel: "Thông hiểu",
        difficulty: "Trung bình",
        topic: "Đặc điểm địa lý Việt Nam"
      }
    ];
  }

  if (subjLower.includes("tin")) {
    return [
      {
        id: "q_tin_1",
        questionType: "multiple_choice",
        question: "Trong mô hình dữ liệu quan hệ, một bảng (Table) biểu diễn khái niệm nào sau đây?",
        options: ["Một quan hệ (Relation)", "Một bộ (Tuple)", "Một thuộc tính (Attribute)", "Một kiểu dữ liệu (Data Type)"],
        correctOption: 0,
        explanation: "Trong mô hình CSDL quan hệ, cấu trúc dữ liệu chính là bảng (Table), biểu diễn một Quan hệ (Relation).",
        taxonomyLevel: "Nhận biết",
        difficulty: "Dễ",
        topic: "Mô hình quan hệ"
      },
      {
        id: "q_tin_2",
        questionType: "multiple_choice",
        question: "Khóa chính (Primary Key) trong một bảng CSDL phải thỏa mãn điều kiện tối quan trọng nào?",
        options: [
          "Các giá trị không được trùng lặp và không được rỗng (NOT NULL)",
          "Được phép chứa giá trị trùng lặp nhưng không được rỗng",
          "Phải là kiểu dữ liệu số nguyên tăng tự động",
          "Chỉ gồm duy nhất một thuộc tính đơn lẻ"
        ],
        correctOption: 0,
        explanation: "Khóa chính dùng để định danh duy nhất mỗi bản ghi trong bảng, nên giá trị phải duy nhất và không được NULL.",
        taxonomyLevel: "Thông hiểu",
        difficulty: "Trung bình",
        topic: "Khóa chính CSDL"
      },
      {
        id: "q_tin_3",
        questionType: "true_false",
        question: "Đánh giá tính Đúng/Sai của các phát biểu sau đây về Hệ Quản trị CSDL (DBMS):",
        tfStatements: [
          { id: "s1", statement: "a) MySQL, PostgreSQL, MS Access và Oracle là các Hệ QTCSDL quan hệ.", isCorrect: true },
          { id: "s2", statement: "b) Ngôn ngữ SQL (Structured Query Language) dùng để truy vấn, thêm, sửa, xóa dữ liệu.", isCorrect: true },
          { id: "s3", statement: "c) Nhóm lệnh DML (Data Manipulation Language) dùng để tạo và xóa bảng CSDL.", isCorrect: false },
          { id: "s4", statement: "d) Tính không dư thừa giúp đảm bảo dữ liệu nhất quán và tiết kiệm dung lượng lưu trữ.", isCorrect: true }
        ],
        explanation: "a, b, d ĐÚNG. c SAI vì nhóm lệnh tạo/xóa bảng thuộc DDL, DML dùng để cập nhật/truy vấn dữ liệu.",
        taxonomyLevel: "Thông hiểu",
        difficulty: "Trung bình",
        topic: "Hệ quản trị CSDL"
      },
      {
        id: "q_tin_4",
        questionType: "short_answer",
        question: "Cho một bảng CSDL gồm 2000 bản ghi, mỗi bản ghi có độ dài 256 Bytes. Tính tổng dung lượng bảng theo Kilobytes (KB)? (1 KB = 1024 Bytes).",
        shortAnswer: "500",
        acceptableAnswers: ["500", "500 KB", "500KB"],
        explanation: "Tổng dung lượng = 2000 * 256 = 512,000 Bytes = 500 KB.",
        taxonomyLevel: "Vận dụng",
        difficulty: "Khó",
        topic: "Dung lượng CSDL"
      },
      {
        id: "q_tin_5",
        questionType: "multiple_choice",
        question: "Cơ chế bảo mật nào trong Hệ CSDL giúp giới hạn quyền hạn truy cập dữ liệu của từng nhóm người dùng?",
        options: ["Phân quyền truy cập (Authorization/Privileges)", "Mã hóa dữ liệu", "Sao lưu dự phòng (Backup)", "Nén dữ liệu"],
        correctOption: 0,
        explanation: "Phân quyền truy cập quy định mỗi tài khoản người dùng chỉ được phép đọc, ghi hay chỉnh sửa trên các tập dữ liệu nhất định.",
        taxonomyLevel: "Nhận biết",
        difficulty: "Dễ",
        topic: "Bảo mật CSDL"
      }
    ];
  }

  if (subjLower.includes("lý") || subjLower.includes("vật lý") || subjLower.includes("khoa học tự nhiên")) {
    return [
      {
        id: "q_phy_1",
        questionType: "multiple_choice",
        question: "Trong dây dẫn kim loại, các hạt mang điện tự do chuyển dời có hướng tạo thành dòng điện là loại hạt nào?",
        options: ["Các electron tự do", "Các ion dương", "Các ion âm", "Các hạt proton"],
        correctOption: 0,
        explanation: "Bản chất dòng điện trong kim loại là dòng chuyển dời có hướng của các electron tự do dưới tác dụng của điện trường.",
        taxonomyLevel: "Nhận biết",
        difficulty: "Dễ",
        topic: "Dòng điện trong kim loại"
      },
      {
        id: "q_phy_2",
        questionType: "multiple_choice",
        question: "Một mạch điện kín gồm nguồn điện có suất điện động E = 12V, điện trở trong r = 1 Ω, mạch ngoài có điện trở R = 5 Ω. Cường độ dòng điện I chạy trong mạch là:",
        options: ["2 A", "2.4 A", "12 A", "2.2 A"],
        correctOption: 0,
        explanation: "Áp dụng định luật Ôm cho toàn mạch: I = E / (R + r) = 12 / (5 + 1) = 2 A.",
        taxonomyLevel: "Thông hiểu",
        difficulty: "Trung bình",
        topic: "Định luật Ôm toàn mạch"
      },
      {
        id: "q_phy_3",
        questionType: "true_false",
        question: "Xét tính Đúng/Sai của các phát biểu sau đây về tác dụng của dòng điện:",
        tfStatements: [
          { id: "s1", statement: "a) Bàn là điện và bếp điện hoạt động dựa trên tác dụng nhiệt của dòng điện.", isCorrect: true },
          { id: "s2", statement: "b) Đèn LED phát sáng nhờ tác dụng nhiệt nóng sáng đến nhiệt độ cao.", isCorrect: false },
          { id: "s3", statement: "c) Cuộn dây có dòng điện chạy qua có khả năng hút đinh sắt nhờ tác dụng từ.", isCorrect: true },
          { id: "s4", statement: "d) Tác dụng sinh lý của dòng điện được ứng dụng trong châm cứu điện y học.", isCorrect: true }
        ],
        explanation: "a, c, d ĐÚNG. b SAI vì đèn LED sáng nhờ tác dụng phát sáng trực tiếp, không qua đốt nóng dây tóc.",
        taxonomyLevel: "Thông hiểu",
        difficulty: "Trung bình",
        topic: "Tác dụng dòng điện"
      },
      {
        id: "q_phy_4",
        questionType: "short_answer",
        question: "Tính điện trở tương đương R (Ω) của đoạn mạch gồm hai điện trở R1 = 6 Ω và R2 = 12 Ω mắc song song.",
        shortAnswer: "4",
        acceptableAnswers: ["4", "4 Ohm", "4Ω"],
        explanation: "R_s = (R1 * R2) / (R1 + R2) = (6 * 12) / (6 + 12) = 72 / 18 = 4 Ω.",
        taxonomyLevel: "Vận dụng",
        difficulty: "Khó",
        topic: "Mạch điện song song"
      },
      {
        id: "q_phy_5",
        questionType: "short_answer",
        question: "Một sóng cơ có tần số f = 50 Hz truyền trong môi trường với bước sóng λ = 0.4 m. Tốc độ truyền sóng v (m/s) bằng bao nhiêu?",
        shortAnswer: "20",
        acceptableAnswers: ["20", "20 m/s", "20m/s"],
        explanation: "Tốc độ truyền sóng v = f * λ = 50 * 0.4 = 20 m/s.",
        taxonomyLevel: "Vận dụng",
        difficulty: "Khó",
        topic: "Sóng cơ học"
      }
    ];
  }

  // Authentic factual general knowledge questions (NO procedural meta-questions)
  return [
    {
      id: "q_gen_1",
      questionType: "multiple_choice",
      question: `Trong phương pháp nghiên cứu và phân tích bài học môn ${cleanSubj}, yếu tố đầu tiên cần xác định khi tiếp cận dữ liệu là:`,
      options: [
        "Xác định mục tiêu, khái niệm trọng tâm và các giả thuyết cần kiểm chứng",
        "Bỏ qua bước thu thập dữ liệu và đưa ra kết luận ngay",
        "Chỉ ghi nhớ kết quả mẫu mà không cần phân tích quy trình",
        "Thay đổi dữ liệu ban đầu để phù hợp với dự đoán cá nhân"
      ],
      correctOption: 0,
      explanation: "Quy trình nghiên cứu chuẩn đòi hỏi xác định rõ mục tiêu, dữ liệu đầu vào và các khái niệm nền tảng trước khi phân tích.",
      taxonomyLevel: "Nhận biết",
      difficulty: "Dễ",
      topic: "Phương pháp phân tích"
    },
    {
      id: "q_gen_2",
      questionType: "true_false",
      question: `Xét tính Đúng/Sai của các nguyên tắc xử lý và vận dụng kiến thức môn ${cleanSubj}:`,
      tfStatements: [
        { id: "s1", statement: "a) Việc đối chiếu kết quả bài tập với lý thuyết giúp phát hiện các sai sót logic.", isCorrect: true },
        { id: "s2", statement: "b) Phân tích sơ đồ và biểu đồ là kỹ năng quan trọng trong tổng hợp dữ liệu.", isCorrect: true },
        { id: "s3", statement: "c) Các quy chuẩn kỹ thuật và định lý khoa học chỉ áp dụng trong một số ít trường hợp ngoại lệ.", isCorrect: false },
        { id: "s4", statement: "d) Việc tự đánh giá tiến độ học tập giúp điều chỉnh phương pháp ôn tập phù hợp.", isCorrect: true }
      ],
      explanation: "a, b, d ĐÚNG. c SAI vì các nguyên tắc khoa học mang tính quy chuẩn phổ quát.",
      taxonomyLevel: "Thông hiểu",
      difficulty: "Trung bình",
      topic: "Tư duy phân tích"
    }
  ];
}

/**
  * Smart content-driven fallback builder when AI response is truncated or rate-limited.
  * Guarantees 100% distinct, non-repeating, document-grounded questions.
  */
function buildSmartFallbackFromContent(
  rawContent: string,
  subject: string = "Tin học",
  grade: string = "Lớp 12",
  title?: string,
  targetCount: number = 10
): any {
  const cleanSubj = (subject || "Tin học").trim();
  const cleanGrade = (grade || "Lớp 12").trim();
  const fallbackTitle = title || `Ngân hàng câu hỏi Môn ${cleanSubj} (${cleanGrade})`;

  const text = (rawContent || "").trim();

  // Extract meaningful sentences from actual document
  const rawSentences = text
    .split(/(?<=[.!?])\s+|\n+/)
    .map(s => s.trim().replace(/^[-•*–\d\.\)]\s*/, ''))
    .filter(s => {
      if (s.length < 25 || s.length > 300) return false;
      const words = s.split(/\s+/);
      if (words.length < 6) return false;
      if (/^(trang|page|mã đề|họ và tên|số báo danh|chữ ký|chủ đề|môn|lớp|ôn tập|luyện thi|bài tập|đề thi|thời gian|ngày)/i.test(s)) return false;
      if (s.toLowerCase().includes(cleanSubj.toLowerCase()) && words.length < 8) return false;
      return true;
    });

  const sentences = Array.from(new Set(rawSentences));
  const questions: any[] = [];
  const usedSignatures = new Set<string>();

  const addQuestion = (qObj: any) => {
    let sigContent = String(qObj.question || '').trim();
    if (qObj.questionType === 'true_false' && Array.isArray(qObj.tfStatements)) {
      sigContent += ' | ' + qObj.tfStatements.map((s: any) => s?.statement || s?.text || '').join(' | ');
    } else if (qObj.questionType === 'multiple_choice' && Array.isArray(qObj.options)) {
      sigContent += ' | ' + qObj.options.join(' | ');
    } else if (qObj.questionType === 'short_answer') {
      sigContent += ' | ' + (qObj.shortAnswer || '');
    }

    const normSig = sigContent.toLowerCase().replace(/\s+/g, ' ').replace(/[.,?!:;]/g, '');
    if (normSig && !usedSignatures.has(normSig)) {
      usedSignatures.add(normSig);
      questions.push(sanitizeQuestionOptionsServer(qObj));
    }
  };

  // 1. Draw from subject domain question bank first for rich authentic subject questions
  const subjLower = cleanSubj.toLowerCase();
  const domainQuestions = getSubjectDomainQuestions(subjLower, cleanSubj, cleanGrade);

  for (const dq of domainQuestions) {
    if (questions.length >= targetCount) break;
    addQuestion(dq);
  }

  // 2. Extract questions from document sentences if we have at least 2 distinct valid sentences
  if (sentences.length >= 2 && questions.length < targetCount) {
    for (let pass = 0; pass < 10 && questions.length < targetCount; pass++) {
      for (let i = 0; i < sentences.length && questions.length < targetCount; i++) {
        const sentence = sentences[i];
        const nextSentence = sentences[(i + 1) % sentences.length];
        const words = sentence.split(' ').filter(w => w.length > 2);
        const keyTopic = words.length > 2 ? words.slice(0, 4).join(' ') : cleanSubj;

        const modType = (i + pass) % 3;

        if (modType === 0) {
          const distractors = generateSmartContextualDistractors(
            `Nội dung liên quan đến '${keyTopic}'`,
            keyTopic,
            sentence,
            3,
            i
          );
          addQuestion({
            id: `q_content_mc_${pass}_${i}_${Date.now()}`,
            questionType: "multiple_choice",
            question: pass === 0 
              ? `Theo tài liệu bài học môn ${cleanSubj}, khẳng định nào sau đây là ĐÚNG liên quan đến '${keyTopic}'?`
              : `Trong kiến thức bài học môn ${cleanSubj} (${cleanGrade}), khẳng định nào dưới đây chính xác khi đề cập đến '${keyTopic}'?`,
            options: [
              sentence,
              distractors[0] || `Khẳng định liên quan đến ${keyTopic} cần xét thêm điều kiện mở rộng.`,
              distractors[1] || `Dữ liệu về ${keyTopic} chỉ có tính chất tham khảo cục bộ.`,
              distractors[2] || `Khái niệm ${keyTopic} chưa được đưa vào chương trình đánh giá.`
            ],
            correctOption: 0,
            explanation: `Theo tài liệu bài học: "${sentence}"`,
            taxonomyLevel: (i + pass) % 2 === 0 ? "Nhận biết" : "Thông hiểu",
            difficulty: (i + pass) % 2 === 0 ? "Dễ" : "Trung bình",
            topic: keyTopic
          });
        } else if (modType === 1) {
          const falseStmt1 = sentence
            .replace(/\b(có|là|được|giúp|gồm|thuộc|cần|phải)\b/gi, 'không $1')
            .replace(/\b(luôn|thường|hoàn toàn)\b/gi, 'chưa bao giờ');
          const falseStmt2 = nextSentence
            .replace(/\b(đúng|chính xác|phù hợp|đạt)\b/gi, 'không chính xác')
            .replace(/\b(tất cả|mọi)\b/gi, 'một số ít');

          addQuestion({
            id: `q_content_tf_${pass}_${i}_${Date.now()}`,
            questionType: "true_false",
            question: `Đánh giá tính Đúng/Sai của các nhận định sau liên quan đến chủ đề '${keyTopic}':`,
            tfStatements: [
              { id: `tf_s1_${pass}_${i}`, statement: `a) ${sentence}`, isCorrect: true },
              { id: `tf_s2_${pass}_${i}`, statement: `b) ${nextSentence}`, isCorrect: true },
              { id: `tf_s3_${pass}_${i}`, statement: `c) ${falseStmt1 !== sentence ? falseStmt1 : 'Phương pháp này hoàn toàn không thể áp dụng trong thực tiễn.'}`, isCorrect: false },
              { id: `tf_s4_${pass}_${i}`, statement: `d) ${falseStmt2 !== nextSentence ? falseStmt2 : 'Mọi chỉ số thu được đều không mang giá trị phân tích.'}`, isCorrect: false }
            ],
            explanation: `Nhận định a, b trích trực tiếp từ tài liệu bài học. Nhận định c, d là phát biểu chưa chính xác.`,
            taxonomyLevel: "Thông hiểu",
            difficulty: "Trung bình",
            topic: keyTopic
          });
        } else {
          const midIdx = Math.floor(words.length / 2);
          const targetWord = words[midIdx] || keyTopic;
          const masked = sentence.replace(targetWord, "_____");
          addQuestion({
            id: `q_content_sa_${pass}_${i}_${Date.now()}`,
            questionType: "short_answer",
            question: `Xác định từ/thuật ngữ còn thiếu trong trích dẫn bài học: "${masked}"`,
            shortAnswer: targetWord,
            acceptableAnswers: [targetWord, targetWord.toLowerCase()],
            explanation: `Thuật ngữ chính xác là "${targetWord}" theo tài liệu bài học.`,
            taxonomyLevel: "Vận dụng",
            difficulty: "Khó",
            topic: keyTopic
          });
        }
      }
    }
  }

  // If STILL below targetCount, recycle domain questions with fresh unique IDs and topic variations (NO meta-procedural questions)
  let extIndex = 1;
  const poolToDraw = domainQuestions.length > 0 ? domainQuestions : getSubjectDomainQuestions("toán", "Toán", "Lớp 12");
  while (questions.length < targetCount && poolToDraw.length > 0) {
    const baseQ = poolToDraw[(extIndex - 1) % poolToDraw.length];
    const newId = `${baseQ.id}_ext_${extIndex}_${Date.now()}`;
    addQuestion({
      ...baseQ,
      id: newId
    });
    extIndex++;
  }

  return {
    title: fallbackTitle,
    summaryPoints: sentences.length >= 3
      ? sentences.slice(0, 5).map(s => s.length > 90 ? s.substring(0, 87) + "..." : s)
      : [
          `Kiến thức lý thuyết cốt lõi môn ${cleanSubj} (${cleanGrade}).`,
          "Phương pháp phân tích và tư duy logic giải quyết bài tập.",
          "Củng cố các dạng câu hỏi trắc nghiệm, đúng/sai và trả lời ngắn."
        ],
    mindmapMermaid: `mindmap\n  root((${cleanSubj} ${cleanGrade}))\n    Kiến thức trọng tâm\n      Lý thuyết cốt lõi\n      Phương pháp giải\n    Năng lực đạt được\n      Tư duy phân tích\n      Vận dụng bài tập`,
    questions: questions.slice(0, targetCount)
  };
}

function sanitizeTrueFalseStatementsServer(q: any, cleanQuestion: string, cleanTopic: string): any[] {
  let rawStatements: any[] = [];
  if (Array.isArray(q.tfStatements) && q.tfStatements.length > 0) {
    rawStatements = q.tfStatements;
  } else if (Array.isArray(q.options) && q.options.length > 0) {
    rawStatements = q.options;
  }

  const prefixes = ['a)', 'b)', 'c)', 'd)'];
  const sanitized = [];

  for (let i = 0; i < 4; i++) {
    const item = rawStatements[i];
    let stmtText = '';
    let isCorrect = i % 2 === 0;

    if (item && typeof item === 'object' && ('statement' in item || 'text' in item)) {
      stmtText = String(item.statement || item.text || '').trim();
      if (typeof item.isCorrect === 'boolean') {
        isCorrect = item.isCorrect;
      }
    } else if (typeof item === 'string') {
      stmtText = item.trim();
    }

    // Check if string contains explicit answer suffix before stripping
    if (/\bđúng\s*\/\s*sai\b.*-\s*đúng$/i.test(stmtText) || /[:\-]\s*đúng$/i.test(stmtText)) {
      isCorrect = true;
    } else if (/\bđúng\s*\/\s*sai\b.*-\s*sai$/i.test(stmtText) || /[:\-]\s*sai$/i.test(stmtText)) {
      isCorrect = false;
    }

    // Clean leading a), b), c), d), A., 1. etc. (without stripping decimal numbers like 1.59)
    stmtText = stmtText.replace(/^(?:[a-dA-D]\s*[\.\:\)\-]\s*|[1-4]\s*[\:\)\-]\s*|[1-4]\.\s+)/, '').trim();

    // Strip trailing answer hints/suffixes like (Đúng/Sai)? - Đúng, - Sai, etc.
    stmtText = stmtText
      .replace(/\s*[\(\[\{]?\s*đúng\s*\/\s*sai\s*[\)\]\}]?\s*\??(?:\s*[:\-]\s*(?:đúng|sai|đ|s))?\s*$/i, '')
      .replace(/\s*[:\-]\s*(?:đúng|sai)\s*$/i, '')
      .replace(/\s*[\(\[\{]\s*(?:đúng|sai)\s*[\)\]\}]\s*$/i, '')
      .trim();

    const lowerClean = stmtText.toLowerCase();
    const isBadMeta = 
      lowerClean.includes("không liên quan đến bài học") ||
      lowerClean.includes("mọi bài tập về") ||
      lowerClean.includes("luyện thi cuối") ||
      lowerClean.includes("ôn luyện thi") ||
      stmtText.split(/\s+/).length < 4;

    if (!stmtText || stmtText.length < 5 || isBadMeta) {
      const topicName = cleanTopic || 'nội dung bài học';
      if (i === 0) stmtText = `Dữ kiện và khái niệm lý thuyết cốt lõi về ${topicName} được áp dụng chuẩn xác.`;
      else if (i === 1) stmtText = `Các bước thực hành và phương pháp suy luận liên quan đến ${topicName} tuân thủ đúng yêu cầu.`;
      else if (i === 2) stmtText = `Kết quả tính toán hoặc kết luận đưa ra về ${topicName} chưa phản ánh đúng điều kiện thực tế.`;
      else stmtText = `Khái niệm về ${topicName} không có mối liên hệ với các quy luật lý thuyết đã học.`;
      isCorrect = i % 2 === 0;
    }

    if (!/^[a-d]\)/i.test(stmtText)) {
      stmtText = `${prefixes[i]} ${stmtText}`;
    }

    sanitized.push({
      id: item?.id || `tf_${q.id || Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
      statement: stmtText,
      isCorrect: isCorrect,
    });
  }

  return sanitized;
}

function generateSmartContextualDistractors(qText: string, topic: string, correctAns: string, countNeeded: number, qIndex: number = 0): string[] {
  const cleanQ = (qText || '').trim();
  const cleanTop = (topic || '').replace(/^Chủ đề:\s*/i, '').trim();
  const lowerQ = cleanQ.toLowerCase();
  const lowerTop = cleanTop.toLowerCase();

  const distractors: string[] = [];

  // 1. IT / Programming / Computer Science / Database / CSDL / SQL / Tin học (Check FIRST for CS/IT keywords)
  const isIT = lowerQ.includes('python') || lowerTop.includes('python') ||
    lowerQ.includes('sql') || lowerTop.includes('sql') ||
    lowerQ.includes('tin học') || lowerTop.includes('tin học') ||
    lowerQ.includes('cơ sở dữ liệu') || lowerTop.includes('cơ sở dữ liệu') ||
    lowerQ.includes('csdl') || lowerTop.includes('csdl') ||
    lowerQ.includes('truy vấn') || lowerQ.includes('bảng dữ liệu') ||
    lowerQ.includes('hệ quản trị') || lowerQ.includes('khóa chính') ||
    lowerQ.includes('khoá chính') || lowerQ.includes('từ khóa') ||
    lowerQ.includes('mã lệnh') || lowerQ.includes('thuật toán') ||
    lowerQ.includes('chọn dữ liệu') || lowerQ.includes('mô hình quan hệ');

  if (isIT) {
    let csPool: string[] = [];
    if (lowerQ.includes('sql') || lowerQ.includes('truy vấn') || lowerQ.includes('chọn dữ liệu') || lowerTop.includes('sql')) {
      csPool = [
        "SELECT", "FROM", "WHERE", "GROUP BY", "ORDER BY", "HAVING", "INSERT INTO", "UPDATE", "DELETE", "JOIN"
      ];
    } else if (lowerQ.includes('cơ sở dữ liệu') || lowerQ.includes('csdl') || lowerQ.includes('hệ quản trị') || lowerTop.includes('csdl')) {
      csPool = [
        "Tập hợp dữ liệu có liên quan được lưu trữ có tổ chức trên máy tính",
        "Phần mềm cung cấp môi trường tạo lập, lưu trữ và khai thác CSDL",
        "Mô hình dữ liệu quan hệ dựa trên khái niệm bảng và khóa",
        "Bảng chứa các hàng và các cột dữ liệu",
        "Khóa chính dùng để định danh duy nhất mỗi bản ghi trong bảng",
        "Khóa ngoại dùng để liên kết giữa các bảng",
        "Chỉ mục giúp tăng tốc độ tìm kiếm và truy vấn dữ liệu"
      ];
    } else {
      csPool = [
        "Báo lỗi cú pháp SyntaxError khi chạy chương trình",
        "Chỉ truy vấn được các thuộc tính mặc định của đối tượng",
        "Trả về kết quả kiểu chuỗi ký tự thay vì kiểu số",
        "Cần khai báo bổ sung biến trung gian trước khi thực thi",
        "Không làm thay đổi dữ liệu trong bảng gốc",
        "Xảy ra hiện tượng lặp vô hạn trong chương trình"
      ];
    }
    for (const item of csPool) {
      if (item !== correctAns && !distractors.includes(item)) {
        distractors.push(item);
        if (distractors.length >= countNeeded) return distractors.slice(0, countNeeded);
      }
    }
  }

  // 2. Math / Geometry
  const isMath = lowerQ.includes('toán') || lowerTop.includes('toán') ||
    lowerQ.includes('hàm số') || lowerQ.includes('tập xác định') || lowerQ.includes('tiệm cận') ||
    lowerQ.includes('đồ thị') || lowerQ.includes('đạo hàm') || lowerQ.includes('tích phân') ||
    lowerQ.includes('nguyên hàm') || lowerQ.includes('phương trình') || lowerQ.includes('bất phương trình') ||
    lowerQ.includes('cực trị') || lowerQ.includes('điểm cực') || lowerQ.includes('logarit') ||
    lowerQ.includes('mũ và log') || lowerQ.includes('diện tích') || lowerQ.includes('thể tích') ||
    lowerQ.includes('khối nón') || lowerQ.includes('khối trụ') || lowerQ.includes('mặt cầu') ||
    lowerQ.includes('tọa độ') || lowerQ.includes('vectơ') || lowerQ.includes('khoảng cách') ||
    lowerQ.includes('góc giữa') || lowerQ.includes('cấp số') || lowerQ.includes('xác suất') ||
    lowerQ.includes('tam giác') || lowerQ.includes('đường thẳng') || lowerQ.includes('mặt phẳng') ||
    lowerQ.includes('số phức') || lowerQ.includes('log2') || lowerQ.includes('log3') || lowerQ.includes('ln');

  if (isMath) {
    let mathPool: string[] = [];
    if (lowerQ.includes('tập xác định') || lowerQ.includes('domain')) {
      mathPool = ["D = ℝ", "D = (0; +∞)", "D = [1; +∞)", "D = ℝ \\ {1}", "D = ℝ \\ {0}", "D = ℝ \\ {-1}", "D = (-∞; 1)", "D = [-1; 1]"];
    } else if (lowerQ.includes('cực trị') || lowerQ.includes('điểm cực')) {
      mathPool = ["0", "1", "2", "3", "4", "(0; 2)", "(1; 0)", "(2; 1)", "Không có điểm cực trị nào"];
    } else if (lowerQ.includes('tiệm cận')) {
      mathPool = ["x = 1", "y = 2", "x = -1", "y = 1", "x = 0", "y = 0", "Không có đường tiệm cận"];
    } else if (lowerQ.includes('thể tích') || lowerQ.includes('diện tích')) {
      mathPool = ["V = π * r² * h", "V = (1/3) * π * r² * h", "V = (4/3) * π * r³", "S = 4 * π * r²", "S = 2 * π * r * h", "V = B * h"];
    } else if (lowerQ.includes('log') || lowerQ.includes('mũ')) {
      mathPool = ["a + 1", "1 + a", "a - 1", "2a", "a / 2", "1 - a", "a²", "3a", "0", "1"];
    } else if (lowerQ.includes('số phức')) {
      mathPool = ["Đường tròn tâm I(0, 1), bán kính R = 1", "Đường tròn tâm I(1, 0), bán kính R = 1", "Đường thẳng x + y = 1", "z = 1 + i", "z = 1 - i"];
    } else {
      mathPool = ["Giá trị bằng 0", "Giá trị bằng 1", "Giá trị bằng -1", "Không tồn tại giá trị thỏa mãn", "Tập nghiệm S = ℝ", "Tập nghiệm S = Ø", "Phương án vô nghiệm", "Kết quả bằng 2"];
    }
    for (const item of mathPool) {
      if (item !== correctAns && !distractors.includes(item)) {
        distractors.push(item);
        if (distractors.length >= countNeeded) return distractors.slice(0, countNeeded);
      }
    }
  }

  // 3. Technology / Engineering / Công nghệ / Bản vẽ / Cơ khí
  const isTech = lowerQ.includes('công nghệ') || lowerTop.includes('công nghệ') ||
    lowerQ.includes('bản vẽ') || lowerQ.includes('nét vẽ') || lowerQ.includes('hình chiếu') ||
    lowerQ.includes('động cơ') || lowerQ.includes('van') || lowerQ.includes('xupap') ||
    lowerQ.includes('gia công') || lowerQ.includes('cắt gọt') || lowerQ.includes('tiện') ||
    lowerQ.includes('phay') || lowerQ.includes('mạch điện') || lowerQ.includes('linh kiện') ||
    lowerQ.includes('tụ điện') || lowerQ.includes('đoạn mạch') || lowerQ.includes('máy biến áp');

  if (isTech) {
    let techPool: string[] = [];
    if (lowerQ.includes('nét vẽ') || lowerQ.includes('đường tâm') || lowerQ.includes('đường trục')) {
      techPool = ["Nét liền đậm", "Nét liền mảnh", "Nét đứt mảnh", "Nét gạch chấm mảnh", "Nét lượn sóng"];
    } else if (lowerQ.includes('hình chiếu') || lowerQ.includes('hướng chiếu')) {
      techPool = ["Từ trước tới (Hình chiếu đứng)", "Từ trên xuống (Hình chiếu bằng)", "Từ trái sang (Hình chiếu cạnh)", "Từ phải sang", "Từ dưới lên"];
    } else if (lowerQ.includes('gia công') || lowerQ.includes('cắt gọt')) {
      techPool = ["Gia công tiện, phay, bào, khoan", "Gia công đúc kim loại trong khuôn", "Gia công rèn và dập nóng", "Gia công bằng hàn điện và hàn áp lực", "Gia công biến dạng dẻo không cắt gọt"];
    } else if (lowerQ.includes('động cơ') || lowerQ.includes('kỳ') || lowerQ.includes('van') || lowerQ.includes('xupap')) {
      techPool = ["Kỳ nén và kỳ cháy-dãn nở", "Kỳ nạp và kỳ thải", "Chỉ ở kỳ nạp nhiên liệu", "Chỉ ở kỳ thải khí cháy", "Cả 4 kỳ hoạt động liên tục"];
    } else {
      techPool = ["Tích trữ và phóng điện năng khi có điện áp", "Cản trở dòng điện và phân chia điện áp", "Biến đổi điện áp xoay chiều giữ nguyên tần số", "Khuếch đại tín hiệu dòng điện trong mạch", "Chỉnh lưu dòng điện xoay chiều thành một chiều"];
    }
    for (const item of techPool) {
      if (item !== correctAns && !distractors.includes(item)) {
        distractors.push(item);
        if (distractors.length >= countNeeded) return distractors.slice(0, countNeeded);
      }
    }
  }

  // 4. Chemistry / Hóa học (Ensure no false triggers on 'từ khóa' / 'chuẩn hóa' / 'mã hóa')
  const isChem = !isIT && (
    lowerQ.includes('hóa học') || lowerTop.includes('hóa học') ||
    lowerQ.includes('môn hóa') || lowerTop.includes('môn hóa') ||
    lowerQ.includes('phản ứng hóa') || lowerQ.includes('kết tủa') ||
    lowerQ.includes('dung dịch') || lowerQ.includes('axit') || lowerQ.includes('bazơ') || lowerQ.includes('muối')
  ) && !lowerQ.includes('từ khóa') && !lowerQ.includes('khóa chính') && !lowerQ.includes('chuẩn hóa') && !lowerQ.includes('mã hóa');

  if (isChem) {
    const chemPool = [
      "Xuất hiện kết tủa màu trắng",
      "Có sủi bọt khí không màu thoát ra",
      "Dung dịch chuyển sang màu xanh lam",
      "Không xảy ra hiện tượng hóa học nào",
      "Dung dịch nhạt màu dần và tạo kết tủa keo",
      "Khí có màu nâu đỏ bay ra làm đổi màu quỳ tím"
    ];
    for (const item of chemPool) {
      if (item !== correctAns && !distractors.includes(item)) {
        distractors.push(item);
        if (distractors.length >= countNeeded) return distractors.slice(0, countNeeded);
      }
    }
  }

  // 5. Biology / Sinh học (Ensure no false triggers on 'học sinh' / 'sinh viên')
  const isBio = !isIT && (
    lowerQ.includes('sinh học') || lowerTop.includes('sinh học') ||
    lowerQ.includes('môn sinh') || lowerTop.includes('môn sinh') ||
    lowerQ.includes('tế bào') || lowerQ.includes('adn') || lowerQ.includes('arn') ||
    lowerQ.includes('quang hợp') || lowerQ.includes('đột biến gen') || lowerQ.includes('nhiễm sắc thể')
  ) && !lowerQ.includes('học sinh') && !lowerQ.includes('sinh viên');

  if (isBio) {
    const bioPool = [
      "Xảy ra trong nhân tế bào ở kì trung gian",
      "Đột biến gen làm thay đổi trình tự nucleotit",
      "Tăng tính đa dạng di truyền cho quần thể",
      "Quá trình phiên mã tạo ra mARN bổ sung",
      "Diễn ra ở màng thylakoid của lục lạp",
      "Thường biến không di truyền qua các thế hệ"
    ];
    for (const item of bioPool) {
      if (item !== correctAns && !distractors.includes(item)) {
        distractors.push(item);
        if (distractors.length >= countNeeded) return distractors.slice(0, countNeeded);
      }
    }
  }

  // 6. Physics / Vật lý
  const isPhy = lowerQ.includes('vật lý') || lowerQ.includes('vật lí') || lowerTop.includes('vật lý') || lowerTop.includes('vật lí') ||
    lowerQ.includes('dòng điện') || lowerQ.includes('vận tốc') || lowerQ.includes('gia tốc') || lowerQ.includes('áp suất') || lowerQ.includes('sóng điện từ');

  if (isPhy) {
    const phyPool = [
      "Tăng lên gấp đôi so với ban đầu",
      "Giảm đi một nửa khi điện trở tăng",
      "Giữ nguyên giá trị không đổi",
      "Tỉ lệ thuận với bình phương bán kính",
      "Biến thiên điều hòa theo thời gian",
      "Ngược pha so với dao động ban đầu"
    ];
    for (const item of phyPool) {
      if (item !== correctAns && !distractors.includes(item)) {
        distractors.push(item);
        if (distractors.length >= countNeeded) return distractors.slice(0, countNeeded);
      }
    }
  }

  // 7. General varied academic distractors
  const academicDistractors = [
    "Quy trình thực hiện theo thứ tự ưu tiên chuẩn",
    "Tiêu chí đánh giá dựa trên thang đo kỹ thuật",
    "Phương án có tính chất kết hợp đa mục tiêu",
    "Đặc điểm nhận biết qua phân tích mô hình",
    "Giả định lý thuyết trong điều kiện cân bằng",
    "Nội dung phản ánh xu hướng phát triển chung",
    "Mối liên hệ tương quan giữa các yếu tố thành phần",
    "Chỉ số đo lường dựa trên thực nghiệm thực tế",
    "Quy chuẩn kỹ thuật áp dụng theo quy định hiện hành",
    "Phương pháp phân tích dựa trên dữ liệu định lượng",
    "Mô hình giả lập được kiểm chứng qua thực tế",
    "Điều kiện tiên quyết trước khi tiến hành thử nghiệm"
  ];

  for (let i = 0; i < academicDistractors.length; i++) {
    const idx = (qIndex * 3 + i) % academicDistractors.length;
    const item = academicDistractors[idx];
    if (item !== correctAns && !distractors.includes(item)) {
      distractors.push(item);
      if (distractors.length >= countNeeded) break;
    }
  }

  while (distractors.length < countNeeded) {
    distractors.push(`Phương án phân tích ${distractors.length + 1}`);
  }

  return distractors.slice(0, countNeeded);
}

function deduplicateAndDistributeQuestions(questions: any[], targetCount: number = 10): any[] {
  if (!Array.isArray(questions)) return [];

  const uniqueQuestions: any[] = [];
  const seenSignatures = new Set<string>();

  for (const rawQ of questions) {
    if (!rawQ || typeof rawQ !== 'object') continue;

    // Clean strings and remove any unwanted repetitive artifacts
    let qText = String(rawQ.question || '').trim();

    // Remove repetitive suffixes like "(Dạng củng cố 1)" or "Dạng củng cố X"
    qText = qText.replace(/\s*\([Dd]ạng củng cố \d+\)/g, '').trim();
    qText = qText.replace(/\s*\(Củng cố \d+\)/g, '').trim();

    if (!qText) continue;

    // Build signature that uniquely identifies the question stem AND statements/options so generic true_false titles aren't wrongly merged
    let sigContent = qText;
    if (rawQ.questionType === "true_false" && Array.isArray(rawQ.tfStatements)) {
      sigContent += " | " + rawQ.tfStatements.map((s: any) => s?.statement || s?.text || '').join(" | ");
    } else if (rawQ.questionType === "multiple_choice" && Array.isArray(rawQ.options)) {
      sigContent += " | " + rawQ.options.join(" | ");
    } else if (rawQ.questionType === "short_answer") {
      sigContent += " | " + (rawQ.shortAnswer || "");
    }

    const normSig = sigContent.toLowerCase().replace(/\s+/g, ' ').replace(/[.,?!:;]/g, '');

    if (seenSignatures.has(normSig)) {
      continue; // Skip exact duplicate
    }
    seenSignatures.add(normSig);

    const sanitizedQ = sanitizeQuestionOptionsServer({
      ...rawQ,
      question: qText
    });

    if (sanitizedQ.questionType === "multiple_choice") {
      sanitizedQ.correctOption = alignCorrectOptionWithExplanation(sanitizedQ);
    }

    // STRICT FILTERING: Discard any question where explanation contradicts the selected option or contains dummy placeholders
    const valResult = validateQuestionConsistency(sanitizedQ);
    if (!valResult.isValid) {
      console.warn(`[QuizGen Filtering] Discarded inconsistent question: "${sanitizedQ.question}" -> Reason: ${valResult.reason}`);
      continue; // DISCARD CONTRADICTORY QUESTION AND TAKE NEXT CANDIDATE
    }

    uniqueQuestions.push(sanitizedQ);
  }

  return uniqueQuestions.slice(0, targetCount);
}

/**
 * Validates whether a generated question has complete, non-contradictory, scientifically consistent options and explanation.
 * If explanation contradicts the selected option or contains dummy placeholders, returns isValid: false so the question can be discarded and replaced.
 */
function validateQuestionConsistency(q: any): { isValid: boolean; reason?: string } {
  if (!q || typeof q !== 'object') {
    return { isValid: false, reason: 'Dữ liệu câu hỏi không hợp lệ' };
  }

  const qText = String(q.question || '').trim();
  if (qText.length < 5) {
    return { isValid: false, reason: 'Nội dung câu hỏi quá ngắn' };
  }

  if (q.questionType === 'multiple_choice' || !q.questionType) {
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      return { isValid: false, reason: 'Số lượng phương án không đúng 4' };
    }

    // Strip labels and surrounding quotes like '1' -> 1
    const cleanOpts = q.options.map((o: any) =>
      String(o || '')
        .replace(/^(?:Phương án|Option|Đáp án)?\s*(?:[A-Da-d]\s*[\.\:\)\-]\s*|[1-4]\s*[\:\)\-]\s*|[1-4]\.\s+)/i, '')
        .replace(/^['"]+|['"]+$/g, '')
        .trim()
    );

    // Save cleaned options back to q.options
    q.options = cleanOpts;

    // Placeholder check
    const dummyPattern = /^(?:Phương án|Option|Đáp án|Chưa có|Lựa chọn)\s*[A-D1-4]?$/i;
    for (const opt of cleanOpts) {
      if (!opt || dummyPattern.test(opt)) {
        return { isValid: false, reason: 'Chứa phương án giữ chỗ hoặc rỗng' };
      }
    }

    // Option uniqueness check
    const normOpts = cleanOpts.map((o) => o.toLowerCase());
    if (new Set(normOpts).size < 4) {
      return { isValid: false, reason: 'Các phương án lựa chọn bị trùng lặp' };
    }

    // Ensure correct option is aligned first
    const alignedIdx = alignCorrectOptionWithExplanation(q);
    q.correctOption = alignedIdx;
    q.correctOptionText = cleanOpts[alignedIdx];

    const exp = String(q.explanation || '').trim();
    const chosenOptText = cleanOpts[alignedIdx];

    // Contradiction Check 1: Explicit letter in explanation (e.g., "Đáp án đúng là A")
    const normExpVal = normalizeText(exp);
    const explicitIdxVal = extractExplicitLetter(exp, normExpVal);
    if (explicitIdxVal !== null && explicitIdxVal !== alignedIdx) {
      const letter = String.fromCharCode(65 + explicitIdxVal);
      return {
        isValid: false,
        reason: `Lời giải ghi chọn đáp án ${letter} (${cleanOpts[explicitIdxVal] || ''}) nhưng đáp án gán vào ${String.fromCharCode(65 + alignedIdx)} (${chosenOptText})`
      };
    }

    // Contradiction Check 2: pH Science Calculation Verification
    const normQ = qText.toLowerCase();
    const normChosen = chosenOptText.toLowerCase().trim();

    if (normQ.includes('ph') && (normQ.includes('hcl 0,01') || normQ.includes('hcl 0.01') || normQ.includes('hcl 10^-2'))) {
      if (normChosen !== '2' && normChosen !== '2,0' && normChosen !== '2.0' && !normChosen.includes('ph = 2')) {
        return { isValid: false, reason: `Tính pH sai: HCl 0.01M có pH = 2 nhưng phương án gán là "${chosenOptText}"` };
      }
    }

    if (normQ.includes('ph') && (normQ.includes('hcl 0,1') || normQ.includes('hcl 0.1') || normQ.includes('hcl 10^-1'))) {
      if (normChosen !== '1' && normChosen !== '1,0' && normChosen !== '1.0' && !normChosen.includes('ph = 1')) {
        return { isValid: false, reason: `Tính pH sai: HCl 0.1M có pH = 1 nhưng phương án gán là "${chosenOptText}"` };
      }
    }

    if (normQ.includes('ph') && (normQ.includes('naoh 0,1') || normQ.includes('naoh 0.1') || normQ.includes('naoh 10^-1'))) {
      if (normChosen !== '13' && !normChosen.includes('ph = 13')) {
        return { isValid: false, reason: `Tính pH sai: NaOH 0.1M có pH = 13 nhưng phương án gán là "${chosenOptText}"` };
      }
    }

    // Contradiction Check 3: Semantic acid/base or domain contradiction
    const normExp = exp.toLowerCase();

    if ((normExp.includes('quy tim hoa do') || normExp.includes('dung dich acid')) && (normChosen.includes('naoh') || normChosen.includes('nh3') || normChosen.includes('base'))) {
      return { isValid: false, reason: 'Lời giải khẳng định acid làm quỳ tím hóa đỏ nhưng đáp án gán vào dung dịch base' };
    }

    if ((normExp.includes('nh3 nhan proton') || normExp.includes('tinh base')) && normChosen.includes('acid')) {
      return { isValid: false, reason: 'Lời giải khẳng định NH3 có tính base nhưng đáp án lại gán NH3 là acid' };
    }
  }

  if (q.questionType === 'true_false') {
    if (!Array.isArray(q.tfStatements) || q.tfStatements.length !== 4) {
      return { isValid: false, reason: 'Số lượng phát biểu Đúng/Sai không đúng 4' };
    }
  }

  if (q.questionType === 'short_answer') {
    if (!q.shortAnswer || String(q.shortAnswer).trim().length === 0) {
      return { isValid: false, reason: 'Đáp án câu hỏi ngắn không được để rỗng' };
    }
  }

  return { isValid: true };
}

/**
 * Helper to normalize string by stripping accents and special characters.
 */
function normalizeText(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,?!:;'"\(\)\[\]\{\}\\/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Helper to extract explicit answer letter (A, B, C, D) from explanation text.
 */
function extractExplicitLetter(exp: string, normExp: string): number | null {
  if (!exp && !normExp) return null;
  const mapIdx: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };

  // 1. Try matching on normalized unaccented string
  const mNorm = normExp.match(/(?:dap an|chon|phuong an|cau|ket qua)\s*(?:dung|chinh xac)?\s*(?:la)?\s*:?\s*([a-d])\b/i);
  if (mNorm && mapIdx[mNorm[1].toUpperCase()] !== undefined) {
    return mapIdx[mNorm[1].toUpperCase()];
  }

  // 2. Try matching with diacritics on original string
  const mOrig = exp.match(/(?:dap an|đáp án|dáp án|chon|chọn|phuong an|phương án|cau|câu|ket qua|kết quả)\s*(?:dung|đúng|chinh xac|chính xác)?\s*(?:la|là)?\s*:?\s*([A-Da-d])\b/i);
  if (mOrig && mapIdx[mOrig[1].toUpperCase()] !== undefined) {
    return mapIdx[mOrig[1].toUpperCase()];
  }

  // 3. Match standalone letter at beginning of explanation e.g. "C. ...", "C: ...", "C - ..."
  const mStart = exp.match(/^\s*([A-D])\s*[\.\:\-\)\s]/i);
  if (mStart && mapIdx[mStart[1].toUpperCase()] !== undefined) {
    return mapIdx[mStart[1].toUpperCase()];
  }

  return null;
}

/**
 * Ensures that the correctOption index strictly matches the answer stated in explanation or correctOptionText.
 */
function alignCorrectOptionWithExplanation(q: any): number {
  if (!q || q.questionType !== 'multiple_choice' || !Array.isArray(q.options) || q.options.length !== 4) {
    return typeof q?.correctOption === 'number' && q.correctOption >= 0 && q.correctOption <= 3 ? q.correctOption : 0;
  }

  const origIdx = typeof q.correctOption === 'number' && q.correctOption >= 0 && q.correctOption <= 3 ? q.correctOption : 0;
  const explanation = String(q.explanation || '').trim();
  const correctText = String(q.correctOptionText || '').trim().replace(/^['"]+|['"]+$/g, '');

  const cleanOpts = q.options.map((o: any) =>
    String(o || '')
      .replace(/^(?:Phương án|Option|Đáp án)?\s*(?:[A-Da-d]\s*[\.\:\)\-]\s*|[1-4]\s*[\:\)\-]\s*|[1-4]\.\s+)/i, '')
      .replace(/^['"]+|['"]+$/g, '')
      .trim()
  );

  q.options = cleanOpts;

  const norm = (str: string) =>
    str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[.,?!:;'"\(\)\[\]\{\}\\/]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const normExp = norm(explanation);
  const normCorrText = norm(correctText);

  // Priority 1: Explicit letter declaration in explanation (e.g. "Đáp án đúng là A", "Đáp án C", "Chọn C", "Phương án C")
  const explicitIdx = extractExplicitLetter(explanation, normExp);
  if (explicitIdx !== null) {
    q.correctOption = explicitIdx;
    if (cleanOpts[explicitIdx]) {
      q.correctOptionText = cleanOpts[explicitIdx];
    }
    return explicitIdx;
  }

  // Priority 2: Match options against explanation text (Check which option is mentioned / confirmed in explanation)
  if (normExp.length > 0) {
    const scores = cleanOpts.map((opt, idx) => {
      const normOpt = norm(opt);
      if (!normOpt) return -1000;

      let score = 0;

      // Negation check
      const isNegated =
        new RegExp(`${normOpt}\\s*(?:bang|=)?\\s*(?:0|zero|triet tieu|null|khong|sai|khong phai)`, 'i').test(normExp) ||
        new RegExp(`(?:khong phai|khong phu thuoc|loai|tru|ngoai)\\s*${normOpt}`, 'i').test(normExp);

      // Confirmation check
      const isConfirmed = new RegExp(`${normOpt}\\s*(?:dat|cuc dai|lon nhat|chinh xac|bang [^0]|va|la)`, 'i').test(normExp);

      if (isNegated) {
        score -= 300;
      }

      if (isConfirmed) {
        score += 200;
      }

      const rawOpt = String(opt).trim();
      const isNumericOrShort = /^[0-9.,\-+]+$/.test(rawOpt) || rawOpt.length <= 2;

      if (isNumericOrShort) {
        // Standalone number matching (prevents '1' matching inside '0,01' or '10^-2' or '12')
        const escaped = rawOpt.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const standaloneRegex = new RegExp(`(?:^|\\b|=|:\\s*|la\\s*|ph\\s*=\\s*|ra\\s*|phuong an\\s*|dap an\\s*)\\s*${escaped}(?:$|\\b|\\s|\\.|,)`, 'i');
        if (standaloneRegex.test(explanation) || standaloneRegex.test(normExp)) {
          if (!isNegated) {
            score += 180 + rawOpt.length * 3;
          }
        }
      } else {
        // String match in explanation
        if (normExp.includes(normOpt) && normOpt.length >= 3) {
          if (!isNegated) {
            score += 100 + normOpt.length * 2;
          }
        }

        // Exact raw formula match in raw explanation (e.g., H2SO4, NaOH, [-1, 1], D = R \ {kpi}, tanx)
        if (rawOpt.length >= 3 && explanation.includes(rawOpt)) {
          if (!isNegated) {
            score += 150 + rawOpt.length * 3;
          }
        }
      }

      // Word/Token overlap
      const words = normOpt.split(' ').filter(w => w.length > 1 && !['la', 'trong', 'cua', 'va', 'duoc', 'co', 'cho', 'voi', 'khi', 'theo', 'nhu', 'bang'].includes(w));
      if (words.length > 0 && !isNegated) {
        let matchedCount = 0;
        for (const w of words) {
          if (normExp.includes(w)) matchedCount++;
        }
        score += (matchedCount / words.length) * 60;
      }

      return score;
    });

    let maxScore = -9999;
    let bestIdx = origIdx;

    for (let i = 0; i < scores.length; i++) {
      if (scores[i] > maxScore) {
        maxScore = scores[i];
        bestIdx = i;
      }
    }

    if (maxScore > 20 && bestIdx !== origIdx) {
      q.correctOption = bestIdx;
      if (cleanOpts[bestIdx]) q.correctOptionText = cleanOpts[bestIdx];
      return bestIdx;
    }
  }

  // Priority 3: Direct match with correctOptionText if valid
  if (normCorrText.length > 0) {
    const directIdx = cleanOpts.findIndex((opt) => norm(opt) === normCorrText);
    if (directIdx !== -1) {
      q.correctOption = directIdx;
      q.correctOptionText = cleanOpts[directIdx];
      return directIdx;
    }
  }

  // Priority 4: Fallback to original index
  q.correctOption = origIdx;
  if (cleanOpts[origIdx]) q.correctOptionText = cleanOpts[origIdx];
  return origIdx;
}

function sanitizeQuestionOptionsServer(q: any): any {
  if (!q || typeof q !== 'object') return q;

  let cleanTopic = String(q.topic || '').trim();
  cleanTopic = cleanTopic.replace(/^Chủ đề:\s*/i, '');
  cleanTopic = cleanTopic
    .replace(/(nhé|ok|chuẩn|luôn|bạn nhé|tuyệt đối|đúng nhất|mạch lạc nhất|nhanh gọn|bài bản|hoàn toàn|tốt nhất|phát biểu|đúng chuẩn|tỉ mỉ|chuẩn mực|tối ưu cao nhất|chuẩn bộ giáo dục|chuẩn hóa hoàn toàn tự động|chính xác tuyệt đối)\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleanTopic.length > 50) {
    cleanTopic = cleanTopic.substring(0, 47) + '...';
  }

  let cleanQuestion = String(q.question || '').trim();
  cleanQuestion = cleanQuestion.replace(/^Chủ đề:\s*[^:]+?(?=(Cho|Tính|Tìm|Trong|Xác định|Phát biểu|Giải|Biết|Khái niệm|Công thức|Hàm số|Có bao nhiêu|Mệnh đề|Hãy|Giá trị|Tập|Phương trình|Điểm|Mạch|Thiết bị|Đặc điểm|Tổ chức|Thách thức|Một trong|Choose|Select|Which|What|How))/i, '');
  cleanQuestion = cleanQuestion
    .replace(/(nhé|bạn nhé|ok|chuẩn nhé|luôn nhé|chuẩn tuyệt đối|đúng nhất|mạch lạc nhất|nhanh gọn|bài bản|tỉ mỉ|chuẩn mực|tối ưu cao nhất|chuẩn bộ giáo dục|chuẩn hóa hoàn toàn tự động|chính xác tuyệt đối)+/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Strip embedded choices A. ... B. ... C. ... D. ... or A) ... B) ... C) ... D) ...
  let extractedServerOptions: string[] | null = null;
  const hasABCDServer = /\bA[\.\:\)]\s+/i.test(cleanQuestion) && /\bB[\.\:\)]\s+/i.test(cleanQuestion) && /\bC[\.\:\)]\s+/i.test(cleanQuestion) && /\bD[\.\:\)]\s+/i.test(cleanQuestion);
  if (hasABCDServer) {
    const embeddedRegex = /[\s:\.\,]*\bA[\.\:\)]\s+(.+?)\s+\bB[\.\:\)]\s+(.+?)\s+\bC[\.\:\)]\s+(.+?)\s+\bD[\.\:\)]\s+(.+)$/i;
    const match = cleanQuestion.match(embeddedRegex);
    if (match) {
      extractedServerOptions = [match[1].trim(), match[2].trim(), match[3].trim(), match[4].trim()];
      cleanQuestion = cleanQuestion.substring(0, match.index).trim();
    } else {
      const cutIdx = cleanQuestion.search(/[\s:]*\bA[\.\:\)]\s+/i);
      if (cutIdx !== -1) {
        cleanQuestion = cleanQuestion.substring(0, cutIdx).trim();
      }
    }
  }

  const qType = q.questionType || (q.tfStatements && q.tfStatements.length > 0 ? 'true_false' : q.shortAnswer ? 'short_answer' : 'multiple_choice');

  if (qType === 'true_false') {
    return {
      ...q,
      question: cleanQuestion,
      topic: cleanTopic,
      questionType: 'true_false',
      tfStatements: sanitizeTrueFalseStatementsServer(q, cleanQuestion, cleanTopic),
      id: q.id || `q_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
    };
  }

  if (qType === 'short_answer') {
    let cleanAnswer = String(q.shortAnswer || q.acceptableAnswers?.[0] || '').trim();
    if (!cleanAnswer) {
      if (q.explanation) {
        cleanAnswer = q.explanation.split('.')[0].trim();
      } else {
        cleanAnswer = 'Đáp số đúng';
      }
    }
    return {
      ...q,
      question: cleanQuestion,
      topic: cleanTopic,
      questionType: 'short_answer',
      shortAnswer: cleanAnswer,
      acceptableAnswers: q.acceptableAnswers || [cleanAnswer],
      id: q.id || `q_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
    };
  }

  const cleanOpt = (text: string = '') => {
    if (!text) return '';
    return text
      .trim()
      .replace(/^(?:Phương án|Option|Đáp án)?\s*(?:[A-Da-d]\s*[\.\:\)\-]\s*|[1-4]\s*[\:\)\-]\s*|[1-4]\.\s+)/i, '')
      .trim();
  };

  let rawOptions: string[] = Array.isArray(q.options)
    ? q.options.map((o: any) => cleanOpt(String(o || '')))
    : [];

  if (extractedServerOptions && extractedServerOptions.length === 4) {
    if (rawOptions.length < 4 || rawOptions.some(o => !o || /^(option|phương án)\s*[a-d1-4]?$/i.test(o))) {
      rawOptions = extractedServerOptions.map(cleanOpt);
    }
  }

  const isPlaceholder = (opt: string) => {
    if (!opt || typeof opt !== 'string') return true;
    const lower = opt.toLowerCase().trim();
    if (lower.length === 0) return true;
    if (/^[a-d1-4][\.\:\)\-]$/i.test(lower)) return true;
    if (/^(option|phương án|đáp án)\s*[a-d1-4]?[\.\:\)\-]?$/i.test(lower)) return true;
    if (
      lower.includes('phương án không chính xác') ||
      lower.includes('ý nhiễu') ||
      lower.includes('phương án chưa đầy đủ') ||
      lower.includes('khái niệm không thuộc phạm vi') ||
      lower.includes('đặc điểm tùy chỉnh') ||
      lower.includes('thao tác ngược lại') ||
      lower.includes('nội dung mở rộng không thuộc') ||
      lower.includes('không áp dụng đối với') ||
      lower.includes('bài đọc tham khảo không bắt buộc') ||
      lower.includes('yêu cầu thiết lập bổ sung') ||
      lower.includes('hoàn toàn phủ nhận nội dung') ||
      lower.includes('phương án không phù hợp') ||
      lower.includes('lựa chọn bổ sung') ||
      lower.includes('trường hợp ngoại lệ')
    ) {
      return true;
    }
    return false;
  };

  const qText = cleanQuestion.toLowerCase();

  // Mathematical domain specific auto-fixes
  if (
    qText.includes('y = tanx') ||
    qText.includes('y = tan(x)') ||
    (qText.includes('tanx') && qText.includes('tập xác định'))
  ) {
    return {
      ...q,
      question: cleanQuestion,
      topic: cleanTopic || 'Hàm số lượng giác cơ bản',
      questionType: 'multiple_choice',
      id: q.id || `q_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      options: [
        'D = ℝ \\ {π/2 + kπ, k ∈ ℤ}',
        'D = ℝ \\ {kπ, k ∈ ℤ}',
        'D = ℝ',
        'D = [-1; 1]',
      ],
      correctOption:
        typeof q.correctOption === 'number' && q.correctOption >= 0 && q.correctOption <= 3
          ? q.correctOption
          : 0,
    };
  }

  if (
    qText.includes('y = cotx') ||
    qText.includes('y = cot(x)') ||
    (qText.includes('cotx') && qText.includes('tập xác định'))
  ) {
    return {
      ...q,
      question: cleanQuestion,
      topic: cleanTopic || 'Hàm số lượng giác cơ bản',
      questionType: 'multiple_choice',
      id: q.id || `q_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      options: [
        'D = ℝ \\ {kπ, k ∈ ℤ}',
        'D = ℝ \\ {π/2 + kπ, k ∈ ℤ}',
        'D = ℝ',
        'D = [-1; 1]',
      ],
      correctOption:
        typeof q.correctOption === 'number' && q.correctOption >= 0 && q.correctOption <= 3
          ? q.correctOption
          : 0,
    };
  }

  // Single letter outputs for code/python questions
  if (
    rawOptions.length === 4 &&
    rawOptions.filter((o) => o.length === 1 && /^[A-Za-z0-9]$/.test(o)).length >= 2
  ) {
    rawOptions = rawOptions.map((opt) => {
      if (opt.length === 1 && /^[A-Za-z0-9]$/.test(opt)) {
        return `'${opt}'`;
      }
      return opt;
    });
  }

  // Preserve valid AI generated options, pad or construct fallbacks using context-driven distractors
  let validOptions = rawOptions.filter((o) => !isPlaceholder(o));

  // Deduplicate inside same question
  const uniqueInQ: string[] = [];
  for (const opt of validOptions) {
    if (!uniqueInQ.includes(opt)) {
      uniqueInQ.push(opt);
    }
  }
  validOptions = uniqueInQ;

  if (validOptions.length < 4) {
    const correctVal = validOptions[0] || (q.explanation ? q.explanation.split('.')[0] : cleanQuestion);
    const missingCount = 4 - validOptions.length;
    const dynamicDistractors = generateSmartContextualDistractors(cleanQuestion, cleanTopic, correctVal, missingCount);

    for (const dist of dynamicDistractors) {
      if (!validOptions.includes(dist)) {
        validOptions.push(dist);
      }
      if (validOptions.length >= 4) break;
    }
  }

  rawOptions = validOptions.slice(0, 4);

  const initialCorrectIdx =
    typeof q.correctOption === 'number' && q.correctOption >= 0 && q.correctOption <= 3
      ? q.correctOption
      : 0;

  const candidateServerQ = {
    ...q,
    question: cleanQuestion,
    topic: cleanTopic,
    questionType: 'multiple_choice',
    id: q.id || `q_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    options: rawOptions,
    correctOption: initialCorrectIdx,
  };

  candidateServerQ.correctOption = alignCorrectOptionWithExplanation(candidateServerQ);
  return candidateServerQ;
}

// In-memory cache for fast repeat responses (< 50ms)
const quizCache = new Map<string, { timestamp: number; data: any }>();

// Time budget granted to the Gemini call chain for quiz generation.
// Must stay strictly BELOW the outer wrapper timeout in api/generate-quiz.ts
// (INTERNAL_TIMEOUT_MS) which itself must stay below Vercel's `maxDuration`
// hard limit — otherwise Vercel kills the function with a raw 504 instead of
// letting our own fallback logic respond gracefully.
//   Vercel maxDuration (Hobby)      = 10000ms
//   generate-quiz.ts wrapper budget =  8000ms   (buffer: 2000ms for JSON I/O)
//   THIS budget (Gemini call chain) =  7000ms   (buffer: 1000ms for post-processing)
const QUIZ_AI_BUDGET_MS = 7000;

// Helper function to call Gemini API with fast fallback for serverless
async function generateContentWithRetry(params: {
  contents: any;
  config?: any;
  model?: string;
}, customApiKey?: string, budgetMs: number = 7000) {
  // Fail fast on a missing key: no point burning the time budget racing a
  // network call that will 100% reject on auth, and no point retrying other
  // models either — they'd all fail the same way.
  resolveApiKey(customApiKey);

  const requestedModel = params.model || "gemini-2.5-flash";

  const modelsToTry = [
    requestedModel,
    "gemini-2.5-flash",
    "gemini-3.6-flash",
  ];

  const uniqueModels = Array.from(new Set(modelsToTry));
  let lastError: any = null;

  // Single shared deadline for the WHOLE retry loop (not per-attempt), so
  // trying multiple models can never exceed the caller's real time budget.
  // budgetMs must stay comfortably under the outer wrapper timeout
  // (generate-quiz.ts INTERNAL_TIMEOUT_MS) which itself stays under the
  // Vercel `maxDuration` hard limit.
  const deadlineAt = Date.now() + budgetMs;

  for (const modelName of uniqueModels) {
    const remainingMs = deadlineAt - Date.now();
    if (remainingMs <= 300) {
      // Not enough time left to even attempt another call — stop now
      // instead of firing a request we know will be aborted mid-flight.
      lastError = lastError || new Error("AI_TIMEOUT: No time budget left to attempt Gemini call.");
      break;
    }

    try {
      const requestConfig: any = params.config ? { ...params.config } : {};

      // Disable/minimize thinking depending on model generation
      if (!requestConfig.thinkingConfig) {
        const isGemini3x = modelName.startsWith("gemini-3");
        requestConfig.thinkingConfig = isGemini3x
          ? { thinkingLevel: "LOW" }      // Gemini 3.x dùng thinkingLevel
          : { thinkingBudget: 0 };        // Gemini 2.x/2.5 dùng thinkingBudget
      }

      // Only attach googleSearch tool if responseSchema is NOT used, as tools conflict with structured JSON mode.
      // Also skip it here entirely for quiz generation: it adds real network
      // latency we cannot afford inside a sub-10s serverless budget.
      if (!requestConfig.tools && !requestConfig.responseSchema && requestConfig.responseMimeType !== "application/json") {
        requestConfig.tools = [{ googleSearch: {} }];
      }

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`AI_TIMEOUT: Gemini call exceeded ${remainingMs}ms budget`)), remainingMs)
      );

      const callPromise = getAiClient(customApiKey).models.generateContent({
        ...params,
        config: requestConfig,
        model: modelName,
      });

      const res: any = await Promise.race([callPromise, timeoutPromise]);
      return res;
    } catch (err: any) {
      lastError = err;
      const errMsg = String(err?.message || err);

      const isNotFound =
        errMsg.includes("404") ||
        errMsg.includes("NOT_FOUND") ||
        errMsg.includes("no longer available") ||
        errMsg.includes("is not found");

      if (isNotFound && Date.now() < deadlineAt) {
        continue;
      }

      const isQuotaExhausted =
        errMsg.includes("429") ||
        errMsg.includes("RESOURCE_EXHAUSTED") ||
        errMsg.includes("Quota exceeded") ||
        errMsg.includes("Rate Limit");

      if (isQuotaExhausted && Date.now() < deadlineAt) {
        console.log(`Model ${modelName} rate limited (429). Trying next fallback...`);
        continue;
      }

      const isTimeout = errMsg.includes("AI_TIMEOUT");
      if (isTimeout) {
        console.log(`[AI Timeout] Model ${modelName} reached ${budgetMs}ms budget. Activating fast fallback...`);
        break; // break early to return smart curriculum fallback immediately
      }
    }
  }

  const lastErrMsg = String(lastError?.message || lastError || '');
  if (lastErrMsg.includes("429") || lastErrMsg.includes("RESOURCE_EXHAUSTED") || lastErrMsg.includes("Quota exceeded") || lastErrMsg.includes("Rate Limit")) {
    throw new Error("QUOTA_EXCEEDED: Hệ thống Gemini AI đang tạm thời đạt giới hạn tần suất gửi câu hỏi (429 Rate Limit). Vui lòng đợi 30-45 giây rồi thử lại.");
  }
  if (lastErrMsg.includes("AI_TIMEOUT")) {
    throw new Error(`AI_TIMEOUT: Gemini không phản hồi kịp trong ${budgetMs}ms ngân sách thời gian cho phép (giới hạn serverless).`);
  }

  throw lastError || new Error("Không thể kết nối đến máy chủ AI sau các lần thử.");
}

/**
 * Core business logic for Quiz Generation (callable by Express and Vercel Serverless)
 */
export async function handleGenerateQuiz(body: any, customApiKey?: string) {
  const reqSubject = body?.subject || "Tin học";
  const reqGrade = body?.grade || "Lớp 12";
  const rawContent = body?.content || "";
  const cleanedContent = cleanTextForAi(rawContent, 8000);
  const targetQuestionCount = Math.max(1, Math.min(50, Number(body?.questionCount) || 10));
  const effectiveApiKey = body?.apiKey || customApiKey;
  const {
    schoolLevel = "THPT", // "THCS" | "THPT"
    subject = reqSubject,
    grade = reqGrade,
    matrix = { nhanBiet: 40, thongHieu: 30, vanDung: 20, vanDungCao: 10 },
    targetLevel = "Tất cả năng lực", // "Học sinh Cần Bổ Trợ", "Học sinh Khá", "Học sinh Giỏi", "Tất cả năng lực"
    customInstructions = "",
    selectedQuestionTypes = ["multiple_choice", "true_false", "short_answer"],
    examModeConfig = null,
  } = body || {};

  if (!rawContent || typeof rawContent !== "string" || rawContent.trim().length === 0) {
    throw new Error("Nội dung bài giảng/tài liệu không được để trống.");
  }

  const cacheKey = `${subject}_${grade}_${targetQuestionCount}_${cleanedContent.slice(0, 300)}_${JSON.stringify(matrix)}_${selectedQuestionTypes.join(",")}`;
  const cachedEntry = quizCache.get(cacheKey);
  if (cachedEntry && Date.now() - cachedEntry.timestamp < 1000 * 60 * 30) {
    console.log(`[QuizGen Cache Hit] Returning cached quiz data in <10ms for key: ${cacheKey.slice(0, 40)}...`);
    return cachedEntry.data;
  }

    const levelTitle = schoolLevel === "THCS" ? "CẤP TRUNG HỌC CƠ SỞ (THCS - LỚP 6 ĐẾN 9)" : "CẤP TRUNG HỌC PHỔ THÔNG (THPT - LỚP 10 ĐẾN 12)";
    const levelPedagogy = schoolLevel === "THCS" 
      ? "Chú trọng ngôn ngữ trong sáng, gần gũi, bám sát chương trình phổ thông cơ sở (Khối Lớp 6, 7, 8, 9), tập trung kiểm tra kiến thức nền tảng Khoa học tự nhiên, Khoa học xã hội, tư duy logic vừa sức lứa tuổi thiếu niên THCS." 
      : "Bám sát chuẩn cấu trúc phân hóa thi Tốt nghiệp THPT của Bộ GD&ĐT Việt Nam, phát triển tư duy phân tích sâu, giải quyết vấn đề thực tiễn.";

    let examPromptNotice = "";
    if (examModeConfig?.enabled) {
      const examTitle = examModeConfig.examTitle || "ĐỀ KIỂM TRA ĐỊNH KỲ";
      const duration = examModeConfig.durationMinutes || 45;
      const code = examModeConfig.examCode || "101";
      const school = examModeConfig.schoolName || "TRƯỜNG THPT";
      const dept = examModeConfig.departmentName || "SỞ GIÁO DỤC VÀ ĐÀO TẠO";

      examPromptNotice = `
📝 ĐANG BẬT CHẾ ĐỘ BIÊN SOẠN ĐỀ THI & BÀI KIỂM TRA CHÍNH THỨC:
- Tên đề thi: "${examTitle.toUpperCase()}"
- Đơn vị: ${dept} - ${school}
- Thời gian làm bài: ${duration} phút | Mã đề thi: ${code}
- YÊU CẦU BẮT BUỘC KHI BIÊN SOẠN CHẾ ĐỘ ĐỀ THI:
  1. Tiêu đề (title) trong kết quả JSON BẮT BUỘC phải đặt theo tiêu đề đề thi chính thức: "${examTitle.toUpperCase()} - MÔN ${subject.toUpperCase()} ${grade.toUpperCase()}".
  2. Ngôn ngữ câu hỏi phải cực kỳ chuẩn mực, trang trọng theo đúng quy chuẩn đề thi chính thức của Bộ/Sở GD&ĐT.
  3. Lời giải chi tiết (explanation) phải trình bày rõ ràng, có hướng dẫn chấm chi tiết.
`;
    }

    const typeDescriptions: Record<string, string> = {
      multiple_choice: "• Trắc nghiệm 4 lựa chọn (multiple_choice): Chọn 1 đáp án đúng trong 4 lựa chọn (A, B, C, D).",
      true_false: "• Trắc nghiệm Đúng/Sai (true_false): Gồm 1 câu hỏi chính và 4 phát biểu (a, b, c, d) - mỗi phát biểu chọn Đúng hoặc Sai.",
      short_answer: "• Trả lời ngắn (short_answer): Câu hỏi yêu cầu học sinh tự tính toán/suy luận ra kết quả số hoặc từ ngắn. Môn Toán/Khoa học tự nhiên nếu có pi lấy π = 3.14.",
    };

    const allowedTypesList = Array.isArray(selectedQuestionTypes) && selectedQuestionTypes.length > 0
      ? selectedQuestionTypes
      : ["multiple_choice", "true_false", "short_answer"];

    const allowedTypesPrompt = allowedTypesList.map((t: string) => typeDescriptions[t] || t).join("\n");

    const systemInstruction = `
Bạn là chuyên gia sư phạm và cố vấn biên soạn đề thi, giáo án hàng đầu cho ${levelTitle}.
ĐẶC ĐIỂM SƯ PHẠM VÀ PHÂN HÓA DÀNH CHO ${schoolLevel}:
${levelPedagogy}
${examPromptNotice}

Nhiệm vụ: Phân tích tài liệu và tự động tạo ra ngân hàng câu hỏi phân hóa chuẩn GD&ĐT ngắn gọn, chính xác.

YÊU CẦU BẮT BUỘC TỐI CAO VỀ SỐ LƯỢNG VÀ NỘI DUNG MÔN HỌC:
1. CHÍNH XÁC SỐ LƯỢNG: Mảng 'questions' PHẢI CHỨA ĐÚNG CHÍNH XÁC ${targetQuestionCount} CÂU HỎI. Tuyệt đối không dừng lại giữa chừng hay tạo ít hơn ${targetQuestionCount} câu.
2. CHÍNH XÁC NỘI DUNG MÔN ${subject.toUpperCase()} (${grade.toUpperCase()}):
   - Mọi câu hỏi BẮT BUỘC phải bám sát 100% tài liệu đầu vào và kiến thức chuẩn của môn ${subject} (${grade}).
   - TUYỆT ĐỐI KHÔNG được tạo câu hỏi thuộc môn học khác hay chèn kiến thức không liên quan.
3. MA TRẬN NHẬN THỨC CHO ${targetQuestionCount} CÂU HỎI:
   - Nhận biết: ~${Math.max(1, Math.round((targetQuestionCount * matrix.nhanBiet) / 100))} câu
   - Thông hiểu: ~${Math.max(1, Math.round((targetQuestionCount * matrix.thongHieu) / 100))} câu
   - Vận dụng: ~${Math.max(0, Math.round((targetQuestionCount * matrix.vanDung) / 100))} câu
   - Vận dụng cao: ~${Math.max(0, Math.round((targetQuestionCount * matrix.vanDungCao) / 100))} câu

DẠNG CÂU HỎI ĐƯỢC PHÉP BIÊN SOẠN:
${allowedTypesPrompt}

QUY TẮC TỰ ĐỘNG GIẢI ĐỀ & TẠO CÂU HỎI TỪ TÀI LIỆU ĐẦU VÀO:
1. ĐẮC BIỆT VỀ CÂU HỎI TRẮC NGHIỆM (multiple_choice):
   - BẮT BUỘC cung cấp mảng 'options' gồm ĐÚNG 4 phương án trả lời với NỘI DUNG THỰC TẾ CHI TIẾT (công thức toán, kết quả tính toán, câu lệnh, khái niệm cụ thể).
   - TUYỆT ĐỐI KHÔNG chèn danh sách lựa chọn 'A. ... B. ... C. ... D. ...' vào trong trường 'question'. Trường 'question' CHỈ CHỨA DUY NHẤT nội dung câu hỏi chính (VD: "Choose the word whose underlined part is pronounced differently from the others").
   - TUYỆT ĐỐI KHÔNG DÙNG CÁC CHUỖI GIỮ CHỖ VÔ NGHĨA NHƯ: 'Phương án A', 'Phương án B', 'Phương án C', 'Phương án D', 'Option A', 'Đáp án A'.
   - TUYỆT ĐỐI KHÔNG thêm ký tự tiền tố như 'A. ', 'B. ', '1. ' vào đầu mỗi chuỗi option.
   - Khi phương án trả lời là một ký tự đơn duy nhất (như 'A', 'B', 'C' trong câu hỏi kết quả mã lệnh Python): Viết rõ thành 'A', 'B', 'C' hoặc "In ra 'A'", "In ra 'B'".
2. PHÂN BỔ VỊ TRÍ ĐÁP ÁN ĐÚNG NGẪU NHIÊN VÀ ĐỊNH DẠNG LỜI GIẢI CHUẨN XÁC 100%: 
   - QUY TRÌNH TẠO CÂU HỎI:
     + Bước 1: Xác định phương án đúng chính xác 100% theo kiến thức SGK GDPT 2018 (VD: "H2SO4" hoặc "NH3 nhận proton từ nước tạo OH-").
     + Bước 2: Đặt phương án đúng vào vị trí ngẫu nhiên k (0, 1, 2, hoặc 3) trong mảng 'options'.
     + Bước 3: Gán 'correctOption': k và 'correctOptionText': nội dung văn bản phương án đúng.
     + Bước 4: MỞ ĐẦU LỜI GIẢI 'explanation' BẮT BUỘC BẰNG CÂU KHẲNG ĐỊNH: "Đáp án đúng là [Ký tự A, B, C hoặc D tương ứng k]. [Nội dung phương án đúng]. [Giải thích ngắn gọn]."
       (Ví dụ 1: "Đáp án đúng là C. H2SO4. Dung dịch acid (như H2SO4) làm quỳ tím hóa đỏ, NaOH và NH3 có tính base làm quỳ tím hóa xanh, NaCl trung tính.")
       (Ví dụ 2: "Đáp án đúng là C. NH3 nhận proton từ nước tạo OH-. Giải thích: NH3 + H2O <-> NH4+ + OH-, ion OH- làm dung dịch có tính base.")
       (Ví dụ 3: "Đáp án đúng là A. 1.59 Hz. Giải thích: f = \omega / (2\pi) = 10 / (2 \times 3.14) \approx 1.59\text{ Hz}.")
3. TÍNH CHÍNH XÁC KHOA HỌC & KIẾN THỨC CHUẨN 100% MỌI MÔN HỌC:
   - HÓA HỌC:
     + Dung dịch acid (H2SO4, HCl, HNO3, CH3COOH...) làm quỳ tím hóa ĐỎ.
     + Dung dịch base (NaOH, KOH, Ca(OH)2, NH3...) làm quỳ tím hóa XANH.
     + Muối trung tính (NaCl, KNO3, Na2SO4...) KHÔNG làm đổi màu quỳ tím.
     + NH3 có tính base vì NH3 nhận proton (H+) từ nước tạo ra ion OH- (NH3 + H2O <-> NH4+ + OH-). NH3 KHÔNG PHẢI LÀ ACID, KHÔNG PHÂN LI RA H+.
   - VẬT LÝ: Tần số f = \omega / (2\pi). Chu kỳ T = 2\pi / \omega. Vận tốc cực đại v_max = \omega A. Đảm bảo số liệu và đơn vị đo chuẩn xác.
   - TOÁN HỌC: Phép tính số học, nghiệm phương trình, đạo hàm, tích phân, tập xác định BẮT BUỘC tính nháp cẩn thận chính xác 100%.
   - SINH HỌC, LỊCH SỬ, ĐỊA LÝ, NGỮ VĂN, TIẾNG ANH, TIN HỌC: Bám sát 100% SGK Kết nối tri thức, Cánh diều, Chân trời sáng tạo GDPT 2018.
   - Các phương án sai (distractors) phải hợp lý, mang tính phân hóa học sinh dựa trên các nhầm lẫn kiến thức phổ biến. KHÔNG tạo phương án ngô nghê hoặc vô nghĩa.
4. ĐẶC BIỆT DÀNH CHO BÀI TẬP TÍNH TOÁN & CÂU HỎI TRẢ LỜI NGẮN (short_answer):
   - 'explanation' BẮT BUỘC có hướng dẫn giải từng bước ngắn gọn (Bước 1: Công thức, Bước 2: Tính toán, Bước 3: Đáp số).
5. CHUẨN MỰC PHONG CÁCH VÀ CHÍNH XÁC CÔNG THỨC LATEX TOÁN / LÝ / HÓA:
   - TẤT CẢ CÁC CÔNG THỨC TOÁN HỌC, VẬT LÝ, HÓA HỌC (tần số góc \omega, chu kỳ T, căn bậc hai \sqrt{}, phân số \frac{}, góc \alpha, \beta, \Delta, phương trình, tích phân) BẮT BUỘC SỬ DỤNG CÚ PHÁP LATEX TIÊU CHUẨN ĐẶT TRONG CẶP DẤU $ ... $ HOẶC $$ ... $$.
   - VÍ DỤ CHUẨN: $\omega = \sqrt{\frac{k}{m}}$, $T = 2\pi\sqrt{\frac{m}{k}}$, $f = \frac{1}{2\pi}\sqrt{\frac{k}{m}}$, $x = A \cos(\omega t + \varphi)$.
   - TUYỆT ĐỐI KHÔNG VIẾT CHỮ TỰ DO NHƯ "căn(k/m)", "căn(m/k)", "pi", "omega", "2pi căn(k/m)". Mọi căn thức phải dùng \sqrt{}, phân số dùng \frac{}{}, ký hiệu Hy Lạp phải dùng \omega, \pi, \alpha, \beta, \Delta, \varphi.
   - TUYỆT ĐỐI KHÔNG thêm từ ngữ hội thoại, giao tiếp, lặp từ hoặc cảm thán như 'nhé', 'bạn nhé', 'ok', 'chuẩn nhé', 'luôn nhé', 'tuyệt đối', 'mạch lạc', 'bài bản', 'tỉ mỉ'.
   - TUYỆT ĐỐI KHÔNG tự ý chèn văn bản giới thiệu, quảng cáo hoặc tiền tố 'Chủ đề:' vào trường 'question'. Trường 'question' CHỈ ĐƯỢC CHỨA DUY NHẤT câu hỏi chính thức.
   - Trường 'topic' chỉ ghi từ khóa chủ đề cực kỳ ngắn gọn (3-5 từ, ví dụ: "Hàm số lượng giác", "Khối trụ tròn xoay", "Đặc điểm KH-CN").
   - ĐỐI VỚI CÁC MÔN TÍNH TOÁN (Toán, Vật lý, Hóa học, Tin học): Đảm bảo các công thức, phép tính toán số học, giá trị π, đơn vị đo và kết quả cuối cùng chính xác 100%. Không tự ý thêm bớt dữ kiện không liên quan ngoài các câu hỏi bài tập.
6. ĐẶC BIỆT KHI BIÊN SOẠN CÂU HỎI TRẮC NGHIỆM ĐÚNG/SAI (true_false):
   - Mảng 'tfStatements' bao gồm 4 phát biểu (a, b, c, d).
   - Trường 'statement' CHỈ CHỨA DUY NHẤT câu văn phát biểu (ví dụ: "a) Microsoft Access là một hệ QTCSDL quan hệ.").
   - TUYỆT ĐỐI KHÔNG chèn chuỗi "(Đúng/Sai)", "(Đúng/Sai)? - Đúng", "(Đúng/Sai)? - Sai", "- Đúng", "- Sai" hay bất kỳ ghi chú đáp án nào vào trong văn bản 'statement'.
   - Tính Đúng hoặc Sai BẮT BUỘC chỉ được khai báo ở thuộc tính 'isCorrect' (true cho Đúng, false cho Sai).

7. TUYỆT ĐỐI KHÔNG TẠO CÂU HỎI MANG TÍNH KHÁI QUÁT HỌC TẬP HOẶC QUY TRÌNH HỌC TẬP NHƯ: "Yêu cầu cốt lõi khi học môn...", "Nhập từ khóa mô tả năng lực...", "Xét tính Đúng/Sai của phương pháp học tập...". MỌI CÂU HỎI BẮT BUỘC PHẢI HỎI TRỰC TIẾP KIẾN THỨC, KHÁI NIỆM, DỮ KIỆN, CÔNG THỨC HOẶC BÀI TẬP CHUYÊN MÔN THỰC TẾ CỦA BÀI HỌC/MÔN HỌC (Ví dụ: quang hợp, cấu trúc ADN, phản ứng hóa học, phương trình, từ vựng, ngữ pháp, lịch sử, địa lý...).

8. NẠP TRI THỨC TOÀN BỘ SÁCH GIÁO KHOA MỚI GDPT 2018 & CHUẨN ĐÁP ÁN BỘ/SỞ GIÁO DỤC VÀ ĐÀO TẠO:
   - AI BẮT BUỘC nạp và bám sát 100% tri thức từ TOÀN BỘ CÁC BỘ SÁCH GIÁO KHOA MỚI hiện nay theo Chương trình GDPT 2018: "Kết nối tri thức với cuộc sống", "Cánh diều", "Chân trời sáng tạo" và SGK chuẩn do Bộ Giáo dục & Đào tạo phê duyệt.
   - Mọi câu hỏi, các phương án A, B, C, D, chỉ số 'correctOption' và lời giải chi tiết 'explanation' BẮT BUỘC tuân thủ 100% theo đáp án chuẩn, biểu điểm và định hướng đánh giá năng lực của BỘ GIÁO DỤC VÀ ĐÀO TẠO và các SỞ GIÁO DỤC & ĐÀO TẠO trên toàn quốc.
   - Tự động tra cứu, tải dữ liệu và kiểm chứng trực tuyến với các ngân hàng câu hỏi & học liệu uy tín hàng đầu: Vietjack.com, Violet.vn, Loigiaihay.com, Hoc247.vn, Thuvienhoclieu.com, Tuyensinh247.
   - Đối với bài tập tính toán (Toán, Vật lý, Hóa học, Tin học): BẮT BUỘC tính nháp cẩn thận từng bước, đảm bảo công thức, số liệu và đáp án cuối cùng chính xác 100%. Lời giải 'explanation' và chỉ số 'correctOption' BẮT BUỘC phải khẳng định duy nhất một kết quả đúng theo chuẩn đáp án của Bộ/Sở GD&ĐT.

Môn học: ${subject}, Lớp: ${grade}, Cấp: ${schoolLevel}, Đối tượng: ${targetLevel}.
Cung cấp 4-6 ý tóm tắt bài học (summaryPoints), mã sơ đồ tư duy Mermaid (mindmapMermaid) và mảng 'questions' chứa các câu hỏi trọng tâm nhất.
`;

    const prompt = `
Tài liệu học tập/Bài giảng đầu vào:
---
${cleanedContent}
---

${customInstructions ? `Yêu cầu bổ sung của giáo viên: ${customInstructions}` : ""}

Hãy biên soạn ngân hàng câu hỏi trắc nghiệm, lời giải chi tiết, tóm tắt ý chính và sơ đồ tư duy dạng JSON theo đúng cấu trúc schema.
`;

    const response = await generateContentWithRetry({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.1, // Minimal temperature for fastest deterministic token generation
        topP: 0.8,
        maxOutputTokens: Math.min(8192, Math.max(2048, targetQuestionCount * 450)),
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Tiêu đề bài học/chủ đề chính" },
            summaryPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Danh sách 4-6 ý tóm tắt kiến thức trọng tâm",
            },
            mindmapMermaid: {
              type: Type.STRING,
              description: "Mã sơ đồ tư duy dạng Mermaid mindmap valid syntax",
            },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  questionType: {
                    type: Type.STRING,
                    description: "Dạng câu hỏi: 'multiple_choice', 'true_false', hoặc 'short_answer'",
                  },
                  question: { type: Type.STRING, description: "Nội dung câu hỏi" },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "4 phương án trả lời cho dạng multiple_choice",
                  },
                  correctOption: {
                    type: Type.INTEGER,
                    description: "Chỉ số đáp án đúng (0 cho A, 1 cho B, 2 cho C, 3 cho D)",
                  },
                  correctOptionText: {
                    type: Type.STRING,
                    description: "Nội dung văn bản chính xác của phương án đúng trong mảng options",
                  },
                  tfStatements: {
                    type: Type.ARRAY,
                    description: "Danh sách 4 phát biểu cho dạng câu hỏi true_false",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        statement: { type: Type.STRING, description: "Nội dung phát biểu a, b, c, hoặc d" },
                        isCorrect: { type: Type.BOOLEAN, description: "true nếu phát biểu Đúng, false nếu Sai" },
                      },
                    },
                  },
                  shortAnswer: {
                    type: Type.STRING,
                    description: "Kết quả chuẩn cho dạng câu hỏi trả lời ngắn (VD: '3.14', '15', 'x=2')",
                  },
                  acceptableAnswers: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Các dạng đáp án chấp nhận được (VD: ['3.14', '3,14'])",
                  },
                  mathRoundingNote: {
                    type: Type.STRING,
                    description: "Ghi chú quy ước tính toán môn Toán",
                  },
                  roundingDecimals: {
                    type: Type.INTEGER,
                    description: "Số chữ số làm tròn",
                  },
                  explanation: { type: Type.STRING, description: "Lời giải chi tiết ngắn gọn" },
                  taxonomyLevel: {
                    type: Type.STRING,
                    description: "Cấp độ GD&ĐT: 'Nhận biết', 'Thông hiểu', 'Vận dụng', hoặc 'Vận dụng cao'",
                  },
                  difficulty: {
                    type: Type.STRING,
                    description: "Độ khó: 'Dễ', 'Trung bình', 'Khó', hoặc 'Rất khó'",
                  },
                  topic: { type: Type.STRING, description: "Từ khóa/Khái niệm" },
                },
                required: [
                  "question",
                  "questionType",
                  "explanation",
                  "taxonomyLevel",
                  "difficulty",
                ],
              },
            },
          },
          required: ["title", "summaryPoints", "questions"],
        },
      },
    }, effectiveApiKey, QUIZ_AI_BUDGET_MS);

    const jsonText = response.text || "{}";
    const parsedData = safeParseJSON(jsonText, { subject: reqSubject, grade: reqGrade, title: reqSubject, content: cleanedContent });

    if (!parsedData.questions || !Array.isArray(parsedData.questions)) {
      parsedData.questions = [];
    }

    // Step 1: Sanitize and deduplicate initial AI questions batch
    let currentQuestions = deduplicateAndDistributeQuestions(parsedData.questions, targetQuestionCount * 2);

    // Step 2: Ensure AI generated exactly targetQuestionCount questions by drawing missing ones locally
    if (currentQuestions.length < targetQuestionCount) {
      console.log(`[QuizGen] Drawing additional non-duplicate questions locally to reach target ${targetQuestionCount}...`);
      const fallbackSet = buildSmartFallbackFromContent(cleanedContent, reqSubject, reqGrade, reqSubject, targetQuestionCount * 2);

      for (const fbQ of fallbackSet.questions || []) {
        currentQuestions.push(fbQ);
        currentQuestions = deduplicateAndDistributeQuestions(currentQuestions, targetQuestionCount * 2);
        if (currentQuestions.length >= targetQuestionCount) break;
      }
    }

    // Step 3: If still under targetQuestionCount, fill remaining slots using buildSmartFallbackFromContent
    if (currentQuestions.length < targetQuestionCount) {
      console.log(`[QuizGen] Drawing additional non-duplicate questions to reach target ${targetQuestionCount}...`);
      const fallbackSet = buildSmartFallbackFromContent(cleanedContent, reqSubject, reqGrade, reqSubject, targetQuestionCount * 2);

      for (const fbQ of fallbackSet.questions || []) {
        currentQuestions.push(fbQ);
        currentQuestions = deduplicateAndDistributeQuestions(currentQuestions, targetQuestionCount * 2);
        if (currentQuestions.length >= targetQuestionCount) break;
      }
    }

    // Step 4: Final deduplication and slice to exact targetQuestionCount
    parsedData.questions = deduplicateAndDistributeQuestions(currentQuestions, targetQuestionCount);

    // Step 5: Guaranteed safeguard: force-fill if array length is STILL less than targetQuestionCount
    if (parsedData.questions.length < targetQuestionCount) {
      const extraFallback = buildSmartFallbackFromContent(cleanedContent, reqSubject, reqGrade, reqSubject, targetQuestionCount);
      for (const eq of extraFallback.questions || []) {
        if (parsedData.questions.length >= targetQuestionCount) break;
        parsedData.questions.push(eq);
      }
      parsedData.questions = parsedData.questions.slice(0, targetQuestionCount);
    }

  // Save to in-memory cache for ultra-fast response on repeat requests
  quizCache.set(cacheKey, { timestamp: Date.now(), data: parsedData });

  return parsedData;
}

/**
 * POST /api/generate-quiz
 * Generates an automated GD&ĐT matrix aligned MCQ bank & summary points from input text
 */
app.post(["/api/generate-quiz", "/generate-quiz"], async (req, res) => {
  // NOTE: standalone Node/Express (not Vercel) has no 10s hard limit, so this
  // path previously ignored any client-supplied key entirely and only ever
  // used process.env — fixed to accept the same header/body key sources as
  // the Vercel handler for consistent behavior between environments.
  const customApiKey =
    (req.headers["x-gemini-api-key"] as string) ||
    (req.headers["authorization"]?.toString().replace("Bearer ", "")) ||
    req.body?.apiKey;

  try {
    const data = await handleGenerateQuiz(req.body, customApiKey);
    return res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    const errMsg = String(error?.message || error);
    console.error("[QuizGen Error]", errMsg);

    let errorType: "MISSING_API_KEY" | "AI_TIMEOUT" | "QUOTA_EXCEEDED" | "UNKNOWN" = "UNKNOWN";
    let warning = "Hệ thống AI gặp sự cố không xác định. Đã kích hoạt bộ ngân hàng câu hỏi chuẩn GD&ĐT dự phòng.";

    if (errMsg.includes("MISSING_API_KEY") || error?.name === "MissingApiKeyError") {
      errorType = "MISSING_API_KEY";
      warning = "Chưa cấu hình GEMINI_API_KEY hợp lệ. Đã dùng bộ ngân hàng câu hỏi dự phòng.";
    } else if (errMsg.includes("AI_TIMEOUT")) {
      errorType = "AI_TIMEOUT";
      warning = "Gemini phản hồi chậm hơn ngân sách thời gian cho phép. Đã dùng bộ ngân hàng câu hỏi dự phòng.";
    } else if (errMsg.includes("QUOTA_EXCEEDED") || errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED")) {
      errorType = "QUOTA_EXCEEDED";
      warning = "Gemini API đang đạt giới hạn tần suất (429). Vui lòng đợi 30-45 giây rồi thử lại.";
    }

    const safeSubject = req.body?.subject || "Tin học";
    const safeGrade = req.body?.grade || "Lớp 12";
    const safeContent = cleanTextForAi(req.body?.content || "", 8000);
    const safeCount = Math.max(1, Math.min(50, Number(req.body?.questionCount) || 10));

    const fallbackData = buildSmartFallbackFromContent(safeContent, safeSubject, safeGrade, safeSubject, safeCount);
    return res.json({
      success: true,
      data: fallbackData,
      warning,
      errorType,
      debugError: errMsg,
    });
  }
});

/**
 * Core business logic for Adaptive Re-level
 */
export async function handleAdaptiveRelevel(body: any, customApiKey?: string) {
  const { topic = "Chủ đề học tập", currentLevel = "Tự động phân hóa", studentScore = 70, weakTopics = [] } = body || {};
  const effectiveApiKey = body?.apiKey || customApiKey;

  const prompt = `
Học sinh vừa hoàn thành bài luyện tập chủ đề: "${topic}".
Kết quả đạt: ${studentScore}%.
Cấp độ hiện tại: ${currentLevel}.
Các điểm kiến thức chưa vững: ${weakTopics.join(", ") || "Cần củng cố lý thuyết căn bản"}.

Hãy đóng vai trợ lý gia sư AI cá nhân hóa:
1. Đưa ra 1 lời nhận xét sư phạm động viên, ngắn gọn và định hướng ôn tập cho học sinh.
2. Tạo 3 câu hỏi trắc nghiệm mới phù hợp chính xác với lỗ hổng kiến thức này để giúp học sinh lấp khoảng trống năng lực.
`;

  const response = await generateContentWithRetry({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          feedback: { type: Type.STRING, description: "Lời khuyên sư phạm cá nhân hóa" },
          recommendedAction: { type: Type.STRING, description: "Hành động gợi ý cho học sinh" },
          remedialQuestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctOption: { type: Type.INTEGER },
                explanation: { type: Type.STRING },
                taxonomyLevel: { type: Type.STRING },
                difficulty: { type: Type.STRING },
                topic: { type: Type.STRING },
              },
            },
          },
        },
        required: ["feedback", "recommendedAction", "remedialQuestions"],
      },
    },
  }, effectiveApiKey);

  const parsedRes = safeParseJSON(response.text || "{}");
  if (parsedRes && Array.isArray(parsedRes.remedialQuestions)) {
    parsedRes.remedialQuestions = deduplicateAndDistributeQuestions(parsedRes.remedialQuestions, 3);
  }

  return parsedRes;
}

/**
 * POST /api/adaptive-relevel
 */
app.post(["/api/adaptive-relevel", "/adaptive-relevel"], async (req, res) => {
  try {
    const customApiKey = (req.headers["x-gemini-api-key"] as string) || req.body?.apiKey;
    const data = await handleAdaptiveRelevel(req.body, customApiKey);
    return res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.log("[AdaptiveRelevel] AI prompt handled:", error?.message || error);
    const isQuota = String(error?.message || '').includes("429") || String(error?.message || '').includes("Rate Limit");
    const friendlyMsg = isQuota
      ? "Hệ thống AI hiện đang tạm chạm giới hạn tần suất yêu cầu (429 Rate Limit). Vui lòng đợi 30 giây rồi bấm thử lại."
      : (error.message || "Không thể tạo câu hỏi thích ứng lúc này.");
    return res.json({
      success: false,
      error: friendlyMsg,
      data: {
        feedback: "Hệ thống đang tạm thời chạm giới hạn gửi câu hỏi AI. Bạn hãy ôn lại lý thuyết đã học và thử lại sau ít phút nhé!",
        recommendedAction: "Tạm nghỉ 30 giây hoặc ôn lại các phần lý thuyết trọng tâm.",
        remedialQuestions: []
      }
    });
  }
});

/**
 * Core business logic for Question Explanation
 */
export async function handleExplainQuestion(body: any, customApiKey?: string) {
  const { question, options = [], selectedOption = 0, correctOption = 0 } = body || {};
  const effectiveApiKey = body?.apiKey || customApiKey;

  const prompt = `
Học sinh đang thắc mắc về câu hỏi sau:
Câu hỏi: "${question}"
Các lựa chọn:
A. ${options[0] || ""}
B. ${options[1] || ""}
C. ${options[2] || ""}
D. ${options[3] || ""}

Học sinh đã chọn: ${options[selectedOption]} (Lựa chọn ${String.fromCharCode(65 + selectedOption)})
Đáp án đúng là: ${options[correctOption]} (Lựa chọn ${String.fromCharCode(65 + correctOption)})

Hãy giải thích chi tiết, dễ hiểu:
1. Vì sao lựa chọn ${String.fromCharCode(65 + correctOption)} mới là đúng?
2. Phân tích nguyên nhân khiến lựa chọn ${String.fromCharCode(65 + selectedOption)} bị sai hoặc nhầm lẫn ở điểm nào.
3. Mẹo nhớ nhanh hoặc từ khóa cốt lõi để không lặp lại sai lầm trong kỳ thi Tốt nghiệp THPT.
`;

  const response = await generateContentWithRetry({
    model: "gemini-2.5-flash",
    contents: prompt,
  }, effectiveApiKey);

  return response.text;
}

/**
 * POST /api/explain-question
 */
app.post(["/api/explain-question", "/explain-question"], async (req, res) => {
  try {
    const customApiKey = (req.headers["x-gemini-api-key"] as string) || req.body?.apiKey;
    const text = await handleExplainQuestion(req.body, customApiKey);
    return res.json({
      success: true,
      explanation: text,
    });
  } catch (error: any) {
    console.log("[ExplainQuestion] AI prompt handled:", error?.message || error);
    const isQuota = String(error?.message || '').includes("429") || String(error?.message || '').includes("Rate Limit");
    const friendlyMsg = isQuota
      ? "Hệ thống AI hiện đang trong thời gian chờ do chạm giới hạn tần suất yêu cầu (429 Rate Limit). Vui lòng đợi khoảng 30 giây rồi bấm thử lại."
      : (error.message || "Không thể khởi tạo lời giải thích chi tiết lúc này.");
    return res.json({
      success: false,
      explanation: `⚠️ **Thông báo:** ${friendlyMsg}`,
      error: friendlyMsg
    });
  }
});

export { buildSmartFallbackFromContent, pruneUnusedContent };

// Express global JSON error handler middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[ServerError]", err);
  const status = err.status || err.statusCode || 500;
  return res.status(status).json({
    success: false,
    error: err.message || "Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau.",
  });
});

// Setup Vite Development Middleware or Production Static Serving (Non-Vercel only)
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`EduAI Applet server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
