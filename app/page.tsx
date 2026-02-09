'use client';

import { useState } from 'react';
import LandingState from '@/components/LandingState';
import WorkingState from '@/components/WorkingState';
import type { DimensionKey } from '@/lib/types';

type AppState = 'landing' | 'working' | 'analyzing';

export default function Home() {
  const [currentState, setCurrentState] = useState<AppState>('landing');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [imageContext, setImageContext] = useState<string | undefined>(undefined);
  const [enabledDimensions, setEnabledDimensions] = useState<DimensionKey[]>([
    'visual', 'hierarchy', 'accessibility', 'interaction', 'ux', 'content'
  ]);

  const handleImageUpload = (images: string[], context?: string, dimensions?: DimensionKey[]) => {
    setUploadedImages(images);
    setImageContext(context);
    if (dimensions) {
      setEnabledDimensions(dimensions);
    }
    setCurrentState('analyzing');
  };

  const handleNewScreenshot = () => {
    setUploadedImages([]);
    setImageContext(undefined);
    setEnabledDimensions(['visual', 'hierarchy', 'accessibility', 'interaction', 'ux', 'content']);
    setCurrentState('landing');
  };

  const handleAnalysisComplete = () => {
    setCurrentState('working');
  };

  if (currentState === 'landing') {
    return <LandingState onImageUpload={handleImageUpload} />;
  }

  return (
    <WorkingState
      images={uploadedImages}
      context={imageContext}
      enabledDimensions={enabledDimensions}
      isInitialAnalysis={currentState === 'analyzing'}
      onAnalysisComplete={handleAnalysisComplete}
      onNewScreenshot={handleNewScreenshot}
    />
  );
}

