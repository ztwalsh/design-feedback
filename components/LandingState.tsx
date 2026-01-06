'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

const MAX_IMAGES = 4;

// Feedback dimensions that can be toggled
export type DimensionKey = 'visual' | 'hierarchy' | 'accessibility' | 'interaction' | 'ux' | 'content';

export interface DimensionConfig {
  key: DimensionKey;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const DIMENSIONS: DimensionConfig[] = [
  { 
    key: 'visual', 
    label: 'Visual', 
    description: 'Color, typography, spacing',
    icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><circle cx="13.5" cy="6.5" r="2.5" /><circle cx="6" cy="12" r="2" /><circle cx="18" cy="12" r="2" /><circle cx="8" cy="18" r="2" /><circle cx="16" cy="18" r="2" /></svg>
  },
  { 
    key: 'hierarchy', 
    label: 'Hierarchy', 
    description: 'Content organization',
    icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" /></svg>
  },
  { 
    key: 'accessibility', 
    label: 'A11y', 
    description: 'Contrast, legibility',
    icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><circle cx="12" cy="4" r="2" /><path d="M12 6v6" /><path d="M8 8l4 2 4-2" /><path d="M8 20l4-8 4 8" /></svg>
  },
  { 
    key: 'interaction', 
    label: 'Interaction', 
    description: 'Affordances, CTAs',
    icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M4 4l7.07 17 2.51-7.39L21 11.07z" /><path d="M15 15l6 6" /></svg>
  },
  { 
    key: 'ux', 
    label: 'UX', 
    description: 'Flow, cognitive load',
    icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M12 2a4 4 0 0 1 4 4v1a3 3 0 0 1 3 3 3 3 0 0 1-1.2 2.4" /><path d="M16 21v-4a2 2 0 0 0-4 0v4" /><path d="M8 21v-4a2 2 0 0 1 4 0" /><path d="M6.2 12.4A3 3 0 0 1 5 10a3 3 0 0 1 3-3V6a4 4 0 0 1 4-4" /><path d="M12 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" /></svg>
  },
  { 
    key: 'content', 
    label: 'Content', 
    description: 'Copy, microcopy, tone',
    icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
  },
];

interface LandingStateProps {
  onImageUpload: (images: string[], context?: string, enabledDimensions?: DimensionKey[]) => void;
}

export default function LandingState({ onImageUpload }: LandingStateProps) {
  const [context, setContext] = useState('');
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [enabledDimensions, setEnabledDimensions] = useState<Set<DimensionKey>>(
    new Set(DIMENSIONS.map(d => d.key))
  );
  
  const toggleDimension = (key: DimensionKey) => {
    setEnabledDimensions(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        // Don't allow disabling all dimensions
        if (next.size > 1) {
          next.delete(key);
        }
      } else {
        next.add(key);
      }
      return next;
    });
  };
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Limit to MAX_IMAGES total
    const filesToProcess = acceptedFiles.slice(0, MAX_IMAGES - previewImages.length);
    
    filesToProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setPreviewImages((prev) => {
          if (prev.length >= MAX_IMAGES) return prev;
          return [...prev, dataUrl];
        });
      };
      reader.readAsDataURL(file);
    });
  }, [previewImages.length]);
  
  const handleSubmit = () => {
    if (previewImages.length > 0) {
      onImageUpload(
        previewImages, 
        context.trim() || undefined,
        Array.from(enabledDimensions)
      );
    }
  };
  
  const handleRemoveImage = (index: number) => {
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
  };
  
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
    },
    maxFiles: MAX_IMAGES,
    noClick: previewImages.length > 0, // Disable click when we have images (use add button instead)
    noKeyboard: previewImages.length > 0,
  });

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-8 animate-fade-in">
      <div className="max-w-2xl w-full text-center">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Design Feedback
          </h1>
          <p className="text-xl text-gray-400">
            Upload screenshots to receive detailed design feedback
          </p>
        </div>

        {previewImages.length > 0 ? (
          /* Preview State - Show images, context input, and submit button */
          <div className="space-y-6">
            {/* Images Grid */}
            <div 
              {...getRootProps()}
              className={`rounded-xl border border-[#2F3134] bg-[#1f1f1f] p-4 ${isDragActive ? 'border-blue-500 bg-[#252525]' : ''}`}
            >
              <input {...getInputProps()} />
              <div className={`grid gap-3 ${previewImages.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {previewImages.map((img, index) => (
                  <div key={index} className="relative group rounded-lg overflow-hidden border border-[#2F3134]">
                    <img 
                      src={img} 
                      alt={`Screenshot ${index + 1}`} 
                      className="w-full h-auto max-h-[300px] object-contain bg-[#1a1a1a]"
                    />
                    {/* Image number badge */}
                    <div className="absolute top-2 left-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                      {index + 1}
                    </div>
                    {/* Remove button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemoveImage(index); }}
                      className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove image"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                
                {/* Add more images slot - compact */}
                {previewImages.length < MAX_IMAGES && (
                  <button
                    onClick={(e) => { e.stopPropagation(); open(); }}
                    className="flex flex-col items-center justify-center min-h-[80px] border-2 border-dashed border-[#2F3134] rounded-lg hover:border-gray-500 hover:bg-[#252525] transition-all duration-200"
                  >
                    <svg className="w-5 h-5 text-gray-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-xs text-gray-500">{previewImages.length}/{MAX_IMAGES}</span>
                  </button>
                )}
              </div>
            </div>
            
            {/* Context Input */}
            <div className="text-left">
              <label htmlFor="context" className="block text-sm font-medium text-gray-400 mb-2">
                Context <span className="text-gray-600">(optional)</span>
              </label>
              <textarea
                id="context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder={previewImages.length > 1 
                  ? "E.g., 'Compare these two checkout flows' or 'These are hover, active, and disabled states'" 
                  : "E.g., 'This is a checkout flow for an e-commerce app'"
                }
                className="w-full bg-[#252525] border border-[#2F3134] rounded-lg px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 resize-none"
                rows={2}
              />
              
              {/* Feedback Dimensions - compact attachment-style tags */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {DIMENSIONS.map((dim) => {
                  const isEnabled = enabledDimensions.has(dim.key);
                  return (
                    <button
                      key={dim.key}
                      onClick={() => toggleDimension(dim.key)}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-all duration-200 ${
                        isEnabled
                          ? 'bg-blue-600/20 text-blue-300 hover:bg-blue-600/30'
                          : 'bg-[#252525] text-gray-500 hover:text-gray-400'
                      }`}
                      title={dim.description}
                    >
                      <span className={`flex-shrink-0 [&>svg]:w-3 [&>svg]:h-3 ${isEnabled ? 'text-blue-400' : 'text-gray-600'}`}>{dim.icon}</span>
                      <span>{dim.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              className="w-full py-4 bg-white text-[#1a1a1a] text-base font-semibold rounded-xl hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Analyze {previewImages.length > 1 ? 'Designs' : 'Design'}
            </button>
          </div>
        ) : (
          /* Dropzone */
          <div
            {...getRootProps()}
            className={`
              relative border-2 border-dashed rounded-xl
              min-h-[400px] flex items-center justify-center
              cursor-pointer transition-all duration-200
              ${
                isDragActive
                  ? 'border-blue-500 bg-[#252525]'
                  : 'border-[#2F3134] bg-[#1f1f1f] hover:border-gray-600 hover:bg-[#252525]'
              }
            `}
          >
            <input {...getInputProps()} />
            <div className="px-8 py-16">
              {/* Upload Icon - Blue circle with white icon */}
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
              </div>

              {/* Text */}
              <p className="text-lg text-gray-300 mb-2">
                {isDragActive
                  ? 'Drop your screenshots here'
                  : 'Drag and drop screenshots here, or click to browse'}
              </p>
              <p className="text-sm text-gray-500">
                Upload 1-{MAX_IMAGES} images • PNG, JPG, WebP
              </p>
            </div>
          </div>
        )}

        {/* Footer hint */}
        {previewImages.length === 0 && (
          <p className="text-sm text-gray-600 mt-6">
            Upload multiple screenshots to compare designs or analyze different states
          </p>
        )}
      </div>
    </div>
  );
}

