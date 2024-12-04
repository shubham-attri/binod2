"use client";

import { ResearchMode } from "@/components/research/research-mode";
import { ErrorBoundary } from "react-error-boundary";
import { ErrorFallback } from "@/components/error-fallback";

export default function ResearchPage() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ResearchMode />
    </ErrorBoundary>
  );
} 