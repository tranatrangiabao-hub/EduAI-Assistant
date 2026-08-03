import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Target, Zap, Award, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { Question } from '../../types';
import { evaluateShortAnswer, evaluateTrueFalseQuestion, normalizeTaxonomyLevel } from '../../utils/questionEvaluator';
import { MathText } from '../MathRenderer';

interface TargetQuizProps {
  questions: Question[];
  onScoreUpdate: (points: number) => void;
}

export const TargetQuiz: React.FC<TargetQuizProps> = ({ questions, onScoreUpdate }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [shortVal, setShortVal] = useState('');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);

  const currentQ = questions[currentIndex];

  if (!currentQ) return null;

  const qType = currentQ.questionType || 'multiple_choice';

  const handleSelect = (idx: number) => {
    if (showFeedback) return;

    setSelectedIdx(idx);
    setShowFeedback(true);

    if (idx === currentQ.correctOption) {
      const addedPoints = 150 + combo * 30;
      setScore((prev) => prev + addedPoints);
      setCombo((prev) => prev + 1);
      onScoreUpdate(addedPoints);

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } else {
      setCombo(0);
    }
  };

  const handleShortSubmit = () => {
    if (showFeedback || !shortVal.trim()) return;
    setShowFeedback(true);

    const isCorrect = evaluateShortAnswer(
      shortVal,
      currentQ.shortAnswer,
      currentQ.acceptableAnswers,
      currentQ.roundingDecimals
    );

    if (isCorrect) {
      const addedPoints = 150 + combo * 30;
      setScore((prev) => prev + addedPoints);
      setCombo((prev) => prev + 1);
      onScoreUpdate(addedPoints);

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } else {
      setCombo(0);
    }
  };

  const handleNext = () => {
    setShowFeedback(false);
    setSelectedIdx(null);
    setShortVal('');
    setCurrentIndex((prev) => (prev + 1) % questions.length);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-purple-100 text-purple-800">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Trò Chơi: Bắn Mục Tiêu (Arcade Target Pop)
            </h2>
            <p className="text-xs text-slate-500">
              Chọn nhanh mục tiêu đáp án chính xác để kích hoạt Combo phản xạ
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <span className="text-[10px] text-slate-500 font-semibold block uppercase">Combo x:</span>
            <span className="text-lg font-extrabold text-purple-600 flex items-center justify-end">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500 mr-0.5" />
              {combo}x
            </span>
          </div>

          <div className="text-right pl-3 border-l border-slate-200">
            <span className="text-[10px] text-slate-500 font-semibold block uppercase">Điểm Số:</span>
            <span className="text-lg font-extrabold text-emerald-600">{score} pt</span>
          </div>
        </div>
      </div>

      {/* Main Game Stage */}
      <div className="bg-gradient-to-b from-slate-900 to-indigo-950 p-6 sm:p-8 rounded-2xl text-white shadow-xl relative overflow-hidden space-y-6">
        {/* Question Counter */}
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span className="font-semibold bg-white/10 px-3 py-1 rounded-full border border-white/10">
            Câu {currentIndex + 1} / {questions.length}
          </span>
          <span className="text-amber-400 font-medium">[{normalizeTaxonomyLevel(currentQ.taxonomyLevel)}]</span>
        </div>

        {/* Question Title */}
        <div className="text-base sm:text-lg font-bold text-slate-100 leading-relaxed text-center py-2 max-w-2xl mx-auto">
          <MathText text={currentQ.question} />
        </div>

        {/* Target Buttons for MCQ */}
        {qType === 'multiple_choice' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto pt-2">
            {(currentQ.options || ['A', 'B', 'C', 'D']).map((opt, idx) => {
              const isCorrect = idx === currentQ.correctOption;
              const isChosen = idx === selectedIdx;

              let targetStyle = 'bg-white/10 hover:bg-white/20 border-white/20 text-slate-100 hover:scale-[1.02]';
              if (showFeedback) {
                if (isCorrect) {
                  targetStyle =
                    'bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/50 scale-[1.02] font-bold';
                } else if (isChosen && !isCorrect) {
                  targetStyle = 'bg-rose-500 text-white border-rose-400 font-bold';
                } else {
                  targetStyle = 'bg-white/5 text-slate-400 border-transparent opacity-40';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  disabled={showFeedback}
                  className={`p-4 rounded-xl border text-xs sm:text-sm font-semibold transition-all duration-200 text-left flex items-center justify-between ${targetStyle}`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-extrabold text-xs shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <MathText text={opt} />
                  </div>

                  <Target className="w-5 h-5 opacity-40 shrink-0 ml-2" />
                </button>
              );
            })}
          </div>
        )}

        {/* Target Inputs for Short Answer */}
        {qType === 'short_answer' && (
          <div className="max-w-md mx-auto space-y-3 pt-2 text-center">
            {currentQ.mathRoundingNote && (
              <p className="text-xs text-amber-300 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                📌 {currentQ.mathRoundingNote}
              </p>
            )}

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={shortVal}
                onChange={(e) => setShortVal(e.target.value)}
                placeholder="Nhập kết quả/đáp án..."
                disabled={showFeedback}
                className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-sm focus:border-amber-400 outline-none"
              />
              <button
                onClick={handleShortSubmit}
                disabled={showFeedback || !shortVal.trim()}
                className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                Bắn!
              </button>
            </div>
          </div>
        )}

        {/* Target Options for True/False */}
        {qType === 'true_false' && currentQ.tfStatements && (
          <div className="max-w-2xl mx-auto space-y-2 pt-2 text-xs">
            {currentQ.tfStatements.map((st, idx) => (
              <div key={idx} className="p-3 bg-white/10 rounded-xl border border-white/10 flex items-center justify-between">
                <MathText text={st.statement} />
                <span className={`px-2.5 py-1 rounded font-bold text-[11px] ${st.isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'}`}>
                  {st.isCorrect ? 'ĐÚNG' : 'SAI'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Feedback Bar */}
        {showFeedback && (
          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-3xl mx-auto">
            <div className="text-xs text-slate-200">
              <strong className="text-emerald-400">Giải thích: </strong>
              <MathText text={currentQ.explanation} />
            </div>

            <button
              onClick={handleNext}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shrink-0 transition-colors shadow-md"
            >
              Mục Tiêu Tiếp Theo &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
