import React, { useState } from 'react';
import { MindmapData, MindmapBranch } from '../types';
import { Network, ChevronDown, ChevronRight, Sparkles, ZoomIn, ZoomOut, Download, Layers } from 'lucide-react';

interface MindmapViewProps {
  mindmapData: MindmapData | null;
}

export const MindmapView: React.FC<MindmapViewProps> = ({ mindmapData }) => {
  const [expandedBranches, setExpandedBranches] = useState<Record<string, boolean>>({});
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  if (!mindmapData || !mindmapData.branches || mindmapData.branches.length === 0) {
    return (
      <div className="max-w-4xl mx-auto my-12 p-8 bg-white border border-slate-200 rounded-2xl text-center shadow-xs">
        <Network className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800 mb-1">Chưa Có Sơ Đồ Tư Duy</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Hãy dán tài liệu ở phần Soạn bài hoặc chọn bài mẫu minh họa để AI tự động dựng Sơ đồ tư duy kiến thức trực quan.
        </p>
      </div>
    );
  }

  const toggleBranch = (id: string) => {
    setExpandedBranches((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const branchColors = ['#4f46e5', '#0284c7', '#059669', '#d97706', '#e11d48', '#9333ea'];

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      {/* Header Controls Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sơ Đồ Tư Duy Kiến Thức Trực Quan</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center space-x-2">
            <span>{mindmapData.icon || '🌳'}</span>
            <span>{mindmapData.topic}</span>
          </h2>
          {mindmapData.description && (
            <p className="text-xs text-slate-500 mt-1">{mindmapData.description}</p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setZoomLevel((z) => Math.max(70, z - 10))}
              className="p-1.5 hover:bg-white text-slate-700 rounded-lg transition-all cursor-pointer"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-700 px-2">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(130, z + 10))}
              className="p-1.5 hover:bg-white text-slate-700 rounded-lg transition-all cursor-pointer"
              title="Phóng to"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mindmap Canvas Node Container */}
      <div className="bg-slate-900 rounded-2xl p-6 sm:p-10 shadow-xl overflow-x-auto text-white transition-all">
        <div
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}
          className="min-w-[700px] transition-transform duration-200"
        >
          {/* Central Root Node */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white px-8 py-4 rounded-2xl shadow-xl border border-indigo-400/40 transform hover:scale-105 transition-all">
              <span className="text-2xl">{mindmapData.icon || '🎓'}</span>
              <span className="font-extrabold text-lg tracking-tight uppercase">
                {mindmapData.topic}
              </span>
            </div>
          </div>

          {/* Main Branches Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {mindmapData.branches.map((branch, bIdx) => {
              const isCollapsed = expandedBranches[branch.id];
              const accentColor = branch.color || branchColors[bIdx % branchColors.length];

              return (
                <div
                  key={branch.id || bIdx}
                  className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-lg backdrop-blur-xs transition-all hover:border-slate-600"
                >
                  {/* Branch Main Header */}
                  <div
                    onClick={() => toggleBranch(branch.id)}
                    className="flex items-center justify-between cursor-pointer pb-3 border-b border-slate-700/60"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md"
                        style={{ backgroundColor: accentColor }}
                      >
                        {branch.icon || `${bIdx + 1}`}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-white hover:text-indigo-300 transition-colors">
                          {branch.title}
                        </h3>
                        {branch.summary && (
                          <p className="text-xs text-slate-400">{branch.summary}</p>
                        )}
                      </div>
                    </div>

                    <button className="text-slate-400 hover:text-white p-1">
                      {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Sub-branches and Details */}
                  {!isCollapsed && branch.subBranches && (
                    <div className="mt-4 space-y-4 pl-2">
                      {branch.subBranches.map((sub, sIdx) => (
                        <div
                          key={sub.id || sIdx}
                          className="relative pl-4 border-l-2 border-indigo-500/40 space-y-2"
                        >
                          <div className="flex items-center space-x-2">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: accentColor }}
                            />
                            <h4 className="font-bold text-xs text-indigo-200 uppercase tracking-wider">
                              {sub.title}
                            </h4>
                          </div>

                          {/* Key Points / Details List */}
                          {sub.details && sub.details.length > 0 && (
                            <ul className="space-y-1.5 pl-2 text-xs text-slate-300 font-medium">
                              {sub.details.map((detail, dIdx) => (
                                <li key={dIdx} className="flex items-start space-x-2">
                                  <span className="text-indigo-400 font-bold">•</span>
                                  <span className="leading-relaxed">{detail}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
