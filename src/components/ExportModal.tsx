import React, { useState } from 'react';
import { Download, X, Printer, Sparkles, FileText, Eye, EyeOff } from 'lucide-react';
import { Question } from '../types';
import { printExamPaper, downloadExamPaperDOCX } from '../utils/exporters';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subject: string;
  questions: Question[];
  examModeConfig?: any;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  title,
  subject,
  questions,
  examModeConfig,
}) => {
  const [showLivePreview, setShowLivePreview] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative space-y-6 my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Xuất Đề Thi &amp; Đáp Án Khổ A4 Chuẩn Bộ GD&amp;ĐT</span>
          </span>
          <h2 className="text-xl font-bold text-slate-900">
            Xuất File Word (.DOCX) &amp; In Đề Thi Khổ A4
          </h2>
          <p className="text-xs text-slate-500">
            Tự động dàn trang chuẩn A4 gồm phần thi học sinh (điền SBD, mã đề) và bảng Đáp án + Hướng dẫn giải chi tiết (Hướng dẫn chấm).
          </p>
        </div>

        {/* Export Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Download Exam Paper DOCX */}
          <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/50 transition-all space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 text-blue-800 font-bold text-sm mb-1">
                <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                <span>Tải File Word (.DOCX)</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Tải tệp Microsoft Word (.docx) chuẩn A4 về máy tính để dễ dàng chỉnh sửa, bổ sung nội dung.
              </p>
            </div>
            <button
              onClick={() => downloadExamPaperDOCX(title, questions, subject, examModeConfig)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Tải File .DOCX</span>
            </button>
          </div>

          {/* Printable Exam Paper */}
          <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/50 transition-all space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 text-amber-800 font-bold text-sm mb-1">
                <Printer className="w-5 h-5 text-amber-600 shrink-0" />
                <span>Xem &amp; In Trực Tiếp</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Xem trước toàn bộ đề thi kèm bảng đáp án chi tiết và in trực tiếp ra máy in giấy A4.
              </p>
            </div>
            <button
              onClick={() => printExamPaper(title, questions, subject, examModeConfig)}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>In Khổ A4 Ngay</span>
            </button>
          </div>
        </div>

        {/* Live Preview Toggle Button */}
        <div className="pt-2 border-t border-slate-200">
          <button
            onClick={() => setShowLivePreview(!showLivePreview)}
            className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-between transition-colors cursor-pointer"
          >
            <span className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-blue-600" />
              <span>{showLivePreview ? 'Ẩn Xem Trước Đề Thi Khổ A4' : 'Hiện Xem Trước Đề Thi Khổ A4'}</span>
            </span>
            <span className="text-[10px] text-blue-700 font-extrabold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {questions.length} câu hỏi
            </span>
          </button>
        </div>

        {/* Mini A4 Live Paper Preview Box */}
        {showLivePreview && (
          <div className="max-h-60 overflow-y-auto p-4 bg-slate-50 border border-slate-300 rounded-2xl text-[11px] font-serif space-y-3 shadow-inner">
            <div className="border-b border-slate-800 pb-2 flex justify-between font-bold uppercase text-[10px]">
              <div>SỞ GD&amp;ĐT - TRƯỜNG THPT CHUYÊN</div>
              <div>ĐỀ THI KIỂM TRA CHUẨN GD&amp;ĐT</div>
            </div>
            <p className="font-bold text-blue-950 font-sans uppercase">Đề thi: {title}</p>
            <div className="space-y-2 font-sans">
              {questions.slice(0, 4).map((q, idx) => (
                <div key={q.id || idx} className="p-2 bg-white rounded border border-slate-200 space-y-1">
                  <p className="font-bold">Câu {idx + 1}: <span className="font-normal">{q.question}</span></p>
                  <p className="text-[10px] text-slate-500 italic">Cấp độ: {q.taxonomyLevel} | Dạng: {q.questionType || 'Trắc nghiệm'}</p>
                </div>
              ))}
              {questions.length > 4 && (
                <p className="text-[10px] text-slate-400 italic text-center">... và {questions.length - 4} câu hỏi tiếp theo trong tệp xuất file.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
