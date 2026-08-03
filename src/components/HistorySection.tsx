import React, { useState, useEffect } from 'react';
import { HistoryItem, LessonUnit, SchoolLevel } from '../types';
import { History, Trash2, ArrowUpRight, Search, Calendar, BookOpen, GraduationCap, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

interface HistorySectionProps {
  onReloadLesson: (lesson: LessonUnit) => void;
}

export const HistorySection: React.FC<HistorySectionProps> = ({ onReloadLesson }) => {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<'ALL' | SchoolLevel>('ALL');
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    try {
      const stored = localStorage.getItem('eduai_history');
      if (stored) {
        const parsed: HistoryItem[] = JSON.parse(stored);
        setHistoryItems(parsed);
      } else {
        setHistoryItems([]);
      }
    } catch (e) {
      console.error('Failed to load history:', e);
    }
  };

  const handleDeleteItem = (id: string) => {
    const updated = historyItems.filter((item) => item.id !== id);
    setHistoryItems(updated);
    localStorage.setItem('eduai_history', JSON.stringify(updated));
    setDeletingItemId(null);
  };

  const handleDeleteAll = () => {
    setHistoryItems([]);
    localStorage.removeItem('eduai_history');
    setConfirmDeleteAll(false);
    setDeletingItemId(null);
  };

  // Filtered items
  const filtered = historyItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.grade.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLevel =
      selectedLevelFilter === 'ALL' || item.schoolLevel === selectedLevelFilter;

    return matchesSearch && matchesLevel;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
            <History className="w-4 h-4" />
            <span>LỊCH SỬ TẠO HỌC LIỆU</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800">Nhật Ký & Ngân Hàng Bài Giảng Đã Tạo</h2>
          <p className="text-xs text-slate-500 mt-1">
            Tự động lưu trữ các bộ câu hỏi, lời giải chi tiết và ma trận phân hóa GD&ĐT bạn đã biên soạn.
          </p>
        </div>

        {/* Delete All & Action Buttons */}
        {historyItems.length > 0 && (
          <div className="shrink-0 flex items-center space-x-2">
            {confirmDeleteAll ? (
              <div className="flex items-center space-x-2 bg-rose-50 p-2 rounded-lg border border-rose-200">
                <span className="text-xs font-bold text-rose-800">Xóa tất cả?</span>
                <button
                  onClick={handleDeleteAll}
                  className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-2xs"
                >
                  Đồng Ý Xóa
                </button>
                <button
                  onClick={() => setConfirmDeleteAll(false)}
                  className="px-2.5 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs"
                >
                  Hủy
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDeleteAll(true)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa Toàn Bộ Lịch Sử</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm theo tên bài, môn học, khối lớp..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-600 outline-none"
          />
        </div>

        {/* Level filter tabs */}
        <div className="flex bg-slate-100 p-1 rounded-lg self-stretch sm:self-auto">
          <button
            onClick={() => setSelectedLevelFilter('ALL')}
            className={`px-3 py-1 text-xs font-bold rounded transition-all ${
              selectedLevelFilter === 'ALL'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Tất Cả ({historyItems.length})
          </button>
          <button
            onClick={() => setSelectedLevelFilter('THCS')}
            className={`px-3 py-1 text-xs font-bold rounded transition-all flex items-center space-x-1 ${
              selectedLevelFilter === 'THCS'
                ? 'bg-white text-emerald-700 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Cấp 2 (THCS)</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full">
              {historyItems.filter((i) => i.schoolLevel === 'THCS').length}
            </span>
          </button>
          <button
            onClick={() => setSelectedLevelFilter('THPT')}
            className={`px-3 py-1 text-xs font-bold rounded transition-all flex items-center space-x-1 ${
              selectedLevelFilter === 'THPT'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Cấp 3 (THPT)</span>
            <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded-full">
              {historyItems.filter((i) => i.schoolLevel === 'THPT').length}
            </span>
          </button>
        </div>
      </div>

      {/* History Items Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <History className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">Chưa Có Bản Ghi Lịch Sử Nào</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {historyItems.length > 0
              ? 'Không tìm thấy kết quả phù hợp với từ khóa hoặc bộ lọc của bạn.'
              : 'Hãy chuyển sang mục "1. Nhập Bài Giảng" để AI Gemini giúp bạn tạo ngân hàng câu hỏi đầu tiên!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => {
            const dateFormatted = new Date(item.createdAt).toLocaleString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
              >
                <div>
                  {/* Card Header Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                          item.schoolLevel === 'THCS'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}
                      >
                        {item.schoolLevel === 'THCS' ? '🏫 Cấp 2 (THCS)' : '🎓 Cấp 3 (THPT)'}
                      </span>
                      <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {item.subject} • {item.grade}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400 flex items-center space-x-1 font-mono">
                      <Calendar className="w-3 h-3" />
                      <span>{dateFormatted}</span>
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>

                  {/* Question Count & Details */}
                  <div className="mt-2.5 flex items-center space-x-3 text-xs text-slate-500 font-medium">
                    <span className="flex items-center space-x-1">
                      <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                      <span>{item.questionCount} câu hỏi</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Layers className="w-3.5 h-3.5 text-orange-500" />
                      <span>Chuẩn ma trận GD&ĐT</span>
                    </span>
                  </div>

                  {/* Sample Question Preview */}
                  {item.lesson?.questions && item.lesson.questions.length > 0 && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600">
                      <p className="font-bold text-slate-700 text-[11px] mb-1">
                        Câu hỏi mẫu: "{item.lesson.questions[0].question.substring(0, 85)}..."
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {deletingItemId === item.id ? (
                    <div className="flex items-center space-x-1.5 bg-rose-50 p-1 rounded-lg border border-rose-200">
                      <span className="text-[10px] font-bold text-rose-800 px-1">Xóa bài này?</span>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shadow-2xs"
                      >
                        Đồng Ý
                      </button>
                      <button
                        onClick={() => setDeletingItemId(null)}
                        className="px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[11px]"
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeletingItemId(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center space-x-1 text-xs font-bold"
                      title="Xóa bản ghi lịch sử này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa</span>
                    </button>
                  )}

                  <button
                    onClick={() => onReloadLesson(item.lesson)}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition-all"
                  >
                    <span>Nạp Lại Học Liệu Này</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
