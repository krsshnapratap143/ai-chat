import { NextResponse } from 'next/server';

// Type for the request body
interface ChatRequest {
  message: string;
}

// Type for Groq API response (matches OpenAI format)
interface GroqResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

export async function POST(request: Request) {
  try {
    // Verify API key
    if (!process.env.GROQ_API_KEY) {
      console.error('GROQ_API_KEY is not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Parse and validate request body
    const { message } = (await request.json()) as ChatRequest;
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid or missing message in request body' },
        { status: 400 }
      );
    }

    // Call Groq API
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [{ role: "user", content: message }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`);
    }

    const completion = (await response.json()) as GroqResponse;

    return NextResponse.json({
      response: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error('Error in /api/chat:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}