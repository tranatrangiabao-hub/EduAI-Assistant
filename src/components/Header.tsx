import React from 'react';
import { Sparkles, BookOpen, Gamepad2, FileText, BarChart3, Info, Download, History, Settings } from 'lucide-react';
import { ActiveTab } from '../types';
import { Language, translations } from '../i18n/translations';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  questionCount: number;
  lessonTitle: string;
  onOpenExport: () => void;
  onOpenProposalModal: () => void;
  onOpenSettings: () => void;
  language?: Language;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  questionCount,
  lessonTitle,
  onOpenExport,
  onOpenProposalModal,
  onOpenSettings,
}) => {
  const t = translations['vi'];

  return (
    <header className="bg-white text-slate-900 border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-sm">
              Σ
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-xl tracking-tight text-slate-900">{t.appName}</h1>
                <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 uppercase tracking-wider">
                  {t.gdtnTag}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-widest hidden sm:block">
                {t.appSubTitle}
              </p>
            </div>
          </div>

          {/* Action Buttons & Settings */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Settings Button */}
            <button
              onClick={onOpenSettings}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
              title={t.settings}
            >
              <Settings className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">{t.settings}</span>
            </button>

            <button
              onClick={onOpenProposalModal}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
              title="Xem Hồ sơ Đề tài & Báo cáo Nghiên cứu Sư phạm"
            >
              <Info className="w-4 h-4 text-blue-600" />
              <span className="hidden md:inline">{t.proposal}</span>
            </button>

            {questionCount > 0 && (
              <button
                onClick={onOpenExport}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{t.export} ({questionCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('input')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'input'
                ? 'bg-blue-50 text-blue-600 border border-blue-200 font-bold shadow-xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{t.navInput}</span>
          </button>

          <button
            onClick={() => setActiveTab('question_bank')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'question_bank'
                ? 'bg-blue-50 text-blue-600 border border-blue-200 font-bold shadow-xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{t.navQuestions} ({questionCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('gamification')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'gamification'
                ? 'bg-blue-50 text-blue-600 border border-blue-200 font-bold shadow-xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Gamepad2 className="w-4 h-4 text-orange-500" />
            <span>{t.navGamification}</span>
          </button>

          <button
            onClick={() => setActiveTab('mindmap')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'mindmap'
                ? 'bg-blue-50 text-blue-600 border border-blue-200 font-bold shadow-xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span>{t.navMindmap}</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-blue-50 text-blue-600 border border-blue-200 font-bold shadow-xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            <span>{t.navAnalytics}</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-blue-50 text-blue-600 border border-blue-200 font-bold shadow-xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <History className="w-4 h-4 text-purple-600" />
            <span>{t.navHistory}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
