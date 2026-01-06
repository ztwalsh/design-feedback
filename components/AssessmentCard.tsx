'use client';

import { useState } from 'react';
import Spinner from './Spinner';

type CardType = 'overall' | 'visual' | 'hierarchy' | 'accessibility' | 'interaction' | 'ux' | 'content';

// Tooltip descriptions for each category
const categoryTooltips: Record<CardType, string> = {
  overall: 'Synthesized score across all design dimensions',
  visual: 'Color, typography, spacing, imagery, and aesthetic coherence',
  hierarchy: 'Content organization, visual weight, and attention flow',
  accessibility: 'Contrast, legibility, touch targets, and inclusive design',
  interaction: 'Interactive elements, affordances, and feedback clarity',
  ux: 'User flow, cognitive load, and task completion paths',
  content: 'Copy clarity, tone, microcopy, and content best practices',
};

interface AssessmentCardProps {
  label: string;
  rating: 'Good' | 'Strong' | 'Fair' | 'Needs Work' | null;
  type: CardType;
  isLoading?: boolean;
  isLarge?: boolean;
  onClick?: () => void;
  isClickable?: boolean;
}

// SVG icons matching the Design Assistant style (stroke-based)
const TypeIcon = ({ type, className = "w-4 h-4" }: { type: CardType; className?: string }) => {
  const iconProps = {
    className,
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (type) {
    case 'overall':
      // Chart/stats icon
      return (
        <svg {...iconProps}>
          <path d="M3 3v18h18" />
          <path d="M18 17V9" />
          <path d="M13 17V5" />
          <path d="M8 17v-3" />
        </svg>
      );
    case 'visual':
      // Palette/design icon
      return (
        <svg {...iconProps}>
          <circle cx="13.5" cy="6.5" r="2.5" />
          <circle cx="6" cy="12" r="2" />
          <circle cx="18" cy="12" r="2" />
          <circle cx="8" cy="18" r="2" />
          <circle cx="16" cy="18" r="2" />
        </svg>
      );
    case 'hierarchy':
      // Layout/structure icon
      return (
        <svg {...iconProps}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18" />
          <path d="M9 21V9" />
        </svg>
      );
    case 'accessibility':
      // Universal access icon
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="4" r="2" />
          <path d="M12 6v6" />
          <path d="M8 8l4 2 4-2" />
          <path d="M8 20l4-8 4 8" />
        </svg>
      );
    case 'interaction':
      // Cursor/click icon
      return (
        <svg {...iconProps}>
          <path d="M4 4l7.07 17 2.51-7.39L21 11.07z" />
          <path d="M15 15l6 6" />
        </svg>
      );
    case 'ux':
      // Brain/thinking icon
      return (
        <svg {...iconProps}>
          <path d="M12 2a4 4 0 0 1 4 4v1a3 3 0 0 1 3 3 3 3 0 0 1-1.2 2.4" />
          <path d="M16 21v-4a2 2 0 0 0-4 0v4" />
          <path d="M8 21v-4a2 2 0 0 1 4 0" />
          <path d="M6.2 12.4A3 3 0 0 1 5 10a3 3 0 0 1 3-3V6a4 4 0 0 1 4-4" />
          <path d="M12 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
        </svg>
      );
    case 'content':
      // Pencil/edit icon for content/writing
      return (
        <svg {...iconProps}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      );
    default:
      return null;
  }
};

export default function AssessmentCard({ 
  label, 
  rating, 
  type, 
  isLoading = false, 
  isLarge = false,
  onClick,
  isClickable = false,
}: AssessmentCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const ratingColors = {
    'Good': 'text-green-400',
    'Strong': 'text-emerald-400',
    'Fair': 'text-yellow-400',
    'Needs Work': 'text-red-400',
  };

  const tooltip = categoryTooltips[type];

  if (isLarge) {
    return (
      <div 
        className="bg-[#252525] border border-[#2F3134] rounded-xl p-5 col-span-full relative"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <TypeIcon type={type} className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400 font-medium">{label}</span>
              <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth={2} />
                <path strokeWidth={2} d="M12 16v-4M12 8h.01" />
              </svg>
            </div>
          </div>
          {isLoading ? (
            <Spinner size="md" className="text-gray-500" />
          ) : rating ? (
            <div className={`text-2xl font-bold ${ratingColors[rating]}`}>
              {rating}
            </div>
          ) : (
            <div className="text-2xl font-bold text-gray-600">—</div>
          )}
        </div>
        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute left-0 top-full mt-2 z-10 px-3 py-2 bg-[#1a1a1a] border border-[#2F3134] rounded-lg shadow-lg max-w-xs">
            <p className="text-xs text-gray-300">{tooltip}</p>
          </div>
        )}
      </div>
    );
  }

  const clickableStyles = isClickable && !isLoading
    ? 'cursor-pointer hover:bg-[#2a2a2a] hover:border-[#3a3a3a] transition-all duration-200 group'
    : '';

  return (
    <div 
      className={`bg-[#252525] border border-[#2F3134] rounded-xl p-4 relative ${clickableStyles}`}
      onClick={isClickable && !isLoading ? onClick : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable && !isLoading ? 0 : undefined}
      onKeyDown={isClickable && !isLoading ? (e) => e.key === 'Enter' && onClick?.() : undefined}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex items-center gap-2 mb-2">
        <TypeIcon type={type} className={`w-4 h-4 text-gray-500 ${isClickable ? 'group-hover:text-gray-400' : ''}`} />
        <span className={`text-xs text-gray-500 font-medium ${isClickable ? 'group-hover:text-gray-400' : ''}`}>{label}</span>
        <svg className="w-3 h-3 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" strokeWidth={2} />
          <path strokeWidth={2} d="M12 16v-4M12 8h.01" />
        </svg>
        {isClickable && !isLoading && (
          <svg className="w-3 h-3 text-gray-600 ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>
      {isLoading ? (
        <div className="flex items-center h-7">
          <Spinner size="sm" className="text-gray-500" />
        </div>
      ) : rating ? (
        <div className={`text-lg font-semibold ${ratingColors[rating]}`}>
          {rating}
        </div>
      ) : (
        <div className="text-lg font-semibold text-gray-600">—</div>
      )}
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute left-0 top-full mt-2 z-10 px-3 py-2 bg-[#1a1a1a] border border-[#2F3134] rounded-lg shadow-lg max-w-[200px]">
          <p className="text-xs text-gray-300">{tooltip}</p>
          {isClickable && <p className="text-xs text-gray-500 mt-1">Click for deep dive</p>}
        </div>
      )}
    </div>
  );
}

