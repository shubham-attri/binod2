"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Menu, ChevronRight } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DocumentPanel } from "../case/document-panel";
import { cn } from "@/lib/utils";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { usePathname } from "next/navigation";

interface HeaderProps {
  className?: string;
  mode: "research" | "case";
  title: string;
  onTitleChange?: (title: string) => void;
  onSidebarToggle: () => void;
}

export function Header({ 
  className, 
  mode, 
  title, 
  onTitleChange,
  onSidebarToggle 
}: HeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  const pathname = usePathname();
  const showBreadcrumbs = pathname.startsWith("/research") || pathname.startsWith("/cases");
  const showHeader = !pathname.startsWith("/vault");

  if (!showHeader) {
    return null;
  }

  const handleTitleSave = () => {
    if (onTitleChange && tempTitle.trim()) {
      onTitleChange(tempTitle);
    }
    setIsEditingTitle(false);
  };

  return (
    <header className={cn(
      "sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      className
    )}>
      <div className="flex h-14 items-center px-6">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onSidebarToggle}
          className="mr-4"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        {showBreadcrumbs ? (
          <div className="flex-1">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink 
                    href="#"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    {mode === "research" ? "Research" : "Cases"}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  {isEditingTitle ? (
                    <div className="flex items-center">
                      <Input
                        className="h-7 w-[200px]"
                        value={tempTitle}
                        onChange={(e) => setTempTitle(e.target.value)}
                        onBlur={handleTitleSave}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleTitleSave();
                          } else if (e.key === "Escape") {
                            setTempTitle(title);
                            setIsEditingTitle(false);
                          }
                        }}
                        placeholder="Enter title..."
                        autoFocus
                      />
                    </div>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="h-auto p-0 font-normal hover:bg-transparent"
                        >
                          <BreadcrumbPage className="text-sm font-medium">
                            {title}
                          </BreadcrumbPage>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => setIsEditingTitle(true)}>
                          Rename
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        ) : (
          <div className="flex-1">
            <h1 className="text-lg font-semibold">
              Chat History
            </h1>
          </div>
        )}

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto gap-2">
              <FileText className="h-5 w-5" />
              Documents
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[600px] sm:w-[800px] p-0">
            <DocumentPanel />
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
} 