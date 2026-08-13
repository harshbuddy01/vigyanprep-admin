import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathRendererProps {
  text: string;
  className?: string;
}

function formatImageUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  const driveMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
  }
  return trimmed;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ text, className = '' }) => {
  if (!text) return null;

  // First split by inline markdown images: ![alt](url) or [img:url] or {{url}}
  const imageRegex = /(!\[.*?\]\(.*?\)|\[img:.*?\]|\{\{https?:\/\/.*?\}\})/gs;
  const blocks = text.split(imageRegex);

  return (
    <span className={`inline-wrap ${className}`}>
      {blocks.map((block, bIdx) => {
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
};
