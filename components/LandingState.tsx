'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

const MAX_IMAGES = 4;

interface LandingStateProps {
  onImageUpload: (images: string[], context?: string) => void;
}

export default function LandingState({ onImageUpload }: LandingStateProps) {
  const [context, setContext] = useState('');
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  
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
      onImageUpload(previewImages, context.trim() || undefined);
    }
  };
  
  const handleRemoveImage = (index: number) => {
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
  };
  
  const handleClearAll = () => {
    setPreviewImages([]);
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
                
                {/* Add more images slot */}
                {previewImages.length < MAX_IMAGES && (
                  <button
                    onClick={(e) => { e.stopPropagation(); open(); }}
                    className="flex flex-col items-center justify-center min-h-[150px] border-2 border-dashed border-[#2F3134] rounded-lg hover:border-gray-500 hover:bg-[#252525] transition-all duration-200"
                  >
                    <svg className="w-8 h-8 text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-sm text-gray-500">Add more</span>
                    <span className="text-xs text-gray-600 mt-1">{previewImages.length}/{MAX_IMAGES}</span>
                  </button>
                )}
              </div>
            </div>
            
            {/* Action buttons row */}
            <div className="flex justify-between items-center">
              <button
                onClick={handleClearAll}
                className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                Clear all
              </button>
              <span className="text-sm text-gray-600">
                {previewImages.length} image{previewImages.length !== 1 ? 's' : ''} selected
              </span>
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
              <p className="mt-1.5 text-xs text-gray-600">
                {previewImages.length > 1 
                  ? "Describe what these images represent (states, versions, comparison, etc.)"
                  : "Adding context helps the AI give more relevant feedback"
                }
              </p>
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

