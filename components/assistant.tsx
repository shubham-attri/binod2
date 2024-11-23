"use client";

import { useState } from "react";
import { Header } from "./layout/header";
import { Sidebar } from "./layout/sidebar";
import { usePathname } from "next/navigation";

interface AssistantProps {
  children: React.ReactNode;
}

export function Assistant({ children }: AssistantProps) {
  const pathname = usePathname();
  const [chatTitle, setChatTitle] = useState("New Research");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  // Get current mode from pathname
  const getMode = () => {
    if (pathname.startsWith("/research")) return "research";
    if (pathname.startsWith("/cases")) return "case";
    return "playground"; // default
  };

  const mode = getMode();
  const showHeader = pathname !== "/"; // Hide header on playground page

  return (
    <div className="flex h-screen">
      <Sidebar 
        isCollapsed={isSidebarCollapsed}
        onCollapsedChange={setIsSidebarCollapsed}
        currentMode={mode}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {showHeader && (
          <Header 
            mode={mode}
            title={chatTitle}
            onTitleChange={setChatTitle}
            onSidebarToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        )}
        <main className="flex-1 overflow-hidden bg-muted/50">
          {children}
        </main>
      </div>
    </div>
  );
}
