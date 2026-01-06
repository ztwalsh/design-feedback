'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Strip internal rating markers from displayed content
 */
function cleanContent(content: string): string {
  return content
    // Remove the entire ratings code block
    .replace(/```\s*\n(?:RATING_\w+:.*\n)+```/gi, '')
    // Remove individual rating lines
    .replace(/RATING_(?:OVERALL|VISUAL_DESIGN|HIERARCHY|ACCESSIBILITY|INTERACTION|UX):\s*(?:Strong|Good|Fair|Needs Work)/gi, '')
    .trim();
}

export default function ChatMessage({ role, content }: ChatMessageProps) {
  const displayContent = role === 'assistant' ? cleanContent(content) : content;
  
  if (role === 'user') {
    return (
      <div className="flex justify-end animate-fade-in">
        <div className="max-w-[80%] bg-[#252525] text-gray-100 rounded-xl px-4 py-3 border border-[#2F3134]">
          <p className="text-sm leading-relaxed">{content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start animate-fade-in">
      <div className="max-w-[85%] text-gray-100 px-4 py-4">
        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h2: ({ children }) => (
                <h2 className="text-lg font-semibold text-gray-100 mt-4 mb-3 first:mt-0">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-base font-semibold text-gray-100 mt-3 mb-2">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="text-sm text-gray-200 leading-relaxed mb-3 last:mb-0">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside space-y-1 mb-3 text-sm text-gray-200">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside space-y-1 mb-3 text-sm text-gray-200">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="text-sm text-gray-200 leading-relaxed">
                  {children}
                </li>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-gray-100">
                  {children}
                </strong>
              ),
              code: ({ children }) => (
                <code className="bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded text-xs font-mono">
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre className="bg-gray-800 text-gray-300 p-3 rounded-lg overflow-x-auto mb-3">
                  {children}
                </pre>
              ),
            }}
          >
            {displayContent}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

