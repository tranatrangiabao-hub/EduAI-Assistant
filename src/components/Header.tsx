import React from 'react';
import { ActiveTab, SubjectType } from '../types';
import { 
  Sparkles, 
  FileCheck2, 
  Network, 
  Layers, 
  Gamepad2, 
  FileText,
  Printer,
  Download,
  BookOpen
} from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  hasData: boolean;
  onSelectSample: (sampleId: string) => void;
  onPrintQuiz?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  hasData,
  onSelectSample,
  onPrintQuiz,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('input')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight">EduAI</span>
                <span className="px-2 py-0.5 text-xs font-bold bg-indigo-100 text-indigo-700 rounded-full uppercase tracking-wider">
                  GD&ĐT 2025+
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                Chuyển Đổi Học Liệu & Trò Chơi Học Tập AI
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('input')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'input'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Soạn Bài / Nhập Liệu</span>
            </button>

            <button
              onClick={() => setActiveTab('quiz')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'quiz'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Ngân Hàng Câu Hỏi</span>
              {hasData && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
            </button>

            <button
              onClick={() => setActiveTab('mindmap')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'mindmap'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Network className="w-4 h-4" />
              <span>Sơ Đồ Tư Duy</span>
              {hasData && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
            </button>

            <button
              onClick={() => setActiveTab('flashcards')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'flashcards'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Flashcard Anki</span>
              {hasData && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
            </button>

            <button
              onClick={() => setActiveTab('wordwall')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'wordwall'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Gamepad2 className="w-4 h-4 text-purple-600" />
              <span>Trò Chơi Wordwall</span>
              {hasData && <span className="w-2 h-2 rounded-full bg-purple-500" />}
            </button>
          </nav>

          {/* Preset Selector & Action Buttons */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    onSelectSample(e.target.value);
                  }
                }}
                defaultValue=""
                className="text-xs bg-slate-100 hover:bg-slate-200/70 border border-slate-300 text-slate-800 rounded-lg px-2.5 py-1.5 font-semibold transition-colors focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="" disabled>⚡ Nạp Bài Mẫu Minh Họa...</option>
                <option value="ester-lipit">🧪 Hóa 12: Ester & Lipit</option>
                <option value="vatly-daodong">📐 Vật lý 12: Con lắc đơn & DĐĐH</option>
              </select>
            </div>

            {activeTab === 'quiz' && onPrintQuiz && (
              <button
                onClick={onPrintQuiz}
                className="hidden sm:inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-all shadow-xs cursor-pointer"
                title="In đề thi hoặc xuất ra PDF/Word"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In / PDF Đề Thi</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Tab Navigation */}
        <div className="md:hidden flex items-center justify-between border-t border-slate-200 py-2 overflow-x-auto space-x-1 no-scrollbar">
          <button
            onClick={() => setActiveTab('input')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap ${
              activeTab === 'input' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Soạn Bài
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap ${
              activeTab === 'quiz' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Ngân Hàng Câu Hỏi
          </button>
          <button
            onClick={() => setActiveTab('mindmap')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap ${
              activeTab === 'mindmap' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Sơ Đồ Tư Duy
          </button>
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap ${
              activeTab === 'flashcards' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Flashcard
          </button>
          <button
            onClick={() => setActiveTab('wordwall')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap ${
              activeTab === 'wordwall' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Trò Chơi Game
          </button>
        </div>
      </div>
    </header>
  );
};
