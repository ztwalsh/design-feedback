'use client';

import { useState } from 'react';
import LandingState from '@/components/LandingState';
import WorkingState from '@/components/WorkingState';

type AppState = 'landing' | 'working' | 'analyzing';

export default function Home() {
  const [currentState, setCurrentState] = useState<AppState>('landing');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageContext, setImageContext] = useState<string | undefined>(undefined);

  const handleImageUpload = (dataUrl: string, context?: string) => {
    setUploadedImage(dataUrl);
    setImageContext(context);
    setCurrentState('analyzing');
  };

  const handleNewScreenshot = () => {
    setUploadedImage(null);
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
      imageUrl={uploadedImage!}
      context={imageContext}
      isInitialAnalysis={currentState === 'analyzing'}
      onAnalysisComplete={handleAnalysisComplete}
      onNewScreenshot={handleNewScreenshot}
    />
  );
}

