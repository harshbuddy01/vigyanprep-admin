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
    return 'https://lh3.googleusercontent.com/d/' + driveMatch[1];
  }
  return trimmed;
}

// Render Table Cell with Badge formatting
function renderTableCellContent(cell: string) {
  const trimmed = cell.replace(/^\*\*|\*\*$/g, '').trim();
  if (!trimmed) return null;

  const matchCol1 = trimmed.match(/^(\([A-D]\)|[A-D]\))\s*([\s\S]*)$/i);
  const matchCol2 = trimmed.match(/^(\([P-S]\)|[P-S]\))\s*([\s\S]*)$/i);

  if (matchCol1) {
    const badge = matchCol1[1].replace(/[^A-D]/gi, '').toUpperCase();
    const rest = matchCol1[2].trim();
    return (
      <div className="flex items-start gap-2">
        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold font-mono text-[11px] shrink-0 border border-amber-500/30">
          ({badge})
        </span>
        <div className="flex-1 leading-relaxed">
          <MathRenderer text={rest} />
        </div>
      </div>
    );
  }

  if (matchCol2) {
    const badge = matchCol2[1].replace(/[^P-S]/gi, '').toUpperCase();
    const rest = matchCol2[2].trim();
    return (
      <div className="flex items-start gap-2">
        <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-bold font-mono text-[11px] shrink-0 border border-blue-500/30">
          ({badge})
        </span>
        <div className="flex-1 leading-relaxed">
          <MathRenderer text={rest} />
        </div>
      </div>
    );
  }

  return <MathRenderer text={trimmed} />;
}

// Render Markdown Table (e.g. Matrix Match / List I & II)
function renderTableBlock(tableText: string, keyPrefix: string | number) {
  const lines = tableText.trim().split('\n').filter(l => l.trim().startsWith('|'));
  if (lines.length < 2) return null;

  const headerCells = lines[0].split('|').slice(1, -1).map(c => c.trim().replace(/^\*\*|\*\*$/g, ''));
  const dataLines = lines.filter((l, idx) => idx > 0 && !/^\|[\s\-:\|]+\|$/.test(l.trim()));
  const rows = dataLines
    .map(r => r.split('|').slice(1, -1).map(c => c.trim()))
    .filter(row => row.some(cell => cell.replace(/^(\(\w\)|[\*\s])+$/g, '').trim().length > 0));

  if (rows.length === 0) return null;

  return (
    <div key={keyPrefix} className="my-3.5 overflow-x-auto rounded-xl border border-zinc-700/80 bg-[#161720] shadow-lg">
      <table className="w-full text-left text-xs border-collapse min-w-[340px]">
        <thead>
          <tr className="bg-zinc-800/90 border-b border-zinc-700/80 text-amber-400 font-extrabold uppercase tracking-wider">
            {headerCells.map((h, i) => (
              <th key={i} className="py-2.5 px-4 font-bold border-r border-zinc-700/50 last:border-r-0">
                <MathRenderer text={h} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/80">
          {rows.map((row, rIdx) => (
            <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'}>
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="py-2.5 px-4 text-zinc-100 leading-relaxed border-r border-zinc-800/50 last:border-r-0 font-medium">
                  {renderTableCellContent(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Render formatted line/text chunk with inline math, KaTeX tokens & bold text
function renderInlineContent(rawChunk: string) {
  if (!rawChunk) return null;

  // Split strictly by single $ math and double $$ math without matching across $
  const parts = rawChunk.split(/(\$\$[^\$]+\$\$|\$[^\$\n\r]+\$|\*\*[^\*\n\r]+\*\*)/g);

  return (
    <>
      {parts.map((part: string, index: number) => {
        if (!part) return null;

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
        } else if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          const boldContent = part.slice(2, -2);
          return (
            <strong key={index} className="font-bold text-amber-200">
              {renderInlineContent(boldContent)}
            </strong>
          );
        } else {
          // Auto-detect math constructs even if dollar signs were omitted
          if (/\\(frac|sqrt|vec|int|sum|alpha|beta|gamma|delta|theta|omega|pi|rho|lambda|sigma|mu|epsilon|infty|rightarrow|times|partial|mathrm|mathbf|gg|ll|left|right|pm|approx|neq|le|ge|cdot|binom|limits)/.test(part) || /\^{[^{}]*}|_\{[^{}]*\}/.test(part)) {
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
    </>
  );
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
        <span className={'block my-1.5 text-center ' + className}>
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

    // Check for Markdown Table blocks
    const tableRegex = /(\n?\|[^\r\n]+\|[\r\n]+\|[\s\-:\|]+\|[\r\n]+(?:\|[^\r\n]+\|[\r\n]?)+)/g;
    if (tableRegex.test(rawString)) {
      const segments = rawString.split(tableRegex);
      return (
        <span className={'inline-wrap leading-relaxed ' + className}>
          {segments.map((seg: string, sIdx: number) => {
            if (!seg) return null;
            if (seg.trim().startsWith('|') && seg.includes('\n')) {
              return renderTableBlock(seg, sIdx);
            }
            return <MathRenderer key={sIdx} text={seg} className={className} />;
          })}
        </span>
      );
    }

    // Process line-by-line for structured numbered statements and clean paragraphs
    const lines = rawString.split(/\r?\n/);

    return (
      <div className={'space-y-2.5 leading-relaxed ' + className}>
        {lines.map((line: string, lIdx: number) => {
          const trimmedLine = line.trim();
          if (!trimmedLine) {
            return <div key={lIdx} className="h-1.5" />;
          }

          // Check if line is an image
          const imageRegex = /^(!\[(.*?)\]\((.*?)\)|\[(?:img|image):\s*(.*?)\]|\{\{(https?:\/\/.*?)\}\}|https?:\/\/[^\s]+\.(?:png|jpe?g|gif|webp|svg))$/i;
          const imgMatch = trimmedLine.match(imageRegex);
          if (imgMatch) {
            const rawUrl = imgMatch[3] || imgMatch[4] || imgMatch[5] || imgMatch[0];
            const alt = imgMatch[2] || 'Diagram';
            const formattedUrl = formatImageUrl(rawUrl);
            return (
              <div key={lIdx} className="my-3 text-center">
                <img
                  src={formattedUrl}
                  alt={alt}
                  className="max-h-72 mx-auto object-contain rounded-xl border border-amber-500/30 shadow-md bg-white/5 p-1.5"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            );
          }

          // Check if line is a numbered statement: "1. ", "1) ", "(1) ", "1 ", "Statement 1:", "I. ", "(i) "
          const statementMatch = trimmedLine.match(/^(\([0-9ivxIVX]+\)|[0-9ivxIVX]+[\.\)]|Statement\s+[0-9IVX]+:?|Assertion\s*\([A-Z]\):?|Reason\s*\([A-Z]\):?|\b[1-9]\b(?=\s+[A-Za-z]))\s*([\s\S]*)$/i);

          if (statementMatch) {
            const badge = statementMatch[1].trim();
            const content = statementMatch[2].trim();
            return (
              <div key={lIdx} className="flex items-start gap-3 my-2.5 pl-2 sm:pl-3.5 group">
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-extrabold font-mono text-xs shrink-0 border border-amber-500/30 shadow-xs">
                  {badge.endsWith(':') || badge.endsWith('.') || badge.endsWith(')') ? badge : badge + '.'}
                </span>
                <div className="flex-1 leading-relaxed text-zinc-100 font-medium">
                  {renderInlineContent(content)}
                </div>
              </div>
            );
          }

          // Standard paragraph line
          return (
            <p key={lIdx} className="leading-relaxed text-zinc-100">
              {renderInlineContent(trimmedLine)}
            </p>
          );
        })}
      </div>
    );
  } catch (err) {
    console.warn('MathRenderer safe fallback:', err);
    return <span className={'whitespace-pre-wrap ' + className}>{String(text || '')}</span>;
  }
};
