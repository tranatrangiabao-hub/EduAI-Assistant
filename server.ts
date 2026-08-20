import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Lazy init Gemini AI
let aiClient: GoogleGenAI | null = null;
function getAI() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY || '';
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// 1. Generate Question Bank (Ngân hàng câu hỏi phân hóa GD&ĐT)
app.post('/api/generate-quiz', async (req, res) => {
  try {
    const { text, subject, grade, numQuestions, customPrompt } = req.body;
    const ai = getAI();

    const systemInstruction = `Bạn là chuyên gia thẩm định và soạn thảo đề thi GD&ĐT Việt Nam (chương trình mới 2018/2025+). 
Nhiệm vụ của bạn là phân tích tài liệu/chủ đề được cung cấp và tạo ngân hàng câu hỏi phân hóa 4 mức độ tư duy:
1. Nhận biết (Knowledge)
2. Thông hiểu (Comprehension)
3. Vận dụng (Application)
4. Vận dụng cao (High Application)

Hỗ trợ 3 dạng thức trắc nghiệm GD&ĐT chuẩn:
- Dạng 1: Trắc nghiệm 4 phương án (Multiple Choice - chọn 1 đáp án đúng A, B, C, D)
- Dạng 2: Trắc nghiệm Đúng/Sai (True/False Matrix - 1 câu hỏi dẫn có 4 ý a, b, c, d, mỗi ý xác định Đúng hoặc Sai)
- Dạng 3: Trắc nghiệm trả lời ngắn (Short Answer - điền đáp án dạng số, từ khóa hoặc công thức)

Đảm bảo câu hỏi bám sát tài liệu, lời giải chi tiết từng bước, chính xác thuật ngữ.`;

    const userPrompt = `Môn học: ${subject || 'Tổng hợp'}, Lớp/Trình độ: ${grade || 'Lớp 12'}
Số lượng câu hỏi yêu cầu: khoảng ${numQuestions || 8} câu.
${customPrompt ? `Yêu cầu thêm: ${customPrompt}` : ''}

Nội dung tài liệu/Bài giảng đầu vào:
"""
${text}
"""`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Tiêu đề đề thi / bài kiểm tra' },
            subject: { type: Type.STRING },
            grade: { type: Type.STRING },
            matrixSummary: {
              type: Type.OBJECT,
              properties: {
                nhanBiet: { type: Type.INTEGER },
                thongHieu: { type: Type.INTEGER },
                vanDung: { type: Type.INTEGER },
                vanDungCao: { type: Type.INTEGER },
              },
            },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING, description: 'multiple_choice | true_false | short_answer' },
                  level: { type: Type.STRING, description: 'Nhận biết | Thông hiểu | Vận dụng | Vận dụng cao' },
                  question: { type: Type.STRING, description: 'Nội dung câu hỏi' },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Danh sách đáp án A, B, C, D cho dạng multiple_choice',
                  },
                  correctOptionIndex: { type: Type.INTEGER, description: 'Chỉ số đáp án đúng (0-3) cho multiple_choice' },
                  subItems: {
                    type: Type.ARRAY,
                    description: 'Danh sách 4 ý a, b, c, d cho dạng true_false',
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        statement: { type: Type.STRING },
                        isCorrect: { type: Type.BOOLEAN },
                        explanation: { type: Type.STRING },
                      },
                    },
                  },
                  shortAnswer: { type: Type.STRING, description: 'Đáp án đúng cho dạng short_answer' },
                  explanation: { type: Type.STRING, description: 'Lời giải chi tiết từng bước' },
                },
              },
            },
          },
          required: ['title', 'questions'],
        },
      },
    });

    const data = JSON.parse(response.text || '{}');
    res.json({ success: true, data });
  } catch (err: any) {
    console.error('Error generating quiz:', err);
    res.status(500).json({ success: false, error: err.message || 'Lỗi tạo ngân hàng câu hỏi' });
  }
});

// 2. Generate Mind Map (Sơ đồ tư duy)
app.post('/api/generate-mindmap', async (req, res) => {
  try {
    const { text, subject } = req.body;
    const ai = getAI();

    const prompt = `Phân tích bài giảng sau đây và tạo Sơ đồ tư duy (Mindmap) chi tiết đa tầng.
Môn học: ${subject || 'Tổng hợp'}.
Nội dung:
"""
${text}
"""`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        systemInstruction: `Bạn là chuyên gia trực quan hóa kiến thức giáo dục. Hãy cấu trúc nội dung thành sơ đồ tư duy dạng cây với node trung tâm (Root), các nhánh chính (Main branches), nhánh phụ (Sub branches) và các từ khóa cốt lõi (Key points/examples). Thêm mã màu đề xuất hex code và biểu tượng icon phù hợp cho mỗi nhánh.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING, description: 'Chủ đề trung tâm' },
            description: { type: Type.STRING, description: 'Tóm tắt ngắn gọn chủ đề' },
            color: { type: Type.STRING, description: 'Mã màu Hex cho node chính' },
            icon: { type: Type.STRING, description: 'Icon gợi ý (ví dụ: ⚛️, 🧪, 📚, 📐, 📜)' },
            branches: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING, description: 'Tên nhánh chính' },
                  color: { type: Type.STRING },
                  icon: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  subBranches: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        title: { type: Type.STRING, description: 'Tên nhánh phụ' },
                        details: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                          description: 'Các từ khóa/chi tiết cốt lõi',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          required: ['topic', 'branches'],
        },
      },
    });

    const data = JSON.parse(response.text || '{}');
    res.json({ success: true, data });
  } catch (err: any) {
    console.error('Error generating mindmap:', err);
    res.status(500).json({ success: false, error: err.message || 'Lỗi tạo sơ đồ tư duy' });
  }
});

// 3. Generate Anki Flashcards
app.post('/api/generate-flashcards', async (req, res) => {
  try {
    const { text, subject, count } = req.body;
    const ai = getAI();

    const prompt = `Chuyển đổi bài giảng/tài liệu sau đây thành bộ bộ thẻ ghi nhớ Flashcard Anki chất lượng cao.
Môn học: ${subject || 'Tổng hợp'}
Số lượng thẻ: ${count || 10}

Tài liệu:
"""
${text}
"""`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        systemInstruction: `Bạn là chuyên gia phương pháp ghi nhớ ngắt quãng Spaced Repetition và Anki. Hãy soạn bộ flashcard chuẩn với:
- Mặt trước (Front): Câu hỏi, khái niệm, công thức hoặc từ khóa gợi mở.
- Mặt sau (Back): Định nghĩa ngắn gọn, kết quả, hoặc câu trả lời cô đọng.
- Mẹo ghi nhớ (Mnemonic/Hint): Công thức tính nhanh, hình ảnh tưởng tượng, hoặc mẹo ghi nhớ mẹo thi.
- Thẻ phân loại (Tag): Ví dụ 'HoaHoc12', 'CongThuc', 'KiemTra1Tiet'.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            deckTitle: { type: Type.STRING },
            subject: { type: Type.STRING },
            cards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  front: { type: Type.STRING, description: 'Nội dung mặt trước' },
                  back: { type: Type.STRING, description: 'Nội dung mặt sau' },
                  mnemonicHint: { type: Type.STRING, description: 'Mẹo nhớ nhanh' },
                  category: { type: Type.STRING, description: 'Danh mục/Chủ đề' },
                  tags: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
              },
            },
          },
          required: ['deckTitle', 'cards'],
        },
      },
    });

    const data = JSON.parse(response.text || '{}');
    res.json({ success: true, data });
  } catch (err: any) {
    console.error('Error generating flashcards:', err);
    res.status(500).json({ success: false, error: err.message || 'Lỗi tạo flashcard' });
  }
});

// 4. Generate Wordwall Gamification Data
app.post('/api/generate-wordwall', async (req, res) => {
  try {
    const { text, subject } = req.body;
    const ai = getAI();

    const prompt = `Từ bài giảng sau, hãy tạo dữ liệu trò chơi học tập tương tác đa dạng phong cách Wordwall:
1. Vòng quay kỳ diệu (Wheel of Fortune) - Các câu hỏi thử thách phản xạ
2. Ai là triệu phú (Millionaire Quiz) - Các câu hỏi leo núi từ Dễ đến Khó với 4 phương án
3. Lật thẻ ghép đôi (Memory Match) - Cặp khái niệm và giải thích/thuật ngữ
4. Ô chữ bí mật (Secret Word Crossword) - Từ khóa gợi mở và từ giải đáp

Tài liệu:
"""
${text}
"""`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        systemInstruction: `Bạn là thiết kế trò chơi học tập Wordwall/Kahoot. Hãy tạo dữ liệu trò chơi hấp dẫn, vui nhộn nhưng đậm chất giáo dục ôn luyện thi.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            gameTitle: { type: Type.STRING },
            wheelQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  segmentLabel: { type: Type.STRING },
                  question: { type: Type.STRING },
                  answer: { type: Type.STRING },
                  points: { type: Type.INTEGER },
                },
              },
            },
            millionaireQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  level: { type: Type.INTEGER, description: 'Cấp độ 1 đến 10' },
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING },
                },
              },
            },
            memoryMatchingPairs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  definition: { type: Type.STRING },
                },
              },
            },
          },
          required: ['gameTitle', 'wheelQuestions', 'millionaireQuestions', 'memoryMatchingPairs'],
        },
      },
    });

    const data = JSON.parse(response.text || '{}');
    res.json({ success: true, data });
  } catch (err: any) {
    console.error('Error generating wordwall games:', err);
    res.status(500).json({ success: false, error: err.message || 'Lỗi tạo trò chơi Wordwall' });
  }
});

// Setup Vite or Static File Middleware
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
