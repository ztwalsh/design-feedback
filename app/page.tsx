'use client';

import { useState } from 'react';
import LandingState from '@/components/LandingState';
import WorkingState from '@/components/WorkingState';

type AppState = 'landing' | 'working' | 'analyzing';

export default function Home() {
  const [currentState, setCurrentState] = useState<AppState>('landing');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [imageContext, setImageContext] = useState<string | undefined>(undefined);

  const handleImageUpload = (images: string[], context?: string) => {
    setUploadedImages(images);
    setImageContext(context);
    setCurrentState('analyzing');
  };

  const handleNewScreenshot = () => {
    setUploadedImages([]);
    setImageContext(undefined);
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
      isInitialAnalysis={currentState === 'analyzing'}
      onAnalysisComplete={handleAnalysisComplete}
      onNewScreenshot={handleNewScreenshot}
    />
  );
}

