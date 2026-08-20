import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Sliders,
  UserCheck,
  RefreshCw,
  CheckSquare,
  Square,
  ListOrdered,
  CheckCircle2,
  Calculator,
  School,
  GraduationCap,
  Loader2,
  FileCheck2,
  Award,
  Clock,
  FileBadge,
  ToggleLeft,
  ToggleRight,
  Settings2,
  Zap,
  Filter,
  Scissors,
  AlertCircle,
  Globe,
  Search,
} from 'lucide-react';
import { QuizMatrix, LessonUnit, QuestionType, SchoolLevel, ExamType, ExamModeConfig } from '../types';
import { SAMPLE_LESSONS } from '../data/sampleLessons';
import { THCS_SUBJECTS, THPT_SUBJECTS, getSubjectAssessmentInfo } from '../utils/subjectUtils';

/**
 * Generates official GD&ĐT benchmark exam matrix based on School Level, Grade, Subject, and Exam Type.
 */
export function getDefaultStandardMatrix(
  schoolLevel: SchoolLevel,
  grade: string,
  subject: string,
  examType: ExamType
): QuizMatrix {
  if (examType === 'test_15m') {
    return { nhanBiet: 50, thongHieu: 30, vanDung: 20, vanDungCao: 0 };
  }

  if (examType === 'thpt_national' || (schoolLevel === 'THPT' && grade.includes('12'))) {
    const sj = subject.toLowerCase();
    if (sj.includes('toán') || sj.includes('vật lý') || sj.includes('hóa') || sj.includes('sinh')) {
      return { nhanBiet: 30, thongHieu: 30, vanDung: 25, vanDungCao: 15 };
    }
    if (sj.includes('văn') || sj.includes('sử') || sj.includes('địa') || sj.includes('kinh tế') || sj.includes('gdcd')) {
      return { nhanBiet: 25, thongHieu: 35, vanDung: 25, vanDungCao: 15 };
    }
    if (sj.includes('anh') || sj.includes('tiếng')) {
      return { nhanBiet: 35, thongHieu: 35, vanDung: 20, vanDungCao: 10 };
    }
    return { nhanBiet: 30, thongHieu: 35, vanDung: 25, vanDungCao: 10 };
  }

  if (schoolLevel === 'THCS') {
    const sj = subject.toLowerCase();
    if (grade.includes('9')) {
      if (sj.includes('văn') || sj.includes('sử') || sj.includes('địa')) {
        return { nhanBiet: 30, thongHieu: 40, vanDung: 20, vanDungCao: 10 };
      }
      return { nhanBiet: 35, thongHieu: 35, vanDung: 20, vanDungCao: 10 };
    }
    if (sj.includes('văn') || sj.includes('sử') || sj.includes('địa')) {
      return { nhanBiet: 30, thongHieu: 40, vanDung: 20, vanDungCao: 10 };
    }
    return { nhanBiet: 40, thongHieu: 30, vanDung: 20, vanDungCao: 10 };
  }

  const sj = subject.toLowerCase();
  if (sj.includes('văn') || sj.includes('sử') || sj.includes('địa') || sj.includes('kinh tế') || sj.includes('gdcd')) {
    return { nhanBiet: 30, thongHieu: 40, vanDung: 20, vanDungCao: 10 };
  }
  if (sj.includes('anh') || sj.includes('tin')) {
    return { nhanBiet: 35, thongHieu: 35, vanDung: 20, vanDungCao: 10 };
  }

  return { nhanBiet: 40, thongHieu: 30, vanDung: 20, vanDungCao: 10 };
}

interface InputSectionProps {
  onGenerate: (
    content: string,
    subject: string,
    grade: string,
    questionCount: number,
    matrix: QuizMatrix,
    targetLevel: string,
    customInstructions: string,
    selectedQuestionTypes: QuestionType[],
    schoolLevel: SchoolLevel,
    examModeConfig?: ExamModeConfig
  ) => Promise<void>;
  onLoadSample: (lesson: LessonUnit) => void;
  isLoading: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({
  onGenerate,
  onLoadSample,
  isLoading,
}) => {
  const [content, setContent] = useState('');
  const [schoolLevel, setSchoolLevel] = useState<SchoolLevel>('THPT');
  const [subject, setSubject] = useState('Tin học');
  const [grade, setGrade] = useState('Lớp 12');
  const [questionCount, setQuestionCount] = useState(10);
  const [targetLevel, setTargetLevel] = useState('Tất cả năng lực');
  const [customInstructions, setCustomInstructions] = useState('');

  // Exam Mode Configuration State
  const [examModeEnabled, setExamModeEnabled] = useState(false);
  const [examType, setExamType] = useState<ExamType>('test_45m');
  const [examTitle, setExamTitle] = useState('ĐỀ KIỂM TRA ĐỊNH KỲ GIỮA HỌC KỲ I');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [examCode, setExamCode] = useState('101');
  const [schoolName, setSchoolName] = useState('TRƯỜNG THPT CHUYÊN');
  const [departmentName, setDepartmentName] = useState('SỞ GIÁO DỤC VÀ ĐÀO TẠO');
  
  // Text pruning status state
  const [pruneStatus, setPruneStatus] = useState<string | null>(null);
  const [isPruning, setIsPruning] = useState(false);

  const handleManualPruneText = async () => {
    if (!content || !content.trim()) return;
    setIsPruning(true);
    try {
      const res = await fetch('/api/prune-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        console.error('Non-JSON response for prune-text');
        return;
      }
      const data = await res.json();
      if (data && data.prunedText) {
        setContent(data.prunedText);
        if (data.removedCount > 0) {
          setPruneStatus(`⚡ Đã tự động loại bỏ ${data.removedCount.toLocaleString()} ký tự thông tin thừa/tiêu đề rác. Còn lại ${data.prunedLength.toLocaleString()} ký tự cốt lõi!`);
        } else {
          setPruneStatus(`✨ Nội dung văn bản đã cực kỳ tối ưu & sạch sẽ (${data.prunedLength.toLocaleString()} ký tự).`);
        }
      }
    } catch (err) {
      console.error('Pruning error:', err);
    } finally {
      setIsPruning(false);
    }
  };

  // Apply Exam Presets
  const applyExamPreset = (type: ExamType) => {
    setExamModeEnabled(true);
    setExamType(type);

    if (type === 'test_15m') {
      setExamTitle('ĐỀ KIỂM TRA 15 PHÚT (THƯỜNG XUYÊN)');
      setDurationMinutes(15);
      setQuestionCount(8);
    } else if (type === 'test_45m') {
      setExamTitle('ĐỀ KIỂM TRA ĐỊNH KỲ (1 TIẾT - 45 PHÚT)');
      setDurationMinutes(45);
      setQuestionCount(12);
    } else if (type === 'midterm') {
      setExamTitle('ĐỀ KIỂM TRA GIỮA HỌC KỲ I');
      setDurationMinutes(60);
      setQuestionCount(15);
    } else if (type === 'final') {
      setExamTitle('ĐỀ KIỂM TRA CUỐI HỌC KỲ I');
      setDurationMinutes(90);
      setQuestionCount(20);
    } else if (type === 'thpt_national') {
      setExamTitle('ĐỀ THI THỬ TỐT NGHIỆP THPT QUỐC GIA');
      setDurationMinutes(50);
      setQuestionCount(20);
    }

    // Auto-set tailored GD&ĐT standard matrix
    setMatrix(getDefaultStandardMatrix(schoolLevel, grade, subject, type));
  };

  // Handle School Level Switch (THCS vs THPT)
  const handleSchoolLevelChange = (level: SchoolLevel) => {
    setSchoolLevel(level);
    const newGrade = level === 'THCS' ? 'Lớp 7' : 'Lớp 12';
    const newSubject = level === 'THCS' ? 'Khoa học tự nhiên' : 'Tin học';
    setGrade(newGrade);
    setSubject(newSubject);
    setMatrix(getDefaultStandardMatrix(level, newGrade, newSubject, examType));
  };

  const handleSubjectChange = (newSubject: string) => {
    setSubject(newSubject);
    setMatrix(getDefaultStandardMatrix(schoolLevel, grade, newSubject, examType));
  };

  const handleGradeChange = (newGrade: string) => {
    setGrade(newGrade);
    setMatrix(getDefaultStandardMatrix(schoolLevel, newGrade, subject, examType));
  };

  const handleReloadStandardMatrix = () => {
    setMatrix(getDefaultStandardMatrix(schoolLevel, grade, subject, examType));
  };

  // Selected Question Types (Multiple Choice, True/False, Short Answer)
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<QuestionType[]>([
    'multiple_choice',
    'true_false',
    'short_answer',
  ]);

  // GD&ĐT Taxonomy Matrix
  const [matrix, setMatrix] = useState<QuizMatrix>({
    nhanBiet: 40,
    thongHieu: 30,
    vanDung: 20,
    vanDungCao: 10,
  });

  const handleMatrixChange = (key: keyof QuizMatrix, value: number) => {
    setMatrix((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const toggleQuestionType = (type: QuestionType) => {
    if (selectedQuestionTypes.includes(type)) {
      if (selectedQuestionTypes.length > 1) {
        setSelectedQuestionTypes(selectedQuestionTypes.filter((t) => t !== type));
      }
    } else {
      setSelectedQuestionTypes([...selectedQuestionTypes, type]);
    }
  };



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const examConfig: ExamModeConfig | undefined = examModeEnabled
      ? {
          enabled: true,
          examType,
          examTitle,
          durationMinutes,
          examCode,
          schoolName,
          departmentName,
        }
      : undefined;

    onGenerate(
      content,
      subject,
      grade,
      questionCount,
      matrix,
      targetLevel,
      customInstructions,
      selectedQuestionTypes,
      schoolLevel,
      examConfig
    );
  };

  const matrixSum = matrix.nhanBiet + matrix.thongHieu + matrix.vanDung + matrix.vanDungCao;

  return (
    <div className="space-y-6">
      {/* Intro Pipeline Banner */}
      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                AUTOMATED PEDAGOGICAL PIPELINE • GEMINI API
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Tự Động Hóa Sản Xuất Học Liệu & Trò Chơi Hóa Chiều Sâu
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Dán nội dung bài giảng hoặc câu hỏi đề thi để AI Gemini
              biên soạn ngân hàng câu hỏi chuẩn đề thi GD&ĐT và tạo sơ đồ tư duy chỉ với 1-click.
            </p>

            {/* Live Search & Grounding Badge for SGK GDPT 2018, Vietjack, Violet.vn, Loigiaihay, Hoc247 */}
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold flex-wrap">
                  <Search className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-pulse" />
                  <span className="text-slate-300 font-medium">Cơ sở dữ liệu SGK Mới GDPT 2018:</span>
                  <span className="text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-700/80 text-[11px] font-bold">Kết nối tri thức</span>
                  <span className="text-sky-300 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-700/80 text-[11px] font-bold">Cánh diều</span>
                  <span className="text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-700/80 text-[11px] font-bold">Chân trời sáng tạo</span>
                </div>
                <span className="text-[10px] text-emerald-300 bg-emerald-950/90 border border-emerald-700/80 px-2.5 py-0.5 rounded-full font-bold flex items-center space-x-1">
                  <Globe className="w-3 h-3 text-emerald-400" />
                  <span>Nạp 100% SGK Mới & Đáp án Bộ / Sở GD&ĐT</span>
                </span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-400 text-[11px] flex-wrap">
                <span className="text-slate-300 font-medium">Đối chiếu học liệu:</span>
                <span className="text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60 font-mono text-[10px]">Vietjack</span>
                <span className="text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60 font-mono text-[10px]">Violet.vn</span>
                <span className="text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60 font-mono text-[10px]">Loigiaihay</span>
                <span className="text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60 font-mono text-[10px]">Hoc247</span>
                <span className="text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60 font-mono text-[10px]">Thuvienhoclieu</span>
              </div>
            </div>
          </div>

          {/* Quick Load Sample Presets */}
          <div className="flex flex-col gap-2 shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Bài Giảng Mẫu Chuẩn:
            </span>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_LESSONS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => onLoadSample(sample)}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center space-x-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>{sample.subject} {sample.grade}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Text Input Column */}
        <div className="lg:col-span-2 space-y-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <span className="w-2 h-4 bg-blue-600 rounded-full"></span>
              <span>1. NỘI DUNG BÀI GIẢNG / ĐỀ THI CẦN TẠO</span>
            </h2>
          </div>

          {/* Prune Status Notification Toast */}
          {pruneStatus && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs font-medium flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{pruneStatus}</span>
              </div>
              <button
                type="button"
                onClick={() => setPruneStatus(null)}
                className="text-amber-800 hover:text-amber-950 text-[10px] font-bold underline px-1"
              >
                Đóng
              </button>
            </div>
          )}

          {/* Textarea Zone */}
          <div className="relative rounded-lg">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Dán văn bản bài giảng, đề cương ôn tập, hoặc câu hỏi bài tập vào đây..."
              rows={10}
              className="w-full p-4 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 text-sm leading-relaxed text-slate-800 resize-y font-mono transition-all outline-none"
              required
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 font-medium flex-wrap gap-2 pt-1">
            <div className="flex items-center space-x-3">
              <span>Đã nhập: <strong className="text-slate-700">{content.length.toLocaleString()}</strong> ký tự</span>
              <span>{content ? `~${Math.ceil(content.split(/\s+/).length).toLocaleString()} từ` : 'Trống'}</span>
            </div>

            {content.trim().length > 0 && (
              <button
                type="button"
                onClick={handleManualPruneText}
                disabled={isPruning}
                className="px-2.5 py-1 rounded-md text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                title="Tự động lọc bỏ các tiêu đề đề thi, trang rác, thông tin thí sinh, đường link thừa"
              >
                {isPruning ? (
                  <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                ) : (
                  <Scissors className="w-3 h-3 text-amber-600" />
                )}
                <span>⚡ Tự động loại bỏ nội dung rác (Tiêu đề/Số báo danh/Trang)</span>
              </button>
            )}
          </div>

          {/* Official Exam & Test Mode Integrated Section */}
          <div className="p-4 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50/90 via-purple-50/40 to-blue-50/80 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-xs">
                  <FileBadge className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wide flex items-center space-x-1.5">
                    <span>CHẾ ĐỘ BIÊN SOẠN ĐỀ THI & BÀI KIỂM TRA CHÍNH THỨC</span>
                  </h3>
                  <p className="text-[11px] text-indigo-700 font-medium">
                    Tạo đề thi chuẩn mẫu Bộ GD&ĐT, đầy đủ ma trận, khung tiêu đề, mã đề & hướng dẫn chấm
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setExamModeEnabled(!examModeEnabled)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
                  examModeEnabled
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white border border-indigo-200 text-indigo-800 hover:bg-indigo-100'
                }`}
              >
                {examModeEnabled ? (
                  <>
                    <ToggleRight className="w-4 h-4 text-emerald-300" />
                    <span>Đã bật Chế độ Đề thi</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-4 h-4 text-slate-400" />
                    <span>Bật Chế độ Đề thi</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Exam Presets */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold text-indigo-900/80 uppercase tracking-wider block">
                ⚡ Chọn Mẫu Đề Thi Nhanh (Preset Tự Động Đặt Ma Trận & Thời Gian):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                <button
                  type="button"
                  onClick={() => applyExamPreset('test_15m')}
                  className={`p-2 rounded-lg border text-left transition-all text-xs font-bold ${
                    examModeEnabled && examType === 'test_15m'
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                      : 'bg-white border-indigo-200 text-indigo-900 hover:bg-indigo-100/70'
                  }`}
                >
                  <div className="flex items-center space-x-1 text-[11px]">
                    <Clock className="w-3 h-3" />
                    <span>KT 15 Phút</span>
                  </div>
                  <span className="text-[9px] block opacity-80 mt-0.5 font-normal">8 câu • 15p</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyExamPreset('test_45m')}
                  className={`p-2 rounded-lg border text-left transition-all text-xs font-bold ${
                    examModeEnabled && examType === 'test_45m'
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                      : 'bg-white border-indigo-200 text-indigo-900 hover:bg-indigo-100/70'
                  }`}
                >
                  <div className="flex items-center space-x-1 text-[11px]">
                    <FileCheck2 className="w-3 h-3" />
                    <span>KT 1 Tiết (45p)</span>
                  </div>
                  <span className="text-[9px] block opacity-80 mt-0.5 font-normal">12 câu • 45p</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyExamPreset('midterm')}
                  className={`p-2 rounded-lg border text-left transition-all text-xs font-bold ${
                    examModeEnabled && examType === 'midterm'
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                      : 'bg-white border-indigo-200 text-indigo-900 hover:bg-indigo-100/70'
                  }`}
                >
                  <div className="flex items-center space-x-1 text-[11px]">
                    <Award className="w-3 h-3" />
                    <span>Giữa Kỳ I/II</span>
                  </div>
                  <span className="text-[9px] block opacity-80 mt-0.5 font-normal">15 câu • 60p</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyExamPreset('final')}
                  className={`p-2 rounded-lg border text-left transition-all text-xs font-bold ${
                    examModeEnabled && examType === 'final'
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                      : 'bg-white border-indigo-200 text-indigo-900 hover:bg-indigo-100/70'
                  }`}
                >
                  <div className="flex items-center space-x-1 text-[11px]">
                    <GraduationCap className="w-3 h-3" />
                    <span>Cuối Kỳ I/II</span>
                  </div>
                  <span className="text-[9px] block opacity-80 mt-0.5 font-normal">20 câu • 90p</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyExamPreset('thpt_national')}
                  className={`p-2 rounded-lg border text-left transition-all text-xs font-bold ${
                    examModeEnabled && examType === 'thpt_national'
                      ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                      : 'bg-white border-purple-200 text-purple-900 hover:bg-purple-100/70'
                  }`}
                >
                  <div className="flex items-center space-x-1 text-[11px]">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>Thi THPT QG</span>
                  </div>
                  <span className="text-[9px] block opacity-80 mt-0.5 font-normal">20 câu • 50p</span>
                </button>
              </div>
            </div>

            {/* Expanded Official Header Settings Panel */}
            {examModeEnabled && (
              <div className="p-3.5 bg-white/90 rounded-lg border border-indigo-200 space-y-3 pt-3 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <Settings2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Thông Tin Khung Tiêu Đề Đề Thi Chính Thức:</span>
                  </span>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    Mẫu Chuẩn GD&ĐT
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Tên Bài Thi / Kiểm Tra:</label>
                    <input
                      type="text"
                      value={examTitle}
                      onChange={(e) => setExamTitle(e.target.value)}
                      placeholder="VD: ĐỀ KIỂM TRA GIỮA HỌC KỲ I"
                      className="w-full px-2.5 py-1.5 text-xs font-bold text-indigo-950 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-indigo-600 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Thời Gian (Phút):</label>
                      <input
                        type="number"
                        min="5"
                        max="180"
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 45)}
                        className="w-full px-2.5 py-1.5 text-xs font-bold text-indigo-950 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-indigo-600 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Mã Đề Thi:</label>
                      <input
                        type="text"
                        value={examCode}
                        onChange={(e) => setExamCode(e.target.value)}
                        placeholder="101"
                        className="w-full px-2.5 py-1.5 text-xs font-bold text-indigo-950 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-indigo-600 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Đơn Vị Quản Lý (Sở/Phòng):</label>
                    <input
                      type="text"
                      value={departmentName}
                      onChange={(e) => setDepartmentName(e.target.value)}
                      placeholder="SỞ GIÁO DỤC VÀ ĐÀO TẠO"
                      className="w-full px-2.5 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-indigo-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Tên Trường Học:</label>
                    <input
                      type="text"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="TRƯỜNG THPT CHUYÊN..."
                      className="w-full px-2.5 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-indigo-600 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Custom Prompt Instructions for Teacher */}
          <div className="pt-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
              Ghi chú / Yêu cầu riêng của giáo viên (Tùy chọn):
            </label>
            <input
              type="text"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="Ví dụ: Tập trung vào các thuật ngữ tiếng Anh chuyên ngành, xoáy sâu vào câu hỏi tình huống thực tế..."
              className="w-full px-3.5 py-2 rounded bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-blue-600 outline-none"
            />
          </div>
        </div>

        {/* Configurations Column */}
        <div className="space-y-6">
          {/* Question Types Selector */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2.5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-4 bg-indigo-600 rounded-full"></span>
                <span>2. DẠNG CÂU HỎI MỤC TIÊU</span>
              </div>
              <span className="text-[10px] text-slate-400 font-normal">
                {selectedQuestionTypes.length}/3 dạng được chọn
              </span>
            </h2>

            <div className="space-y-2 pt-1">
              {/* Type 1: Multiple Choice */}
              <button
                type="button"
                onClick={() => toggleQuestionType('multiple_choice')}
                className={`w-full p-3 rounded-lg border text-left transition-all flex items-start space-x-3 ${
                  selectedQuestionTypes.includes('multiple_choice')
                    ? 'bg-indigo-50/80 border-indigo-300 text-indigo-950 font-bold shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {selectedQuestionTypes.includes('multiple_choice') ? (
                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold flex items-center space-x-1.5">
                    <ListOrdered className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Trắc nghiệm 4 lựa chọn</span>
                  </div>
                  <p className="text-[10px] font-medium text-slate-500 mt-0.5">
                    Chọn 1 phương án đúng duy nhất trong A, B, C, D
                  </p>
                </div>
              </button>

              {/* Type 2: True / False */}
              <button
                type="button"
                onClick={() => toggleQuestionType('true_false')}
                className={`w-full p-3 rounded-lg border text-left transition-all flex items-start space-x-3 ${
                  selectedQuestionTypes.includes('true_false')
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {selectedQuestionTypes.includes('true_false') ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Trắc nghiệm Đúng / Sai (4 ý)</span>
                  </div>
                  <p className="text-[10px] font-medium text-slate-500 mt-0.5">
                    Gồm 4 phát biểu a, b, c, d — Chọn Đúng hoặc Sai cho từng phát biểu
                  </p>
                </div>
              </button>

              {/* Type 3: Short Answer */}
              <button
                type="button"
                onClick={() => toggleQuestionType('short_answer')}
                className={`w-full p-3 rounded-lg border text-left transition-all flex items-start space-x-3 ${
                  selectedQuestionTypes.includes('short_answer')
                    ? 'bg-purple-50/80 border-purple-300 text-purple-950 font-bold shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {selectedQuestionTypes.includes('short_answer') ? (
                    <CheckSquare className="w-4 h-4 text-purple-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold flex items-center space-x-1.5">
                    <Calculator className="w-3.5 h-3.5 text-purple-600" />
                    <span>Trả lời ngắn (Toán / Số / Từ)</span>
                  </div>
                  <p className="text-[10px] font-medium text-slate-500 mt-0.5">
                    Điền đáp số / từ ngắn. Tự động áp dụng quy ước π = 3.14
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Metadata & Differentiation Controls */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-4 bg-orange-500 rounded-full"></span>
                <span>3. CẤP HỌC & CẤU HÌNH SƯ PHẠM</span>
              </div>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                schoolLevel === 'THCS' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
              }`}>
                {schoolLevel === 'THCS' ? 'Cấp 2 (THCS)' : 'Cấp 3 (THPT)'}
              </span>
            </h2>

            {/* School Level Selector Toggle */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">
                Chọn Cấp Học Mục TIêu:
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => handleSchoolLevelChange('THCS')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                    schoolLevel === 'THCS'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <School className="w-4 h-4" />
                  <span>Cấp 2 (THCS)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSchoolLevelChange('THPT')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                    schoolLevel === 'THPT'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Cấp 3 (THPT)</span>
                </button>
              </div>

              {/* Dynamic Pedagogy Notice */}
              <div className={`mt-2.5 p-2.5 rounded-lg border text-[11px] font-medium leading-relaxed ${
                schoolLevel === 'THCS'
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                  : 'bg-indigo-50/80 border-indigo-200 text-indigo-900'
              }`}>
                {schoolLevel === 'THCS' ? (
                  <span>
                    ✓ <strong>Đã bật Chế độ THCS:</strong> Tắt quy chuẩn thi THPT QG. Bám sát chương trình phổ thông cơ sở (Lớp 6-9), kiểm tra kiến thức Khoa học tự nhiên & Xã hội vừa sức thiếu niên.
                  </span>
                ) : (
                  <span>
                    ✓ <strong>Đã bật Chế độ THPT:</strong> Bám sát chuẩn ma trận đề thi Tốt nghiệp THPT Bộ GD&ĐT (Lớp 10-12), phát triển tư duy phân tích và vận dụng cao.
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Môn Học (Cấp {schoolLevel === 'THCS' ? '2' : '3'}):</label>
                <select
                  value={subject}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 outline-none"
                >
                  {schoolLevel === 'THCS' ? (
                    THCS_SUBJECTS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))
                  ) : (
                    THPT_SUBJECTS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Khối Lớp:</label>
                <select
                  value={grade}
                  onChange={(e) => handleGradeChange(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 outline-none"
                >
                  {schoolLevel === 'THCS' ? (
                    <>
                      <option value="Lớp 6">Lớp 6 (THCS)</option>
                      <option value="Lớp 7">Lớp 7 (THCS)</option>
                      <option value="Lớp 8">Lớp 8 (THCS)</option>
                      <option value="Lớp 9">Lớp 9 (Ôn thi vào 10)</option>
                    </>
                  ) : (
                    <>
                      <option value="Lớp 12">Lớp 12 (Ôn THPT)</option>
                      <option value="Lớp 11">Lớp 11</option>
                      <option value="Lớp 10">Lớp 10</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* GD&ĐT Official Assessment Method Info Card */}
            {(() => {
              const assessmentInfo = getSubjectAssessmentInfo(subject, schoolLevel);
              return (
                <div className={`p-3 rounded-lg border text-xs space-y-2 transition-all ${
                  assessmentInfo.isGraded 
                    ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950' 
                    : 'bg-amber-50/80 border-amber-300 text-amber-950 shadow-2xs'
                }`}>
                  <div className="flex items-center justify-between flex-wrap gap-1 border-b border-indigo-200/50 pb-1.5">
                    <span className="font-bold text-[11px] uppercase tracking-wider flex items-center space-x-1.5">
                      <FileBadge className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>{assessmentInfo.statusTitle}</span>
                    </span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${assessmentInfo.badgeBg} ${assessmentInfo.badgeText} ${assessmentInfo.badgeBorder}`}>
                      Có KT Định Kỳ 15p/45p/Thi
                    </span>
                  </div>

                  <p className="text-[11px] leading-relaxed opacity-90 font-medium">
                    {assessmentInfo.regulationInfo}
                  </p>

                  <div className="space-y-1 pt-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                      📌 Phương án kiểm tra & đánh giá ứng với môn {subject}:
                    </span>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
                      {assessmentInfo.testingOptions.map((opt, idx) => (
                        <li key={idx} className="flex items-center space-x-1.5 font-medium">
                          <CheckCircle2 className={`w-3 h-3 shrink-0 ${assessmentInfo.isGraded ? 'text-indigo-600' : 'text-amber-600'}`} />
                          <span>{opt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-1 text-[10px] italic border-t border-indigo-200/40 text-slate-600">
                    💡 <strong>Sư phạm AI:</strong> {assessmentInfo.pedagogicalGuidance}
                  </div>
                </div>
              );
            })()}

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Số lượng câu hỏi:
                </label>
                <span className="text-xs font-bold text-blue-600">{questionCount} câu</span>
              </div>
              <input
                type="range"
                min="5"
                max="20"
                step="1"
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Phân Hóa Năng Lực Học Sinh:
              </label>
              <select
                value={targetLevel}
                onChange={(e) => setTargetLevel(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs font-semibold text-slate-800"
              >
                <option value="Tất cả năng lực">Tất cả năng lực (Đầy đủ 4 cấp độ)</option>
                <option value="Học sinh Cần Bổ Trợ">Học sinh Cần Bổ Trợ (Dễ/Nhận biết & Thông hiểu)</option>
                <option value="Học sinh Rèn Luyện Khá">Học sinh Rèn Luyện Khá (Thông hiểu & Vận dụng)</option>
                <option value="Học sinh Giỏi Nâng Cao">Học sinh Giỏi (Ưu tiên Vận dụng cao & Đột phá)</option>
              </select>
            </div>
          </div>

          {/* GD&ĐT Matrix Percentages */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
              <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <span className="w-2 h-4 bg-emerald-500 rounded-full"></span>
                <span>4. MA TRẬN ĐỀ THI (%)</span>
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleReloadStandardMatrix}
                  className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-all flex items-center space-x-1 cursor-pointer"
                  title="Khôi phục ma trận chuẩn GD&ĐT theo Môn & Lớp hiện tại"
                >
                  <RefreshCw className="w-3 h-3 text-emerald-600" />
                  <span>Nạp Ma Trận Chuẩn GD&ĐT</span>
                </button>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${matrixSum === 100 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                  TỔNG: {matrixSum}%
                </span>
              </div>
            </div>

            {/* Standard Matrix Info Banner */}
            <div className={`p-2.5 rounded-lg border text-xs font-bold flex items-center space-x-2 ${
              matrixSum === 100 
                ? 'bg-amber-50/90 border-amber-300 text-amber-950 shadow-2xs' 
                : 'bg-red-50 border-red-300 text-red-900 animate-pulse shadow-2xs'
            }`}>
              <AlertCircle className={`w-4 h-4 shrink-0 ${matrixSum === 100 ? 'text-amber-600' : 'text-red-600'}`} />
              <span>📌 Chú ý: Hãy điều chỉnh tất cả 4 cấp độ (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao) sao cho tổng đạt đủ 100%.</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-700 text-[11px]">
                <span className="flex items-center space-x-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Ma Trận Khung Chuẩn GD&ĐT:</span>
                </span>
                <span className="text-indigo-700 font-extrabold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {subject} • {grade} • {schoolLevel}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                Hệ thống đã tự động gán tỉ lệ theo chuẩn Bộ GD&ĐT cho môn <strong>{subject} ({grade})</strong>. Học sinh & giáo viên có thể tùy chỉnh các thanh trượt bên dưới theo nhu cầu kiểm tra.
              </p>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                <span className="text-[10px] font-bold text-slate-400">Mẫu ma trận:</span>
                <button
                  type="button"
                  onClick={() => setMatrix({ nhanBiet: 40, thongHieu: 30, vanDung: 20, vanDungCao: 10 })}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-200 hover:border-blue-400 text-slate-700 transition-colors"
                >
                  Chuẩn 4:3:2:1 (40-30-20-10)
                </button>
                <button
                  type="button"
                  onClick={() => setMatrix({ nhanBiet: 30, thongHieu: 30, vanDung: 25, vanDungCao: 15 })}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-200 hover:border-purple-400 text-purple-800 transition-colors"
                >
                  Phân hóa THPT QG (30-30-25-15)
                </button>
                <button
                  type="button"
                  onClick={() => setMatrix({ nhanBiet: 30, thongHieu: 40, vanDung: 20, vanDungCao: 10 })}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-200 hover:border-emerald-400 text-emerald-800 transition-colors"
                >
                  Môn Xã hội (30-40-20-10)
                </button>
                <button
                  type="button"
                  onClick={() => setMatrix({ nhanBiet: 50, thongHieu: 30, vanDung: 20, vanDungCao: 0 })}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-200 hover:border-amber-400 text-amber-800 transition-colors"
                >
                  15m (50-30-20-0)
                </button>
              </div>
            </div>

            {/* Realtime Calculated Question Count Distribution Preview */}
            <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-bold">
              <div className="p-2 bg-blue-50 text-blue-900 border border-blue-100 rounded-lg">
                <div className="text-[10px] text-blue-800 uppercase tracking-tight">Nhận biết</div>
                <div className="text-xs text-blue-700 font-extrabold mt-0.5">
                  ~{Math.max(0, Math.round((questionCount * matrix.nhanBiet) / 100))} câu
                </div>
              </div>
              <div className="p-2 bg-emerald-50 text-emerald-900 border border-emerald-100 rounded-lg">
                <div className="text-[10px] text-emerald-800 uppercase tracking-tight">Thông hiểu</div>
                <div className="text-xs text-emerald-700 font-extrabold mt-0.5">
                  ~{Math.max(0, Math.round((questionCount * matrix.thongHieu) / 100))} câu
                </div>
              </div>
              <div className="p-2 bg-orange-50 text-orange-900 border border-orange-100 rounded-lg">
                <div className="text-[10px] text-orange-800 uppercase tracking-tight">Vận dụng</div>
                <div className="text-xs text-orange-700 font-extrabold mt-0.5">
                  ~{Math.max(0, Math.round((questionCount * matrix.vanDung) / 100))} câu
                </div>
              </div>
              <div className="p-2 bg-red-50 text-red-900 border border-red-100 rounded-lg">
                <div className="text-[10px] text-red-800 uppercase tracking-tight">Vận dụng cao</div>
                <div className="text-xs text-red-700 font-extrabold mt-0.5">
                  ~{Math.max(0, Math.round((questionCount * matrix.vanDungCao) / 100))} câu
                </div>
              </div>
            </div>

            {/* Editable Sliders */}
            <div className="space-y-3 text-xs font-semibold pt-1">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-600">Nhận biết (Recall):</span>
                  <span className="text-blue-600 font-bold">{matrix.nhanBiet}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={matrix.nhanBiet}
                  onChange={(e) => handleMatrixChange('nhanBiet', parseInt(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-600">Thông hiểu (Understand):</span>
                  <span className="text-emerald-600 font-bold">{matrix.thongHieu}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={matrix.thongHieu}
                  onChange={(e) => handleMatrixChange('thongHieu', parseInt(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-600">Vận dụng (Apply):</span>
                  <span className="text-orange-600 font-bold">{matrix.vanDung}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={matrix.vanDung}
                  onChange={(e) => handleMatrixChange('vanDung', parseInt(e.target.value))}
                  className="w-full accent-orange-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-600">Vận dụng cao (Analyze):</span>
                  <span className="text-red-600 font-bold">{matrix.vanDungCao}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={matrix.vanDungCao}
                  onChange={(e) => handleMatrixChange('vanDungCao', parseInt(e.target.value))}
                  className="w-full accent-red-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Matrix & Option Matching Notice & Submit Action Button */}
            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 bg-amber-50/80 px-3 py-1.5 rounded-lg border border-amber-200/70">
                <span className="flex items-center space-x-1.5 text-amber-800">
                  <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
                  <span>Chú ý: Điều chỉnh các mục và tùy chọn để khớp với nhau</span>
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-extrabold shrink-0">
                  Tự động đồng bộ
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading || !content.trim()}
                className="w-full py-3.5 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-blue-900/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Đang Biên Soạn Bài Tập Siêu Tốc...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-white text-white" />
                    <span>TẠO BÀI TẬP & NGÂN HÀNG CÂU HỎI SIÊU TỐC</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
