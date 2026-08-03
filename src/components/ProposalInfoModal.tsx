import React, { useState } from 'react';
import { X, BookOpen, Layers, Cpu, Calendar, DollarSign, Image, CheckCircle, Sparkles, Code, FileText } from 'lucide-react';

interface ProposalInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProposalInfoModal: React.FC<ProposalInfoModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'lydo' | 'phuongphap' | 'y_tuong' | 'quytrinh' | 'taichinh' | 'phuluc'>('lydo');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full h-[88vh] flex flex-col shadow-2xl border border-slate-200 relative overflow-hidden">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-6 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Hồ Sơ Nghiên Cứu & Đề Tài Dự Thi
              </span>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                Hệ Thống Tự Động Hóa Học Liệu Số & Trò Chơi Hóa Ôn Thi THPT Qua AI
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Sub-Tabs */}
        <div className="bg-slate-100 px-6 py-2 border-b border-slate-200 flex space-x-2 overflow-x-auto no-scrollbar shrink-0 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('lydo')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'lydo' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            2. Lý Do Chọn Đề Tài
          </button>
          <button
            onClick={() => setActiveTab('phuongphap')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'phuongphap' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            3. Phương Pháp Nghiên Cứu
          </button>
          <button
            onClick={() => setActiveTab('y_tuong')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'y_tuong' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            4. Ý Tưởng & Giải Pháp
          </button>
          <button
            onClick={() => setActiveTab('quytrinh')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'quytrinh' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            5. Quy Trình 3 Giai Đoạn
          </button>
          <button
            onClick={() => setActiveTab('taichinh')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'taichinh' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            6. Tài Chính & Triển Khai
          </button>
          <button
            onClick={() => setActiveTab('phuluc')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'phuluc' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            7. Phụ Lục & Mã Nguồn
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-slate-800 text-sm leading-relaxed font-sans">
          {activeTab === 'lydo' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b pb-2 flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <span>2. Lý do chọn đề tài</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm text-amber-800">Về phía học sinh (Sự chênh lệch năng lực):</h4>
                  <p className="text-slate-600 leading-relaxed">
                    Trong cùng một lớp học, năng lực tiếp thu của học sinh là khác nhau. Tuy nhiên, các bạn thường phải ôn tập chung một bộ tài liệu, dẫn đến tình trạng học sinh khá giỏi cảm thấy nhàm chán, trong khi học sinh trung bình - yếu lại bị quá tải. Thiếu vắng các công cụ học tập mang tính cá nhân hóa để đáp ứng nhu cầu ôn tập riêng biệt của từng cá nhân.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm text-blue-800">Về phía giáo viên (Áp lực hồ sơ, học liệu):</h4>
                  <p className="text-slate-600 leading-relaxed">
                    Việc thiết kế các bộ câu hỏi trắc nghiệm khách quan bám sát ma trận đề thi (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao) và biến chúng thành các trò chơi học tập (Gamification) tốn một lượng thời gian khổng lồ. Giáo viên cần AI hỗ trợ lựa chọn những câu phù hợp với năng lực của từng cá nhân.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                <h4 className="font-bold text-emerald-950 text-sm flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Giải Pháp Đột Phá AI & Gamification:</span>
                </h4>
                <p className="text-slate-700 text-xs leading-relaxed">
                  Giải pháp ứng dụng trí tuệ nhân tạo AI kết hợp với kỹ thuật lập trình tự động hóa toàn bộ khâu sản xuất học liệu số. Giáo viên phụ trách chọn lọc, kiểm duyệt đáp án; hệ thống tự động trò chơi hóa (Wordwall, Quizizz, Anki, Wheel of Fortune) giúp học sinh ôn thi hào hứng và hiệu quả vượt trội.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'phuongphap' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b pb-2 flex items-center space-x-2">
                <Cpu className="w-5 h-5 text-emerald-600" />
                <span>3. Phương pháp tìm hiểu vấn đề</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <strong className="text-slate-900 text-sm block">1. Khảo sát thực tiễn:</strong>
                  <p className="text-slate-600">
                    Thu thập ý kiến từ học sinh khối 12 và mở rộng hỗ trợ các khối 10, 11 về những khó khăn trong việc ghi nhớ kiến thức lý thuyết các môn học (ví dụ: Tin học, Lịch sử, Địa lý) và hình thức ôn tập mong muốn.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <strong className="text-slate-900 text-sm block">2. Nghiên cứu tài liệu Ma trận GD&ĐT:</strong>
                  <p className="text-slate-600">
                    Phân tích ma trận đề thi chuẩn của Bộ GD&ĐT để xây dựng cấu trúc Prompt (câu lệnh) yêu cầu AI tạo câu hỏi sát với thực tế kiểm tra đánh giá, phân tích đề thi thử THPT và nâng cao độ khó dần.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <strong className="text-slate-900 text-sm block">3. Thử nghiệm công nghệ AI Gemini:</strong>
                  <p className="text-slate-600">
                    Đánh giá năng lực xử lý ngôn ngữ tự nhiên tiếng Việt của API Google Gemini; xử lý file chuẩn dữ liệu đầu vào cho các nền tảng Gamification (Wordwall, Quizizz, Anki).
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'y_tuong' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b pb-2 flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <span>4. Ý tưởng và giải pháp khép kín (Pipeline)</span>
              </h3>

              <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl space-y-3 text-xs">
                <div className="font-bold text-emerald-400 text-sm uppercase tracking-wider">
                  QUY TRÌNH KHIẾP KÍN (AUTOMATED PIPELINE)
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                    <strong className="text-cyan-400 block mb-1">ĐẦU VÀO (INPUT):</strong>
                    <p className="text-slate-300">Tải lên tài liệu văn bản bài giảng (PDF, Word, Text) hoặc dán trực tiếp.</p>
                  </div>

                  <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                    <strong className="text-amber-400 block mb-1">XỬ LÝ TRUNG TÂM (CORE AI):</strong>
                    <p className="text-slate-300">Google Gemini API trích xuất ý chính, sinh ngân hàng trắc nghiệm 4 lựa chọn chuẩn JSON phân hóa GD&ĐT.</p>
                  </div>

                  <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                    <strong className="text-emerald-400 block mb-1">ĐẦU RA (OUTPUT & GAME):</strong>
                    <p className="text-slate-300">Xuất file CSV Wordwall, Quizizz Excel, Thẻ Anki Flashcard và Sơ đồ tư duy Mermaid.js.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'quytrinh' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b pb-2 flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <span>5. Quy trình 3 Giai đoạn Agile</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full mr-2">Giai đoạn 1</span>
                  <strong className="text-slate-900">Xây dựng bản mẫu cơ bản (MVP):</strong>
                  <p className="text-slate-600 mt-1">Hoàn thiện tính năng AI đọc file PDF/Text và xuất ra bộ câu hỏi dưới dạng chuẩn xác cho giáo viên sao chép sử dụng.</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full mr-2">Giai đoạn 2</span>
                  <strong className="text-slate-900">Tối ưu hóa phân hóa năng lực:</strong>
                  <p className="text-slate-600 mt-1">Tinh chỉnh Prompt Engineering để AI tùy chọn tỷ lệ % câu hỏi Khó/Dễ tương ứng với năng lực từng học sinh hoặc nhóm học sinh.</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full mr-2">Giai đoạn 3</span>
                  <strong className="text-slate-900">Nâng cấp trực quan hóa & Trò chơi hóa:</strong>
                  <p className="text-slate-600 mt-1">Xuất file hàng loạt cho Wordwall, Anki và sinh sơ đồ tư duy Mindmap bằng mã Mermaid.js trực quan.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'taichinh' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b pb-2 flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <span>6. Kế hoạch tài chính & Triển khai</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm">Tài chính dự kiến (Chi phí cực thấp):</h4>
                  <ul className="list-disc list-inside text-slate-600 space-y-1">
                    <li>Chi phí API: Sử dụng gói miễn phí/trả phí rất thấp của Google Gemini API.</li>
                    <li>Chi phí Server/Hosting: Chạy trên Cloud Run / Localhost máy tính nhà trường (Miễn phí).</li>
                    <li>Tài khoản Gamification: Wordwall Pro ~60.000 - 100.000 VNĐ/tháng nếu cần không giới hạn.</li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm">Lộ trình triển khai:</h4>
                  <ul className="list-disc list-inside text-slate-600 space-y-1">
                    <li>Tháng 1-3: Viết mã nguồn, kết nối API Gemini và thiết kế Prompt.</li>
                    <li>Tháng 4-5: Thử nghiệm nội bộ giáo viên tạo đề cương môn Tin học khối 12.</li>
                    <li>Tháng 6-8: Đưa vào sử dụng cho học sinh ôn thi nước rút THPT.</li>
                    <li>Tháng 9 trở đi: Nhân rộng sang Văn, Lịch sử, Địa lý, Ngoại ngữ...</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'phuluc' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b pb-2 flex items-center space-x-2">
                <Code className="w-5 h-5 text-emerald-600" />
                <span>7. Phụ lục: Mã nguồn Kiến trúc & Prompt System</span>
              </h3>

              <div className="space-y-4 text-xs font-sans">
                {/* 1. Server Express Gemini API */}
                <div className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono space-y-2 overflow-x-auto border border-slate-800">
                  <span className="text-emerald-400 font-bold block text-sm border-b border-slate-800 pb-1">
                    1. Express Server Handler (/api/generate-quiz - server.ts)
                  </span>
                  <pre className="text-slate-300 text-[11px] leading-relaxed">{`app.post("/api/generate-quiz", async (req, res) => {
  const { content, subject, grade, questionCount, matrix, selectedQuestionTypes } = req.body;
  const prompt = \`Biên soạn CHÍNH XÁC \${questionCount} câu hỏi môn \${subject} (\${grade}).
Ma trận GD&ĐT: \${matrix.rememberPercent}% Nhận biết, \${matrix.understandPercent}% Thông hiểu, \${matrix.applyPercent}% Vận dụng...\`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      systemInstruction: "Bạn là chuyên gia khảo thí Bộ GD&ĐT Việt Nam...",
      responseMimeType: "application/json",
      responseSchema: quizResponseSchema,
    }
  });
  return res.json({ success: true, data: JSON.parse(response.text) });
});`}</pre>
                </div>

                {/* 2. System Instruction Prompt */}
                <div className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono space-y-2 overflow-x-auto border border-slate-800">
                  <span className="text-cyan-400 font-bold block text-sm border-b border-slate-800 pb-1">
                    2. System Instruction Engineering (Bộ Quy Tắc GD&ĐT)
                  </span>
                  <pre className="text-slate-300 text-[11px] leading-relaxed">{`YÊU CẦU BẮT BUỘC KHI BIÊN SOẠN CÂU HỎI:
1. Trắc nghiệm 4 lựa chọn (multiple_choice):
   - Đúng 4 phương án A, B, C, D độc lập.
2. Trắc nghiệm Đúng/Sai 4 ý (true_false):
   - Chuẩn cấu trúc THPT 2025: gồm 4 phát biểu độc lập a), b), c), d).
3. Trắc nghiệm Trả lời ngắn (short_answer):
   - Đảm bảo kết quả là con số/chuỗi ngắn cụ thể. Nếu có số Pi, quy ước π = 3.14.`}</pre>
                </div>

                {/* 3. Output JSON Schema */}
                <div className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono space-y-2 overflow-x-auto border border-slate-800">
                  <span className="text-amber-400 font-bold block text-sm border-b border-slate-800 pb-1">
                    3. Structure Output Schema Specification (Gemini Type.OBJECT)
                  </span>
                  <pre className="text-slate-300 text-[11px] leading-relaxed">{`const quizResponseSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    summaryPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
    mindmapMermaid: { type: Type.STRING },
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          questionType: { type: Type.STRING },
          question: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          correctOption: { type: Type.INTEGER },
          explanation: { type: Type.STRING },
          taxonomyLevel: { type: Type.STRING },
        },
        required: ["question", "explanation", "taxonomyLevel"]
      }
    }
  }
};`}</pre>
                </div>

                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <h4 className="font-bold text-emerald-950 mb-1">Mô phỏng Giao diện Trò chơi Wordwall/Quizizz/Anki:</h4>
                  <p className="text-slate-700">Tích hợp sẵn ở Tab "3. Đấu Trí Trò Chơi (Gamification)" với 4 chế độ chơi tương tác hoàn toàn!</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
