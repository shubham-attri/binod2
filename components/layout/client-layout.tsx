"use client";

import { Sidebar } from "./sidebar";
import { Toaster } from "sonner";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      <Toaster />
    </>
  );
} 