'use client';

import { useState } from 'react';
import LandingState from '@/components/LandingState';
import WorkingState from '@/components/WorkingState';

type AppState = 'landing' | 'working' | 'analyzing';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Home() {
  const [currentState, setCurrentState] = useState<AppState>('landing');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const handleImageUpload = (dataUrl: string) => {
    setUploadedImage(dataUrl);
    setCurrentState('analyzing');
  };

  const handleNewScreenshot = () => {
    setUploadedImage(null);
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
      isInitialAnalysis={currentState === 'analyzing'}
      onAnalysisComplete={handleAnalysisComplete}
      onNewScreenshot={handleNewScreenshot}
    />
  );
}

