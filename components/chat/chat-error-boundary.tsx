"use client";

import { ErrorBoundary } from "react-error-boundary";

function ChatErrorFallback({ error }: { error: Error }) {
  console.error('Chat Error:', error);
  return (
    <div className="p-4 text-red-500">
      <h3>Something went wrong with the chat</h3>
      <pre>{error.message}</pre>
    </div>
  );
}

export function ChatWithErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary FallbackComponent={ChatErrorFallback}>
      {children}
    </ErrorBoundary>
  );
} 