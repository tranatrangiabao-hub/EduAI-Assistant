import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, CheckCircle, Copy, Check, Code, Eye, Share2, Download } from 'lucide-react';

interface SummaryAndMindmapProps {
  title: string;
  summaryPoints: string[];
  mindmapMermaid: string;
}

export const SummaryAndMindmap: React.FC<SummaryAndMindmapProps> = ({
  title,
  summaryPoints,
  mindmapMermaid,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [svgRenderError, setSvgRenderError] = useState(false);
  const [mindmapTab, setMindmapTab] = useState<'visual' | 'code'>('visual');

  useEffect(() => {
    let isMounted = true;

    async function renderMermaid() {
      try {
        const mermaidModule = await import('mermaid');
        const mermaid = (mermaidModule.default || mermaidModule) as any;
        
        mermaid.initialize({
          startOnLoad: false,
          theme: 'neutral',
          securityLevel: 'loose',
          fontFamily: 'Inter, sans-serif',
        });

        if (containerRef.current && mindmapMermaid) {
          containerRef.current.innerHTML = '';
          const uniqueId = `mermaid_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

          const { svg } = await mermaid.render(uniqueId, mindmapMermaid.trim());
          if (isMounted && containerRef.current) {
            containerRef.current.innerHTML = svg;
            setSvgRenderError(false);
          }
        }
      } catch (err) {
        console.error('Mermaid load/render error:', err);
        if (isMounted) {
          setSvgRenderError(true);
        }
      }
    }

    if (mindmapTab === 'visual') {
      renderMermaid();
    }

    return () => {
      isMounted = false;
    };
  }, [mindmapMermaid, mindmapTab]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(mindmapMermaid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base font-bold text-slate-900">
            Tóm Tắt Trọng Tâm Bài Học: {title}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {summaryPoints && summaryPoints.length > 0 ? (
            summaryPoints.map((point, idx) => (
              <div
                key={idx}
                className="flex items-start space-x-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-emerald-200 transition-colors"
              >
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed">
                  {point}
                </span>
              </div>
            ))
          ) : (
            <p className="text-slate-500 text-xs italic">Chưa có dữ liệu tóm tắt bài học.</p>
          )}
        </div>
      </div>

      {/* Mermaid Mindmap Visualizer */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-cyan-600" />
              <span>Sơ Đồ Tư Duy Tự Động (AI Mindmap)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Trực quan hóa cấu trúc bài học bằng chuẩn mã Mermaid.js
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setMindmapTab('visual')}
                className={`px-3 py-1 rounded-lg flex items-center space-x-1 transition-all cursor-pointer ${
                  mindmapTab === 'visual' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Trực Quan Sơ Đồ</span>
              </button>
              <button
                onClick={() => setMindmapTab('code')}
                className={`px-3 py-1 rounded-lg flex items-center space-x-1 transition-all cursor-pointer ${
                  mindmapTab === 'code' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>Mã Nguồn Mermaid</span>
              </button>
            </div>

            <button
              onClick={handleCopyCode}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Đã Chép Mã</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao Chép Mã</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tab 1: Visual SVG Container */}
        {mindmapTab === 'visual' && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 overflow-x-auto min-h-[280px] flex items-center justify-center flex-col space-y-3">
            <div ref={containerRef} className="mermaid-output w-full flex justify-center text-slate-800" />
            
            {svgRenderError && (
              <div className="text-center p-4 text-slate-600 space-y-2 w-full">
                <p className="font-semibold text-amber-700 text-xs">Mã Mermaid dạng văn bản:</p>
                <pre className="text-xs bg-slate-900 text-slate-100 p-4 rounded-xl text-left overflow-x-auto max-w-xl mx-auto font-mono">
                  {mindmapMermaid}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Code Block View */}
        {mindmapTab === 'code' && (
          <div className="p-4 bg-slate-900 text-slate-100 rounded-xl border border-slate-800 font-mono space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
              <span>Cấu trúc sơ đồ tư duy (Mermaid.js Syntax):</span>
              <span className="text-emerald-400 font-bold">Standard Mindmap DSL</span>
            </div>
            <pre className="text-xs text-emerald-300 overflow-x-auto leading-relaxed whitespace-pre-wrap">
              {mindmapMermaid}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
