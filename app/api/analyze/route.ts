import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt, ALL_DIMENSIONS } from '@/lib/prompts';
import { anthropic, isApiKeyValid, DEFAULT_MODEL, MAX_TOKENS_ANALYSIS } from '@/lib/anthropic-client';
import { detectMediaType } from '@/lib/utils';
import type { DimensionKey, ImageData } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { images, userContext, enabledDimensions } = await request.json() as { 
      images: ImageData[]; 
      userContext?: string;
      enabledDimensions?: DimensionKey[];
    };
    
    // Use all dimensions if none specified
    const dimensions = enabledDimensions && enabledDimensions.length > 0 
      ? enabledDimensions 
      : ALL_DIMENSIONS;

    if (!isApiKeyValid()) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build content array with all images
    const contentParts: Anthropic.Messages.ContentBlockParam[] = [];
    
    images.forEach((img, index) => {
      const mediaType = detectMediaType(img.fullUrl);
      contentParts.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType,
          data: img.base64,
        },
      });
      // Add image label for multiple images
      if (images.length > 1) {
        contentParts.push({
          type: 'text',
          text: `[Image ${index + 1} above]`,
        });
      }
    });
    
    // Build analysis prompt based on number of images and context
    let analysisPrompt: string;
    if (images.length === 1) {
      analysisPrompt = userContext 
        ? `Context: "${userContext}"\n\nPlease analyze this design screenshot with this context in mind.`
        : 'Please analyze this design screenshot and provide detailed feedback.';
    } else {
      analysisPrompt = userContext
        ? `Context: "${userContext}"\n\nPlease analyze these ${images.length} design screenshots with this context in mind. Reference each image by number when providing feedback.`
        : `Please analyze these ${images.length} design screenshots. Reference each image by number when providing feedback, and note any differences or patterns across them.`;
    }
    
    contentParts.push({
      type: 'text',
      text: analysisPrompt,
    });

    // Create streaming response with dynamic system prompt based on enabled dimensions
    const systemPrompt = buildSystemPrompt(dimensions);
    
    const stream = await anthropic.messages.stream({
      model: DEFAULT_MODEL,
      max_tokens: MAX_TOKENS_ANALYSIS,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: contentParts,
        },
      ],
    });

    // Create a ReadableStream to send chunks
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              const chunk = event.delta.text;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Streaming error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

