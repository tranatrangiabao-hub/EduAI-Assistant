import React, { useState } from 'react';
import { Layers, RotateCw, CheckCircle2, AlertCircle, Award, Sparkles, Calculator, Check, X } from 'lucide-react';
import { Question } from '../../types';
import { MathText } from '../MathRenderer';
import { normalizeTaxonomyLevel } from '../../utils/questionEvaluator';

interface FlashcardModeProps {
  questions: Question[];
}

export const FlashcardMode: React.FC<FlashcardModeProps> = ({ questions }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCount, setMasteredCount] = useState<number[]>([]);

  const currentQ = questions[currentIndex];

  if (!currentQ) return null;

  const qType = currentQ.questionType || 'multiple_choice';

  const handleRating = (difficulty: 'hard' | 'medium' | 'easy') => {
    if (difficulty === 'easy' && !masteredCount.includes(currentIndex)) {
      setMasteredCount([...masteredCount, currentIndex]);
    }

    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % questions.length);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-cyan-100 text-cyan-800">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Bộ Thẻ Ghi Nhớ (Anki Flashcards & Spaced Repetition)
            </h2>
            <p className="text-xs text-slate-500">
              Lật thẻ học nhanh, tự đánh giá mức độ ghi nhớ để ôn tập ngắt quãng hiệu quả
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="text-right">
          <span className="text-[10px] text-slate-500 font-semibold block uppercase">Đã Thuộc:</span>
          <span className="text-sm font-extrabold text-emerald-600">
            {masteredCount.length} / {questions.length} Thẻ
          </span>
        </div>
      </div>

      {/* Main Flashcard Flip Area */}
      <div className="max-w-2xl mx-auto space-y-4">
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className={`cursor-pointer min-h-[300px] p-8 rounded-2xl border-2 transition-all duration-300 transform flex flex-col justify-between shadow-md relative ${
            isFlipped
              ? 'bg-gradient-to-br from-emerald-900 to-teal-950 text-white border-emerald-500'
              : 'bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100 border-slate-700 hover:border-slate-500'
          }`}
        >
          {/* Card Top Indicator */}
          <div className="flex items-center justify-between text-xs opacity-75">
            <span className="font-semibold bg-white/10 px-3 py-1 rounded-full">
              Thẻ {currentIndex + 1} / {questions.length}
            </span>

            <span className="flex items-center space-x-1 font-medium">
              <RotateCw className="w-3.5 h-3.5" />
              <span>{isFlipped ? 'Mặt Sau: Đáp Án' : 'Mặt Trước: Câu Hỏi (Bấm để lật)'}</span>
            </span>
          </div>

          {/* Card Content */}
          <div className="my-6 text-center space-y-4">
            {!isFlipped ? (
              <>
                <div className="flex items-center justify-center space-x-2">
                  <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    [{normalizeTaxonomyLevel(currentQ.taxonomyLevel)}]
                  </span>
                  <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {qType === 'multiple_choice'
                      ? 'Trắc nghiệm'
                      : qType === 'true_false'
                      ? 'Đúng / Sai'
                      : 'Trả lời ngắn'}
                  </span>
                </div>

                <div className="text-base sm:text-lg font-bold leading-relaxed">
                  <MathText text={currentQ.question} />
                </div>

                {/* Multiple choice preview */}
                {qType === 'multiple_choice' && currentQ.options && (
                  <div className="grid grid-cols-2 gap-2 max-w-md mx-auto text-xs opacity-80 pt-2 text-left">
                    {currentQ.options.map((opt, i) => (
                      <div key={i} className="truncate">
                        <strong>{String.fromCharCode(65 + i)}.</strong> <MathText text={opt} />
                      </div>
                    ))}
                  </div>
                )}

                {/* True/False preview */}
                {qType === 'true_false' && currentQ.tfStatements && (
                  <div className="space-y-1.5 max-w-md mx-auto text-xs opacity-90 pt-2 text-left bg-white/5 p-3 rounded-lg border border-white/10">
                    {currentQ.tfStatements.map((st, i) => (
                      <div key={i} className="text-slate-200">
                        • <MathText text={st.statement} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Short answer math note preview */}
                {qType === 'short_answer' && currentQ.mathRoundingNote && (
                  <div className="text-xs text-amber-300 bg-amber-500/10 p-2 rounded max-w-md mx-auto border border-amber-500/20">
                    📌 {currentQ.mathRoundingNote}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">Đáp Án Đúng:</div>

                {qType === 'multiple_choice' && currentQ.options && (
                  <div className="text-xl sm:text-2xl font-extrabold text-emerald-300">
                    {String.fromCharCode(65 + (currentQ.correctOption ?? 0))}.{' '}
                    <MathText text={currentQ.options[currentQ.correctOption ?? 0]} />
                  </div>
                )}

                {qType === 'true_false' && currentQ.tfStatements && (
                  <div className="space-y-1.5 text-xs text-left max-w-md mx-auto bg-black/20 p-3 rounded-lg border border-emerald-500/30">
                    {currentQ.tfStatements.map((st, i) => (
                      <div key={i} className="flex items-center justify-between font-semibold">
                        <MathText text={st.statement} />
                        <span
                          className={`ml-2 px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                            st.isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                          }`}
                        >
                          {st.isCorrect ? 'ĐÚNG' : 'SAI'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {qType === 'short_answer' && (
                  <div className="space-y-1">
                    <div className="text-2xl font-mono font-extrabold text-amber-300">
                      <MathText text={currentQ.shortAnswer || ''} />
                    </div>
                    {currentQ.acceptableAnswers && currentQ.acceptableAnswers.length > 0 && (
                      <div className="text-xs text-slate-300">
                        (Các biến thể: {currentQ.acceptableAnswers.join(', ')})
                      </div>
                    )}
                  </div>
                )}

                <div className="text-xs text-slate-200 max-w-lg mx-auto leading-relaxed pt-2">
                  <strong>Giải thích: </strong>
                  <MathText text={currentQ.explanation} />
                </div>
              </>
            )}
          </div>

          {/* Card Footer */}
          <div className="text-center text-[11px] opacity-60">
            {isFlipped ? 'Đánh giá mức độ nhớ bên dưới để chuyển thẻ tiếp theo' : 'Bấm vào bất kỳ đâu trên thẻ để xem đáp án'}
          </div>
        </div>

        {/* Evaluation Buttons (Anki style) */}
        {isFlipped && (
          <div className="grid grid-cols-3 gap-3 pt-2">
            <button
              onClick={() => handleRating('hard')}
              className="py-3 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-xs transition-colors flex flex-col items-center"
            >
              <span>Chưa Thuộc (Khó)</span>
              <span className="text-[10px] font-normal text-rose-600">Ôn lại ngay</span>
            </button>

            <button
              onClick={() => handleRating('medium')}
              className="py-3 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs transition-colors flex flex-col items-center"
            >
              <span>Tạm Nhớ (Vừa)</span>
              <span className="text-[10px] font-normal text-amber-600">Ôn lại sau</span>
            </button>

            <button
              onClick={() => handleRating('easy')}
              className="py-3 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs transition-colors flex flex-col items-center"
            >
              <span>Đã Thuộc Vững (Dễ)</span>
              <span className="text-[10px] font-normal text-emerald-600">Đã thành thục</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
