import React, { useState, useRef, useEffect } from 'react';
import { WordwallData, WheelQuestion, MillionaireQuestion, MemoryPair } from '../types';
import { Gamepad2, Trophy, Disc, Award, Copy, Check, Sparkles, RefreshCw, Volume2, HelpCircle } from 'lucide-react';

interface WordwallGamificationViewProps {
  wordwallData: WordwallData | null;
}

export const WordwallGamificationView: React.FC<WordwallGamificationViewProps> = ({
  wordwallData,
}) => {
  const [activeGame, setActiveGame] = useState<'wheel' | 'millionaire' | 'memory' | 'export'>('wheel');
  
  // Wheel State
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [selectedWheelQuestion, setSelectedWheelQuestion] = useState<WheelQuestion | null>(null);
  const [showWheelAnswer, setShowWheelAnswer] = useState<boolean>(false);
  const [totalScore, setTotalScore] = useState<number>(0);

  // Millionaire State
  const [millionaireStep, setMillionaireStep] = useState<number>(0);
  const [selectedMillionaireOpt, setSelectedMillionaireOpt] = useState<number | null>(null);
  const [millionaireSubmitted, setMillionaireSubmitted] = useState<boolean>(false);
  const [lifeline5050Used, setLifeline5050Used] = useState<boolean>(false);
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);

  // Memory State
  const [memoryCards, setMemoryCards] = useState<{ id: string; content: string; pairId: number; isTerm: boolean; isFlipped: boolean; isMatched: boolean }[]>([]);
  const [flippedMemoryCards, setFlippedMemoryCards] = useState<number[]>([]);
  const [memoryScore, setMemoryScore] = useState<number>(0);

  // Export State
  const [copiedText, setCopiedText] = useState<boolean>(false);

  useEffect(() => {
    if (wordwallData && wordwallData.memoryMatchingPairs) {
      initMemoryGame(wordwallData.memoryMatchingPairs);
    }
  }, [wordwallData]);

  if (!wordwallData) {
    return (
      <div className="max-w-4xl mx-auto my-12 p-8 bg-white border border-slate-200 rounded-2xl text-center shadow-xs">
        <Gamepad2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800 mb-1">Chưa Có Trò Chơi Wordwall</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Nhập bài giảng ở trang Soạn bài để AI tự động chuyển đổi toàn bộ câu hỏi thành 4 dạng trò chơi Wordwall hấp dẫn.
        </p>
      </div>
    );
  }

  // --- Wheel Functions ---
  const spinWheel = () => {
    if (isSpinning || !wordwallData.wheelQuestions || wordwallData.wheelQuestions.length === 0) return;
    setIsSpinning(true);
    setSelectedWheelQuestion(null);
    setShowWheelAnswer(false);

    const randomDegrees = Math.floor(3600 + Math.random() * 3600);
    const newRotation = wheelRotation + randomDegrees;
    setWheelRotation(newRotation);

    setTimeout(() => {
      setIsSpinning(false);
      const questionsCount = wordwallData.wheelQuestions.length;
      const normalizedDegree = (newRotation % 360);
      const segmentAngle = 360 / questionsCount;
      const index = Math.floor((360 - (normalizedDegree % 360)) / segmentAngle) % questionsCount;
      const question = wordwallData.wheelQuestions[index];
      setSelectedWheelQuestion(question);
      setTotalScore((prev) => prev + (question.points || 100));
    }, 4000);
  };

  // --- Memory Game Functions ---
  const initMemoryGame = (pairs: MemoryPair[]) => {
    const cards: { id: string; content: string; pairId: number; isTerm: boolean; isFlipped: boolean; isMatched: boolean }[] = [];
    pairs.slice(0, 6).forEach((pair, idx) => {
      cards.push({ id: `term-${idx}`, content: pair.term, pairId: idx, isTerm: true, isFlipped: false, isMatched: false });
      cards.push({ id: `def-${idx}`, content: pair.definition, pairId: idx, isTerm: false, isFlipped: false, isMatched: false });
    });
    // Shuffle
    cards.sort(() => Math.random() - 0.5);
    setMemoryCards(cards);
    setFlippedMemoryCards([]);
    setMemoryScore(0);
  };

  const handleMemoryCardClick = (index: number) => {
    if (flippedMemoryCards.length === 2 || memoryCards[index].isFlipped || memoryCards[index].isMatched) return;

    const newCards = [...memoryCards];
    newCards[index].isFlipped = true;
    setMemoryCards(newCards);

    const newFlipped = [...flippedMemoryCards, index];
    setFlippedMemoryCards(newFlipped);

    if (newFlipped.length === 2) {
      const [firstIdx, secondIdx] = newFlipped;
      if (newCards[firstIdx].pairId === newCards[secondIdx].pairId && newCards[firstIdx].isTerm !== newCards[secondIdx].isTerm) {
        // Match!
        setTimeout(() => {
          newCards[firstIdx].isMatched = true;
          newCards[secondIdx].isMatched = true;
          setMemoryCards([...newCards]);
          setFlippedMemoryCards([]);
          setMemoryScore((prev) => prev + 200);
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          newCards[firstIdx].isFlipped = false;
          newCards[secondIdx].isFlipped = false;
          setMemoryCards([...newCards]);
          setFlippedMemoryCards([]);
        }, 1200);
      }
    }
  };

  // --- Export Formatting ---
  const generateExportText = () => {
    let txt = `=== DỮ LIỆU CÂU HỎI GAME WORDWALL / KAHOOT / QUIZIZZ ===\n`;
    txt += `Chủ đề: ${wordwallData.gameTitle}\n\n`;

    txt += `--- 1. CÂU HỎI VÒNG QUAY KỲ DIỆU ---\n`;
    wordwallData.wheelQuestions?.forEach((q, i) => {
      txt += `${i + 1}. [${q.segmentLabel}] ${q.question} -> Đáp án: ${q.answer}\n`;
    });

    txt += `\n--- 2. CÂU HỎI AI LÀ TRIỆU PHÚ ---\n`;
    wordwallData.millionaireQuestions?.forEach((q, i) => {
      txt += `Câu ${i + 1} (Cấp ${q.level}): ${q.question}\n`;
      q.options.forEach((opt, oIdx) => {
        txt += `   ${String.fromCharCode(65 + oIdx)}. ${opt}${oIdx === q.correctIndex ? ' [ĐÚNG]' : ''}\n`;
      });
      txt += `   Lời giải: ${q.explanation}\n\n`;
    });

    txt += `--- 3. CẶP KHÁI NIỆM GHÉP ĐÔI ---\n`;
    wordwallData.memoryMatchingPairs?.forEach((m, i) => {
      txt += `${i + 1}. ${m.term} === ${m.definition}\n`;
    });

    return txt;
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generateExportText());
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const currentMillionaireQ = wordwallData.millionaireQuestions?.[millionaireStep];

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Top Header Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Đấu Trường Học Tập Wordwall AI Gamification</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            {wordwallData.gameTitle || 'Trò Chơi Củng Cố Kiến Thức'}
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          <div className="px-3.5 py-1.5 bg-amber-100 border border-amber-300 text-amber-900 rounded-xl font-extrabold text-xs flex items-center space-x-1.5 shadow-2xs">
            <Trophy className="w-4 h-4 text-amber-600" />
            <span>Tổng Điểm: {totalScore + memoryScore} đ</span>
          </div>
        </div>
      </div>

      {/* Game Mode Sub-Tabs */}
      <div className="flex items-center space-x-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveGame('wheel')}
          className={`flex-1 min-w-[120px] py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
            activeGame === 'wheel' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Disc className="w-4 h-4" />
          <span>Vòng Quay Kỳ Diệu</span>
        </button>

        <button
          onClick={() => setActiveGame('millionaire')}
          className={`flex-1 min-w-[120px] py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
            activeGame === 'millionaire' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Ai Là Triệu Phú</span>
        </button>

        <button
          onClick={() => setActiveGame('memory')}
          className={`flex-1 min-w-[120px] py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
            activeGame === 'memory' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          <span>Thẻ Lật Ghép Đôi</span>
        </button>

        <button
          onClick={() => setActiveGame('export')}
          className={`flex-1 min-w-[120px] py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
            activeGame === 'export' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Copy className="w-4 h-4" />
          <span>Xuất Dữ Liệu Wordwall</span>
        </button>
      </div>

      {/* GAME 1: VÒNG QUAY KỲ DIỆU */}
      {activeGame === 'wheel' && (
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-indigo-500/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Wheel Display Canvas */}
            <div className="flex flex-col items-center justify-center relative">
              {/* Pointer Triangle */}
              <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[28px] border-t-amber-400 z-20 mb-[-12px] filter drop-shadow-md" />

              {/* Rotating Wheel Circle */}
              <div
                style={{
                  transform: `rotate(${wheelRotation}deg)`,
                  transition: isSpinning ? 'transform 4s cubic-bezier(0.15, 0.9, 0.2, 1)' : 'none',
                }}
                className="w-64 h-64 sm:w-80 sm:h-80 rounded-full border-8 border-amber-400 shadow-2xl relative flex items-center justify-center overflow-hidden bg-slate-800"
              >
                {wordwallData.wheelQuestions?.map((q, idx) => {
                  const total = wordwallData.wheelQuestions.length;
                  const angle = (360 / total) * idx;
                  return (
                    <div
                      key={idx}
                      style={{
                        transform: `rotate(${angle}deg)`,
                        transformOrigin: '50% 50%',
                      }}
                      className="absolute inset-0 flex items-start justify-center pt-3 text-center"
                    >
                      <span className="text-[11px] font-extrabold uppercase text-amber-300 drop-shadow-md">
                        {q.segmentLabel || `Ô ${idx + 1}`}
                      </span>
                    </div>
                  );
                })}
                <div className="w-16 h-16 rounded-full bg-slate-900 border-4 border-amber-400 shadow-inner flex items-center justify-center z-10">
                  <Disc className="w-8 h-8 text-amber-400 animate-spin-slow" />
                </div>
              </div>

              {/* Spin Button */}
              <button
                onClick={spinWheel}
                disabled={isSpinning}
                className={`mt-6 px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg transition-all cursor-pointer ${
                  isSpinning
                    ? 'bg-slate-600 text-slate-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 hover:from-amber-300 hover:to-amber-400 active:scale-95 shadow-amber-500/20'
                }`}
              >
                {isSpinning ? 'Đang Quay Mãn Nhãn...' : '🎰 QUAY VÒNG QUAY NÀY'}
              </button>
            </div>

            {/* Question Card Display */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 backdrop-blur-xs min-h-[280px] flex flex-col justify-between">
              {selectedWheelQuestion ? (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20">
                      Ô thử thách: {selectedWheelQuestion.segmentLabel}
                    </span>
                    <span className="text-xs font-bold text-emerald-400">
                      +{selectedWheelQuestion.points} điểm
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-4 leading-relaxed">
                    {selectedWheelQuestion.question}
                  </h3>

                  {showWheelAnswer ? (
                    <div className="p-4 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-200 text-sm font-semibold">
                      💡 Đáp án: {selectedWheelQuestion.answer}
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowWheelAnswer(true)}
                      className="w-full py-2.5 bg-indigo-600/80 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Hiện Đáp Án Chi Tiết
                    </button>
                  )}
                </div>
              ) : (
                <div className="my-auto text-center text-slate-400">
                  <Disc className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold">Bấm "QUAY VÒNG QUAY" để chọn câu hỏi ngẫu nhiên!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* GAME 2: AI LÀ TRIỆU PHÚ */}
      {activeGame === 'millionaire' && currentMillionaireQ && (
        <div className="bg-slate-950 text-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-indigo-900">
          {/* Top Status & Lifelines */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                Câu {millionaireStep + 1} / {wordwallData.millionaireQuestions.length}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-extrabold border border-amber-400/30">
                Mức thưởng Cấp {currentMillionaireQ.level}
              </span>
            </div>

            {/* Lifelines */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  if (lifeline5050Used) return;
                  setLifeline5050Used(true);
                  const wrongOpts = [0, 1, 2, 3].filter((i) => i !== currentMillionaireQ.correctIndex);
                  wrongOpts.sort(() => Math.random() - 0.5);
                  setHiddenOptions([wrongOpts[0], wrongOpts[1]]);
                }}
                disabled={lifeline5050Used}
                className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  lifeline5050Used
                    ? 'bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed'
                    : 'bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 border-indigo-700'
                }`}
              >
                50:50
              </button>

              <button
                onClick={() => {
                  const letter = String.fromCharCode(65 + currentMillionaireQ.correctIndex);
                  setAiAdvice(`AI Khuyên Chọn Đáp Án ${letter} với độ tin cậy 95%!`);
                }}
                className="px-3 py-1 text-xs font-bold bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-700 rounded-lg transition-all cursor-pointer"
              >
                Hỏi AI Trợ Lý
              </button>
            </div>
          </div>

          {aiAdvice && (
            <div className="mb-4 p-3 bg-purple-950 border border-purple-500/40 text-purple-200 rounded-xl text-xs font-semibold flex items-center justify-between">
              <span>🤖 {aiAdvice}</span>
              <button onClick={() => setAiAdvice(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
          )}

          {/* Question Text */}
          <div className="bg-slate-900 border-2 border-indigo-600/60 p-6 rounded-2xl text-center mb-6 shadow-lg">
            <h3 className="text-lg sm:text-xl font-bold leading-relaxed text-indigo-100">
              {currentMillionaireQ.question}
            </h3>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {currentMillionaireQ.options.map((opt, oIdx) => {
              if (hiddenOptions.includes(oIdx)) {
                return (
                  <div key={oIdx} className="p-4 rounded-xl bg-slate-900/30 border border-slate-800 opacity-20 text-xs">
                    {String.fromCharCode(65 + oIdx)}: [Đã loại trừ]
                  </div>
                );
              }

              const isSelected = selectedMillionaireOpt === oIdx;
              const isCorrect = currentMillionaireQ.correctIndex === oIdx;

              let style = 'bg-slate-900 border-slate-800 hover:border-amber-400 hover:bg-slate-800/80 text-white';

              if (millionaireSubmitted) {
                if (isCorrect) style = 'bg-emerald-950 border-emerald-500 text-emerald-200 font-bold';
                else if (isSelected) style = 'bg-rose-950 border-rose-500 text-rose-200';
              } else if (isSelected) {
                style = 'bg-amber-950 border-amber-400 text-amber-200 font-bold';
              }

              return (
                <button
                  key={oIdx}
                  onClick={() => {
                    if (!millionaireSubmitted) setSelectedMillionaireOpt(oIdx);
                  }}
                  className={`p-4 rounded-xl border text-left transition-all flex items-center space-x-3 cursor-pointer ${style}`}
                >
                  <span className="w-7 h-7 rounded-lg bg-indigo-950 border border-indigo-700 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
                    {String.fromCharCode(65 + oIdx)}
                  </span>
                  <span className="text-sm font-semibold">{opt}</span>
                </button>
              );
            })}
          </div>

          {/* Explanation & Next Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            {millionaireSubmitted ? (
              <div className="text-xs text-slate-300">
                {selectedMillionaireOpt === currentMillionaireQ.correctIndex
                  ? '🎉 CHÍNH XÁC! Bạn được cộng 500 điểm.'
                  : `❌ Tiếc quá! Đáp án đúng là ${String.fromCharCode(65 + currentMillionaireQ.correctIndex)}.`}
              </div>
            ) : <div />}

            <div>
              {!millionaireSubmitted ? (
                <button
                  onClick={() => {
                    if (selectedMillionaireOpt !== null) {
                      setMillionaireSubmitted(true);
                      if (selectedMillionaireOpt === currentMillionaireQ.correctIndex) {
                        setTotalScore((s) => s + 500);
                      }
                    }
                  }}
                  disabled={selectedMillionaireOpt === null}
                  className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer ${
                    selectedMillionaireOpt === null
                      ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                      : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md'
                  }`}
                >
                  Xác Nhận Lựa Chọn
                </button>
              ) : (
                <button
                  onClick={() => {
                    setMillionaireSubmitted(false);
                    setSelectedMillionaireOpt(null);
                    setHiddenOptions([]);
                    setAiAdvice(null);
                    if (millionaireStep < wordwallData.millionaireQuestions.length - 1) {
                      setMillionaireStep((s) => s + 1);
                    } else {
                      setMillionaireStep(0);
                    }
                  }}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  {millionaireStep < wordwallData.millionaireQuestions.length - 1 ? 'Câu Tiếp Theo ➔' : 'Chơi Lại Từ Đầu'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* GAME 3: THẺ LẬT GHÉP ĐÔI */}
      {activeGame === 'memory' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Trò Chơi Trí Nhớ: Lật Thẻ Ghép Đôi Khái Niệm</h3>
              <p className="text-xs text-slate-500">Lật 2 thẻ để tìm cặp Thuật ngữ và Giải thích tương ứng.</p>
            </div>
            <button
              onClick={() => initMemoryGame(wordwallData.memoryMatchingPairs)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center space-x-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Xáo Thẻ Mới</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {memoryCards.map((card, idx) => (
              <div
                key={card.id}
                onClick={() => handleMemoryCardClick(idx)}
                className={`min-h-[110px] p-4 rounded-2xl border text-center flex items-center justify-center cursor-pointer transition-all duration-300 font-semibold text-xs select-none shadow-2xs ${
                  card.isMatched
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 opacity-60'
                    : card.isFlipped
                    ? 'bg-indigo-900 text-white border-indigo-700 shadow-md scale-105'
                    : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200 hover:border-slate-400'
                }`}
              >
                {card.isFlipped || card.isMatched ? (
                  <span>{card.content}</span>
                ) : (
                  <span className="text-slate-400 text-lg">❓</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EXPORT DATA FOR WORDWALL / KAHOOT / QUIZIZZ */}
      {activeGame === 'export' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Định Dạng Xuất Chuẩn Cho Wordwall / Kahoot / Quizizz</h3>
              <p className="text-xs text-slate-500">Sao chép văn bản bên dưới và dán trực tiếp vào công cụ tạo game Wordwall/Kahoot.</p>
            </div>
            <button
              onClick={handleCopyText}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer flex items-center space-x-1.5"
            >
              {copiedText ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copiedText ? 'Đã Sao Chép!' : 'Sao Chép Toàn Bộ'}</span>
            </button>
          </div>

          <textarea
            rows={14}
            readOnly
            value={generateExportText()}
            className="w-full bg-slate-900 text-slate-100 rounded-2xl p-4 text-xs font-mono leading-relaxed border border-slate-800 focus:outline-none"
          />
        </div>
      )}
    </div>
  );
};
