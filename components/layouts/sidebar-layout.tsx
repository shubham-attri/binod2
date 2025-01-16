"use client";

import { SidebarBody, SidebarProvider } from "@/components/ui/sidebar";
import { Sidebar } from "@/components/ui/sidebar";
export function SidebarLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </SidebarProvider>
  );
} 