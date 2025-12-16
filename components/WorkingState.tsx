'use client';

import { useState, useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import AssessmentCard from './AssessmentCard';
import Spinner from './Spinner';
import { analyzeDesign, askFollowUpQuestion } from '@/app/actions';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Assessment {
  overall: 'Good' | 'Strong' | 'Fair' | 'Needs Work' | null;
  accessibility: 'Good' | 'Strong' | 'Fair' | 'Needs Work' | null;
}

interface WorkingStateProps {
  imageUrl: string;
  isInitialAnalysis: boolean;
  onAnalysisComplete: () => void;
  onNewScreenshot: () => void;
}

export default function WorkingState({
  imageUrl,
  isInitialAnalysis,
  onAnalysisComplete,
  onNewScreenshot,
}: WorkingStateProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzingInitial, setIsAnalyzingInitial] = useState(true); // Separate state for initial analysis
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [assessment, setAssessment] = useState<Assessment>({
    overall: null,
    accessibility: null,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageBase64Ref = useRef<string>('');
  const fullImageUrlRef = useRef<string>('');

  // Extract base64 from data URL
  useEffect(() => {
    if (imageUrl) {
      fullImageUrlRef.current = imageUrl;
      imageBase64Ref.current = imageUrl.split(',')[1];
    }
  }, [imageUrl]);

  // Perform initial analysis when component mounts
  useEffect(() => {
    if (isInitialAnalysis && imageBase64Ref.current) {
      performInitialAnalysis();
    }
  }, [isInitialAnalysis]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Extract assessment from feedback text
  const extractAssessment = (feedback: string): Assessment => {
    const lowerFeedback = feedback.toLowerCase();
    
    let overall: Assessment['overall'] = 'Strong';
    let accessibility: Assessment['accessibility'] = 'Good';
    
    // Simple heuristic - look for keywords
    if (lowerFeedback.includes('excellent') || lowerFeedback.includes('outstanding')) {
      overall = 'Strong';
    } else if (lowerFeedback.includes('good') || lowerFeedback.includes('solid')) {
      overall = 'Good';
    } else if (lowerFeedback.includes('fair') || lowerFeedback.includes('adequate')) {
      overall = 'Fair';
    } else if (lowerFeedback.includes('poor') || lowerFeedback.includes('needs work')) {
      overall = 'Needs Work';
    }
    
    if (lowerFeedback.includes('accessible') || lowerFeedback.includes('accessibility')) {
      accessibility = 'Good';
    }
    
    return { overall, accessibility };
  };

  const performInitialAnalysis = async () => {
    setIsLoading(true);
    setIsAnalyzingInitial(true);
    
    console.log('🚀 Starting analysis...');
    console.log('   Image URL length:', imageUrl?.length);
    console.log('   Base64 length:', imageBase64Ref.current?.length);
    console.log('   Full URL preview:', fullImageUrlRef.current?.substring(0, 50));
    
    try {
      console.log('📤 Calling analyzeDesign...');
      const feedback = await analyzeDesign(imageBase64Ref.current, fullImageUrlRef.current);
      
      console.log('✅ Got response:', feedback.substring(0, 100));
      
      // Extract assessment ratings
      const ratings = extractAssessment(feedback);
      setAssessment(ratings);
      
      setMessages([
        {
          role: 'assistant',
          content: feedback,
        },
      ]);
      
      onAnalysisComplete();
    } catch (error) {
      console.error('❌ Error in performInitialAnalysis:', error);
      setMessages([
        {
          role: 'assistant',
          content: `Error details: ${error instanceof Error ? error.message : String(error)}\n\nPlease check the browser console for more information.`,
        },
      ]);
      onAnalysisComplete();
    } finally {
      setIsLoading(false);
      setIsAnalyzingInitial(false); // Initial analysis complete
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputValue.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const question = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await askFollowUpQuestion(
        imageBase64Ref.current,
        fullImageUrlRef.current,
        messages,
        question
      );

      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      
      // Note: We don't update assessment here - only on initial analysis
    } catch (error) {
      console.error('Error asking follow-up question:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, there was an error processing your question. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-screen bg-[#1a1a1a] flex overflow-hidden">
      {/* Image Modal */}
      {isImageModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8 animate-fade-in"
          onClick={() => setIsImageModalOpen(false)}
        >
          {/* Close button */}
          <button
            onClick={() => setIsImageModalOpen(false)}
            className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors duration-200"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* Image */}
          <img
            src={imageUrl}
            alt="Screenshot full view"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Left Panel - Image + Assessment */}
      <div className="w-[45%] p-8 flex flex-col gap-6 overflow-y-auto">
        {/* New Screenshot Button */}
        <div className="flex justify-between items-center flex-shrink-0">
          <h1 className="text-2xl font-semibold text-white">Design Feedback</h1>
          <button
            onClick={onNewScreenshot}
            className="px-4 py-2 text-sm font-medium text-[#1a1a1a] bg-white rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            New Screenshot
          </button>
        </div>

        {/* Image Display - Clickable to open modal */}
        <div className="flex-shrink-0 cursor-pointer group relative" onClick={() => setIsImageModalOpen(true)}>
          <img
            src={imageUrl}
            alt="Uploaded screenshot"
            className="w-full h-auto rounded-[5px] transition-opacity duration-200 group-hover:opacity-90"
          />
          {/* Hover overlay hint */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/20 rounded-[5px]">
            <div className="bg-white/90 px-4 py-2 rounded-lg flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
              <span className="text-sm font-medium text-gray-900">Click to enlarge</span>
            </div>
          </div>
        </div>

        {/* Assessment Cards - Swapped order */}
        <div className="grid grid-cols-2 gap-4 flex-shrink-0">
          <AssessmentCard 
            label="Overall" 
            rating={assessment.overall} 
            type="overall"
            isLoading={isAnalyzingInitial}
          />
          <AssessmentCard 
            label="Accessibility" 
            rating={assessment.accessibility} 
            type="accessibility"
            isLoading={isAnalyzingInitial}
          />
        </div>

        {/* Footer Text */}
        <p className="text-sm text-gray-600 flex-shrink-0">
          AI-powered analysis of your design based on industry best practices, accessibility standards, and modern UI/UX principles.
        </p>
      </div>

      {/* Right Panel - Chat */}
      <div className="flex-1 flex flex-col bg-[#1a1a1a] h-screen">
        {/* Chat Header with Avatar */}
        <div className="px-8 py-6 border-b border-[#2F3134] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Design Assistant</h2>
              <p className="text-sm text-gray-400">I've analyzed your design. Here's my feedback:</p>
            </div>
          </div>
        </div>

        {/* Messages Area - Fixed height with scroll */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 chat-scroll">
          {messages.map((message, index) => (
            <ChatMessage
              key={index}
              role={message.role}
              content={message.content}
            />
          ))}
          {isLoading && (
            <div className="flex justify-center">
              <div className="py-3">
                <Spinner size="md" className="text-gray-500" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="px-8 py-6 border-t border-[#2F3134] flex-shrink-0">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a follow-up question..."
              disabled={isLoading}
              className="flex-1 bg-[#2a2a2a] border border-[#2F3134] rounded-lg px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent transition-all duration-200 disabled:opacity-50"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="px-6 py-3 bg-white text-[#1a1a1a] text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

