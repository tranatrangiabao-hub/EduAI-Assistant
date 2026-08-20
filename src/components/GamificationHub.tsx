import React, { useState, useMemo } from 'react';
import { Gamepad2, RotateCw, Target, Layers, Timer, Trophy, Sparkles } from 'lucide-react';
import { Question, ActiveGameMode } from '../types';
import { sanitizeQuestionOptions } from '../utils/questionEvaluator';
import { WheelOfFortune } from './gamification/WheelOfFortune';
import { TargetQuiz } from './gamification/TargetQuiz';
import { FlashcardMode } from './gamification/FlashcardMode';
import { TimedQuizChallenge } from './gamification/TimedQuizChallenge';

interface GamificationHubProps {
  questions: Question[];
  onScoreUpdate: (points: number) => void;
  onExplainQuestion: (question: Question, selectedOption: number) => void;
}

export const GamificationHub: React.FC<GamificationHubProps> = ({
  questions,
  onScoreUpdate,
  onExplainQuestion,
}) => {
  const [activeGame, setActiveGame] = useState<ActiveGameMode>('wheel');

  const sanitizedQuestions = useMemo(() => {
    return (questions || []).map((q) => sanitizeQuestionOptions(q));
  }, [questions]);

  if (!sanitizedQuestions || sanitizedQuestions.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
        <Gamepad2 className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">Chưa có ngân hàng câu hỏi để khởi chạy trò chơi</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Vui lòng nhập bài giảng hoặc tải bài giảng mẫu ở Tab "1. Nhập Bài Giảng" để AI Gemini tạo bộ câu hỏi trò chơi hóa.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Game Mode Selector Tabs */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-2">
        <button
          onClick={() => setActiveGame('wheel')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg font-bold text-xs transition-all ${
            activeGame === 'wheel'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <RotateCw className="w-4 h-4" />
          <span>Vòng Quay May Mắn</span>
        </button>

        <button
          onClick={() => setActiveGame('target')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg font-bold text-xs transition-all ${
            activeGame === 'target'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Bắn Mục Tiêu (Target Pop)</span>
        </button>

        <button
          onClick={() => setActiveGame('flashcard')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg font-bold text-xs transition-all ${
            activeGame === 'flashcard'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Anki Flashcard (Thẻ Ghi Nhớ)</span>
        </button>

        <button
          onClick={() => setActiveGame('quiz_challenge')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg font-bold text-xs transition-all ${
            activeGame === 'quiz_challenge'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <Timer className="w-4 h-4" />
          <span>Đấu Trí Thi Thử (Đếm Ngược)</span>
        </button>
      </div>

      {/* Active Game View */}
      {activeGame === 'wheel' && <WheelOfFortune questions={sanitizedQuestions} onScoreUpdate={onScoreUpdate} />}
      {activeGame === 'target' && <TargetQuiz questions={sanitizedQuestions} onScoreUpdate={onScoreUpdate} />}
      {activeGame === 'flashcard' && <FlashcardMode questions={sanitizedQuestions} />}
      {activeGame === 'quiz_challenge' && (
        <TimedQuizChallenge
          questions={sanitizedQuestions}
          onScoreUpdate={onScoreUpdate}
          onExplainQuestion={onExplainQuestion}
        />
      )}
    </div>
  );
};
