import React, { useState } from 'react';
import { SubjectType, GradeLevel } from '../types';
import { 
  Sparkles, 
  FileText, 
  BookOpen, 
  Wand2, 
  CheckCircle2, 
  HelpCircle,
  Upload,
  Zap,
  Flame,
  LayoutGrid
} from 'lucide-react';

interface DocumentInputProps {
  onGenerate: (data: {
    text: string;
    subject: SubjectType;
    grade: GradeLevel;
    numQuestions: number;
    generateType: 'all' | 'quiz' | 'mindmap' | 'flashcards' | 'wordwall';
    customPrompt?: string;
  }) => void;
  isLoading: boolean;
  onSelectSample: (sampleId: string) => void;
}

const SUBJECTS: SubjectType[] = [
  'Hóa học',
  'Vật lý',
  'Toán học',
  'Sinh học',
  'Lịch sử',
  'Địa lý',
  'Tiếng Anh',
  'Ngữ văn',
  'Tổng hợp',
];

const GRADES: GradeLevel[] = [
  'Lớp 10',
  'Lớp 11',
  'Lớp 12',
  'Ôn Thi Tốt Nghiệp THPT',
  'Đại học / Khác',
];

export const DocumentInput: React.FC<DocumentInputProps> = ({
  onGenerate,
  isLoading,
  onSelectSample,
}) => {
  const [text, setText] = useState('');
  const [subject, setSubject] = useState<SubjectType>('Hóa học');
  const [grade, setGrade] = useState<GradeLevel>('Lớp 12');
  const [numQuestions, setNumQuestions] = useState(8);
  const [generateType, setGenerateType] = useState<'all' | 'quiz' | 'mindmap' | 'flashcards' | 'wordwall'>('all');
  const [customPrompt, setCustomPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      alert('Vui lòng nhập hoặc dán nội dung bài giảng / tài liệu học tập!');
      return;
    }
    onGenerate({
      text,
      subject,
      grade,
      numQuestions,
      generateType,
      customPrompt,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          setText(content);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Banner / Intro Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 text-white p-6 sm:p-8 mb-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 bg-indigo-500/20 border border-indigo-400/30 rounded-full px-3 py-1 text-xs font-bold text-indigo-300 mb-4 backdrop-blur-xs">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Trợ Lý Trí Tuệ Nhân Tạo GD&ĐT Việt Nam 2025+</span>
          </div>
          
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-snug mb-3">
            Tự Động Hóa Soạn Bài, Đề Thi Phân Hóa & Trò Chơi Học Tập
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
            Dán bài giảng hoặc file giáo án của bạn. AI sẽ lập tức chuyển đổi thành:
            <strong className="text-indigo-300"> Ngân hàng câu hỏi GD&ĐT 4 mức độ</strong>, 
            <strong className="text-emerald-300"> Sơ đồ tư duy trực quan</strong>, 
            <strong className="text-sky-300"> Flashcard Anki</strong> và 
            <strong className="text-purple-300"> Trò chơi Wordwall (Vòng quay, Ai là triệu phú, Ô chữ)</strong>.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onSelectSample('ester-lipit')}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white transition-all cursor-pointer backdrop-blur-xs"
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Thử mẫu: Hóa 12 Ester - Lipit</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectSample('vatly-daodong')}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white transition-all cursor-pointer backdrop-blur-xs"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>Thử mẫu: Vật Lý 12 Dao Động Cơ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Metadata Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Môn Học
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as SubjectType)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-3 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Khối Lớp / Trình Độ
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value as GradeLevel)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-3 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              >
                {GRADES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Số Lượng Câu Hỏi
              </label>
              <select
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-3 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              >
                <option value={5}>5 câu (Nhanh)</option>
                <option value={8}>8 câu (Chuẩn bài kiểm tra)</option>
                <option value={12}>12 câu (Ngân hàng câu hỏi đầy đủ)</option>
                <option value={15}>15 câu (Đề luyện thi chuyên sâu)</option>
              </select>
            </div>
          </div>

          {/* Text Input Area */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Nội Dung Bài GIẢNG / TÀI LIỆU ÔN THI
              </label>
              <label className="inline-flex items-center space-x-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Tải lên tệp .txt / .md</span>
                <input
                  type="file"
                  accept=".txt,.md,.json,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <textarea
              rows={9}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Dán nội dung giáo án, bài giảng, tài liệu lý thuyết hoặc công thức vào đây... (Ví dụ: Định nghĩa Ester, Tính chất hóa học của Triglyceride, Các dạng bài tập con lắc đơn, sự kiện lịch sử...)"
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-4 text-sm font-mono leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all placeholder:text-slate-400 placeholder:font-sans"
            />
            
            <div className="flex items-center justify-between mt-1 text-xs text-slate-500 font-medium">
              <span>Đã nhập: {text.length} ký tự</span>
              <span>Hỗ trợ công thức Toán, Hóa, Lý & thuật ngữ chuyên ngành</span>
            </div>
          </div>

          {/* Output Mode Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Chế Độ Đầu Ra Yêu Cầu
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <button
                type="button"
                onClick={() => setGenerateType('all')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  generateType === 'all'
                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>Tất Cả 4 Loại</span>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Đề thi + Mindmap + Flashcard + Wordwall
                </div>
              </button>

              <button
                type="button"
                onClick={() => setGenerateType('quiz')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  generateType === 'quiz'
                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="font-bold text-xs">Ngân Hàng Câu Hỏi</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Chuẩn 4 mức độ GD&ĐT 2025
                </div>
              </button>

              <button
                type="button"
                onClick={() => setGenerateType('mindmap')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  generateType === 'mindmap'
                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="font-bold text-xs">Sơ Đồ Tư Duy</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Cấu trúc cây đa tầng trực quan
                </div>
              </button>

              <button
                type="button"
                onClick={() => setGenerateType('flashcards')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  generateType === 'flashcards'
                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="font-bold text-xs">Flashcard Anki</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Bộ thẻ ghi nhớ ngắt quãng
                </div>
              </button>

              <button
                type="button"
                onClick={() => setGenerateType('wordwall')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  generateType === 'wordwall'
                    ? 'border-purple-600 bg-purple-50/80 text-purple-900 ring-2 ring-purple-500/20'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="font-bold text-xs text-purple-700">Trò Chơi Wordwall</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Vòng quay, Triệu phú, Ghép đôi
                </div>
              </button>
            </div>
          </div>

          {/* Optional Custom Instructions */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Yêu Cầu Bổ Sung Đặt Riêng (Tùy chọn)
            </label>
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Ví dụ: Tập trung xoáy sâu vào bài tập tính toán este nâng cao, hoặc thêm câu hỏi ma trận Đúng/Sai..."
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || !text.trim()}
              className={`w-full py-4 px-6 rounded-xl font-extrabold text-base text-white shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                isLoading || !text.trim()
                  ? 'bg-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-200 active:scale-[0.99]'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>AI Đang Phân Tích & Chuyển Đổi Học Liệu...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  <span>Tự Động Tạo Học Liệu & Trò Chơi Ngay (Gemini AI)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
