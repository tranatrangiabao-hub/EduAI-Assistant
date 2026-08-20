import React, { useState } from 'react';
import { QuizBankData, QuestionItem, CognitiveLevel, QuestionType } from '../types';
import { 
  FileCheck2, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Eye, 
  EyeOff, 
  Printer, 
  Download, 
  Filter, 
  BarChart3, 
  Award, 
  Sparkles,
  BookOpenCheck,
  RefreshCw
} from 'lucide-react';

interface QuizBankViewProps {
  quizData: QuizBankData | null;
  onPrint?: () => void;
}

export const QuizBankView: React.FC<QuizBankViewProps> = ({ quizData, onPrint }) => {
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showAnswerKey, setShowAnswerKey] = useState<boolean>(true);
  const [studentMode, setStudentMode] = useState<boolean>(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState<boolean>(false);

  if (!quizData || !quizData.questions || quizData.questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto my-12 p-8 bg-white border border-slate-200 rounded-2xl text-center shadow-xs">
        <FileCheck2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800 mb-1">Chưa Có Ngân Hàng Câu Hỏi</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Vui lòng nhập bài giảng ở phần "Soạn Bài / Nhập Liệu" hoặc chọn bài mẫu minh họa để tạo đề thi phân hóa chuẩn GD&ĐT.
        </p>
      </div>
    );
  }

  const filteredQuestions = quizData.questions.filter((q) => {
    if (filterLevel !== 'all' && q.level !== filterLevel) return false;
    if (filterType !== 'all' && q.type !== filterType) return false;
    return true;
  });

  const handleOptionSelect = (qId: string, optionIndex: number) => {
    if (submitted) return;
    setUserAnswers((prev) => ({ ...prev, [qId]: optionIndex }));
  };

  const handleTrueFalseSelect = (qId: string, subIndex: number, val: boolean) => {
    if (submitted) return;
    setUserAnswers((prev) => {
      const current = prev[qId] || {};
      return {
        ...prev,
        [qId]: { ...current, [subIndex]: val },
      };
    });
  };

  const handleShortAnswerChange = (qId: string, val: string) => {
    if (submitted) return;
    setUserAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  const calculateScore = () => {
    let correctCount = 0;
    quizData.questions.forEach((q) => {
      if (q.type === 'multiple_choice') {
        if (userAnswers[q.id] === q.correctOptionIndex) correctCount += 1;
      } else if (q.type === 'short_answer') {
        const ans = (userAnswers[q.id] || '').toString().trim().toLowerCase();
        const expected = (q.shortAnswer || '').toString().trim().toLowerCase();
        if (ans && ans === expected) correctCount += 1;
      } else if (q.type === 'true_false' && q.subItems) {
        const userSubs = userAnswers[q.id] || {};
        let allMatched = true;
        q.subItems.forEach((sub, idx) => {
          if (userSubs[idx] !== sub.isCorrect) allMatched = false;
        });
        if (allMatched && Object.keys(userSubs).length === q.subItems.length) correctCount += 1;
      }
    });
    return correctCount;
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      {/* Quiz Header & Controls Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-xs no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
              <span>{quizData.subject}</span>
              <span>•</span>
              <span>{quizData.grade}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {quizData.title || 'Ngân Hàng Câu Hỏi Phân Hóa Chuẩn GD&ĐT 2025+'}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setStudentMode(!studentMode);
                setSubmitted(false);
                setUserAnswers({});
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                studentMode
                  ? 'bg-purple-600 text-white shadow-purple-200 shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <BookOpenCheck className="w-4 h-4" />
              <span>{studentMode ? 'Chế Độ Học Sinh (Đang Thi)' : 'Luyện Tập Học Sinh'}</span>
            </button>

            {!studentMode && (
              <button
                onClick={() => setShowAnswerKey(!showAnswerKey)}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5"
              >
                {showAnswerKey ? <EyeOff className="w-4 h-4 text-slate-500" /> : <Eye className="w-4 h-4 text-indigo-600" />}
                <span>{showAnswerKey ? 'Ẩn Đáp Án & Lời Giải' : 'Hiện Đáp Án & Lời Giải'}</span>
              </button>
            )}

            <button
              onClick={onPrint || (() => window.print())}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center space-x-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>In Đề Thi / Xuất Word</span>
            </button>
          </div>
        </div>

        {/* Matrix GD&ĐT Summary Badge Bar */}
        {quizData.matrixSummary && (
          <div className="mt-4 pt-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center space-x-1.5">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span>Ma Trận Phân Bố Mức Độ Tư Duy (GD&ĐT):</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-2.5 text-center">
                <span className="block text-[11px] font-bold text-emerald-700 uppercase">Nhận biết</span>
                <span className="text-lg font-black text-emerald-900">{quizData.matrixSummary.nhanBiet || 0} câu</span>
              </div>
              <div className="bg-sky-50/80 border border-sky-200 rounded-xl p-2.5 text-center">
                <span className="block text-[11px] font-bold text-sky-700 uppercase">Thông hiểu</span>
                <span className="text-lg font-black text-sky-900">{quizData.matrixSummary.thongHieu || 0} câu</span>
              </div>
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-2.5 text-center">
                <span className="block text-[11px] font-bold text-amber-700 uppercase">Vận dụng</span>
                <span className="text-lg font-black text-amber-900">{quizData.matrixSummary.vanDung || 0} câu</span>
              </div>
              <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-2.5 text-center">
                <span className="block text-[11px] font-bold text-rose-700 uppercase">Vận dụng cao</span>
                <span className="text-lg font-black text-rose-900">{quizData.matrixSummary.vanDungCao || 0} câu</span>
              </div>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-200/80 text-xs font-semibold">
          <div className="flex items-center space-x-3">
            <span className="text-slate-500 flex items-center space-x-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Lọc mức độ:</span>
            </span>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="bg-slate-100 border border-slate-300 text-slate-800 rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">Tất cả mức độ</option>
              <option value="Nhận biết">Nhận biết</option>
              <option value="Thông hiểu">Thông hiểu</option>
              <option value="Vận dụng">Vận dụng</option>
              <option value="Vận dụng cao">Vận dụng cao</option>
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-100 border border-slate-300 text-slate-800 rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">Tất cả dạng câu hỏi</option>
              <option value="multiple_choice">Trắc nghiệm 4 phương án</option>
              <option value="true_false">Trắc nghiệm Đúng/Sai</option>
              <option value="short_answer">Trả lời ngắn</option>
            </select>
          </div>

          <span className="text-slate-500">
            Hiển thị {filteredQuestions.length} / {quizData.questions.length} câu
          </span>
        </div>
      </div>

      {/* Student Mode Score Banner */}
      {studentMode && (
        <div className="bg-purple-900 text-white rounded-2xl p-5 mb-6 shadow-md no-print flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-base flex items-center space-x-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span>Chế Độ Tự Luyện Thi Trực Tuyến</span>
            </h3>
            <p className="text-xs text-purple-200 mt-1">
              {submitted
                ? `Bạn đã hoàn thành bài thi! Kết quả: ${calculateScore()} / ${quizData.questions.length} câu đúng.`
                : 'Hãy chọn đáp án cho từng câu hỏi phía dưới và bấm "Nộp Bài Thi" để xem kết quả & lời giải chi tiết.'}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {!submitted ? (
              <button
                onClick={() => setSubmitted(true)}
                className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer"
              >
                Nộp Bài Thi
              </button>
            ) : (
              <button
                onClick={() => {
                  setSubmitted(false);
                  setUserAnswers({});
                }}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Làm Lại Bài Thi</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Printable Paper Header (Visible only in print view) */}
      <div className="hidden print-only text-center mb-8 pb-4 border-b-2 border-black">
        <div className="flex justify-between items-center text-xs font-bold uppercase mb-2">
          <span>BỘ GIÁO DỤC VÀ ĐÀO TẠO</span>
          <span>ĐỀ THI PHÂN HÓA NĂNG LỰC</span>
        </div>
        <h1 className="text-2xl font-black uppercase mb-1">{quizData.title}</h1>
        <p className="text-xs font-semibold">Môn: {quizData.subject} • Trình độ: {quizData.grade} • Thời gian: 45 phút</p>
      </div>

      {/* Question List */}
      <div className="space-y-6">
        {filteredQuestions.map((q, idx) => {
          const levelColorMap: Record<CognitiveLevel, string> = {
            'Nhận biết': 'bg-emerald-100 text-emerald-800 border-emerald-300',
            'Thông hiểu': 'bg-sky-100 text-sky-800 border-sky-300',
            'Vận dụng': 'bg-amber-100 text-amber-800 border-amber-300',
            'Vận dụng cao': 'bg-rose-100 text-rose-800 border-rose-300',
          };

          return (
            <div
              key={q.id || idx}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:border-slate-300 transition-all print:border-none print:shadow-none print:p-0 print:mb-6"
            >
              {/* Question Meta Badge */}
              <div className="flex items-center justify-between mb-3 no-print">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                    Câu {idx + 1}
                  </span>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${levelColorMap[q.level] || 'bg-slate-100'}`}>
                    {q.level}
                  </span>
                  <span className="text-[11px] font-medium text-slate-500 italic">
                    {q.type === 'multiple_choice' && 'Trắc nghiệm 4 phương án'}
                    {q.type === 'true_false' && 'Trắc nghiệm Đúng/Sai (4 ý)'}
                    {q.type === 'short_answer' && 'Trả lời ngắn'}
                  </span>
                </div>
              </div>

              {/* Printable Question Number */}
              <div className="hidden print-only font-bold mb-1">
                Câu {idx + 1}: [{q.level}]
              </div>

              {/* Question Text */}
              <p className="text-slate-900 font-semibold text-base leading-relaxed mb-4 whitespace-pre-line">
                {q.question}
              </p>

              {/* Option Rendering by Question Type */}
              {/* 1. Multiple Choice */}
              {q.type === 'multiple_choice' && q.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                  {q.options.map((opt, optIdx) => {
                    const optionLetter = String.fromCharCode(65 + optIdx);
                    const isSelected = userAnswers[q.id] === optIdx;
                    const isCorrect = q.correctOptionIndex === optIdx;

                    let btnStyle = 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-800';

                    if (studentMode) {
                      if (submitted) {
                        if (isCorrect) btnStyle = 'bg-emerald-100 border-emerald-500 text-emerald-900 font-bold';
                        else if (isSelected) btnStyle = 'bg-rose-100 border-rose-400 text-rose-900';
                      } else if (isSelected) {
                        btnStyle = 'bg-indigo-100 border-indigo-500 text-indigo-900 font-bold ring-1 ring-indigo-500';
                      }
                    } else if (showAnswerKey && isCorrect) {
                      btnStyle = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold';
                    }

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleOptionSelect(q.id, optIdx)}
                        className={`p-3 rounded-xl border text-left transition-all flex items-center space-x-3 cursor-pointer ${btnStyle}`}
                      >
                        <span className="w-6 h-6 rounded-lg bg-white border border-slate-300 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                          {optionLetter}
                        </span>
                        <span className="text-sm font-medium">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 2. True / False Matrix */}
              {q.type === 'true_false' && q.subItems && (
                <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider">
                      <tr>
                        <th className="p-3 w-12 text-center">Ý</th>
                        <th className="p-3">Nội dung khẳng định</th>
                        <th className="p-3 w-28 text-center">Lựa chọn</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white font-medium">
                      {q.subItems.map((sub, subIdx) => {
                        const subLetter = String.fromCharCode(97 + subIdx); // a, b, c, d
                        const userVal = userAnswers[q.id]?.[subIdx];

                        return (
                          <tr key={subIdx} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-center text-indigo-600">{subLetter})</td>
                            <td className="p-3 text-slate-800">{sub.statement}</td>
                            <td className="p-3 text-center">
                              {studentMode ? (
                                <div className="flex items-center justify-center space-x-1">
                                  <button
                                    type="button"
                                    onClick={() => handleTrueFalseSelect(q.id, subIdx, true)}
                                    className={`px-2 py-1 text-xs rounded-md font-bold cursor-pointer ${
                                      userVal === true
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                  >
                                    Đúng
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleTrueFalseSelect(q.id, subIdx, false)}
                                    className={`px-2 py-1 text-xs rounded-md font-bold cursor-pointer ${
                                      userVal === false
                                        ? 'bg-rose-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                  >
                                    Sai
                                  </button>
                                </div>
                              ) : (
                                <span
                                  className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                                    sub.isCorrect
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {sub.isCorrect ? 'ĐÚNG' : 'SAI'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 3. Short Answer */}
              {q.type === 'short_answer' && (
                <div className="mb-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Đáp án điền ngắn:
                  </label>
                  {studentMode ? (
                    <input
                      type="text"
                      value={userAnswers[q.id] || ''}
                      onChange={(e) => handleShortAnswerChange(q.id, e.target.value)}
                      placeholder="Nhập kết quả số hoặc từ khóa ngắn..."
                      className="w-full sm:w-80 bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  ) : (
                    <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-sm font-extrabold text-indigo-900 inline-block">
                      Đáp án đúng: {q.shortAnswer}
                    </div>
                  )}
                </div>
              )}

              {/* Explanation Section */}
              {((showAnswerKey && !studentMode) || (studentMode && submitted)) && q.explanation && (
                <div className="mt-4 pt-3 border-t border-slate-100 bg-slate-50/70 p-4 rounded-xl text-xs sm:text-sm text-slate-700 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center space-x-1.5 text-indigo-700">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>Lời giải chi tiết:</span>
                  </div>
                  <p className="leading-relaxed whitespace-pre-line text-slate-800 font-medium">
                    {q.explanation}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
