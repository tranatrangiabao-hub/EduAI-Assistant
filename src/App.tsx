import React, { useState } from 'react';
import { Header } from './components/Header';
import { InputSection } from './components/InputSection';
import { QuestionBankEditor } from './components/QuestionBankEditor';
import { GamificationHub } from './components/GamificationHub';
import { SummaryAndMindmap } from './components/SummaryAndMindmap';
import { MatrixChart } from './components/MatrixChart';
import { HistorySection } from './components/HistorySection';
import { SettingsModal } from './components/SettingsModal';
import { ExportModal } from './components/ExportModal';
import { ProposalInfoModal } from './components/ProposalInfoModal';
import { SAMPLE_LESSONS } from './data/sampleLessons';
import { ActiveTab, LessonUnit, Question, QuestionType, QuizMatrix, SchoolLevel, HistoryItem, ExamModeConfig } from './types';
import { sanitizeQuestionOptions } from './utils/questionEvaluator';
import { Language, translations } from './i18n/translations';
import { Sparkles, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('input');
  const [currentLesson, setCurrentLesson] = useState<LessonUnit>(SAMPLE_LESSONS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdaptiveLoading, setIsAdaptiveLoading] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [language, setLanguage] = useState<Language>('vi');
  const [totalScore, setTotalScore] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const t = translations[language];

  // Helper to save history item
  const saveToHistory = (lesson: LessonUnit, schoolLevel: SchoolLevel) => {
    try {
      const existingRaw = localStorage.getItem('eduai_history');
      const existing: HistoryItem[] = existingRaw ? JSON.parse(existingRaw) : [];
      
      const newHistoryItem: HistoryItem = {
        id: `history_${Date.now()}`,
        title: lesson.title,
        subject: lesson.subject,
        grade: lesson.grade,
        schoolLevel,
        questionCount: lesson.questions.length,
        createdAt: new Date().toISOString(),
        lesson,
      };

      const updated = [newHistoryItem, ...existing];
      localStorage.setItem('eduai_history', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save history', e);
    }
  };

  const formatFriendlyError = (rawErr: any): string => {
    let msg = typeof rawErr === 'string' ? rawErr : rawErr?.message || '';
    if (!msg) return 'Đã xảy ra lỗi khi xử lý yêu cầu. Vui lòng thử lại.';

    if (msg.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(msg);
        if (parsed?.error?.message) {
          msg = parsed.error.message;
        } else if (parsed?.message) {
          msg = parsed.message;
        }
      } catch (_) {}
    }

    const msgLower = msg.toLowerCase();
    if (
      msgLower.includes('429') ||
      msgLower.includes('resource_exhausted') ||
      msgLower.includes('quota exceeded') ||
      msgLower.includes('rate limit')
    ) {
      return 'Hệ thống AI hiện đang tạm thời đạt giới hạn lượt gọi (Rate Limit 429). Vui lòng thử lại sau khoảng 30 giây.';
    }

    if (msgLower.includes('not_found') || msgLower.includes('404') || msgLower.includes('no longer available')) {
      return 'Mô hình AI hiện tại tạm thời chưa phản hồi. Vui lòng thử lại sau ít phút.';
    }

    return msg;
  };

  // Helper for safe API fetching with auto-retry and clear error messaging
  const safeFetchJson = async (url: string, options?: RequestInit, retries = 2): Promise<any> => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(url, options);
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          const rawText = await res.text();
          console.warn(`[Attempt ${attempt + 1}] Non-JSON Response on ${url}:`, rawText.slice(0, 150));
          if (attempt < retries) {
            await new Promise((r) => setTimeout(r, 1500));
            continue;
          }
          throw new Error(`Máy chủ đang khởi động lại hoặc không thể phản hồi đúng định dạng JSON. Vui lòng thử lại sau vài giây.`);
        }
        const data = await res.json();
        if (!res.ok || (data && data.success === false)) {
          throw new Error(data.error || data.warning || `Lỗi máy chủ (${res.status}). Vui lòng thử lại.`);
        }
        return data;
      } catch (err: any) {
        if (attempt < retries && (err.message?.includes('khởi động') || err.message?.includes('fetch'))) {
          await new Promise((r) => setTimeout(r, 1500));
          continue;
        }
        throw err;
      }
    }
  };

  // AI Generation Trigger
  const handleGenerateQuiz = async (
    content: string,
    subject: string,
    grade: string,
    questionCount: number,
    matrix: QuizMatrix,
    targetLevel: string,
    customInstructions: string,
    selectedQuestionTypes: QuestionType[],
    schoolLevel: SchoolLevel = 'THPT',
    examModeConfig?: ExamModeConfig
  ) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await safeFetchJson('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          subject,
          grade,
          questionCount,
          matrix,
          targetLevel,
          customInstructions,
          selectedQuestionTypes,
          schoolLevel,
          examModeConfig,
        }),
      });

      const generated = data.data;

      const newLesson: LessonUnit = {
        id: `lesson_${Date.now()}`,
        title: generated.title || `${subject} ${grade} - Bài học mới`,
        subject,
        grade,
        schoolLevel,
        rawText: content,
        summaryPoints: generated.summaryPoints || [],
        mindmapMermaid: generated.mindmapMermaid || 'mindmap\n  root((Bài học))\n    Ý chính\n    Kiến thức',
        questions: (generated.questions || []).map((q: any) => sanitizeQuestionOptions(q)),
        matrix,
        examModeConfig,
        createdAt: new Date().toISOString(),
      };

      setCurrentLesson(newLesson);
      saveToHistory(newLesson, schoolLevel);
      setActiveTab('question_bank');
    } catch (err: any) {
      console.error('Generation failed:', err);
      setErrorMessage(formatFriendlyError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Adaptive Supplemental Re-level
  const handleAdaptiveRelevel = async (weakTopics: string[]) => {
    setIsAdaptiveLoading(true);
    try {
      const data = await safeFetchJson('/api/adaptive-relevel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: currentLesson.title,
          currentLevel: 'Tự động phân hóa',
          studentScore: 65,
          weakTopics,
        }),
      });

      if (data.success && data.data?.remedialQuestions) {
        const newQuestions: Question[] = data.data.remedialQuestions.map((q: any, idx: number) =>
          sanitizeQuestionOptions({
            ...q,
            id: `remedial_${Date.now()}_${idx}`,
          })
        );

        setCurrentLesson((prev) => ({
          ...prev,
          questions: [...newQuestions, ...prev.questions],
        }));
      }
    } catch (err) {
      console.error('Adaptive error:', err);
    } finally {
      setIsAdaptiveLoading(false);
    }
  };

  // Step-by-step AI explanation modal/alert
  const handleExplainQuestion = async (question: Question, selectedOption: number) => {
    try {
      const data = await safeFetchJson('/api/explain-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.question,
          options: question.options,
          selectedOption,
          correctOption: question.correctOption,
          concept: question.topic || 'Kiến thức bài học',
        }),
      });

      if (data.explanation) {
        alert(`🤖 GIẢI THÍCH CHI TIẾT TỪ AI GIA SƯ:\n\n${data.explanation}`);
      }
    } catch (err) {
      console.error('Explain error:', err);
    }
  };

  const handleUpdateQuestions = (updatedQuestions: Question[]) => {
    setCurrentLesson((prev) => ({
      ...prev,
      questions: updatedQuestions,
    }));
  };

  const handleLoadSample = (sample: LessonUnit) => {
    setCurrentLesson(sample);
    setActiveTab('question_bank');
  };

  return (
    <div className="min-h-screen bg-eduai-mesh text-slate-900 font-sans flex flex-col antialiased selection:bg-blue-600 selection:text-white relative overflow-x-hidden">
      {/* Elaborate Ambient Background Decoration Layers */}
      <div className="fixed inset-0 bg-grid-pattern opacity-60 pointer-events-none z-0" />
      <div className="fixed inset-0 bg-dot-pattern opacity-30 pointer-events-none z-0" />

      {/* Luminous Glow Orbs */}
      <div className="fixed top-[-100px] left-[-100px] w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none z-0 animate-pulse-glow" />
      <div className="fixed top-[20%] right-[-100px] w-[500px] h-[500px] bg-indigo-500/15 rounded-full blur-3xl pointer-events-none z-0 animate-pulse-glow" style={{ animationDelay: '2s' }} />
      <div className="fixed bottom-[-150px] left-[30%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none z-0 animate-pulse-glow" style={{ animationDelay: '4s' }} />

      {/* Floating Translucent Math & Educational AI Symbols */}
      <div className="fixed top-24 left-8 text-blue-400/20 text-3xl font-serif font-bold pointer-events-none select-none z-0 animate-float-slow">
        ∫ f(x)dx
      </div>
      <div className="fixed top-48 right-12 text-indigo-400/20 text-4xl font-serif font-bold pointer-events-none select-none z-0 animate-float-reverse">
        ∑<sub>i=1</sub><sup>n</sup>
      </div>
      <div className="fixed top-[45%] left-12 text-cyan-500/15 text-2xl font-mono font-bold pointer-events-none select-none z-0 animate-float-slow">
        E = mc²
      </div>
      <div className="fixed top-[65%] right-16 text-purple-400/20 text-3xl font-serif font-bold pointer-events-none select-none z-0 animate-float-reverse">
        lim<sub>x→∞</sub>
      </div>
      <div className="fixed bottom-24 left-20 text-emerald-500/20 text-4xl font-bold pointer-events-none select-none z-0 animate-float-slow">
        π ≈ 3.14159
      </div>
      <div className="fixed bottom-36 right-28 text-blue-500/15 text-3xl font-mono font-bold pointer-events-none select-none z-0 animate-float-reverse">
        Δx · Δp ≥ ℏ/2
      </div>

      {/* Header */}
      <div className="relative z-10">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          questionCount={currentLesson.questions.length}
          lessonTitle={currentLesson.title}
          onOpenExport={() => setIsExportOpen(true)}
          onOpenProposalModal={() => setIsProposalModalOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          language={language}
        />
      </div>

      {/* Main Content View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-600 hover:text-rose-900 font-bold ml-4"
            >
              Đóng
            </button>
          </div>
        )}

        {/* Tab 1: Input & Setup */}
        {activeTab === 'input' && (
          <InputSection
            onGenerate={handleGenerateQuiz}
            onLoadSample={handleLoadSample}
            isLoading={isLoading}
          />
        )}

        {/* Tab 2: Question Bank Editor */}
        {activeTab === 'question_bank' && (
          <QuestionBankEditor
            questions={currentLesson.questions}
            onUpdateQuestions={handleUpdateQuestions}
            onAdaptiveRelevel={handleAdaptiveRelevel}
            isAdaptiveLoading={isAdaptiveLoading}
          />
        )}

        {/* Tab 3: Gamification Hub */}
        {activeTab === 'gamification' && (
          <GamificationHub
            questions={currentLesson.questions}
            onScoreUpdate={(added) => setTotalScore((prev) => prev + added)}
            onExplainQuestion={handleExplainQuestion}
          />
        )}

        {/* Tab 4: Mindmap & Summary */}
        {activeTab === 'mindmap' && (
          <SummaryAndMindmap
            title={currentLesson.title}
            summaryPoints={currentLesson.summaryPoints}
            mindmapMermaid={currentLesson.mindmapMermaid}
          />
        )}

        {/* Tab 5: GD&ĐT Matrix Analytics */}
        {activeTab === 'analytics' && (
          <MatrixChart
            questions={currentLesson.questions}
            targetMatrix={currentLesson.matrix}
          />
        )}

        {/* Tab 6: Usage History */}
        {activeTab === 'history' && (
          <HistorySection
            onReloadLesson={handleLoadSample}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-6 text-xs text-center mt-auto relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            &copy; 2026 <strong>{t.appName}</strong> - Google AI Studio & Gemini API Powered
          </p>
          <div className="flex items-center space-x-4 text-slate-500">
            <span>{t.footerStandard}</span>
            <span>Wordwall & Anki Compatible</span>
            <span className="font-semibold text-blue-400">{t.appName}</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        title={currentLesson.title}
        subject={currentLesson.subject}
        questions={currentLesson.questions}
        examModeConfig={currentLesson.examModeConfig}
      />

      <ProposalInfoModal
        isOpen={isProposalModalOpen}
        onClose={() => setIsProposalModalOpen(false)}
      />
    </div>
  );
}
