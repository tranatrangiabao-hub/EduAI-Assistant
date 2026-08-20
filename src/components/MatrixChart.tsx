import React from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Question, QuizMatrix, TaxonomyLevel } from '../types';
import { BarChart3, PieChart as PieChartIcon, ShieldCheck } from 'lucide-react';

interface MatrixChartProps {
  questions: Question[];
  targetMatrix: QuizMatrix;
}

export const MatrixChart: React.FC<MatrixChartProps> = ({ questions, targetMatrix }) => {
  // Compute actual counts
  const actualCounts: Record<TaxonomyLevel, number> = {
    'Nhận biết': 0,
    'Thông hiểu': 0,
    'Vận dụng': 0,
    'Vận dụng cao': 0,
  };

  questions.forEach((q) => {
    if (actualCounts[q.taxonomyLevel] !== undefined) {
      actualCounts[q.taxonomyLevel]++;
    }
  });

  const total = questions.length || 1;

  const data = [
    {
      taxonomy: 'Nhận biết',
      actual: Math.round((actualCounts['Nhận biết'] / total) * 100),
      target: targetMatrix.nhanBiet,
      count: actualCounts['Nhận biết'],
      color: '#2563eb',
    },
    {
      taxonomy: 'Thông hiểu',
      actual: Math.round((actualCounts['Thông hiểu'] / total) * 100),
      target: targetMatrix.thongHieu,
      count: actualCounts['Thông hiểu'],
      color: '#059669',
    },
    {
      taxonomy: 'Vận dụng',
      actual: Math.round((actualCounts['Vận dụng'] / total) * 100),
      target: targetMatrix.vanDung,
      count: actualCounts['Vận dụng'],
      color: '#d97706',
    },
    {
      taxonomy: 'Vận dụng cao',
      actual: Math.round((actualCounts['Vận dụng cao'] / total) * 100),
      target: targetMatrix.vanDungCao,
      count: actualCounts['Vận dụng cao'],
      color: '#e11d48',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              <span>Phân Tích Ma Trận Nhận Thức GD&ĐT</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              So sánh tỷ lệ câu hỏi thực tế so với ma trận cấu trúc đề thi cài đặt
            </p>
          </div>

          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Tổng số: {questions.length} câu
          </span>
        </div>

        {/* Chart Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Bar Chart */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <h3 className="text-xs font-bold text-slate-700 mb-4 flex items-center space-x-1.5">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span>Tỷ Lệ Phần Trăm Thực Tế vs Mục Tiêu (%)</span>
            </h3>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="taxonomy" tick={{ fontSize: 11, fill: '#475569' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#475569' }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="actual" name="Thực tế (%)" radius={[6, 6, 0, 0]}>
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Radar Chart */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <h3 className="text-xs font-bold text-slate-700 mb-4 flex items-center space-x-1.5">
              <PieChartIcon className="w-4 h-4 text-cyan-600" />
              <span>Sơ Đồ Radar Phân Phối Cấp Độ GD&ĐT</span>
            </h3>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                  <PolarGrid stroke="#cbd5e1" />
                  <PolarAngleAxis dataKey="taxonomy" tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="Phần trăm (%)" dataKey="actual" stroke="#059669" fill="#10b981" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Matrix Detail Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {data.map((item) => (
            <div key={item.taxonomy} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">{item.taxonomy}</span>
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              </div>
              <div className="text-lg font-extrabold text-slate-900">
                {item.count} <span className="text-xs font-medium text-slate-500">câu</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Đạt <strong className="text-slate-800">{item.actual}%</strong> (Mục tiêu: {item.target}%)
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
