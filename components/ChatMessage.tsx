'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cleanContent } from '@/lib/utils';
import { trackCopyPrompt } from '@/lib/analytics';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  onExplain?: (selectedText: string) => void;
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

// Explain icon SVG
const ExplainIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </svg>
);

export default function ChatMessage({ role, content, onExplain }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const displayContent = role === 'assistant' ? cleanContent(content) : content;
  
  // Only show copy button when there's meaningful content (not during initial streaming)
  const hasEnoughContent = displayContent.length > 50;
  
  // Handle text selection
  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !messageRef.current) {
        setSelectedText(null);
        setTooltipPosition(null);
        return;
      }
      
      const text = selection.toString().trim();
      if (text.length < 10) {
        // Ignore very short selections
        setSelectedText(null);
        setTooltipPosition(null);
        return;
      }
      
      // Check if selection is within this message
      const range = selection.getRangeAt(0);
      if (!messageRef.current.contains(range.commonAncestorContainer)) {
        setSelectedText(null);
        setTooltipPosition(null);
        return;
      }
      
      // Get position for tooltip
      const rect = range.getBoundingClientRect();
      const messageRect = messageRef.current.getBoundingClientRect();
      
      setSelectedText(text);
      setTooltipPosition({
        x: rect.left + rect.width / 2 - messageRect.left,
        y: rect.top - messageRect.top - 8,
      });
    };
    
    const handleMouseDown = (e: MouseEvent) => {
      // Close tooltip if clicking outside of it
      const target = e.target as HTMLElement;
      if (!target.closest('.explain-tooltip')) {
        setSelectedText(null);
        setTooltipPosition(null);
      }
    };
    
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);
  
  const handleExplain = () => {
    if (selectedText && onExplain) {
      onExplain(selectedText);
      // Hide the tooltip but keep the text highlighted so user can see what they selected
      setTooltipPosition(null);
      // Don't clear selectedText or the browser selection - let it stay visible
    }
  };
  
  const handleCopyAsPrompt = async () => {
    const prompt = formatAsPrompt(content);
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      // Track copy event
      trackCopyPrompt();
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
      <div ref={messageRef} className="max-w-[85%] text-gray-100 px-4 py-4 relative">
        {/* Explain tooltip */}
        {selectedText && tooltipPosition && onExplain && (
          <div 
            className="explain-tooltip absolute z-50 animate-fade-in"
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <button
              onClick={handleExplain}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg shadow-lg hover:bg-blue-700 transition-colors duration-150"
            >
              <ExplainIcon />
              <span>Explain</span>
            </button>
            {/* Arrow */}
            <div 
              className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-blue-600"
            />
          </div>
        )}
        
        {/* Copy as Prompt button - only show when there's meaningful content */}
        {hasEnoughContent && (
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
        )}
        
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

