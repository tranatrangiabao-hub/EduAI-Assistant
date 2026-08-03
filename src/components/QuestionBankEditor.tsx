import React, { useState } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  XCircle,
  RotateCcw,
  HelpCircle,
  Sparkles,
  Filter,
  Eye,
  EyeOff,
  Award,
  Sliders,
  AlertTriangle,
  TrendingUp,
  BarChart2,
  Check,
  Calculator,
  ListOrdered,
  Download,
  FileText,
  Code,
  Copy,
  Printer,
  FileCode,
  HelpCircle as QuestionIcon,
} from 'lucide-react';
import { Question, TaxonomyLevel, DifficultyLevel, QuestionType, TrueFalseStatement } from '../types';
import { MathText } from './MathRenderer';
import {
  calculateQuestionEarnedScore,
  evaluateShortAnswer,
  evaluateTrueFalseQuestion,
  cleanOptionText,
  cleanQuestionText,
  cleanTopicText,
  sanitizeQuestionOptions,
  sanitizeTrueFalseStatements,
  normalizeTaxonomyLevel,
  normalizeDifficultyLevel,
} from '../utils/questionEvaluator';
import { downloadExamPaperDOCX, printExamPaper } from '../utils/exporters';

interface QuestionBankEditorProps {
  questions: Question[];
  onUpdateQuestions: (questions: Question[]) => void;
  onAdaptiveRelevel: (weakTopics: string[]) => Promise<void>;
  isAdaptiveLoading: boolean;
}

export const QuestionBankEditor: React.FC<QuestionBankEditorProps> = ({
  questions,
  onUpdateQuestions,
  onAdaptiveRelevel,
  isAdaptiveLoading,
}) => {
  const [viewMode, setViewMode] = useState<'editor' | 'preview' | 'json'>('editor');
  const [searchTerm, setSearchTerm] = useState('');
  const [taxonomyFilter, setTaxonomyFilter] = useState<string>('all');
  const [questionTypeFilter, setQuestionTypeFilter] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  // Student interaction states across all 3 question types
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [userTfAnswers, setUserTfAnswers] = useState<Record<string, Record<string, boolean>>>({});
  const [userShortAnswers, setUserShortAnswers] = useState<Record<string, string>>({});
  const [submittedShortAnswers, setSubmittedShortAnswers] = useState<Record<string, string>>({});

  // Point allocation configuration by Taxonomy level (Nhận biết < Thông hiểu < Vận dụng < Vận dụng cao)
  const [taxonomyWeights, setTaxonomyWeights] = useState<Record<TaxonomyLevel, number>>({
    'Nhận biết': 1.0,
    'Thông hiểu': 2.0,
    'Vận dụng': 3.0,
    'Vận dụng cao': 4.0,
  });
  const [showWeightConfig, setShowWeightConfig] = useState(false);

  // New question state
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    questionType: 'multiple_choice',
    question: '',
    options: ['', '', '', ''],
    correctOption: 0,
    tfStatements: [
      { id: 'tf_a', statement: 'a) Phát biểu 1...', isCorrect: true },
      { id: 'tf_b', statement: 'b) Phát biểu 2...', isCorrect: false },
      { id: 'tf_c', statement: 'c) Phát biểu 3...', isCorrect: true },
      { id: 'tf_d', statement: 'd) Phát biểu 4...', isCorrect: false },
    ],
    shortAnswer: '3.14',
    acceptableAnswers: ['3.14', '3,14'],
    mathRoundingNote: 'Sử dụng π = 3.14, làm tròn đến 2 chữ số thập phân',
    roundingDecimals: 2,
    explanation: '',
    taxonomyLevel: 'Nhận biết',
    difficulty: 'Dễ',
  });

  const taxonomyColors: Record<TaxonomyLevel, string> = {
    'Nhận biết': 'bg-blue-50 text-blue-700 border-blue-200',
    'Thông hiểu': 'bg-green-50 text-green-700 border-green-200',
    'Vận dụng': 'bg-orange-50 text-orange-700 border-orange-200',
    'Vận dụng cao': 'bg-red-50 text-red-700 border-red-200',
  };

  const questionTypeLabels: Record<QuestionType, { label: string; badgeColor: string }> = {
    multiple_choice: { label: 'Trắc nghiệm (4 LC)', badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    true_false: { label: 'Đúng / Sai (4 ý)', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    short_answer: { label: 'Trả lời ngắn (Toán/Số)', badgeColor: 'bg-purple-50 text-purple-700 border-purple-200' },
  };

  const filteredQuestions = questions.filter((q) => {
    const qType = q.questionType || 'multiple_choice';
    const matchesSearch =
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.explanation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTaxonomy = taxonomyFilter === 'all' || q.taxonomyLevel === taxonomyFilter;
    const matchesType = questionTypeFilter === 'all' || qType === questionTypeFilter;
    return matchesSearch && matchesTaxonomy && matchesType;
  });

  const handleSelectOption = (qId: string, optIdx: number) => {
    if (editingId === qId) return;
    setUserAnswers((prev) => ({
      ...prev,
      [qId]: optIdx,
    }));
  };

  const handleToggleTfStatement = (qId: string, statementId: string, value: boolean) => {
    if (editingId === qId) return;
    setUserTfAnswers((prev) => {
      const qState = prev[qId] || {};
      return {
        ...prev,
        [qId]: {
          ...qState,
          [statementId]: value,
        },
      };
    });
  };

  const handleShortAnswerChange = (qId: string, val: string) => {
    if (editingId === qId) return;
    setUserShortAnswers((prev) => ({
      ...prev,
      [qId]: val,
    }));
    // Clear submitted feedback while user is typing a new attempt
    if (submittedShortAnswers[qId] !== undefined) {
      setSubmittedShortAnswers((prev) => {
        const next = { ...prev };
        delete next[qId];
        return next;
      });
    }
  };

  const handleCheckShortAnswer = (qId: string) => {
    if (editingId === qId) return;
    const val = userShortAnswers[qId] || '';
    if (!val.trim()) return;
    setSubmittedShortAnswers((prev) => ({
      ...prev,
      [qId]: val,
    }));
  };

  const handleResetAnswers = () => {
    setUserAnswers({});
    setUserTfAnswers({});
    setUserShortAnswers({});
    setSubmittedShortAnswers({});
  };

  // Calculations for Point allocation & Scoring
  const isWeightOrderValid =
    taxonomyWeights['Nhận biết'] < taxonomyWeights['Thông hiểu'] &&
    taxonomyWeights['Thông hiểu'] < taxonomyWeights['Vận dụng'] &&
    taxonomyWeights['Vận dụng'] < taxonomyWeights['Vận dụng cao'];

  const totalBankPossibleScore = questions.reduce(
    (sum, q) => sum + (taxonomyWeights[q.taxonomyLevel] ?? 1),
    0
  );

  const totalEarnedScore = Math.round(
    questions.reduce((sum, q) => {
      const weight = taxonomyWeights[q.taxonomyLevel] ?? 1;
      const res = calculateQuestionEarnedScore(q, weight, userAnswers, userTfAnswers, submittedShortAnswers);
      return sum + res.earned;
    }, 0) * 100
  ) / 100;

  const totalAnsweredCount = questions.filter((q) => {
    const weight = taxonomyWeights[q.taxonomyLevel] ?? 1;
    const res = calculateQuestionEarnedScore(q, weight, userAnswers, userTfAnswers, submittedShortAnswers);
    return res.isAnswered;
  }).length;

  const totalCorrectCount = questions.filter((q) => {
    const weight = taxonomyWeights[q.taxonomyLevel] ?? 1;
    const res = calculateQuestionEarnedScore(q, weight, userAnswers, userTfAnswers, submittedShortAnswers);
    return res.isFullyCorrect;
  }).length;

  const scoreOnTenScale =
    totalBankPossibleScore > 0 ? ((totalEarnedScore / totalBankPossibleScore) * 10).toFixed(1) : '0.0';

  const getPerformanceRating = (score10: number) => {
    if (score10 >= 9.0) return { label: 'Xuất sắc 🌟', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-500' };
    if (score10 >= 8.0) return { label: 'Giỏi 🥇', color: 'text-blue-400 bg-blue-950/40 border-blue-500' };
    if (score10 >= 6.5) return { label: 'Khá 👍', color: 'text-amber-400 bg-amber-950/40 border-amber-500' };
    if (score10 >= 5.0) return { label: 'Trung bình 👌', color: 'text-orange-400 bg-orange-950/40 border-orange-500' };
    return { label: 'Cần bổ trợ 💡', color: 'text-rose-400 bg-rose-950/40 border-rose-500' };
  };

  const taxonomyStats = (['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'] as TaxonomyLevel[]).map(
    (level) => {
      const levelQuestions = questions.filter((q) => q.taxonomyLevel === level);
      const totalCount = levelQuestions.length;
      const unitWeight = taxonomyWeights[level] ?? 1;
      const maxScore = totalCount * unitWeight;

      let answeredCount = 0;
      let correctCount = 0;
      let earnedScore = 0;

      levelQuestions.forEach((q) => {
        const res = calculateQuestionEarnedScore(q, unitWeight, userAnswers, userTfAnswers, submittedShortAnswers);
        if (res.isAnswered) answeredCount++;
        if (res.isFullyCorrect) correctCount++;
        earnedScore += res.earned;
      });

      earnedScore = Math.round(earnedScore * 100) / 100;

      return {
        level,
        unitWeight,
        totalCount,
        answeredCount,
        correctCount,
        maxScore,
        earnedScore,
      };
    }
  );

  const handleDelete = (id: string) => {
    onUpdateQuestions(questions.filter((q) => q.id !== id));
    setUserAnswers((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setUserTfAnswers((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setUserShortAnswers((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleFieldChange = (qId: string, field: keyof Question, value: any) => {
    const updated = questions.map((q) => {
      if (q.id === qId) {
        return { ...q, [field]: value };
      }
      return q;
    });
    onUpdateQuestions(updated);
  };

  const handleSaveNewQuestion = () => {
    if (!newQuestion.question?.trim()) return;

    const qType = newQuestion.questionType || 'multiple_choice';

    const created: Question = {
      id: `q_custom_${Date.now()}`,
      questionType: qType,
      question: newQuestion.question || 'Câu hỏi mới',
      options: (newQuestion.options as [string, string, string, string]) || ['A', 'B', 'C', 'D'],
      correctOption: newQuestion.correctOption ?? 0,
      tfStatements: newQuestion.tfStatements || [
        { id: 'tf_1', statement: 'a) Phát biểu 1', isCorrect: true },
        { id: 'tf_2', statement: 'b) Phát biểu 2', isCorrect: false },
        { id: 'tf_3', statement: 'c) Phát biểu 3', isCorrect: true },
        { id: 'tf_4', statement: 'd) Phát biểu 4', isCorrect: false },
      ],
      shortAnswer: newQuestion.shortAnswer || '3.14',
      acceptableAnswers: newQuestion.acceptableAnswers || ['3.14', '3,14'],
      mathRoundingNote: newQuestion.mathRoundingNote || 'Dùng π = 3.14, làm tròn đến 2 chữ số thập phân',
      roundingDecimals: newQuestion.roundingDecimals ?? 2,
      explanation: newQuestion.explanation || 'Chưa có giải thích chi tiết.',
      taxonomyLevel: (newQuestion.taxonomyLevel as TaxonomyLevel) || 'Nhận biết',
      difficulty: (newQuestion.difficulty as DifficultyLevel) || 'Dễ',
    };

    onUpdateQuestions([created, ...questions]);
    setIsAddingNew(false);
    setNewQuestion({
      questionType: 'multiple_choice',
      question: '',
      options: ['', '', '', ''],
      correctOption: 0,
      explanation: '',
      taxonomyLevel: 'Nhận biết',
      difficulty: 'Dễ',
    });
  };

  return (
    <div className="space-y-6">
      {/* View Mode Mode Switcher Bar (Interactive Practice | Live A4 Paper Preview | Raw JSON Code) */}
      <div className="bg-slate-900 text-white p-3 sm:p-4 rounded-2xl shadow-md border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-blue-600 rounded-xl text-white font-bold text-xs shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">Chế Độ Hiển Thị Ngân Hàng Câu Hỏi</h2>
            <p className="text-[11px] text-slate-400">Xem trực tiếp đề thi khổ A4, tương tác làm bài hoặc truy xuất mã nguồn JSON</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setViewMode('editor')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap ${
              viewMode === 'editor'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-extrabold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <ListOrdered className="w-4 h-4 text-blue-400" />
            <span>1. Làm Bài & Chỉnh Sửa ({questions.length})</span>
          </button>

          <button
            onClick={() => setViewMode('preview')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap ${
              viewMode === 'preview'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 font-extrabold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>2. Xem Trước Đề Thi Khổ A4</span>
          </button>

          <button
            onClick={() => setViewMode('json')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap ${
              viewMode === 'json'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-extrabold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Code className="w-4 h-4 text-emerald-400" />
            <span>3. Mã Nguồn JSON</span>
          </button>
        </div>
      </div>

      {/* VIEW MODE 2: LIVE A4 EXAM PAPER PREVIEW */}
      {viewMode === 'preview' && (
        <div className="space-y-6">
          {/* Action Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Xem Trước Bản In Giấy Khổ A4 Chuẩn GD&ĐT</h3>
                <p className="text-xs text-slate-500">Được tự động định dạng chuẩn tờ đề thi kèm Bảng đáp án và Hướng dẫn chấm chi tiết</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => printExamPaper('ĐỀ THI VÀ KIỂM TRA CHUẨN GD&ĐT', questions, 'Môn Học')}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>In Khổ A4 Ngay</span>
              </button>

              <button
                onClick={() => downloadExamPaperDOCX('ĐỀ THI VÀ KIỂM TRA CHUẨN GD&ĐT', questions, 'Môn Học')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <FileCode className="w-4 h-4" />
                <span>Tải File Word (.DOCX)</span>
              </button>
            </div>
          </div>

          {/* Paper Canvas Sheet */}
          <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-2xl border border-slate-300 shadow-2xl space-y-8 font-serif text-slate-900 text-sm leading-relaxed">
            {/* Header Box */}
            <div className="grid grid-cols-2 gap-4 border-b-2 border-slate-900 pb-6">
              <div>
                <p className="font-bold uppercase text-xs">SỞ GIÁO DỤC VÀ ĐÀO TẠO</p>
                <p className="font-bold uppercase text-xs text-slate-700">TRƯỜNG THPT CHUYÊN CHUẨN GD&ĐT</p>
                <p className="text-xs italic mt-2">Mã đề thi: 101</p>
              </div>
              <div className="text-right">
                <p className="font-bold uppercase text-xs">ĐỀ THI VÀ KIỂM TRA TỰ ĐỘNG AI</p>
                <p className="font-bold text-xs text-blue-900 uppercase">THỜI GIAN LÀM BÀI: 45 - 90 PHÚT</p>
                <p className="text-xs italic mt-2">(Không kể thời gian phát đề)</p>
              </div>
            </div>

            {/* Student Info Box */}
            <div className="p-4 border border-slate-400 rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-sans bg-slate-50/50">
              <div>Họ và tên thí sinh: ...........................................</div>
              <div>Lớp: ........................</div>
              <div>Số báo danh: ........................</div>
            </div>

            {/* Section I: Multiple Choice */}
            {questions.some((q) => !q.questionType || q.questionType === 'multiple_choice') && (
              <div className="space-y-4">
                <h4 className="font-bold text-base text-slate-900 border-b border-slate-300 pb-1 uppercase font-sans">
                  PHẦN I. Câu hỏi trắc nghiệm nhiều lựa chọn (Thí sinh chọn 01 đáp án đúng nhất)
                </h4>
                {questions
                  .filter((q) => !q.questionType || q.questionType === 'multiple_choice')
                  .map((q, idx) => (
                    <div key={q.id || idx} className="space-y-2">
                      <p className="font-bold">
                        Câu {idx + 1}: <MathText text={cleanQuestionText(q.question)} className="font-normal" />
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-4 text-xs font-sans">
                        {q.options?.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-start space-x-1.5">
                            <span className="font-bold">{String.fromCharCode(65 + optIdx)}.</span>
                            <MathText text={cleanOptionText(opt)} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Section II: True / False */}
            {questions.some((q) => q.questionType === 'true_false') && (
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <h4 className="font-bold text-base text-slate-900 border-b border-slate-300 pb-1 uppercase font-sans">
                  PHẦN II. Câu hỏi trắc nghiệm Đúng/Sai (Thí sinh chọn Đúng hoặc Sai cho mỗi ý a, b, c, d)
                </h4>
                {questions
                  .filter((q) => q.questionType === 'true_false')
                  .map((q, idx) => {
                    const stmts = sanitizeTrueFalseStatements(q);
                    return (
                      <div key={q.id || idx} className="space-y-2">
                        <p className="font-bold">
                          Câu {idx + 1}: <MathText text={cleanQuestionText(q.question)} className="font-normal" />
                        </p>
                        <div className="pl-4 space-y-1 text-xs font-sans">
                          {stmts.map((stmt, sIdx) => (
                            <div key={sIdx} className="flex items-center justify-between p-1.5 border border-slate-200 rounded">
                              <MathText text={stmt.statement} />
                              <div className="flex space-x-4 font-bold text-[11px] shrink-0">
                                <span>[ ] Đúng</span>
                                <span>[ ] Sai</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Section III: Short Answer */}
            {questions.some((q) => q.questionType === 'short_answer') && (
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <h4 className="font-bold text-base text-slate-900 border-b border-slate-300 pb-1 uppercase font-sans">
                  PHẦN III. Câu hỏi trắc nghiệm trả lời ngắn (Thí sinh điền kết quả tính toán)
                </h4>
                {questions
                  .filter((q) => q.questionType === 'short_answer')
                  .map((q, idx) => (
                    <div key={q.id || idx} className="space-y-2">
                      <p className="font-bold">
                        Câu {idx + 1}: <MathText text={cleanQuestionText(q.question)} className="font-normal" />
                      </p>
                      <div className="pl-4 flex items-center space-x-3 text-xs font-sans">
                        <span className="font-semibold text-slate-600">Đáp số:</span>
                        <div className="w-48 h-8 border-2 border-dashed border-slate-400 rounded bg-slate-50 flex items-center px-3 italic text-slate-400">
                          Điền kết quả...
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Section IV: Answer Key & Detailed Solution */}
            <div className="pt-8 border-t-2 border-slate-900 space-y-4">
              <h4 className="font-bold text-base text-blue-900 border-b border-blue-200 pb-1 uppercase font-sans">
                HƯỚNG DẪN CHẤM ĐIỂM VÀ ĐÁP ÁN CHI TIẾT
              </h4>
              <div className="space-y-3 font-sans text-xs">
                {questions.map((q, idx) => (
                  <div key={q.id || idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                    <p className="font-bold text-slate-900">
                      Câu {idx + 1}: <MathText text={cleanQuestionText(q.question)} className="text-blue-700" />
                    </p>
                    <p className="font-bold text-emerald-800">
                      Đáp án đúng:{' '}
                      {q.questionType === 'short_answer' ? (
                        <MathText text={q.shortAnswer || q.acceptableAnswers?.[0] || ''} />
                      ) : q.questionType === 'true_false' ? (
                        q.tfStatements?.map((s) => `${s.statement.slice(0, 3)}: ${s.isCorrect ? 'Đúng' : 'Sai'}`).join(' | ')
                      ) : (
                        <>
                          {String.fromCharCode(65 + (q.correctOption ?? 0))}. <MathText text={q.options?.[q.correctOption ?? 0] || ''} />
                        </>
                      )}
                    </p>
                    <p className="text-slate-700 italic">Lời giải: <MathText text={q.explanation} /></p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 3: RAW JSON CODE VIEW */}
      {viewMode === 'json' && (
        <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2">
              <Code className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Mã Nguồn Ngân Hàng Câu Hỏi (JSON Specification)</h3>
                <p className="text-xs text-slate-400">Dữ liệu thô định dạng JSON chuẩn GD&ĐT gồm options, taxonomy, explanation</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(questions, null, 2));
                  setCopiedJson(true);
                  setTimeout(() => setCopiedJson(false), 2000);
                }}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                {copiedJson ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Đã Sao Chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Sao Chép JSON</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(questions, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `quiz_bank_${Date.now()}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Tải File .JSON</span>
              </button>
            </div>
          </div>

          <pre className="text-xs bg-slate-950 p-4 rounded-xl text-emerald-300 overflow-x-auto max-h-[600px] border border-slate-800 leading-relaxed">
            {JSON.stringify(questions, null, 2)}
          </pre>
        </div>
      )}

      {/* VIEW MODE 1: INTERACTIVE EDITOR & PRACTICE (DEFAULT) */}
      {viewMode === 'editor' && (
        <>
          {/* Point Allocation Configuration Banner & Toggle */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded bg-blue-50 text-blue-600 border border-blue-100">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <span>Chia Điểm & Phân Loại Cấp Độ GD&ĐT</span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Nhận biết &lt; Thông hiểu &lt; Vận dụng &lt; Vận dụng cao
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Tự động gán trọng số điểm theo năng lực. Hỗ trợ 3 dạng bài THPT 2025: Trắc nghiệm 4 lựa chọn, Đúng/Sai
                (4 ý) & Trả lời ngắn (Toán/Số với quy ước π = 3.14).
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowWeightConfig(!showWeightConfig)}
            className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center space-x-1.5 border border-slate-200 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            <span>{showWeightConfig ? 'Đóng Cấu Hình Điểm' : 'Tùy Chỉnh Thang Điểm'}</span>
          </button>
        </div>

        {/* Current Weight Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {(['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'] as TaxonomyLevel[]).map((lvl) => (
            <div
              key={lvl}
              className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between"
            >
              <span className="text-xs font-bold text-slate-700">{lvl}</span>
              <span className="text-xs font-extrabold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded border border-blue-200">
                +{taxonomyWeights[lvl]} pt
              </span>
            </div>
          ))}
        </div>

        {/* Expandable Configuration Drawer */}
        {showWeightConfig && (
          <div className="mt-3 p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Cài đặt số điểm cho từng câu hỏi:</span>
              <button
                onClick={() =>
                  setTaxonomyWeights({
                    'Nhận biết': 1.0,
                    'Thông hiểu': 2.0,
                    'Vận dụng': 3.0,
                    'Vận dụng cao': 4.0,
                  })
                }
                className="text-[11px] text-blue-600 font-bold hover:underline"
              >
                Đặt lại mặc định (1-2-3-4 pt)
              </button>
            </div>

            {!isWeightOrderValid && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-800 text-xs font-bold flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>
                  Lưu ý: Mức điểm cần tuân thủ quy tắc độ khó tăng dần: Nhận biết &lt; Thông hiểu &lt; Vận dụng &lt;
                  Vận dụng cao
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {(['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'] as TaxonomyLevel[]).map((lvl) => (
                <div key={lvl} className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 block">{lvl}</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="10"
                    value={taxonomyWeights[lvl]}
                    onChange={(e) =>
                      setTaxonomyWeights({
                        ...taxonomyWeights,
                        [lvl]: parseFloat(e.target.value) || 1,
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Real-time Scoring & Level-by-Level Breakdown Dashboard */}
      {questions.length > 0 && (
        <div className="bg-slate-900 text-white p-5 rounded-xl shadow-sm space-y-4 border border-slate-800">
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Award className="w-6 h-6 shrink-0" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 block">
                  Bảng Điểm Luyện Tập Trực Tiếp (THPT 2025)
                </span>
                <p className="text-xs font-semibold text-slate-300">
                  Tiến độ: <span className="text-white font-bold">{totalAnsweredCount}</span>/{questions.length} câu đã làm |
                  Đúng hoàn toàn: <span className="text-emerald-400 font-bold">{totalCorrectCount}</span> câu
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 flex-wrap gap-2">
              {/* Requested Metric: Total Earned Score / Total Possible Score */}
              <div className="bg-slate-800/90 px-4 py-2 rounded-xl border border-slate-700 text-right shadow-xs">
                <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">
                  Điểm tổng làm được / Tất cả các câu:
                </span>
                <div className="text-lg font-black text-amber-400">
                  {totalEarnedScore} <span className="text-slate-400 text-sm font-medium">/</span> {totalBankPossibleScore}{' '}
                  <span className="text-xs font-bold text-amber-300">điểm</span>
                </div>
              </div>

              {/* 10-Point Scale Equivalent */}
              <div className="bg-blue-950/80 px-4 py-2 rounded-xl border border-blue-800/80 text-right shadow-xs">
                <span className="text-[10px] text-blue-300 font-bold uppercase block tracking-wider">
                  Thang điểm 10:
                </span>
                <div className="text-lg font-black text-blue-400">
                  {scoreOnTenScale} <span className="text-slate-400 text-sm font-medium">/</span> 10.0
                </div>
              </div>

              {(() => {
                const rating = getPerformanceRating(parseFloat(scoreOnTenScale));
                return (
                  <span
                    className={`text-xs font-extrabold px-3 py-2 rounded-xl border ${rating.color} hidden sm:inline-block`}
                  >
                    {rating.label}
                  </span>
                );
              })()}

              {(totalAnsweredCount > 0 || Object.keys(userTfAnswers).length > 0 || Object.keys(userShortAnswers).length > 0) && (
                <button
                  onClick={handleResetAnswers}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg border border-slate-700 text-slate-200 flex items-center space-x-1.5 transition-colors"
                  title="Xóa tất cả câu trả lời để làm lại từ đầu"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Làm lại</span>
                </button>
              )}
            </div>
          </div>

          {/* Detailed Level-by-Level Point Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {taxonomyStats.map((stat) => {
              const percentCorrect = stat.maxScore > 0 ? Math.round((stat.earnedScore / stat.maxScore) * 100) : 0;

              return (
                <div key={stat.level} className="bg-slate-800/80 p-3 rounded-lg border border-slate-700 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">{stat.level}</span>
                    <span className="text-[10px] text-amber-400 font-extrabold bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/60">
                      +{stat.unitWeight} pt/câu
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between text-xs font-bold">
                    <span className="text-emerald-400 font-mono">
                      {stat.earnedScore}/{stat.maxScore} pt
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {stat.correctCount}/{stat.totalCount} câu đúng tuyệt đối
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${percentCorrect}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Control Bar & Filters */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm câu hỏi..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 focus:bg-white focus:border-blue-600 outline-none"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-500 shrink-0" />
            <select
              value={taxonomyFilter}
              onChange={(e) => setTaxonomyFilter(e.target.value)}
              className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 font-semibold"
            >
              <option value="all">Tất cả cấp độ GD&ĐT</option>
              <option value="Nhận biết">Nhận biết (+{taxonomyWeights['Nhận biết']} pt)</option>
              <option value="Thông hiểu">Thông hiểu (+{taxonomyWeights['Thông hiểu']} pt)</option>
              <option value="Vận dụng">Vận dụng (+{taxonomyWeights['Vận dụng']} pt)</option>
              <option value="Vận dụng cao">Vận dụng cao (+{taxonomyWeights['Vận dụng cao']} pt)</option>
            </select>

            <select
              value={questionTypeFilter}
              onChange={(e) => setQuestionTypeFilter(e.target.value)}
              className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 font-semibold"
            >
              <option value="all">Tất cả dạng câu hỏi</option>
              <option value="multiple_choice">Trắc nghiệm (4 LC)</option>
              <option value="true_false">Đúng / Sai (4 ý)</option>
              <option value="short_answer">Trả lời ngắn (Toán/Số)</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-end flex-wrap gap-1.5">
          {questions.length > 0 && (
            <button
              onClick={() => downloadExamPaperDOCX('Đề Thi & Đáp Án GD&ĐT', questions, 'Môn học')}
              className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-2xs transition-all cursor-pointer"
              title="Tải về Đề thi và Hướng dẫn chấm / Đáp án định dạng Word (.DOCX) khổ A4"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Tải File Word (.DOCX)</span>
            </button>
          )}

          <button
            onClick={() => setShowAnswerKey(!showAnswerKey)}
            className={`px-3 py-2 rounded text-xs font-bold flex items-center space-x-1.5 transition-colors border cursor-pointer ${
              showAnswerKey
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
            title="Bật/Tắt hiển thị đáp án và lời giải"
          >
            {showAnswerKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showAnswerKey ? 'Ẩn Đáp Án' : 'Hiện Đáp Án'}</span>
          </button>

          <button
            onClick={() => onAdaptiveRelevel(['Các câu hỏi khó', 'Kiến thức chưa rõ'])}
            disabled={isAdaptiveLoading}
            className="px-3 py-2 rounded bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
            title="Sử dụng AI Gemini sinh bổ sung câu hỏi củng cố hoặc nâng cao"
          >
            <Sparkles className="w-3.5 h-3.5 text-orange-600" />
            <span>{isAdaptiveLoading ? 'Đang tạo...' : 'AI Sinh Bổ Trợ'}</span>
          </button>

          <button
            onClick={() => setIsAddingNew(true)}
            className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Câu Hỏi</span>
          </button>
        </div>
      </div>

      {/* Add New Question Modal / Box */}
      {isAddingNew && (
        <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-blue-200 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Thêm Câu Hỏi Mới Thủ Công</span>
            </h3>
            <button
              onClick={() => setIsAddingNew(false)}
              className="text-xs text-slate-500 hover:text-slate-800 font-bold"
            >
              Hủy
            </button>
          </div>

          <div className="space-y-4 text-xs font-semibold">
            {/* Choose Question Type */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setNewQuestion({ ...newQuestion, questionType: 'multiple_choice' })}
                className={`p-3 rounded-lg border text-left font-bold flex items-center space-x-2 transition-all ${
                  newQuestion.questionType === 'multiple_choice'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <ListOrdered className="w-4 h-4" />
                <span>Trắc nghiệm (4 lựa chọn)</span>
              </button>

              <button
                type="button"
                onClick={() => setNewQuestion({ ...newQuestion, questionType: 'true_false' })}
                className={`p-3 rounded-lg border text-left font-bold flex items-center space-x-2 transition-all ${
                  newQuestion.questionType === 'true_false'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Trắc nghiệm Đúng / Sai (4 ý)</span>
              </button>

              <button
                type="button"
                onClick={() => setNewQuestion({ ...newQuestion, questionType: 'short_answer' })}
                className={`p-3 rounded-lg border text-left font-bold flex items-center space-x-2 transition-all ${
                  newQuestion.questionType === 'short_answer'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Calculator className="w-4 h-4" />
                <span>Trả lời ngắn (Toán/Số)</span>
              </button>
            </div>

            {/* Question Text */}
            <div>
              <label className="text-slate-700 block mb-1 font-bold">Nội dung câu hỏi / Đề bài:</label>
              <textarea
                value={newQuestion.question}
                onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                rows={2}
                placeholder="Nhập nội dung câu hỏi..."
                className="w-full p-3 rounded bg-white border border-slate-200 focus:border-blue-600 outline-none text-slate-800"
              />
            </div>

            {/* Render fields according to questionType */}
            {newQuestion.questionType === 'multiple_choice' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[0, 1, 2, 3].map((idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <span className="font-bold text-slate-700">{String.fromCharCode(65 + idx)}.</span>
                    <input
                      type="text"
                      value={newQuestion.options?.[idx] || ''}
                      onChange={(e) => {
                        const opts = [...(newQuestion.options || ['', '', '', ''])];
                        opts[idx] = e.target.value;
                        setNewQuestion({ ...newQuestion, options: opts as any });
                      }}
                      placeholder={`Phương án ${String.fromCharCode(65 + idx)}`}
                      className="w-full px-3 py-1.5 rounded border border-slate-200 text-slate-800 bg-white"
                    />
                    <input
                      type="radio"
                      name="newCorrectOption"
                      checked={newQuestion.correctOption === idx}
                      onChange={() => setNewQuestion({ ...newQuestion, correctOption: idx })}
                      className="accent-blue-600 cursor-pointer"
                      title="Đánh dấu đáp án đúng"
                    />
                  </div>
                ))}
              </div>
            )}

            {newQuestion.questionType === 'true_false' && (
              <div className="space-y-2 bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-xs font-bold text-slate-800 block mb-1">
                  Nhập 4 phát biểu (a, b, c, d) và đánh dấu Đúng/Sai chuẩn:
                </span>
                {(newQuestion.tfStatements || []).map((st, idx) => (
                  <div key={st.id || idx} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={st.statement}
                      onChange={(e) => {
                        const updated = [...(newQuestion.tfStatements || [])];
                        updated[idx] = { ...updated[idx], statement: e.target.value };
                        setNewQuestion({ ...newQuestion, tfStatements: updated });
                      }}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-200 text-xs bg-slate-50"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...(newQuestion.tfStatements || [])];
                        updated[idx] = { ...updated[idx], isCorrect: !st.isCorrect };
                        setNewQuestion({ ...newQuestion, tfStatements: updated });
                      }}
                      className={`px-3 py-1.5 rounded text-xs font-extrabold transition-all border ${
                        st.isCorrect
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-rose-600 text-white border-rose-600'
                      }`}
                    >
                      {st.isCorrect ? 'Đúng' : 'Sai'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {newQuestion.questionType === 'short_answer' && (
              <div className="space-y-3 bg-white p-4 rounded-lg border border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-700 block mb-1 font-bold">Đáp án chuẩn (Số/Từ):</label>
                    <input
                      type="text"
                      value={newQuestion.shortAnswer}
                      onChange={(e) => setNewQuestion({ ...newQuestion, shortAnswer: e.target.value })}
                      placeholder="VD: 3.14 hoặc 188.4"
                      className="w-full px-3 py-1.5 rounded border border-slate-200 text-slate-800 font-mono font-bold bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 block mb-1 font-bold">Các biến thể chấp nhận (cách nhau dấu phẩy):</label>
                    <input
                      type="text"
                      value={(newQuestion.acceptableAnswers || []).join(', ')}
                      onChange={(e) =>
                        setNewQuestion({
                          ...newQuestion,
                          acceptableAnswers: e.target.value.split(',').map((s) => s.trim()),
                        })
                      }
                      placeholder="VD: 3.14, 3,14, 3.1416"
                      className="w-full px-3 py-1.5 rounded border border-slate-200 text-slate-800 bg-slate-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-700 block mb-1 font-bold">Ghi chú quy ước (Toán/Số):</label>
                    <input
                      type="text"
                      value={newQuestion.mathRoundingNote}
                      onChange={(e) => setNewQuestion({ ...newQuestion, mathRoundingNote: e.target.value })}
                      placeholder="VD: Sử dụng π = 3.14, làm tròn 2 chữ số thập phân"
                      className="w-full px-3 py-1.5 rounded border border-slate-200 text-slate-800 bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 block mb-1 font-bold">Số chữ số làm tròn sau dấu phẩy:</label>
                    <input
                      type="number"
                      min="0"
                      max="4"
                      value={newQuestion.roundingDecimals ?? 2}
                      onChange={(e) =>
                        setNewQuestion({ ...newQuestion, roundingDecimals: parseInt(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-1.5 rounded border border-slate-200 text-slate-800 font-bold bg-slate-50"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Taxonomy & Explanation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-700 block mb-1 font-bold">Mức độ GD&ĐT:</label>
                <select
                  value={newQuestion.taxonomyLevel}
                  onChange={(e) => setNewQuestion({ ...newQuestion, taxonomyLevel: e.target.value as TaxonomyLevel })}
                  className="w-full px-3 py-1.5 rounded border border-slate-200 text-slate-800 bg-white"
                >
                  <option value="Nhận biết">Nhận biết (+{taxonomyWeights['Nhận biết']} pt)</option>
                  <option value="Thông hiểu">Thông hiểu (+{taxonomyWeights['Thông hiểu']} pt)</option>
                  <option value="Vận dụng">Vận dụng (+{taxonomyWeights['Vận dụng']} pt)</option>
                  <option value="Vận dụng cao">Vận dụng cao (+{taxonomyWeights['Vận dụng cao']} pt)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-bold">Lời giải chi tiết:</label>
                <input
                  type="text"
                  value={newQuestion.explanation}
                  onChange={(e) => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
                  placeholder="Giải thích tại sao đáp án này đúng..."
                  className="w-full px-3 py-1.5 rounded border border-slate-200 text-slate-800 bg-white"
                />
              </div>
            </div>

            <button
              onClick={handleSaveNewQuestion}
              className="px-4 py-2 bg-blue-600 text-white rounded font-bold text-xs hover:bg-blue-500 shadow-sm transition-all"
            >
              Lưu Câu Hỏi Vừa Tạo
            </button>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 text-sm font-medium">Chưa có câu hỏi nào khớp với bộ lọc hiện tại.</p>
          </div>
        ) : (
          filteredQuestions.map((q, index) => {
            const qType = q.questionType || 'multiple_choice';
            const isEditing = editingId === q.id;
            const assignedPoints = taxonomyWeights[q.taxonomyLevel] ?? 1;

            const evalRes = calculateQuestionEarnedScore(
              q,
              assignedPoints,
              userAnswers,
              userTfAnswers,
              submittedShortAnswers
            );

            const badgeConfig = questionTypeLabels[qType];

            return (
              <div
                key={q.id}
                className={`bg-white p-5 rounded-xl border transition-all shadow-xs ${
                  isEditing
                    ? 'border-blue-600 ring-1 ring-blue-600/20'
                    : evalRes.isAnswered
                    ? evalRes.isFullyCorrect
                      ? 'border-emerald-300 bg-emerald-50/10'
                      : 'border-amber-300 bg-amber-50/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Card Header */}
                {(() => {
                  const normTax = normalizeTaxonomyLevel(q.taxonomyLevel);
                  const normDiff = normalizeDifficultyLevel(q.difficulty);
                  return (
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="font-bold text-slate-900 text-sm">Câu {index + 1}:</span>
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${
                            taxonomyColors[normTax] || 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {normTax}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${badgeConfig.badgeColor}`}>
                          {badgeConfig.label}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-extrabold border border-amber-200">
                          +{assignedPoints} điểm
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold border border-slate-200">
                          {normDiff}
                        </span>
                        {q.topic && (
                          <span className="text-xs text-slate-400 italic max-w-[280px] sm:max-w-md truncate inline-block align-middle" title={q.topic}>
                            Chủ đề: {cleanTopicText(q.topic)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          onClick={() => setEditingId(isEditing ? null : q.id)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100 transition-colors"
                          title="Chỉnh sửa câu hỏi"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(q.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100 transition-colors"
                          title="Xóa câu hỏi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Question Text */}
                {isEditing ? (
                  <div className="mb-3">
                    <label className="text-xs font-bold text-slate-700 block mb-1">Nội dung câu hỏi:</label>
                    <textarea
                      value={q.question}
                      onChange={(e) => handleFieldChange(q.id, 'question', e.target.value)}
                      rows={2}
                      className="w-full p-2.5 rounded border border-slate-300 text-xs text-slate-800 outline-none focus:border-blue-600"
                    />
                  </div>
                ) : (
                  <p className="text-slate-900 text-sm font-bold leading-relaxed mb-4">
                    <MathText text={cleanQuestionText(q.question)} />
                  </p>
                )}

                {/* --- RENDER QUESTION TYPE 1: MULTIPLE CHOICE --- */}
                {qType === 'multiple_choice' && q.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
                    {q.options.map((optText, optIdx) => {
                      const isCorrect = optIdx === q.correctOption;
                      const selectedOpt = userAnswers[q.id];
                      const isSelected = selectedOpt === optIdx;
                      const isAnswered = selectedOpt !== undefined;

                      let optionStyle =
                        'bg-slate-50 border-slate-200 text-slate-800 hover:border-blue-300 hover:bg-blue-50/40 cursor-pointer';
                      let badgeStyle = 'bg-slate-200 text-slate-700';

                      if (isEditing) {
                        optionStyle = isCorrect
                          ? 'bg-blue-50 border-blue-200 text-blue-900'
                          : 'bg-slate-50 border-slate-200 text-slate-800';
                        badgeStyle = isCorrect ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700';
                      } else if (showAnswerKey || isAnswered) {
                        if (isCorrect) {
                          optionStyle = 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold';
                          badgeStyle = 'bg-emerald-600 text-white';
                        } else if (isSelected) {
                          optionStyle = 'bg-rose-50 border-rose-300 text-rose-950 font-bold';
                          badgeStyle = 'bg-rose-600 text-white';
                        } else {
                          optionStyle = 'bg-slate-50 border-slate-200 text-slate-600 opacity-70';
                        }
                      }

                      return (
                        <div
                          key={optIdx}
                          onClick={() => handleSelectOption(q.id, optIdx)}
                          className={`flex items-center justify-between p-3 rounded border text-xs font-semibold transition-all select-none ${optionStyle}`}
                        >
                          <div className="flex items-center space-x-2.5 w-full mr-2">
                            <span
                              className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs shrink-0 ${badgeStyle}`}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </span>

                            {isEditing ? (
                              <input
                                type="text"
                                value={optText}
                                onChange={(e) => {
                                  const opts = [...q.options!] as [string, string, string, string];
                                  opts[optIdx] = e.target.value;
                                  handleFieldChange(q.id, 'options', opts);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full px-2 py-1 rounded border border-slate-300 text-xs bg-white text-slate-900"
                              />
                            ) : (
                              <MathText text={cleanOptionText(optText)} />
                            )}
                          </div>

                          {isEditing && (
                            <input
                              type="radio"
                              name={`correct_${q.id}`}
                              checked={isCorrect}
                              onChange={() => handleFieldChange(q.id, 'correctOption', optIdx)}
                              onClick={(e) => e.stopPropagation()}
                              className="accent-blue-600 shrink-0"
                            />
                          )}

                          {!isEditing && (showAnswerKey || isAnswered) && isCorrect && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}

                          {!isEditing && (showAnswerKey || isAnswered) && isSelected && !isCorrect && (
                            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* --- RENDER QUESTION TYPE 2: TRUE / FALSE (GD&ĐT PART II) --- */}
                {qType === 'true_false' && (() => {
                  const activeStmts = sanitizeTrueFalseStatements(q);
                  return (
                    <div className="space-y-2 mb-3 bg-slate-50/80 p-3.5 rounded-lg border border-slate-200">
                      <span className="text-xs font-extrabold text-slate-700 block mb-2">
                        Chọn Đúng hoặc Sai cho mỗi phát biểu sau (Thang điểm GD&ĐT: Đúng 1/4 ý = 10%, 2/4 ý = 25%, 3/4 ý =
                        50%, 4/4 ý = 100%):
                      </span>

                      {activeStmts.map((st, sIdx) => {
                        const userTfMap = userTfAnswers[q.id] || {};
                        const userChoice = userTfMap[st.id]; // boolean | undefined
                        const isAnswered = userChoice !== undefined;
                        const isChoiceCorrect = isAnswered && userChoice === st.isCorrect;

                        return (
                          <div
                            key={st.id || sIdx}
                            className={`p-2.5 rounded border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-semibold ${
                              isAnswered
                                ? isChoiceCorrect
                                  ? 'bg-emerald-50/60 border-emerald-200'
                                  : 'bg-rose-50/60 border-rose-200'
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <div className="flex-1 pr-2">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={st.statement}
                                  onChange={(e) => {
                                    const updated = [...activeStmts];
                                    updated[sIdx] = { ...updated[sIdx], statement: e.target.value };
                                    handleFieldChange(q.id, 'tfStatements', updated);
                                  }}
                                  className="w-full px-2 py-1 rounded border border-slate-300 text-xs bg-white"
                                />
                              ) : (
                                <MathText text={st.statement} className="text-slate-800" />
                              )}
                            </div>

                            <div className="flex items-center space-x-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  if (isEditing) {
                                    const updated = [...activeStmts];
                                    updated[sIdx] = { ...updated[sIdx], isCorrect: true };
                                    handleFieldChange(q.id, 'tfStatements', updated);
                                  } else {
                                    handleToggleTfStatement(q.id, st.id, true);
                                  }
                                }}
                                className={`px-3 py-1 rounded text-xs font-extrabold border transition-all ${
                                  isEditing
                                    ? st.isCorrect
                                      ? 'bg-emerald-600 text-white border-emerald-600'
                                      : 'bg-slate-100 text-slate-600 border-slate-200'
                                    : userChoice === true
                                    ? st.isCorrect || showAnswerKey
                                      ? 'bg-emerald-600 text-white border-emerald-600'
                                      : 'bg-rose-600 text-white border-rose-600'
                                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                              >
                                Đúng
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (isEditing) {
                                    const updated = [...activeStmts];
                                    updated[sIdx] = { ...updated[sIdx], isCorrect: false };
                                    handleFieldChange(q.id, 'tfStatements', updated);
                                  } else {
                                    handleToggleTfStatement(q.id, st.id, false);
                                  }
                                }}
                                className={`px-3 py-1 rounded text-xs font-extrabold border transition-all ${
                                  isEditing
                                    ? !st.isCorrect
                                      ? 'bg-rose-600 text-white border-rose-600'
                                      : 'bg-slate-100 text-slate-600 border-slate-200'
                                    : userChoice === false
                                    ? !st.isCorrect || showAnswerKey
                                      ? 'bg-emerald-600 text-white border-emerald-600'
                                      : 'bg-rose-600 text-white border-rose-600'
                                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                              >
                                Sai
                              </button>

                              {showAnswerKey && (
                                <span
                                  className={`ml-2 px-2 py-0.5 rounded text-[10px] font-bold ${
                                    st.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {st.isCorrect ? 'Đáp án: ĐÚNG' : 'Đáp án: SAI'}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* True/False GD&ĐT Partial Credit Status */}
                      {(() => {
                        const userTfMap = userTfAnswers[q.id] || {};
                        const tfResult = evaluateTrueFalseQuestion(activeStmts, userTfMap);
                        if (tfResult.totalCount === 0) return null;

                        return (
                          <div className="pt-2 text-xs font-semibold flex items-center justify-between text-slate-600">
                            <span>
                              Kết quả chọn: <strong className="text-slate-900">{tfResult.correctCount}/{tfResult.totalCount}</strong> ý đúng.
                            </span>
                            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-bold">
                              Điểm đạt: {Math.round(tfResult.gddtPointsFraction * assignedPoints * 100) / 100} / {assignedPoints} pt
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })()}

                {/* --- RENDER QUESTION TYPE 3: SHORT ANSWER --- */}
                {qType === 'short_answer' && (
                  <div className="space-y-3 mb-3 bg-purple-50/50 p-4 rounded-lg border border-purple-200">
                    {/* Math / Rounding Note */}
                    {(q.mathRoundingNote || isEditing) && (
                      <div className="text-xs text-purple-900 bg-purple-100/70 p-2.5 rounded border border-purple-200 font-semibold flex items-center space-x-2">
                        <Calculator className="w-4 h-4 shrink-0 text-purple-700" />
                        {isEditing ? (
                          <input
                            type="text"
                            value={q.mathRoundingNote || ''}
                            onChange={(e) => handleFieldChange(q.id, 'mathRoundingNote', e.target.value)}
                            placeholder="Ghi chú làm tròn & quy ước số π..."
                            className="w-full px-2 py-1 rounded border border-purple-300 text-xs bg-white"
                          />
                        ) : (
                          <span>📌 {q.mathRoundingNote}</span>
                        )}
                      </div>
                    )}

                    {/* Input Field */}
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={userShortAnswers[q.id] || ''}
                        onChange={(e) => handleShortAnswerChange(q.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCheckShortAnswer(q.id);
                          }
                        }}
                        placeholder="Nhập câu trả lời/kết quả tính toán của bạn tại đây..."
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 bg-white focus:border-purple-600 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleCheckShortAnswer(q.id)}
                        disabled={!userShortAnswers[q.id]?.trim()}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                      >
                        Kiểm Tra
                      </button>
                    </div>

                    {/* Short Answer Edit Details for Teacher */}
                    {isEditing && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-purple-200">
                        <div>
                          <label className="text-[11px] font-bold text-purple-900 block">Đáp án chuẩn:</label>
                          <input
                            type="text"
                            value={q.shortAnswer || ''}
                            onChange={(e) => handleFieldChange(q.id, 'shortAnswer', e.target.value)}
                            className="w-full px-2 py-1 rounded border border-purple-300 text-xs bg-white font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-purple-900 block">Biến thể chấp nhận (phân cách dấu phẩy):</label>
                          <input
                            type="text"
                            value={(q.acceptableAnswers || []).join(', ')}
                            onChange={(e) =>
                              handleFieldChange(
                                q.id,
                                'acceptableAnswers',
                                e.target.value.split(',').map((s) => s.trim())
                              )
                            }
                            className="w-full px-2 py-1 rounded border border-purple-300 text-xs bg-white"
                          />
                        </div>
                      </div>
                    )}

                    {/* Feedback when submitted or showing answer key */}
                    {(submittedShortAnswers[q.id] !== undefined || showAnswerKey) && !isEditing && (
                      <div
                        className={`p-2.5 rounded border text-xs font-bold flex items-center justify-between ${
                          evaluateShortAnswer(
                            submittedShortAnswers[q.id] !== undefined ? submittedShortAnswers[q.id] : (userShortAnswers[q.id] || ''),
                            q.shortAnswer,
                            q.acceptableAnswers,
                            q.roundingDecimals
                          )
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                            : 'bg-rose-50 border-rose-300 text-rose-900'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          {evaluateShortAnswer(
                            submittedShortAnswers[q.id] !== undefined ? submittedShortAnswers[q.id] : (userShortAnswers[q.id] || ''),
                            q.shortAnswer,
                            q.acceptableAnswers,
                            q.roundingDecimals
                          ) ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-600" />
                          )}
                          <span>
                            {evaluateShortAnswer(
                              submittedShortAnswers[q.id] !== undefined ? submittedShortAnswers[q.id] : (userShortAnswers[q.id] || ''),
                              q.shortAnswer,
                              q.acceptableAnswers,
                              q.roundingDecimals
                            )
                              ? `Chính xác! Bạn nhận đủ +${assignedPoints} điểm.`
                              : `Chưa chính xác. Đáp án đúng chuẩn là: ${q.shortAnswer}`}
                          </span>
                        </div>

                        {q.acceptableAnswers && q.acceptableAnswers.length > 0 && (
                          <span className="text-[11px] font-normal text-slate-600">
                            (Chấp nhận: {q.acceptableAnswers.join(', ')})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Instant Feedback Banner for MCQ */}
                {qType === 'multiple_choice' && userAnswers[q.id] !== undefined && !isEditing && (
                  <div
                    className={`p-3 mb-3 rounded-lg border text-xs font-bold flex items-center justify-between ${
                      userAnswers[q.id] === q.correctOption
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {userAnswers[q.id] === q.correctOption ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <div className="flex items-center space-x-1.5 flex-wrap">
                        <span>
                          {userAnswers[q.id] === q.correctOption
                            ? `Chính xác! Bạn ghi được +${assignedPoints} điểm.`
                            : `Chưa chính xác (0 pt). Đáp án đúng là: ${String.fromCharCode(
                                65 + (q.correctOption ?? 0)
                              )}.`}
                        </span>
                        {userAnswers[q.id] !== q.correctOption && q.options?.[q.correctOption ?? 0] && (
                          <MathText text={cleanOptionText(q.options[q.correctOption ?? 0])} className="font-bold ml-1" />
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Detailed Explanation & Step-by-Step Calculation Guide on Wrong Answer */}
                {evalRes.isAnswered && !evalRes.isFullyCorrect && !isEditing && (
                  <div className="bg-amber-50/90 border border-amber-300 p-3.5 rounded-lg text-xs space-y-2 text-amber-950 mb-3 shadow-2xs">
                    <div className="flex items-center space-x-2 font-bold text-amber-900 border-b border-amber-200/90 pb-2">
                      <Calculator className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>📐 Hướng Dẫn Giải & Cách Làm Bài Tập Tính Toán Từng Bước:</span>
                    </div>
                    <p className="text-[11px] text-amber-800 font-semibold italic">
                      Dưới đây là phương pháp giải và các bước tính toán chi tiết để giúp bạn biết cách làm bài tập này:
                    </p>
                    <div className="bg-white/80 p-3 rounded border border-amber-200/80 text-slate-800 leading-relaxed font-medium whitespace-pre-line">
                      <MathText text={q.explanation} />
                    </div>
                  </div>
                )}

                {/* Detailed Explanation for Answer Key or Fully Correct */}
                {(showAnswerKey || (evalRes.isAnswered && evalRes.isFullyCorrect)) && (
                  <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs text-slate-600 leading-relaxed font-medium">
                    <strong className="text-blue-700 font-bold">Lời giải chi tiết: </strong>
                    {isEditing ? (
                      <input
                        type="text"
                        value={q.explanation}
                        onChange={(e) => handleFieldChange(q.id, 'explanation', e.target.value)}
                        className="w-full mt-1 p-1.5 rounded border border-slate-300 text-xs bg-white"
                      />
                    ) : (
                      <MathText text={q.explanation} />
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
        </>
      )}
    </div>
  );
};
