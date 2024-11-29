import { NextRequest } from "next/server";
import { StreamingTextResponse } from "ai";

const BACKEND_URL = process.env.NODE_ENV === "production" 
  ? "http://backend:8000"  // Docker service name
  : "http://localhost:8000"; // Local development

export async function POST(req: NextRequest) {
  try {
    const { query, documentId, threadId } = await req.json();

    // Forward request to FastAPI backend
    const response = await fetch(`${BACKEND_URL}/api/v1/chat/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Forward authorization header if present
        ...(req.headers.get("authorization") 
          ? { "Authorization": req.headers.get("authorization")! }
          : {})
      },
      body: JSON.stringify({
        query,
        document_id: documentId,
        thread_id: threadId
      })
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status ${response.status}`);
    }

    // Return streaming response
    return new StreamingTextResponse(response.body!);

  } catch (error) {
    console.error("Error in chat route:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
} 