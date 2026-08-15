import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathRendererProps {
  text: any;
  className?: string;
}

function formatImageUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  const driveMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
  }
  return trimmed;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ text, className = '' }) => {
  if (!text && text !== 0) return null;

  try {
    const rawString = typeof text === 'string'
      ? text
      : (typeof text === 'object' && text !== null ? (text.text || JSON.stringify(text)) : String(text || ''));

    const trimmedText = rawString.trim();
    if (!trimmedText) return null;

    // If the whole text is a bare image URL or drive link
    if (/^https?:\/\/[^\s]+$/i.test(trimmedText) && (
      /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(trimmedText) ||
      /googleusercontent\.com/i.test(trimmedText) ||
      /drive\.google\.com/i.test(trimmedText)
    )) {
      const formattedUrl = formatImageUrl(trimmedText);
      return (
        <span className={`block my-1.5 text-center ${className}`}>
          <img
            src={formattedUrl}
            alt="Option Diagram"
            className="max-h-36 mx-auto object-contain rounded-lg border border-zinc-700/60 shadow-sm bg-white/5 p-1"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </span>
      );
    }

    // First split by inline markdown images: ![alt](url) or [img:url] or {{url}}
    const imageRegex = /(!\[.*?\]\(.*?\)|\[img:.*?\]|\{\{https?:\/\/.*?\}\})/gs;
    const blocks = rawString.split(imageRegex);

    return (
      <span className={`inline-wrap ${className}`}>
        {blocks.map((block: string, bIdx: number) => {
          if (!block) return null;

          // Check if block is an image markdown
          const mdMatch = block.match(/^!\[(.*?)\]\((.*?)\)$/);
          const imgTagMatch = block.match(/^\[img:(.*?)\]$/);
          const curlyMatch = block.match(/^\{\{(https?:\/\/.*?)\}\}$/);

          const imgUrl = mdMatch ? mdMatch[2] : imgTagMatch ? imgTagMatch[1] : curlyMatch ? curlyMatch[1] : null;
          const altText = mdMatch ? mdMatch[1] : 'Diagram';

          if (imgUrl) {
            const formattedUrl = formatImageUrl(imgUrl);
            return (
              <span key={bIdx} className="block my-3 text-center">
                <img
                  src={formattedUrl}
                  alt={altText}
                  className="max-h-72 mx-auto object-contain rounded-xl border border-amber-500/30 shadow-md bg-white/5 p-1"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </span>
            );
          }

          // Split text block by math expressions
          const parts = block.split(/(\$\$.*?\$\$|\$.*?\$)/gs);

          return (
            <React.Fragment key={bIdx}>
              {parts.map((part: string, index: number) => {
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
                  } catch {
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
                  } catch {
                    return <code key={index} className="text-amber-400 font-mono">{part}</code>;
                  }
                } else {
                  // Auto-detect math constructs even if dollar signs were omitted
                  if (/\\(frac|sqrt|vec|int|sum|alpha|beta|gamma|delta|theta|omega|pi|rho|lambda|sigma|mu|epsilon|infty|rightarrow|times|partial|mathrm|mathbf|gg|ll|left|right|pm|approx|neq|le|ge|cdot|binom|limits)/.test(part) || /\^{[^{}]*}|\_{[^{}]*}/.test(part)) {
                    try {
                      const html = katex.renderToString(part, { displayMode: false, throwOnError: false });
                      return (
                        <span
                          key={index}
                          className="inline-block px-0.5"
                          dangerouslySetInnerHTML={{ __html: html }}
                        />
                      );
                    } catch {
                      return <span key={index}>{part}</span>;
                    }
                  }
                  return <span key={index}>{part}</span>;
                }
              })}
            </React.Fragment>
          );
        })}
      </span>
    );
  } catch (err) {
    console.warn('MathRenderer safe fallback:', err);
    return <span className={className}>{String(text || '')}</span>;
  }
};
