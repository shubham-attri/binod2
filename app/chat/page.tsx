"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChatInterface } from "@/components/ChatInterface";

export default function ChatPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Check for initial query
    const initialQuery = sessionStorage.getItem("initialQuery");
    if (!initialQuery) {
      // If no query, redirect back to home
      router.push("/");
    }
  }, [router]);

  return <ChatInterface />;
} 