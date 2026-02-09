'use server';

import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt, getFollowUpSystemPrompt } from '@/lib/prompts';
import { anthropic, isApiKeyValid, getApiErrorMessage, DEFAULT_MODEL, MAX_TOKENS_ANALYSIS, MAX_TOKENS_FOLLOWUP } from '@/lib/anthropic-client';
import { detectMediaType } from '@/lib/utils';

/**
 * Analyze a design screenshot and provide initial comprehensive feedback
 */
export async function analyzeDesign(imageBase64: string, fullDataUrl?: string, userContext?: string): Promise<string> {
  try {
    // Check API key
    if (!isApiKeyValid()) {
      console.error('❌ Invalid API key detected');
      return '⚠️ API key is not configured. Please add your Anthropic API key to .env.local file.\n\nThe file should contain:\n```\nANTHROPIC_API_KEY=sk-ant-your-key-here\n```\n\nThen restart the dev server with: npm run dev';
    }

    // Detect the correct media type
    const mediaType = fullDataUrl ? detectMediaType(fullDataUrl) : 'image/jpeg';
    
    console.log('📸 Analyzing design...');
    console.log('   Media type:', mediaType);
    console.log('   Image size:', imageBase64.length, 'characters');
    if (userContext) {
      console.log('   Context:', userContext);
    }

    // Build the analysis prompt with optional context
    let analysisPrompt = 'Please analyze this design screenshot and provide detailed feedback following the structure outlined in your system prompt.';
    if (userContext) {
      analysisPrompt = `Context about this design: "${userContext}"\n\nPlease analyze this design screenshot with this context in mind, and provide detailed feedback following the structure outlined in your system prompt.`;
    }

    const message = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: MAX_TOKENS_ANALYSIS,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: analysisPrompt,
            },
          ],
        },
      ],
      system: buildSystemPrompt(),
    });

    console.log('✅ Analysis complete');

    const textContent = message.content.find((block) => block.type === 'text');
    if (textContent && textContent.type === 'text') {
      return textContent.text;
    }

    return 'Unable to analyze the design. Please try again.';
  } catch (error: any) {
    console.error('❌ Error analyzing design:', error);
    return getApiErrorMessage(error);
  }
}

/**
 * Answer follow-up questions about a design
 */
export async function askFollowUpQuestion(
  imageBase64: string,
  fullDataUrl: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  newQuestion: string
): Promise<string> {
  try {
    // Check API key
    if (!isApiKeyValid()) {
      return '⚠️ API key is not configured properly.';
    }

    // Detect the correct media type
    const mediaType = detectMediaType(fullDataUrl);
    
    console.log('💬 Asking follow-up question...');

    // Build the conversation with the image in the first message
    const messages: Anthropic.MessageParam[] = [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: conversationHistory[0]?.content || 'Please analyze this design.',
          },
        ],
      },
    ];

    // Add the rest of the conversation history (skip the first message as we already added it)
    for (let i = 1; i < conversationHistory.length; i++) {
      const msg = conversationHistory[i];
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    // Add the new question
    messages.push({
      role: 'user',
      content: newQuestion,
    });

    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: MAX_TOKENS_FOLLOWUP,
      messages,
      system: getFollowUpSystemPrompt(),
    });

    console.log('✅ Follow-up answered');

    const textContent = response.content.find((block) => block.type === 'text');
    if (textContent && textContent.type === 'text') {
      return textContent.text;
    }

    return 'Unable to process your question. Please try again.';
  } catch (error: any) {
    console.error('❌ Error answering follow-up:', error);
    return getApiErrorMessage(error);
  }
}
