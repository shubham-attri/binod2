"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const redirect = async () => {
      try {
        await router.replace("/research");
      } catch (error) {
        console.error("Navigation error:", error);
        // Fallback to window.location if router fails
        window.location.href = "/research";
      }
    };

    redirect();
  }, []);

  // Show loading state while redirecting
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
}
