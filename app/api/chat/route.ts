import { NextRequest } from "next/server";
import { StreamingTextResponse } from "ai";

// Dummy function to detect document creation intent
function shouldCreateDocument(message: string): boolean {
  const documentTriggers = [
    "create a document",
    "make a document",
    "write a document",
    "draft a",
    "prepare a",
    "generate a",
  ];
  return documentTriggers.some(trigger => 
    message.toLowerCase().includes(trigger)
  );
}

// Dummy function to detect document update intent
function shouldUpdateDocument(message: string): boolean {
  const updateTriggers = [
    "update the document",
    "modify the document",
    "change the document",
    "edit the document",
  ];
  return updateTriggers.some(trigger => 
    message.toLowerCase().includes(trigger)
  );
}

export async function POST(req: NextRequest) {
  const { messages, documentId } = await req.json();
  
  // Get the last user message
  const lastMessage = messages[messages.length - 1];
  const isDocumentRequest = shouldCreateDocument(lastMessage.content);
  const isUpdateRequest = shouldUpdateDocument(lastMessage.content);

  // Create headers for special actions
  const headers = new Headers();
  
  if (isDocumentRequest) {
    headers.set("x-document-created", "true");
    headers.set("x-document-content", "# New Document\n\nThis is a new document created based on your request.");
  }

  if (isUpdateRequest && documentId) {
    headers.set("x-document-updated", "true");
    headers.set("x-document-content", "Updated content based on your request.");
  }

  // Create a stream
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const encoder = new TextEncoder();

        const sendChunk = (text: string) => {
          controller.enqueue(encoder.encode(text));
        };

        if (isDocumentRequest) {
          sendChunk("I'll help you create a document. ");
          await new Promise(resolve => setTimeout(resolve, 500));
          sendChunk("I've created a new document based on your request. ");
          await new Promise(resolve => setTimeout(resolve, 500));
          sendChunk("You can now edit it in the document panel.");
        } else if (isUpdateRequest) {
          sendChunk("I'll help you update the document. ");
          await new Promise(resolve => setTimeout(resolve, 500));
          sendChunk("I've updated the document based on your request. ");
          await new Promise(resolve => setTimeout(resolve, 500));
          sendChunk("You can review the changes in the document panel.");
        } else {
          // Regular chat response
          sendChunk("I understand you're asking about ");
          await new Promise(resolve => setTimeout(resolve, 300));
          sendChunk(lastMessage.content);
          await new Promise(resolve => setTimeout(resolve, 500));
          sendChunk(". Let me help you with that. ");
          await new Promise(resolve => setTimeout(resolve, 500));
          sendChunk("Here's a detailed response: ");
          await new Promise(resolve => setTimeout(resolve, 500));
          sendChunk("This is a simulated AI response that demonstrates streaming capabilities. ");
          await new Promise(resolve => setTimeout(resolve, 500));
          sendChunk("In a real implementation, this would be powered by LangChain and a proper LLM.");
        }

        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new StreamingTextResponse(stream, { headers });
} 