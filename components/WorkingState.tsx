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

type Rating = 'Good' | 'Strong' | 'Fair' | 'Needs Work' | null;

interface Assessment {
  overall: Rating;
  visualDesign: Rating;
  hierarchy: Rating;
  accessibility: Rating;
  interaction: Rating;
  ux: Rating;
  content: Rating;
}

type DimensionKey = 'visual' | 'hierarchy' | 'accessibility' | 'interaction' | 'ux' | 'content';

interface WorkingStateProps {
  images: string[];
  context?: string;
  enabledDimensions: DimensionKey[];
  isInitialAnalysis: boolean;
  onAnalysisComplete: () => void;
  onNewScreenshot: () => void;
}

export default function WorkingState({
  images: initialImages,
  context,
  enabledDimensions,
  isInitialAnalysis,
  onAnalysisComplete,
  onNewScreenshot,
}: WorkingStateProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzingInitial, setIsAnalyzingInitial] = useState(true);
  const [modalImageIndex, setModalImageIndex] = useState<number | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [allImages, setAllImages] = useState<string[]>(initialImages);
  const [assessment, setAssessment] = useState<Assessment>({
    overall: null,
    visualDesign: null,
    hierarchy: null,
    accessibility: null,
    interaction: null,
    ux: null,
    content: null,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasStartedAnalysis = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Store processed image data for API calls
  const imageDataRef = useRef<Array<{ base64: string; fullUrl: string }>>([]);

  // Single effect: extract base64 and perform initial analysis
  useEffect(() => {
    if (!isInitialAnalysis || hasStartedAnalysis.current || allImages.length === 0) {
      return;
    }
    
    // Mark as started to prevent double-runs
    hasStartedAnalysis.current = true;
    
    // Extract and store base64 for all images
    const imageData = allImages.map(img => ({
      base64: img.split(',')[1],
      fullUrl: img,
    }));
    imageDataRef.current = imageData;
    
    // Start analysis with all images
    performInitialAnalysis(imageData, context, enabledDimensions);
  }, [isInitialAnalysis, allImages, context, enabledDimensions]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Extract assessment from feedback text using explicit rating markers
  const extractAssessment = (feedback: string): Assessment => {
    const validRatings = ['Strong', 'Good', 'Fair', 'Needs Work'] as const;
    
    const parseRating = (key: string): Rating => {
      const regex = new RegExp(`RATING_${key}:\\s*(Strong|Good|Fair|Needs Work)`, 'i');
      const match = feedback.match(regex);
      if (match) {
        return validRatings.find(r => r.toLowerCase() === match[1].toLowerCase()) || null;
      }
      return null;
    };
    
    return {
      overall: parseRating('OVERALL'),
      visualDesign: parseRating('VISUAL_DESIGN'),
      hierarchy: parseRating('HIERARCHY'),
      accessibility: parseRating('ACCESSIBILITY'),
      interaction: parseRating('INTERACTION'),
      ux: parseRating('UX'),
      content: parseRating('CONTENT'),
    };
  };

  // Deep dive prompts for each category
  const categoryPrompts: Record<string, string> = {
    visual: "Give me a detailed deep-dive on the **Visual Design** of this screenshot. Focus on: color choices and palette harmony, typography selection and hierarchy, spacing and whitespace usage, imagery and iconography, overall aesthetic coherence and brand consistency. What's working well and what specific improvements would elevate the visual design?",
    hierarchy: "Give me a detailed deep-dive on the **Information Hierarchy** of this screenshot. Focus on: content organization and structure, visual weight distribution, F-pattern or Z-pattern scanning flow, how the design guides user attention, clarity of primary vs secondary content. What's working well and what could be reorganized for better scannability?",
    accessibility: "Give me a detailed deep-dive on the **Accessibility** of this screenshot. Focus on: color contrast ratios, text legibility and sizing, touch/click target sizes, keyboard navigation considerations, screen reader compatibility concerns, cognitive load and clarity. What accessibility issues do you see and how should they be fixed?",
    interaction: "Give me a detailed deep-dive on the **Interaction Design** of this screenshot. Focus on: clarity of interactive elements, button and link affordances, hover/focus state expectations, feedback mechanisms, form design if applicable, call-to-action effectiveness. What's working well and what could be clearer for users?",
    ux: "Give me a detailed deep-dive on the **UX Efficacy** of this screenshot. Focus on: user flow clarity, cognitive load and mental effort required, task completion paths, error prevention, user confidence and trust signals, overall usability. What friction points exist and how could the experience be smoother?",
    content: "Give me a detailed deep-dive on the **Content** of this screenshot, referencing the content guidelines in the knowledge base. Focus on: clarity and conciseness of copy, tone and voice consistency, microcopy effectiveness (buttons, labels, placeholders), error message quality, use of active voice, reading level appropriateness, grammar and punctuation, casing and capitalization conventions. What content is working well and what specific copy improvements would you recommend based on content design best practices?",
  };

  const handleCategoryDeepDive = async (category: string, label: string) => {
    if (isLoading || !categoryPrompts[category]) return;
    
    const prompt = categoryPrompts[category];
    
    // Add the question to messages
    setMessages((prev) => [...prev, { role: 'user', content: `Deep dive: ${label}` }]);
    setIsLoading(true);
    
    try {
      // Use first image for follow-ups (or could use all)
      const primaryImage = imageDataRef.current[0];
      const response = await askFollowUpQuestion(
        primaryImage.base64,
        primaryImage.fullUrl,
        messages,
        prompt
      );
      
      setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Error getting deep dive:', error);
      setMessages((prev) => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, there was an error getting the detailed analysis. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle adding new images during conversation
  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const newImageData = {
          base64: dataUrl.split(',')[1],
          fullUrl: dataUrl,
        };
        
        setAllImages((prev) => [...prev, dataUrl]);
        imageDataRef.current = [...imageDataRef.current, newImageData];
      };
      reader.readAsDataURL(file);
    });
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const performInitialAnalysis = async (
    imageData: Array<{ base64: string; fullUrl: string }>, 
    userContext?: string,
    dimensions?: DimensionKey[]
  ) => {
    setIsLoading(true);
    setIsAnalyzingInitial(true);
    
    // Start with empty assistant message that we'll stream into
    setMessages([{ role: 'assistant', content: '' }]);
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: imageData,
          userContext: userContext,
          enabledDimensions: dimensions,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');
      
      const decoder = new TextDecoder();
      let fullText = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) {
                fullText += data.text;
                // Update message with streamed content
                setMessages([{ role: 'assistant', content: fullText }]);
                
                // Try to extract ratings as they stream in
                const ratings = extractAssessment(fullText);
                if (ratings.overall || ratings.visualDesign || ratings.accessibility) {
                  setAssessment(ratings);
                  // Once we have ratings, we can show them (stop loading cards)
                  if (ratings.overall && ratings.visualDesign && ratings.hierarchy && 
                      ratings.accessibility && ratings.interaction && ratings.ux && ratings.content) {
                    setIsAnalyzingInitial(false);
                  }
                }
              }
              if (data.done) {
                // Final extraction of ratings
                const finalRatings = extractAssessment(fullText);
                setAssessment(finalRatings);
                setIsAnalyzingInitial(false);
                setIsLoading(false);
                onAnalysisComplete();
              }
            } catch (e) {
              // Ignore JSON parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Error in performInitialAnalysis:', error);
      setMessages([
        {
          role: 'assistant',
          content: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ]);
      setIsAnalyzingInitial(false);
      setIsLoading(false);
      onAnalysisComplete();
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
      // Use first image for follow-ups
      const primaryImage = imageDataRef.current[0];
      const response = await askFollowUpQuestion(
        primaryImage.base64,
        primaryImage.fullUrl,
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
      {modalImageIndex !== null && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8 animate-fade-in"
          onClick={() => setModalImageIndex(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setModalImageIndex(null)}
            className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors duration-200"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* Navigation arrows for multiple images */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setModalImageIndex((modalImageIndex - 1 + allImages.length) % allImages.length); }}
                className="absolute left-6 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors duration-200"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setModalImageIndex((modalImageIndex + 1) % allImages.length); }}
                className="absolute right-6 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors duration-200"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
          
          {/* Image counter */}
          {allImages.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-2 rounded-full text-white text-sm">
              {modalImageIndex + 1} / {allImages.length}
            </div>
          )}
          
          {/* Image */}
          <img
            src={allImages[modalImageIndex]}
            alt={`Screenshot ${modalImageIndex + 1}`}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Left Panel - Images + Assessment */}
      <div className="w-[45%] p-8 flex flex-col gap-6 overflow-y-auto elegant-scroll">
        {/* Header */}
        <div className="flex justify-between items-center flex-shrink-0">
          <h1 className="text-2xl font-semibold text-white">Design Feedback</h1>
          <button
            onClick={onNewScreenshot}
            className="px-4 py-2 text-sm font-medium text-[#1a1a1a] bg-white rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            Start Over
          </button>
        </div>

        {/* Image Gallery */}
        <div className="flex-shrink-0">
          {/* Main selected image */}
          <div 
            className="cursor-pointer group relative mb-3" 
            onClick={() => setModalImageIndex(selectedImageIndex)}
          >
            <img
              src={allImages[selectedImageIndex]}
              alt={`Screenshot ${selectedImageIndex + 1}`}
              className="w-full h-auto rounded-lg transition-opacity duration-200 group-hover:opacity-90 border border-[#2F3134]"
            />
            {/* Image number badge */}
            {allImages.length > 1 && (
              <div className="absolute top-3 left-3 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold text-white">
                {selectedImageIndex + 1}
              </div>
            )}
            {/* Hover overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/20 rounded-lg">
              <div className="bg-white/90 px-4 py-2 rounded-lg flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
                <span className="text-sm font-medium text-gray-900">Click to enlarge</span>
              </div>
            </div>
          </div>
          
          {/* Thumbnail strip (if multiple images) */}
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {allImages.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImageIndex === index 
                      ? 'border-blue-500' 
                      : 'border-[#2F3134] hover:border-gray-500'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute top-1 left-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                    {index + 1}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Assessment Cards Grid */}
        <div className="flex flex-col gap-3 flex-shrink-0">
          {/* Overall - Full width, larger */}
          <AssessmentCard 
            label="Overall" 
            rating={assessment.overall} 
            type="overall"
            isLoading={isAnalyzingInitial}
            isLarge
          />
          
          {/* Sub-categories - 3 column grid, clickable for deep dive */}
          <div className="grid grid-cols-3 gap-3">
            <AssessmentCard 
              label="Visual Design" 
              rating={assessment.visualDesign} 
              type="visual"
              isLoading={isAnalyzingInitial && enabledDimensions.includes('visual')}
              isClickable={!isAnalyzingInitial && !isLoading && enabledDimensions.includes('visual')}
              isDisabled={!enabledDimensions.includes('visual')}
              onClick={() => handleCategoryDeepDive('visual', 'Visual Design')}
            />
            <AssessmentCard 
              label="Hierarchy" 
              rating={assessment.hierarchy} 
              type="hierarchy"
              isLoading={isAnalyzingInitial && enabledDimensions.includes('hierarchy')}
              isClickable={!isAnalyzingInitial && !isLoading && enabledDimensions.includes('hierarchy')}
              isDisabled={!enabledDimensions.includes('hierarchy')}
              onClick={() => handleCategoryDeepDive('hierarchy', 'Information Hierarchy')}
            />
            <AssessmentCard 
              label="Accessibility" 
              rating={assessment.accessibility} 
              type="accessibility"
              isLoading={isAnalyzingInitial && enabledDimensions.includes('accessibility')}
              isClickable={!isAnalyzingInitial && !isLoading && enabledDimensions.includes('accessibility')}
              isDisabled={!enabledDimensions.includes('accessibility')}
              onClick={() => handleCategoryDeepDive('accessibility', 'Accessibility')}
            />
            <AssessmentCard 
              label="Interaction" 
              rating={assessment.interaction} 
              type="interaction"
              isLoading={isAnalyzingInitial && enabledDimensions.includes('interaction')}
              isClickable={!isAnalyzingInitial && !isLoading && enabledDimensions.includes('interaction')}
              isDisabled={!enabledDimensions.includes('interaction')}
              onClick={() => handleCategoryDeepDive('interaction', 'Interaction Design')}
            />
            <AssessmentCard 
              label="UX Efficacy" 
              rating={assessment.ux} 
              type="ux"
              isLoading={isAnalyzingInitial && enabledDimensions.includes('ux')}
              isClickable={!isAnalyzingInitial && !isLoading && enabledDimensions.includes('ux')}
              isDisabled={!enabledDimensions.includes('ux')}
              onClick={() => handleCategoryDeepDive('ux', 'UX Efficacy')}
            />
            <AssessmentCard 
              label="Content" 
              rating={assessment.content} 
              type="content"
              isLoading={isAnalyzingInitial && enabledDimensions.includes('content')}
              isClickable={!isAnalyzingInitial && !isLoading && enabledDimensions.includes('content')}
              isDisabled={!enabledDimensions.includes('content')}
              onClick={() => handleCategoryDeepDive('content', 'Content')}
            />
          </div>
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
          {/* Hidden file input for adding images */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            onChange={handleAddImage}
            className="hidden"
          />
          
          <div className="flex gap-3">
            {/* Attach image button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="px-3 py-3 bg-[#2a2a2a] border border-[#2F3134] text-gray-400 rounded-lg hover:bg-[#333] hover:text-gray-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Add another screenshot"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a follow-up question or add context about new images..."
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

