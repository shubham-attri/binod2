"use client";

import { Button } from "@/components/ui/button";

export function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="text-sm text-gray-500">{error.message}</p>
        <Button
          onClick={() => window.location.reload()}
          className="mt-4"
        >
          Try again
        </Button>
      </div>
    </div>
  );
} 