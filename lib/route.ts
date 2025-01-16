import { NextResponse } from 'next/server';

const BACKEND_URL = 'http://localhost:8000';

export async function handleChatRequest(request: Request) {
  try {
    const body = await request.json();
    const { content, fileUrl, quote } = body;
    
    console.log('Sending to backend:', { content, fileUrl, quote });
    
    const response = await fetch(`${BACKEND_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        content,
        file_Url: fileUrl,
        quote
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`Backend request failed: ${response.status}`);
    }

    const readable = response.body;
    if (!readable) {
      throw new Error('No response body');
    }

    return new NextResponse(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 