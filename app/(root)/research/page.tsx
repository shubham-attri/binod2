"use client";

import { ResearchMode } from "@/components/research/research-mode";
import { ErrorBoundary } from "react-error-boundary";

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="text-sm text-gray-500">{error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export default function ResearchPage() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ResearchMode />
    </ErrorBoundary>
  );
} 