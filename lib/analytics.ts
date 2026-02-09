/**
 * Google Analytics helper functions
 * Track user interactions and events
 */

// Type definitions for gtag
declare global {
  interface Window {
    gtag?: (
      command: 'event' | 'config' | 'js',
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
  }
}

/**
 * Check if GA is loaded
 */
function isGAEnabled(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
}

/**
 * Track a custom event
 */
export function trackEvent(
  eventName: string,
  eventParams?: Record<string, any>
): void {
  if (!isGAEnabled()) {
    console.debug('GA not loaded, skipping event:', eventName, eventParams);
    return;
  }

  window.gtag!('event', eventName, eventParams);
}

/**
 * Track page views (useful for client-side navigation)
 */
export function trackPageView(url: string): void {
  if (!isGAEnabled()) return;

  window.gtag!('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
    page_path: url,
  });
}

// ===========================================
// Specific Event Tracking Functions
// ===========================================

/**
 * Track when user uploads images
 */
export function trackImageUpload(imageCount: number, hasContext: boolean): void {
  trackEvent('image_upload', {
    image_count: imageCount,
    has_context: hasContext,
    category: 'engagement',
  });
}

/**
 * Track when analysis starts
 */
export function trackAnalysisStart(
  imageCount: number,
  enabledDimensions: string[]
): void {
  trackEvent('analysis_start', {
    image_count: imageCount,
    dimension_count: enabledDimensions.length,
    dimensions: enabledDimensions.join(','),
    category: 'analysis',
  });
}

/**
 * Track when analysis completes successfully
 */
export function trackAnalysisComplete(
  imageCount: number,
  duration: number,
  overallRating?: string
): void {
  trackEvent('analysis_complete', {
    image_count: imageCount,
    duration_seconds: Math.round(duration / 1000),
    overall_rating: overallRating || 'unknown',
    category: 'analysis',
  });
}

/**
 * Track when user requests a deep dive
 */
export function trackDeepDive(dimension: string): void {
  trackEvent('deep_dive_request', {
    dimension,
    category: 'engagement',
  });
}

/**
 * Track when user asks a follow-up question
 */
export function trackFollowUpQuestion(questionLength: number): void {
  trackEvent('follow_up_question', {
    question_length: questionLength,
    category: 'engagement',
  });
}

/**
 * Track when user clicks "Explain" on selected text
 */
export function trackExplainRequest(textLength: number): void {
  trackEvent('explain_request', {
    text_length: textLength,
    category: 'engagement',
  });
}

/**
 * Track when user copies feedback as prompt
 */
export function trackCopyPrompt(): void {
  trackEvent('copy_prompt', {
    category: 'engagement',
  });
}

/**
 * Track when user adds another image during conversation
 */
export function trackAddImageDuringSession(): void {
  trackEvent('add_image_session', {
    category: 'engagement',
  });
}

/**
 * Track when user starts over / new session
 */
export function trackStartOver(): void {
  trackEvent('start_over', {
    category: 'navigation',
  });
}

/**
 * Track when user opens image modal
 */
export function trackImageView(imageIndex: number): void {
  trackEvent('image_view', {
    image_index: imageIndex,
    category: 'engagement',
  });
}

/**
 * Track errors (for monitoring)
 */
export function trackError(
  errorType: string,
  errorMessage?: string,
  errorContext?: Record<string, any>
): void {
  trackEvent('error', {
    error_type: errorType,
    error_message: errorMessage,
    ...errorContext,
    category: 'error',
  });
}

/**
 * Track API errors specifically
 */
export function trackApiError(status: number, endpoint: string): void {
  trackEvent('api_error', {
    status_code: status,
    endpoint,
    category: 'error',
  });
}

/**
 * Track dimension toggle
 */
export function trackDimensionToggle(
  dimension: string,
  enabled: boolean
): void {
  trackEvent('dimension_toggle', {
    dimension,
    enabled,
    category: 'settings',
  });
}
