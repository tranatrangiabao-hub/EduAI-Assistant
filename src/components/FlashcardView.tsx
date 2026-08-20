import React, { useState } from 'react';
import { FlashcardDeck, Flashcard } from '../types';
import { Layers, RotateCw, ChevronLeft, ChevronRight, Download, Sparkles, Lightbulb, CheckCircle, Flame } from 'lucide-react';

interface FlashcardViewProps {
  flashcardDeck: FlashcardDeck | null;
}

export const FlashcardView: React.FC<FlashcardViewProps> = ({ flashcardDeck }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [masteredCards, setMasteredCards] = useState<Record<string, 'easy' | 'medium' | 'hard'>>({});

  if (!flashcardDeck || !flashcardDeck.cards || flashcardDeck.cards.length === 0) {
    return (
      <div className="max-w-4xl mx-auto my-12 p-8 bg-white border border-slate-200 rounded-2xl text-center shadow-xs">
        <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800 mb-1">Chưa Có Bộ Flashcard</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Nhập tài liệu ở trang Soạn bài để AI tự động trích xuất các công thức, thuật ngữ và khái niệm thành bộ thẻ ghi nhớ Anki.
        </p>
      </div>
    );
  }

  const currentCard = flashcardDeck.cards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setShowHint(false);
    setCurrentIndex((prev) => (prev + 1) % flashcardDeck.cards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setShowHint(false);
    setCurrentIndex((prev) => (prev - 1 + flashcardDeck.cards.length) % flashcardDeck.cards.length);
  };

  const handleRate = (rating: 'easy' | 'medium' | 'hard') => {
    setMasteredCards((prev) => ({
      ...prev,
      [currentCard.id || currentIndex]: rating,
    }));
    handleNext();
  };

  const exportAnkiCSV = () => {
    const csvRows = ['Front,Back,Mnemonic,Category,Tags'];
    flashcardDeck.cards.forEach((card) => {
      const front = `"${card.front.replace(/"/g, '""')}"`;
      const back = `"${card.back.replace(/"/g, '""')}"`;
      const hint = `"${(card.mnemonicHint || '').replace(/"/g, '""')}"`;
      const cat = `"${(card.category || '').replace(/"/g, '""')}"`;
      const tags = `"${(card.tags || []).join(' ')}"`;
      csvRows.push(`${front},${back},${hint},${cat},${tags}`);
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${flashcardDeck.deckTitle || 'Anki-Flashcards'}.csv`;
    a.click();
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-sky-600 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Thẻ Ghi Nhớ Ngắt Quãng (Anki Spaced Repetition)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            {flashcardDeck.deckTitle || 'Bộ Thẻ Ghi Nhớ'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Môn học: {flashcardDeck.subject} • Tổng số: {flashcardDeck.cards.length} thẻ
          </p>
        </div>

        <button
          onClick={exportAnkiCSV}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer flex items-center space-x-1.5"
        >
          <Download className="w-4 h-4" />
          <span>Xuất File CSV Cho Anki</span>
        </button>
      </div>

      {/* Main Flashcard Interactive Stage */}
      <div className="relative mb-8">
        {/* Card Frame */}
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className={`w-full min-h-[320px] sm:min-h-[380px] rounded-3xl p-8 cursor-pointer transition-all duration-300 flex flex-col justify-between border shadow-lg ${
            isFlipped
              ? 'bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 text-white border-indigo-500/40'
              : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300'
          }`}
        >
          {/* Top Card Bar */}
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider opacity-70">
            <span>
              Thẻ {currentIndex + 1} / {flashcardDeck.cards.length}
            </span>
            <span className="flex items-center space-x-1">
              <RotateCw className="w-3.5 h-3.5" />
              <span>Bấm để lật thẻ ({isFlipped ? 'Mặt Sau' : 'Mặt Trước'})</span>
            </span>
          </div>

          {/* Card Body Content */}
          <div className="my-auto text-center px-4 py-6">
            <div className="text-xs font-bold uppercase tracking-widest mb-3 opacity-60">
              {isFlipped ? '💡 ĐÁP ÁN & ĐỊNH NGHĨA' : '❓ CÂU HỎI / KHÁI NIỆM'}
            </div>
            <h3 className="text-xl sm:text-3xl font-extrabold leading-relaxed">
              {isFlipped ? currentCard.back : currentCard.front}
            </h3>

            {/* Mnemonic Hint */}
            {isFlipped && currentCard.mnemonicHint && (
              <div className="mt-6 inline-flex items-center space-x-2 bg-amber-400/20 border border-amber-400/40 text-amber-200 px-4 py-2 rounded-xl text-xs font-semibold text-left max-w-lg mx-auto">
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Mẹo nhớ nhanh: {currentCard.mnemonicHint}</span>
              </div>
            )}
          </div>

          {/* Bottom Card Footer */}
          <div className="flex items-center justify-between text-xs font-semibold opacity-70">
            <span>{currentCard.category || 'Lý thuyết'}</span>
            <div className="flex space-x-1">
              {(currentCard.tags || []).map((t, idx) => (
                <span key={idx} className="bg-slate-200/40 dark:bg-slate-800/60 px-2 py-0.5 rounded-md">
                  #{t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation & Spaced Repetition Feedback Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrev}
            className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all cursor-pointer"
            title="Thẻ trước"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all cursor-pointer"
            title="Thẻ tiếp theo"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Rating Buttons */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-center">
          <span className="text-xs font-bold text-slate-500 uppercase mr-2 hidden sm:inline">
            Đánh giá độ nhớ:
          </span>
          <button
            onClick={() => handleRate('hard')}
            className="flex-1 sm:flex-initial px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            🔴 Chưa Thuộc
          </button>
          <button
            onClick={() => handleRate('medium')}
            className="flex-1 sm:flex-initial px-3.5 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            🟡 Tạm Nhớ
          </button>
          <button
            onClick={() => handleRate('easy')}
            className="flex-1 sm:flex-initial px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            🟢 Thuộc Lòng
          </button>
        </div>
      </div>
    </div>
  );
};
