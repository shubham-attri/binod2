"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Search,
  FileText,
  Settings,
  Briefcase,
  BookOpen,
  BrainCircuit,
  LogOut,
  Menu,
  ChevronRight,
  Plus,
  Globe,
  Bookmark,
  Share2,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface SidebarProps {
  className?: string;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  const mainNavItems: NavItem[] = [
    {
      title: "Research",
      href: "/research",
      icon: <BookOpen className="h-4 w-4" />,
    },
    {
      title: "Cases",
      href: "/cases",
      icon: <Briefcase className="h-4 w-4" />,
    },
    {
      title: "Playground",
      href: "/playground",
      icon: <BrainCircuit className="h-4 w-4" />,
    },
  ];

  const quickActions = [
    {
      icon: <Plus className="h-4 w-4" />,
      label: "New",
      onClick: () => {
        const currentSection = pathname.split("/")[1];
        switch (currentSection) {
          case "research":
            // Clear chat or start new research
            break;
          case "cases":
            router.push("/cases/new");
            break;
          case "playground":
            // Clear playground state
            break;
          default:
            break;
        }
      },
    },
    {
      icon: <Search className="h-4 w-4" />,
      label: "Search",
      onClick: () => {
        const currentSection = pathname.split("/")[1];
        router.push(`/${currentSection}/search`);
      },
    },
    {
      icon: <Globe className="h-4 w-4" />,
      label: "Explore",
      onClick: () => {
        const currentSection = pathname.split("/")[1];
        router.push(`/${currentSection}/explore`);
      },
    },
  ];

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-12 items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-2">
          {!isCollapsed && <h2 className="text-lg font-semibold">Legal AI</h2>}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8"
        >
          <ChevronRight className={cn("h-4 w-4 transition-transform", !isCollapsed && "rotate-180")} />
        </Button>
      </div>

      <div className="flex-1">
        <div className="space-y-2 p-2">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="ghost"
              size="icon"
              className={cn(
                "w-full",
                !isCollapsed && "justify-start px-2",
                isCollapsed && "h-9 w-9"
              )}
              onClick={action.onClick}
            >
              {action.icon}
              {!isCollapsed && <span className="ml-2">{action.label}</span>}
            </Button>
          ))}
        </div>

        <div className="mt-2 px-3">
          <div className="flex items-center justify-between">
            {!isCollapsed && <h3 className="text-sm font-medium">Navigation</h3>}
          </div>
        </div>

        <ScrollArea className="flex-1 p-2">
          <div className="space-y-2">
            {mainNavItems.map((item) => (
              <Button
                key={item.href}
                variant={pathname.startsWith(item.href) ? "secondary" : "ghost"}
                className={cn(
                  "w-full",
                  !isCollapsed && "justify-start px-2",
                  isCollapsed && "h-9 w-9"
                )}
                onClick={() => {
                  router.push(item.href);
                  setIsMobileOpen(false);
                }}
              >
                {item.icon}
                {!isCollapsed && <span className="ml-2">{item.title}</span>}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="mt-auto border-t p-2">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "w-full",
              !isCollapsed && "justify-start px-2",
              isCollapsed && "h-9 w-9"
            )}
            onClick={() => router.push("/settings")}
          >
            <Settings className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">Settings</span>}
          </Button>
          {!isCollapsed && (
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Share2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed left-4 top-4 z-50"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-[270px]">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      <aside
        className={cn(
          "hidden lg:flex flex-col border-r bg-background transition-all duration-300",
          isCollapsed ? "w-[52px]" : "w-[270px]",
          className
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
} 