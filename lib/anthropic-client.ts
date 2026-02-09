/**
 * Centralized Anthropic client configuration
 */

import Anthropic from '@anthropic-ai/sdk';

// Verify API key is loaded
const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  console.error('❌ ANTHROPIC_API_KEY is not set in environment variables');
}

// Singleton Anthropic client
export const anthropic = new Anthropic({
  apiKey: apiKey,
});

// Model configuration
export const DEFAULT_MODEL = 'claude-opus-4-20250514';
export const MAX_TOKENS_ANALYSIS = 4096;
export const MAX_TOKENS_FOLLOWUP = 2048;

/**
 * Check if API key is valid
 */
export function isApiKeyValid(): boolean {
  return !!(apiKey && apiKey !== 'your_api_key_here');
}

/**
 * Get standardized error message for API errors
 */
export function getApiErrorMessage(error: any): string {
  if (error?.status === 401) {
    return '🔑 **Authentication Error**: Your API key is invalid.\n\n1. Check that your `.env.local` file contains: `ANTHROPIC_API_KEY=sk-ant-...`\n2. Verify the key is correct at https://console.anthropic.com/\n3. Restart the dev server: `npm run dev`';
  }

  if (error?.status === 429) {
    return '⏱️ **Rate Limit**: Too many requests. Please wait a moment and try again.';
  }

  if (error?.status === 400) {
    if (error?.message?.includes('credit balance')) {
      return `💳 **Billing Issue**: Your Anthropic credit balance is too low.\n\nPlease add credits at: https://console.anthropic.com/settings/billing`;
    }
    return `⚠️ **Bad Request**: ${error?.message || 'Invalid request format'}`;
  }

  if (error?.message?.includes('fetch')) {
    return '🌐 **Network Error**: Unable to reach Anthropic API. Check your internet connection.';
  }

  const errorMsg = error?.message || 'Unknown error';
  return `❌ **Error**: ${errorMsg}\n\nPlease check the console for more details.`;
}
