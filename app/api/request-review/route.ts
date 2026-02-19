import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const webhookUrl = process.env.ZAPIER_WEBHOOK_URL;

    if (!webhookUrl) {
      return new Response(
        JSON.stringify({ error: 'Zapier webhook URL not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const {
      reviewerSlackHandle,
      designLink,
      requesterNote,
      aiFeedbackSummary,
      assessmentRatings,
      userContext,
    } = body;

    if (!reviewerSlackHandle) {
      return new Response(
        JSON.stringify({ error: 'Reviewer Slack handle is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const zapierPayload = {
      reviewerSlackHandle,
      designLink: designLink || '',
      requesterNote: requesterNote || '',
      aiFeedbackSummary: aiFeedbackSummary || '',
      assessmentRatings: assessmentRatings || {},
      userContext: userContext || '',
    };

    const zapierResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(zapierPayload),
    });

    if (!zapierResponse.ok) {
      console.error('Zapier webhook failed:', zapierResponse.status);
      return new Response(
        JSON.stringify({ error: 'Failed to send review request' }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Review request error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
