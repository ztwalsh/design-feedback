'use client';

import { useState } from 'react';
import { cleanContent } from '@/lib/utils';
import { trackReviewRequest } from '@/lib/analytics';
import type { Message, Assessment } from '@/lib/types';

interface ReviewRequestPanelProps {
  messages: Message[];
  assessment: Assessment;
  userContext?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReviewRequestPanel({
  messages,
  assessment,
  userContext,
  onClose,
  onSuccess,
}: ReviewRequestPanelProps) {
  const [reviewerHandle, setReviewerHandle] = useState('');
  const [designLink, setDesignLink] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerHandle.trim() || status === 'submitting') return;

    setStatus('submitting');
    setErrorMessage('');

    // Extract the first assistant message as the AI feedback summary
    const firstAssistantMessage = messages.find(m => m.role === 'assistant');
    const aiFeedbackSummary = firstAssistantMessage
      ? cleanContent(firstAssistantMessage.content)
      : '';

    try {
      const response = await fetch('/api/request-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewerSlackHandle: reviewerHandle.trim(),
          designLink: designLink.trim(),
          requesterNote: note.trim(),
          aiFeedbackSummary,
          assessmentRatings: assessment,
          userContext: userContext || '',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send review request');
      }

      trackReviewRequest(reviewerHandle.trim());
      setStatus('success');
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || 'Something went wrong');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="bg-[#252525] rounded-xl border border-[#2F3134] w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {status === 'success' ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Review Requested</h3>
            <p className="text-sm text-gray-400">
              A message has been sent to {reviewerHandle} in Slack.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Request Human Review</h3>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Reviewer Slack Handle <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={reviewerHandle}
                  onChange={(e) => setReviewerHandle(e.target.value)}
                  placeholder="@jane.smith"
                  required
                  className="w-full bg-[#1a1a1a] border border-[#2F3134] rounded-lg px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Link to Design
                </label>
                <input
                  type="url"
                  value={designLink}
                  onChange={(e) => setDesignLink(e.target.value)}
                  placeholder="https://your-app.com/page or link to screenshot"
                  className="w-full bg-[#1a1a1a] border border-[#2F3134] rounded-lg px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Note to Reviewer
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Any context or specific areas you'd like them to focus on..."
                  rows={3}
                  className="w-full bg-[#1a1a1a] border border-[#2F3134] rounded-lg px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent resize-none"
                />
              </div>

              {status === 'error' && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={!reviewerHandle.trim() || status === 'submitting'}
                className="w-full px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {status === 'submitting' ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send Review Request
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
