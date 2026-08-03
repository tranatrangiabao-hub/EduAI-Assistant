import React from 'react';
import { translations } from '../i18n/translations';
import { Settings, CheckCircle2, X } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const t = translations['vi'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden relative">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-snug">Cấu Hình Ứng Dụng EduAI</h3>
              <p className="text-[11px] text-slate-300 font-medium">Hệ thống mặc định Tiếng Việt</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-slate-800 text-xs font-sans">
          {/* Default Language Notice */}
          <div className="p-3.5 bg-blue-50/80 rounded-xl border border-blue-200 flex items-start space-x-2.5 text-blue-900">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Ngôn ngữ mặc định:</strong> Tiếng Việt (Chuẩn khung ma trận và ma trận kiến thức Bộ GD&amp;ĐT).
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-xs leading-relaxed space-y-1">
            <p className="font-bold text-slate-800">Chế độ vận hành trực tiếp:</p>
            <p className="text-[11px]">
              Tất cả các tính năng soạn bài giảng, khởi tạo ngân hàng câu hỏi, ma trận đề thi và xuất file Word/PDF A4 được cấp phép đầy đủ, không yêu cầu đăng nhập.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

