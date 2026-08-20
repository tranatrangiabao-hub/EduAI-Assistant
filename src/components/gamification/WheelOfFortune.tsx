import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Trophy, RotateCw, CheckCircle2, XCircle, RotateCcw, AlertCircle, Award, Check, Calculator } from 'lucide-react';
import { Question } from '../../types';
import { MathText } from '../MathRenderer';
import { normalizeTaxonomyLevel, normalizeDifficultyLevel } from '../../utils/questionEvaluator';

interface WheelOfFortuneProps {
  questions: Question[];
  onScoreUpdate: (points: number) => void;
}

export const WheelOfFortune: React.FC<WheelOfFortuneProps> = ({ questions, onScoreUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [remainingQuestions, setRemainingQuestions] = useState<Question[]>(questions);
  const [eliminatedIds, setEliminatedIds] = useState<string[]>([]);
  const [autoRemove, setAutoRemove] = useState<boolean>(true);

  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);

  const colors = [
    '#2563eb', '#059669', '#ea580c', '#7c3aed',
    '#db2777', '#d97706', '#0891b2', '#e11d48',
  ];

  const currentRotationRef = useRef(0);

  // Sync remaining questions when prop changes
  useEffect(() => {
    setRemainingQuestions(questions);
    setEliminatedIds([]);
    setSelectedQuestion(null);
    setShowResult(false);
  }, [questions]);

  // Get 1-based original index of question in source list
  const getOriginalIndex = (q: Question) => {
    const idx = questions.findIndex((item) => item.id === q.id);
    return idx !== -1 ? idx + 1 : 1;
  };

  // Draw Wheel on Canvas
  const drawWheel = (rotationAngle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 18;
    const totalSlices = remainingQuestions.length;

    ctx.clearRect(0, 0, size, size);

    if (totalSlices === 0) {
      // Empty wheel message inside canvas
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ĐÃ QUAY HẾT CÂU HỎI', center, center - 10);
      ctx.font = '12px sans-serif';
      ctx.fillText('Nhấn "Khôi phục" để chơi lại', center, center + 12);
      return;
    }

    const sliceAngle = (2 * Math.PI) / totalSlices;

    // Draw outer glowing metallic ring
    ctx.beginPath();
    ctx.arc(center, center, radius + 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#0f172a';
    ctx.fill();

    // Outer rim dots
    const totalDots = 16;
    for (let i = 0; i < totalDots; i++) {
      const dotAngle = (i * 2 * Math.PI) / totalDots;
      const dotX = center + (radius + 4) * Math.cos(dotAngle);
      const dotY = center + (radius + 4) * Math.sin(dotAngle);
      ctx.beginPath();
      ctx.arc(dotX, dotY, 2.5, 0, 2 * Math.PI);
      ctx.fillStyle = i % 2 === 0 ? '#38bdf8' : '#fbbf24';
      ctx.fill();
    }

    // Draw slices
    remainingQuestions.forEach((q, idx) => {
      const start = rotationAngle + idx * sliceAngle;
      const end = start + sliceAngle;
      const origNum = getOriginalIndex(q);

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, start, end);
      ctx.fillStyle = colors[idx % colors.length];
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Text label inside slice
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(start + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Plus Jakarta Sans, sans-serif';
      ctx.fillText(`Câu ${origNum}`, radius - 20, 4);
      ctx.restore();
    });

    // Draw Center Hub
    ctx.beginPath();
    ctx.arc(center, center, 36, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#2563eb';
    ctx.stroke();

    // Center Hub Text
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px Plus Jakarta Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('QUAY', center, center + 4);

    // Draw Top Pointer Needle
    ctx.beginPath();
    ctx.moveTo(center - 12, 6);
    ctx.lineTo(center + 12, 6);
    ctx.lineTo(center, 34);
    ctx.closePath();
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  useEffect(() => {
    drawWheel(currentRotationRef.current);
  }, [remainingQuestions]);

  const handleSpin = () => {
    if (isSpinning || remainingQuestions.length === 0) return;

    // If current question was previously displayed, eliminate it if autoRemove is active and not already eliminated
    if (selectedQuestion && autoRemove && !eliminatedIds.includes(selectedQuestion.id)) {
      setEliminatedIds((prev) => [...prev, selectedQuestion.id]);
      setRemainingQuestions((prev) => prev.filter((q) => q.id !== selectedQuestion.id));
    }

    setIsSpinning(true);
    setSelectedQuestion(null);
    setSelectedOption(null);
    setShowResult(false);

    // Random rotation target (3 to 6 full spins + offset)
    const extraSpins = (3 + Math.random() * 3) * 2 * Math.PI;
    const randomOffset = Math.random() * 2 * Math.PI;
    const targetRotation = currentRotationRef.current + extraSpins + randomOffset;

    const startTime = performance.now();
    const duration = 3200; // ms

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic formula
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentAngle = currentRotationRef.current + (targetRotation - currentRotationRef.current) * easeOut;

      drawWheel(currentAngle);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        currentRotationRef.current = targetRotation % (2 * Math.PI);
        setIsSpinning(false);

        // Calculate landed question
        const total = remainingQuestions.length;
        if (total > 0) {
          const sliceAngle = (2 * Math.PI) / total;
          const normalizedAngle =
            (2 * Math.PI - (currentRotationRef.current % (2 * Math.PI)) - Math.PI / 2) % (2 * Math.PI);
          const positiveAngle = normalizedAngle < 0 ? normalizedAngle + 2 * Math.PI : normalizedAngle;
          const landedIdx = Math.floor(positiveAngle / sliceAngle) % total;

          const landedQ = remainingQuestions[landedIdx];
          setSelectedQuestion(landedQ);
        }
      }
    };

    requestAnimationFrame(animate);
  };

  const handleAnswerSubmit = (optionIndex: number) => {
    if (!selectedQuestion || showResult) return;

    setSelectedOption(optionIndex);
    setShowResult(true);

    if (optionIndex === selectedQuestion.correctOption) {
      const addedPoints = 100 + streak * 20;
      setScore((prev) => prev + addedPoints);
      setStreak((prev) => prev + 1);
      onScoreUpdate(addedPoints);

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } else {
      setStreak(0);
    }

    // Automatically eliminate question from remaining wheel if autoRemove is enabled
    if (autoRemove && selectedQuestion) {
      setEliminatedIds((prev) => (prev.includes(selectedQuestion.id) ? prev : [...prev, selectedQuestion.id]));
      setRemainingQuestions((prev) => prev.filter((q) => q.id !== selectedQuestion.id));
    }
  };

  const handleResetWheel = () => {
    setRemainingQuestions(questions);
    setEliminatedIds([]);
    setSelectedQuestion(null);
    setSelectedOption(null);
    setShowResult(false);
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-600">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Vòng Quay May Mắn (Wheel of Fortune)
              </h2>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase">
                Tự Động Loại Cầu
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Quay ngẫu nhiên câu hỏi. Câu đã trúng sẽ tự động loại bỏ khỏi vòng quay để không bị lặp lại.
            </p>
          </div>
        </div>

        {/* Stats & Controls */}
        <div className="flex items-center space-x-3 flex-wrap gap-y-2">
          <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-right">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Còn Lại:</span>
            <span className="text-sm font-extrabold text-blue-600">
              {remainingQuestions.length}/{questions.length} câu
            </span>
          </div>

          <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-right">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Điểm Số:</span>
            <span className="text-sm font-extrabold text-emerald-600">{score} pt</span>
          </div>

          <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-right">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Chuỗi Thắng:</span>
            <span className="text-sm font-extrabold text-orange-500">🔥 {streak}</span>
          </div>

          <button
            onClick={handleResetWheel}
            className="px-3 py-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 flex items-center space-x-1 transition-colors"
            title="Khôi phục tất cả câu hỏi vào vòng quay"
          >
            <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Khôi Phục Vòng Quay</span>
          </button>
        </div>
      </div>

      {/* Auto-remove mode notification / toggle switch */}
      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs font-semibold">
        <div className="flex items-center space-x-2 text-slate-700">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
          <span>
            Chế độ tự động loại bỏ: <strong className="text-blue-600">BẬT</strong> (Câu hỏi trúng sẽ loại ra khỏi vòng quay)
          </span>
        </div>

        <label className="flex items-center space-x-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoRemove}
            onChange={(e) => setAutoRemove(e.target.checked)}
            className="accent-blue-600 rounded cursor-pointer"
          />
          <span className="text-slate-600 font-bold text-xs">Loại bỏ câu đã quay</span>
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Canvas Wheel Center */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={310}
              height={310}
              className="rounded-full shadow-lg bg-slate-900 border-2 border-slate-800"
            />
          </div>

          <button
            onClick={handleSpin}
            disabled={isSpinning || remainingQuestions.length === 0}
            className="w-52 py-3 px-6 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-md shadow-blue-900/20 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
          >
            <RotateCw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
            <span>{isSpinning ? 'Đang Quay...' : 'QUAY VÒNG MAY MẮN!'}</span>
          </button>
        </div>

        {/* Selected Question / Answer Area */}
        <div className="lg:col-span-7 bg-slate-50 p-6 rounded-xl border border-slate-200 min-h-[320px] flex flex-col justify-center">
          {remainingQuestions.length === 0 && !selectedQuestion ? (
            <div className="text-center py-8 space-y-3">
              <Award className="w-12 h-12 text-amber-500 mx-auto" />
              <h3 className="font-bold text-slate-900 text-base">Chúc mừng! Bạn đã hoàn thành tất cả câu hỏi trên vòng quay!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Tất cả {questions.length} câu hỏi đã được quay và loại bỏ thành công. Bạn đạt được tổng cộng{' '}
                <strong className="text-emerald-600">{score} điểm</strong>.
              </p>
              <button
                onClick={handleResetWheel}
                className="mt-2 px-4 py-2.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all inline-flex items-center space-x-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Nạp Lại Tất Cả Câu Hỏi Để Quay Tiếp</span>
              </button>
            </div>
          ) : !selectedQuestion ? (
            <div className="text-center py-8 space-y-3 text-slate-500">
              <Sparkles className="w-10 h-10 text-blue-600 mx-auto animate-bounce" />
              <p className="font-bold text-slate-800 text-sm">Nhấn "QUAY VÒNG MAY MẮN!" để rút câu hỏi ngẫu nhiên</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Khi quay trúng, câu hỏi sẽ hiển thị tại đây để bạn lựa chọn đáp án. Trả lời đúng sẽ cộng điểm và nâng chuỗi streak!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                  Câu {getOriginalIndex(selectedQuestion)} • [{normalizeTaxonomyLevel(selectedQuestion.taxonomyLevel)}]
                </span>

                <span className="text-xs font-bold text-slate-500">
                  Độ khó: {normalizeDifficultyLevel(selectedQuestion.difficulty)}
                </span>
              </div>

              <div className="font-bold text-slate-900 text-sm leading-relaxed">
                <MathText text={selectedQuestion.question} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {selectedQuestion.options.map((opt, idx) => {
                  const isChosen = selectedOption === idx;
                  const isCorrectOpt = idx === selectedQuestion.correctOption;

                  let btnBg = 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800';
                  if (showResult) {
                    if (isCorrectOpt) {
                      btnBg = 'bg-emerald-600 text-white border-emerald-700 font-bold';
                    } else if (isChosen && !isCorrectOpt) {
                      btnBg = 'bg-rose-600 text-white border-rose-700 font-bold';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswerSubmit(idx)}
                      disabled={showResult}
                      className={`p-3 rounded border text-xs font-semibold text-left transition-all flex items-center justify-between ${btnBg}`}
                    >
                      <span className="mr-2">
                        <strong className="mr-2">{String.fromCharCode(65 + idx)}.</strong>
                        <MathText text={opt} />
                      </span>

                      {showResult && isCorrectOpt && <CheckCircle2 className="w-4 h-4 shrink-0 ml-1" />}
                      {showResult && isChosen && !isCorrectOpt && <XCircle className="w-4 h-4 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>

              {/* Feedback & Action */}
              {showResult && (
                <div
                  className={`p-4 rounded-lg border text-xs leading-relaxed space-y-2 ${
                    selectedOption === selectedQuestion.correctOption
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : 'bg-rose-50 border-rose-200 text-rose-950'
                  }`}
                >
                  <div className="font-bold flex items-center space-x-1.5">
                    {selectedOption === selectedQuestion.correctOption ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Chính Xác! +{100 + (streak - 1) * 20} Điểm</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-rose-600" />
                        <span>
                          Chưa Chính Xác! Đáp án đúng là {String.fromCharCode(65 + selectedQuestion.correctOption)}
                        </span>
                      </>
                    )}
                  </div>
                  {selectedOption !== selectedQuestion.correctOption && (
                    <div className="bg-amber-50 border border-amber-300 p-2.5 rounded-md text-[11px] text-amber-950 font-semibold space-y-1 my-1">
                      <div className="flex items-center space-x-1.5 text-amber-900 font-bold">
                        <Calculator className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>📐 Hướng dẫn cách làm bài tập từng bước:</span>
                      </div>
                      <div className="text-slate-800 font-medium whitespace-pre-line">
                        <MathText text={selectedQuestion.explanation} />
                      </div>
                    </div>
                  )}
                  {selectedOption === selectedQuestion.correctOption && (
                    <p className="text-slate-700 font-medium">{selectedQuestion.explanation}</p>
                  )}

                  <div className="pt-2 flex items-center justify-between">
                    {autoRemove && (
                      <span className="text-[11px] text-blue-700 font-bold italic">
                        ✓ Câu vừa trả lời đã tự động loại khỏi vòng quay
                      </span>
                    )}
                    <button
                      onClick={handleSpin}
                      disabled={remainingQuestions.length === 0}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-xs uppercase tracking-wider transition-colors ml-auto flex items-center space-x-1.5"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Quay Câu Tiếp Theo ({remainingQuestions.length} câu còn)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

