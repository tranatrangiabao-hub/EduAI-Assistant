import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Timer, Trophy, CheckCircle2, XCircle, HelpCircle, RefreshCw, Sparkles, Award } from 'lucide-react';
import { Question } from '../../types';
import { MathText } from '../MathRenderer';
import { normalizeTaxonomyLevel } from '../../utils/questionEvaluator';

interface TimedQuizChallengeProps {
  questions: Question[];
  onScoreUpdate: (points: number) => void;
  onExplainQuestion: (question: Question, selectedOption: number) => void;
}

export const TimedQuizChallenge: React.FC<TimedQuizChallengeProps> = ({
  questions,
  onScoreUpdate,
  onExplainQuestion,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(questions.length * 45); // 45s per q
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (isCompleted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isCompleted, timeLeft]);

  const currentQ = questions[currentIndex];

  const handleSelectOption = (optIdx: number) => {
    if (isCompleted) return;

    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: optIdx,
    }));
  };

  const handleFinish = () => {
    setIsCompleted(true);

    // Calculate score
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctOption) {
        correctCount++;
      }
    });

    const finalPoints = correctCount * 100;
    setScore(finalPoints);
    onScoreUpdate(finalPoints);

    if (correctCount / questions.length >= 0.7) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!currentQ) return null;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
            <Timer className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Đấu Trí Thi Thử Thách Thời Gian (Exam Simulation)
            </h2>
            <p className="text-xs text-slate-500">
              Mô phỏng áp lực phòng thi Tốt nghiệp THPT thực tế có đếm ngược thời gian
            </p>
          </div>
        </div>

        {!isCompleted && (
          <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-slate-900 text-white font-mono font-bold text-sm">
            <Timer className="w-4 h-4 text-amber-400" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        )}
      </div>

      {!isCompleted ? (
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>

          {/* Question Box */}
          <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                Câu {currentIndex + 1} / {questions.length}
              </span>
              <span className="font-semibold text-slate-700">[{normalizeTaxonomyLevel(currentQ.taxonomyLevel)}]</span>
            </div>

            <div className="text-base font-bold text-slate-900 leading-relaxed">
              <MathText text={currentQ.question} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedAnswers[currentIndex] === idx;

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    className={`p-3.5 rounded-xl border text-xs font-semibold text-left transition-all flex items-center space-x-3 ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-md'
                        : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected ? 'bg-white text-emerald-700' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <MathText text={opt} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nav Controls */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-xs font-bold text-slate-700"
            >
              &larr; Câu Trước
            </button>

            {currentIndex === questions.length - 1 ? (
              <button
                onClick={handleFinish}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition-all"
              >
                Nộp Bài Hoàn Thành
              </button>
            ) : (
              <button
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
              >
                Câu Tiếp theo &rarr;
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Summary & Review Report */
        <div className="space-y-6">
          <div className="text-center p-8 bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl text-white space-y-3">
            <Award className="w-12 h-12 text-amber-400 mx-auto" />
            <h3 className="text-2xl font-black">KẾT QUẢ BÀI THI MÔ PHỎNG</h3>
            <p className="text-3xl font-extrabold text-emerald-400">
              {Object.keys(selectedAnswers).filter((i) => selectedAnswers[parseInt(i)] === questions[parseInt(i)].correctOption).length} / {questions.length} CÂU ĐÚNG
            </p>

            <button
              onClick={() => {
                setIsCompleted(false);
                setSelectedAnswers({});
                setCurrentIndex(0);
                setTimeLeft(questions.length * 45);
              }}
              className="mt-4 px-6 py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-emerald-400 transition-colors"
            >
              Làm Lại Bài Thi Mới
            </button>
          </div>

          {/* Detailed Question Review List */}
          <div className="space-y-4">
            <h4 className="font-bold text-sm text-slate-900">Chi Tiết Từng Câu Hỏi & Hướng Dẫn AI Giải Thích:</h4>

            {questions.map((q, idx) => {
              const userOpt = selectedAnswers[idx];
              const isCorrect = userOpt === q.correctOption;

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border text-xs space-y-2 ${
                    isCorrect ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      Câu {idx + 1}: {q.question}
                    </span>
                    {isCorrect ? (
                      <span className="text-emerald-700 font-bold flex items-center space-x-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Đúng (+100pt)</span>
                      </span>
                    ) : (
                      <span className="text-rose-700 font-bold flex items-center space-x-1">
                        <XCircle className="w-4 h-4" />
                        <span>Chưa đúng</span>
                      </span>
                    )}
                  </div>

                  <p className="text-slate-700">
                    Bạn chọn: <strong>{userOpt !== undefined ? String.fromCharCode(65 + userOpt) : 'Chưa chọn'}</strong> | Đáp án chuẩn: <strong className="text-emerald-700">{String.fromCharCode(65 + q.correctOption)}</strong>
                  </p>

                  <p className="text-slate-600 italic">
                    <strong>Giải thích: </strong>{q.explanation}
                  </p>

                  {!isCorrect && userOpt !== undefined && (
                    <button
                      onClick={() => onExplainQuestion(q, userOpt)}
                      className="px-3 py-1 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-900 text-[11px] font-bold flex items-center space-x-1 mt-1 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Hỏi AI Gia Sư: Tại Sao Chọn {String.fromCharCode(65 + userOpt)} Bị Sai?</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
