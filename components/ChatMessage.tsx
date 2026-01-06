'use client';

import { useState } from 'react';
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
    .replace(/RATING_(?:OVERALL|VISUAL_DESIGN|HIERARCHY|ACCESSIBILITY|INTERACTION|UX|CONTENT):\s*(?:Strong|Good|Fair|Needs Work)/gi, '')
    .trim();
}

/**
 * Format feedback as a Cursor-friendly revision prompt
 */
function formatAsPrompt(content: string): string {
  const cleaned = cleanContent(content);
  return `Based on this design feedback, please make the following revisions:

${cleaned}

Please implement these changes while maintaining the existing code structure and style.`;
}

// Copy icon SVG
const CopyIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

// Check icon SVG
const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

export default function ChatMessage({ role, content }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const displayContent = role === 'assistant' ? cleanContent(content) : content;
  
  const handleCopyAsPrompt = async () => {
    const prompt = formatAsPrompt(content);
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
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
    <div className="flex justify-start animate-fade-in group">
      <div className="max-w-[85%] text-gray-100 px-4 py-4 relative">
        {/* Copy as Prompt button */}
        <button
          onClick={handleCopyAsPrompt}
          className={`absolute -top-1 right-0 flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
            copied 
              ? 'bg-green-600 text-white' 
              : 'bg-[#252525] text-gray-400 border border-[#2F3134] opacity-0 group-hover:opacity-100 hover:bg-[#2a2a2a] hover:text-gray-200'
          }`}
          title="Copy as revision prompt for Cursor"
        >
          {copied ? (
            <>
              <CheckIcon />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <CopyIcon />
              <span>Copy as prompt</span>
            </>
          )}
        </button>
        
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

