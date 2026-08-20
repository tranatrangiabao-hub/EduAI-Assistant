import React, { useState, useEffect } from 'react';
import { translations } from '../i18n/translations';
import { Settings, CheckCircle2, X, Key, ExternalLink, ShieldCheck, Eye, EyeOff } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem('eduai_custom_api_key') || '';
      setApiKey(stored);
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('eduai_custom_api_key', apiKey.trim());
    } else {
      localStorage.removeItem('eduai_custom_api_key');
    }
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden relative">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-snug">Cài Đặt Hệ Thống &amp; API Key</h3>
              <p className="text-[11px] text-slate-300 font-medium">Cấu hình kết nối AI trên Vercel / Trực tiếp</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-slate-800 text-xs font-sans max-h-[80vh] overflow-y-auto">
          {/* API Key Setting */}
          <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-blue-950 flex items-center gap-1.5 text-xs">
                <Key className="w-4 h-4 text-blue-600" />
                Gemini API Key (Tùy chọn cho Vercel):
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-semibold"
              >
                Lấy Key Miễn Phí <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              Nếu bạn triển khai lên Vercel và chưa thêm biến môi trường <code className="bg-blue-100 px-1 rounded text-blue-800 font-mono">GEMINI_API_KEY</code>, bạn có thể dán API Key trực tiếp vào đây để tạo bài không giới hạn:
            </p>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 pr-10 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Lưu an toàn trong trình duyệt cục bộ (Local Storage)
              </span>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                {savedSuccess ? '✓ Đã Lưu' : 'Lưu Key'}
              </button>
            </div>
          </div>

          {/* Vercel Environment Variables Guide */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-xs leading-relaxed space-y-1.5">
            <p className="font-bold text-slate-800">💡 Hướng dẫn cấu hình trên Vercel Dashboard:</p>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 pl-1">
              <li>Mở dự án trên <strong>Vercel</strong> &gt; vào <strong>Settings</strong> &gt; chọn <strong>Environment Variables</strong>.</li>
              <li>Thêm biến tên: <code className="bg-slate-200 px-1 rounded text-slate-800 font-mono">GEMINI_API_KEY</code></li>
              <li>Giá trị: Mã Google Gemini API Key của bạn &gt; Nhấn <strong>Save</strong> &amp; <strong>Redeploy</strong>.</li>
            </ol>
          </div>

          {/* Default Language Notice */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start space-x-2.5 text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Quy chuẩn kiểm tra:</strong> Chuẩn khung ma trận nhận thức GDPT 2018 của Bộ GD&amp;ĐT (Nhận biết - Thông hiểu - Vận dụng - Vận dụng cao).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


