import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ 
      error: 'API key not found',
      success: false 
    });
  }

  try {
    const anthropic = new Anthropic({ apiKey });
    
    // Try multiple models to see which one works
    const modelsToTry = [
      'claude-sonnet-4-5-20250514',  // Latest Sonnet 4.5
      'claude-3-5-sonnet-20241022',  // Claude 3.5 Sonnet v2 (Oct 2024)
      'claude-3-5-sonnet-20240620',  // Claude 3.5 Sonnet v1 (June 2024)
      'claude-3-opus-20240229',      // Claude 3 Opus
      'claude-3-sonnet-20240229',    // Claude 3 Sonnet
      'claude-3-haiku-20240307'      // Claude 3 Haiku
    ];
    
    let successModel = null;
    let lastError = null;
    
    for (const model of modelsToTry) {
      try {
        const message = await anthropic.messages.create({
          model: model,
          max_tokens: 50,
          messages: [{
            role: 'user',
            content: 'Hi'
          }]
        });
        
        successModel = model;
        break;
      } catch (err: any) {
        lastError = err;
        continue;
      }
    }
    
    if (successModel) {
      return NextResponse.json({ 
        success: true,
        message: 'Found working model!',
        workingModel: successModel,
        note: 'Update your app/actions.ts to use this model'
      });
    } else {
      return NextResponse.json({ 
        success: false,
        error: 'No working models found',
        lastError: lastError?.message,
        modelsAttempted: modelsToTry
      }, { status: 500 });
    }
    
  } catch (error: any) {
    return NextResponse.json({ 
      success: false,
      error: error.message,
      errorType: error.constructor.name,
      status: error.status,
      statusText: error.statusText,
      headers: error.headers,
      fullError: JSON.stringify(error, null, 2)
    }, { status: 500 });
  }
}

