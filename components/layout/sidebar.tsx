"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  FileText,
  History,
  Lock,
  ChevronRight,
  User,
  MessageSquare,
  Briefcase,
  PanelLeftClose,
  PanelLeftOpen,
  ZapIcon,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { getThreads } from "@/lib/chat-service";

interface SidebarProps {
  isCollapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  currentMode: "playground" | "research" | "case";
}

export function Sidebar({ isCollapsed, onCollapsedChange, currentMode }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [openPlayground, setOpenPlayground] = useState(true);
  const [openHistory, setOpenHistory] = useState(false);

  const isActive = (path: string) => pathname === path;

  const recentChats = getThreads().slice(0, 4).map(thread => ({
    id: thread.id,
    title: thread.title,
    timestamp: thread.createdAt
  }));

  return (
    <div
      className={cn(
        "flex flex-col h-full border-r bg-background",
        isCollapsed ? "w-16" : "w-72"
      )}
    >
      <div className="h-14 flex items-center justify-center border-b">
        <Button
          variant="ghost"
          className={cn(
            "w-full h-full",
            isCollapsed ? "justify-center" : "justify-start px-4",
            pathname === "/" && "bg-accent"
          )}
          onClick={() => router.push('/')}
        >
          <ZapIcon className="h-6 w-6 " />
          {!isCollapsed && <span className="ml-2 font-semibold">Legal AI</span>}
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-4 py-4">
          <Collapsible
            open={openPlayground}
            onOpenChange={setOpenPlayground}
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-between",
                  isCollapsed && "justify-center",
                  currentMode === "playground" && "bg-accent"
                )}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 " />
                  {!isCollapsed && <span>AI Playground</span>}
                </div>
                {!isCollapsed && (
                  <ChevronRight
                    className={cn(
                      "h-5 w-5 transition-transform",
                      openPlayground && "rotate-90"
                    )}
                  />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 mt-1">
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start pl-8",
                  isCollapsed && "justify-center pl-0",
                  currentMode === "research" && "bg-accent"
                )}
                asChild
              >
                <Link href="/research">
                  <MessageSquare className="h-5 w-5" />
                  {!isCollapsed && <span className="ml-2">Research Mode</span>}
                </Link>
              </Button>

              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start pl-8",
                  isCollapsed && "justify-center pl-0",
                  currentMode === "case" && "bg-accent"
                )}
                asChild
              >
                <Link href="/cases">
                  <Briefcase className="h-5 w-5" />
                  {!isCollapsed && <span className="ml-2">Case Mode</span>}
                </Link>
              </Button>
            </CollapsibleContent>
          </Collapsible>

          {/* <Separator /> */}

          <Button
            variant="ghost"
            className={cn("w-full justify-start", isCollapsed && "justify-center")}
            asChild
          >
            <Link href="/vault">
              <Lock className="h-5 w-5" />
              {!isCollapsed && <span className="ml-2">Vault</span>}
            </Link>
          </Button>

          <Collapsible
            open={openHistory && !isCollapsed}
            onOpenChange={setOpenHistory}
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-between",
                  isCollapsed && "justify-center"
                )}
              >
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  {!isCollapsed && <span>Recent Chats</span>}
                </div>
                {!isCollapsed && (
                  <ChevronRight
                    className={cn(
                      "h-5 w-5 transition-transform",
                      openHistory && "rotate-90"
                    )}
                  />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1">
              {recentChats.map((chat) => (
                <Button
                  key={chat.id}
                  variant="ghost"
                  className="w-full justify-start pl-8 text-sm truncate"
                  asChild
                >
                  <Link href={`/chat/${chat.id}`}>
                    <FileText className="h-4 w-4 mr-2" />
                    {chat.title}
                  </Link>
                </Button>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>

      <div className="border-t p-3 space-y-2">
        <Button
          variant="ghost"
          className="w-full flex items-center justify-center gap-2"
          onClick={() => onCollapsedChange(!isCollapsed)}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-5 w-5" />
          ) : (
            <>
              <PanelLeftClose className="h-5 w-5" />
              <span>Collapse</span>
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          className={cn("w-full justify-start", isCollapsed && "justify-center")}
        >
          <User className="h-5 w-5" />
          {!isCollapsed && <span className="ml-2">Profile</span>}
        </Button>
      </div>
    </div>
  );
} 