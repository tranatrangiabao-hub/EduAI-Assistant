import React from 'react';
import katex from 'katex';

interface MathTextProps {
  text: string;
  className?: string;
  inline?: boolean;
}

/**
 * Normalizes pseudo-math strings into valid, clean LaTeX syntax for KaTeX.
 * Examples:
 * - "T = 2pisqrtk/m" -> "T = 2\pi\sqrt{\frac{k}{m}}"
 * - "T = 1/(2pi)sqrtm/k" -> "T = \frac{1}{2\pi}\sqrt{\frac{m}{k}}"
 * - "T = 2π√k/m" -> "T = 2\pi\sqrt{\frac{k}{m}}"
 * - "căn(k/m)" -> "\sqrt{\frac{k}{m}}"
 * - "pi/2" -> "\frac{\pi}{2}"
 */
export function normalizeLatex(rawLatex: string): string {
  if (!rawLatex) return '';
  let s = rawLatex.trim();

  // 1. Fix unescaped JSON control character artifacts (e.g., \v + arphi from unescaped \varphi)
  s = s.replace(/\x0Barphi/gi, '\\varphi');
  s = s.replace(/\x0B/g, '');
  s = s.replace(/\x0Crac/gi, '\\frac');
  s = s.replace(/\x08eta/gi, '\\beta');

  // 2. Un-escape double backslashes if present
  s = s.replace(/\\\\([a-zA-Z]+)/g, '\\$1');

  // 3. Normalize Unicode math symbols to LaTeX equivalents
  s = s.replace(/π/g, '\\pi');
  s = s.replace(/ω/g, '\\omega');
  s = s.replace(/α/g, '\\alpha');
  s = s.replace(/β/g, '\\beta');
  s = s.replace(/Δ/g, '\\Delta');
  s = s.replace(/φ/g, '\\varphi');
  s = s.replace(/λ/g, '\\lambda');
  s = s.replace(/θ/g, '\\theta');

  // 4. Square root with Unicode symbol '√'
  s = s.replace(/√\s*\(\s*([^()]+?)\s*\/\s*([^()]+?)\s*\)/g, '\\sqrt{\\frac{$1}{$2}}');
  s = s.replace(/√\s*\(([^()]+)\)/g, '\\sqrt{$1}');
  s = s.replace(/√\s*([a-zA-Z0-9_]+)\s*\/\s*([a-zA-Z0-9_]+)/g, '\\sqrt{\\frac{$1}{$2}}');
  s = s.replace(/√\s*([a-zA-Z0-9_]+)/g, '\\sqrt{$1}');

  // 5. Fractions like 1/(2pi) or 1/(2\pi) -> \frac{1}{2\pi}
  s = s.replace(/1\s*\/\s*\(\s*2\s*\\?pi\s*\)/gi, '\\frac{1}{2\\pi}');
  s = s.replace(/1\s*\/\s*2\s*\\?pi\b/gi, '\\frac{1}{2\\pi}');

  // 6. Convert "2pi" or "2\pi" -> 2\pi
  s = s.replace(/(\d+)\s*\\?pi\b/gi, '$1\\pi');

  // 7. Square roots & 'căn'
  // căn(A/B) or căn (A/B) -> \sqrt{\frac{A}{B}}
  s = s.replace(/căn\s*\(\s*([^()]+?)\s*\/\s*([^()]+?)\s*\)/gi, '\\sqrt{\\frac{$1}{$2}}');
  s = s.replace(/căn\s*\(([^()]+)\)/gi, '\\sqrt{$1}');
  s = s.replace(/căn\s+([a-zA-Z0-9_\{\}\\]+)/gi, '\\sqrt{$1}');

  // sqrt without backslash or with backslash:
  // sqrtk/m or \sqrtk/m -> \sqrt{\frac{k}{m}}
  // sqrtm/k or \sqrtm/k -> \sqrt{\frac{m}{k}}
  // sqrtg/l or \sqrtg/l -> \sqrt{\frac{g}{l}}
  s = s.replace(/\\?sqrt\s*([a-zA-Z0-9_]+)\s*\/\s*([a-zA-Z0-9_]+)/gi, '\\sqrt{\\frac{$1}{$2}}');
  s = s.replace(/\\?sqrt\s*\{\s*([a-zA-Z0-9_]+)\s*\/\s*([a-zA-Z0-9_]+)\s*\}/gi, '\\sqrt{\\frac{$1}{$2}}');
  s = s.replace(/\\?sqrt\s*\(\s*([^()]+?)\s*\/\s*([^()]+?)\s*\)/gi, '\\sqrt{\\frac{$1}{$2}}');
  s = s.replace(/\\?sqrt\s*\(([^()]+)\)/gi, '\\sqrt{$1}');
  s = s.replace(/\\?sqrt\s*\{([^{}]+)\}/gi, '\\sqrt{$1}');
  s = s.replace(/\\?sqrt\s+([a-zA-Z0-9_]+)/gi, '\\sqrt{$1}');
  s = s.replace(/\\?sqrt([a-zA-Z0-9_]+)/gi, '\\sqrt{$1}');

  // 8. Greek symbols without backslashes
  s = s.replace(/(^|[^\\])\bpi\b/g, '$1\\pi');
  s = s.replace(/(^|[^\\])\bomega\b/g, '$1\\omega');
  s = s.replace(/(^|[^\\])\balpha\b/g, '$1\\alpha');
  s = s.replace(/(^|[^\\])\bbeta\b/g, '$1\\beta');
  s = s.replace(/(^|[^\\])\bdelta\b/g, '$1\\delta');
  s = s.replace(/(^|[^\\])\bDelta\b/g, '$1\\Delta');
  s = s.replace(/(^|[^\\])\blambda\b/g, '$1\\lambda');
  s = s.replace(/(^|[^\\])\btheta\b/g, '$1\\theta');
  s = s.replace(/(^|[^\\])\bphi\b/g, '$1\\phi');
  s = s.replace(/(^|[^\\])\bvarphi\b/g, '$1\\varphi');

  // 9. Simple fractions: \pi/2 or pi/2 -> \frac{\pi}{2}
  s = s.replace(/\\?pi\s*\/\s*(\d+)/gi, '\\frac{\\pi}{$1}');

  // 10. Multiplication symbol: * -> \cdot
  s = s.replace(/\*/g, ' \\cdot ');

  return s;
}

/**
 * Checks if a plain text string consists entirely or predominantly of a mathematical/physical formula.
 */
function isPureFormulaString(str: string): boolean {
  if (!str) return false;
  const s = str.trim();

  // If it contains Vietnamese words, check if it's mostly text or has a formula
  const hasVietnamese = /[àáảãạâấầẩẫậăắằẳẵặêếềểễệôốồổỗộơớờởỡợưứừửữựđ]/i.test(s) ||
    /\b(con|lắc|lò|xo|chu|kỳ|tần|số|dao|động|gia|tốc|vận|tốc|li|độ|biến|đổi|sớm|trễ|vuông|ngược|cùng|pha|so|với|là|được|tính|bằng|công|thức|nào|sau|đây|phương|án|đáp|án|kết|quả|giá|trị|hàm|tập|xác|định|đồ|thị|đạo|hàm|tích|phân)\b/i.test(s);

  if (hasVietnamese) return false;

  // Check if it matches formula structures
  const isEquation = /^\s*([a-zA-Z\\][a-zA-Z0-9_]*)\s*=\s*(.+)$/.test(s);
  const containsMathKeywords = /\b(sqrt|căn|pi|omega|alpha|beta|delta|frac|cos|sin|tan|cot|log|ln)\b/i.test(s) ||
    /\\(pi|omega|alpha|beta|delta|sqrt|frac|cos|sin|tan)\b/i.test(s) ||
    /[√πωαβΔφλθ\/\^\_\=\+\-\*]/.test(s);

  return isEquation || containsMathKeywords;
}

/**
 * Pre-processes text to automatically detect un-delimited math expressions
 * and wrap them in $...$ for KaTeX rendering, without touching regular Vietnamese words.
 */
function preprocessMathInText(rawText: string): string {
  if (!rawText) return '';

  const text = rawText.trim();

  // 1. If text is already delimited ($$, \[, $, \(), parse parts
  const mathRegex = /(\$\$.*?\$\$|\\\[.*?\\\]|\$.*?\$|\\\(.*?\\\))/gs;

  const parts: string[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = mathRegex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.slice(lastIdx, match.index));
    }
    parts.push(match[0]);
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < text.length) {
    parts.push(text.slice(lastIdx));
  }

  // Process each segment
  const processedParts = parts.map((part) => {
    // Already delimited block
    if (
      (part.startsWith('$$') && part.endsWith('$$')) ||
      (part.startsWith('\\[') && part.endsWith('\\]')) ||
      (part.startsWith('$') && part.endsWith('$')) ||
      (part.startsWith('\\(') && part.endsWith('\\)'))
    ) {
      const isDisplay = part.startsWith('$$') || part.startsWith('\\[');
      const inner = isDisplay
        ? part.startsWith('$$') ? part.slice(2, -2) : part.slice(2, -2)
        : part.startsWith('$') ? part.slice(1, -1) : part.slice(2, -2);

      const normalized = normalizeLatex(inner);
      return isDisplay ? `$$${normalized}$$` : `$${normalized}$`;
    }

    // Plain text segment: check if it's purely a formula or contains math tokens
    if (isPureFormulaString(part)) {
      const normalized = normalizeLatex(part);
      return `$${normalized}$`;
    }

    // Plain text with embedded math tokens (e.g. "Sớm pha pi/2 so với li độ" or "\omega = \sqrt{k/m}")
    let autoWrapped = part;

    // Wrap explicit embedded TeX commands like \pi, \omega, \sqrt{...}, \frac{...}{...} if not wrapped
    autoWrapped = autoWrapped.replace(/(\\?(?:pi|omega|alpha|beta|delta|Delta|lambda|theta|phi|varphi)\s*\/\s*\d+)/gi, (m) => `$${m}$`);
    autoWrapped = autoWrapped.replace(/(\b(căn|\\?sqrt)\s*[\(\{]?\s*[a-zA-Z0-9_]+\s*\/\s*[a-zA-Z0-9_]+\s*[\)\}]?)/gi, (m) => `$${m}$`);
    autoWrapped = autoWrapped.replace(/(\b[a-zA-Z]\s*=\s*(?:\\?sqrt|\\?frac|\\?pi|\\?omega|[0-9a-zA-Z_\\\/\{\}\(\)\+\-\*]+){3,})/gi, (m) => `$${m}$`);

    return autoWrapped;
  });

  return processedParts.join('');
}

export const MathText: React.FC<MathTextProps> = ({ text, className = '', inline = true }) => {
  if (!text) return null;

  const processedText = preprocessMathInText(text);

  const renderMath = (latex: string, isDisplay: boolean, keyStr: string) => {
    try {
      const normalizedLatex = normalizeLatex(latex.trim());
      const html = katex.renderToString(normalizedLatex, {
        displayMode: isDisplay,
        throwOnError: false,
        output: 'htmlAndMathml',
        trust: true,
      });
      return (
        <span
          key={keyStr}
          className={
            isDisplay
              ? 'my-3 block text-center overflow-x-auto font-sans text-slate-900 bg-slate-50/80 p-2.5 rounded-lg border border-slate-200'
              : 'inline-block px-1 align-middle font-sans text-slate-900 font-medium'
          }
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    } catch (err) {
      return (
        <span key={keyStr} className="font-serif italic font-semibold text-slate-900 px-1">
          {latex}
        </span>
      );
    }
  };

  const mathRegex = /(\$\$.*?\$\$|\\\[.*?\\\]|\$.*?\$|\\\(.*?\\\))/gs;
  const parts = processedText.split(mathRegex);

  const ContainerTag = inline ? 'span' : 'div';

  return (
    <ContainerTag className={`${className} inline-wrap`}>
      {parts.map((part, index) => {
        if (!part) return null;
        const keyStr = `part_${index}_${part.slice(0, 15)}`;

        if (part.startsWith('$$') && part.endsWith('$$') && part.length >= 4) {
          return renderMath(part.slice(2, -2), true, keyStr);
        }
        if (part.startsWith('\\[') && part.endsWith('\\]') && part.length >= 4) {
          return renderMath(part.slice(2, -2), true, keyStr);
        }
        if (part.startsWith('$') && part.endsWith('$') && part.length >= 2) {
          return renderMath(part.slice(1, -1), false, keyStr);
        }
        if (part.startsWith('\\(') && part.endsWith('\\)') && part.length >= 4) {
          return renderMath(part.slice(2, -2), false, keyStr);
        }

        return <span key={keyStr}>{part}</span>;
      })}
    </ContainerTag>
  );
};


