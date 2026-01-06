'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface LandingStateProps {
  onImageUpload: (dataUrl: string, context?: string) => void;
}

export default function LandingState({ onImageUpload }: LandingStateProps) {
  const [context, setContext] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setPreviewImage(dataUrl);
      };
      
      reader.readAsDataURL(file);
    }
  }, []);
  
  const handleSubmit = () => {
    if (previewImage) {
      onImageUpload(previewImage, context.trim() || undefined);
    }
  };
  
  const handleClearImage = () => {
    setPreviewImage(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
    },
    maxFiles: 1,
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
            Upload a screenshot to receive detailed design feedback
          </p>
        </div>

        {previewImage ? (
          /* Preview State - Show image, context input, and submit button */
          <div className="space-y-6">
            {/* Image Preview */}
            <div className="relative rounded-xl overflow-hidden border border-[#2F3134] bg-[#1f1f1f]">
              <img 
                src={previewImage} 
                alt="Screenshot preview" 
                className="w-full h-auto max-h-[400px] object-contain"
              />
              <button
                onClick={handleClearImage}
                className="absolute top-3 right-3 w-8 h-8 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-colors"
                title="Remove image"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
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
                placeholder="E.g., 'This is a checkout flow for an e-commerce app' or 'Mobile onboarding screen for new users'"
                className="w-full bg-[#252525] border border-[#2F3134] rounded-lg px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 resize-none"
                rows={2}
              />
              <p className="mt-1.5 text-xs text-gray-600">
                Adding context helps the AI give more relevant feedback
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
              Analyze Design
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
                  ? 'border-gray-600 bg-[#252525]'
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
                  ? 'Drop your screenshot here'
                  : 'Drag and drop a screenshot here, or click to browse'}
              </p>
              <p className="text-sm text-gray-500">
                Supports PNG, JPG, and WebP
              </p>
            </div>
          </div>
        )}

        {/* Footer hint */}
        {!previewImage && (
          <p className="text-sm text-gray-600 mt-6">
            Your screenshot will be analyzed by AI for design quality and best practices
          </p>
        )}
      </div>
    </div>
  );
}

