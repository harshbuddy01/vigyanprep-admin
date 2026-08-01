import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathRendererProps {
  text: string;
  className?: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ text, className = '' }) => {
  if (!text) return null;

  // Split by inline $...$ or block $$...$$ math expressions
  const parts = text.split(/(\$\$.*?\$\$|\$.*?\$)/gs);

  return (
    <span className={`inline-wrap ${className}`}>
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const math = part.slice(2, -2).trim();
          try {
            const html = katex.renderToString(math, { displayMode: true, throwOnError: false });
            return (
              <span
                key={index}
                className="my-2 block text-center overflow-x-auto py-1"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch (e) {
            return <code key={index} className="text-amber-400 font-mono">{part}</code>;
          }
        } else if (part.startsWith('$') && part.endsWith('$')) {
          const math = part.slice(1, -1).trim();
          try {
            const html = katex.renderToString(math, { displayMode: false, throwOnError: false });
            return (
              <span
                key={index}
                className="inline-block px-0.5"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch (e) {
            return <code key={index} className="text-amber-400 font-mono">{part}</code>;
          }
        } else {
          // Plain text - check if text contains inline raw LaTeX commands like \frac, \sqrt, \vec without $
          if (/\\(frac|sqrt|vec|int|sum|alpha|beta|gamma|theta|omega|pi|infty|rightarrow|times|partial|mathrm|mathbf)/.test(part)) {
            try {
              const html = katex.renderToString(part, { displayMode: false, throwOnError: false });
              return (
                <span
                  key={index}
                  className="inline-block px-0.5"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              );
            } catch (e) {
              return <span key={index}>{part}</span>;
            }
          }
          return <span key={index}>{part}</span>;
        }
      })}
    </span>
  );
};
