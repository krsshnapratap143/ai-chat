import Groq from "groq-sdk";

// Validate API key early
if (!process.env.GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY environment variable is not set");
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// List of valid Grok models (as of August 17, 2025)
const VALID_MODELS = [
  "llama-3.3-70b-versatile",
  "mixtral-8x7b-32768",
  "grok-32k",
  "llama-3.1-8b-instant",
  "gemma2-9b-it",
];

export async function POST(request) {
  try {
    // Parse and validate request body
    let message;
    try {
      const body = await request.json();
      message = body.message;
      if (!message || typeof message !== "string") {
        return new Response(
          JSON.stringify({ error: "Invalid or missing 'message' field in request body" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    } catch (parseError) {
      console.error("JSON parsing error:", {
        message: parseError.message,
        stack: parseError.stack,
      });
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate model without reassignment issue
    let model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
    if (!VALID_MODELS.includes(model)) {
      console.warn(`Invalid model: ${model}. Falling back to llama-3.3-70b-versatile`);
      model = "llama-3.3-70b-versatile";
    }

    // Create streaming completion with Grok API
    const stream = await groq.chat.completions.create({
      model,
      messages: [{ role: "user", content: message }],
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
              );
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n")); // Signal end of stream
          controller.close();
        } catch (streamError) {
          console.error("Stream error:", {
            message: streamError.message,
            stack: streamError.stack,
            name: streamError.name,
          });
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                error: "Stream interrupted",
                details: streamError.message.includes("model_decommissioned")
                  ? "The requested model is no longer supported. Please use a different model."
                  : streamError.message || "Unknown streaming error",
              })}\n\n`
            )
          );
          controller.close();
        }
      },
      cancel() {
        console.log("Client disconnected, stream cancelled");
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Request processing error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    let errorDetails = error.message || "Unknown error";
    if (error.message.includes("model_decommissioned")) {
      errorDetails = "The requested model is no longer supported. Please use 'llama-3.3-70b-versatile' or another valid model.";
    }
    return new Response(
      JSON.stringify({
        error: "Failed to process request",
        details: errorDetails,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}